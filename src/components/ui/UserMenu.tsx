import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useSession, type User } from '../../lib/session'
import { Avatar } from './Avatar'

const itemCls = 'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface-2'

/** Avatar in the top bar; opens a small menu with profile, admin (if allowed) and sign out. */
export function UserMenu({ user }: { user: User }) {
  const logout = useSession((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`${user.name} — account menu`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.name}
        className={`block rounded-full ring-offset-2 ring-offset-bg transition ${open ? 'ring-2 ring-sea' : 'hover:ring-2 hover:ring-line'}`}
      >
        <Avatar name={user.name} size={32} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 z-40 mt-2 w-56 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
          >
            <div className="flex items-center gap-3 px-3 pt-2 pb-3">
              <Avatar name={user.name} size={36} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="truncate text-xs text-muted">@{user.username}</div>
              </div>
            </div>
            <div className="mb-1 border-t border-line" />
            <Link to="/profile" role="menuitem" className={itemCls}>
              <UserRound size={16} className="text-muted" /> Profile
            </Link>
            {user.admin && (
              <Link to="/admin" role="menuitem" className={itemCls}>
                <ShieldCheck size={16} className="text-muted" /> Admin
              </Link>
            )}
            <button role="menuitem" onClick={logout} className={itemCls}>
              <LogOut size={16} className="text-muted" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
