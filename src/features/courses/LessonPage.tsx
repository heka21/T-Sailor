import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react'
import { courseById, lessonBy, lessonsFor } from '../../content/courses'
import { mdxComponents } from '../../content/mdxComponents'
import { useProgress } from '../../lib/progress'
import { NotFound } from '../../app/NotFound'

export function LessonPage() {
  const { courseId = '', slug = '' } = useParams()
  const course = courseById(courseId)
  const lesson = lessonBy(courseId, slug)
  const done = useProgress((s) => (lesson ? !!s.completed[lesson.id] : false))
  const toggleComplete = useProgress((s) => s.toggleComplete)
  const setLast = useProgress((s) => s.setLast)

  useEffect(() => {
    if (lesson) setLast(lesson.courseId, lesson.slug)
  }, [lesson, setLast])

  if (!course || !lesson) return <NotFound />
  const Content = lesson.Component
  const lessons = lessonsFor(course.id)
  const i = lessons.indexOf(lesson)
  const prev = lessons[i - 1]
  const next = lessons[i + 1]

  return (
    <article className="mx-auto max-w-5xl">
      <Link to={`/courses/${course.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> {course.title}
      </Link>
      <header className="mb-8 max-w-3xl">
        <div className="mb-2 flex items-center gap-3 text-sm font-semibold" style={{ color: course.color }}>
          <span>
            Lesson {i + 1} of {lessons.length}
          </span>
          <span className="flex items-center gap-1 font-medium text-muted">
            <Clock size={14} /> {lesson.meta.minutes} min
          </span>
        </div>
        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{lesson.meta.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{lesson.meta.summary}</p>
        <div className="mt-5 flex gap-1">
          {lessons.map((l, n) => (
            <Link
              key={l.id}
              to={`/courses/${course.id}/${l.slug}`}
              title={l.meta.title}
              className="h-1.5 flex-1 rounded-full transition"
              style={{ background: n === i ? course.color : n < i ? `${course.color}66` : 'var(--line)' }}
            />
          ))}
        </div>
      </header>

      <div className="lesson [&>:is(p,ul,ol,h2,h3,blockquote,table,aside)]:max-w-3xl">
        <Content key={lesson.id} components={mdxComponents} />
      </div>

      <footer className="mt-14 max-w-3xl border-t border-line pt-6">
        <p className="mb-4 text-xs leading-relaxed text-muted">
          General study notes based on Australian Sailing keelboat courses and the Racing Rules of Sailing 2025–2028. Your
          course handbook and instructors are the final word — check local details with them.
        </p>
        <button
          onClick={() => toggleComplete(lesson.id)}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition ${
            done ? 'bg-starboard/15 text-starboard' : 'bg-sea text-white shadow hover:brightness-110'
          }`}
        >
          {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          {done ? 'Completed — nice work!' : 'Mark lesson complete'}
        </button>
        <nav className="mt-4 grid grid-cols-2 gap-3">
          {prev ? (
            <Link to={`/courses/${course.id}/${prev.slug}`} className="rounded-2xl border border-line p-3 hover:border-sea">
              <span className="flex items-center gap-1 text-xs text-muted">
                <ArrowLeft size={13} /> Previous
              </span>
              <span className="font-display font-semibold">{prev.meta.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/courses/${course.id}/${next.slug}`} className="rounded-2xl border border-line p-3 text-right hover:border-sea">
              <span className="flex items-center justify-end gap-1 text-xs text-muted">
                Next <ArrowRight size={13} />
              </span>
              <span className="font-display font-semibold">{next.meta.title}</span>
            </Link>
          ) : (
            <Link to={`/courses/${course.id}`} className="rounded-2xl border border-line p-3 text-right hover:border-sea">
              <span className="text-xs text-muted">Finished</span>
              <span className="block font-display font-semibold">Back to {course.title}</span>
            </Link>
          )}
        </nav>
      </footer>
    </article>
  )
}
