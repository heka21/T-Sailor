import type { ReactNode } from 'react'

export function Figure({ caption, children, controls }: { caption?: ReactNode; children: ReactNode; controls?: ReactNode }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="bg-surface-2/40">{children}</div>
      {controls && <div className="border-t border-line p-4">{controls}</div>}
      {caption && <figcaption className="border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">{caption}</figcaption>}
    </figure>
  )
}

export function Label({ x, y, children, color = 'var(--ink)', anchor = 'middle', size = 14, weight = 700 }: { x: number; y: number; children: ReactNode; color?: string; anchor?: 'start' | 'middle' | 'end'; size?: number; weight?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={color}>
      {children}
    </text>
  )
}
