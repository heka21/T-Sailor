import type { ReactNode } from 'react'
import type { Pt } from './rope'

/**
 * Each knot is one or two strands of rope, drawn in the order the working end travels (see rope.ts).
 * A step says how far along each strand the rope has been tied (`to`, in control points), so moving between
 * steps slides the working end along its path. The last step usually pulls the knot tight (`tight` pose).
 * Depth: higher is on top at a crossing; below 0 is behind/under the object the knot is tied to.
 */
export interface Strand {
  rope: keyof typeof ROPES
  width: number
  pts: Pt[]
  /** The same points, pulled tight (same count). */
  tight?: Pt[]
}

export interface Label {
  x: number
  y: number
  text: string
  anchor?: 'start' | 'middle' | 'end'
}

export interface KnotStep {
  text: string
  to: number[]
  tight?: boolean
  labels?: Label[]
}

export interface Knot {
  id: string
  name: string
  use: string
  tip: string
  strands: Strand[]
  steps: KnotStep[]
  /** Drawn under all rope (shadows, deck). */
  back?: ReactNode
  /** The thing the knot is tied to: drawn over rope with depth < 0 and under the rest. */
  object?: ReactNode
  /** Drawn over all rope. */
  front?: ReactNode
}

export const ROPES = {
  gold: { base: '#e2a73c', dark: '#7a5212', light: '#fff2cc', edge: '#4a3210', whip: '#24303d' },
  blue: { base: '#3474d6', dark: '#163c84', light: '#d3e3ff', edge: '#0e2350', whip: '#f1ede2' },
}

const deg = Math.PI / 180

/** Moves points from..to towards (cx, cy) by factor k (k = 0.5 halves their distance). */
function squeeze(pts: Pt[], cx: number, cy: number, k: number, from = 0, to = pts.length - 1): Pt[] {
  return pts.map((p, i) => (i < from || i > to ? p : [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k, p[2]]))
}

/**
 * Rope wound round a cylinder, as points every 22.5°. θ = 0 faces you, 90 is the near edge going away
 * (top of a rail, or the left of a post); `along(θ)` gives the position along the cylinder's axis.
 */
function wind(θ0: number, θ1: number, along: (θ: number) => number, place: (a: number, θ: number) => Pt) {
  const n = Math.max(1, Math.round(Math.abs(θ1 - θ0) / 22.5))
  return Array.from({ length: n }, (_, i) => {
    const θ = θ0 + ((θ1 - θ0) * (i + 1)) / n
    return place(along(θ), θ)
  })
}

const ramp = (θ0: number, θ1: number, a0: number, a1: number) => (θ: number) => a0 + ((a1 - a0) * (θ - θ0)) / (θ1 - θ0)

/** A horizontal rail seen from the front and a little above (tilt°): rope in front of it has depth > 0. */
const rail =
  (cy: number, R: number, lift = 0, tilt = 22) =>
  (a: number, θ: number): Pt => [a, cy - R * Math.sin((θ - tilt) * deg), Math.cos((θ - tilt) * deg) + lift]

/** The standing part as a vertical post at x = sx, seen a little from above (rope on the near side gets depth z + k). */
const post =
  (sx: number, R: number, z: number, k: number, lift = 0, tilt = 30) =>
  (a: number, θ: number): Pt => [sx - R * Math.sin(θ * deg), a + R * Math.cos(θ * deg) * Math.sin(tilt * deg), z + k * Math.cos(θ * deg) + lift]

/**
 * A clove hitch round a cylinder: lead-in at θ = 0, a full turn, a riding turn back across OVER the lead-in,
 * a second turn, then the end tucked UNDER the riding turn. a0 is where the lead-in meets the cylinder,
 * p how far each turn moves along it.
 */
function cloveTurns(a0: number, p: number, place: (lift: number) => (a: number, θ: number) => Pt) {
  return [
    ...wind(0, 360, ramp(0, 360, a0, a0 + p), place(0)),
    ...wind(360, 450, ramp(360, 450, a0 + p, a0 - p), place(0.35)),
    ...wind(450, 630, ramp(450, 630, a0 - p, a0 - 1.5 * p), place(0)),
    ...wind(630, 810, ramp(630, 810, a0 - 1.5 * p, a0 - 0.3 * p), place(-0.2)),
  ]
}

