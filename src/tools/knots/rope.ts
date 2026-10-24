/**
 * Rope geometry for the knot diagrams.
 *
 * A strand is a list of control points [x, y, depth]. It is drawn as a smooth curve (centripetal Catmull-Rom)
 * through them; depth is interpolated along the curve and decides which pass is on top wherever the rope crosses
 * itself or another strand, and whether it is in front of (≥ 0) or behind (< 0) the object it is tied to.
 *
 * Drawing: every strand is laid down whole, then the upper pass at each crossing is drawn again over the lower one.
 * Texture (the twist of the strands) is placed by distance along the rope, so a redrawn piece lines up exactly.
 */

export type Pt = [x: number, y: number, depth: number]

export interface Sample {
  x: number
  y: number
  z: number
  /** Control-point parameter: 3.5 is halfway between points 3 and 4. */
  u: number
  /** Distance along the rope from its first point. */
  s: number
}

/** Roughly how far apart (px) the samples along the rope are. */
const SPACING = 3.5

/** Samples the curve through `pts` from its start up to parameter `uEnd`. */
export function sample(pts: Pt[], uEnd = pts.length - 1): Sample[] {
  const n = pts.length
  const at = (i: number): Pt => {
    if (i < 0) return extend(pts[0], pts[1])
    if (i >= n) return extend(pts[n - 1], pts[n - 2])
    return pts[i]
  }
  const end = Math.max(0, Math.min(n - 1, uEnd))
  const out: Sample[] = []
  let s = 0
  const push = (x: number, y: number, z: number, u: number) => {
    const prev = out[out.length - 1]
    if (prev) s += Math.hypot(x - prev.x, y - prev.y)
    out.push({ x, y, z, u, s })
  }
  push(pts[0][0], pts[0][1], pts[0][2], 0)
  for (let i = 0; i < n - 1 && i < end; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const per = Math.max(3, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / SPACING))
    const steps = Math.min(per, Math.ceil((end - i) * per))
    for (let k = 1; k <= steps; k++) {
      const t = Math.min(k / per, end - i)
      const [x, y] = catmull(p0, p1, p2, p3, t)
      push(x, y, p1[2] + (p2[2] - p1[2]) * t, i + t)
    }
  }
  return out
}

const extend = (a: Pt, b: Pt): Pt => [2 * a[0] - b[0], 2 * a[1] - b[1], a[2]]

/** Centripetal Catmull-Rom (Barry–Goldman): no cusps or overshoot loops when points are unevenly spaced. */
function catmull(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [number, number] {
  const knot = (a: Pt, b: Pt) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5)
  const t1 = knot(p0, p1)
  const t2 = t1 + knot(p1, p2)
  const t3 = t2 + knot(p2, p3)
  const tt = t1 + (t2 - t1) * t
  const lerp = (a: number[], b: number[], ta: number, tb: number) => {
    const w = (tt - ta) / (tb - ta)
    return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w]
  }
  const a1 = lerp(p0, p1, 0, t1)
  const a2 = lerp(p1, p2, t1, t2)
  const a3 = lerp(p2, p3, t2, t3)
  const b1 = lerp(a1, a2, 0, t2)
  const b2 = lerp(a2, a3, t1, t3)
  return lerp(b1, b2, t1, t2) as [number, number]
}

export interface Crossing {
  /** Strand index and distance along it of the pass on top… */
  over: number
  sOver: number
  /** …and of the pass underneath. */
  under: number
  sUnder: number
  zOver: number
  /** Sine of the angle between the two passes: the shallower the crossing, the longer the stretch they overlap. */
  sin: number
}

/** Every place where two passes of rope cross, with which one is on top. */
export function crossings(strands: Sample[][], widths: number[]): Crossing[] {
  const out: Crossing[] = []
  for (let a = 0; a < strands.length; a++) {
    for (let b = a; b < strands.length; b++) {
      const A = strands[a]
      const B = strands[b]
      const gap = (widths[a] + widths[b]) * 1.2
      for (let i = 0; i < A.length - 1; i++) {
        const p = A[i]
        const q = A[i + 1]
        for (let j = a === b ? i + 2 : 0; j < B.length - 1; j++) {
          const r = B[j]
          const v = B[j + 1]
          if (a === b && r.s - q.s < gap) continue
          if (Math.max(p.x, q.x) < Math.min(r.x, v.x) || Math.max(r.x, v.x) < Math.min(p.x, q.x)) continue
          if (Math.max(p.y, q.y) < Math.min(r.y, v.y) || Math.max(r.y, v.y) < Math.min(p.y, q.y)) continue
          const hit = intersect(p, q, r, v)
          if (!hit) continue
          const [t, w] = hit
          const za = p.z + (q.z - p.z) * t
          const zb = r.z + (v.z - r.z) * w
          const sa = p.s + (q.s - p.s) * t
          const sb = r.s + (v.s - r.s) * w
          const sin = Math.abs((q.x - p.x) * (v.y - r.y) - (q.y - p.y) * (v.x - r.x)) / ((q.s - p.s) * (v.s - r.s) || 1)
          out.push(
            za >= zb
              ? { over: a, sOver: sa, under: b, sUnder: sb, zOver: za, sin }
              : { over: b, sOver: sb, under: a, sUnder: sa, zOver: zb, sin },
          )
        }
      }
    }
  }
  return out.sort((x, y) => x.zOver - y.zOver)
}

