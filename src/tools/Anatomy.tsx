import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Shuffle } from 'lucide-react'
import { Boat } from '../components/svg/Boat'
import { Segmented, Button } from '../components/ui/controls'

interface Part {
  id: string
  name: string
  desc: string
  /** Visible shape; receives the highlight state. */
  draw: (on: boolean) => ReactNode
  /** Extra-wide invisible stroke so thin lines are easy to tap. */
  hit?: string
}

const HI = 'var(--signal)'
const line = (d: string, on: boolean, w = 2.5, base = 'var(--ink)') => (
  <path d={d} fill="none" stroke={on ? HI : base} strokeWidth={on ? w + 2 : w} strokeLinecap="round" />
)

const HULL = 'M170,392 Q445,400 720,382 L712,394 Q640,442 520,452 L250,450 Q190,440 172,412 Z'

const SIDE: Part[] = [
  {
    id: 'hull',
    name: 'Hull',
    desc: 'The body of the boat. The front is the bow, the back is the stern, and the top edge is the gunwale ("gunnel").',
    draw: (on) => <path d={HULL} fill={on ? HI : 'var(--hull)'} stroke="var(--ink)" strokeWidth={2} />,
  },
  {
    id: 'keel',
    name: 'Keel',
    desc: 'The heavy fin under the boat. Its weight stops the boat capsizing and its shape stops it sliding sideways. Keelboats are self-righting.',
    draw: (on) => (
      <g fill={on ? HI : '#56677a'} stroke="var(--ink)" strokeWidth={1.5}>
        <path d="M432,452 L452,548 L548,548 L528,452 Z" />
        <ellipse cx={500} cy={552} rx={58} ry={11} />
      </g>
    ),
  },
  {
    id: 'rudder',
    name: 'Rudder',
    desc: 'The blade at the stern that steers the boat. It is turned by the tiller (or a wheel).',
    draw: (on) => <path d="M214,438 L222,530 L250,526 L246,444 Z" fill={on ? HI : '#56677a'} stroke="var(--ink)" strokeWidth={1.5} />,
  },
  {
    id: 'tiller',
    name: 'Tiller',
    desc: 'The stick attached to the top of the rudder. Push it away from you and the boat turns towards you — it works backwards!',
    draw: (on) => line('M232,394 L304,374', on, 5, '#8a6a44'),
  },
  {
    id: 'mast',
    name: 'Mast',
    desc: 'The tall vertical spar that holds up the sails.',
    draw: (on) => line('M480,368 L480,50', on, 5),
  },
  {
    id: 'boom',
    name: 'Boom',
    desc: 'The horizontal spar along the bottom of the mainsail. It swings across when you tack or gybe — keep your head clear!',
    draw: (on) => line('M480,320 L246,326', on, 5),
  },
  {
    id: 'mainsail',
    name: 'Mainsail',
    desc: 'The sail behind the mast, attached to the mast and boom. Controlled by the mainsheet.',
    draw: (on) => <path d="M485,58 L485,316 L252,322 Q318,190 485,58 Z" fill={on ? HI : 'var(--surface-2)'} fillOpacity={on ? 0.55 : 1} stroke="var(--sail-edge)" strokeWidth={2} />,
  },
  {
    id: 'jib',
    name: 'Jib (headsail)',
    desc: 'The sail in front of the mast, attached to the forestay. Controlled by the jib sheets. A big one that overlaps the mast is called a genoa.',
    draw: (on) => <path d="M704,380 L494,106 Q522,250 578,352 Z" fill={on ? HI : 'var(--surface-2)'} fillOpacity={on ? 0.55 : 1} stroke="var(--sail-edge)" strokeWidth={2} />,
  },
  {
    id: 'forestay',
    name: 'Forestay',
    desc: 'The wire from the top of the mast to the bow. It holds the mast up from the front, and the jib is attached to it.',
    draw: (on) => line('M482,92 L714,383', on, 1.6),
  },
  {
    id: 'backstay',
    name: 'Backstay',
    desc: 'The wire from the masthead to the stern. Tightening it bends the mast and flattens the mainsail in strong winds.',
    draw: (on) => line('M480,52 L176,393', on, 1.6),
  },
  {
    id: 'shrouds',
    name: 'Shrouds & spreaders',
    desc: 'Wires holding the mast up from the sides. The spreaders push the shrouds out to give a better angle.',
    draw: (on) => (
      <g>
        {line('M480,120 L502,386', on, 1.6)}
        {line('M480,120 L462,388', on, 1.6)}
        {line('M466,222 L494,222', on, 3)}
      </g>
    ),
    hit: 'M480,120 L482,388',
  },
  {
    id: 'mainsheet',
    name: 'Mainsheet & traveller',
    desc: 'The rope system that pulls the boom in and lets it out. The traveller is a track that moves the bottom of the mainsheet from side to side.',
    draw: (on) => (
      <g>
        {line('M300,325 L300,380', on, 2, 'var(--sea)')}
        {line('M276,384 L326,384', on, 4)}
        <rect x={294} y={379} width={12} height={8} rx={2} fill={on ? HI : 'var(--ink)'} />
      </g>
    ),
  },
  {
    id: 'vang',
    name: 'Vang (kicker)',
    desc: 'Pulls the boom down to stop it lifting, keeping the mainsail’s shape — important when reaching and running.',
    draw: (on) => line('M432,322 L478,370', on, 2.5, 'var(--sea)'),
  },
  {
    id: 'halyard',
    name: 'Halyards',
    desc: 'Ropes that hoist (raise) the sails up the mast. Each sail has its own halyard.',
    draw: (on) => line('M475,62 L475,364 L452,370', on, 1.4, 'var(--sea)'),
  },
  {
    id: 'jibsheet',
    name: 'Jib sheet',
    desc: 'The rope that trims the jib, led through a fairlead (jib car) to a winch in the cockpit. There is one on each side.',
    draw: (on) => line('M578,352 L462,382 L420,376', on, 2, 'var(--sea)'),
  },
  {
    id: 'winch',
    name: 'Winch',
    desc: 'A drum that gives you mechanical advantage to pull in sheets under load. Rope always goes on clockwise.',
    draw: (on) => (
      <g>
        <rect x={410} y={366} width={20} height={16} rx={4} fill={on ? HI : '#9aa8b5'} stroke="var(--ink)" strokeWidth={1.5} />
        <rect x={413} y={360} width={14} height={8} rx={2} fill={on ? HI : '#c6d0d9'} stroke="var(--ink)" strokeWidth={1} />
      </g>
    ),
  },
  {
    id: 'lifelines',
    name: 'Stanchions & lifelines',
    desc: 'Posts and wires around the deck to stop you falling overboard. The pulpit (bow) and pushpit (stern) are the rails at each end.',
    draw: (on) => (
      <g>
        {[280, 360, 560, 640].map((x) => (
          <g key={x}>{line(`M${x},390 L${x},356`, on, 2)}</g>
        ))}
        {line('M188,392 L188,356 L680,354', on, 1.4)}
        {line('M680,384 L684,352 L714,354 L714,382', on, 2)}
        {line('M188,392 L190,356 L232,356 L236,390', on, 2)}
      </g>
    ),
    hit: 'M188,356 L714,354',
  },
  {
    id: 'cabin',
    name: 'Cabin & cockpit',
    desc: 'The cabin (coachroof) is the raised part over the inside. The cockpit is the sunken area at the back where you steer and work the sheets.',
    draw: (on) => (
      <g>
        <path d="M432,392 L450,366 L622,364 L646,386 Z" fill={on ? HI : 'var(--surface-2)'} stroke="var(--ink)" strokeWidth={1.5} />
        {[480, 530, 580].map((x) => (
          <rect key={x} x={x} y={372} width={26} height={8} rx={3} fill="var(--wind)" opacity={0.5} />
        ))}
      </g>
    ),
  },
  {
    id: 'telltales',
    name: 'Telltales',
    desc: 'Short pieces of wool on the sails that show how the air is flowing. Streaming = good trim.',
    draw: (on) => (
      <g strokeWidth={on ? 5 : 3} strokeLinecap="round">
        <path d="M548,232 l18,2" stroke={on ? HI : 'var(--port)'} />
        <path d="M590,286 l18,2" stroke={on ? HI : 'var(--starboard)'} />
        <path d="M430,150 l18,4" stroke={on ? HI : 'var(--port)'} />
      </g>
    ),
  },
]

