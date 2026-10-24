import { api, type User } from './session'

/** A row on the Admin page. */
export interface ManagedUser extends User {
  created?: string
  /** number of lessons completed */
  completed: number
}

const at = (username: string) => `/users/${encodeURIComponent(username)}`

export const listUsers = () => api<ManagedUser[]>('/users')

export const createUser = (u: { username: string; name: string; password: string; admin: boolean }) =>
  api<User>('/users', { method: 'POST', body: JSON.stringify(u) })

export const updateUser = (username: string, patch: { name?: string; password?: string; admin?: boolean }) =>
  api<User>(at(username), { method: 'PATCH', body: JSON.stringify(patch) })

export const removeUser = (username: string) => api(at(username), { method: 'DELETE' })

export const resetProgress = (username: string) => api(`${at(username)}/progress`, { method: 'DELETE' })
