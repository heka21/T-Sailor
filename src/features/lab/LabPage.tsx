import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { SIMS, simById } from '../../sims/registry'
import { courseById } from '../../content/courses'
import { PageHeader } from '../../components/ui/blocks'
import { NotFound } from '../../app/NotFound'

export function SimCard({ id }: { id: string }) {
  const s = simById(id)!
  return (
    <Link
      to={`/lab/${s.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[5/3] overflow-hidden">{s.thumb}</div>
      <div className="p-4">
        <h3 className="font-display font-semibold group-hover:text-sea">{s.title}</h3>
        <p className="mt-1 text-sm leading-snug text-muted">{s.blurb}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {s.courses.map((c) => (
            <span key={c} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
              {courseById(c)?.short}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function LabPage() {
  return (
    <>
      <PageHeader eyebrow="Sim Lab" title="Learn by doing">
        Interactive simulators for the ideas that are hard to picture from a book. Drag, steer, trim and play.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIMS.map((s) => (
          <SimCard key={s.id} id={s.id} />
        ))}
      </div>
    </>
  )
}

export function SimPage() {
  const { simId } = useParams()
  const sim = simById(simId ?? '')
  if (!sim) return <NotFound />
  const { Component } = sim
  return (
    <>
      <Link to="/lab" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> Sim Lab
      </Link>
      <Component />
    </>
  )
}
