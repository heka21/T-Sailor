import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import {
  apparentWind,
  boatSpeed,
  heelAngle,
  idealSailAngle,
  pointOfSail,
  polar,
  sailFlow,
  trimEfficiency,
  type FlowState,
} from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { HeelGauge, Meter } from '../components/svg/HeelGauge'
import { Telltale, type TelltaleState } from '../components/svg/Telltale'
import { Button, Slider, Stat } from '../components/ui/controls'
import { SimFrame, Readout } from './SimFrame'

const ADVICE: Record<FlowState, { title: string; tone: string; trim: string; helm: string }> = {
  luffing: {
    title: 'Under-trimmed — sail luffing',
    tone: 'var(--port)',
    trim: 'Windward telltale is lifting. Sheet in until it streams.',
    helm: 'Or bear away (tiller towards the lifting telltale).',
  },
  stalled: {
    title: 'Over-trimmed — sail stalled',
    tone: 'var(--signal)',
    trim: 'Leeward telltale is lifting. Ease the sheet until it streams.',
    helm: 'Or head up (tiller towards the lifting telltale).',
  },
  streaming: {
    title: 'Perfect trim',
    tone: 'var(--starboard)',
    trim: 'Both telltales streaming aft. The sail is working as a wing.',
    helm: 'Hold this course and keep checking — wind shifts all the time.',
  },
  running: {
    title: 'Running — sail pushed, not lifted',
    tone: 'var(--wind)',
    trim: 'Downwind the sail is a parachute. Ease it right out, square to the wind.',
    helm: 'Telltales are less useful now — watch the boom and the wind on your neck.',
  },
}

const TELLTALES: Record<FlowState, [TelltaleState, TelltaleState]> = {
  luffing: ['lift', 'stream'],
  stalled: ['stream', 'lift'],
  streaming: ['stream', 'stream'],
  running: ['droop', 'droop'],
}

/** Streamlines past a wing section, drawn for the current flow state. */
function Airflow({ flow, x, y }: { flow: FlowState; x: number; y: number }) {
  const lines = [-48, -30, -14, 14, 30, 48]
  const foilY = (t: number) => -14 * Math.sin(Math.PI * t) // cambered section, convex side up (leeward)
  const path = (y0: number) => {
    const pts: string[] = []
    for (let i = 0; i <= 40; i++) {
      const xx = -150 + i * 7.5
      const t = (xx + 70) / 140
      let yy = y0
      const near = Math.exp(-((xx / 85) ** 2))
      if (flow === 'streaming' || flow === 'stalled') {
        yy += foilY(Math.min(1, Math.max(0, t))) * near * (y0 < 0 ? 1.1 : 0.7)
        yy += 10 * (1 / (1 + Math.exp(-xx / 30))) // flow turned by the sail = lift
      }
      if (flow === 'stalled' && y0 < 0 && y0 > -35 && xx > 10) return pts.join(' ')
      pts.push(`${i ? 'L' : 'M'}${xx.toFixed(1)},${yy.toFixed(1)}`)
    }
    return pts.join(' ')
  }
  const foil = flow === 'luffing' ? 'M-70,0 Q0,6 70,4' : 'M-70,0 Q0,-30 70,6'
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-160} y={-80} width={320} height={160} rx={18} fill="var(--surface)" opacity={0.85} />
      <text x={-146} y={-60} fontSize={12} fontWeight={700} fill="var(--muted)" letterSpacing={1}>
        AIRFLOW (SAIL FROM ABOVE)
      </text>
      <g clipPath="url(#trim-clip)">
        {lines.map((y0) => (
          <path key={y0} d={path(y0)} fill="none" stroke="var(--wind)" strokeWidth={2} className="flow-line" opacity={0.75} />
        ))}
        {flow === 'stalled' &&
          [
            [30, -26],
            [70, -18],
            [108, -30],
          ].map(([cx, cy], i) => (
            <g key={i} className="vortex">
              <path
                d={`M${cx + 10},${cy} a10,10 0 1,1 -10,-10 a6,6 0 1,1 -6,6`}
                fill="none"
                stroke="var(--signal)"
                strokeWidth={2}
              />
            </g>
          ))}
      </g>
      <path d={foil} fill="none" stroke="var(--ink)" strokeWidth={4} strokeLinecap="round" />
      <text x={0} y={70} textAnchor="middle" fontSize={12} fill="var(--muted)">
        {flow === 'stalled'
          ? 'Flow breaks away on the leeward side'
          : flow === 'luffing'
            ? 'Sail lined up with the wind — no lift'
            : flow === 'running'
              ? 'Wind pushes the sail from behind'
              : 'Smooth flow on both sides = lift'}
      </text>
      <clipPath id="trim-clip">
        <rect x={-155} y={-75} width={310} height={130} />
      </clipPath>
    </g>
  )
}

