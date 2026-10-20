import { useState } from 'react'
import { Flag, FLAG_INFO, type FlagId } from '../../components/svg/Flags'

const GROUPS: { title: string; flags: FlagId[] }[] = [
  { title: 'Starting', flags: ['orange', 'class', 'P', 'I', 'Z', 'U', 'black'] },
  { title: 'Recalls', flags: ['X', 'first-sub'] },
  { title: 'Changes', flags: ['AP', 'N', 'S'] },
]

export function FlagSignals({ only }: { only?: FlagId[] }) {
  const [active, setActive] = useState<FlagId>(only?.[0] ?? 'P')
  const groups = only ? [{ title: 'Signals', flags: only }] : GROUPS
  return (
    <div className="not-prose my-6 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{g.title}</div>
            <div className="flex flex-wrap gap-2">
              {g.flags.map((f) => (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`rounded-xl border-2 p-1.5 transition ${active === f ? 'border-sea bg-sea-soft/50' : 'border-transparent hover:bg-surface-2'}`}
                  aria-label={FLAG_INFO[f].name}
                >
                  <svg viewBox="-4 -4 68 48" width={64} height={45}>
                    <Flag id={f} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <div className="font-display text-lg font-bold">{FLAG_INFO[active].name}</div>
        <p className="mt-0.5 text-[15px] text-muted">{FLAG_INFO[active].meaning}</p>
      </div>
      <p className="mt-3 text-xs text-muted">
        Times are signalled by flags — sounds only draw attention. If they disagree, the flag rules. Always check the
        Sailing Instructions for your race.
      </p>
    </div>
  )
}
