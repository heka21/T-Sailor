import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { COURSES, lessonsFor, type CourseMeta } from '../../content/courses'
import { useProgress } from '../../lib/progress'
import { PageHeader, ProgressRing } from '../../components/ui/blocks'
import { CourseBadge } from './CourseBadge'

export function useCourseProgress(courseId: string) {
  const completed = useProgress((s) => s.completed)
  const lessons = lessonsFor(courseId)
  const done = lessons.filter((l) => completed[l.id]).length
  return { done, total: lessons.length, pct: lessons.length ? done / lessons.length : 0 }
}

export function CourseCard({ course, index }: { course: CourseMeta; index: number }) {
  const { done, total, pct } = useCourseProgress(course.id)
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: course.color }} />
      <CourseBadge course={course} index={index} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: course.color }}>
          Course {index + 1}
        </div>
        <h3 className="font-display text-lg font-semibold">{course.title}</h3>
        <p className="text-sm text-muted">{course.tagline}</p>
      </div>
      <ProgressRing value={pct} color={course.color}>
        {done}/{total}
      </ProgressRing>
      <ChevronRight className="hidden text-muted transition group-hover:translate-x-0.5 sm:block" />
    </Link>
  )
}

export function CoursesPage() {
  return (
    <>
      <PageHeader eyebrow="Courses" title="Your keelboat pathway">
        The five Royal Perth Yacht Club keelboat courses, in the order you’ll take them. Each lesson mixes short
        explanations with interactive diagrams.
      </PageHeader>
      <div className="relative space-y-3">
        {COURSES.map((c, i) => (
          <CourseCard key={c.id} course={c} index={i} />
        ))}
      </div>
    </>
  )
}