// ── Objects ────────────────────────────────────────────────────────────────

function Rail({ cy, r, label }: { cy: number; r: number; label: string }) {
  return (
    <g>
      <defs>
        <linearGradient id="knot-rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f8fb" />
          <stop offset="0.3" stopColor="#d3dce4" />
          <stop offset="0.7" stopColor="#8e9cab" />
          <stop offset="1" stopColor="#56626f" />
        </linearGradient>
      </defs>
      <rect x={-5} y={cy - r} width={410} height={r * 2} fill="url(#knot-rail)" />
      <path d={`M-5,${cy - r}H405M-5,${cy + r}H405`} stroke="#3c4752" strokeWidth={1.4} />
      <path d={`M-5,${cy - r * 0.45}H405`} stroke="white" strokeWidth={2.5} strokeOpacity={0.75} />
      <text x={392} y={cy - r - 8} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--muted)">
        {label}
      </text>
    </g>
  )
}

function Fender({ x, top }: { x: number; top: number }) {
  return (
    <g>
      <defs>
        <linearGradient id="knot-fender" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b3f73" />
          <stop offset="0.35" stopColor="#3a6fb8" />
          <stop offset="0.6" stopColor="#2b5a9c" />
          <stop offset="1" stopColor="#13305a" />
        </linearGradient>
      </defs>
      <rect x={x - 9} y={top - 4} width={18} height={16} rx={4} fill="#13305a" />
      <rect x={x - 34} y={top + 8} width={68} height={120} rx={30} fill="url(#knot-fender)" stroke="#0b1f3d" strokeWidth={1.5} />
      <path d={`M${x - 18},${top + 30}V${top + 110}`} stroke="white" strokeOpacity={0.3} strokeWidth={6} strokeLinecap="round" />
      <text x={x + 44} y={top + 40} fontSize={12} fontWeight={700} fill="var(--muted)">
        fender
      </text>
    </g>
  )
}

const cleatShape =
  'M86,170 C86,159 99,155 121,157 L160,149 C176,144 224,144 240,149 L279,157 C301,155 314,159 314,170 C314,181 301,185 279,183 L240,191 C224,196 176,196 160,191 L121,183 C99,185 86,181 86,170 Z'

const cleat = (
  <g>
    <defs>
      <linearGradient id="knot-cleat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eef2f6" />
        <stop offset="0.45" stopColor="#b8c3cd" />
        <stop offset="1" stopColor="#77848f" />
      </linearGradient>
    </defs>
    <path d={cleatShape} fill="url(#knot-cleat)" stroke="#3c4752" strokeWidth={1.6} />
    <path d="M104,163 C130,158 160,152 200,151 C240,152 270,158 296,163" fill="none" stroke="white" strokeOpacity={0.8} strokeWidth={2} />
    <circle cx={180} cy={172} r={4.5} fill="#5d6a76" stroke="#3c4752" />
    <circle cx={220} cy={172} r={4.5} fill="#5d6a76" stroke="#3c4752" />
  </g>
)

/** A furled sail lying along the boom, seen from above; the reef tie comes up round its edges. */
const bundle = (
  <g>
    <defs>
      <linearGradient id="knot-bundle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#b9c1c8" />
        <stop offset="0.25" stopColor="#f2f4f2" />
        <stop offset="0.55" stopColor="#fbfbf8" />
        <stop offset="0.85" stopColor="#e2e6e6" />
        <stop offset="1" stopColor="#a7b0b8" />
      </linearGradient>
    </defs>
    <rect x={64} y={-5} width={272} height={350} fill="url(#knot-bundle)" />
    <path
      d="M110,-5 C118,80 104,170 116,345 M160,-5 C150,90 170,200 158,345 M244,-5 C254,100 236,210 250,345 M292,-5 C284,90 298,220 288,345"
      fill="none"
      stroke="#8e99a3"
      strokeOpacity={0.45}
      strokeWidth={1.5}
    />
    <path d="M64,-5V345M336,-5V345" stroke="#7d8892" strokeWidth={1.5} />
  </g>
)

