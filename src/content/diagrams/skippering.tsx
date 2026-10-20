import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Boat } from '../../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../../components/svg/Wind'
import { Segmented, Slider } from '../../components/ui/controls'
import { Stepper } from '../../components/ui/Stepper'
import { Figure, Label } from './Figure'

/** Hove-to: jib backed, main eased, tiller lashed to leeward. */
export function HeaveTo() {
  return (
    <Figure caption="Hove-to: the backed jib pushes the bow away, the tiller (lashed to leeward) tries to turn it back into the wind. The two balance and the boat sits quietly, drifting slowly sideways — perfect for a break, reefing, or sorting a problem.">
      <svg viewBox="0 0 600 460" className="block h-auto w-full">
        <WaterDefs id="ht" />
        <Water id="ht" width={600} height={460} />
        <WindField windFrom={0} width={600} height={460} speed={14} density={0.6} />
        <WindArrow windFrom={0} cx={300} cy={250} r={200} label />
        {/* Starboard tack close reach; jib backed to windward (starboard side). */}
        <Boat x={300} y={260} heading={-50} scale={2.6} sail={45} side={-1} jib={25} showJib={false} tiller={-28} />
        <g transform="translate(300 260) rotate(-50) scale(2.6)">
          <path d="M0,-47 Q30,-40 20,-14 Q12,-30 0,-47 Z" fill="var(--signal)" opacity={0.9} stroke="#c2410c" />
        </g>
        <path d="M120,300 l-50,18" stroke="var(--muted)" strokeWidth={3} strokeDasharray="4 4" markerEnd="url(#ht-arr)" />
        <defs>
          <marker id="ht-arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)" />
          </marker>
        </defs>
        <Label x={120} y={340} size={12} color="var(--muted)">slow drift</Label>
        <Label x={420} y={110} size={13} color="var(--signal)">jib backed (sheeted to windward)</Label>
        <Label x={420} y={130} size={13} color="var(--ink)">main eased</Label>
        <Label x={300} y={440} size={13} color="var(--ink)">tiller lashed to leeward</Label>
      </svg>
    </Figure>
  )
}

/** Dock lines on a boat alongside a jetty. */
export function DockLines() {
  const [active, setActive] = useState<string | null>(null)
  const lines = [
    { id: 'bow', name: 'Bow line', d: 'M300,96 C330,80 360,70 400,60', text: 'From the bow forward to the jetty. Stops the boat moving back.' },
    { id: 'stern', name: 'Stern line', d: 'M300,500 C330,515 360,525 400,540', text: 'From the stern aft to the jetty. Stops the boat moving forward.' },
    { id: 'fwd-spring', name: 'Forward spring', d: 'M312,200 C340,260 370,320 400,360', text: 'From the bow area running aft. Stops the boat moving forward. Great for "springing off".' },
    { id: 'aft-spring', name: 'Aft spring', d: 'M312,400 C340,340 370,280 400,240', text: 'From the stern area running forward. Stops the boat moving backward.' },
  ]
  const cur = lines.find((l) => l.id === active)
  return (
    <Figure caption={cur ? <><strong className="text-ink">{cur.name}:</strong> {cur.text}</> : 'Tap a line. Springs (the diagonal lines) stop the boat surging forward and back; bow and stern lines hold it in.'}>
      <svg viewBox="0 0 560 600" className="block h-auto w-full">
        <WaterDefs id="dl" />
        <Water id="dl" width={560} height={600} />
        <rect x={400} y={0} width={160} height={600} fill="#b08a5a" />
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={i} x1={400} y1={i * 40} x2={560} y2={i * 40} stroke="#8a6a44" strokeWidth={2} />
        ))}
        {[60, 240, 360, 540].map((y) => (
          <rect key={y} x={404} y={y - 8} width={16} height={16} rx={4} fill="#374151" />
        ))}
        <Boat x={300} y={300} heading={0} scale={4} showMain={false} showJib={false} />
        {[180, 300, 420].map((y) => (
          <rect key={y} x={368} y={y - 18} width={12} height={36} rx={6} fill="#f97316" />
        ))}
        {lines.map((l) => (
          <g key={l.id} onClick={() => setActive(l.id)} style={{ cursor: 'pointer' }}>
            <path d={l.d} fill="none" stroke="transparent" strokeWidth={26} />
            <path d={l.d} fill="none" stroke={active === l.id ? 'var(--signal)' : '#e9b44c'} strokeWidth={active === l.id ? 8 : 6} strokeLinecap="round" />
          </g>
        ))}
        <Label x={480} y={300} color="white" size={16}>JETTY</Label>
        <Label x={350} y={300} color="#f97316" size={11} anchor="end">fenders</Label>
      </svg>
    </Figure>
  )
}

