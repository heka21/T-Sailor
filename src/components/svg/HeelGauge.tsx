/** Stern-on view of the boat showing heel. `heel` is degrees, + = heeling to starboard. */
export function HeelGauge({ heel, size = 132 }: { heel: number; size?: number }) {
  return (
    <svg viewBox="0 0 140 96" width={size} height={(size * 96) / 140} role="img" aria-label={`Heel ${Math.abs(Math.round(heel))} degrees`}>
      <defs>
        <clipPath id="heel-sea">
          <rect x="0" y="62" width="140" height="40" />
        </clipPath>
      </defs>
      {/* scale */}
      {[-30, -15, 0, 15, 30].map((a) => (
        <line
          key={a}
          x1={70}
          y1={8}
          x2={70}
          y2={14}
          transform={`rotate(${a} 70 62)`}
          stroke="var(--muted)"
          strokeWidth={a === 0 ? 2 : 1}
          opacity={0.6}
        />
      ))}
      <g transform={`rotate(${heel} 70 62)`} style={{ transition: 'transform 400ms ease' }}>
        <line x1={70} y1={56} x2={70} y2={12} stroke="var(--ink)" strokeWidth={2.2} />
        <path d="M70 14 L70 54 L48 54 Z" fill="var(--sail)" stroke="var(--sail-edge)" strokeWidth={1} />
        <path d="M44 56 Q46 70 70 72 Q94 70 96 56 Z" fill="var(--hull)" stroke="var(--sea)" strokeWidth={2} />
        <path d="M66 72 L64 90 L76 90 L74 72 Z" fill="var(--sea)" />
      </g>
      <rect x="0" y="62" width="140" height="34" fill="var(--wind)" opacity={0.12} />
      <line x1="0" y1="62" x2="140" y2="62" stroke="var(--wind)" strokeOpacity={0.5} strokeWidth={1.2} />
      <text x={70} y={94} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)" clipPath="url(#heel-sea)">
        heel {Math.abs(Math.round(heel))}°
      </text>
    </svg>
  )
}

/** Horizontal bar for a 0–1 quantity (boat speed, efficiency, sheet). */
export function Meter({ value, color = 'var(--sea)', label }: { value: number; color?: string; label?: string }) {
  return (
    <div>
      {label && <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}
