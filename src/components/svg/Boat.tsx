import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { toRad, type FlowState } from '../../lib/sailing'

/**
 * Top-down keelboat drawn in its own frame: bow at y = −52, stern at y = +48, centreline x = 0.
 * Rotate the whole thing with `heading` (compass degrees).
 */

export const HULL_PATH =
  'M0,-52 C14,-38 19,-12 18,14 C17.5,30 15,44 12,48 L-12,48 C-15,44 -17.5,30 -18,14 C-19,-12 -14,-38 0,-52 Z'
export const BOAT_LENGTH = 100
export const MAST = { x: 0, y: -10 }
const FORESTAY = { x: 0, y: -47 }

export interface BoatProps {
  x?: number
  y?: number
  heading: number
  scale?: number
  /** Mainsail angle off the centreline (degrees, 0–90). */
  sail?: number
  /** Jib angle off the centreline; defaults to follow the main. */
  jib?: number
  /** Which side the sails are on: 1 = starboard (right), −1 = port (left). */
  side?: 1 | -1
  flow?: FlowState
  /** Tiller angle (degrees, + = pushed to starboard). */
  tiller?: number
  accent?: string
  label?: string
  crew?: { x: number; y: number; color?: string }[]
  showJib?: boolean
  showMain?: boolean
  opacity?: number
  children?: ReactNode
}

function sailPath(from: { x: number; y: number }, length: number, angle: number, side: 1 | -1, camber: number) {
  const a = toRad(angle)
  const end = { x: from.x + side * Math.sin(a) * length, y: from.y + Math.cos(a) * length }
  const perp = { x: side * Math.cos(a), y: -Math.sin(a) }
  const ctrl = {
    x: (from.x + end.x) / 2 + perp.x * camber,
    y: (from.y + end.y) / 2 + perp.y * camber,
  }
  return { d: `M${from.x},${from.y} Q${ctrl.x},${ctrl.y} ${end.x},${end.y}`, end }
}

function Sail({
  from,
  length,
  angle,
  side,
  flow,
  width,
}: {
  from: { x: number; y: number }
  length: number
  angle: number
  side: 1 | -1
  flow?: FlowState
  width: number
}) {
  const full = sailPath(from, length, angle, side, length * 0.2)
  if (flow === 'luffing') {
    const a = sailPath(from, length, angle, side, length * 0.1).d
    const b = sailPath(from, length, angle, side, -length * 0.08).d
    return (
      <motion.path
        d={a}
        animate={{ d: [a, b, a] }}
        transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
        fill="none"
        stroke="var(--sail-edge)"
        strokeWidth={width}
        strokeLinecap="round"
      />
    )
  }
  return (
    <g>
      <path d={`${full.d} L${from.x},${from.y} Z`} fill="var(--sail)" stroke="var(--sail-edge)" strokeWidth={0.8} filter="url(#sail-shadow)" />
      <path d={full.d} fill="none" stroke="var(--sail-edge)" strokeWidth={width} strokeLinecap="round" />
    </g>
  )
}

export function Boat({
  x = 0,
  y = 0,
  heading,
  scale = 1,
  sail = 20,
  jib,
  side = 1,
  flow,
  tiller = 0,
  accent = 'var(--sea)',
  label,
  crew,
  showJib = true,
  showMain = true,
  opacity = 1,
  children,
}: BoatProps) {
  const jibAngle = jib ?? Math.min(70, sail * 0.9 + 2)
  const boomEnd = sailPath(MAST, 46, sail, side, 0).end
  const t = toRad(tiller)
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`} opacity={opacity}>
      {/* shadow / wake */}
      <path d={HULL_PATH} transform="translate(2 3)" fill="black" opacity={0.12} />
      {/* rudder */}
      <line x1={0} y1={48} x2={0} y2={55} stroke="var(--sail-edge)" strokeWidth={3} strokeLinecap="round" />
      <defs>
        <filter id="sail-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="1.4" floodColor="#0b2545" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* hull: tinted deck so the white sails stand out */}
      <path d={HULL_PATH} style={{ fill: `color-mix(in srgb, ${accent} 16%, var(--hull))` }} stroke={accent} strokeWidth={2.2} />
      <path
        d="M-10,-16 C-11,-4 -11,6 -10,15 L10,15 C11,6 11,-4 10,-16 C6,-24 -6,-24 -10,-16 Z"
        fill={accent}
        opacity={0.14}
      />
      <rect x={-11.5} y={19} width={23} height={25} rx={5} fill={accent} opacity={0.22} />
      {/* tiller, pivoting at the rudder head */}
      <line
        x1={0}
        y1={46}
        x2={Math.sin(t) * 19}
        y2={46 - Math.cos(t) * 19}
        stroke="#8a6a44"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {label && (
        <text x={0} y={4} textAnchor="middle" fontSize={13} fontWeight={700} fill={accent} transform="rotate(0)">
          {label}
        </text>
      )}
      {crew?.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={4.2} fill={c.color ?? 'var(--signal)'} stroke="white" strokeWidth={1.2} />
      ))}
      {/* sails */}
      {showJib && <Sail from={FORESTAY} length={34} angle={jibAngle} side={side} flow={flow} width={2} />}
      {showMain && (
        <>
          <Sail from={MAST} length={46} angle={sail} side={side} flow={flow} width={2.4} />
          <line
            x1={MAST.x}
            y1={MAST.y}
            x2={boomEnd.x}
            y2={boomEnd.y}
            stroke="var(--ink)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx={MAST.x} cy={MAST.y} r={3.2} fill="var(--ink)" />
      {children}
    </g>
  )
}
