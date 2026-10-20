/**
 * Sailing maths shared by every simulator.
 *
 * Conventions
 * - Angles are degrees. Bearings are compass style: 0 = north (up), clockwise.
 * - `windFrom` is the direction the wind blows FROM (how sailors and forecasts describe it).
 * - A signed wind angle is positive when the wind comes over the starboard side
 *   (starboard tack) and negative over the port side (port tack).
 * - Screen coordinates are SVG: x to the right, y down.
 */

export type Tack = 'port' | 'starboard' | 'head-to-wind'

/** Keelboats cannot sail closer than about 45° to the true wind. */
export const NO_GO = 45
/** Approximate top speed (knots) of a ~30 ft training keelboat. */
export const HULL_SPEED = 7

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const toRad = (d: number) => (d * Math.PI) / 180
export const toDeg = (r: number) => (r * 180) / Math.PI
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const norm360 = (a: number) => ((a % 360) + 360) % 360
export const norm180 = (a: number) => {
  const x = norm360(a)
  return x > 180 ? x - 360 : x
}

/** Interpolate between two bearings the short way round. */
export const lerpAngle = (a: number, b: number, t: number) => norm360(a + norm180(b - a) * t)

/** Signed true-wind angle relative to the bow: + starboard tack, − port tack. */
export const windAngle = (heading: number, windFrom: number) => norm180(windFrom - heading)

export function tackOf(signedAngle: number): Tack {
  if (Math.abs(signedAngle) < 0.5) return 'head-to-wind'
  return signedAngle > 0 ? 'starboard' : 'port'
}

export const isInNoGoZone = (twa: number) => Math.abs(twa) < NO_GO

export interface PointOfSail {
  id: 'no-go' | 'close-hauled' | 'close-reach' | 'beam-reach' | 'broad-reach' | 'run'
  name: string
  from: number
  to: number
  trim: string
  description: string
}

export const POINTS_OF_SAIL: PointOfSail[] = [
  {
    id: 'no-go',
    name: 'No-go zone',
    from: 0,
    to: NO_GO,
    trim: 'Sails flap (luff) whatever you do.',
    description:
      'Too close to the wind for the sails to work. The boat slows and stops ("in irons"). Bear away to fill the sails.',
  },
  {
    id: 'close-hauled',
    name: 'Close-hauled',
    from: NO_GO,
    to: 60,
    trim: 'Sheets pulled in hard.',
    description: 'Sailing as close to the wind as possible — the way to make ground upwind. Boat heels the most.',
  },
  {
    id: 'close-reach',
    name: 'Close reach',
    from: 60,
    to: 80,
    trim: 'Ease the sheets a little.',
    description: 'Between close-hauled and a beam reach. Fast and powerful.',
  },
  {
    id: 'beam-reach',
    name: 'Beam reach',
    from: 80,
    to: 100,
    trim: 'Sails eased about halfway out.',
    description: 'Wind directly across the side (the beam). Usually the fastest, most comfortable point of sail.',
  },
  {
    id: 'broad-reach',
    name: 'Broad reach',
    from: 100,
    to: 160,
    trim: 'Sails eased well out.',
    description: 'Wind coming from behind the beam, over the rear quarter. Great spinnaker angle.',
  },
  {
    id: 'run',
    name: 'Run',
    from: 160,
    to: 180.01,
    trim: 'Sails fully out — beware an accidental gybe.',
    description:
      'Wind from directly behind. The boom is right out; if the wind gets on the wrong side of the main it can gybe suddenly.',
  },
]

export function pointOfSail(twa: number): PointOfSail {
  const a = Math.abs(twa)
  return POINTS_OF_SAIL.find((p) => a >= p.from && a < p.to) ?? POINTS_OF_SAIL[POINTS_OF_SAIL.length - 1]
}

/** Simple speed polar: knots for a given true wind speed and true wind angle. */
export function boatSpeed(tws: number, twa: number): number {
  const a = Math.abs(twa)
  if (a < 30 || tws <= 0) return 0
  let f: number
  if (a < NO_GO) f = ((a - 30) / (NO_GO - 30)) * 0.8
  else if (a < 90) f = 0.8 + ((a - NO_GO) / (90 - NO_GO)) * 0.2
  else if (a < 120) f = 1
  else f = 1 - ((a - 120) / 60) * 0.3
  return HULL_SPEED * (1 - Math.exp(-tws / 8)) * f
}

export interface Wind {
  speed: number
  /** Signed angle relative to the bow (same sign convention as `windAngle`). */
  angle: number
}

