import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { rightOfWay, type BoatId, type BoatPose, type RulesMode } from '../lib/rules'
import { polar, sub, vecBearing, type Vec } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { svgPoint } from '../components/svg/pointer'
import { Segmented, Slider } from '../components/ui/controls'
import { Callout } from '../components/ui/blocks'
import { SimFrame } from './SimFrame'
import { trimFor } from './PointsOfSail'

const W = 720
const H = 600
const SCALE = 1.15
const L = 100 * SCALE
const COLORS: Record<BoatId, string> = { A: '#2f7de1', B: '#f26b1d' }

const PRESETS: { label: string; A: BoatPose; B: BoatPose }[] = [
  { label: 'Port vs starboard', A: { x: 230, y: 380, heading: 45 }, B: { x: 490, y: 380, heading: 315 } },
  { label: 'Windward / leeward', A: { x: 380, y: 250, heading: 270 }, B: { x: 400, y: 400, heading: 270 } },
  { label: 'Clear astern', A: { x: 260, y: 330, heading: 270 }, B: { x: 470, y: 330, heading: 270 } },
  { label: 'Tacking boat', A: { x: 260, y: 360, heading: 10 }, B: { x: 470, y: 320, heading: 315 } },
  { label: 'Downwind', A: { x: 300, y: 240, heading: 150 }, B: { x: 430, y: 270, heading: 210 } },
]

type Drag = { boat: BoatId; kind: 'move' | 'turn'; offset: Vec } | null