function intersect(p: Sample, q: Sample, r: Sample, v: Sample): [number, number] | null {
  const dx1 = q.x - p.x
  const dy1 = q.y - p.y
  const dx2 = v.x - r.x
  const dy2 = v.y - r.y
  const den = dx1 * dy2 - dy1 * dx2
  if (Math.abs(den) < 1e-9) return null
  const t = ((r.x - p.x) * dy2 - (r.y - p.y) * dx2) / den
  const w = ((r.x - p.x) * dy1 - (r.y - p.y) * dx1) / den
  return t >= 0 && t < 1 && w >= 0 && w < 1 ? [t, w] : null
}

/** The samples between distances s0 and s1, with the ends cut exactly. */
export function slice(line: Sample[], s0: number, s1: number): Sample[] {
  const out: Sample[] = []
  const lerp = (a: Sample, b: Sample, s: number): Sample => {
    const t = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, u: a.u + (b.u - a.u) * t, s }
  }
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]
    const b = line[i + 1]
    if (b.s < s0 || a.s > s1) continue
    if (!out.length) out.push(a.s >= s0 ? a : lerp(a, b, s0))
    if (b.s <= s1) out.push(b)
    else {
      out.push(lerp(a, b, s1))
      break
    }
  }
  return out
}

/** Splits a strand into runs that are in front of / behind the object (depth ≥ 0 / < 0). */
export function runs(line: Sample[]): { back: boolean; pts: Sample[] }[] {
  const out: { back: boolean; pts: Sample[] }[] = []
  for (let i = 0; i < line.length; i++) {
    const back = line[i].z < 0
    const cur = out[out.length - 1]
    if (cur && cur.back === back) cur.pts.push(line[i])
    else {
      // Start the new run where the old one ended so there is no gap.
      out.push({ back, pts: cur ? [cur.pts[cur.pts.length - 1], line[i]] : [line[i]] })
    }
  }
  return out
}

const LIGHT = norm(-0.45, -0.89)

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

function tangents(pts: Sample[]): [number, number][] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    return norm(b.x - a.x, b.y - a.y)
  })
}

const f = (n: number) => Math.round(n * 10) / 10

export function linePath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)},${f(p.y)}`).join('')
}

export interface RopeLayers {
  center: string
  /** Centre line nudged towards the light, for the shine along the top of the rope. */
  shine: string
  /** And away from it, for the shadowed side. */
  shadow: string
  /** Short diagonal strokes across the rope: the lay of its strands. */
  twist: string
}

/** Path data for one piece of rope. `width` is the rope's diameter. */
export function ropeLayers(pts: Sample[], width: number): RopeLayers {
  const tan = tangents(pts)
  const offset = (k: number) =>
    linePath(
      pts.map((p, i) => {
        const [tx, ty] = tan[i]
        const d = LIGHT[0] * tx + LIGHT[1] * ty
        return { x: p.x + (LIGHT[0] - d * tx) * k, y: p.y + (LIGHT[1] - d * ty) * k }
      }),
    )
  const pitch = width * 0.9
  const half = width * 0.46
  let twist = ''
  if (pts.length > 1) {
    const first = Math.ceil(pts[0].s / pitch)
    const last = Math.floor(pts[pts.length - 1].s / pitch)
    let j = 0
    for (let k = first; k <= last; k++) {
      const s = k * pitch
      while (j < pts.length - 2 && pts[j + 1].s < s) j++
      const a = pts[j]
      const b = pts[j + 1]
      const t = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s)
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t
      const [tx, ty] = tan[j]
      const lean = width * 0.32
      twist += `M${f(x - ty * half - tx * lean)},${f(y + tx * half - ty * lean)}L${f(x + ty * half + tx * lean)},${f(y - tx * half + ty * lean)}`
    }
  }
  return { center: linePath(pts), shine: offset(width * 0.2), shadow: offset(-width * 0.24), twist }
}

/** Arrowhead triangle at the end of a polyline. */
export function arrowHead(pts: { x: number; y: number }[], size: number): string {
  const b = pts[pts.length - 1]
  let a = pts[0]
  for (let i = pts.length - 2; i >= 0; i--) {
    a = pts[i]
    if (Math.hypot(b.x - a.x, b.y - a.y) > size) break
  }
  const [tx, ty] = norm(b.x - a.x, b.y - a.y)
  const bx = b.x - tx * size
  const by = b.y - ty * size
  const w = size * 0.6
  return `M${f(b.x)},${f(b.y)}L${f(bx - ty * w)},${f(by + tx * w)}L${f(bx + ty * w)},${f(by - tx * w)}Z`
}

export function lerpPts(a: Pt[], b: Pt[] | undefined, t: number): Pt[] {
  if (!b || t <= 0) return a
  if (t >= 1) return b
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t, p[2] + (b[i][2] - p[2]) * t])
}
