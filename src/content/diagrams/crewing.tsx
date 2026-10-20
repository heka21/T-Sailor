import { useState } from 'react'
import { motion } from 'motion/react'
import { sectorPath } from '../../lib/sailing'
import { Boat } from '../../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../../components/svg/Wind'
import { Slider } from '../../components/ui/controls'
import { Stepper } from '../../components/ui/Stepper'
import { Figure, Label } from './Figure'

/** Where things can hurt you on a keelboat. */
export function SafetyZones() {
  const [zone, setZone] = useState<string | null>(null)
  const zones = [
    { id: 'boom', label: 'Boom swing', x: 300, y: 330, r: 0, color: 'var(--port)', text: 'The boom swings across in a tack or gybe. Keep your head below it and never stand in its path. In a gybe it can hit with real force.' },
    { id: 'winch', label: 'Winches & sheets', x: 230, y: 420, r: 0, color: 'var(--signal)', text: 'Sheets under load can trap fingers. Keep hands well back from the winch drum and never wrap rope around your hand.' },
    { id: 'bow', label: 'Foredeck', x: 300, y: 150, r: 0, color: 'var(--wind)', text: '“One hand for you, one for the boat.” Move forward on the windward (high) side, staying low.' },
    { id: 'lines', label: 'Ropes on deck', x: 380, y: 420, r: 0, color: '#7c5cff', text: 'Don’t stand on loose ropes or in a coil — it can tighten around your foot. Keep the cockpit tidy.' },
  ]
  const current = zones.find((z) => z.id === zone)
  return (
    <Figure caption={current ? <><strong className="text-ink">{current.label}:</strong> {current.text}</> : 'Tap a hazard to see how to stay safe.'}>
      <svg viewBox="0 0 600 560" className="block h-auto w-full">
        <WaterDefs id="sz" />
        <Water id="sz" width={600} height={560} />
        <Boat x={300} y={300} heading={0} scale={4} sail={30} side={-1} />
        {/* boom sweep arc */}
        <path d="M300,260 L148,420 A220,220 0 0,0 452,420 Z" fill="var(--port)" opacity={zone === 'boom' ? 0.3 : 0.12} />
        {zones.map((z) => (
          <g key={z.id} onClick={() => setZone(z.id)} style={{ cursor: 'pointer' }}>
            <circle cx={z.x} cy={z.y} r={zone === z.id ? 36 : 28} fill={z.color} opacity={0.25} className={zone === z.id ? '' : 'pulse-ring'} />
            <circle cx={z.x} cy={z.y} r={14} fill={z.color} stroke="white" strokeWidth={3} />
            <Label x={z.x} y={z.y + 5} color="white" size={13}>!</Label>
            <Label x={z.x} y={z.y - 26} size={13} color={z.color}>{z.label}</Label>
          </g>
        ))}
      </svg>
    </Figure>
  )
}

