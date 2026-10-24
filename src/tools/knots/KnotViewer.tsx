import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { KNOTS, type Knot, type Segment } from './data'
import { Button } from '../../components/ui/controls'

const ROPE = { a: '#e9b44c', b: '#3b82f6' }

/** A rope segment draws itself in when it first appears; segments carried over from the previous step stay put. */
function RopeSegment({ seg, width }: { seg: Segment; width: number }) {
  const color = ROPE[seg.rope ?? 'a']
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, ease: 'easeInOut' as const } }
  return (
    <g>
      <motion.path d={seg.d} fill="none" stroke="rgb(15 23 42 / 0.75)" strokeWidth={width + 4} strokeLinecap="butt" {...draw} />
      <motion.path d={seg.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...draw} />
      <motion.path
        d={seg.d}
        fill="none"
        stroke="white"
        strokeWidth={width * 0.3}
        strokeDasharray="1.5 5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 0.9 }}
      />
    </g>
  )
}

export function KnotDiagram({ knot, step }: { knot: Knot; step: number }) {
  const show = knot.steps[step].show
  const segs = show.map((i) => ({ i, s: knot.segments[i] })).sort((a, b) => a.s.z - b.s.z)
  const width = (s: Segment) => (knot.id === 'sheet-bend' && s.rope === 'b' ? 14 : 9)
  const lower = segs.filter((x) => x.s.z < 1)
  const upper = segs.filter((x) => x.s.z >= 1)
  return (
    <svg viewBox="0 0 400 340" className="block h-auto w-full" role="img" aria-label={`${knot.name}, step ${step + 1}: ${knot.steps[step].text}`}>
      <rect width="400" height="340" fill="var(--surface-2)" />
      {lower.map(({ i, s }) => (
        <RopeSegment key={`${knot.id}-${i}`} seg={s} width={width(s)} />
      ))}
      {knot.object}
      {upper.map(({ i, s }) => (
        <RopeSegment key={`${knot.id}-${i}`} seg={s} width={width(s)} />
      ))}
      {knot.overlay?.(step)}
    </svg>
  )
}

export function KnotViewer({ knot: only }: { knot?: string }) {
  const requested = useSearchParams()[0].get('knot')
  const [id, setId] = useState(only ?? requested ?? KNOTS[0].id)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const knot = KNOTS.find((k) => k.id === id) ?? KNOTS[0]
  const last = knot.steps.length - 1

  useEffect(() => {
    if (!playing) return
    if (step >= last) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setStep((s) => s + 1), 2200)
    return () => clearTimeout(t)
  }, [playing, step, last])

  const pick = (k: string) => {
    setId(k)
    setStep(0)
    setPlaying(false)
  }

  // A search result (?knot=bowline) picked while this page is already open.
  useEffect(() => {
    if (!only && requested) pick(requested)
  }, [only, requested])

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      {!only && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-line p-3">
          {KNOTS.map((k) => (
            <button
              key={k.id}
              onClick={() => pick(k.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                k.id === id ? 'bg-sea text-white' : 'bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-line md:border-r md:border-b-0">
          <KnotDiagram knot={knot} step={step} />
        </div>
        <div className="flex flex-col p-5">
          <h3 className="font-display text-xl font-bold">{knot.name}</h3>
          <p className="mt-1 text-sm text-muted">{knot.use}</p>
          <ol className="mt-4 space-y-1.5">
            {knot.steps.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    setStep(i)
                    setPlaying(false)
                  }}
                  className={`flex w-full gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                    i === step ? 'bg-sea-soft/70 font-semibold text-ink' : 'text-muted hover:bg-surface-2'
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i <= step ? 'bg-sea text-white' : 'bg-line'}`}>
                    {i + 1}
                  </span>
                  {s.text}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} ariaLabel="Previous step">
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                if (step >= last) setStep(0)
                setPlaying((p) => !p)
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play'}
            </Button>
            <Button variant="ghost" onClick={() => setStep((s) => Math.min(last, s + 1))} disabled={step === last} ariaLabel="Next step">
              <ChevronRight size={18} />
            </Button>
          </div>
          <p className="mt-auto pt-4 text-sm text-muted">
            <span className="font-semibold text-signal">Tip: </span>
            {knot.tip}
          </p>
        </div>
      </div>
    </div>
  )
}
