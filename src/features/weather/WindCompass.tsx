import { motion } from 'motion/react'
import { compassPoint } from '../../lib/sailing'

/** Compass rose with an arrow blowing FROM `dir` across the dial. */
export function WindCompass({ dir, knots, size = 220 }: { dir: number; knots: number; size?: number }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="img" aria-label={`Wind from ${compassPoint(dir)} at ${Math.round(knots)} knots`}>
      <circle cx={120} cy={120} r={112} fill="var(--surface)" stroke="var(--line)" strokeWidth={2} />
      {ticks.map((a) => (
        <line
          key={a}
          x1={120}
          y1={12}
          x2={120}
          y2={a % 45 === 0 ? 26 : a % 15 === 0 ? 20 : 16}
          stroke="var(--muted)"
          strokeWidth={a % 45 === 0 ? 2 : 1}
          opacity={a % 15 === 0 ? 0.8 : 0.4}
          transform={`rotate(${a} 120 120)`}
        />
      ))}
      {['N', 'E', 'S', 'W'].map((p, i) => (
        <text key={p} x={120} y={44} textAnchor="middle" fontSize={15} fontWeight={700} fill={p === 'N' ? 'var(--port)' : 'var(--ink)'} transform={`rotate(${i * 90} 120 120)`}>
          {p}
        </text>
      ))}
      <motion.g initial={{ rotate: 0 }} animate={{ rotate: dir }} transition={{ type: 'spring', stiffness: 40, damping: 12 }} style={{ transformBox: 'view-box', originX: '120px', originY: '120px' }}>
        {/* tail at the upwind side (top when dir = 0), head pointing downwind */}
        <path d="M120,52 L120,170" stroke="var(--wind)" strokeWidth={6} strokeLinecap="round" />
        <path d="M120,192 L104,164 L136,164 Z" fill="var(--wind)" />
        <path d="M120,52 l-12,-12 M120,52 l12,-12 M120,66 l-12,-12 M120,66 l12,-12" stroke="var(--wind)" strokeWidth={4} strokeLinecap="round" />
      </motion.g>
      <circle cx={120} cy={120} r={30} fill="var(--surface)" stroke="var(--line)" />
      <text x={120} y={124} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--ink)" fontFamily="Space Grotesk, sans-serif">
        {Math.round(knots)}
      </text>
      <text x={120} y={139} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)">
        knots
      </text>
    </svg>
  )
}