const SAIL: Part[] = (() => {
  const label = (on: boolean) => (on ? HI : 'var(--ink)')
  const dot = (x: number, y: number, on: boolean) => <circle cx={x} cy={y} r={on ? 11 : 8} fill={label(on)} stroke="white" strokeWidth={2.5} />
  return [
    { id: 'head', name: 'Head', desc: 'The top corner of the sail, where the halyard attaches.', draw: (on) => dot(300, 40, on) },
    { id: 'tack', name: 'Tack', desc: 'The front bottom corner of the sail. On the mainsail it sits at the gooseneck where the boom meets the mast.', draw: (on) => dot(300, 420, on) },
    { id: 'clew', name: 'Clew', desc: 'The back bottom corner. The outhaul (main) or sheets (jib) attach here.', draw: (on) => dot(80, 428, on) },
    { id: 'luff', name: 'Luff', desc: 'The front edge of the sail. When a sail "luffs" this edge flaps first.', draw: (on) => line('M300,52 L300,408', on, 6, 'var(--wind)') },
    { id: 'leech', name: 'Leech', desc: 'The back edge, from head to clew. Battens support its curve (the roach).', draw: (on) => line('M290,52 Q120,230 90,420', on, 6, 'var(--wind)') },
    { id: 'foot', name: 'Foot', desc: 'The bottom edge, from tack to clew, along the boom.', draw: (on) => line('M290,422 L92,428', on, 6, 'var(--wind)') },
    {
      id: 'battens',
      name: 'Battens',
      desc: 'Stiff strips in pockets that support the leech so the sail holds its shape.',
      draw: (on) => (
        <g>
          {[
            [196, 130, 238, 132],
            [148, 214, 210, 214],
            [116, 300, 186, 298],
            [100, 380, 170, 378],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? HI : 'var(--sail-edge)'} strokeWidth={on ? 6 : 4} strokeLinecap="round" />
          ))}
        </g>
      ),
    },
    {
      id: 'reef',
      name: 'Reef points & cringles',
      desc: 'A row of ties (or holes) and strong rings (cringles) on luff and leech, used to make the sail smaller in strong winds.',
      draw: (on) => (
        <g>
          {[110, 140, 170, 200, 230, 260].map((x) => (
            <circle key={x} cx={x} cy={352 + (300 - x) * -0.03} r={on ? 5 : 3.5} fill={on ? HI : 'var(--sail-edge)'} />
          ))}
          <circle cx={300} cy={350} r={on ? 8 : 6} fill="none" stroke={on ? HI : 'var(--ink)'} strokeWidth={3} />
          <circle cx={90} cy={352} r={on ? 8 : 6} fill="none" stroke={on ? HI : 'var(--ink)'} strokeWidth={3} />
        </g>
      ),
    },
    {
      id: 'sail-telltales',
      name: 'Telltales',
      desc: 'Wool or ribbon strips. On the jib they sit near the luff; on the main, on the leech.',
      draw: (on) => (
        <g strokeWidth={on ? 6 : 4} strokeLinecap="round" stroke={on ? HI : 'var(--port)'}>
          <path d="M184,140 l-20,4" />
          <path d="M138,224 l-20,4" />
          <path d="M106,310 l-20,4" />
        </g>
      ),
    },
    {
      id: 'outhaul',
      name: 'Outhaul & cunningham',
      desc: 'The outhaul pulls the clew along the boom to flatten the bottom of the sail; the cunningham pulls the luff down. Both flatten the sail in a breeze.',
      draw: (on) => (
        <g>
          {line('M80,428 L40,430', on, 3, 'var(--sea)')}
          {line('M300,392 L320,420', on, 3, 'var(--sea)')}
        </g>
      ),
    },
  ] as Part[]
})()