export function SailTrim() {
  const [twa, setTwa] = useState(60)
  const [sheet, setSheet] = useState(15)
  const tws = 12

  // Wind fixed from the top; the boat is on starboard tack so sails sit to port.
  const heading = -twa
  const potential = boatSpeed(tws, twa)
  const aw0 = apparentWind(tws, twa, potential)
  const flow = sailFlow(aw0.angle, sheet)
  const eff = trimEfficiency(aw0.angle, sheet)
  const bs = potential * (0.15 + 0.85 * eff)
  const aw = apparentWind(tws, twa, bs)
  const aoa = Math.abs(aw0.angle) - sheet
  // Telltales stream across a range of trims; within it, nudge towards the sweet spot.
  const advice =
    flow === 'streaming' && eff < 0.8
      ? {
          ...ADVICE.streaming,
          title: 'Good — fine-tune it',
          tone: 'var(--sea)',
          trim: aoa > 18 ? 'Telltales streaming, but the sail is a little tight. Ease a touch for more drive.' : 'Telltales streaming, but you could sheet in a touch for more power.',
        }
      : ADVICE[flow]
  const ideal = idealSailAngle(aw0.angle)
  const [windward, leeward] = TELLTALES[flow]
  const pos = pointOfSail(twa)
  const heel = -heelAngle(aw.speed, aw.angle, eff)

  return (
    <SimFrame
      title="Sail Trim & Telltales"
      subtitle="Choose a course, then trim the sheet until both telltales stream."
      visual={
        <svg viewBox="0 0 720 560" className="block h-auto w-full select-none">
          <WaterDefs id="trim" />
          <Water id="trim" width={720} height={560} />
          <WindField windFrom={0} width={720} height={560} speed={tws} />
          <WindArrow windFrom={0} cx={190} cy={300} r={210} speed={tws} />
          <Boat x={190} y={320} heading={heading} scale={1.9} sail={sheet} side={-1} flow={flow === 'luffing' ? 'luffing' : undefined} />
          {/* apparent wind at the masthead */}
          {(() => {
            const mast = polar({ x: 190, y: 320 }, heading, 19)
            const tail = polar(mast, heading + aw.angle, 120)
            return (
              <g>
                <line x1={tail.x} y1={tail.y} x2={mast.x} y2={mast.y} stroke="var(--signal)" strokeWidth={3} strokeDasharray="7 5" />
                <circle cx={tail.x} cy={tail.y} r={4} fill="var(--signal)" />
                <text x={tail.x} y={tail.y - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--signal)">
                  apparent wind
                </text>
              </g>
            )
          })()}

          {/* telltale close-up */}
          <g transform="translate(540 150)">
            <rect x={-160} y={-120} width={320} height={210} rx={18} fill="var(--surface)" opacity={0.92} />
            <text x={-146} y={-98} fontSize={12} fontWeight={700} fill="var(--muted)" letterSpacing={1}>
              JIB LUFF — TELLTALES
            </text>
            <path d="M-40,-80 L-40,70 L120,70 Z" fill="var(--sail)" stroke="var(--sail-edge)" strokeWidth={2} opacity={0.95} />
            <line x1={-40} y1={-90} x2={-40} y2={80} stroke="var(--ink)" strokeWidth={2.5} />
            <Telltale x={-40} y={-30} state={windward} color="var(--port)" />
            <Telltale x={-40} y={20} state={leeward} color="var(--starboard)" />
            <text x={20} y={-34} fontSize={11.5} fill="var(--port)" fontWeight={700}>
              windward
            </text>
            <text x={20} y={46} fontSize={11.5} fill="var(--starboard)" fontWeight={700}>
              leeward
            </text>
          </g>
          <Airflow flow={flow} x={540} y={410} />
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">Memory hook:</strong> “Windward lifts — sheet in. Leeward lifts — let it out.” On
          the helm with a tiller: move the tiller <em>towards</em> the telltale that is lifting.
        </>
      }
    >
      <div className="rounded-2xl border px-4 py-3" style={{ borderColor: advice.tone, background: 'var(--surface-2)' }}>
        <div className="font-display text-xl font-bold" style={{ color: advice.tone }}>
          {advice.title}
        </div>
        <p className="mt-1 text-sm text-ink">{advice.trim}</p>
        <p className="mt-0.5 text-sm text-muted">{advice.helm}</p>
      </div>

      <div className="space-y-2">
        <Slider
          label="Course (angle to the true wind)"
          value={twa}
          min={30}
          max={180}
          unit="°"
          onChange={setTwa}
          hint={pos.name}
        />
        <Slider
          label="Sheet"
          value={sheet}
          min={0}
          max={90}
          onChange={setSheet}
          format={(v) => (v < 8 ? 'pulled hard in' : v > 75 ? 'fully eased' : `eased ${Math.round(v)}°`)}
        />
      </div>

      <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-3">
        <HeelGauge heel={heel} size={112} />
        <div className="flex-1 space-y-2">
          <Meter label={`Sail drive ${Math.round(eff * 100)}%`} value={eff} color={advice.tone} />
          <Meter label={`Speed ${bs.toFixed(1)} kn`} value={bs / 7} color="var(--signal)" />
        </div>
      </div>

      <Readout>
        <Stat label="Apparent wind" value={`${Math.round(Math.abs(aw.angle))}°`} sub={`${aw.speed.toFixed(0)} kn over the deck`} />
        <Stat label="Angle of attack" value={`${Math.round(aoa)}°`} sub="sweet spot ≈ 15–22°" />
      </Readout>

      <Button variant="soft" onClick={() => setSheet(Math.round(ideal))}>
        <Wand2 size={16} /> Show me the right trim
      </Button>
    </SimFrame>
  )
}