/** The clew (bottom back corner) of the jib, with its stainless ring; the sail is cut away so rope behind shows through the ring. */
const CLEW = { x: 222, y: 290 }
const ringHole = (r: number) => `M${CLEW.x + r},${CLEW.y}a${r},${r} 0 1,0 ${-2 * r},0a${r},${r} 0 1,0 ${2 * r},0Z`

const jibClew = (
  <g>
    <defs>
      <linearGradient id="knot-jib" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbfbf7" />
        <stop offset="1" stopColor="#dfe3e2" />
      </linearGradient>
    </defs>
    <path d={`M96,345L210,273Q222,264 234,272L374,345Z${ringHole(9)}`} fillRule="evenodd" fill="url(#knot-jib)" stroke="#8e99a3" strokeWidth={1.5} />
    {/* Reinforcing patches, stitched on round the corner. */}
    <path d={`M163,306L210,273Q222,264 234,272L284,301Q224,348 163,306Z${ringHole(9)}`} fillRule="evenodd" fill="#e6e8e2" stroke="#a9b2b9" strokeWidth={1} />
    <path d="M186,291Q224,322 260,288" fill="none" stroke="#8e99a3" strokeWidth={1} strokeDasharray="3 3" />
    <circle cx={CLEW.x} cy={CLEW.y} r={12} fill="none" stroke="#b7c1ca" strokeWidth={6} />
    <circle cx={CLEW.x} cy={CLEW.y} r={15} fill="none" stroke="#3c4752" strokeWidth={1.3} />
    <circle cx={CLEW.x} cy={CLEW.y} r={9} fill="none" stroke="#3c4752" strokeWidth={1.3} />
    <path d={`M${CLEW.x - 9},${CLEW.y - 8}A12,12 0 0,1 ${CLEW.x + 6},${CLEW.y - 10.5}`} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={2} />
    <text x={150} y={336} fontSize={12} fontWeight={700} fill="#6b7782">
      jib
    </text>
  </g>
)

const fairlead = (
  <g>
    <rect x={168} y={-6} width={64} height={34} rx={9} fill="#9aa7b3" stroke="#3c4752" strokeWidth={1.6} />
    <rect x={172} y={-2} width={56} height={10} rx={4} fill="white" fillOpacity={0.5} />
    <text x={240} y={20} fontSize={12} fontWeight={700} fill="var(--muted)">
      fairlead / block
    </text>
  </g>
)

// ── Geometry ───────────────────────────────────────────────────────────────

const figureEight: Pt[] = (
  [
    [200, -60, 0],
    [200, 22, 1],
    [200, 88, -1],
    [200, 150, 0],
    [218, 188, 1],
    [252, 196, 1],
    [276, 165, 0],
    [272, 122, -1],
    [246, 96, -1],
    [200, 84, 1],
    [160, 80, 0],
    [138, 52, 0],
    [156, 24, -1],
    [200, 18, -1],
    [240, 24, 0],
    [262, 52, 0],
    [258, 90, 1],
    [250, 115, 1],
    [240, 160, 0],
    [232, 200, -1],
    [228, 250, 0],
    [226, 280, 0],
  ] as Pt[]
).map(([x, y, z]) => [x, y + 40, z])

const bowline: Pt[] = [
  [200, -20, 0],
  [199, 35, 1],
  [199, 94, 0],
  [204, 125, -1], // 3: the hole's crossing, standing part underneath
  [226, 160, -1],
  [234, 200, 0],
  [211, 228, 1],
  [176, 219, 1],
  [159, 185, 0],
  [169, 148, -1],
  [204, 125, 1], // 10: …and the part towards the end on top
  [244, 98, 1],
  [286, 125, 0],
  [298, 200, 0],
  [270, 262, 0],
  [244, 284, 0.6],
  [CLEW.x, CLEW.y, 0], // 16: through the clew ring, front to back
  [205, 277, -1],
  [190, 258, 0],
  [184, 238, -1], // 19: up through the hole
  [181, 188, 0],
  [174, 144, 1],
  [179, 88, 0],
  [194, 52, -1], // 23: behind the tree
  [218, 48, -1],
  [239, 65, 0],
  [231, 112, 2], // 26: back down the hole
  [216, 162, 1],
  [214, 228, -1],
  [217, 256, 0],
]