/** Picking up a mooring buoy: approach into the wind and stop. */
export function MooringApproach() {
  const steps = [
    { title: 'Look at the moored boats', body: 'Boats on moorings point into the wind (or current). That tells you the direction to make your final approach.' },
    { title: 'Approach slowly from downwind', body: 'Line up a few boat lengths downwind of the buoy. Ease the sails or use minimal engine — you want to arrive at walking pace.' },
    { title: 'Turn head to wind and glide', body: 'Turn into the wind so the boat slows and stops with the buoy at the bow. Bow crew points at the buoy so the helm can see where it is.' },
    { title: 'Pick up and make fast', body: 'Bow crew hooks the mooring line and makes it fast on the bow cleat. Missed it? Don’t grab — sail away and go round again.' },
  ]
  const pos = [
    { x: 160, y: 470, h: 40 },
    { x: 250, y: 400, h: 15 },
    { x: 300, y: 260, h: 0 },
    { x: 300, y: 190, h: 0 },
  ]
  return (
    <Stepper
      title="Picking up a mooring"
      steps={steps}
      visual={(i) => (
        <svg viewBox="0 0 600 560" className="block h-auto w-full">
          <WaterDefs id="ma" />
          <Water id="ma" width={600} height={560} />
          <WindField windFrom={0} width={600} height={560} speed={10} density={0.6} />
          <WindArrow windFrom={0} cx={510} cy={280} r={200} label />
          {[[100, 160], [470, 420], [120, 300]].map(([x, y], k) => (
            <Boat key={k} x={x} y={y} heading={0} scale={0.8} showMain={false} showJib={false} opacity={0.7} accent="var(--muted)" />
          ))}
          <circle cx={300} cy={130} r={10} fill="var(--signal)" stroke="white" strokeWidth={3} />
          <path d="M160,470 C200,440 250,410 270,360 C290,310 300,260 300,190" fill="none" stroke="white" strokeWidth={3} strokeDasharray="5 7" opacity={0.7} />
          <motion.g animate={{ x: pos[i].x, y: pos[i].y }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <Boat heading={pos[i].h} scale={1} sail={i >= 2 ? 2 : 50} side={-1} flow={i >= 2 ? 'luffing' : undefined} />
          </motion.g>
        </svg>
      )}
    />
  )
}

/** Where everyone sits and what they do. */
export function CrewPositions({ spinnaker = false }: { spinnaker?: boolean }) {
  const roles = spinnaker
    ? [
        { id: 'bow', name: 'Bow', x: 300, y: 130, text: 'Rigs the pole, calls the set, gybes the pole, calls distance to marks.' },
        { id: 'pit', name: 'Mast / Pit', x: 300, y: 230, text: 'Hoists and drops halyards, manages the topping lift and downhaul.' },
        { id: 'trim', name: 'Trimmer', x: 360, y: 340, text: 'Plays the spinnaker sheet continuously; works the guy with the helm.' },
        { id: 'main', name: 'Main', x: 260, y: 380, text: 'Trims main and vang; helps with the guy during gybes.' },
        { id: 'helm', name: 'Helm', x: 300, y: 450, text: 'Steers to keep the kite full; calls manoeuvres; watches for gusts.' },
      ]
    : [
        { id: 'bow', name: 'Bow', x: 300, y: 140, text: 'Foredeck jobs: headsail changes, anchor, mooring lines, lookout ahead.' },
        { id: 'jib', name: 'Jib trimmer', x: 360, y: 330, text: 'Works the jib sheets and winches; watches the telltales.' },
        { id: 'main', name: 'Main trimmer', x: 250, y: 380, text: 'Mainsheet, traveller and vang. Controls power in gusts.' },
        { id: 'helm', name: 'Helm', x: 300, y: 450, text: 'Steers, calls the manoeuvres, watches the wind and traffic.' },
        { id: 'skip', name: 'Skipper', x: 340, y: 450, text: 'Responsible for the boat and crew — often also the helm on a small keelboat.' },
      ]
  const [active, setActive] = useState(roles[0].id)
  const cur = roles.find((r) => r.id === active)!
  return (
    <Figure caption={<><strong className="text-ink">{cur.name}:</strong> {cur.text}</>}>
      <svg viewBox="0 0 600 560" className="block h-auto w-full">
        <WaterDefs id="cp" />
        <Water id="cp" width={600} height={560} />
        <Boat x={300} y={290} heading={0} scale={4.6} sail={20} side={-1} showMain={!spinnaker || true} />
        {roles.map((r) => (
          <g key={r.id} onClick={() => setActive(r.id)} style={{ cursor: 'pointer' }}>
            {active === r.id && <circle cx={r.x} cy={r.y} r={22} fill="var(--signal)" opacity={0.3} className="pulse-ring" />}
            <circle cx={r.x} cy={r.y} r={14} fill={active === r.id ? 'var(--signal)' : 'var(--wind)'} stroke="white" strokeWidth={3} />
            <Label x={r.x + 22} y={r.y + 5} anchor="start" size={13}>{r.name}</Label>
          </g>
        ))}
      </svg>
    </Figure>
  )
}

/** The Fremantle Doctor: how a sea breeze forms through a summer day. */
export function SeaBreeze() {
  const [hour, setHour] = useState(13)
  // Land heats from ~9am; sea breeze sets in around midday at the coast, reaches the river in the early afternoon.
  const heat = Math.max(0, Math.min(1, (hour - 8) / 5)) * (hour > 18 ? Math.max(0, 1 - (hour - 18) / 3) : 1)
  const breeze = hour >= 12 && hour <= 19 ? Math.min(1, (hour - 11) / 3) * (hour > 17 ? Math.max(0.3, 1 - (hour - 17) / 3) : 1) : 0
  const easterly = hour < 11 ? 1 - Math.max(0, (hour - 8) / 4) : 0
  const knots = Math.round(easterly * 10 + breeze * 18)
  const dir = breeze > 0.15 ? 'SW (the Doctor)' : easterly > 0.1 ? 'E (offshore land breeze)' : 'calm / variable'
  const sunX = 100 + ((hour - 6) / 14) * 400
  return (
    <Figure
      caption={
        <>
          <strong className="text-ink">{hour}:00</strong> — wind on the Swan ≈ {knots} kn from {dir}. Summer mornings often start with an
          easterly off the land. As the land heats up, air rises over it and cooler sea air flows in from the south-west: the Fremantle Doctor,
          often 15–25 kn by mid-afternoon. It usually arrives at Fremantle first and reaches Matilda Bay a little later.
        </>
      }
      controls={<Slider label="Time of day (summer)" value={hour} min={6} max={21} onChange={setHour} format={(v) => `${v}:00`} />}
    >
      <svg viewBox="0 0 600 340" className="block h-auto w-full">
        <defs>
          <linearGradient id="sb-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={hour < 7 || hour > 19 ? '#1e3a5f' : '#7cc4f0'} />
            <stop offset="1" stopColor={hour < 7 || hour > 19 ? '#475569' : '#e0f2fe'} />
          </linearGradient>
        </defs>
        <rect width="600" height="340" fill="url(#sb-sky)" />
        <circle cx={sunX} cy={60 + Math.abs(hour - 13) * 8} r={22} fill="#fbbf24" opacity={hour > 6 && hour < 20 ? 1 : 0.2} />
        {/* sea left, land right */}
        <rect x={0} y={240} width={260} height={100} fill="#2f80c0" />
        <path d="M260,240 L600,226 L600,340 L260,340 Z" fill={`rgb(${180 + heat * 50} ${150 - heat * 20} ${100 - heat * 30})`} />
        <Label x={130} y={300} color="white">INDIAN OCEAN</Label>
        <Label x={440} y={300} color="white">PERTH (land)</Label>
        <rect x={330} y={230} width={60} height={8} fill="#2f80c0" />
        <Label x={360} y={222} size={11} color="var(--navy)">Swan River</Label>
        {/* rising hot air */}
        {heat > 0.3 &&
          [400, 460, 520].map((x, i) => (
            <motion.path
              key={x}
              d={`M${x},220 q-10,-30 0,-60 q10,-30 0,-60`}
              fill="none"
              stroke="#f97316"
              strokeWidth={3}
              strokeLinecap="round"
              animate={{ opacity: [0, heat, 0], y: [0, -20] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
            />
          ))}
        {/* sea breeze circulation */}
        {breeze > 0 && (
          <g opacity={breeze}>
            <path d="M60,215 C200,205 330,205 450,210" fill="none" stroke="var(--wind)" strokeWidth={6} strokeLinecap="round" className="flow-line" />
            <path d="M450,100 C330,90 200,90 60,100" fill="none" stroke="var(--wind)" strokeWidth={3} strokeLinecap="round" className="flow-line" opacity={0.5} />
            <Label x={200} y={195} color="var(--wind)">sea breeze →</Label>
          </g>
        )}
        {easterly > 0.1 && (
          <g opacity={easterly}>
            <path d="M560,215 C440,212 300,212 120,215" fill="none" stroke="#a16207" strokeWidth={5} strokeLinecap="round" className="flow-line" />
            <Label x={420} y={195} color="#a16207">← easterly</Label>
          </g>
        )}
      </svg>
    </Figure>
  )
}

function LateralMark({ type, x, y }: { type: 'port' | 'starboard'; x: number; y: number }) {
  return type === 'port' ? (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-12} y={-34} width={24} height={34} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.5} />
      <rect x={-12} y={-46} width={24} height={10} fill="#dc2626" />
      <ellipse cx={0} cy={2} rx={20} ry={5} fill="#7f1d1d" opacity={0.4} />
    </g>
  ) : (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-12,0 L0,-36 L12,0 Z" fill="#16a34a" stroke="#14532d" strokeWidth={1.5} />
      <path d="M-8,-40 L0,-54 L8,-40 Z" fill="#16a34a" />
      <ellipse cx={0} cy={2} rx={20} ry={5} fill="#14532d" opacity={0.4} />
    </g>
  )
}

function Cardinal({ dir, x, y }: { dir: 'N' | 'E' | 'S' | 'W'; x: number; y: number }) {
  const bands: Record<typeof dir, string[]> = {
    N: ['#111', '#facc15'],
    S: ['#facc15', '#111'],
    E: ['#111', '#facc15', '#111'],
    W: ['#facc15', '#111', '#facc15'],
  }
  const tops: Record<typeof dir, ReactNode> = {
    N: (
      <>
        <path d="M-8,-58 L0,-72 L8,-58 Z" fill="#111" />
        <path d="M-8,-44 L0,-58 L8,-44 Z" fill="#111" />
      </>
    ),
    S: (
      <>
        <path d="M-8,-72 L0,-58 L8,-72 Z" fill="#111" />
        <path d="M-8,-58 L0,-44 L8,-58 Z" fill="#111" />
      </>
    ),
    E: (
      <>
        <path d="M-8,-58 L0,-72 L8,-58 Z" fill="#111" />
        <path d="M-8,-56 L0,-42 L8,-56 Z" fill="#111" />
      </>
    ),
    W: (
      <>
        <path d="M-8,-72 L0,-58 L8,-72 Z" fill="#111" />
        <path d="M-8,-44 L0,-58 L8,-44 Z" fill="#111" />
      </>
    ),
  }
  const b = bands[dir]
  const h = 36 / b.length
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={-36} x2={0} y2={-46} stroke="#111" strokeWidth={2} />
      {b.map((c, i) => (
        <rect key={i} x={-11} y={-36 + i * h} width={22} height={h} fill={c} />
      ))}
      {tops[dir]}
      <Label x={0} y={22} size={12}>{dir}</Label>
    </g>
  )
}

