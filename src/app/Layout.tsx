import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { BookOpen, ChevronDown, FlaskConical, House, PanelLeftClose, PanelLeftOpen, ShieldCheck, Wind, Wrench } from 'lucide-react'
import { useProgress, type Theme } from '../lib/progress'
import { useSession } from '../lib/session'
import { Logo } from '../components/ui/Logo'
import { UserMenu } from '../components/ui/UserMenu'
import { ThemeButton } from '../components/ui/ThemeSwitch'
import { SearchBox, SearchButton } from '../components/ui/Search'
import { LoginPage } from '../features/account/LoginPage'
import { COURSES } from '../content/courses'
import { SIMS } from '../sims/registry'
import { TOOLS } from '../features/toolbox/ToolboxPage'

interface NavItem {
  to: string
  label: string
  icon: typeof House
  end?: boolean
  /** Sub-sections, listed under the item in the expanded sidebar (the phone tabs ignore them). */
  children?: { to: string; label: string; color?: string }[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  {
    to: '/courses',
    label: 'Courses',
    icon: BookOpen,
    children: COURSES.map((c) => ({ to: `/courses/${c.id}`, label: c.title, color: c.color })),
  },
  { to: '/lab', label: 'Sim Lab', icon: FlaskConical, children: SIMS.map((s) => ({ to: `/lab/${s.id}`, label: s.title })) },
  { to: '/toolbox', label: 'Toolbox', icon: Wrench, children: TOOLS.map((t) => ({ to: `/toolbox/${t.id}`, label: t.title })) },
  { to: '/weather', label: 'Weather', icon: Wind },
]

// Sidebar only — on phones admins reach it from the account menu.
const ADMIN_NAV: NavItem = { to: '/admin', label: 'Admin', icon: ShieldCheck }

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

/**
 * Sidebar links. Sections with sub-sections open on their own while you're inside them,
 * and the chevron opens or closes any of them by hand.
 */
function SidebarNav({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const { pathname } = useLocation()
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const inside = (to: string) => pathname === to || pathname.startsWith(`${to}/`)

  return (
    <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
      {items.map(({ to, label, icon: Icon, end, children }) => {
        const open = !collapsed && !!children && (toggled[to] ?? inside(to))
        return (
          <div key={to}>
            <div className="relative">
              <NavLink
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium transition ${
                    collapsed ? 'justify-center px-0' : children ? 'pr-10 pl-3' : 'px-3'
                  } ${isActive ? 'bg-sea-soft text-sea' : 'text-muted hover:bg-surface-2 hover:text-ink'}`
                }
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && label}
              </NavLink>
              {!collapsed && children && (
                <button
                  onClick={() => setToggled((t) => ({ ...t, [to]: !open }))}
                  aria-label={`${open ? 'Hide' : 'Show'} ${label} sections`}
                  aria-expanded={open}
                  className="absolute inset-y-0 right-1 my-auto grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <ChevronDown size={16} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>
            {open && (
              <ul className="mt-1 mb-2 ml-[21px] flex flex-col gap-0.5 border-l border-line pl-2">
                {children!.map((c) => (
                  <li key={c.to}>
                    <NavLink
                      to={c.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px] transition ${
                          isActive ? 'bg-surface-2 font-medium text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
                        }`
                      }
                    >
                      {c.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />}
                      <span className="truncate">{c.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
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
    // Braces matter: newer browsers return a Promise from scrollTo, which React would take for a cleanup function.
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
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
        <SidebarNav items={user.admin ? [...NAV, ADMIN_NAV] : NAV} collapsed={collapsed} />
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
