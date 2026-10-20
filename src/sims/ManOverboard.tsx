import { useEffect, useRef, useState } from 'react'
import { vecBearing } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { Stepper, type Step } from '../components/ui/Stepper'
import { trimFor } from './PointsOfSail'

const MOB = { x: 300, y: 300 }

/** Each step's leg of the track (SVG path) — the boat sails along it when the step starts. */
const LEGS = [
  'M150,300 L330,300',
  'M330,300 L560,300',
  'M560,300 C640,300 640,210 560,210',
  'M560,210 C500,210 450,300 420,372',
  'M420,372 C390,355 350,333 324,318',
  'M324,318 L322,317',
]

const STEPS: Step[] = [
  {
    title: 'Shout, throw, point',
    call: 'Man overboard!',
    body: 'Shout loudly so everyone knows. Throw a lifebuoy or anything that floats. One person points at the casualty and never stops pointing. Press MOB on the GPS if fitted.',
    roles: [
      ['Spotter', 'Point continuously — you are the most important person now.'],
      ['Crew', 'Throw the lifebuoy / dan buoy.'],
      ['Skipper', 'Take charge, note the time and position.'],
    ],
  },
  {
    title: 'Sail away on a beam reach',
    body: 'Keep sailing on a beam reach for about 6–8 boat lengths. This gives you room and time to organise the crew and get ready for the pick-up.',
    roles: [['Skipper', 'Allocate jobs: recovery line, boat hook, engine check.']],
  },
  {
    title: 'Tack — don’t gybe',
    call: 'Ready about — lee-ho!',
    body: 'Tack around. A tack is controlled; an accidental crash-gybe with a crew short could injure someone else.',
  },
  {
    title: 'Return below the casualty',
    body: 'Sail back on a broad reach aiming to pass a few boat lengths downwind of the person, so you can make the final approach heading up towards them.',
  },
  {
    title: 'Final approach on a close reach',
    body: 'Head up to a close reach and ease the sheets to slow down — you can speed up (trim) or slow down (ease) as needed. Aim to stop with the person alongside, just aft of the shrouds.',
    roles: [['Helm', 'Control speed with the sheets; aim to stop alongside.']],
  },
  {
    title: 'Stop & recover',
    body: 'Stop the boat, get a line around them, and use a halyard and winch or a swim ladder to bring them aboard. Treat for cold and shock. Call for help on VHF 16 if needed. Check no ropes are in the water before starting the engine.',
    roles: [['Crew', 'Line or lifesling to the casualty first — then lift.']],
  },
]

function MobDiagram({ step }: { step: number }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pose, setPose] = useState({ x: 150, y: 300, heading: 90 })

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    const start = performance.now()
    const ms = step === 5 ? 400 : 2200
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      const a = path.getPointAtLength(e * len)
      const b = path.getPointAtLength(Math.min(len, e * len + 1))
      const c = e * len + 1 > len ? path.getPointAtLength(Math.max(0, e * len - 1)) : a
      const dir = e * len + 1 > len ? { x: a.x - c.x, y: a.y - c.y } : { x: b.x - a.x, y: b.y - a.y }
      setPose((p) => ({ x: a.x, y: a.y, heading: Math.hypot(dir.x, dir.y) > 0.01 ? vecBearing(dir) : p.heading }))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  const t = trimFor(pose.heading, 0, 12)
  const slowing = step >= 4
  return (
    <svg viewBox="0 0 700 480" className="block h-auto w-full">
      <WaterDefs id="mob" />
      <Water id="mob" width={700} height={480} />
      <WindField windFrom={0} width={700} height={480} speed={12} density={0.7} />
      <WindArrow windFrom={0} cx={110} cy={260} r={190} label />
      {/* full planned track */}
      <path d={LEGS.join(' ')} fill="none" stroke="var(--ink)" strokeOpacity={0.18} strokeWidth={2} strokeDasharray="3 6" />
      {LEGS.slice(0, step).map((d, i) => (
        <path key={i} d={d} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={4} strokeLinecap="round" />
      ))}
      <path ref={pathRef} d={LEGS[step]} fill="none" stroke="var(--signal)" strokeWidth={4} strokeLinecap="round" strokeDasharray="6 6" />
      {/* casualty */}
      <circle cx={MOB.x} cy={MOB.y} r={6} fill="none" stroke="var(--signal)" strokeWidth={2} className="ripple" />
      <circle cx={MOB.x - 16} cy={MOB.y + 10} r={8} fill="none" stroke="#f97316" strokeWidth={5} />
      <circle cx={MOB.x} cy={MOB.y} r={7} fill="#f6c28b" stroke="#f97316" strokeWidth={3} />
      <text x={MOB.x} y={MOB.y - 18} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--port)">
        MOB
      </text>
      {/* spotter's pointing line */}
      <line x1={pose.x} y1={pose.y} x2={MOB.x} y2={MOB.y} stroke="var(--port)" strokeWidth={1.5} strokeDasharray="2 5" opacity={0.8} />
      <Boat
        x={pose.x}
        y={pose.y}
        heading={pose.heading}
        scale={0.62}
        sail={slowing ? Math.min(85, t.sail + 25) : t.sail}
        side={t.side}
        flow={t.flow ?? (slowing ? 'luffing' : undefined)}
      />
      <text x={20} y={460} fontSize={13} fontWeight={600} fill="var(--muted)">
        Dotted red line = the spotter pointing at the casualty the whole time
      </text>
    </svg>
  )
}

export function ManOverboard() {
  return <Stepper title="Man overboard recovery (reach – tack – reach)" steps={STEPS} visual={(i) => <MobDiagram step={i} />} autoMs={4500} />
}
