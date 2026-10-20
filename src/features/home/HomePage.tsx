import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Wind } from 'lucide-react'
import { COURSES, LESSONS, lessonBy } from '../../content/courses'
import { useProgress } from '../../lib/progress'
import { advice, useWeather } from '../../lib/weather'
import { compassPoint } from '../../lib/sailing'
import { CourseCard } from '../courses/CoursesPage'
import { SimCard } from '../lab/LabPage'
import { Boat } from '../../components/svg/Boat'
import { WindField } from '../../components/svg/Wind'

function Hero() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2545] via-[#0f3b5f] to-[#0e8f9b] text-white">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <WindField windFrom={230} width={800} height={320} speed={14} color="white" density={0.8} />
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d="M-100 0 q50 -14 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0"
            transform={`translate(0 ${250 + i * 26})`}
            fill="none"
            stroke="white"
            strokeOpacity={0.18 - i * 0.04}
            strokeWidth={2}
            animate={{ x: [0, -200] }}
            transition={{ duration: 9 + i * 3, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <motion.g animate={{ y: [0, 4, 0], rotate: [0, 1.5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformBox: 'view-box', originX: '640px', originY: '170px' }}>
          <Boat x={640} y={170} heading={300} scale={1.5} sail={22} side={-1} accent="#f26b1d" />
        </motion.g>
      </svg>
      <div className="relative max-w-xl p-6 sm:p-10">
        <p className="text-sm font-semibold tracking-wider text-[#7ee0e8] uppercase">Royal Perth Yacht Club · Keelboat pathway</p>
        <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-5xl">Learn to sail, visually.</h1>
        <p className="mt-3 text-lg leading-relaxed text-white/85">
          Five courses from your first time aboard to your first race — with simulators you can steer, trim and play with.
        </p>
      </div>
    </section>
  )
}

function ContinueCard() {
  const last = useProgress((s) => s.last)
  const completed = useProgress((s) => s.completed)
  const lesson = last ? lessonBy(last.courseId, last.slug) : undefined
  const first = LESSONS[0]
  const target = lesson ?? first
  if (!target) return null
  const course = COURSES.find((c) => c.id === target.courseId)!
  const done = Object.keys(completed).length
  return (
    <Link
      to={`/courses/${target.courseId}/${target.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: course.color }}>
          {lesson ? 'Continue where you left off' : 'Start here'}
        </div>
        <div className="truncate font-display text-lg font-semibold">{target.meta.title}</div>
        <div className="text-sm text-muted">
          {course.title} · {done} of {LESSONS.length} lessons done
        </div>
      </div>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sea text-white transition group-hover:translate-x-0.5">
        <ArrowRight size={20} />
      </span>
    </Link>
  )
}

function WindCard() {
  const { data } = useWeather()
  if (!data) {
    return <div className="h-full min-h-28 animate-pulse rounded-2xl bg-surface-2" />
  }
  const c = data.current
  const a = advice(c.wind, c.gust)
  return (
    <Link to="/weather" className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-md">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-wind/12 text-wind">
        <Wind size={22} />
        <svg viewBox="0 0 56 56" className="absolute inset-0" style={{ transform: `rotate(${c.dir}deg)` }}>
          {/* marker on the upwind side, pointing in the direction the wind blows */}
          <path d="M23 3 L33 3 L28 12 Z" fill="var(--wind)" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold tracking-wider text-muted uppercase">Matilda Bay now</div>
        <div className="font-display text-lg font-semibold">
          {compassPoint(c.dir)} {Math.round(c.wind)} kn <span className="text-sm font-normal text-muted">gust {Math.round(c.gust)}</span>
        </div>
        <div className="text-sm font-medium" style={{ color: a.tone }}>
          {a.title}
        </div>
      </div>
    </Link>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <ContinueCard />
        <WindCard />
      </div>
      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Your courses</h2>
          <Link to="/courses" className="text-sm font-semibold text-sea">
            All courses →
          </Link>
        </div>
        <div className="space-y-3">
          {COURSES.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Try a simulator</h2>
          <Link to="/lab" className="text-sm font-semibold text-sea">
            Sim Lab →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {['points-of-sail', 'sail-trim', 'right-of-way'].map((id) => (
            <SimCard key={id} id={id} />
          ))}
        </div>
      </section>
    </>
  )
}