const bowlineTight = squeeze(squeeze(bowline, 206, 146, 0.5, 1, 12), 206, 146, 0.5, 19, 29).map((p, i): Pt =>
  i >= 13 && i <= 18 ? ([[258, 198, 0], [244, 252, 0], [234, 278, 0.6], [CLEW.x, CLEW.y, 0], [209, 279, -1], [199, 248, 0]] as Pt[])[i - 13] : p,
)

// Clove hitch on a rail, holding a fender.
const CLOVE = { cy: 118, r: 40, a0: 206 }
const clove = (p: number, R: number): Pt[] => [
  [CLOVE.a0, 300, 1],
  [CLOVE.a0, 220, 1],
  [CLOVE.a0, CLOVE.cy + 24, 1],
  [CLOVE.a0, CLOVE.cy, 1], // 3: meets the rail
  ...cloveTurns(CLOVE.a0, p, (lift) => rail(CLOVE.cy, R, lift)), // 4–19 turn, 20–23 diagonal, 24–31 turn, 32–39 tuck
  [CLOVE.a0 - 0.3 * p + 4, CLOVE.cy - R - 14, -0.25],
  [CLOVE.a0 - 0.3 * p + 10, CLOVE.cy - R - 32, -0.3],
]

// Round turn on a rail, then two half hitches round the standing part.
const RT = { cy: 70, r: 30, a0: 130 }

/**
 * A half hitch round the standing part (a vertical "post" at RT.a0): the end comes down on the right, goes
 * round the front, behind, and out UNDER itself on the right. 21 points, starting with the lead-in.
 */
function halfHitch(y: number, hr: number, hp: number): Pt[] {
  const side = RT.a0 + hr
  return [
    [side + 16, y - 16, 1.3],
    [side, y, 1],
    ...wind(-90, 180, ramp(-90, 180, y, y - hp * 0.75), post(RT.a0, hr, 1, 0.8)),
    ...wind(180, 292.5, ramp(180, 292.5, y - hp * 0.75, y - hp), post(RT.a0, hr, 1, 0.8, -0.35)),
    [side + 30, y - hp + 4, 0.9],
    [side + 36, y + 6, 1],
  ]
}

function roundTurn(p: number, R: number, y: number, hr: number, hp: number, gap: number): Pt[] {
  const { cy, a0 } = RT
  const exitX = a0 + 1.5 * p
  return [
    [a0, 360, 1],
    [a0, 250, 1],
    [a0, cy + 30, 1],
    [a0, cy, 1], // 3: meets the rail
    ...wind(0, 540, ramp(0, 540, a0, exitX), rail(cy, R)), // 4–27
    [exitX + 2, cy + 30, -1],
    [a0 + hr + 22, y - 60, 0.6],
    ...halfHitch(y, hr, hp), // 30–50
    ...halfHitch(y + gap, hr, hp), // 51–71
    [a0 + hr + 38, y + gap + 30, 1],
  ]
}

const cleatHitch: Pt[] = [
  [-20, 276, 0],
  [60, 248, 0],
  [150, 226, 0],
  [225, 214, 0],
  [262, 202, -1], // 4: under the far horn
  [277, 172, -1],
  [262, 142, -1],
  [226, 132, 0],
  [175, 132, 0],
  [138, 140, -1], // 9: under the near horn
  [123, 170, -1],
  [140, 198, -1],
  [168, 200, 0.5], // 12: first diagonal
  [200, 170, 1],
  [236, 138, 1],
  [266, 140, -1],
  [279, 170, -1],
  [266, 199, -1],
  [236, 202, 1.5], // 18: second diagonal
  [200, 170, 2],
  [163, 138, 2],
  [136, 140, -1],
  [121, 170, -1],
  [136, 198, -1],
  [159, 194, 1.5], // 24: locking turn, under the second diagonal
  [191, 160, 1.5],
  [222, 132, 1.5],
  [246, 116, 1.5],
]

