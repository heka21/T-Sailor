import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './controls'

export interface Step {
  title: string
  body?: ReactNode
  /** Something called out loud on the boat. */
  call?: string
  /** What each crew member does. */
  roles?: [string, string][]
}

/**
 * Step-through for any procedure. `visual` draws the picture for the current step;
 * it receives the step index so diagrams can animate between steps.
 */
export function Stepper({
  steps,
  visual,
  title,
  autoMs = 3800,
}: {
  steps: Step[]
  visual?: (i: number) => ReactNode
  title?: string
  autoMs?: number
}) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = steps[i]

  useEffect(() => {
    if (!playing) return
    if (i >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setI((n) => n + 1), autoMs)
    return () => clearTimeout(t)
  }, [playing, i, steps.length, autoMs])

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <span className="text-xs font-medium text-muted">
            Step {i + 1} / {steps.length}
          </span>
        </div>
      )}
      <div className={visual ? 'grid md:grid-cols-[1.15fr_1fr]' : ''}>
        {visual && <div className="border-b border-line bg-surface-2/50 md:border-r md:border-b-0">{visual(i)}</div>}
        <div className="flex flex-col p-4 sm:p-5">
          <ol className="mb-4 flex gap-1.5" aria-label="Steps">
            {steps.map((s, n) => (
              <li key={s.title} className="flex-1">
                <button
                  onClick={() => {
                    setI(n)
                    setPlaying(false)
                  }}
                  aria-label={`Step ${n + 1}: ${s.title}`}
                  aria-current={n === i}
                  className={`h-1.5 w-full rounded-full transition ${n <= i ? 'bg-sea' : 'bg-line'}`}
                />
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-sea">Step {i + 1}</div>
              <h4 className="font-display text-lg font-semibold leading-snug">{step.title}</h4>
              {step.call && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-signal-soft px-3 py-1 text-sm font-semibold text-signal">
                  <span aria-hidden>📣</span> “{step.call}”
                </div>
              )}
              {step.body && <div className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</div>}
              {step.roles && (
                <dl className="mt-3 space-y-1.5">
                  {step.roles.map(([r, t]) => (
                    <div key={r} className="flex gap-2 text-sm">
                      <dt className="w-20 shrink-0 font-semibold text-ink">{r}</dt>
                      <dd className="text-muted">{t}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex items-center gap-2">
            <Button variant="ghost" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} ariaLabel="Previous step">
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                if (i >= steps.length - 1) setI(0)
                setPlaying((p) => !p)
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}
              disabled={i === steps.length - 1}
              ariaLabel="Next step"
            >
              <ChevronRight size={18} />
            </Button>
            <Button variant="ghost" className="ml-auto" onClick={() => { setI(0); setPlaying(false) }} ariaLabel="Restart">
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