/** IALA region A lateral marks and cardinal marks. */
export function ChannelMarks() {
  const [view, setView] = useState<'lateral' | 'cardinal'>('lateral')
  return (
    <Figure
      caption={
        view === 'lateral' ? (
          <>
            Australia uses <strong className="text-ink">IALA Region A</strong>. Heading upstream / into harbour (the direction of buoyage), keep{' '}
            <span className="font-semibold text-port">red port marks</span> on your left and{' '}
            <span className="font-semibold text-starboard">green starboard marks</span> on your right. Coming back out, it’s the reverse.
          </>
        ) : (
          <>
            A <strong className="text-ink">cardinal mark</strong> tells you which side the safe water is: pass <em>north</em> of a north cardinal, and so on. The
            black cones point to where the black bands are (N: both up; S: both down; E: away from each other; W: towards each other).
          </>
        )
      }
      controls={
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'lateral', label: 'Lateral marks' },
            { value: 'cardinal', label: 'Cardinal marks' },
          ]}
        />
      }
    >
      <svg viewBox="0 0 600 420" className="block h-auto w-full">
        <WaterDefs id="cm" />
        <Water id="cm" width={600} height={420} />
        {view === 'lateral' ? (
          <>
            <path d="M0,0 L170,0 C200,120 200,300 170,420 L0,420 Z" fill="#d6c08f" opacity={0.6} />
            <path d="M600,0 L430,0 C400,120 400,300 430,420 L600,420 Z" fill="#d6c08f" opacity={0.6} />
            <Label x={300} y={30} size={12} color="var(--muted)">↑ upstream / into harbour</Label>
            {[110, 250, 390].map((y) => (
              <g key={y}>
                <LateralMark type="port" x={225} y={y} />
                <LateralMark type="starboard" x={375} y={y} />
              </g>
            ))}
            <Boat x={300} y={330} heading={0} scale={0.9} showMain={false} showJib={false} />
            <path d="M300,280 L300,60" stroke="white" strokeWidth={3} strokeDasharray="6 8" opacity={0.7} />
          </>
        ) : (
          <>
            <circle cx={300} cy={210} r={36} fill="#a8a29e" stroke="#57534e" strokeWidth={2} />
            <Label x={300} y={215} size={12} color="white">DANGER</Label>
            <Cardinal dir="N" x={300} y={110} />
            <Cardinal dir="S" x={300} y={370} />
            <Cardinal dir="E" x={450} y={240} />
            <Cardinal dir="W" x={150} y={240} />
          </>
        )}
      </svg>
    </Figure>
  )
}