/** The gold end weaving over–under–over across a straight run of the blue one, from x0 to x1 (either way). */
function weave(x0: number, x1: number, y: number, amp: number): Pt[] {
  return Array.from({ length: 7 }, (_, i) => [x0 + ((x1 - x0) * i) / 6, y + amp * Math.cos((Math.PI * i) / 2), i % 2 ? (i === 3 ? 0.4 : 1.6) : 1])
}

/**
 * Reef knot as two half knots. The blue (right) end is laid straight across and the gold (left) end wraps
 * over–under–over round it; in the second half knot the gold does the same from the other side. That mirror
 * image is what makes it a reef knot rather than a granny.
 */
function reef({ lo, hi, amp, x0, x1 }: { lo: number; hi: number; amp: number; x0: number; x1: number }) {
  const bend = (lo - hi) * 0.28
  const gold: Pt[] = [
    [70, lo + amp, -1],
    [100, lo + amp, 1],
    ...weave(x0, x1, lo, amp), // 2–8: first half knot
    [x1 + bend * 0.8, lo - amp - 6, 1],
    [x1 + bend, (lo + hi) / 2, 1],
    [x1 + bend * 0.8, hi + amp + 6, 1],
    ...weave(x1, x0, hi, amp), // 12–18: second half knot
    [x0 - 30, hi - amp - 4, 1],
    [x0 - 60, hi - amp, 1],
  ]
  const blue: Pt[] = [
    [330, lo, -1],
    [300, lo, 1],
    [x1, lo, 1],
    [(x0 + x1) / 2, lo, 1],
    [x0, lo, 1],
    [x0 - bend * 0.8, lo - bend * 0.4, 1],
    [x0 - bend, (lo + hi) / 2, 1],
    [x0 - bend * 0.8, hi + bend * 0.4, 1],
    [x0, hi, 1],
    [(x0 + x1) / 2, hi, 1],
    [x1, hi, 1],
    [x1 + 30, hi - 2, 1],
    [x1 + 60, hi - 6, 1],
  ]
  return [gold, blue]
}

const [reefGold, reefBlue] = reef({ lo: 236, hi: 124, amp: 22, x0: 140, x1: 260 })
const [reefGoldTight, reefBlueTight] = reef({ lo: 206, hi: 160, amp: 10, x0: 162, x1: 238 })

const sheetBlue: Pt[] = [
  [-20, 125, 0],
  [120, 125, 0],
  [215, 125, 0],
  [252, 138, 0],
  [262, 165, 0],
  [252, 192, 0],
  [215, 205, 0],
  [150, 205, 0],
  [96, 205, 0],
]

const sheetGold: Pt[] = [
  [420, 168, -1],
  [340, 166, -1],
  [262, 165, -1], // 2: up through the bight, under its bend
  [228, 165, 1.5],
  [205, 166, 1.5], // 4: where it will tuck under itself
  [184, 182, 1],
  [176, 205, 1], // over the bottom leg…
  [170, 232, 1],
  [148, 238, 0],
  [138, 205, -1], // 9: …round behind both legs…
  [136, 165, -1],
  [138, 125, -1],
  [150, 98, 0],
  [172, 100, 1],
  [184, 125, 1], // 14: …over the top leg…
  [196, 150, 0.5],
  [205, 166, 0.5], // 16: …and under itself
  [218, 186, 1],
  [226, 205, 1],
  [236, 236, 1],
]

// ── Knots ──────────────────────────────────────────────────────────────────

const pullTight = 'Pull tight'

