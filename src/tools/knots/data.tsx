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

/** Like squeeze, but each point i by its own factor k[i] (undefined leaves it), so the knot can tighten while the rope leading into it eases round smoothly. */
function pull(pts: Pt[], cx: number, cy: number, k: (number | undefined)[]): Pt[] {
  return pts.map((p, i) => (k[i] === undefined ? p : [cx + (p[0] - cx) * k[i], cy + (p[1] - cy) * k[i], p[2]]))
}

/**
 * Rope wound round a horizontal rail seen square-on, as points every 15°: θ = 0 is the front of the rail, 90 the top,
 * 180 the back and 270 underneath. `keys` pin the position along the rail at given angles (in between it is
 * interpolated), plus a lift for passes that must lie on top where they cross others on the front. Rope behind the
 * rail gets depth −1; over the top and underneath it still shows beyond the rail's edges.
 */
function wrap(cy: number, R: number, keys: [θ: number, x: number, lift?: number][]): Pt[] {
  const out: Pt[] = []
  for (let k = 0; k < keys.length - 1; k++) {
    const [θ0, x0, l0 = 0] = keys[k]
    const [θ1, x1, l1 = 0] = keys[k + 1]
    const n = Math.max(1, Math.round((θ1 - θ0) / 15))
    for (let i = k ? 1 : 0; i <= n; i++) {
      const t = i / n
      const θ = (θ0 + (θ1 - θ0) * t) * deg
      const c = Math.cos(θ)
      out.push([x0 + (x1 - x0) * t, cy - R * Math.sin(θ), c > 0.02 ? 1 + c * 0.3 + l0 + (l1 - l0) * t : -1])
    }
  }
  return out
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
const CLEW = { x: 200, y: 304 }
const ringHole = (r: number) => `M${CLEW.x + r},${CLEW.y}a${r},${r} 0 1,0 ${-2 * r},0a${r},${r} 0 1,0 ${2 * r},0Z`

const jibClew = (() => {
  const { x, y } = CLEW
  return (
    <g>
      <defs>
        <linearGradient id="knot-jib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfbf7" />
          <stop offset="1" stopColor="#dfe3e2" />
        </linearGradient>
      </defs>
      <path d={`M${x - 150},${y + 70}L${x - 12},${y - 17}Q${x},${y - 26} ${x + 12},${y - 18}L${x + 170},${y + 70}Z${ringHole(9)}`} fillRule="evenodd" fill="url(#knot-jib)" stroke="#8e99a3" strokeWidth={1.5} />
      {/* Reinforcing patch, stitched on round the corner. */}
      <path d={`M${x - 62},${y + 38}L${x - 12},${y - 17}Q${x},${y - 26} ${x + 12},${y - 18}L${x + 66},${y + 12}Q${x + 4},${y + 60} ${x - 62},${y + 38}Z${ringHole(9)}`} fillRule="evenodd" fill="#e6e8e2" stroke="#a9b2b9" strokeWidth={1} />
      <path d={`M${x - 38},${y + 4}Q${x + 2},${y + 34} ${x + 40},${y + 2}`} fill="none" stroke="#8e99a3" strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={x} cy={y} r={12} fill="none" stroke="#b7c1ca" strokeWidth={6} />
      <circle cx={x} cy={y} r={15} fill="none" stroke="#3c4752" strokeWidth={1.3} />
      <circle cx={x} cy={y} r={9} fill="none" stroke="#3c4752" strokeWidth={1.3} />
      <path d={`M${x - 9},${y - 8}A12,12 0 0,1 ${x + 6},${y - 10.5}`} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={2} />
      <text x={x - 90} y={y + 32} fontSize={12} fontWeight={700} fill="#6b7782">
        jib
      </text>
    </g>
  )
})()

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

/**
 * Bowline through the jib's clew ring. The standing part comes down to the hole, whose crossing (X) has the part
 * towards the end on top; the big loop runs down through the ring and back up as the rabbit, which comes up
 * the hole, round behind the standing part (the tree) and back down the hole beside itself.
 */
const bowline: Pt[] = [
  [204, -20, 1],
  [204, 40, 1],
  [204, 90, 1],
  [204, 122, 0], // 3: X, standing part underneath
  [220, 140, 0],
  [226, 164, 1],
  [212, 186, 1],
  [190, 190, 1],
  [172, 174, 1],
  [170, 150, 1],
  [182, 130, 1],
  [204, 122, 2], // 11: X, part towards the end on top
  [226, 108, 1],
  [250, 110, 1],
  [268, 134, 1],
  [276, 180, 1],
  [270, 240, 1],
  [246, 282, 1],
  [222, 298, 0.6],
  [200, 304, 0], // 19: through the clew ring, front to back
  [180, 297, -1],
  [164, 276, 0],
  [156, 240, 1],
  [164, 212, 1],
  [180, 196, 0], // 24: up under the bottom of the hole…
  [186, 160, 2],
  [186, 128, 2], // …and out over its top
  [186, 92, 2],
  [190, 64, 1],
  [204, 52, 0], // 29: behind the tree
  [220, 58, 1],
  [224, 82, 2],
  [217, 112, 3], // 32: back down the hole, over its edge…
  [212, 138, 3],
  [208, 162, 2],
  [206, 192, 0], // 35: …and out under its bottom
  [204, 222, 1],
  [203, 246, 1],
]

// Pulled tight the hole and collar close round the standing part; the big loop through the ring keeps its size.
const bowlineTight = pull(
  bowline,
  204,
  150,
  bowline.map((_, i) => (i === 2 ? 0.8 : i >= 3 && i <= 12 ? 0.55 : i === 13 ? 0.65 : i === 14 ? 0.8 : i === 15 ? 0.92 : i === 22 ? 0.9 : i === 23 ? 0.72 : i >= 24 ? 0.55 : undefined)),
)

// Clove hitch on a rail, holding a fender: a turn, the diagonal (rider) back across the front OVER the standing part,
// a second turn, and the end tucked up UNDER the rider — hugging the rail until it is clear of it.
const CLOVE = { cy: 112, r: 24, a: 200 }
function clove(R: number, out: number, back: number, tail: number): Pt[] {
  const { cy, a } = CLOVE
  return [
    [a, 352, 1],
    [a, 290, 1],
    [a, 220, 1],
    [a, cy + 40, 1],
    // 4–56: from the front of the rail (θ = 0)
    ...wrap(cy, R, [
      [0, a],
      [270, a + out],
      [450, a - back, 1],
      [630, a - tail],
      [780, a - tail, -0.45],
    ]),
    [a - tail, cy - R - 18, 0.55],
    [a - tail, cy - R - 42, 0.55],
  ]
}

// Round turn on a rail, then two half hitches round the standing part.
const RT = { cy: 62, r: 18, a: 168 }

/**
 * A half hitch round the standing part (at x = sx) by the end coming down at x = dx: it goes behind the standing
 * part low down, comes back round the front higher up and out to the right UNDER the part coming down, then
 * hangs on down. w is how far the turn reaches past the standing part, d sets its height.
 */
function halfHitch(h: number, sx: number, dx: number, w: number, d: number): Pt[] {
  return [
    [dx, h - 2.5 * d, 1],
    [dx, h + 0.4 * d, 1],
    [dx - 0.15 * (dx - sx), h + 1.5 * d, 1],
    [sx + 0.4 * (dx - sx), h + 2.1 * d, 1],
    [sx, h + 2.2 * d, 0], // behind
    [sx - 0.6 * w, h + 2.05 * d, 0.5],
    [sx - 0.95 * w, h + 1.4 * d, 1],
    [sx - 0.9 * w, h + 0.5 * d, 1.2],
    [sx - 0.5 * w, h - 0.05 * d, 1.5],
    [sx, h - 0.15 * d, 2], // in front
    [dx, h - 0.05 * d, 0.3], // under the part coming down
    [dx + 0.6 * w, h + 0.3 * d, 1],
    [dx + 0.8 * w, h + 2 * d, 1],
  ]
}

function roundTurn(R: number, out: number, h: [number, number], dx: [number, number], w: number, d: number): Pt[] {
  const { cy, a } = RT
  return [
    [a, 352, 1],
    [a, 290, 1],
    [a, 200, 1],
    [a, cy + 40, 1],
    ...wrap(cy, R, [
      [0, a],
      [540, a + out],
    ]), // 4–40: the round turn, leaving down the back of the rail
    [a + out, cy + R + 10, -1],
    [a + out, cy + R + 24, 1],
    ...halfHitch(h[0], a, dx[0], w, d), // 43–55
    ...halfHitch(h[1], a, dx[1], w, d), // 56–68
    [dx[1] + 0.8 * w, h[1] + 4.5 * d, 1],
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

/**
 * Reef knot, as two half knots. Gold (the left end) goes over, under — then over, under again: each time the end
 * on the left at first, now on the right, goes OVER. Tied right, the two bights interlock and lie flat.
 * Crossings g1–g6 run from the gold end to its standing part.
 */
const reefGold: Pt[] = [
  [74, 222, -1],
  [104, 216, 1],
  [126, 214, 1], // g6: under the blue bend
  [160, 215, 1.5],
  [200, 218, 2], // g5: over the blue — left over right
  [244, 220, 2],
  [278, 206, 1.5],
  [292, 178, 1], // g4: …and under
  [290, 146, 1], // g3: under the blue end
  [274, 124, 1.5],
  [244, 116, 2], // g2: over again — right over left
  [200, 118, 2],
  [160, 122, 1.5],
  [126, 126, 1], // g1: …and under
  [100, 128, 1],
  [80, 130, 1],
]

const reefBlue: Pt[] = [
  [326, 192, -1],
  [304, 186, 2],
  [284, 184, 2], // g4
  [254, 196, 1.5],
  [218, 218, 1], // g5
  [184, 238, 1.5],
  [148, 248, 2],
  [122, 232, 2],
  [114, 204, 2], // g6
  [112, 170, 2],
  [114, 138, 2], // g1
  [124, 108, 2],
  [148, 96, 1.5],
  [186, 104, 1], // g2
  [226, 130, 1.5],
  [268, 152, 2], // g3
  [302, 160, 2],
  [322, 164, 1],
]

const sheetBlue: Pt[] = [
  [-20, 120, 1],
  [80, 120, 1],
  [180, 120, 1],
  [236, 124, 1],
  [268, 150, 1],
  [270, 182, 1],
  [242, 206, 1],
  [180, 212, 1],
  [120, 212, 1],
  [96, 212, 1],
]

const sheetGold: Pt[] = [
  [430, 166, 0],
  [360, 166, 0],
  [290, 166, 0], // 2: up through the bight, under its bend
  [250, 166, 2],
  [216, 168, 2],
  [200, 188, 2], // 5: over the short end…
  [190, 236, 2],
  [166, 248, 1.5],
  [148, 232, 0], // 8: …round behind both parts of the bight…
  [140, 166, 0],
  [142, 120, 0],
  [150, 94, 1],
  [172, 84, 2],
  [194, 96, 2], // 13: …over the standing part…
  [206, 120, 2],
  [220, 146, 1.5],
  [232, 166, 0.5], // 16: …UNDER itself…
  [240, 188, 2],
  [246, 208, 2], // 18: …and out over the bight
  [250, 232, 2],
  [254, 252, 2],
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
    strands: [{ rope: 'gold', width: 13, pts: figureEight, tight: squeeze(figureEight, 214, 156, 0.5, 1, 20) }],
    steps: [
      {
        text: 'Make a loop: bring the end round and back OVER the standing part.',
        to: [11],
        labels: [
          { x: 188, y: 210, text: 'standing part', anchor: 'end' },
          { x: 298, y: 200, text: 'loop', anchor: 'start' },
        ],
      },
      { text: 'Take the end on round, BEHIND the standing part.', to: [15] },
      { text: 'Push the end DOWN through the first loop, from the front.', to: [21], labels: [{ x: 242, y: 290, text: 'tail', anchor: 'start' }] },
      { text: `${pullTight} on the tail and standing part. Check you can see the 8.`, to: [21], tight: true },
    ],
  },
  {
    id: 'bowline',
    name: 'Bowline',
    use: 'A fixed loop that won’t slip or jam — tying jib sheets to the clew, mooring lines, a loop round a post.',
    tip: '“The rabbit comes up out of the hole, round the tree, and back down the hole.” Easy to untie even after heavy loads.',
    object: jibClew,
    strands: [{ rope: 'gold', width: 13, pts: bowline, tight: bowlineTight }],
    steps: [
      {
        text: 'Leave an arm’s length of jib sheet, then make a small loop — the rabbit hole — with the part towards the end lying ON TOP.',
        to: [12.5],
        labels: [
          { x: 216, y: 20, text: 'jib sheet (to the winch)', anchor: 'start' },
          { x: 192, y: 76, text: 'tree', anchor: 'end' },
          { x: 160, y: 166, text: 'hole', anchor: 'end' },
        ],
      },
      {
        text: 'Pass the end (the rabbit) through the clew ring from the front, then bring it back up under the hole.',
        to: [23.5],
        labels: [{ x: 230, y: 326, text: 'clew ring', anchor: 'start' }],
      },
      { text: 'The rabbit comes UP out of the hole…', to: [27.5] },
      { text: '…runs round BEHIND the tree…', to: [31] },
      { text: '…and goes back DOWN the hole.', to: [37] },
      { text: 'Hold the end against the loop and pull the sheet hard to tighten. The loop stays the same size under load.', to: [37], tight: true },
    ],
  },
  {
    id: 'clove-hitch',
    name: 'Clove hitch',
    use: 'Quick temporary hitch — hanging fenders from a rail or lifeline.',
    tip: 'It can work loose as the fender rubs. Add a half hitch round the standing part, or use two clove hitches.',
    object: <Rail cy={CLOVE.cy} r={CLOVE.r} label="rail" />,
    front: <Fender x={CLOVE.a} top={262} />,
    strands: [{ rope: 'gold', width: 13, pts: clove(CLOVE.r + 10, 34, 46, 24), tight: clove(CLOVE.r + 6.5, 20, 30, 14) }],
    steps: [
      {
        text: 'With the fender at the right height, pass the end over the rail from the front, down behind and out underneath.',
        to: [23],
        labels: [{ x: 214, y: 226, text: 'standing part', anchor: 'start' }],
      },
      { text: 'Bring it up across the front, OVER the standing part. This makes the diagonal.', to: [34] },
      { text: 'Go round the rail again, on the far side of the standing part, and out underneath.', to: [47] },
      { text: 'Tuck the end up UNDER the diagonal, so it comes out next to the standing part.', to: [58] },
      { text: `${pullTight}: the diagonal lies across the middle with an end coming out from under it on each side.`, to: [58], tight: true },
    ],
  },
  {
    id: 'round-turn',
    name: 'Round turn & two half hitches',
    use: 'Tying on to a ring, rail or post where the load must be held while you tie — mooring lines, towing.',
    tip: 'The round turn takes the load; the hitches just stop it unwinding. You can untie it with the line under load.',
    object: <Rail cy={RT.cy} r={RT.r} label="rail or ring" />,
    strands: [
      {
        rope: 'gold',
        width: 13,
        pts: roundTurn(RT.r + 10, 50, [158, 232], [RT.a + 50, RT.a + 62], 30, 12),
        tight: roundTurn(RT.r + 6.5, 30, [112, 142], [RT.a + 20, RT.a + 24], 16, 7),
      },
    ],
    steps: [
      {
        text: 'Take the end over the rail and round once…',
        to: [28],
        labels: [
          { x: 156, y: 306, text: 'standing part', anchor: 'end' },
          { x: 156, y: 322, text: '(to the boat)', anchor: 'end' },
        ],
      },
      { text: '…and over again, leaving it down behind. That’s the round turn — it holds the load while you tie.', to: [42] },
      { text: 'First half hitch: take the end round the standing part and tuck it out UNDER itself.', to: [55] },
      { text: 'Second half hitch below it, made exactly the same way round.', to: [69] },
      { text: 'Slide both hitches up snug against the round turn.', to: [69], tight: true },
    ],
  },
  {
    id: 'cleat-hitch',
    name: 'Cleat hitch',
    use: 'Making a halyard, dock line or mooring line fast on a horn cleat.',
    tip: 'One turn, one figure-eight, one locking turn — more just jams. Don’t lock sheets you may need to let go in a hurry.',
    object: cleat,
    strands: [{ rope: 'gold', width: 12, pts: cleatHitch, tight: cleatHitch.map((p, i) => (i < 2 ? p : [200 + (p[0] - 200) * 0.97, 170 + (p[1] - 170) * 0.88, p[2]])) }],
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
      { rope: 'gold', width: 13, pts: reefGold, tight: squeeze(reefGold, 205, 170, 0.5, 2, 14) },
      { rope: 'blue', width: 13, pts: reefBlue, tight: squeeze(reefBlue, 205, 170, 0.5, 2, 16) },
    ],
    steps: [
      {
        text: 'Bring both ends of the tie up round the sail. Take the LEFT end (gold) OVER the right end (blue)…',
        to: [5, 5],
        labels: [
          { x: 92, y: 246, text: 'left end', anchor: 'start' },
          { x: 330, y: 170, text: 'right end', anchor: 'end' },
        ],
      },
      { text: '…and UNDER it, so the ends swap sides. That’s a half knot: gold now points up on the right, blue on the left.', to: [8.5, 9.5] },
      { text: 'Now RIGHT over left: cross the gold end (now on the right) OVER the blue…', to: [11.5, 14] },
      { text: '…and UNDER it again. Each end now comes out beside its own part.', to: [15, 17] },
      { text: `${pullTight} on both ends: it lies flat and square. Ends on opposite sides, or twisted? That’s a granny — retie.`, to: [15, 17], tight: true },
    ],
  },
  {
    id: 'sheet-bend',
    name: 'Sheet bend',
    use: 'Joining two ropes, even of different thickness.',
    tip: 'Make the bight in the thicker rope. Both short ends should finish on the same side of the knot.',
    strands: [
      { rope: 'blue', width: 17, pts: sheetBlue, tight: pull(sheetBlue, 222, 166, [undefined, undefined, 0.8, 0.6, 0.55, 0.55, 0.55, 0.6, 0.75]) },
      { rope: 'gold', width: 10, pts: sheetGold, tight: pull(sheetGold, 222, 166, sheetGold.map((_, i) => (i < 2 ? undefined : i === 2 ? 0.75 : 0.55))) },
    ],
    steps: [
      {
        text: 'Make a bight (a U) in the end of the thicker rope.',
        to: [9, 0],
        labels: [
          { x: 40, y: 104, text: 'thick rope', anchor: 'start' },
          { x: 100, y: 240, text: 'short end', anchor: 'start' },
        ],
      },
      {
        text: 'Bring the thin rope UP through the bight from underneath.',
        to: [9, 4],
        labels: [{ x: 384, y: 152, text: 'thin rope', anchor: 'end' }],
      },
      { text: 'Take it round BEHIND both parts of the bight.', to: [9, 13] },
      { text: 'Tuck it UNDER ITSELF — not under the bight — and out over the bight.', to: [9, 20] },
      { text: `${pullTight}: hold the bight and pull the thin rope. Both short ends finish on the same side.`, to: [9, 20], tight: true },
    ],
  },
]
