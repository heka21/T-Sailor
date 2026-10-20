import { useId, useMemo, type CSSProperties } from 'react'
import { compassPoint, polar } from '../../lib/sailing'

function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Animated wind streaks drifting downwind across a rectangle. */
export function WindField({
  windFrom,
  width,
  height,
  x = 0,
  y = 0,
  speed = 12,
  density = 1,
  color = 'var(--wind)',
}: {
  windFrom: number
  width: number
  height: number
  x?: number
  y?: number
  speed?: number
  density?: number
  color?: string
}) {
  const id = useId()
  const cx = x + width / 2
  const cy = y + height / 2
  const D = Math.hypot(width, height) / 2 + 40
  const streaks = useMemo(() => {
    const r = rand(7)
    const n = Math.round(42 * density)
    return Array.from({ length: n }, () => ({
      x: cx + (r() * 2 - 1) * D,
      y: cy + (r() * 2 - 1) * D * 0.2,
      len: 18 + r() * 34,
      delay: -r() * 10,
      dur: 0.75 + r() * 0.5,
    }))
  }, [cx, cy, D, density])
  const base = 60 / Math.max(2, speed)

  return (
    <g clipPath={`url(#${id})`} pointerEvents="none">
      <clipPath id={id}>
        <rect x={x} y={y} width={width} height={height} />
      </clipPath>
      <g transform={`rotate(${windFrom} ${cx} ${cy})`}>
        {streaks.map((s, i) => (
          <line
            key={i}
            className="wind-streak"
            x1={s.x}
            y1={s.y}
            x2={s.x}
            y2={s.y + s.len}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={1.6}
            strokeLinecap="round"
            style={
              {
                '--d': `${D}px`,
                animationDuration: `${base * s.dur}s`,
                animationDelay: `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </g>
    </g>
  )
}

/** A bold arrow showing where the wind comes from, placed upwind of a centre point. */
export function WindArrow({
  windFrom,
  cx,
  cy,
  r,
  speed,
  label = true,
}: {
  windFrom: number
  cx: number
  cy: number
  r: number
  speed?: number
  label?: boolean
}) {
  const tail = polar({ x: cx, y: cy }, windFrom, r)
  return (
    <g pointerEvents="none">
      {/* the arrow is drawn pointing down (south) = the way a northerly blows */}
      <g transform={`translate(${tail.x} ${tail.y}) rotate(${windFrom})`}>
        <path d="M-7,-26 L7,-26 L7,6 L16,6 L0,26 L-16,6 L-7,6 Z" fill="var(--wind)" opacity={0.95} />
      </g>
      {label && (
        <g transform={`translate(${polar({ x: cx, y: cy }, windFrom, r + 44).x} ${polar({ x: cx, y: cy }, windFrom, r + 44).y})`}>
          <rect x={-46} y={-13} width={92} height={26} rx={13} fill="var(--wind)" />
          <text x={0} y={5} textAnchor="middle" fontSize={13} fontWeight={700} fill="white">
            WIND{speed != null ? ` ${Math.round(speed)} kn` : ` ${compassPoint(windFrom)}`}
          </text>
        </g>
      )}
    </g>
  )
}

/** Shared gradients and patterns for water backgrounds. Render once inside an <svg>. */
export function WaterDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-water`} cx="50%" cy="45%" r="75%">
        <stop offset="0%" stopColor="var(--water)" />
        <stop offset="100%" stopColor="var(--water-2)" />
      </radialGradient>
      <pattern id={`${id}-waves`} width="46" height="22" patternUnits="userSpaceOnUse">
        <path d="M2 14 q6 -6 12 0 t12 0" fill="none" stroke="white" strokeOpacity="0.22" strokeWidth="1.4" />
      </pattern>
    </defs>
  )
}

export function Water({ id, width, height, x = 0, y = 0, rx = 0 }: { id: string; width: number; height: number; x?: number; y?: number; rx?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={rx} fill={`url(#${id}-water)`} />
      <rect x={x} y={y} width={width} height={height} rx={rx} fill={`url(#${id}-waves)`} />
    </g>
  )
}
