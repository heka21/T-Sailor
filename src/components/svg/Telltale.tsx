import { motion } from 'motion/react'

export type TelltaleState = 'stream' | 'lift' | 'droop'

/** A wool telltale tied at (x, y). Streams to the right (aft) when the flow is attached. */
export function Telltale({ x, y, state, color, length = 46 }: { x: number; y: number; state: TelltaleState; color: string; length?: number }) {
  const angle = state === 'stream' ? 0 : state === 'lift' ? -70 : 80
  const l = length
  const a = `M0,0 q${l / 4},-4 ${l / 2},0 t${l / 2},0`
  const b = `M0,0 q${l / 4},4 ${l / 2},0 t${l / 2},0`
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 120, damping: 12 }} style={{ originX: 0, originY: 0.5 }}>
        <g className={state === 'lift' ? 'flutter' : undefined}>
          <motion.path
            d={a}
            animate={{ d: state === 'droop' ? [a, a] : [a, b, a] }}
            transition={{ duration: state === 'stream' ? 0.9 : 0.3, repeat: Infinity, ease: 'easeInOut' }}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </g>
      </motion.g>
      <circle r={4} fill="var(--ink)" />
    </g>
  )
}
