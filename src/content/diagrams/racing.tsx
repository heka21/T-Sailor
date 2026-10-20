import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { norm360, polar, vecBearing, type Vec } from '../../lib/sailing'
import { Boat } from '../../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../../components/svg/Wind'
import { Button, Segmented, Slider } from '../../components/ui/controls'
import { trimFor } from '../../sims/PointsOfSail'
import { Figure, Label } from './Figure'

/** Parts of a spinnaker and its control lines. */
export function SpinnakerParts() {
  const [active, setActive] = useState('guy')
  const parts: Record<string, { name: string; text: string }> = {
    head: { name: 'Head', text: 'Top corner, attached to the spinnaker halyard.' },
    tack: { name: 'Tack (at the pole)', text: 'The windward corner — it sits at the end of the pole. Swaps with the clew when you gybe.' },
    clew: { name: 'Clew', text: 'The leeward corner, where the sheet attaches.' },
    guy: { name: 'Guy', text: 'The line on the windward side, through the pole end. Pull it back to square the pole.' },
    sheet: { name: 'Sheet', text: 'The line on the leeward side. Trim it constantly: ease until the luff curls, then trim a touch.' },
    pole: { name: 'Spinnaker pole', text: 'Holds the tack out to windward. Keep it at right angles to the apparent wind and level with the clew.' },
    topping: { name: 'Topping lift & downhaul', text: 'The topping lift holds the pole up; the downhaul (foreguy) stops it skying. Together they set pole height.' },
    halyard: { name: 'Halyard', text: 'Hoists the spinnaker. Must be led outside the forestay and clear of the jib halyard.' },
  }
  const hit = (id: string) => ({ onClick: () => setActive(id), style: { cursor: 'pointer' } })
  const c = (id: string) => (active === id ? 'var(--signal)' : 'var(--ink)')
  return (
    <Figure caption={<><strong className="text-ink">{parts[active].name}:</strong> {parts[active].text}</>}>
      <svg viewBox="0 0 600 500" className="block h-auto w-full">
        <rect width="600" height="500" fill="var(--surface-2)" />
        {/* boat from astern-ish front view */}
        <path d="M200,440 L400,440 L380,470 L220,470 Z" fill="var(--hull)" stroke="var(--ink)" strokeWidth={2} />
        <line x1={300} y1={440} x2={300} y2={40} stroke="var(--ink)" strokeWidth={5} />
        {/* spinnaker */}
        <path d="M300,60 C400,90 470,200 470,330 C420,350 200,350 140,330 C130,200 200,90 300,60 Z" fill="#f97316" opacity={0.9} />
        <path d="M300,60 C330,140 330,260 300,345" stroke="#fdba74" strokeWidth={14} fill="none" opacity={0.6} />
        <g {...hit('head')}><circle cx={300} cy={60} r={active === 'head' ? 12 : 9} fill={c('head')} stroke="white" strokeWidth={3} /></g>
        <g {...hit('tack')}><circle cx={140} cy={330} r={active === 'tack' ? 12 : 9} fill={c('tack')} stroke="white" strokeWidth={3} /></g>
        <g {...hit('clew')}><circle cx={470} cy={330} r={active === 'clew' ? 12 : 9} fill={c('clew')} stroke="white" strokeWidth={3} /></g>
        {/* pole */}
        <g {...hit('pole')}>
          <line x1={300} y1={330} x2={140} y2={330} stroke="transparent" strokeWidth={22} />
          <line x1={300} y1={330} x2={140} y2={330} stroke={c('pole')} strokeWidth={active === 'pole' ? 9 : 7} strokeLinecap="round" />
        </g>
        <g {...hit('topping')}>
          <path d="M300,200 L180,330 M180,330 L300,438" stroke="transparent" strokeWidth={20} />
          <path d="M300,200 L180,330" stroke={c('topping')} strokeWidth={2} strokeDasharray="5 4" />
          <path d="M180,330 L300,438" stroke={c('topping')} strokeWidth={2} strokeDasharray="5 4" />
        </g>
        <g {...hit('guy')}>
          <path d="M140,330 Q150,400 210,446" stroke="transparent" strokeWidth={22} fill="none" />
          <path d="M140,330 Q150,400 210,446" stroke={active === 'guy' ? 'var(--signal)' : 'var(--wind)'} strokeWidth={4} fill="none" />
        </g>
        <g {...hit('sheet')}>
          <path d="M470,330 Q460,400 390,446" stroke="transparent" strokeWidth={22} fill="none" />
          <path d="M470,330 Q460,400 390,446" stroke={active === 'sheet' ? 'var(--signal)' : 'var(--starboard)'} strokeWidth={4} fill="none" />
        </g>
        <g {...hit('halyard')}>
          <path d="M300,60 L306,440" stroke="transparent" strokeWidth={20} />
          <path d="M300,60 L306,440" stroke={c('halyard')} strokeWidth={2} />
        </g>
        <Label x={110} y={320} anchor="end" size={13}>tack</Label>
        <Label x={500} y={320} anchor="start" size={13}>clew</Label>
        <Label x={128} y={400} anchor="end" size={13} color="var(--wind)">guy</Label>
        <Label x={480} y={400} anchor="start" size={13} color="var(--starboard)">sheet</Label>
        <Label x={300} y={30} size={13}>head</Label>
        <Label x={30} y={40} anchor="start" size={12} color="var(--muted)">← windward (wind from behind-left)</Label>
      </svg>
    </Figure>
  )
}

