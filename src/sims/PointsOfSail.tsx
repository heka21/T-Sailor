import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeftRight, LayoutGrid, TriangleAlert } from 'lucide-react'
import {
  NO_GO,
  POINTS_OF_SAIL,
  apparentWind,
  boatSpeed,
  heelAngle,
  idealSailAngle,
  norm180,
  norm360,
  pointOfSail,
  polar,
  sectorPath,
  tackOf,
  vecBearing,
  windAngle,
  type PointOfSail,
  type Vec,
} from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { HeelGauge, Meter } from '../components/svg/HeelGauge'
import { useSvgDrag } from '../components/svg/pointer'
import { Button, Slider, Stat, Toggle } from '../components/ui/controls'
import { SimFrame, Readout } from './SimFrame'
import { useTween } from './useTween'

export const POS_COLORS: Record<PointOfSail['id'], string> = {
  'no-go': '#e5484d',
  'close-hauled': '#0b7285',
  'close-reach': '#1098ad',
  'beam-reach': '#15aabf',
  'broad-reach': '#3bc9db',
  run: '#66d9e8',
}

const W = 720
const H = 660
const C: Vec = { x: 360, y: 330 }
const R0 = 150
const R1 = 205
/** Within this many degrees of dead downwind the boat risks an accidental gybe. */
const GYBE_DANGER = 15

/** Where the boat gets into trouble: stalled head-to-wind, or nearly dead downwind. */
function dangerOf(twa: number) {
  const a = Math.abs(twa)
  if (a < NO_GO) {
    return {
      id: 'no-go' as const,
      title: 'Danger zone: no-go',
      text: 'Too close to the wind — the sails flap, you lose steering and end up in irons. Bear away until the sails fill.',
    }
  }
  if (a > 180 - GYBE_DANGER) {
    return {
      id: 'gybe' as const,
      title: 'Danger zone: accidental gybe',
      text: 'The wind is almost dead behind. A wave or a small steering error can slam the boom across the boat. Head up a few degrees, and keep heads low.',
    }
  }
  return null
}

/** Everything a boat needs to draw itself correctly for a heading in a given wind. */
export function trimFor(heading: number, windFrom: number, tws: number) {
  const twa = windAngle(heading, windFrom)
  const pos = pointOfSail(twa)
  const bs = boatSpeed(tws, twa)
  const aw = apparentWind(tws, twa, bs)
  const noGo = pos.id === 'no-go'
  return {
    twa,
    pos,
    bs,
    aw,
    tack: tackOf(twa),
    sail: noGo ? 2 : idealSailAngle(aw.angle),
    side: (twa >= 0 ? -1 : 1) as 1 | -1,
    flow: noGo ? ('luffing' as const) : undefined,
    heel: noGo ? 0 : heelAngle(aw.speed, aw.angle) * (twa >= 0 ? 1 : -1) * -1,
  }
}

