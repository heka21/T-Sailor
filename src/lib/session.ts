import { create } from 'zustand'
import { EMPTY_PROGRESS, pickProgress, useProgress, type ProgressData } from './progress'

export interface User {
  username: string
  name: string
  admin: boolean
}

interface SessionState {
  status: 'loading' | 'signed-out' | 'signed-in'
  user?: User
  login: (username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

/** Pre-accounts builds kept progress in this browser's localStorage. */
const LEGACY_KEY = 't-sailor-progress'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (res.status === 401 && path !== '/login') useSession.setState({ status: 'signed-out', user: undefined })
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.statusText)
  return (res.status === 204 ? undefined : await res.json()) as T
}

// --- progress sync: load once on sign-in, then save (debounced) whenever it changes.
let unsubscribe: (() => void) | undefined
let pending: ReturnType<typeof setTimeout> | undefined

function save(keepalive = false) {
  clearTimeout(pending)
  pending = undefined
  return api('/progress', { method: 'PUT', body: JSON.stringify(pickProgress(useProgress.getState())), keepalive }).catch(() => {})
}

function takeLegacyProgress(): Partial<ProgressData> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    localStorage.removeItem(LEGACY_KEY)
    return raw ? JSON.parse(raw).state : null
  } catch {
    return null
  }
}

async function attach(user: User) {
  unsubscribe?.()
  let data = await api<ProgressData | null>('/progress')
  const legacy = data ? null : takeLegacyProgress()
  if (legacy) data = { ...EMPTY_PROGRESS, ...pickProgress({ ...EMPTY_PROGRESS, ...legacy }) }
  useProgress.setState({ ...EMPTY_PROGRESS, ...data })
  if (legacy) save()
  unsubscribe = useProgress.subscribe(() => {
    clearTimeout(pending)
    pending = setTimeout(save, 500)
  })
  useSession.setState({ status: 'signed-in', user })
}

function detach() {
  unsubscribe?.()
  unsubscribe = undefined
  clearTimeout(pending)
  pending = undefined
  useProgress.setState(EMPTY_PROGRESS)
}

addEventListener('pagehide', () => pending && save(true))

export const useSession = create<SessionState>()(() => ({
  status: 'loading',
  login: async (username, password) => {
    try {
      const user = await api<User>('/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      await attach(user)
      return null
    } catch (e) {
      return (e as Error).message
    }
  },
  logout: async () => {
    if (pending) await save()
    detach()
    await api('/logout', { method: 'POST' }).catch(() => {})
    useSession.setState({ status: 'signed-out', user: undefined })
  },
}))

export function changePassword(current: string, next: string) {
  return api('/password', { method: 'POST', body: JSON.stringify({ current, next }) })
}

/** Restore the session from the cookie on page load. */
export function initSession() {
  api<User>('/me')
    .then(attach)
    .catch(() => useSession.setState({ status: 'signed-out' }))
}