/** Putting a reef in the mainsail. */
export function ReefSteps() {
  const steps = [
    { title: 'Decide early', body: '“If you’re thinking about reefing, it’s time to reef.” It is much easier before the wind is too strong. Brief the crew.' },
    { title: 'Depower', body: 'Sail close-hauled or heave-to. Ease the mainsheet and vang so the main flaps and there is no load on the boom. Take up the topping lift if fitted.' },
    { title: 'Lower to the reef point', body: 'Ease the halyard until the reef cringle on the luff reaches the boom. Hook it on the reefing horn (or pull down the reef line).' },
    { title: 'Re-tension the luff', body: 'Hoist the halyard hard again. A tight luff keeps the smaller sail flat.' },
    { title: 'Pull down the leech', body: 'Haul in the reefing line at the back of the boom until the leech cringle is tight on the boom. This becomes the new clew.' },
    { title: 'Tidy & sail on', body: 'Tie the loose sail with reef ties around the bottom of the sail only (not around the boom). Trim and sail on — flatter, more upright, more in control.' },
  ]
  return (
    <Stepper
      title="Reefing the main (slab reefing)"
      steps={steps}
      visual={(i) => {
        const lowered = i >= 2
        const head = lowered ? 120 : 40
        return (
          <svg viewBox="0 0 400 420" className="block h-auto w-full">
            <rect width="400" height="420" fill="var(--surface-2)" />
            <line x1={300} y1={20} x2={300} y2={400} stroke="var(--ink)" strokeWidth={6} />
            <line x1={300} y1={360} x2={60} y2={364} stroke="var(--ink)" strokeWidth={6} />
            {/* sail */}
            <motion.path
              animate={{ d: `M296,${head} L296,${lowered ? 356 : 356} L70,360 Q110,${(head + 360) / 2 - 40} 296,${head} Z` }}
              fill="var(--sail)"
              stroke="var(--sail-edge)"
              strokeWidth={2}
              className={i === 1 ? 'flutter' : ''}
              style={{ transformOrigin: '296px 200px' }}
            />
            {/* reef cringles */}
            <circle cx={296} cy={lowered ? 356 : 290} r={7} fill="none" stroke={i === 2 ? 'var(--signal)' : 'var(--ink)'} strokeWidth={3} />
            <circle cx={i >= 4 ? 80 : 96} cy={i >= 4 ? 358 : 292} r={7} fill="none" stroke={i === 4 ? 'var(--signal)' : 'var(--ink)'} strokeWidth={3} />
            {!lowered && [130, 170, 210, 250].map((x) => <circle key={x} cx={x} cy={292 + (296 - x) * -0.01} r={3} fill="var(--sail-edge)" />)}
            {i >= 5 && [130, 170, 210, 250].map((x) => <path key={x} d={`M${x},350 q-4,10 0,18`} stroke="var(--signal)" strokeWidth={3} fill="none" />)}
            {lowered && <path d="M70,362 Q180,380 296,360" fill="var(--sail)" stroke="var(--sail-edge)" opacity={0.9} />}
            {i === 3 && <path d="M310,120 L310,60" stroke="var(--signal)" strokeWidth={4} markerEnd="url(#rs-up)" />}
            <defs>
              <marker id="rs-up" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="var(--signal)" />
              </marker>
            </defs>
          </svg>
        )
      }}
    />
  )
}