type CourseType = 'wl' | 'triangle' | 'trapezoid'

/** Common race courses with the order of marks. */
export function CourseDiagram() {
  const [type, setType] = useState<CourseType>('wl')
  const courses: Record<CourseType, { name: string; marks: Record<string, Vec>; route: string[]; text: string }> = {
    wl: {
      name: 'Windward–leeward',
      marks: { S: { x: 300, y: 470 }, '1': { x: 300, y: 80 }, '2': { x: 300, y: 400 } },
      route: ['S', '1', '2', '1', 'F'],
      text: 'Start, beat to the windward mark (1), run to the leeward mark or gate (2), and repeat. Most marks are left to port. Pure upwind and downwind sailing.',
    },
    triangle: {
      name: 'Triangle',
      marks: { S: { x: 300, y: 470 }, '1': { x: 300, y: 80 }, '2': { x: 520, y: 280 }, '3': { x: 300, y: 420 } },
      route: ['S', '1', '2', '3', 'F'],
      text: 'Beat to 1, a reach to the wing mark (2), another reach to the leeward mark (3). Reaches test boat handling and spinnaker work.',
    },
    trapezoid: {
      name: 'Trapezoid',
      marks: { S: { x: 280, y: 480 }, '1': { x: 300, y: 80 }, '2': { x: 140, y: 130 }, '3': { x: 140, y: 400 }, '4': { x: 300, y: 380 } },
      route: ['S', '1', '2', '3', '4', 'F'],
      text: 'A short reach after the windward mark, a run, then reach to finish. Used to keep two fleets apart on one course.',
    },
  }
  const c = courses[type]
  const pts = c.route.map((m) => (m === 'F' ? { x: 340, y: 470 } : c.marks[m]))
  return (
    <Figure
      caption={<><strong className="text-ink">{c.name}:</strong> {c.text} Always check the course in the Sailing Instructions and on the committee boat’s board.</>}
      controls={
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'wl', label: 'Windward–leeward' },
            { value: 'triangle', label: 'Triangle' },
            { value: 'trapezoid', label: 'Trapezoid' },
          ]}
        />
      }
    >
      <svg viewBox="0 0 640 520" className="block h-auto w-full">
        <WaterDefs id="cd" />
        <Water id="cd" width={640} height={520} />
        <WindField windFrom={0} width={640} height={520} speed={12} density={0.5} />
        <WindArrow windFrom={0} cx={570} cy={300} r={210} label />
        <motion.polyline
          key={type}
          points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="white"
          strokeWidth={4}
          strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5 }}
        />
        <line x1={240} y1={480} x2={360} y2={470} stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="6 4" />
        <Label x={300} y={505} size={12} color="var(--muted)">start / finish line</Label>
        {Object.entries(c.marks)
          .filter(([k]) => k !== 'S')
          .map(([k, p]) => (
            <g key={k}>
              <circle cx={p.x} cy={p.y} r={14} fill="var(--signal)" stroke="white" strokeWidth={3} />
              <Label x={p.x} y={p.y + 5} color="white" size={13}>{k}</Label>
            </g>
          ))}
      </svg>
    </Figure>
  )
}