export function RightOfWay({ mode: initialMode = 'rrs' }: { mode?: RulesMode }) {
  const [mode, setMode] = useState<RulesMode>(initialMode)
  const [windFrom, setWindFrom] = useState(0)
  const [boats, setBoats] = useState<Record<BoatId, BoatPose>>({ A: PRESETS[0].A, B: PRESETS[0].B })
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag>(null)

  const r = rightOfWay(boats.A, boats.B, windFrom, L, mode)

  const onDown = (boat: BoatId, kind: 'move' | 'turn') => (e: PointerEvent) => {
    if (!svgRef.current) return
    const p = svgPoint(svgRef.current, e.clientX, e.clientY)
    drag.current = { boat, kind, offset: sub(p, boats[boat]) }
    svgRef.current.setPointerCapture(e.pointerId)
    e.stopPropagation()
    e.preventDefault()
  }
  const onMove = useCallback((e: PointerEvent) => {
    const d = drag.current
    if (!d || !svgRef.current) return
    const p = svgPoint(svgRef.current, e.clientX, e.clientY)
    setBoats((b) => {
      const cur = b[d.boat]
      if (d.kind === 'move') {
        const x = Math.min(W - 40, Math.max(40, p.x - d.offset.x))
        const y = Math.min(H - 40, Math.max(40, p.y - d.offset.y))
        return { ...b, [d.boat]: { ...cur, x, y } }
      }
      return { ...b, [d.boat]: { ...cur, heading: Math.round(vecBearing(sub(p, cur)) / 5) * 5 } }
    })
  }, [])
  const onUp = () => {
    drag.current = null
  }

  const statusOf = (id: BoatId) => (r.keepClear === 'both' || r.keepClear === id ? 'keep' : 'stand')

  return (
    <SimFrame
      title="Right of Way"
      subtitle="Drag a boat to move it; drag the orange dot ahead of its bow to turn it."
      visual={
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none"
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <WaterDefs id="row" />
          <Water id="row" width={W} height={H} />
          <WindField windFrom={windFrom} width={W} height={H} speed={12} />
          <WindArrow windFrom={windFrom} cx={W / 2} cy={H / 2} r={250} />

          {/* overlap lines: a line abeam from each boat's stern */}
          {r.tacks.A === r.tacks.B &&
            (['A', 'B'] as BoatId[]).map((id) => {
              const b = boats[id]
              const stern = polar(b, b.heading + 180, 48 * SCALE)
              const p1 = polar(stern, b.heading + 90, 170)
              const p2 = polar(stern, b.heading - 90, 170)
              return (
                <line key={id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={COLORS[id]} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.6} />
              )
            })}

          {(['A', 'B'] as BoatId[]).map((id) => {
            const b = boats[id]
            const t = trimFor(b.heading, windFrom, 12)
            const handle = polar(b, b.heading, 90)
            const keep = statusOf(id) === 'keep'
            return (
              <g key={id}>
                {keep && <circle cx={b.x} cy={b.y} r={74} fill="none" stroke="var(--port)" strokeWidth={4} className="pulse-ring" />}
                <g onPointerDown={onDown(id, 'move')} style={{ cursor: 'grab' }}>
                  <circle cx={b.x} cy={b.y} r={62} fill="transparent" />
                  <Boat x={b.x} y={b.y} heading={b.heading} scale={SCALE} sail={t.sail} side={t.side} flow={t.flow} accent={COLORS[id]} label={id} />
                </g>
                <line x1={polar(b, b.heading, 62).x} y1={polar(b, b.heading, 62).y} x2={handle.x} y2={handle.y} stroke={COLORS[id]} strokeWidth={2} strokeDasharray="3 4" />
                <circle cx={handle.x} cy={handle.y} r={11} fill="var(--signal)" stroke="white" strokeWidth={3} onPointerDown={onDown(id, 'turn')} style={{ cursor: 'alias' }} />
                <g transform={`translate(${b.x} ${b.y - 96})`} pointerEvents="none">
                  <rect x={-52} y={-14} width={104} height={24} rx={12} fill={keep ? 'var(--port)' : 'var(--starboard)'} />
                  <text y={3} textAnchor="middle" fontSize={12} fontWeight={800} fill="white" letterSpacing={0.6}>
                    {keep ? 'KEEP CLEAR' : 'RIGHT OF WAY'}
                  </text>
                </g>
              </g>
            )
          })}
          {r.windward && r.overlapped && r.tacks.A === r.tacks.B && (
            <text x={20} y={H - 20} fontSize={13} fontWeight={600} fill="var(--muted)">
              Overlapped · {r.windward} is windward (closer to the wind)
            </text>
          )}
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">Golden rule:</strong> the boat that must keep clear acts <em>early and obviously</em>.
          The right-of-way boat must still avoid a collision if it can (RRS 14 / COLREG 17).
        </>
      }
    >
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'rrs', label: 'Racing Rules' },
          { value: 'colregs', label: 'Rules of the Road' },
        ]}
      />
      <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-wind px-2.5 py-0.5 text-xs font-bold text-white">{r.rule}</span>
          {(['A', 'B'] as BoatId[]).map((id) => (
            <span key={id} className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: COLORS[id] }}>
              {id}: {r.tacking[id] ? 'tacking' : `${r.tacks[id]} tack`}
            </span>
          ))}
        </div>
        <div className="font-display text-lg font-bold">{r.title}</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{r.explanation}</p>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Try a situation</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setBoats({ A: p.A, B: p.B })}
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted hover:border-sea hover:text-sea"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Slider label="Wind from" value={windFrom} min={0} max={359} unit="°" onChange={setWindFrom} />

      {mode === 'colregs' ? (
        <Callout type="rule" title="Power and sail on the Swan">
          Power usually gives way to sail — but <strong>not</strong> when you are overtaking it, and not when a large
          vessel can only navigate in a channel (Rule 9). Ferries and big boats in the river channels: keep well clear.
          Under engine, you are a power vessel.
        </Callout>
      ) : (
        <Callout type="rule" title="Order of the rules">
          Check in this order: <strong>tacking?</strong> (13) → <strong>opposite tacks?</strong> (10) →{' '}
          <strong>overlapped?</strong> windward keeps clear (11) → <strong>not overlapped?</strong> clear astern keeps
          clear (12).
        </Callout>
      )}
      <p className="text-xs text-muted">
        Boats are {(Math.hypot(boats.A.x - boats.B.x, boats.A.y - boats.B.y) / L).toFixed(1)} boat lengths apart. Dashed
        lines show each boat’s “abeam from the stern” line used to decide if boats are overlapped.
      </p>
    </SimFrame>
  )
}
