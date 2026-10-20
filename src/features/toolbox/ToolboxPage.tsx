import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Anchor, ClipboardCheck, Flag, Waves, Spline } from 'lucide-react'
import { PageHeader } from '../../components/ui/blocks'
import { Anatomy } from '../../tools/Anatomy'
import { KnotViewer } from '../../tools/knots/KnotViewer'
import { BeaufortScale } from '../../tools/Beaufort'
import { Checklists } from '../../tools/Checklists'
import { FlagSignals } from '../../content/diagrams/FlagSignals'
import { NotFound } from '../../app/NotFound'

const TOOLS: { id: string; title: string; blurb: string; icon: typeof Anchor; Component: ComponentType }[] = [
  { id: 'anatomy', title: 'Boat anatomy', blurb: 'Tap any part of a keelboat or sail to learn its name. Then test yourself.', icon: Anchor, Component: Anatomy },
  { id: 'knots', title: 'Knots', blurb: 'Seven essential knots, animated step by step.', icon: Spline, Component: KnotViewer },
  { id: 'beaufort', title: 'Beaufort scale', blurb: 'What each wind force looks like, and what it means on a keelboat.', icon: Waves, Component: BeaufortScale },
  { id: 'flags', title: 'Race signal flags', blurb: 'The flags and sounds the race committee uses.', icon: Flag, Component: FlagSignals },
  { id: 'checklists', title: 'Checklists', blurb: 'Before you leave home, before casting off, and packing up.', icon: ClipboardCheck, Component: Checklists },
]

export function ToolboxPage() {
  return (
    <>
      <PageHeader eyebrow="Toolbox" title="Quick reference">
        The things you’ll want to look up again and again — on the couch or on the dock.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ id, title, blurb, icon: Icon }) => (
          <Link key={id} to={`/toolbox/${id}`} className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sea-soft text-sea">
              <Icon size={22} />
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-sea">{title}</h3>
            <p className="mt-1 text-sm text-muted">{blurb}</p>
          </Link>
        ))}
      </div>
    </>
  )
}

export function ToolPage() {
  const { toolId } = useParams()
  const tool = TOOLS.find((t) => t.id === toolId)
  if (!tool) return <NotFound />
  const { Component } = tool
  return (
    <>
      <Link to="/toolbox" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> Toolbox
      </Link>
      <h1 className="mb-4 text-3xl font-bold">{tool.title}</h1>
      <Component />
    </>
  )
}