/** Apparent wind = true wind + the headwind created by the boat's own motion. */
export function apparentWind(tws: number, twaSigned: number, bs: number): Wind {
  const t = toRad(twaSigned)
  const x = tws * Math.cos(t) + bs
  const y = tws * Math.sin(t)
  return { speed: Math.hypot(x, y), angle: toDeg(Math.atan2(y, x)) }
}

/** Best sail angle from the centreline for an apparent wind angle (keeps ~18° angle of attack). */
export const idealSailAngle = (awa: number) => clamp(Math.abs(awa) - 18, 4, 85)

export type FlowState = 'luffing' | 'streaming' | 'stalled' | 'running'

/** How air flows over the sail for a given apparent wind angle and sail angle. */
export function sailFlow(awa: number, sailAngle: number): FlowState {
  const a = Math.abs(awa)
  const aoa = a - sailAngle
  if (aoa < 8) return 'luffing'
  if (a > 120 && sailAngle >= 80) return 'running'
  if (aoa > 30) return 'stalled'
  return 'streaming'
}

/** 0–1: how well the sail is driving the boat for this trim. */
export function trimEfficiency(awa: number, sailAngle: number): number {
  const a = Math.abs(awa)
  const aoa = a - sailAngle
  if (aoa <= 0) return 0
  if (a > 120) return clamp(sailAngle / 85, 0.2, 1)
  return clamp(1 - Math.abs(aoa - 18) / 22, 0, 1)
}

/** Rough heel angle (degrees) for a visual: greatest upwind, in a breeze, with good trim. */
export function heelAngle(aws: number, awa: number, efficiency = 1): number {
  const side = Math.sin(toRad(clamp(Math.abs(awa), 0, 180)))
  const upwind = Math.abs(awa) < 100 ? 1 : 0.4
  return clamp(aws * aws * 0.09 * side * upwind * efficiency, 0, 32)
}

/* ---------- vectors in SVG space ---------- */

export interface Vec {
  x: number
  y: number
}

/** Unit vector pointing along a compass bearing in SVG coordinates (north = up). */
export const bearingVec = (bearing: number): Vec => ({ x: Math.sin(toRad(bearing)), y: -Math.cos(toRad(bearing)) })
/** Compass bearing of an SVG vector. */
export const vecBearing = (v: Vec) => norm360(toDeg(Math.atan2(v.x, -v.y)))
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y
export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y)

/** Point at a bearing and distance from an origin. */
export const polar = (origin: Vec, bearing: number, r: number): Vec => add(origin, scale(bearingVec(bearing), r))

/** SVG arc path for a ring sector between two bearings. */
export function sectorPath(c: Vec, r0: number, r1: number, fromBearing: number, toBearing: number): string {
  const sweep = norm360(toBearing - fromBearing)
  const large = sweep > 180 ? 1 : 0
  const a = polar(c, fromBearing, r1)
  const b = polar(c, toBearing, r1)
  const d = polar(c, toBearing, r0)
  const e = polar(c, fromBearing, r0)
  return [
    `M${a.x},${a.y}`,
    `A${r1},${r1} 0 ${large} 1 ${b.x},${b.y}`,
    `L${d.x},${d.y}`,
    `A${r0},${r0} 0 ${large} 0 ${e.x},${e.y}`,
    'Z',
  ].join(' ')
}

/* ---------- start line ---------- */

export interface LineBias {
  /** Degrees the line is skewed from square to the wind; + means the pin end is upwind. */
  bias: number
  favoured: 'pin' | 'committee' | 'square'
  /** How much further upwind the favoured end is, in the same units as the inputs. */
  gain: number
}

export function lineBias(committee: Vec, pin: Vec, windFrom: number): LineBias {
  const w = bearingVec(windFrom)
  const diff = dot(pin, w) - dot(committee, w)
  const len = dist(committee, pin) || 1
  const bias = toDeg(Math.asin(clamp(diff / len, -1, 1)))
  const favoured = bias > 1 ? 'pin' : bias < -1 ? 'committee' : 'square'
  return { bias, favoured, gain: Math.abs(diff) }
}

/* ---------- Beaufort ---------- */

/** Upper bound (exclusive) of each Beaufort force in knots, force 0..11; force 12 is anything above. */
const BEAUFORT_LIMITS = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64]
export const beaufortForce = (knots: number) => {
  const i = BEAUFORT_LIMITS.findIndex((lim) => knots < lim)
  return i === -1 ? 12 : i
}

export const compassPoint = (bearing: number) => {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return pts[Math.round(norm360(bearing) / 22.5) % 16]
}