/** Loading, using and releasing a winch. */
export function WinchSteps() {
  const steps = [
    { title: 'Wrap clockwise', body: 'Put the sheet on the winch drum clockwise (look down at the top — the rope goes round like a clock). Start with 2 turns while the load is light.' },
    { title: 'Pull in hand over hand', body: 'While the sail is flapping (e.g. mid-tack) pull fast, hand over hand. Keep your hands at least a hand-width from the drum.' },
    { title: 'Add turns & winch', body: 'As load builds add a 3rd or 4th turn. Insert the handle and wind. On a self-tailer the rope feeds into the jaws at the top.' },
    { title: 'Cleat or tail', body: 'Cleat it off or hold the tail. Remove the handle and stow it — a handle left in can fly out when the sheet is released.' },
    { title: 'Ease under control', body: 'To ease: keep tension on the tail, and use the flat of your palm on the turns to let rope slip around the drum a little at a time.' },
    { title: 'Release in a tack', body: 'Take the turns off by lifting them upward off the drum in one move — hands away! Never put fingers between rope and drum.' },
  ]
  const Visual = (i: number) => {
    const turns = i === 0 || i === 1 ? 2 : i === 5 ? 0 : 4
    return (
      <svg viewBox="0 0 400 320" className="block h-auto w-full">
        <rect width="400" height="320" fill="var(--surface-2)" />
        <ellipse cx={200} cy={250} rx={110} ry={30} fill="#64748b" opacity={0.4} />
        <rect x={130} y={100} width={140} height={150} rx={18} fill="#9aa8b5" stroke="var(--ink)" strokeWidth={2} />
        <ellipse cx={200} cy={100} rx={70} ry={20} fill="#c6d0d9" stroke="var(--ink)" strokeWidth={2} />
        {Array.from({ length: turns }).map((_, k) => (
          <motion.path
            key={k}
            d={`M130,${220 - k * 26} Q200,${244 - k * 26} 270,${212 - k * 26}`}
            fill="none"
            stroke="#e9b44c"
            strokeWidth={11}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: k * 0.2 }}
          />
        ))}
        {turns > 0 && <path d={`M270,${212 - (turns - 1) * 26} Q330,${200 - (turns - 1) * 26} 370,${160 - turns * 20}`} fill="none" stroke="#e9b44c" strokeWidth={11} strokeLinecap="round" />}
        <path d="M30,240 Q90,232 130,220" fill="none" stroke="#e9b44c" strokeWidth={11} strokeLinecap="round" opacity={turns ? 1 : 0.4} />
        <Label x={50} y={226} size={12} color="var(--muted)">to the sail</Label>
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} style={{ transformBox: 'view-box', originX: '200px', originY: '100px' }}>
          <path d="M200,100 m0,-16 a16,16 0 1,1 -0.1,0" fill="none" stroke="var(--sea)" strokeWidth={4} strokeDasharray="8 6" />
        </motion.g>
        <Label x={200} y={40} size={13} color="var(--sea)">clockwise ↻ (seen from above)</Label>
        {i === 2 && <line x1={200} y1={100} x2={300} y2={70} stroke="var(--ink)" strokeWidth={8} strokeLinecap="round" />}
        {i === 5 && <Label x={200} y={180} size={14} color="var(--port)">turns lifted off — hands clear!</Label>}
      </svg>
    )
  }
  return <Stepper title="Using a winch" steps={steps} visual={Visual} />
}

