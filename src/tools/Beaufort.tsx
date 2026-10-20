import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { beaufortForce } from '../lib/sailing'
import { Slider } from '../components/ui/controls'

export interface BeaufortLevel {
  force: number
  name: string
  knots: string
  sea: string
  keelboat: string
  /** 0 = go, 1 = take care, 2 = reef / experienced only, 3 = stay ashore */
  rating: 0 | 1 | 2 | 3
}

export const BEAUFORT: BeaufortLevel[] = [
  { force: 0, name: 'Calm', knots: '< 1', sea: 'Sea like a mirror.', keelboat: 'No sailing breeze. Motor, or wait for the sea breeze.', rating: 1 },
  { force: 1, name: 'Light air', knots: '1–3', sea: 'Ripples like scales, no crests.', keelboat: 'Drifting. Move gently, ease the sails, keep weight to leeward to help them set.', rating: 0 },
  { force: 2, name: 'Light breeze', knots: '4–6', sea: 'Small wavelets, glassy crests that don’t break.', keelboat: 'Gentle sailing — ideal for a first lesson.', rating: 0 },
  { force: 3, name: 'Gentle breeze', knots: '7–10', sea: 'Large wavelets, crests begin to break, a few whitecaps.', keelboat: 'Lovely learning conditions. The boat heels a little and responds well.', rating: 0 },
  { force: 4, name: 'Moderate breeze', knots: '11–16', sea: 'Small waves, frequent whitecaps.', keelboat: 'Lively and fun. A typical Fremantle Doctor afternoon. Crew on the rail; learners may reef in gusts.', rating: 1 },
  { force: 5, name: 'Fresh breeze', knots: '17–21', sea: 'Moderate waves, many whitecaps, some spray.', keelboat: 'Reef the main and flatten sails. Training may be limited — instructors decide.', rating: 2 },
  { force: 6, name: 'Strong breeze', knots: '22–27', sea: 'Large waves, extensive white foam crests, spray.', keelboat: 'Heavy weather. Double reef. Learn-to-sail sessions are usually cancelled. BOM strong wind warning from 26 kn.', rating: 2 },
  { force: 7, name: 'Near gale', knots: '28–33', sea: 'Sea heaps up, foam blown in streaks.', keelboat: 'Stay ashore.', rating: 3 },
  { force: 8, name: 'Gale', knots: '34–40', sea: 'Moderately high waves, crests break into spindrift.', keelboat: 'Gale warning. Boats should be secured in port.', rating: 3 },
  { force: 9, name: 'Strong gale', knots: '41–47', sea: 'High waves, dense foam streaks, spray reduces visibility.', keelboat: 'Stay ashore. Check mooring lines.', rating: 3 },
  { force: 10, name: 'Storm', knots: '48–55', sea: 'Very high waves with long overhanging crests.', keelboat: 'Storm warning.', rating: 3 },
  { force: 11, name: 'Violent storm', knots: '56–63', sea: 'Exceptionally high waves.', keelboat: 'Storm warning.', rating: 3 },
  { force: 12, name: 'Hurricane', knots: '64+', sea: 'Air filled with foam and spray, sea completely white.', keelboat: 'Hurricane-force wind warning.', rating: 3 },
]

const RATING = [
  { label: 'Good to go', color: 'var(--starboard)' },
  { label: 'Take care', color: 'var(--wind)' },
  { label: 'Reef / experienced', color: 'var(--signal)' },
  { label: 'Stay ashore', color: 'var(--port)' },
]

