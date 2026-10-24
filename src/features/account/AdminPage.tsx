import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, RotateCcw, Trash2, UserPlus } from 'lucide-react'
import { LESSONS } from '../../content/courses'
import { createUser, listUsers, removeUser, resetProgress, updateUser, type ManagedUser } from '../../lib/admin'
import { useSession } from '../../lib/session'
import { Card, PageHeader } from '../../components/ui/blocks'
import { Button, Toggle } from '../../components/ui/controls'
import { Avatar } from '../../components/ui/Avatar'
import { NotFound } from '../../app/NotFound'
import { inputCls } from './LoginPage'

type Msg = { ok: boolean; text: string } | null

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null
  return <p className={`text-sm font-medium ${msg.ok ? 'text-starboard' : 'text-port'}`}>{msg.text}</p>
}

/** Runs an admin action, reporting success or the server's error message. */
function useAction(onDone: () => void) {
  const [msg, setMsg] = useState<Msg>(null)
  const [busy, setBusy] = useState(false)
  const run = async (action: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try {
      await action()
      setMsg({ ok: true, text: ok })
      onDone()
      return true
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
      return false
    } finally {
      setBusy(false)
    }
  }
  return { msg, busy, run }
}

function Badge({ children, tone = 'bg-surface-2 text-muted' }: { children: ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${tone}`}>{children}</span>
}

function AddUser({ onAdded }: { onAdded: () => void }) {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [admin, setAdmin] = useState(false)
  const { msg, busy, run } = useAction(onAdded)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (await run(() => createUser({ username, name, password, admin }), `Added ${username.trim().toLowerCase()}. Share their password with them.`)) {
      setUsername('')
      setName('')
      setPassword('')
      setAdmin(false)
    }
  }

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">Add a user</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={inputCls} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
          <input className={inputCls} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={admin} onChange={setAdmin} label="Admin" />
          <button type="submit" disabled={busy} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sea px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40">
            <UserPlus size={16} /> Add user
          </button>
        </div>
        <Note msg={msg} />
      </form>
    </Card>
  )
}

function UserRow({ user, isMe, onChange }: { user: ManagedUser; isMe: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [password, setPassword] = useState('')
  const { msg, busy, run } = useAction(onChange)

  const rename = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const updated = await updateUser(user.username, { name })
      if (isMe) useSession.setState((s) => ({ user: { ...s.user!, name: updated.name } }))
    }, 'Name saved.')
  }
  const setNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (await run(() => updateUser(user.username, { password }), `Password changed — ${isMe ? 'your' : 'their'} other devices are signed out.`)) setPassword('')
  }

  return (
    <li className="border-b border-line last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2" aria-expanded={open}>
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{user.name}</span>
            {user.admin && <Badge tone="bg-sea-soft text-sea">Admin</Badge>}
            {isMe && <Badge>You</Badge>}
          </div>
          <div className="text-sm text-muted">
            @{user.username} · {user.completed}/{LESSONS.length} lessons
            {user.created && <span className="hidden sm:inline"> · added {new Date(user.created).toLocaleDateString()}</span>}
          </div>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-4 px-4 pt-1 pb-5 sm:pl-16">
          <form onSubmit={rename} className="flex gap-2">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
            <Button variant="soft" disabled={busy || name.trim() === user.name}>Save</Button>
          </form>
          <form onSubmit={setNewPassword} className="flex gap-2">
            <input className={inputCls} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
            <Button variant="soft" disabled={busy}>Set</Button>
          </form>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {isMe ? (
              <span className="text-sm text-muted">You can’t remove your own admin rights or account.</span>
            ) : (
              <Toggle checked={user.admin} onChange={(admin) => run(() => updateUser(user.username, { admin }), admin ? 'Now an admin.' : 'No longer an admin.')} label="Admin" />
            )}
            <div className="ml-auto flex gap-1">
              <Button
                variant="ghost"
                disabled={busy || user.completed === 0}
                onClick={() => confirm(`Clear all of ${user.name}’s progress?`) && run(() => resetProgress(user.username), 'Progress cleared.')}
              >
                <RotateCcw size={14} /> Reset progress
              </Button>
              {!isMe && (
                <Button
                  variant="ghost"
                  className="text-port hover:text-port"
                  disabled={busy}
                  onClick={() => confirm(`Remove ${user.name} and all their progress? This can’t be undone.`) && run(() => removeUser(user.username), 'Removed.')}
                >
                  <Trash2 size={14} /> Remove
                </Button>
              )}
            </div>
          </div>
          <Note msg={msg} />
        </div>
      )}
    </li>
  )
}

export function AdminPage() {
  const me = useSession((s) => s.user)!
  const [users, setUsers] = useState<ManagedUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    listUsers().then(setUsers, (e: Error) => setError(e.message))
  }, [])
  useEffect(() => {
    if (me.admin) load()
  }, [me.admin, load])

  if (!me.admin) return <NotFound />
  return (
    <>
      <PageHeader eyebrow="Admin" title="Users">
        Add people, reset forgotten passwords and keep an eye on everyone’s progress.
      </PageHeader>
      <AddUser onAdded={load} />
      {error && <p className="mb-3 text-sm font-medium text-port">{error}</p>}
      {users === null ? (
        !error && <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {[...users]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((u) => (
                <UserRow key={u.username} user={u} isMe={u.username === me.username} onChange={load} />
              ))}
          </ul>
        </Card>
      )}
    </>
  )
}
