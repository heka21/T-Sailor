import { useState } from 'react'
import { apparentWind, boatSpeed, idealSailAngle, polar, type Vec } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindField } from '../components/svg/Wind'
import { Slider, Stat, Toggle } from '../components/ui/controls'
import { SimFrame, Readout } from './SimFrame'

const MAST: Vec = { x: 300, y: 300 }

function Arrow({ from, to, color, label, dashed, width = 5 }: { from: Vec; to: Vec; color: string; label?: string; dashed?: boolean; width?: number }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len < 4) return null
  const ux = dx / len
  const uy = dy / len
  const head = 16
  const base = { x: to.x - ux * head, y: to.y - uy * head }
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  return (
    <g>
      <line x1={from.x} y1={from.y} x2={base.x} y2={base.y} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '8 7' : undefined} />
      <path d={`M${to.x},${to.y} L${base.x - uy * 9},${base.y + ux * 9} L${base.x + uy * 9},${base.y - ux * 9} Z`} fill={color} />
      {label && (
        <text x={mid.x - uy * 18} y={mid.y + ux * 18 + 4} textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>
          {label}
        </text>
      )}
    </g>
  )
}

const PRESETS = [
  { label: 'Beat', twa: 45 },
  { label: 'Beam reach', twa: 90 },
  { label: 'Broad reach', twa: 135 },
  { label: 'Run', twa: 180 },
]

export function ApparentWind() {
  const [tws, setTws] = useState(12)
  const [twa, setTwa] = useState(90)
  const [auto, setAuto] = useState(true)
  const [manualBs, setManualBs] = useState(5)
  const bs = auto ? boatSpeed(tws, twa) : manualBs
  const aw = apparentWind(tws, twa, bs)
  const sail = idealSailAngle(aw.angle)

  // Wind arrows point the way the air moves and end at the mast. Boat heads north (up).
  const K = Math.min(11, 260 / Math.max(aw.speed, tws, 1))
  const trueTail = polar(MAST, twa, tws * K)
  const boatTail = polar(MAST, 0, bs * K)
  const appTail = polar(MAST, aw.angle, aw.speed * K)
  const shift = Math.abs(twa) - Math.abs(aw.angle)
  const buoy = { x: 520, y: 470 }
  const flagTip = polar(buoy, twa + 180, 34)

  return (
    <SimFrame
      title="Apparent Wind"
      subtitle="The wind you feel on a moving boat is the true wind plus the wind made by your own speed."
      visual={
        <svg viewBox="0 0 600 600" className="block h-auto w-full select-none">
          <WaterDefs id="aw" />
          <Water id="aw" width={600} height={600} />
          <WindField windFrom={twa} width={600} height={600} speed={tws} density={0.7} />
          {/* moored buoy shows TRUE wind */}
          <g>
            <circle cx={buoy.x} cy={buoy.y} r={13} fill="var(--signal)" stroke="white" strokeWidth={2} />
            <line x1={buoy.x} y1={buoy.y} x2={flagTip.x} y2={flagTip.y} stroke="var(--wind)" strokeWidth={4} strokeLinecap="round" />
            <text x={buoy.x} y={buoy.y + 32} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--muted)">
              moored buoy: true wind
            </text>
          </g>
          <Boat x={MAST.x} y={MAST.y + 22} heading={0} scale={2.2} sail={sail} side={twa >= 0 ? -1 : 1} />
          {/* triangle: true + boat wind = apparent */}
          <line x1={trueTail.x} y1={trueTail.y} x2={appTail.x} y2={appTail.y} stroke="var(--muted)" strokeWidth={2} strokeDasharray="4 5" opacity={0.7} />
          <Arrow from={boatTail} to={MAST} color="var(--muted)" label={bs > 1 ? 'boat speed wind' : undefined} width={4} />
          <Arrow from={trueTail} to={MAST} color="var(--wind)" label="true" />
          <Arrow from={appTail} to={MAST} color="var(--signal)" label="apparent" width={6} />
          {/* masthead burgee shows APPARENT wind */}
          <line x1={MAST.x} y1={MAST.y} x2={polar(MAST, aw.angle + 180, 30).x} y2={polar(MAST, aw.angle + 180, 30).y} stroke="var(--signal)" strokeWidth={4} strokeLinecap="round" />
          <circle cx={MAST.x} cy={MAST.y} r={5} fill="var(--ink)" />
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">The big idea:</strong> as the boat speeds up, the apparent wind moves{' '}
          <em>forward</em> — so you sheet in. Upwind it feels windier than it really is; downwind it feels calmer. That’s
          why a run can feel deceptively gentle until you turn back upwind!
        </>
      }
    >
      <Readout>
        <Stat label="True wind" value={`${tws} kn`} sub={`${Math.round(twa)}° off the bow`} tone="var(--wind)" />
        <Stat label="Apparent wind" value={`${aw.speed.toFixed(1)} kn`} sub={`${Math.round(Math.abs(aw.angle))}° off the bow`} tone="var(--signal)" />
        <Stat label="Boat speed" value={`${bs.toFixed(1)} kn`} />
        <Stat label="Shift forward" value={`${Math.round(shift)}°`} sub={aw.speed > tws ? `${(aw.speed - tws).toFixed(1)} kn stronger` : `${(tws - aw.speed).toFixed(1)} kn lighter`} />
      </Readout>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setTwa(p.twa)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${twa === p.twa ? 'border-sea bg-sea text-white' : 'border-line text-muted hover:text-ink'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <Slider label="True wind angle" value={twa} min={30} max={180} unit="°" onChange={setTwa} />
        <Slider label="True wind speed" value={tws} min={0} max={25} unit=" kn" onChange={setTws} />
        <Toggle checked={auto} onChange={setAuto} label="Boat speed from a real keelboat" />
        {!auto && <Slider label="Boat speed" value={manualBs} min={0} max={12} step={0.5} unit=" kn" onChange={setManualBs} />}
      </div>
    </SimFrame>
  )
}
