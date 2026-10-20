import type { ReactNode } from 'react'

/**
 * Knots are drawn as rope segments in the order the working end travels.
 * `z` decides over/under at crossings: higher z is drawn on top.
 * A step shows a set of segments; any segment not in the previous step animates in.
 */
export interface Segment {
  d: string
  z: number
  rope?: 'a' | 'b'
}

export interface KnotStep {
  text: string
  show: number[]
}

export interface Knot {
  id: string
  name: string
  use: string
  tip: string
  segments: Segment[]
  steps: KnotStep[]
  /** Drawn between rope with z < 1 and rope with z ≥ 1 (e.g. a cleat or rail). */
  object?: ReactNode
  /** Drawn above all rope. */
  overlay?: (step: number) => ReactNode
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export const KNOTS: Knot[] = [
  {
    id: 'figure-eight',
    name: 'Figure-eight',
    use: 'Stopper knot in the end of sheets so they can’t run out through blocks and fairleads.',
    tip: 'Leave a tail at least a hand-width long. It should look like the number 8 when tight.',
    segments: [
      { d: 'M200,0 L200,70', z: 2 },
      { d: 'M200,70 L200,130', z: 0 },
      { d: 'M200,130 L200,150 C200,172 232,184 252,168', z: 3 },
      { d: 'M252,168 C268,150 268,108 240,88', z: 1 },
      { d: 'M240,88 C222,76 205,82 195,96 C188,106 172,108 160,100', z: 1 },
      { d: 'M160,100 C140,88 140,52 165,44 C180,40 200,40 222,44', z: 0 },
      { d: 'M222,44 C226,60 226,72 224,100', z: 2 },
      { d: 'M224,100 C222,130 224,160 228,190 L232,250', z: -1 },
    ],
    steps: [
      { text: 'Make a loop: bring the working end round and OVER the standing part.', show: range(5) },
      { text: 'Take the end around BEHIND the standing part.', show: range(6) },
      { text: 'Bring it down through the loop from the front.', show: range(8) },
      { text: 'Pull both ends to tighten — it should look like an 8.', show: range(8) },
    ],
  },
  {
    id: 'bowline',
    name: 'Bowline',
    use: 'A fixed loop that won’t slip or jam — tying jib sheets to the clew, mooring lines, a loop round a post.',
    tip: '“The rabbit comes up out of the hole, round the tree, and back down the hole.” Easy to untie even after heavy loads.',
    segments: [
      { d: 'M200,0 L200,100', z: 2 },
      { d: 'M200,100 L200,150', z: 0 },
      { d: 'M200,150 C200,182 262,190 266,148 C270,112 240,100 208,119', z: 1 },
      { d: 'M208,119 C202,122 194,127 184,132', z: 2 },
      { d: 'M184,132 C140,160 110,230 135,280 C160,330 270,330 290,275 C305,235 290,200 262,186', z: 1 },
      { d: 'M262,186 C254,176 246,166 240,154', z: 0 },
      { d: 'M240,154 C236,140 234,126 232,108', z: 2 },
      { d: 'M232,108 C232,84 220,68 200,67 C186,66 172,76 172,88', z: 0 },
      { d: 'M172,88 C172,98 182,102 196,100 C204,99 210,100 214,104', z: 3 },
      { d: 'M214,104 C218,110 220,116 222,124', z: 2 },
      { d: 'M222,124 C224,150 222,170 220,200 L219,226', z: 0 },
    ],
    steps: [
      { text: 'Make a small loop — the rabbit hole — with the working part lying ON TOP of the standing part (the tree).', show: range(4) },
      { text: 'Leave a big loop below — this is the loop you are making.', show: range(5) },
      { text: 'The rabbit comes UP out of the hole…', show: range(7) },
      { text: '…runs round BEHIND the tree…', show: range(8) },
      { text: '…and goes back DOWN the hole.', show: range(11) },
      { text: 'Hold the tail against the loop and pull the standing part to tighten.', show: range(11) },
    ],
  },
  {
    id: 'clove-hitch',
    name: 'Clove hitch',
    use: 'Quick temporary hitch — hanging fenders from a rail or stanchion.',
    tip: 'It can slip under a changing load. For fenders, finish with a half hitch around the standing part.',
    segments: [
      // loop one
      { d: 'M30,200 C80,196 120,184 150,160', z: 1 },
      { d: 'M150,160 C176,138 170,96 140,92 C108,88 92,120 104,148', z: 2 },
      { d: 'M104,148 C112,166 122,180 136,194 C150,206 170,210 200,208', z: 3 },
      // loop two, beside
      { d: 'M200,208 C230,204 262,184 290,160', z: 1 },
      { d: 'M290,160 C316,138 310,96 280,92 C248,88 232,120 244,148', z: 2 },
      { d: 'M244,148 C252,166 262,180 276,194 C290,206 320,212 370,212', z: 3 },
      // loop two moved behind loop one
      { d: 'M200,208 C222,210 226,232 200,234 C170,236 110,232 84,224 C74,220 72,213 82,212', z: -9 },
      { d: 'M82,212 C108,208 136,190 162,166', z: -7 },
      { d: 'M162,166 C188,144 182,102 152,98 C120,94 104,126 116,154', z: -6 },
      { d: 'M116,154 C124,172 134,186 148,200 C162,212 192,220 250,222', z: -5 },
      // tail for step one
      { d: 'M200,208 L370,208', z: 1 },
    ],
    steps: [
      { text: 'Make a loop with the working part going UNDER.', show: [0, 1, 2, 10] },
      { text: 'Make a second loop exactly the same way.', show: range(6) },
      { text: 'Slide the second loop BEHIND the first.', show: [0, 1, 2, 6, 7, 8, 9] },
      { text: 'Drop both loops over the post or stanchion and pull both ends tight.', show: [0, 1, 2, 6, 7, 8, 9] },
    ],
    overlay: (step) =>
      step === 3 ? (
        <g>
          <circle cx={138} cy={130} r={20} fill="var(--muted)" stroke="var(--ink)" strokeWidth={2} />
          <circle cx={132} cy={124} r={6} fill="white" opacity={0.35} />
          <text x={138} y={40} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--muted)">
            post seen from above
          </text>
        </g>
      ) : null,
  },
  {
    id: 'round-turn',
    name: 'Round turn & two half hitches',
    use: 'Tying on to a ring, rail or post where the load must be held while you tie — mooring lines, towing.',
    tip: 'The round turn takes the load; the hitches just stop it unwinding. Can be untied under load.',
    object: (
      <g>
        <circle cx={200} cy={90} r={22} fill="var(--muted)" stroke="var(--ink)" strokeWidth={2} />
        <circle cx={194} cy={84} r={7} fill="white" opacity={0.3} />
        <text x={262} y={42} fontSize={12} fontWeight={700} fill="var(--muted)">
          rail (end-on)
        </text>
      </g>
    ),
    segments: [
      { d: 'M184,330 L184,132', z: 1 },
      { d: 'M184,132 C184,118 174,104 175,90 C176,70 190,62 202,62 C216,62 228,74 228,90 C228,106 220,116 208,118', z: 1 },
      { d: 'M208,118 C198,120 186,118 178,112 C172,106 164,98 164,88', z: 0.5 },
      { d: 'M164,88 C164,60 184,46 202,46 C228,46 244,68 244,92 C244,112 236,124 228,132', z: 2 },
      { d: 'M228,132 C226,160 214,196 196,200 C190,202 184,202 176,200', z: 0 },
      { d: 'M176,200 C160,198 160,172 174,170 C180,169 186,169 194,170', z: 2 },
      { d: 'M194,170 C204,171 214,172 226,176', z: -1 },
      { d: 'M226,176 C244,190 240,250 214,258 C204,261 192,261 176,259', z: 0 },
      { d: 'M176,259 C160,257 160,232 174,230 C180,229 186,229 194,230', z: 2 },
      { d: 'M194,230 C210,232 226,236 248,246 L262,300', z: -1 },
    ],
    steps: [
      { text: 'Take the end once around the rail…', show: range(3) },
      { text: '…and round again. That’s the round turn — it holds the load while you tie.', show: range(4) },
      { text: 'First half hitch: around the standing part, then tuck through.', show: range(7) },
      { text: 'Second half hitch, made the same way round.', show: range(10) },
      { text: 'Slide both hitches up snug against the round turn.', show: range(10) },
    ],
  },
  {
    id: 'cleat-hitch',
    name: 'Cleat hitch',
    use: 'Making a halyard, dock line or mooring line fast on a horn cleat.',
    tip: 'Turn – figure-eight – locking hitch. Don’t lock sheets you may need to release in a hurry.',
    object: (
      <g>
        <path
          d="M78,150 C78,138 96,134 120,138 L150,140 L150,132 L250,132 L250,140 L280,138 C304,134 322,138 322,150 C322,162 304,166 280,162 L250,160 L250,168 L150,168 L150,160 L120,162 C96,166 78,162 78,150 Z"
          fill="#9aa8b5"
          stroke="var(--ink)"
          strokeWidth={2}
        />
        <path d="M150,140 L250,140" stroke="white" strokeOpacity={0.4} strokeWidth={2} />
      </g>
    ),
    segments: [
      { d: 'M30,280 C90,240 190,196 262,184', z: 2 },
      { d: 'M262,184 C286,180 290,122 262,116', z: 0 },
      { d: 'M262,116 C226,110 172,110 138,116', z: 2 },
      { d: 'M138,116 C112,120 112,180 138,184', z: 0 },
      { d: 'M138,184 C184,176 220,124 290,112', z: 3 },
      { d: 'M290,112 C312,118 312,182 290,188', z: 0 },
      { d: 'M290,188 C220,176 180,124 112,112', z: 4 },
      { d: 'M112,112 C84,106 66,140 84,162 C94,174 112,172 126,160', z: 5 },
      { d: 'M126,160 C146,148 166,136 206,122', z: 3.5 },
    ],
    steps: [
      { text: 'Lead the line to the far horn and take a full turn around the base.', show: range(4) },
      { text: 'Cross diagonally over the top and around under the other horn…', show: range(6) },
      { text: '…and back across the top — a figure-eight.', show: range(7) },
      { text: 'Lock it: twist a loop so the tail lies underneath, drop it over the horn and pull tight.', show: range(9) },
    ],
  },
  {
    id: 'reef-knot',
    name: 'Reef knot',
    use: 'Tying two ends of the same line around something — reefing the sail, tying sail ties.',
    tip: 'Not for joining two ropes that will take a load (use a sheet bend). Left over right, right over left.',
    segments: [
      // step one: half knot (two ropes)
      { d: 'M100,290 C150,262 190,232 214,196', z: 2, rope: 'a' },
      { d: 'M214,196 C224,180 222,166 212,158 C204,151 196,147 188,142 C172,132 152,112 130,80', z: 0, rope: 'a' },
      { d: 'M300,290 C250,262 210,232 186,196', z: 0, rope: 'b' },
      { d: 'M186,196 C176,180 178,166 188,158 C196,151 204,147 212,142 C228,132 248,112 270,80', z: 2, rope: 'b' },
      // finished reef knot: two linked bights
      { d: 'M30,108 L196,108 C224,108 240,124 242,150', z: 0, rope: 'a' },
      { d: 'M242,150 C242,176 226,192 196,192 L30,192', z: 2, rope: 'a' },
      { d: 'M370,132 L178,132 C140,132 140,168 178,168 L370,168', z: 1, rope: 'b' },
    ],
    steps: [
      { text: 'Left over right and under — a simple half knot.', show: [0, 1, 2, 3] },
      { text: 'Right over left and under — the ends come back together.', show: [4, 5, 6] },
      { text: 'Pull tight. Each rope’s two parts lie side by side. Ends on opposite sides? That’s a granny — retie.', show: [4, 5, 6] },
    ],
  },
  {
    id: 'sheet-bend',
    name: 'Sheet bend',
    use: 'Joining two ropes, even of different thickness.',
    tip: 'Make the bight in the thicker rope. Tuck the thin rope under ITSELF, not under the bight.',
    segments: [
      { d: 'M30,110 L210,110', z: 1, rope: 'b' },
      { d: 'M210,110 C262,110 262,190 210,190', z: 1, rope: 'b' },
      { d: 'M210,190 L30,190', z: 1, rope: 'b' },
      { d: 'M370,165 C320,165 280,160 245,158', z: 0, rope: 'a' },
      { d: 'M245,158 C225,156 205,150 192,130 C188,122 186,112 184,98', z: 2, rope: 'a' },
      { d: 'M184,98 C182,80 150,78 140,96 C134,108 134,120 135,140 C136,160 136,175 138,205', z: 0, rope: 'a' },
      { d: 'M138,205 C140,225 165,226 168,208 C170,198 170,192 172,180', z: 2, rope: 'a' },
      { d: 'M172,180 C176,166 196,158 226,140', z: 1.5, rope: 'a' },
    ],
    steps: [
      { text: 'Make a bight (a U) in the thicker rope.', show: range(3) },
      { text: 'Bring the thin rope UP through the bight.', show: range(5) },
      { text: 'Take it round BEHIND both parts of the bight.', show: range(6) },
      { text: 'Tuck it UNDER ITSELF — not under the bight.', show: range(8) },
      { text: 'Hold the bight and pull the thin rope to tighten.', show: range(8) },
    ],
  },
]