type View = 'side' | 'sail' | 'directions'

function PartsDiagram({ parts, view, active, onPick, target }: { parts: Part[]; view: View; active: string | null; onPick: (id: string) => void; target?: string | null }) {
  const viewBox = view === 'side' ? '120 30 640 540' : '0 0 400 470'
  return (
    <svg viewBox={viewBox} className="block h-auto w-full select-none">
      {view === 'side' && (
        <>
          <rect x="0" y="425" width="900" height="200" fill="var(--water)" />
          <path d="M120 425 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="var(--wind)" strokeOpacity={0.4} />
          <text x={740} y={418} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--muted)">BOW →</text>
          <text x={140} y={418} fontSize={13} fontWeight={700} fill="var(--muted)">← STERN</text>
        </>
      )}
      {view === 'sail' && (
        <>
          <path d="M300,40 L300,420 L80,428 Q120,230 300,40 Z" fill="var(--surface)" stroke="var(--sail-edge)" strokeWidth={2.5} />
          <line x1={304} y1={20} x2={304} y2={460} stroke="var(--ink)" strokeWidth={6} />
          <line x1={304} y1={430} x2={60} y2={434} stroke="var(--ink)" strokeWidth={6} />
        </>
      )}
      {parts.map((p) => {
        const on = active === p.id
        return (
          <g
            key={p.id}
            onClick={() => onPick(p.id)}
            onMouseEnter={() => !target && onPick(p.id)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={p.name}
          >
            {p.draw(on)}
            {p.hit && <path d={p.hit} stroke="transparent" strokeWidth={26} fill="none" />}
          </g>
        )
      })}
    </svg>
  )
}

