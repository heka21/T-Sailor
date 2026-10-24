import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { useSession } from '../../lib/session'
import { Logo } from '../../components/ui/Logo'

export const inputCls =
  'w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-sea focus:bg-surface'

export function LoginPage() {
  const login = useSession((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(await login(username, password))
    setBusy(false)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-[#0b2545] via-[#0f3b5f] to-[#0e8f9b] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="mb-5 text-2xl font-bold">Sign in</h1>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">Username</span>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="mb-3 text-sm font-medium text-port">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea px-4 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          <LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
