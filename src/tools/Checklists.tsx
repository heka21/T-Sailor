import { CheckCircle2, Circle, RotateCcw } from 'lucide-react'
import { useProgress } from '../lib/progress'
import { Button } from '../components/ui/controls'

export const CHECKLISTS: { id: string; title: string; blurb: string; items: string[] }[] = [
  {
    id: 'home',
    title: 'Before you leave home',
    blurb: 'Perth sun and the afternoon sea breeze catch people out.',
    items: [
      'Check the forecast (BOM) — wind strength, direction and when the sea breeze arrives',
      'Hat with a strap, sunglasses with a cord, SPF 50+ sunscreen',
      'Non-marking, non-slip shoes (no black soles)',
      'Layers + a spray jacket — it is cooler on the water',
      'Water bottle and a snack',
      'Sailing gloves (optional but helpful on sheets)',
      'Phone in a waterproof pouch',
    ],
  },
  {
    id: 'predeparture',
    title: 'Pre-departure on the boat',
    blurb: 'Run through this with the skipper before casting off.',
    items: [
      'Lifejackets fitted and adjusted for everyone (and worn when required)',
      'Safety briefing: man overboard, lifejacket use, fire, radio/phone, where the safety gear is',
      'Safety gear located: flares, fire extinguisher, bucket/bailer, anchor, first-aid kit, torch, throwable lifebuoy',
      'Bilge checked; hatches and bungs secure',
      'Rig check: shackles closed, split pins/rings taped, shrouds tight',
      'Sheets and halyards led correctly, not twisted — stopper knots in the ends',
      'Sails ready to hoist; battens in; telltales free',
      'Engine: fuel, kill cord/key, in neutral, cooling water flowing',
      'Radio on and checked; club or Sea Rescue channel noted',
      'Crew roles agreed and the plan for the sail discussed',
      'Departure logged with the club (or someone ashore knows your plan)',
    ],
  },
  {
    id: 'leaving',
    title: 'Leaving the mooring / pen',
    blurb: 'Slow is pro. Plan which line comes off last.',
    items: [
      'Check wind and current direction — which way will the boat drift?',
      'Fenders out on the side you are leaving from',
      'Crew briefed on which lines to release and in what order',
      'Look all around for traffic before moving',
      'Cast off; crew keeps hands and feet inside the boat — never fend off with legs',
      'Fenders and lines stowed once clear',
    ],
  },
  {
    id: 'packup',
    title: 'Back in — pack up',
    blurb: 'Leave the boat better than you found it.',
    items: [
      'Mooring lines secure, with chafe protection where needed',
      'Sails down, folded or furled, and covered',
      'Halyards tied off away from the mast (no slapping!)',
      'Sheets coiled and stowed',
      'Engine off, fuel off; battery isolated if required',
      'Rubbish off the boat; cockpit rinsed',
      'Hatches locked; any damage reported to the club',
      'Log your return',
    ],
  },
]

export function Checklist({ id }: { id: string }) {
  const list = CHECKLISTS.find((c) => c.id === id)!
  const checks = useProgress((s) => s.checks)
  const toggle = useProgress((s) => s.toggleCheck)
  const reset = useProgress((s) => s.resetChecks)
  const done = list.items.filter((_, i) => checks[`${id}:${i}`]).length
  return (
    <section id={`checklist-${id}`} className="scroll-mt-24 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{list.title}</h3>
          <p className="text-sm text-muted">{list.blurb}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${done === list.items.length ? 'bg-starboard text-white' : 'bg-surface-2 text-muted'}`}>
          {done}/{list.items.length}
        </span>
      </div>
      <ul className="space-y-1">
        {list.items.map((item, i) => {
          const on = !!checks[`${id}:${i}`]
          return (
            <li key={i}>
              <button
                onClick={() => toggle(`${id}:${i}`)}
                className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left text-[15px] transition hover:bg-surface-2 ${on ? 'text-muted line-through decoration-line' : 'text-ink'}`}
              >
                {on ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-starboard" /> : <Circle size={20} className="mt-0.5 shrink-0 text-line" />}
                {item}
              </button>
            </li>
          )
        })}
      </ul>
      {done > 0 && (
        <Button variant="ghost" className="mt-2" onClick={() => reset(`${id}:`)}>
          <RotateCcw size={14} /> Reset
        </Button>
      )}
    </section>
  )
}

export function Checklists() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {CHECKLISTS.map((c) => (
        <Checklist key={c.id} id={c.id} />
      ))}
    </div>
  )
}
