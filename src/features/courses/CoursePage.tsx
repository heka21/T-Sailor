import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Circle, Clock, Target } from 'lucide-react'
import { COURSES, courseById, lessonsFor } from '../../content/courses'
import { useProgress } from '../../lib/progress'
import { ProgressRing } from '../../components/ui/blocks'
import { SIMS } from '../../sims/registry'
import { SimCard } from '../lab/LabPage'
import { NotFound } from '../../app/NotFound'
import { CourseBadge } from './CourseBadge'
import { useCourseProgress } from './CoursesPage'

export function CoursePage() {
  const { courseId = '' } = useParams()
  const course = courseById(courseId)
  const completed = useProgress((s) => s.completed)
  const progress = useCourseProgress(courseId)
  if (!course) return <NotFound />
  const lessons = lessonsFor(course.id)
  const index = COURSES.indexOf(course)
  const sims = SIMS.filter((s) => s.courses.includes(course.id))
  const next = lessons.find((l) => !completed[l.id]) ?? lessons[0]

  return (
    <>
      <Link to="/courses" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> All courses
      </Link>
      <header
        className="relative mb-8 overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={{ background: `linear-gradient(135deg, ${course.color}, #0b2545)` }}
      >
        <svg className="pointer-events-none absolute right-0 bottom-0 h-full opacity-20" viewBox="0 0 200 200" aria-hidden>
          <path d="M120 20 L120 160 L40 160 Z" fill="white" />
          <path d="M130 40 C160 70 170 110 170 160 L130 160 Z" fill="white" />
        </svg>
        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl bg-white/90 p-1">
            <CourseBadge course={course} index={index} size={52} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Course {index + 1} of 5</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-2 max-w-xl leading-relaxed opacity-90">{course.description}</p>
          </div>
          <div className="hidden sm:block">
            <ProgressRing value={progress.pct} size={72} stroke={7} color="white">
              <span className="text-sm text-white">{Math.round(progress.pct * 100)}%</span>
            </ProgressRing>
          </div>
        </div>
        {next && (
          <Link
            to={`/courses/${course.id}/${next.slug}`}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow"
          >
            {progress.done === 0 ? 'Start course' : progress.done === progress.total ? 'Review from the start' : 'Continue'} →
          </Link>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Lessons</h2>
          <ol className="space-y-2">
            {lessons.map((l, i) => {
              const done = !!completed[l.id]
              return (
                <li key={l.id}>
                  <Link
                    to={`/courses/${course.id}/${l.slug}`}
                    className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-sea"
                  >
                    {done ? (
                      <CheckCircle2 className="mt-0.5 shrink-0 text-starboard" size={22} />
                    ) : (
                      <Circle className="mt-0.5 shrink-0 text-line" size={22} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-muted">Lesson {i + 1}</div>
                      <div className="font-display font-semibold group-hover:text-sea">{l.meta.title}</div>
                      <p className="mt-0.5 text-sm text-muted">{l.meta.summary}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                      <Clock size={13} /> {l.meta.minutes} min
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Target size={17} className="text-sea" /> You will be able to
            </h3>
            <ul className="space-y-1.5 text-sm text-muted">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: course.color }} />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          {sims.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Simulators for this course</h3>
              <div className="grid gap-3">
                {sims.map((s) => (
                  <SimCard key={s.id} id={s.id} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
