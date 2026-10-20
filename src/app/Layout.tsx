import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { BookOpen, FlaskConical, House, Monitor, Moon, Sun, Wind, Wrench } from 'lucide-react'
import { useProgress, type Theme } from '../lib/progress'
import { Logo } from '../components/ui/Logo'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/lab', label: 'Sim Lab', icon: FlaskConical },
  { to: '/toolbox', label: 'Toolbox', icon: Wrench },
  { to: '/weather', label: 'Weather', icon: Wind },
]

function useThemeClass(theme: Theme) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

function ThemeSwitch({ compact = false }: { compact?: boolean }) {
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

export function Layout() {
  const theme = useProgress((s) => s.theme)
  useThemeClass(theme)
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="min-h-dvh md:pl-60">
      {/* Sidebar (tablet & desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface/80 px-4 py-6 backdrop-blur md:flex">
        <NavLink to="/" className="mb-8 px-2">
          <Logo />
        </NavLink>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                  isActive ? 'bg-sea-soft text-sea' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <ThemeSwitch />
          <p className="px-2 text-xs leading-relaxed text-muted">
            Study companion for Royal Perth Yacht Club keelboat courses. Always follow your instructor.
          </p>
        </div>
      </aside>

      {/* Top bar (phone) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:hidden">
        <NavLink to="/">
          <Logo small />
        </NavLink>
        <ThemeSwitch compact />
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 md:pt-8 md:pb-16 lg:px-10">
        <Outlet />
      </main>

      {/* Bottom tabs (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-sea' : 'text-muted'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