function Directions() {
  const [windSide, setWindSide] = useState<'port' | 'starboard'>('starboard')
  const ws = windSide === 'starboard' ? 1 : -1
  const T = ({ x, y, children, c = 'var(--ink)', a = 'middle' as const, s = 15 }: { x: number; y: number; children: ReactNode; c?: string; a?: 'start' | 'middle' | 'end'; s?: number }) => (
    <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={700} fill={c}>
      {children}
    </text>
  )
  return (
    <div>
      <svg viewBox="0 0 600 560" className="block h-auto w-full select-none">
        <rect width="600" height="560" fill="var(--water)" />
        {/* windward / leeward halves */}
        <rect x={ws > 0 ? 300 : 0} y={0} width={300} height={560} fill="var(--wind)" opacity={0.08} />
        <T x={ws > 0 ? 520 : 80} y={40} c="var(--wind)">WINDWARD</T>
        <T x={ws > 0 ? 80 : 520} y={40} c="var(--muted)">LEEWARD</T>
        {/* arrow drawn pointing down; turn it to blow from the windward edge towards the boat */}
        <g transform={`translate(${ws > 0 ? 560 : 40} 280) rotate(${ws > 0 ? 90 : -90})`}>
          <path d="M-8,-30 L8,-30 L8,6 L18,6 L0,30 L-18,6 L-8,6 Z" fill="var(--wind)" />
        </g>
        <Boat x={300} y={290} heading={0} scale={3} sail={30} side={(-ws) as 1 | -1} />
        {/* labels */}
        <T x={300} y={96} c="var(--muted)" s={12}>forward ↑</T>
        <T x={300} y={120}>BOW</T>
        <T x={300} y={482}>STERN</T>
        <T x={300} y={502} c="var(--muted)" s={12}>aft ↓</T>
        <T x={180} y={290} c="var(--port)" a="end">PORT</T>
        <T x={180} y={310} c="var(--port)" a="end" s={11}>red light · left</T>
        <T x={420} y={290} c="var(--starboard)" a="start">STARBOARD</T>
        <T x={420} y={310} c="var(--starboard)" a="start" s={11}>green light · right</T>
        <T x={200} y={170} c="var(--muted)" a="end" s={12}>port bow</T>
        <T x={400} y={170} c="var(--muted)" a="start" s={12}>starboard bow</T>
        <T x={200} y={420} c="var(--muted)" a="end" s={12}>port quarter</T>
        <T x={400} y={420} c="var(--muted)" a="start" s={12}>starboard quarter</T>
        <line x1={240} y1={290} x2={360} y2={290} stroke="var(--muted)" strokeDasharray="3 4" />
        <T x={300} y={540} c="var(--muted)" s={12}>“abeam” = straight out to the side · “amidships” = the middle</T>
      </svg>
      <div className="flex flex-wrap items-center gap-3 border-t border-line p-3">
        <span className="text-sm text-muted">Wind coming over the</span>
        <Segmented
          value={windSide}
          onChange={setWindSide}
          options={[
            { value: 'port', label: 'Port side' },
            { value: 'starboard', label: 'Starboard side' },
          ]}
        />
      </div>
      <p className="px-4 pb-4 text-sm text-muted">
        <strong className="text-ink">Windward</strong> is the side the wind comes from (the high side when heeling — where
        the crew sits). <strong className="text-ink">Leeward</strong> (“loo-ard”) is the side away from the wind, where
        the sails are. Memory aid: <em>“There’s no red port left in the bottle.”</em>
      </p>
    </div>
  )
}

