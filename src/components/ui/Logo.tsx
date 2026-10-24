export function Logo({ small = false, markOnly = false }: { small?: boolean; markOnly?: boolean }) {
  const s = small ? 30 : 36
  return (
    <span className="flex items-center gap-2.5">
      <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#0b2545" />
        <path d="M33 10 L33 44 L14 44 Z" fill="#e6eef5" />
        <path d="M36 16 C46 24 50 34 50 44 L36 44 Z" fill="#14b8c4" />
        <path d="M10 48 L54 48 L48 55 L16 55 Z" fill="#f26b1d" />
      </svg>
      {!markOnly && (
        <span className={`font-display font-bold tracking-tight ${small ? 'text-lg' : 'text-xl'}`}>
          T-<span className="text-sea">Sailor</span>
        </span>
      )}
    </span>
  )
}
