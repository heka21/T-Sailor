import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { KNOTS, ROPES, type Knot, type Label } from './data'
import { arrowHead, crossings, lerpPts, linePath, ropeLayers, runs, sample, slice, type Sample } from './rope'
import { Button } from '../../components/ui/controls'

/** What the diagram shows: how far along each strand the rope has been tied, and how far it is pulled tight. */
interface View {
  to: number[]
  tight: number
}

const viewOf = (knot: Knot, step: number): View => ({ to: knot.steps[step].to, tight: knot.steps[step].tight ? 1 : 0 })

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Moves the view to `step`, sliding the working end along the rope rather than jumping. */
function useKnotView(knot: Knot, step: number) {
  const target = viewOf(knot, step)
  const [view, setView] = useState(target)
  const [moving, setMoving] = useState(false)
  const shown = useRef({ id: knot.id, view: target })

  useEffect(() => {
    const from = shown.current.id === knot.id ? shown.current.view : target
    const dist = Math.max(Math.abs(target.tight - from.tight) * 5, ...target.to.map((t, i) => Math.abs(t - from.to[i])))
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (dist < 0.01 || still) {
      shown.current = { id: knot.id, view: target }
      setView(target)
      setMoving(false)
      return
    }
    const ms = Math.min(2600, 500 + dist * 240)
    const start = performance.now()
    let raf = 0
    setMoving(true)
    const tick = (now: number) => {
      const t = ease(Math.min(1, (now - start) / ms))
      const v = { to: target.to.map((b, i) => from.to[i] + (b - from.to[i]) * t), tight: from.tight + (target.tight - from.tight) * t }
      shown.current = { id: knot.id, view: v }
      setView(v)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setMoving(false)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `target` is derived from knot + step.
  }, [knot, step])

  return { view: shown.current.id === knot.id ? view : target, moving }
}

const EDGE = 2.4

/**
 * One piece of rope. `edge` limits the dark outline to the middle of the piece (by distance along the rope), so a
 * piece redrawn over a crossing blends into the rope it was cut from instead of showing a seam.
 */
function RopePiece({ pts, rope, width, tip, edge }: { pts: Sample[]; rope: keyof typeof ROPES; width: number; tip?: boolean; edge?: [number, number] }) {
  if (pts.length < 2) return null
  const c = ROPES[rope]
  const l = ropeLayers(pts, width)
  const end = pts[pts.length - 1]
  const whip = tip ? slice(pts, end.s - width * 0.9, end.s) : []
  const outline = edge ? linePath(slice(pts, edge[0], edge[1])) : l.center
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="butt">
      <path d={outline} stroke={c.edge} strokeWidth={width + EDGE} />
      {tip && <circle cx={end.x} cy={end.y} r={(width + EDGE) / 2} fill={c.edge} />}
      <path d={l.center} stroke={c.base} strokeWidth={width} />
      <path d={l.shadow} stroke={c.dark} strokeWidth={width * 0.4} strokeOpacity={0.35} />
      <path d={l.twist} stroke={c.dark} strokeWidth={Math.max(1.1, width * 0.11)} strokeOpacity={0.55} strokeLinecap="round" />
      <path d={l.shine} stroke={c.light} strokeWidth={width * 0.22} strokeOpacity={0.6} />
      {whip.length > 1 && (
        <>
          <path d={linePath(whip)} stroke={c.whip} strokeWidth={width} />
          <circle cx={end.x} cy={end.y} r={width / 2} fill={c.whip} />
          <path d={ropeLayers(whip, width).shine} stroke="white" strokeWidth={width * 0.18} strokeOpacity={0.35} />
        </>
      )}
    </g>
  )
}

