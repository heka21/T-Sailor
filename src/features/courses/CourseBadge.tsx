import type { CourseMeta } from '../../content/courses'

/** Little illustrated badge per course: a stylised sail with a different motif each level. */
export function CourseBadge({ course, index, size = 56 }: { course: CourseMeta; index: number; size?: number }) {
  const c = course.color
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0" aria-hidden>
      <rect width="64" height="64" rx="16" fill={c} opacity={0.14} />
      <path d="M32 10 L32 44 L16 44 Z" fill={c} opacity={index >= 0 ? 0.9 : 0.4} />
      {index >= 1 && <path d="M35 14 C42 22 45 32 45 44 L35 44 Z" fill={c} opacity={0.6} />}
      {index === 3 && <path d="M38 8 Q58 14 54 34 Q46 26 38 8 Z" fill="#f26b1d" />}
      {index === 4 && (
        <g>
          <line x1="48" y1="8" x2="48" y2="24" stroke={c} strokeWidth="2" />
          <path d="M48 8 L58 12 L48 16 Z" fill={c} />
        </g>
      )}
      {index === 2 && <circle cx="50" cy="16" r="5" fill="none" stroke={c} strokeWidth="2.5" />}
      <path d="M10 48 L54 48 L48 55 L16 55 Z" fill={c} />
    </svg>
  )
}