function SeaScene({ force }: { force: number }) {
  const amp = [0, 1.2, 2.5, 4, 7, 11, 16, 21, 26, 30, 33, 35, 36][force]
  const len = 90 + force * 12
  // Periodic in `len`, so translating by one wavelength loops seamlessly. Sharper crests as force rises.
  const wave = (y: number, a: number, phase: number) => {
    let d = `M-200,${y}`
    for (let x = -200; x <= 1000; x += 8) {
      const t = (2 * Math.PI * (x + phase)) / len
      const h = a * (Math.sin(t) + 0.25 * Math.min(1, force / 6) * Math.sin(2 * t - 1.2))
      d += ` L${x},${(y - h).toFixed(1)}`
    }
    return `${d} L1000,400 L-200,400 Z`
  }
  const caps = useMemo(() => Array.from({ length: Math.max(0, (force - 3) * 4) }, (_, i) => ({ x: (i * 137) % 800, y: 250 + ((i * 53) % 110) })), [force])
  const heel = Math.min(28, force * 4.5)
  const reefed = force >= 5
  const flagWave = Math.max(0, force) * 1.2
  const dur = Math.max(1.2, 6 - force * 0.4)
  return (
    <svg viewBox="0 0 800 360" className="block h-auto w-full">
      <defs>
        <linearGradient id="bf-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={force >= 7 ? '#5b6b7c' : '#7cc4f0'} />
          <stop offset="1" stopColor={force >= 7 ? '#94a3b2' : '#d6efff'} />
        </linearGradient>
      </defs>
      <rect width="800" height="360" fill="url(#bf-sky)" />
      {/* clouds drift faster with more wind */}
      <motion.g animate={{ x: [-120, 900] }} transition={{ duration: force ? 60 / (force + 1) + 4 : 400, repeat: Infinity, ease: 'linear' }}>
        <ellipse cx={0} cy={60} rx={60} ry={18} fill="white" opacity={0.8} />
        <ellipse cx={-300} cy={95} rx={44} ry={13} fill="white" opacity={0.7} />
      </motion.g>
      {/* flag on a pole */}
      <line x1={700} y1={240} x2={700} y2={120} stroke="#334155" strokeWidth={4} />
      <motion.path
        fill="var(--signal)"
        animate={{
          d:
            force === 0
              ? ['M700,122 q4,18 0,40 l-4,0 q4,-20 4,-40 Z']
              : [
                  `M700,122 q${-30} ${-flagWave} -60 ${4} l0,26 q30 ${flagWave} 60 -4 Z`,
                  `M700,122 q${-30} ${flagWave} -60 ${-2} l0,26 q30 ${-flagWave} 60 2 Z`,
                ],
        }}
        transition={{ duration: Math.max(0.25, 1.2 - force * 0.08), repeat: Infinity, repeatType: 'reverse' }}
      />
      {/* water */}
      <motion.path d={wave(250, amp, 0)} fill="#2f80c0" animate={{ x: [0, -len] }} transition={{ duration: dur, repeat: Infinity, ease: 'linear' }} />
      {/* boat */}
      <motion.g
        animate={{ y: [0, amp * 0.6, 0], rotate: [-heel, -heel - amp * 0.3, -heel] }}
        transition={{ duration: dur * 0.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'view-box', originX: '360px', originY: '250px' }}
      >
        <path d="M300,240 L420,240 L405,262 L315,262 Z" fill="white" stroke="#0b2545" strokeWidth={2} />
        <line x1={360} y1={240} x2={360} y2={reefed ? 140 : 100} stroke="#0b2545" strokeWidth={3} />
        <path d={reefed ? 'M362,145 L362,234 L410,234 Z' : 'M362,104 L362,234 L418,234 Z'} fill="white" stroke="#64748b" />
        <path d={reefed ? 'M358,170 L358,234 L330,234 Z' : 'M358,120 L358,234 L318,234 Z'} fill="#e2e8f0" stroke="#64748b" />
      </motion.g>
      <motion.path d={wave(275, amp * 0.8, len / 3)} fill="#1d6aa5" animate={{ x: [-len, 0] }} transition={{ duration: dur * 1.3, repeat: Infinity, ease: 'linear' }} />
      <motion.path d={wave(310, amp * 0.6, len / 5)} fill="#155a8f" animate={{ x: [0, -len] }} transition={{ duration: dur * 0.9, repeat: Infinity, ease: 'linear' }} />
      {caps.map((c, i) => (
        <motion.ellipse
          key={i}
          cx={c.x}
          cy={c.y}
          rx={6 + force}
          ry={2}
          fill="white"
          animate={{ opacity: [0, 0.9, 0], x: [0, -30] }}
          transition={{ duration: 2.2, delay: (i % 7) * 0.3, repeat: Infinity }}
        />
      ))}
      <text x={20} y={340} fontSize={16} fontWeight={800} fill="white" opacity={0.9}>
        Force {force}
      </text>
    </svg>
  )
}

export function BeaufortScale({ knots }: { knots?: number }) {
  const [force, setForce] = useState(knots != null ? beaufortForce(knots) : 3)
  const level = BEAUFORT[force]
  const r = RATING[level.rating]
  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <SeaScene force={force} />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="font-display text-2xl font-bold">
              {force} · {level.name}
            </span>
            <span className="ml-2 font-semibold text-sea">{level.knots} knots</span>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: r.color }}>
            {r.label}
          </span>
        </div>
        <Slider label="Beaufort force" value={force} min={0} max={12} onChange={setForce} format={(v) => `Force ${v}`} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs font-semibold tracking-wider text-muted uppercase">The water looks like</div>
            <p className="mt-1 text-[15px]">{level.sea}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs font-semibold tracking-wider text-muted uppercase">On a keelboat</div>
            <p className="mt-1 text-[15px]">{level.keelboat}</p>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
          {BEAUFORT.map((b) => (
            <button
              key={b.force}
              onClick={() => setForce(b.force)}
              className="flex-1 transition-opacity"
              style={{ background: RATING[b.rating].color, opacity: b.force === force ? 1 : 0.35 }}
            />
          ))}
        </div>
        <p className="text-xs text-muted">Guidance is general. Your instructors and the club decide whether training goes ahead.</p>
      </div>
    </div>
  )
}