export function PointsOfSail({ wind: windProp, speed: speedProp }: { wind?: number; speed?: number }) {
  const [params] = useSearchParams()
  const initWind = windProp ?? (params.get('wind') ? Number(params.get('wind')) : 0)
  const initSpeed = speedProp ?? (params.get('tws') ? Number(params.get('tws')) : 12)

  const [windFrom, setWindFrom] = useState(initWind)
  const [heading, setHeading] = useState(norm360(initWind - 70))
  const [tws, setTws] = useState(initSpeed)
  const [classic, setClassic] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const tween = useTween()

  const s = trimFor(heading, windFrom, tws)
  const danger = dangerOf(s.twa)

  const steer = useCallback((p: Vec) => setHeading(Math.round(vecBearing({ x: p.x - C.x, y: p.y - C.y }))), [])
  const turnWind = useCallback((p: Vec) => setWindFrom(Math.round(vecBearing({ x: p.x - C.x, y: p.y - C.y }))), [])
  const steerDrag = useSvgDrag(svgRef, steer)
  const windDrag = useSvgDrag(svgRef, turnWind)

  /** Animate to the other tack: through the wind (tack) or through dead downwind (gybe). */
  const switchTack = () => {
    const a = s.twa
    const isTack = Math.abs(a) < 90
    tween(isTack ? 1600 : 1800, (t) => {
      const twa = isTack ? a * (1 - 2 * t) : norm180(a + Math.sign(a || 1) * (360 - 2 * Math.abs(a)) * t)
      setHeading(norm360(windFrom - twa))
    })
  }

  const goTo = (id: PointOfSail['id']) => {
    const p = POINTS_OF_SAIL.find((x) => x.id === id)!
    const target = id === 'run' ? 175 : (p.from + Math.min(p.to, 180)) / 2
    const sign = s.twa >= 0 ? 1 : -1
    const fromTwa = s.twa
    const toTwa = sign * target
    tween(700, (t) => setHeading(norm360(windFrom - (fromTwa + (toTwa - fromTwa) * t))))
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setHeading((h) => norm360(h - 5))
    else if (e.key === 'ArrowRight') setHeading((h) => norm360(h + 5))
    else return
    e.preventDefault()
  }

  const sectors = POINTS_OF_SAIL.flatMap((p) => {
    const to = Math.min(p.to, 180)
    if (p.id === 'no-go') return [{ p, side: 0, a: windFrom - to, b: windFrom + to, mid: windFrom }]
    return [
      { p, side: 1, a: windFrom - to, b: windFrom - p.from, mid: windFrom - (p.from + to) / 2 },
      { p, side: -1, a: windFrom + p.from, b: windFrom + to, mid: windFrom + (p.from + to) / 2 },
    ]
  })
  const twaSide = s.twa >= 0 ? 1 : -1
  const dangerZones = [
    { id: 'no-go', a: windFrom - NO_GO, b: windFrom + NO_GO, mid: windFrom },
    { id: 'gybe', a: windFrom + 180 - GYBE_DANGER, b: windFrom + 180 + GYBE_DANGER, mid: windFrom + 180 },
  ] as const
  const windHandle = polar(C, windFrom, 270)

  return (
    <SimFrame
      title="Points of Sail"
      subtitle="Drag anywhere on the water to steer. Drag the blue arrow to change the wind."
      visual={
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none outline-none"
          tabIndex={0}
          onKeyDown={onKey}
          role="application"
          aria-label={`Points of sail. Heading ${Math.round(heading)} degrees, ${s.pos.name}, ${s.tack} tack. Use left and right arrows to steer.`}
        >
          <WaterDefs id="pos" />
          <defs>
            <pattern id="pos-danger" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={10} stroke="var(--port)" strokeWidth={3.5} strokeOpacity={0.55} />
            </pattern>
          </defs>
          <Water id="pos" width={W} height={H} />
          <WindField windFrom={windFrom} width={W} height={H} speed={tws} />
          <rect width={W} height={H} fill="transparent" {...steerDrag} style={{ cursor: 'crosshair' }} />

          <g pointerEvents="none">
            {sectors.map(({ p, a, b, side }, i) => {
              const active = p.id === s.pos.id && (side === 0 || side === twaSide)
              return (
                <path
                  key={i}
                  d={sectorPath(C, R0, R1, a, b)}
                  fill={POS_COLORS[p.id]}
                  fillOpacity={active ? 0.85 : 0.32}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              )
            })}
            {/* danger zones: hatched over the ring, with a warning sign */}
            {dangerZones.map(({ id, a, b, mid }) => {
              const active = danger?.id === id
              const at = polar(C, mid, (R0 + R1) / 2)
              return (
                <g key={id}>
                  <path
                    d={sectorPath(C, R0, R1, a, b)}
                    fill="url(#pos-danger)"
                    stroke="var(--port)"
                    strokeWidth={active ? 3 : 1.5}
                    strokeDasharray={active ? undefined : '5 4'}
                  />
                  <g transform={`translate(${at.x} ${at.y})`}>
                    <path d="M0,-11 L11,8 L-11,8 Z" fill="var(--port)" stroke="white" strokeWidth={2} strokeLinejoin="round" />
                    <text y={6} textAnchor="middle" fontSize={12} fontWeight={800} fill="white">
                      !
                    </text>
                  </g>
                </g>
              )
            })}
            {sectors.map(({ p, mid: m, side }, i) => {
              // The run straddles dead downwind: label it once, directly downwind.
              if (p.id === 'run' && side === -1) return null
              const mid = p.id === 'run' ? windFrom + 180 : m
              const at = polar(C, mid, R1 + 16)
              const rel = norm180(mid)
              const anchor = Math.abs(rel) < 15 || Math.abs(rel) > 165 ? 'middle' : rel > 0 ? 'start' : 'end'
              const dy = Math.abs(rel) < 15 ? -4 : Math.abs(rel) > 165 ? 14 : 5
              return (
                <text
                  key={i}
                  x={at.x}
                  y={at.y + dy}
                  textAnchor={anchor}
                  fontSize={15}
                  fontWeight={p.id === s.pos.id ? 700 : 500}
                  fill={p.id === 'no-go' ? 'var(--port)' : 'var(--ink)'}
                  opacity={p.id === s.pos.id ? 1 : 0.7}
                >
                  {p.id === 'no-go' ? 'No-go zone' : p.name}
                </text>
              )
            })}
            {/* tack labels on each side */}
            {[
              { b: windFrom - 152, t: 'STARBOARD TACK SIDE', c: 'var(--starboard)' },
              { b: windFrom + 152, t: 'PORT TACK SIDE', c: 'var(--port)' },
            ].map(({ b, t, c }) => {
              const p = polar(C, b, 292)
              return (
                <text key={t} x={p.x} y={p.y} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1.5} fill={c} opacity={0.75}>
                  {t}
                </text>
              )
            })}
          </g>

          {classic ? (
            <g>
              {sectors
                .filter((x) => x.p.id !== 'no-go')
                .concat([{ ...sectors[0], mid: windFrom }])
                .map(({ mid }, i) => {
                  const at = polar(C, mid, R0 - 48)
                  const h = norm360(mid) // each boat points out through its own sector
                  const t = trimFor(h, windFrom, tws)
                  return (
                    <g key={i} onClick={() => { setHeading(h); setClassic(false) }} style={{ cursor: 'pointer' }}>
                      <Boat x={at.x} y={at.y} heading={h} scale={0.48} sail={t.sail} side={t.side} flow={t.flow} accent={POS_COLORS[t.pos.id]} sideColours />
                    </g>
                  )
                })}
            </g>
          ) : (
            <g pointerEvents="none">
              <line
                x1={C.x}
                y1={C.y}
                x2={polar(C, heading, R0 - 6).x}
                y2={polar(C, heading, R0 - 6).y}
                stroke="var(--ink)"
                strokeOpacity={0.35}
                strokeWidth={2}
                strokeDasharray="4 6"
              />
              <Boat x={C.x} y={C.y} heading={heading} scale={2.05} sail={s.sail} side={s.side} flow={s.flow} accent={POS_COLORS[s.pos.id]} sideColours />
              <circle cx={polar(C, heading, R0 - 6).x} cy={polar(C, heading, R0 - 6).y} r={9} fill="var(--signal)" stroke="white" strokeWidth={2.5} />
            </g>
          )}

          <WindArrow windFrom={windFrom} cx={C.x} cy={C.y} r={270} speed={tws} />
          <circle cx={windHandle.x} cy={windHandle.y} r={30} fill="transparent" {...windDrag} style={{ cursor: 'grab' }} />
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">Why it matters:</strong> a sail is a wing. It needs the wind flowing across it at a
          small angle — so the closer you sail to the wind, the tighter you pull the sheets in. Point straight into the
          wind and no amount of trimming helps.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-2xl font-bold" style={{ color: POS_COLORS[s.pos.id] }}>
          {s.pos.name}
        </span>
        {s.tack !== 'head-to-wind' && s.pos.id !== 'no-go' && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide text-white uppercase"
            style={{ background: s.tack === 'port' ? 'var(--port)' : 'var(--starboard)' }}
          >
            {s.tack} tack
          </span>
        )}
      </div>
      <p className="-mt-2 text-[15px] leading-snug text-muted">{s.pos.description}</p>

      {danger && (
        <div role="alert" className="flex gap-2.5 rounded-2xl border border-port/40 bg-port/10 p-3 text-sm leading-snug">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-port" />
          <div>
            <div className="font-bold text-port">{danger.title}</div>
            <div className="text-ink">{danger.text}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-port" /> Port side — red (left, facing the bow)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-starboard" /> Starboard side — green (right)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-sm border border-port" style={{ background: 'repeating-linear-gradient(45deg, var(--port) 0 2px, transparent 2px 5px)' }} />
          Danger zone
        </span>
      </div>

      <Readout>
        <Stat label="True wind angle" value={`${Math.round(Math.abs(s.twa))}°`} sub={s.twa >= 0 ? 'over starboard side' : 'over port side'} />
        <Stat label="Boat speed" value={`${s.bs.toFixed(1)} kn`} sub={`apparent wind ${s.aw.speed.toFixed(0)} kn`} />
      </Readout>

      <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-3">
        <HeelGauge heel={s.heel} size={112} />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-semibold text-ink">{s.pos.trim}</div>
          <Meter label={`Sheets eased ${Math.round(s.sail)}°`} value={s.sail / 85} color={POS_COLORS[s.pos.id]} />
          <Meter label="Speed" value={s.bs / 7} color="var(--signal)" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['close-hauled', 'close-reach', 'beam-reach', 'broad-reach', 'run'] as const).map((id) => (
          <button
            key={id}
            onClick={() => goTo(id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              s.pos.id === id ? 'border-transparent text-white' : 'border-line text-muted hover:text-ink'
            }`}
            style={s.pos.id === id ? { background: POS_COLORS[id] } : undefined}
          >
            {POINTS_OF_SAIL.find((p) => p.id === id)!.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" onClick={switchTack} disabled={s.pos.id === 'no-go'}>
          <ArrowLeftRight size={16} />
          {Math.abs(s.twa) < 90 ? 'Tack' : 'Gybe'} onto {s.tack === 'port' ? 'starboard' : 'port'}
        </Button>
        <Button variant="ghost" onClick={() => setClassic((c) => !c)}>
          <LayoutGrid size={16} /> {classic ? 'Back to steering' : 'Classic diagram'}
        </Button>
      </div>

      <div className="space-y-2">
        <Slider label="Heading" value={Math.round(heading)} min={0} max={359} unit="°" onChange={setHeading} />
        <Slider label="Wind from" value={Math.round(windFrom)} min={0} max={359} unit="°" onChange={setWindFrom} />
        <Slider label="Wind speed" value={tws} min={2} max={30} unit=" kn" onChange={setTws} />
      </div>
      <Toggle checked={classic} onChange={setClassic} label="Show every point of sail at once" />
    </SimFrame>
  )
}