/** One frame of a knot: the rope as tied so far, the object it is tied to, the next move and labels. */
function KnotScene({ knot, view, next, labels, title }: { knot: Knot; view: View; next?: View; labels?: Label[]; title: string }) {
  const pose = (v: View) => knot.strands.map((st) => lerpPts(st.pts, st.tight, v.tight))
  const pts = pose(view)
  const lines = pts.map((p, i) => (view.to[i] > 0 ? sample(p, view.to[i]) : []))
  const widths = knot.strands.map((s) => s.width)
  const cross = crossings(lines, widths)
  const split = !!knot.object

  type Piece = { key: string; i: number; pts: Sample[]; tip: boolean; edge?: [number, number] }
  const back: Piece[] = []
  const front: Piece[] = []
  lines.forEach((line, i) => {
    if (line.length < 2) return
    const parts = split ? runs(line) : [{ back: false, pts: line }]
    parts.forEach((r, j) => (r.back ? back : front).push({ key: `r${i}-${j}`, i, pts: r.pts, tip: j === parts.length - 1 }))
  })
  cross.forEach((c, j) => {
    const line = lines[c.over]
    // The outline only has to cover the rope underneath; the body runs on past it to hide the outline's ends.
    const edge = widths[c.under] / 2 + 2
    const reach = edge + (widths[c.over] + EDGE) / 2 + 1
    const end = line[line.length - 1].s
    const piece = slice(line, c.sOver - reach, c.sOver + reach)
    ;(c.zOver < 0 && split ? back : front).push({
      key: `c${j}`,
      i: c.over,
      pts: piece,
      tip: c.sOver + reach >= end,
      edge: [c.sOver - edge, c.sOver + edge],
    })
  })
  const draw = (p: Piece) => <RopePiece key={p.key} pts={p.pts} rope={knot.strands[p.i].rope} width={widths[p.i]} tip={p.tip} edge={p.edge} />

  // Where the working end goes next, as a dashed arrow.
  const ghosts =
    next &&
    pose(next).flatMap((p, i) => {
      if (next.to[i] - view.to[i] < 0.05) return []
      const line = sample(p, next.to[i])
      const from = view.to[i] > 0 ? sample(p, view.to[i]).at(-1)!.s : 0
      const path = slice(line, from + widths[i] * 0.8, line[line.length - 1].s)
      return path.length > 1 ? [path] : []
    })

  return (
    <svg viewBox="0 0 400 340" className="block h-auto w-full" role="img" aria-label={title}>
      <rect width="400" height="340" fill="var(--surface-2)" />
      {knot.back}
      {back.map(draw)}
      {knot.object}
      {front.map(draw)}
      {knot.front}
      {ghosts?.map((g, i) => (
        <g key={i} className="pointer-events-none">
          <path d={linePath(g)} fill="none" stroke="var(--signal)" strokeWidth={2.5} strokeDasharray="7 6" strokeLinecap="round" />
          <path d={arrowHead(g, 13)} fill="var(--signal)" stroke="var(--surface-2)" strokeWidth={1.5} strokeLinejoin="round" />
        </g>
      ))}
      {labels?.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor ?? 'middle'}
          fontSize={12.5}
          fontWeight={700}
          fill="var(--ink)"
          stroke="var(--surface-2)"
          strokeWidth={4}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {l.text}
        </text>
      ))}
    </svg>
  )
}

/** The knot at `step`; once the rope has stopped moving it also shows the step's labels and the next move. */
function KnotFrame({ knot, step, view, moving }: { knot: Knot; step: number; view: View; moving: boolean }) {
  const next = moving || step === knot.steps.length - 1 ? undefined : viewOf(knot, step + 1)
  const title = `${knot.name}, step ${step + 1}: ${knot.steps[step].text}`
  return <KnotScene knot={knot} view={view} next={next} labels={moving ? undefined : knot.steps[step].labels} title={title} />
}

export function KnotDiagram({ knot, step }: { knot: Knot; step: number }) {
  const { view, moving } = useKnotView(knot, step)
  return <KnotFrame knot={knot} step={step} view={view} moving={moving} />
}

export function KnotViewer({ knot: only }: { knot?: string }) {
  const requested = useSearchParams()[0].get('knot')
  const [id, setId] = useState(only ?? requested ?? KNOTS[0].id)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const knot = KNOTS.find((k) => k.id === id) ?? KNOTS[0]
  const last = knot.steps.length - 1
  const { view, moving } = useKnotView(knot, step)

  useEffect(() => {
    if (!playing || moving) return
    if (step >= last) {
      setPlaying(false)
      return
    }
    // Time to read the step before moving on.
    const t = setTimeout(() => setStep((s) => s + 1), 2600)
    return () => clearTimeout(t)
  }, [playing, moving, step, last])

  const pick = (k: string) => {
    setId(k)
    setStep(0)
    setPlaying(false)
  }

  // A search result (?knot=bowline) picked while this page is already open.
  useEffect(() => {
    if (!only && requested) pick(requested)
  }, [only, requested])

  const go = (i: number) => {
    setStep(Math.max(0, Math.min(last, i)))
    setPlaying(false)
  }

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
        <div className="relative border-b border-line md:border-r md:border-b-0">
          <KnotFrame knot={knot} step={step} view={view} moving={moving} />
          <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-bold text-muted shadow-sm">
            Step {step + 1} of {last + 1}
          </div>
          {step < last && !moving && (
            <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-muted shadow-sm">
              <svg width="22" height="8" aria-hidden>
                <path d="M1,4 L15,4" stroke="var(--signal)" strokeWidth={2.5} strokeDasharray="5 4" />
                <path d="M21,4 L14,0.5 L14,7.5 Z" fill="var(--signal)" />
              </svg>
              next move
            </div>
          )}
        </div>
        <div className="flex flex-col p-5">
          <h3 className="font-display text-xl font-bold">{knot.name}</h3>
          <p className="mt-1 text-sm text-muted">{knot.use}</p>
          <ol className="mt-4 space-y-1.5">
            {knot.steps.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => go(i)}
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
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0} ariaLabel="Previous step">
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                if (!playing) setStep(step >= last ? 0 : step + 1)
                setPlaying(!playing)
              }}
            >
              {playing ? <Pause size={16} /> : step >= last ? <RotateCcw size={16} /> : <Play size={16} />}{' '}
              {playing ? 'Pause' : step >= last ? 'Replay' : 'Play'}
            </Button>
            <Button variant="ghost" onClick={() => go(step + 1)} disabled={step === last} ariaLabel="Next step">
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
