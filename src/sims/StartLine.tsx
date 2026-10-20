import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { bearingVec, lineBias, norm360, polar, type Vec } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { FlagStaff } from '../components/svg/Flags'
import { svgPoint } from '../components/svg/pointer'
import { Button, Segmented, Slider, Toggle } from '../components/ui/controls'
import { SimFrame } from './SimFrame'
import { trimFor } from './PointsOfSail'

const W = 720
const H = 640
const BOAT_LEN = 34 // pixels per boat length at this chart scale
const MARK: Vec = { x: 360, y: 80 }

const SIGNALS = [
  { at: 300, name: 'Warning', flag: 'Class flag up', sound: '1 sound', note: '5 minutes to go — start your watch.' },
  { at: 240, name: 'Preparatory', flag: 'P flag up', sound: '1 sound', note: '4 minutes. Racing rules now apply to you.' },
  { at: 60, name: 'One minute', flag: 'P flag down', sound: '1 long sound', note: 'Last minute. Get into position and build speed.' },
  { at: 0, name: 'Start!', flag: 'Class flag down', sound: '1 sound', note: 'Go! Be behind the line until this moment.' },
]

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function StartTimer() {
  const [left, setLeft] = useState(330)
  const [running, setRunning] = useState(false)
  const [fast, setFast] = useState(true)
  const last = useRef(0)

  useEffect(() => {
    if (!running) return
    let raf = 0
    last.current = performance.now()
    const tick = (now: number) => {
      const dt = ((now - last.current) / 1000) * (fast ? 10 : 1)
      last.current = now
      setLeft((v) => {
        const n = v - dt
        if (n <= -5) {
          setRunning(false)
          return -5
        }
        return n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, fast])

  const classUp = left <= 300 && left > 0
  const pUp = left <= 240 && left > 60
  const current = [...SIGNALS].reverse().find((s) => left <= s.at)
  const justFired = SIGNALS.find((s) => left <= s.at && left > s.at - 4)

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 150 100" className="h-20 w-32 shrink-0">
          <rect x={10} y={88} width={130} height={10} rx={3} fill="var(--ink)" opacity={0.8} />
          <FlagStaff id="class" up={classUp} x={40} y={88} />
          <FlagStaff id="P" up={pUp} x={100} y={88} />
        </svg>
        <div className="min-w-0 flex-1">
          <div className={`font-display text-4xl font-bold tabular-nums ${left <= 0 ? 'text-starboard' : left <= 60 ? 'text-signal' : 'text-ink'}`}>
            {left > 0 ? fmt(Math.ceil(left)) : 'GO!'}
          </div>
          <div className="truncate text-sm font-semibold text-ink">{current ? current.name : 'Before the sequence'}</div>
          {justFired && (
            <div className="flex items-center gap-1 text-xs font-semibold text-signal">
              <Volume2 size={13} /> {justFired.sound} · {justFired.flag}
            </div>
          )}
        </div>
      </div>
      <ol className="mt-3 space-y-1">
        {SIGNALS.map((s) => (
          <li key={s.at} className={`flex gap-2 rounded-lg px-2 py-1 text-sm ${current === s ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}>
            <span className="w-9 shrink-0 tabular-nums">{fmt(s.at)}</span>
            <span className="flex-1">
              {s.name} — {s.flag}
              {current === s && <span className="block text-xs font-normal text-muted">{s.note}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start sequence'}
        </Button>
        <Button variant="ghost" onClick={() => { setLeft(330); setRunning(false) }} ariaLabel="Reset">
          <RotateCcw size={16} />
        </Button>
        <span className="ml-auto">
          <Toggle checked={fast} onChange={setFast} label="10× speed" />
        </span>
      </div>
    </div>
  )
}

export function StartLine() {
  const [shift, setShift] = useState(10)
  const [committee, setCommittee] = useState<Vec>({ x: 560, y: 470 })
  const [pin, setPin] = useState<Vec>({ x: 160, y: 470 })
  const [view, setView] = useState<'line' | 'timer'>('line')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'pin' | 'committee' | null>(null)

  const windFrom = norm360(shift)
  const bias = lineBias(committee, pin, windFrom)
  const favoured = bias.favoured === 'pin' ? pin : bias.favoured === 'committee' ? committee : null
  const mid = { x: (pin.x + committee.x) / 2, y: (pin.y + committee.y) / 2 }
  const w = bearingVec(windFrom)
  const square = { x: -w.y, y: w.x } // perpendicular to the wind
  const sq1 = { x: mid.x + square.x * 240, y: mid.y + square.y * 240 }
  const sq2 = { x: mid.x - square.x * 240, y: mid.y - square.y * 240 }

  // Laylines run downwind from the mark at 45° each side of the wind.
  const stbdLay = polar(MARK, windFrom + 135, 700)
  const portLay = polar(MARK, windFrom - 135, 700)
  const stbdHeading = norm360(windFrom - 45)
  const portHeading = norm360(windFrom + 45)

  const down = (which: 'pin' | 'committee') => (e: PointerEvent) => {
    dragging.current = which
    svgRef.current?.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const move = (e: PointerEvent) => {
    if (!dragging.current || !svgRef.current) return
    const p = svgPoint(svgRef.current, e.clientX, e.clientY)
    const c = { x: Math.max(30, Math.min(W - 30, p.x)), y: Math.max(260, Math.min(H - 30, p.y)) }
    if (dragging.current === 'pin') setPin(c)
    else setCommittee(c)
  }

  const s = trimFor(stbdHeading, windFrom, 12)
  const pTrim = trimFor(portHeading, windFrom, 12)

  return (
    <SimFrame
      title="Start Line & Laylines"
      subtitle="Drag the pin buoy or committee boat. Shift the wind to see the favoured end change."
      visual={
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none"
          onPointerMove={move}
          onPointerUp={() => (dragging.current = null)}
        >
          <WaterDefs id="sl" />
          <Water id="sl" width={W} height={H} />
          <WindField windFrom={windFrom} width={W} height={H} speed={12} density={0.8} />
          <WindArrow windFrom={windFrom} cx={600} cy={330} r={220} label={false} />

          {/* laylines */}
          <line x1={MARK.x} y1={MARK.y} x2={stbdLay.x} y2={stbdLay.y} stroke="var(--starboard)" strokeWidth={2.5} strokeDasharray="10 7" />
          <line x1={MARK.x} y1={MARK.y} x2={portLay.x} y2={portLay.y} stroke="var(--port)" strokeWidth={2.5} strokeDasharray="10 7" />
          <text x={polar(MARK, windFrom + 135, 150).x + 12} y={polar(MARK, windFrom + 135, 150).y} fontSize={13} fontWeight={700} fill="var(--starboard)">
            starboard layline
          </text>
          <text x={polar(MARK, windFrom - 135, 150).x - 12} y={polar(MARK, windFrom - 135, 150).y} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--port)">
            port layline
          </text>
          <circle cx={MARK.x} cy={MARK.y} r={12} fill="var(--signal)" stroke="white" strokeWidth={3} />
          <text x={MARK.x + 20} y={MARK.y + 5} fontSize={13} fontWeight={700} fill="var(--ink)">
            windward mark
          </text>

          {/* square line */}
          <line x1={sq1.x} y1={sq1.y} x2={sq2.x} y2={sq2.y} stroke="var(--ink)" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="2 6" />
          <text x={Math.max(10, sq2.x)} y={sq2.y - 8} textAnchor="start" fontSize={11} fill="var(--muted)">
            square to wind
          </text>

          {/* start line */}
          <line x1={pin.x} y1={pin.y} x2={committee.x} y2={committee.y} stroke="var(--ink)" strokeWidth={3} strokeDasharray="12 6" />
          {favoured && <circle cx={favoured.x} cy={favoured.y} r={30} fill="var(--starboard)" opacity={0.25} className="pulse-ring" />}

          {/* sample boats on starboard close-hauled at each end */}
          <Boat x={pin.x + 40} y={pin.y + 80} heading={stbdHeading} scale={0.6} sail={s.sail} side={s.side} accent="var(--wind)" />
          <Boat x={committee.x - 50} y={committee.y + 80} heading={stbdHeading} scale={0.6} sail={s.sail} side={s.side} accent="var(--wind)" />
          <Boat x={mid.x} y={mid.y + 110} heading={portHeading} scale={0.6} sail={pTrim.sail} side={pTrim.side} accent="var(--signal)" />

          {/* pin */}
          <g onPointerDown={down('pin')} style={{ cursor: 'grab' }}>
            <circle cx={pin.x} cy={pin.y} r={26} fill="transparent" />
            <circle cx={pin.x} cy={pin.y} r={11} fill="var(--signal)" stroke="white" strokeWidth={3} />
            <text x={pin.x} y={pin.y + 30} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">
              PIN
            </text>
          </g>
          {/* committee boat */}
          <g onPointerDown={down('committee')} style={{ cursor: 'grab' }}>
            <circle cx={committee.x} cy={committee.y} r={34} fill="transparent" />
            <path
              d={`M${committee.x - 26},${committee.y - 10} L${committee.x + 18},${committee.y - 10} L${committee.x + 30},${committee.y} L${committee.x + 18},${committee.y + 10} L${committee.x - 26},${committee.y + 10} Z`}
              fill="var(--ink)"
            />
            <rect x={committee.x - 14} y={committee.y - 6} width={16} height={12} rx={2} fill="var(--surface)" />
            <line x1={committee.x - 20} y1={committee.y} x2={committee.x - 20} y2={committee.y - 36} stroke="var(--ink)" strokeWidth={2} />
            <rect x={committee.x - 19} y={committee.y - 36} width={16} height={11} fill="#f97316" />
            <text x={committee.x} y={committee.y + 30} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">
              COMMITTEE
            </text>
          </g>
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">Finding the favoured end:</strong> sail head to wind on the line. The end your bow
          points closer to is the favoured end — it is further upwind, so starting there is a free head start.
        </>
      }
    >
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'line', label: 'Line bias' },
          { value: 'timer', label: 'Start sequence' },
        ]}
      />
      {view === 'line' ? (
        <>
          <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3">
            <div className="font-display text-xl font-bold text-starboard">
              {bias.favoured === 'square' ? 'Square line' : `${bias.favoured === 'pin' ? 'Pin' : 'Committee boat'} end favoured`}
            </div>
            <p className="mt-1 text-sm text-muted">
              {bias.favoured === 'square'
                ? 'Neither end is ahead. Start where you have clear air and space.'
                : `The line is ${Math.abs(bias.bias).toFixed(0)}° off square. Starting at the favoured end puts you about ${(bias.gain / BOAT_LEN).toFixed(1)} boat lengths ahead.`}
            </p>
          </div>
          <Slider
            label="Wind shift"
            value={shift}
            min={-30}
            max={30}
            onChange={setShift}
            format={(v) => (v === 0 ? 'none' : v > 0 ? `${v}° right (veer)` : `${-v}° left (back)`)}
          />
          <div className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
            <p>
              <strong className="text-ink">Laylines</strong> are the lines you can just sail to the mark on, close-hauled.
              Go past one and you have <em>overstood</em> — sailing extra distance. Arrive on the{' '}
              <span className="font-semibold text-starboard">starboard layline</span> to have right of way at the mark.
            </p>
          </div>
        </>
      ) : (
        <StartTimer />
      )}
    </SimFrame>
  )
}