export const KNOTS: Knot[] = [
  {
    id: 'figure-eight',
    name: 'Figure-eight',
    use: 'Stopper knot in the end of sheets so they can’t run out through blocks and fairleads.',
    tip: 'Leave a tail at least a hand-width long. Tied right, it looks like the number 8 — two loops, not one.',
    front: fairlead,
    strands: [{ rope: 'gold', width: 11, pts: figureEight, tight: squeeze(figureEight, 214, 156, 0.5, 1, 20) }],
    steps: [
      {
        text: 'Make a loop: bring the end round and back OVER the standing part.',
        to: [11],
        labels: [
          { x: 190, y: 210, text: 'standing part', anchor: 'end' },
          { x: 296, y: 200, text: 'loop', anchor: 'start' },
        ],
      },
      { text: 'Take the end on round, BEHIND the standing part.', to: [15] },
      { text: 'Push the end DOWN through the first loop, from the front.', to: [21], labels: [{ x: 240, y: 290, text: 'tail', anchor: 'start' }] },
      { text: `${pullTight} on the tail and standing part. Check you can see the 8.`, to: [21], tight: true },
    ],
  },
  {
    id: 'bowline',
    name: 'Bowline',
    use: 'A fixed loop that won’t slip or jam — tying jib sheets to the clew, mooring lines, a loop round a post.',
    tip: '“The rabbit comes up out of the hole, round the tree, and back down the hole.” Easy to untie even after heavy loads.',
    object: jibClew,
    strands: [{ rope: 'gold', width: 11, pts: bowline, tight: bowlineTight }],
    steps: [
      {
        text: 'Leave an arm’s length of jib sheet, then make a small loop — the rabbit hole — with the part towards the end lying ON TOP.',
        to: [12],
        labels: [
          { x: 210, y: 16, text: 'jib sheet (to the winch)', anchor: 'start' },
          { x: 188, y: 70, text: 'tree', anchor: 'end' },
          { x: 150, y: 150, text: 'hole', anchor: 'end' },
        ],
      },
      {
        text: 'Pass the end (the rabbit) through the clew ring from the front, then bring it back up under the hole.',
        to: [19],
        labels: [{ x: 300, y: 300, text: 'clew ring', anchor: 'start' }],
      },
      { text: 'The rabbit comes UP out of the hole…', to: [22] },
      { text: '…runs round BEHIND the tree…', to: [25] },
      { text: '…and goes back DOWN the hole.', to: [29] },
      { text: 'Hold the end against the loop and pull the sheet hard to tighten. The loop stays the same size under load.', to: [29], tight: true },
    ],
  },
  {
    id: 'clove-hitch',
    name: 'Clove hitch',
    use: 'Quick temporary hitch — hanging fenders from a rail or lifeline.',
    tip: 'It can work loose as the fender rubs. Add a half hitch round the standing part, or use two clove hitches.',
    object: <Rail cy={CLOVE.cy} r={CLOVE.r} label="rail" />,
    front: <Fender x={CLOVE.a0} top={252} />,
    strands: [{ rope: 'gold', width: 11, pts: clove(46, CLOVE.r + 6.5), tight: clove(28, CLOVE.r + 6) }],
    steps: [
      {
        text: 'With the fender at the right height, pass the end over the rail from the front, down behind and out underneath.',
        to: [17],
        labels: [{ x: 226, y: 210, text: 'standing part', anchor: 'start' }],
      },
      { text: 'Bring it up across the front, OVER the standing part. This makes the diagonal.', to: [23] },
      { text: 'Go round the rail again, on the far side of the standing part, and out underneath.', to: [33] },
      { text: 'Tuck the end up UNDER the diagonal, so it comes out next to the standing part.', to: [41] },
      { text: `${pullTight}: the diagonal lies across the middle with an end coming out from under it on each side.`, to: [41], tight: true },
    ],
  },
  {
    id: 'round-turn',
    name: 'Round turn & two half hitches',
    use: 'Tying on to a ring, rail or post where the load must be held while you tie — mooring lines, towing.',
    tip: 'The round turn takes the load; the hitches just stop it unwinding. You can untie it with the line under load.',
    object: <Rail cy={RT.cy} r={RT.r} label="rail or ring" />,
    strands: [{ rope: 'gold', width: 11, pts: roundTurn(36, RT.r + 6.5, 212, 30, 30, 62), tight: roundTurn(22, RT.r + 6, 150, 12, 13, 26) }],
    steps: [
      {
        text: 'Take the end over the rail and round once…',
        to: [19],
        labels: [
          { x: 118, y: 320, text: 'standing part', anchor: 'end' },
          { x: 118, y: 336, text: '(to the boat)', anchor: 'end' },
        ],
      },
      { text: '…and round again. That’s the round turn — it holds the load while you tie.', to: [29] },
      { text: 'First half hitch: take the end round the standing part and tuck it out UNDER itself.', to: [50] },
      { text: 'Second half hitch below it, made exactly the same way round.', to: [72] },
      { text: 'Slide both hitches up snug against the round turn.', to: [72], tight: true },
    ],
  },
  {
    id: 'cleat-hitch',
    name: 'Cleat hitch',
    use: 'Making a halyard, dock line or mooring line fast on a horn cleat.',
    tip: 'One turn, one figure-eight, one locking turn — more just jams. Don’t lock sheets you may need to let go in a hurry.',
    object: cleat,
    strands: [{ rope: 'gold', width: 11, pts: cleatHitch, tight: cleatHitch.map((p, i) => (i < 2 ? p : [200 + (p[0] - 200) * 0.97, 170 + (p[1] - 170) * 0.88, p[2]])) }],
    steps: [
      {
        text: 'Lead the line to the FAR horn first and round under it…',
        to: [7],
        labels: [{ x: 40, y: 300, text: 'from the load', anchor: 'start' }],
      },
      { text: '…then on round under the near horn: one full turn round the base.', to: [12] },
      { text: 'Cross diagonally OVER the top and round under the far horn…', to: [18] },
      { text: '…then back over the top the other way. That’s the figure-eight.', to: [21] },
      { text: 'Lock it: make the last turn so the end tucks UNDER itself, lying beside the first diagonal.', to: [27] },
      { text: `${pullTight} on the tail. One neat X on top, with the tail trapped under it.`, to: [27], tight: true },
    ],
  },
  {
    id: 'reef-knot',
    name: 'Reef knot',
    use: 'Tying the two ends of one line round something — reefing the sail, tying sail ties.',
    tip: 'Not for joining two ropes that will take a load (use a sheet bend). Left over right, then right over left.',
    object: bundle,
    strands: [
      { rope: 'gold', width: 11, pts: reefGold, tight: reefGoldTight },
      { rope: 'blue', width: 11, pts: reefBlue, tight: reefBlueTight },
    ],
    steps: [
      {
        text: 'Bring both ends of the tie up round the sail. Take the LEFT end (gold) OVER the right end…',
        to: [3.6, 5],
        labels: [
          { x: 96, y: 290, text: 'left end', anchor: 'start' },
          { x: 304, y: 266, text: 'right end', anchor: 'end' },
        ],
      },
      { text: '…then UNDER it and over again. That’s a half knot — the gold end is now on the right.', to: [9, 5] },
      { text: 'Now RIGHT over left: bring the ends back together and take the gold end OVER the blue…', to: [13.6, 12] },
      { text: '…then UNDER and over again — the mirror of the first half knot. Each end now lies beside its own part.', to: [20, 12] },
      { text: `${pullTight} on both ends: it lies flat and square. Ends on opposite sides? That’s a granny — retie.`, to: [20, 12], tight: true },
    ],
  },
  {
    id: 'sheet-bend',
    name: 'Sheet bend',
    use: 'Joining two ropes, even of different thickness.',
    tip: 'Make the bight in the thicker rope. Both short ends should finish on the same side of the knot.',
    strands: [
      {
        rope: 'blue',
        width: 15,
        pts: sheetBlue,
        tight: sheetBlue.map((p, i) => (i < 2 ? p : [p[0] - (p[0] - 215) * (i > 6 ? 0 : 0.25), 165 + (p[1] - 165) * 0.6, p[2]])),
      },
      { rope: 'gold', width: 9, pts: sheetGold, tight: squeeze(sheetGold, 214, 165, 0.6, 2, 19) },
    ],
    steps: [
      {
        text: 'Make a bight (a U) in the end of the thicker rope.',
        to: [8, 0],
        labels: [
          { x: 40, y: 112, text: 'thick rope', anchor: 'start' },
          { x: 100, y: 236, text: 'short end', anchor: 'start' },
        ],
      },
      {
        text: 'Bring the thin rope UP through the bight from underneath.',
        to: [8, 4],
        labels: [{ x: 380, y: 152, text: 'thin rope', anchor: 'end' }],
      },
      { text: 'Take it round BEHIND both parts of the bight.', to: [8, 14] },
      { text: 'Tuck it UNDER ITSELF — not under the bight — and out over the bight.', to: [8, 19] },
      { text: `${pullTight}: hold the bight and pull the thin rope. Both short ends finish on the same side.`, to: [8, 19], tight: true },
    ],
  },
]
