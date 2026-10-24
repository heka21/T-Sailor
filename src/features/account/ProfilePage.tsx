import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { LogOut, ShieldCheck } from 'lucide-react'
import { COURSES, LESSONS } from '../../content/courses'
import { useProgress } from '../../lib/progress'
import { changePassword, useSession } from '../../lib/session'
import { Card, PageHeader, ProgressRing } from '../../components/ui/blocks'
import { Button, Stat } from '../../components/ui/controls'
import { useCourseProgress } from '../courses/CoursesPage'
import { ThemeSwitch } from '../../components/ui/ThemeSwitch'
import { Avatar } from '../../components/ui/Avatar'
import { inputCls } from './LoginPage'

function CourseRow({ id, title, color }: { id: string; title: string; color: string }) {
  const { done, total, pct } = useCourseProgress(id)
  return (
    <div className="flex items-center gap-3 py-2">
      <ProgressRing value={pct} color={color} size={44} stroke={5}>
        {done}
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted">
          {done} of {total} lessons
        </div>
      </div>
    </div>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await changePassword(current, next)
      setCurrent('')
      setNext('')
      setMsg({ ok: true, text: 'Password changed. Other devices have been signed out.' })
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputCls} type="password" placeholder="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      <input className={inputCls} type="password" placeholder="New password (6+ characters)" autoComplete="new-password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} required />
      {msg && <p className={`text-sm font-medium ${msg.ok ? 'text-starboard' : 'text-port'}`}>{msg.text}</p>}
      <button type="submit" className="rounded-xl bg-sea-soft px-4 py-2 text-sm font-semibold text-sea transition hover:brightness-105">
        Change password
      </button>
    </form>
  )
}

export function ProfilePage() {
  const user = useSession((s) => s.user)!
  const logout = useSession((s) => s.logout)
  const completed = useProgress((s) => s.completed)
  const done = Object.keys(completed).length
  const minutes = LESSONS.filter((l) => completed[l.id]).reduce((m, l) => m + l.meta.minutes, 0)
  const coursesDone = COURSES.filter((c) => {
    const ls = LESSONS.filter((l) => l.courseId === c.id)
    return ls.length > 0 && ls.every((l) => completed[l.id])
  }).length

  return (
    <>
      <PageHeader eyebrow="Profile" title={user.name} />
      <div className="-mt-6 mb-8 flex items-center gap-3 text-muted">
        <Avatar name={user.name} size={28} />@{user.username}
      </div>
      <div className="mb-8 grid grid-cols-3 gap-3 sm:max-w-xl">
        <Stat label="Lessons" value={done} sub={`of ${LESSONS.length}`} />
        <Stat label="Courses" value={coursesDone} sub={`of ${COURSES.length} complete`} />
        <Stat label="Study time" value={`${minutes}m`} sub="lessons read" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 font-display text-lg font-semibold">Course progress</h2>
          {COURSES.map((c) => (
            <CourseRow key={c.id} id={c.id} title={c.title} color={c.color} />
          ))}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Appearance</h2>
            <div className="max-w-56">
              <ThemeSwitch />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Password</h2>
            <PasswordForm />
          </Card>
          {user.admin && (
            <Link to="/admin" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 font-semibold shadow-sm transition hover:shadow-md">
              <ShieldCheck size={20} className="text-sea" /> Manage users
            </Link>
          )}
          <Button variant="ghost" onClick={logout}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </div>
    </>
  )
}
