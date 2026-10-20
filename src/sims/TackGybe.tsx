import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { clamp, idealSailAngle, lerp, norm180, norm360, polar, apparentWind, boatSpeed, windAngle } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { Button, Segmented, Slider } from '../components/ui/controls'
import { SimFrame } from './SimFrame'

type Mode = 'tack' | 'gybe'

interface Phase {
  at: number
  title: string
  call?: string
  helm: string
  crew: string
}

const PHASES: Record<Mode, Phase[]> = {
  tack: [
    {
      at: 0,
      title: 'Prepare',
      call: 'Ready about!',
      helm: 'Check the water ahead and on the new side is clear. Pick a landmark for the new course.',
      crew: 'Load the new (lazy) jib sheet on the winch, uncleat the working sheet but hold it. Answer “Ready!”',
    },
    {
      at: 0.18,
      title: 'Turn into the wind',
      call: 'Lee-ho!',
      helm: 'Push the tiller smoothly towards the sail (to leeward). Not too fast — keep the boat moving.',
      crew: 'Hold the working sheet until the jib starts to back (fill from the wrong side).',
    },
    {
      at: 0.38,
      title: 'Head to wind',
      helm: 'Keep the turn going through the no-go zone. Duck under the boom and move to the new side.',
      crew: 'Release the old sheet. Duck under the boom and cross the boat.',
    },
    {
      at: 0.55,
      title: 'Onto the new tack',
      helm: 'Straighten the tiller as the boat reaches close-hauled on the new tack.',
      crew: 'Pull the new sheet in hand over hand while it is light, then winch the last bit.',
    },
    {
      at: 0.8,
      title: 'Settle & trim',
      helm: 'Steer by the telltales and build speed back up.',
      crew: 'Trim to the telltales, coil the tail, sit on the new windward side.',
    },
  ],
  gybe: [
    {
      at: 0,
      title: 'Prepare',
      call: 'Ready to gybe!',
      helm: 'Check all round — especially the new downwind side. Warn the crew about the boom.',
      crew: 'Get ready to swap the jib sheets. Mainsheet hand ready to pull the boom in. Answer “Ready!”',
    },
    {
      at: 0.16,
      title: 'Bear away & centre the main',
      helm: 'Pull the tiller towards you (to windward) to turn downwind onto a run.',
      crew: 'Pull the mainsheet in so the boom comes near the centreline — less distance to swing.',
    },
    {
      at: 0.4,
      title: 'Gybe!',
      call: 'Gybe-oh!',
      helm: 'Keep turning gently so the stern passes through the wind. HEADS DOWN!',
      crew: 'The boom swings across — keep heads low. Let the jib go and pull it in on the new side.',
    },
    {
      at: 0.58,
      title: 'Ease out on the new side',
      helm: 'Straighten up quickly — the boat wants to round up into the wind after a gybe.',
      crew: 'Let the mainsheet run out smoothly (don’t let it crash out). Trim the jib.',
    },
    {
      at: 0.82,
      title: 'Settle',
      helm: 'Steady on the new broad reach.',
      crew: 'Trim both sails for the new course and move to the new windward side.',
    },
  ],
}

const WIND = 0
const TWS = 12

