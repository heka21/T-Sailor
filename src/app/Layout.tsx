import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { BookOpen, FlaskConical, House, PanelLeftClose, PanelLeftOpen, ShieldCheck, Wind, Wrench } from 'lucide-react'
import { useProgress, type Theme } from '../lib/progress'
import { useSession } from '../lib/session'
import { Logo } from '../components/ui/Logo'
import { UserMenu } from '../components/ui/UserMenu'
import { ThemeButton } from '../components/ui/ThemeSwitch'
import { SearchBox, SearchButton } from '../components/ui/Search'
import { LoginPage } from '../features/account/LoginPage'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/lab', label: 'Sim Lab', icon: FlaskConical },
  { to: '/toolbox', label: 'Toolbox', icon: Wrench },
  { to: '/weather', label: 'Weather', icon: Wind },
]

// Sidebar only — on phones admins reach it from the account menu.
const ADMIN_NAV = { to: '/admin', label: 'Admin', icon: ShieldCheck, end: false }

/** Collapsed/expanded sidebar — a per-device preference, so it lives in localStorage rather than the account. */
function useSidebarCollapsed() {
  const KEY = 't-sailor-sidebar-collapsed'
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? '0' : '1')
      } catch {
        /* storage unavailable — still toggles for this visit */
      }
      return !c
    })
  return [collapsed, toggle] as const
}

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

export function Layout() {
  const theme = useProgress((s) => s.theme)
  useThemeClass(theme)
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    if (!hash) return window.scrollTo(0, 0)
    // e.g. a search result pointing at a lesson section — wait a tick for the page to render
    const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [pathname, hash, hash ? key : ''])
  const status = useSession((s) => s.status)
  const user = useSession((s) => s.user)
  const [collapsed, toggleCollapsed] = useSidebarCollapsed()

  if (status === 'loading') return <div className="min-h-dvh" />
  if (status === 'signed-out' || !user) return <LoginPage />

  return (
    <div className={`min-h-dvh transition-[padding] duration-200 ${collapsed ? 'md:pl-[72px]' : 'md:pl-60'}`}>
      {/* Sidebar (tablet & desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface/80 pt-3 pb-6 backdrop-blur transition-[width] duration-200 md:flex ${
          collapsed ? 'w-[72px] px-3' : 'w-60 px-4'
        }`}
      >
        <div className={`mb-8 flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between pl-2'}`}>
          <NavLink to="/" aria-label="Home">
            <Logo markOnly={collapsed} />
          </NavLink>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {(user.admin ? [...NAV, ADMIN_NAV] : NAV).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium transition ${collapsed ? 'justify-center px-0' : 'px-3'} ${
                  isActive ? 'bg-sea-soft text-sea' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Top bar: search in the middle, theme and profile on the right (logo too on phones) */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur sm:px-6">
        <NavLink to="/" className="md:hidden">
          <Logo small />
        </NavLink>
        <div className="hidden flex-1 md:block" />
        <div className="hidden w-full max-w-xl md:block">
          <SearchBox shortcut />
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <SearchButton className="md:hidden" />
          <ThemeButton />
          <UserMenu user={user} />
        </div>
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
