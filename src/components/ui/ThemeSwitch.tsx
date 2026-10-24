import { Monitor, Moon, Sun } from 'lucide-react'
import { useProgress, type Theme } from '../../lib/progress'

export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const theme = useProgress((s) => s.theme)
  const setTheme = useProgress((s) => s.setTheme)
  const opts: { v: Theme; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Light' },
    { v: 'system', icon: Monitor, label: 'System' },
    { v: 'dark', icon: Moon, label: 'Dark' },
  ]
  return (
    <div className={`flex rounded-full bg-surface-2 p-1 ${compact ? '' : 'w-full'}`} role="radiogroup" aria-label="Theme">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          role="radio"
          aria-checked={theme === v}
          aria-label={label}
          onClick={() => setTheme(v)}
          className={`flex flex-1 items-center justify-center rounded-full px-2.5 py-1.5 transition ${
            theme === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}

const CYCLE: Record<Theme, { next: Theme; icon: typeof Sun; label: string }> = {
  light: { next: 'dark', icon: Sun, label: 'Light' },
  dark: { next: 'system', icon: Moon, label: 'Dark' },
  system: { next: 'light', icon: Monitor, label: 'System' },
}

/** One icon showing the current theme; each click moves to the next (light → dark → system). */
export function ThemeButton({ className = '' }: { className?: string }) {
  const theme = useProgress((s) => s.theme)
  const setTheme = useProgress((s) => s.setTheme)
  const { next, icon: Icon, label } = CYCLE[theme]
  const title = `Theme: ${label} — switch to ${CYCLE[next].label}`
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={title}
      title={title}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <Icon size={18} />
    </button>
  )
}