/** Tiller works "backwards": push it one way, the bow goes the other. */
export function RudderDemo() {
  const [tiller, setTiller] = useState(0)
  const turn = -tiller // bow turns opposite to the tiller
  const path = (() => {
    let x = 300
    let y = 470
    let h = 0
    let d = `M${x},${y}`
    for (let i = 0; i < 40; i++) {
      h += turn * 0.09
      x += Math.sin((h * Math.PI) / 180) * 9
      y -= Math.cos((h * Math.PI) / 180) * 9
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`
    }
    return d
  })()
  return (
    <Figure
      caption={
        <>
          Push the tiller to <strong className="text-ink">port</strong> and the bow turns to <strong className="text-ink">starboard</strong> — the rudder
          pushes the stern the other way. Small, smooth movements are best: a big rudder angle acts like a brake.
        </>
      }
      controls={<Slider label="Tiller" value={tiller} min={-30} max={30} onChange={setTiller} format={(v) => (v === 0 ? 'centred' : v > 0 ? `${v}° to starboard` : `${-v}° to port`)} />}
    >
      <svg viewBox="0 0 600 520" className="block h-auto w-full">
        <WaterDefs id="rd" />
        <Water id="rd" width={600} height={520} />
        <path d={path} fill="none" stroke="white" strokeWidth={4} strokeDasharray="6 7" opacity={0.85} />
        <Boat x={300} y={380} heading={0} scale={2.4} sail={20} side={-1} tiller={tiller} />
        {/* rudder blade */}
        <g transform="translate(300 499) scale(2.4)">
          <line x1={0} y1={-5} x2={-Math.sin((tiller * Math.PI) / 180) * 10} y2={3} stroke="var(--signal)" strokeWidth={4} strokeLinecap="round" />
        </g>
        <Label x={300} y={40} color="var(--muted)" size={13}>
          {tiller === 0 ? 'Straight ahead' : `Boat turns to ${tiller > 0 ? 'PORT ←' : 'STARBOARD →'}`}
        </Label>
      </svg>
    </Figure>
  )
}

/** Steering upwind: pinching, in the groove, footing. */
export function UpwindGroove() {
  const lanes = [
    { h: -32, label: 'Pinching', note: 'Too close: windward telltales lift, slow', color: 'var(--port)' },
    { h: -45, label: 'In the groove', note: 'Telltales streaming — fast and high', color: 'var(--starboard)' },
    { h: -60, label: 'Footing', note: 'Fast but not making ground upwind', color: 'var(--wind)' },
  ]
  return (
    <Figure caption="Upwind you steer a narrow ‘groove’. Too high and the sails stall at the luff; too low and you sail fast in the wrong direction. Steer by the jib telltales and the feel of the heel.">
      <svg viewBox="0 0 600 440" className="block h-auto w-full">
        <WaterDefs id="ug" />
        <Water id="ug" width={600} height={440} />
        <WindField windFrom={0} width={600} height={440} speed={12} density={0.6} />
        <WindArrow windFrom={0} cx={300} cy={260} r={200} label />
        {lanes.map((l, i) => {
          const x = 140 + i * 160
          return (
            <g key={l.label}>
              <Boat x={x} y={300} heading={l.h} scale={1.1} sail={i === 0 ? 3 : i === 1 ? 12 : 26} side={-1} flow={i === 0 ? 'luffing' : undefined} accent={l.color} />
              <Label x={x} y={390} color={l.color}>{l.label}</Label>
              <Label x={x} y={410} size={11} weight={500} color="var(--muted)">{l.note}</Label>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Running: by the lee and the risk of an accidental gybe. */
export function ByTheLee() {
  const [twa, setTwa] = useState(165)
  // positive = wind over starboard (main to port). Beyond 180 = by the lee.
  const byLee = twa > 180
  const danger = twa > 188
  return (
    <Figure
      caption={
        danger
          ? 'Danger! Sailing by the lee — the wind is coming over the same side as the boom. It can gybe at any moment. Head up!'
          : byLee
            ? 'Slightly by the lee — the leech of the main may start to flick. Steer back up a few degrees.'
            : 'Safe running: wind over the opposite side to the boom. Watch the burgee and the jib (it collapses as you approach by the lee).'
      }
      controls={<Slider label="Course" value={twa} min={140} max={200} onChange={setTwa} format={(v) => (v <= 180 ? `${v}° to the wind` : `${v - 180}° by the lee`)} />}
    >
      <svg viewBox="0 0 600 440" className="block h-auto w-full">
        <WaterDefs id="bl" />
        <Water id="bl" width={600} height={440} />
        {/* Boat heads up the page with the boom to port, so the wind comes from bearing `twa`. */}
        <WindField windFrom={twa} width={600} height={440} speed={14} density={0.6} />
        <path d={sectorPath({ x: 300, y: 200 }, 0, 230, 182, 215)} fill="var(--port)" opacity={danger ? 0.3 : 0.14} />
        <path d={sectorPath({ x: 300, y: 200 }, 0, 230, 150, 180)} fill="var(--starboard)" opacity={0.12} />
        <Label x={190} y={425} color="var(--port)" size={12}>wind here = by the lee</Label>
        <Label x={420} y={425} color="var(--starboard)" size={12}>safe run</Label>
        <Boat x={300} y={200} heading={0} scale={2.4} sail={80} side={-1} accent={danger ? 'var(--port)' : 'var(--sea)'} />
        <WindArrow windFrom={twa} cx={300} cy={200} r={175} label={false} />
      </svg>
    </Figure>
  )
}