/** Heading, tiller, mainsail and speed for a moment of the manoeuvre. */
function poseAt(mode: Mode, t: number) {
  if (mode === 'tack') {
    // Port tack close-hauled (heading 45) → starboard tack (heading 315).
    const turn = clamp((t - 0.18) / (0.62 - 0.18), 0, 1)
    const s = turn * turn * (3 - 2 * turn)
    const heading = norm360(45 - 90 * s)
    const tiller = turn > 0 && turn < 1 ? 28 * Math.sin(Math.PI * turn) : 0
    const speed = 1 - 0.65 * Math.sin(Math.PI * s)
    const twa = windAngle(heading, WIND)
    const aw = apparentWind(TWS, twa, boatSpeed(TWS, twa))
    const sail = Math.abs(twa) < 40 ? 2 : idealSailAngle(aw.angle)
    // Crew cross the boat around head to wind.
    const cross = clamp((t - 0.36) / 0.2, 0, 1)
    return { heading, tiller, speed, sail, side: (twa >= 0 ? -1 : 1) as 1 | -1, luff: Math.abs(twa) < 40, cross }
  }
  // Starboard broad reach (heading 210) → port broad reach (heading 150), through a dead run (180).
  const turn = clamp((t - 0.16) / (0.66 - 0.16), 0, 1)
  const s = turn * turn * (3 - 2 * turn)
  const heading = norm360(210 - 60 * s)
  // Bearing away on starboard tack = tiller to windward (starboard).
  const tiller = turn > 0 && turn < 1 ? 22 * Math.sin(Math.PI * turn) : 0
  const twa = windAngle(heading, WIND)
  const gybed = twa < 0 || (twa === 180 && s > 0.5)
  // Main is pulled in to ~12° approaching the gybe, swings across, then is eased.
  const centre = clamp(1 - Math.abs(t - 0.45) / 0.22, 0, 1)
  const sail = lerp(72, 12, centre)
  const cross = clamp((t - 0.44) / 0.16, 0, 1)
  return { heading, tiller, speed: 1, sail, side: (gybed ? 1 : -1) as 1 | -1, luff: false, cross }
}