/** The three-length zone and mark-room (rule 18), with a wide-and-close rounding. */
export function MarkRounding() {
  const [overlap, setOverlap] = useState(true)
  const [t, setT] = useState(0)
  const raf = useRef(0)
  const run = () => {
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    const tick = (now: number) => {
      const v = Math.min(1, (now - start) / 4500)
      setT(v)
      if (v < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  // Paths are measured from the DOM, so render once more after they mount.
  const [, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Port rounding of a leeward mark: boats come down from the top on a run and turn up to the left.
  const mark = { x: 330, y: 330 }
  const L = 36
  const along = (p: SVGPathElement | null, v: number) => {
    if (!p) return { x: 0, y: 0, h: 180 }
    const len = p.getTotalLength()
    const a = p.getPointAtLength(v * len)
    const b = p.getPointAtLength(Math.min(len, v * len + 1))
    return { x: a.x, y: a.y, h: vecBearing({ x: b.x - a.x, y: b.y - a.y }) }
  }
  const inside = useRef<SVGPathElement>(null)
  const outside = useRef<SVGPathElement>(null)
  const pi = along(inside.current, t)
  const po = along(outside.current, overlap ? t : Math.max(0, t - 0.18))
  const ti = trimFor(pi.h, 0, 12)
  const to = trimFor(po.h, 0, 12)
  return (
    <Figure
      caption={
        overlap ? (
          <>
            When the first boat reaches the <strong className="text-ink">zone</strong> (3 hull lengths), if they’re overlapped the{' '}
            <span className="font-semibold text-wind">inside boat</span> gets <strong className="text-ink">mark-room</strong> — room to sail to the mark and round it. The outside boat must give it.
          </>
        ) : (
          <>Not overlapped when the leader enters the zone? The boat clear ahead gets room, and the boat behind must keep clear — even if it later gets an inside overlap.</>
        )
      }
      controls={
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={overlap ? 'yes' : 'no'}
            onChange={(v) => setOverlap(v === 'yes')}
            options={[
              { value: 'yes', label: 'Overlapped at the zone' },
              { value: 'no', label: 'Clear astern' },
            ]}
          />
          <Button variant="soft" onClick={run}>
            ▶ Play the rounding
          </Button>
        </div>
      }
    >
      <svg viewBox="0 0 600 480" className="block h-auto w-full">
        <WaterDefs id="mr" />
        <Water id="mr" width={600} height={480} />
        <WindField windFrom={0} width={600} height={480} speed={12} density={0.5} />
        <circle cx={mark.x} cy={mark.y} r={L * 3} fill="var(--signal)" opacity={0.1} stroke="var(--signal)" strokeDasharray="6 6" strokeWidth={2} />
        <Label x={mark.x} y={mark.y - L * 3 - 8} size={12} color="var(--signal)">zone: 3 boat lengths</Label>
        {/* Leaving the mark to port: down the west side, round underneath, up the east side. Inside boat = nearer the mark. */}
        <path ref={inside} d="M290,60 C290,170 290,260 310,320 C325,365 360,350 370,300 C380,240 390,180 405,90" fill="none" stroke="var(--wind)" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 6" />
        <path ref={outside} d="M230,60 C230,170 230,280 260,350 C290,420 390,410 415,320 C430,260 438,190 455,90" fill="none" stroke="var(--signal)" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 6" />
        <circle cx={mark.x} cy={mark.y} r={12} fill="var(--signal)" stroke="white" strokeWidth={3} />
        <Boat x={po.x} y={po.y} heading={po.h} scale={0.5} sail={to.sail} side={to.side} flow={to.flow} accent="var(--signal)" />
        <Boat x={pi.x} y={pi.y} heading={pi.h} scale={0.5} sail={ti.sail} side={ti.side} flow={ti.flow} accent="var(--wind)" />
        <Label x={60} y={460} anchor="start" size={12} color="var(--muted)">Tip: come in wide, leave close — so you exit right next to the mark, pointing upwind.</Label>
      </svg>
    </Figure>
  )
}

/** One-turn and two-turns penalties. */
export function PenaltyTurns() {
  const [turns, setTurns] = useState<1 | 2>(2)
  const [key, setKey] = useState(0)
  // Each turn heads east → north (tack) → west → south (gybe) → east again.
  const loop = 'c60,-10 70,-90 0,-90 c-70,0 -60,80 0,90'
  const d = turns === 1 ? `M100,330 L250,250 ${loop} L460,140` : `M100,330 L220,270 ${loop} ${loop} L460,140`
  return (
    <Figure
      caption={
        turns === 2 ? (
          <>
            <strong className="text-ink">Two-Turns Penalty</strong> for breaking a rule of Part 2 (e.g. port/starboard). Get clear of other boats
            promptly, then make two turns in the same direction — each with one tack and one gybe.
          </>
        ) : (
          <>
            <strong className="text-ink">One-Turn Penalty</strong> for touching a mark (rule 31): one turn including one tack and one gybe.
          </>
        )
      }
      controls={
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={String(turns)}
            onChange={(v) => {
              setTurns(Number(v) as 1 | 2)
              setKey((k) => k + 1)
            }}
            options={[
              { value: '2', label: 'Two turns' },
              { value: '1', label: 'One turn' },
            ]}
          />
          <Button variant="soft" onClick={() => setKey((k) => k + 1)}>
            ↻ Replay
          </Button>
        </div>
      }
    >
      <svg viewBox="0 0 560 380" className="block h-auto w-full">
        <WaterDefs id="pt" />
        <Water id="pt" width={560} height={380} />
        <WindField windFrom={0} width={560} height={380} speed={12} density={0.5} />
        <WindArrow windFrom={0} cx={490} cy={240} r={170} label />
        <motion.path
          key={key}
          d={d}
          fill="none"
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: turns === 2 ? 5 : 3.5, ease: 'linear' }}
        />
        <Label x={turns === 2 ? 220 : 250} y={turns === 2 ? 160 : 140} size={12} color="var(--muted)">tack at the top, gybe at the bottom</Label>
      </svg>
    </Figure>
  )
}

/** Lifts and headers: tack on the headers. */
export function WindShift() {
  const [shift, setShift] = useState(-10)
  const [tack, setTack] = useState<'starboard' | 'port'>('starboard')
  const windFrom = norm360(shift)
  const heading = tack === 'starboard' ? norm360(windFrom - 45) : norm360(windFrom + 45)
  const t = trimFor(heading, windFrom, 12)
  // Relative to the mark straight upwind (bearing 0): is this tack pointing closer to the mark than before the shift?
  const before = tack === 'starboard' ? 315 : 45
  const delta = Math.abs(((heading + 540) % 360) - 180) - Math.abs(((before + 540) % 360) - 180)
  const lifted = delta < -0.5
  const headed = delta > 0.5
  const mark = { x: 300, y: 50 }
  const boat = { x: 300, y: 360 }
  const course = polar(boat, heading, 260)
  return (
    <Figure
      caption={
        lifted ? (
          <>
            <strong className="text-starboard">Lifted!</strong> The wind shifted so you can point closer to the mark. Stay on this tack.
          </>
        ) : headed ? (
          <>
            <strong className="text-port">Headed.</strong> The wind shifted against you — you have to bear away, pointing further from the mark. Tack: the
            other tack is now lifted.
          </>
        ) : (
          'No shift — both tacks are equal. Watch the compass and the boats around you for the next shift.'
        )
      }
      controls={
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Slider label="Wind shift" value={shift} min={-20} max={20} onChange={setShift} format={(v) => (v === 0 ? 'none' : v > 0 ? `${v}° right (veer)` : `${-v}° left (back)`)} />
          <Segmented
            value={tack}
            onChange={setTack}
            options={[
              { value: 'starboard', label: 'Starboard tack' },
              { value: 'port', label: 'Port tack' },
            ]}
          />
        </div>
      }
    >
      <svg viewBox="0 0 600 440" className="block h-auto w-full">
        <WaterDefs id="ws" />
        <Water id="ws" width={600} height={440} />
        <WindField windFrom={windFrom} width={600} height={440} speed={12} density={0.6} />
        <WindArrow windFrom={windFrom} cx={300} cy={300} r={240} label={false} />
        <line x1={boat.x} y1={boat.y} x2={mark.x} y2={mark.y} stroke="var(--ink)" strokeOpacity={0.3} strokeDasharray="3 6" strokeWidth={2} />
        <line x1={boat.x} y1={boat.y} x2={polar(boat, before, 240).x} y2={polar(boat, before, 240).y} stroke="var(--muted)" strokeDasharray="6 6" strokeWidth={2} />
        <line x1={boat.x} y1={boat.y} x2={course.x} y2={course.y} stroke={lifted ? 'var(--starboard)' : headed ? 'var(--port)' : 'white'} strokeWidth={4} />
        <circle cx={mark.x} cy={mark.y} r={12} fill="var(--signal)" stroke="white" strokeWidth={3} />
        <Label x={mark.x + 18} y={mark.y + 5} anchor="start" size={12}>windward mark</Label>
        <Boat x={boat.x} y={boat.y} heading={heading} scale={1.1} sail={t.sail} side={t.side} />
        <Label x={20} y={425} anchor="start" size={12} color="var(--muted)">grey dashed = your course before the shift</Label>
      </svg>
    </Figure>
  )
}