/** Anchor scope: how much rode to let out. */
export function AnchorScope() {
  const [depth, setDepth] = useState(4)
  const [scope, setScope] = useState(5)
  const rode = depth * scope
  const W = 600
  const seabed = 120 + depth * 22
  const anchorX = Math.min(560, 120 + rode * 9)
  const holds = scope >= 5
  return (
    <Figure
      caption={
        <>
          Let out <strong className="text-ink">{rode.toFixed(0)} m</strong> of rode in {depth} m of water ({scope}:1).{' '}
          {holds
            ? 'Good: the pull on the anchor is nearly horizontal so it digs in. Use 5:1 for chain and line in calm conditions, 7:1 or more when it’s windy.'
            : 'Too short! The rode pulls upward and lifts the anchor out of the seabed — it will drag.'}{' '}
          Measure depth from the bow roller (add freeboard).
        </>
      }
      controls={
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="Depth" value={depth} min={2} max={8} unit=" m" onChange={setDepth} />
          <Slider label="Scope" value={scope} min={2} max={8} onChange={setScope} format={(v) => `${v}:1`} />
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} 340`} className="block h-auto w-full">
        <rect width={W} height={100} fill="var(--surface-2)" />
        <rect y={100} width={W} height={240} fill="var(--water)" />
        <path d={`M0,${seabed} L${W},${seabed - 10} L${W},340 L0,340 Z`} fill="#c8b48a" />
        {/* boat side view */}
        <path d="M40,90 L130,90 L118,108 L52,108 Z" fill="var(--hull)" stroke="var(--ink)" strokeWidth={2} />
        <line x1={80} y1={90} x2={80} y2={30} stroke="var(--ink)" strokeWidth={2} />
        <path d={`M125,98 Q${(125 + anchorX) / 2},${scope >= 5 ? seabed + 10 : seabed - 60} ${anchorX},${seabed - 4}`} fill="none" stroke="#e9b44c" strokeWidth={3} />
        <path d={`M${anchorX - 4},${seabed - 4} l18,0 m-14,0 l-8,-12 m8,12 l8,-12`} stroke="var(--ink)" strokeWidth={3} fill="none" />
        <line x1={20} y1={100} x2={20} y2={seabed} stroke="var(--muted)" strokeDasharray="3 4" />
        <Label x={28} y={(100 + seabed) / 2} anchor="start" size={12} color="var(--muted)">{depth} m</Label>
        {!holds && <Label x={anchorX} y={seabed + 30} color="var(--port)" size={13}>dragging!</Label>}
      </svg>
    </Figure>
  )
}