export function Anatomy({ view: initial = 'side' }: { view?: View }) {
  const [view, setView] = useState<View>(initial)
  const parts = view === 'side' ? SIDE : SAIL
  const [active, setActive] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<{ target: string; result?: 'right' | 'wrong' } | null>(null)
  const current = parts.find((p) => p.id === active)
  const target = useMemo(() => parts.find((p) => p.id === quiz?.target), [parts, quiz])

  const newQuiz = () => {
    const pool = parts.filter((p) => p.id !== quiz?.target)
    setQuiz({ target: pool[Math.floor(Math.random() * pool.length)].id })
    setActive(null)
  }
  const pick = (id: string) => {
    setActive(id)
    if (quiz && !quiz.result) setQuiz({ ...quiz, result: id === quiz.target ? 'right' : 'wrong' })
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
        <Segmented
          value={view}
          onChange={(v) => {
            setView(v)
            setActive(null)
            setQuiz(null)
          }}
          options={[
            { value: 'side', label: 'The boat' },
            { value: 'sail', label: 'Parts of a sail' },
            { value: 'directions', label: 'Directions' },
          ]}
        />
        {view !== 'directions' && (
          <Button variant={quiz ? 'soft' : 'ghost'} onClick={newQuiz}>
            <Shuffle size={15} /> {quiz ? 'Next part' : 'Find the part'}
          </Button>
        )}
      </div>
      {view === 'directions' ? (
        <Directions />
      ) : (
        <div className="grid md:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-line bg-surface-2/40 md:border-r md:border-b-0">
            <PartsDiagram parts={parts} view={view} active={active} onPick={pick} target={quiz?.target} />
          </div>
          <div className="flex flex-col gap-3 p-4">
            {quiz && (
              <div className={`rounded-2xl p-3 ${quiz.result === 'right' ? 'bg-starboard/15' : quiz.result === 'wrong' ? 'bg-port/10' : 'bg-signal-soft'}`}>
                <div className="text-xs font-semibold tracking-wider text-muted uppercase">Find the…</div>
                <div className="font-display text-xl font-bold">{target?.name}</div>
                {quiz.result === 'right' && <div className="text-sm font-semibold text-starboard">Spot on! ✓</div>}
                {quiz.result === 'wrong' && <div className="text-sm font-semibold text-port">Not quite — that’s the {current?.name.toLowerCase()}. Try “Next part”.</div>}
              </div>
            )}
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-surface-2 p-4">
                  <div className="font-display text-xl font-bold text-signal">{current.name}</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink">{current.desc}</p>
                </motion.div>
              ) : (
                <p className="text-sm text-muted">Tap or hover over any part of the drawing to learn its name and what it does.</p>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap gap-1.5">
              {parts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !quiz && setActive(p.id)}
                  disabled={!!quiz}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    active === p.id ? 'bg-signal text-white' : 'bg-surface-2 text-muted hover:text-ink'
                  } ${quiz ? 'opacity-40' : ''}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