export function TackGybe({ initial = 'tack' as Mode }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [slow, setSlow] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((v) => {
        const n = v + dt / (slow ? 22 : 11)
        if (n >= 1) {
          setPlaying(false)
          return 1
        }
        return n
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, slow])

  // Integrate the boat's track so it moves through the water realistically.
  const track = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    let p = { x: 0, y: 0 }
    const N = 240
    for (let i = 0; i <= N; i++) {
      const pose = poseAt(mode, i / N)
      pts.push(p)
      p = polar(p, pose.heading, pose.speed * 1.9)
    }
    const xs = pts.map((q) => q.x)
    const ys = pts.map((q) => q.y)
    const ox = 360 - (Math.min(...xs) + Math.max(...xs)) / 2
    const oy = 290 - (Math.min(...ys) + Math.max(...ys)) / 2
    return pts.map((q) => ({ x: q.x + ox, y: q.y + oy }))
  }, [mode])

  const idx = Math.round(t * (track.length - 1))
  const pos = track[idx]
  const pose = poseAt(mode, t)
  const phases = PHASES[mode]
  const phaseIdx = phases.reduce((acc, ph, i) => (t >= ph.at ? i : acc), 0)
  const phase = phases[phaseIdx]

  // Crew: helm aft, crew mid-ship, both on the windward side, crossing over during the manoeuvre.
  const startSide = mode === 'tack' ? -1 : 1 // windward side before (port tack: port; starboard gybe: starboard)
  const sideX = lerp(startSide, -startSide, pose.cross) * 12
  const crew = [
    { x: sideX, y: 34, color: 'var(--signal)' },
    { x: sideX, y: 6, color: 'var(--wind)' },
  ]
  const gybeDanger = mode === 'gybe' && t > 0.36 && t < 0.56

  const reset = () => {
    setT(0)
    setPlaying(false)
  }
  const callAt = phases.find((p) => p.call && t >= p.at && t < p.at + 0.14)

  return (
    <SimFrame
      title={mode === 'tack' ? 'Tacking — turning through the wind' : 'Gybing — turning away from the wind'}
      subtitle="Play the manoeuvre or scrub through it. Orange = helm, blue = crew."
      visual={
        <svg viewBox="0 0 720 580" className="block h-auto w-full select-none">
          <WaterDefs id="tg" />
          <Water id="tg" width={720} height={580} />
          <WindField windFrom={WIND} width={720} height={580} speed={TWS} />
          <WindArrow windFrom={WIND} cx={620} cy={300} r={210} label />
          <polyline points={track.map((q) => `${q.x},${q.y}`).join(' ')} fill="none" stroke="var(--ink)" strokeOpacity={0.15} strokeWidth={2} strokeDasharray="3 7" />
          <polyline
            points={track.slice(0, idx + 1).map((q) => `${q.x},${q.y}`).join(' ')}
            fill="none"
            stroke="white"
            strokeOpacity={0.8}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {gybeDanger && (
            <circle cx={pos.x} cy={pos.y} r={70} fill="var(--port)" opacity={0.18} className="pulse-ring" />
          )}
          <Boat
            x={pos.x}
            y={pos.y}
            heading={pose.heading}
            scale={1.6}
            sail={pose.sail}
            side={pose.side}
            flow={pose.luff ? 'luffing' : undefined}
            tiller={pose.tiller}
            crew={crew}
          />
          {callAt && (
            <g transform={`translate(${pos.x + 70} ${pos.y - 110})`}>
              <rect x={-8} y={-26} width={callAt.call!.length * 11 + 22} height={40} rx={20} fill="var(--signal)" />
              <path d="M10,14 L0,32 L24,14 Z" fill="var(--signal)" />
              <text x={6} y={0} fontSize={18} fontWeight={800} fill="white">
                {callAt.call}
              </text>
            </g>
          )}
          {/* tack / point labels */}
          <text x={20} y={560} fontSize={13} fontWeight={600} fill="var(--muted)">
            {Math.abs(norm180(pose.heading - WIND)) < 40
              ? 'In the no-go zone — sails flapping'
              : `Heading ${Math.round(pose.heading)}° · ${windAngle(pose.heading, WIND) >= 0 ? 'starboard' : 'port'} tack`}
          </text>
          {mode === 'gybe' && (
            <text x={700} y={560} textAnchor="end" fontSize={13} fontWeight={700} fill={gybeDanger ? 'var(--port)' : 'var(--muted)'}>
              {gybeDanger ? '⚠ Boom swinging across — heads down!' : `Boom ${Math.round(pose.sail)}° out`}
            </text>
          )}
          <title>{`${mode} animation, step ${phaseIdx + 1}: ${phase.title}`}</title>
        </svg>
      }
      footer={
        mode === 'tack' ? (
          <>
            <strong className="text-ink">Tack</strong> = the bow turns through the wind. It is the safe, controlled way to
            change sides — the boom swings across slowly while the sails are flapping.
          </>
        ) : (
          <>
            <strong className="text-ink">Gybe</strong> = the stern turns through the wind. The sail stays full the whole
            time, so the boom can crash across with real force. Always control it with the mainsheet.
          </>
        )
      }
    >
      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m)
          reset()
        }}
        options={[
          { value: 'tack', label: 'Tack' },
          { value: 'gybe', label: 'Gybe' },
        ]}
      />

      <ol className="space-y-1.5">
        {phases.map((p, i) => (
          <li key={p.title}>
            <button
              onClick={() => {
                setT(p.at + 0.001)
                setPlaying(false)
              }}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                i === phaseIdx ? 'border-sea bg-sea-soft/60' : 'border-transparent hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                    i <= phaseIdx ? 'bg-sea text-white' : 'bg-line text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-semibold text-ink">{p.title}</span>
                {p.call && <span className="ml-auto text-xs font-bold text-signal">“{p.call}”</span>}
              </div>
              {i === phaseIdx && (
                <div className="mt-1.5 space-y-1 pl-7 text-sm">
                  <p>
                    <span className="font-semibold text-signal">Helm:</span> <span className="text-muted">{p.helm}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-wind">Crew:</span> <span className="text-muted">{p.crew}</span>
                  </p>
                </div>
              )}
            </button>
          </li>
        ))}
      </ol>

      <Slider label="Timeline" value={Math.round(t * 100)} min={0} max={100} onChange={(v) => { setT(v / 100); setPlaying(false) }} unit="%" />
      <div className="flex items-center gap-2">
        <Button onClick={() => { if (t >= 1) setT(0); setPlaying((p) => !p) }}>
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play'}
        </Button>
        <Button variant="ghost" onClick={reset} ariaLabel="Restart">
          <RotateCcw size={16} />
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="accent-[var(--sea)]" />
          Slow motion
        </label>
      </div>
    </SimFrame>
  )
}
