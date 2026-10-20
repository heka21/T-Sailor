import type { ReactNode } from 'react'

/**
 * Card layout for a simulator: the drawing on one side and controls/readouts on the other.
 * Uses a container query so it stacks inside narrow lesson columns and sits side by side in the lab.
 */
export function SimFrame({
  title,
  subtitle,
  visual,
  children,
  footer,
}: {
  title: string
  subtitle?: ReactNode
  visual: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="not-prose @container my-8 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="grid @3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="relative flex items-center border-b border-line bg-surface-2/40 @3xl:border-r @3xl:border-b-0">
          <div className="w-full">{visual}</div>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm leading-snug text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
      {footer && <div className="border-t border-line bg-surface-2/40 px-4 py-3 text-sm text-muted sm:px-5">{footer}</div>}
    </section>
  )
}

export function Readout({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}
