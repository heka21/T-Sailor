import type { ReactNode } from 'react'
import { AlertTriangle, BookMarked, Lightbulb, Scale, Info } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}>{children}</div>
}

const CALLOUTS = {
  tip: { icon: Lightbulb, label: 'Tip', cls: 'border-sea/40 bg-sea-soft/60', ic: 'text-sea' },
  safety: { icon: AlertTriangle, label: 'Safety', cls: 'border-port/40 bg-port/8', ic: 'text-port' },
  rule: { icon: Scale, label: 'Rule', cls: 'border-wind/40 bg-wind/8', ic: 'text-wind' },
  remember: { icon: BookMarked, label: 'Remember', cls: 'border-signal/40 bg-signal-soft/60', ic: 'text-signal' },
  note: { icon: Info, label: 'Note', cls: 'border-line bg-surface-2', ic: 'text-muted' },
}

export function Callout({
  type = 'tip',
  title,
  children,
}: {
  type?: keyof typeof CALLOUTS
  title?: string
  children: ReactNode
}) {
  const c = CALLOUTS[type]
  const Icon = c.icon
  return (
    <aside className={`not-prose my-6 rounded-2xl border px-4 py-3.5 ${c.cls}`}>
      <div className={`mb-1 flex items-center gap-2 text-sm font-semibold ${c.ic}`}>
        <Icon size={16} />
        {title ?? c.label}
      </div>
      <div className="text-[15px] leading-relaxed text-ink [&>p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </aside>
  )
}

export function KeyTerms({ terms }: { terms: [string, string][] }) {
  return (
    <div className="my-6 grid gap-2 sm:grid-cols-2">
      {terms.map(([t, d]) => (
        <div key={t} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <div className="font-display font-semibold text-sea">{t}</div>
          <div className="text-sm leading-snug text-muted">{d}</div>
        </div>
      ))}
    </div>
  )
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  color = 'var(--sea)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, value))}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold">{children}</div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-sea">{eyebrow}</p>}
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">{children}</div>}
    </header>
  )
}
