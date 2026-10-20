/** International code & racing signal flags, drawn 60 × 40 at the origin. */

export type FlagId = 'class' | 'P' | 'I' | 'Z' | 'U' | 'black' | 'X' | 'first-sub' | 'AP' | 'orange' | 'N' | 'S'

export const FLAG_INFO: Record<FlagId, { name: string; meaning: string }> = {
  orange: { name: 'Orange flag', meaning: 'Marks the committee-boat end of the start line. Boats: the line is being set.' },
  class: { name: 'Class flag', meaning: 'Warning signal (5 minutes). Identifies which fleet is starting.' },
  P: { name: 'P (Papa)', meaning: 'Preparatory signal (4 minutes). Normal rules apply.' },
  I: { name: 'I (India)', meaning: 'Preparatory: in the last minute, if over the line you must sail round an end to restart.' },
  Z: { name: 'Z (Zulu)', meaning: 'Preparatory: in the last minute, inside the triangle to the first mark = 20% penalty.' },
  U: { name: 'U (Uniform)', meaning: 'Preparatory: in the last minute, inside the triangle = disqualified (unless restarted).' },
  black: { name: 'Black flag', meaning: 'Preparatory: in the last minute, inside the triangle = disqualified, even after a general recall.' },
  X: { name: 'X (X-ray)', meaning: 'Individual recall — one or more boats were over the line at the start. Go back!' },
  'first-sub': { name: 'First Substitute', meaning: 'General recall — too many boats over; the whole fleet restarts.' },
  AP: { name: 'AP (Answering Pennant)', meaning: 'Postponement — races not started are delayed. Watch for the next signal.' },
  N: { name: 'N (November)', meaning: 'Abandonment — races started are abandoned.' },
  S: { name: 'S (Sierra)', meaning: 'Shortened course — finish at the next mark or as signalled.' },
}

export function Flag({ id, x = 0, y = 0, scale = 1 }: { id: FlagId; x?: number; y?: number; scale?: number }) {
  const body = (() => {
    switch (id) {
      case 'P':
        return (
          <>
            <rect width={60} height={40} fill="#1d4ed8" />
            <rect x={20} y={13} width={20} height={14} fill="white" />
          </>
        )
      case 'I':
        return (
          <>
            <rect width={60} height={40} fill="#facc15" />
            <circle cx={30} cy={20} r={11} fill="#111" />
          </>
        )
      case 'Z':
        return (
          <>
            <path d="M0,0 L60,0 L30,20 Z" fill="#facc15" />
            <path d="M60,0 L60,40 L30,20 Z" fill="#1d4ed8" />
            <path d="M60,40 L0,40 L30,20 Z" fill="#dc2626" />
            <path d="M0,40 L0,0 L30,20 Z" fill="#111" />
          </>
        )
      case 'U':
        return (
          <>
            <rect width={60} height={40} fill="white" />
            <rect width={30} height={20} fill="#dc2626" />
            <rect x={30} y={20} width={30} height={20} fill="#dc2626" />
          </>
        )
      case 'black':
        return <rect width={60} height={40} fill="#111" />
      case 'X':
        return (
          <>
            <rect width={60} height={40} fill="white" />
            <rect x={25} width={10} height={40} fill="#1d4ed8" />
            <rect y={15} width={60} height={10} fill="#1d4ed8" />
          </>
        )
      case 'N':
        return (
          <>
            <rect width={60} height={40} fill="white" />
            {[0, 1, 2, 3].flatMap((c) =>
              [0, 1, 2, 3].map((r) =>
                (c + r) % 2 === 0 ? <rect key={`${c}${r}`} x={c * 15} y={r * 10} width={15} height={10} fill="#1d4ed8" /> : null,
              ),
            )}
          </>
        )
      case 'S':
        return (
          <>
            <rect width={60} height={40} fill="white" />
            <rect x={22} y={13} width={16} height={14} fill="#1d4ed8" />
          </>
        )
      case 'first-sub':
        return (
          <>
            <path d="M0,0 L60,20 L0,40 Z" fill="#1d4ed8" />
            <path d="M0,9 L36,20 L0,31 Z" fill="#facc15" />
          </>
        )
      case 'AP':
        return (
          <>
            <defs>
              <clipPath id="ap-clip">
                <path d="M0,0 L60,12 L60,28 L0,40 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#ap-clip)">
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={i * 12} width={12} height={40} fill={i % 2 ? 'white' : '#dc2626'} />
              ))}
            </g>
          </>
        )
      case 'orange':
        return <rect width={60} height={40} fill="#f97316" />
      case 'class':
        return (
          <>
            <rect width={60} height={40} fill="white" />
            <path d="M31 6 L31 32 L16 32 Z" fill="#0b2545" />
            <path d="M34 10 Q44 20 44 32 L34 32 Z" fill="#0e8f9b" />
          </>
        )
    }
  })()
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {body}
      {id !== 'first-sub' && id !== 'AP' && <rect width={60} height={40} fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth={1} />}
    </g>
  )
}

/** Flag on a short staff, raised (up) or lowered. */
export function FlagStaff({ id, up, x, y }: { id: FlagId; up: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-90} stroke="var(--ink)" strokeWidth={2.5} />
      <g style={{ transform: `translateY(${up ? -90 : -36}px)`, transition: 'transform 700ms cubic-bezier(.3,1.4,.5,1)', opacity: up ? 1 : 0.25 }}>
        <Flag id={id} x={2} y={0} scale={0.8} />
      </g>
    </g>
  )
}
