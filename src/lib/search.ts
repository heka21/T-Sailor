import { COURSES, LESSONS, courseById } from '../content/courses'
import { SIMS } from '../sims/registry'
import { TOOLS } from '../features/toolbox/ToolboxPage'
import { KNOTS } from '../tools/knots/data'
import { CHECKLISTS } from '../tools/Checklists'
import { slugify } from './slug'

export type Kind = 'page' | 'course' | 'lesson' | 'section' | 'sim' | 'tool' | 'knot' | 'checklist'

export interface Entry {
  kind: Kind
  title: string
  subtitle?: string
  text: string
  to: string
}

interface Indexed extends Entry {
  titleLc: string
  hay: string
}

export interface Hit extends Entry {
  /** a short excerpt of `text` around the first match, when the match isn't just the title */
  snippet?: string
}

const KIND_WEIGHT: Record<Kind, number> = { page: 4, course: 4, tool: 3, sim: 3, lesson: 3, knot: 2, checklist: 1, section: 0 }

/** Lower-cased with apostrophes dropped, so "wont" finds "won’t" and "cats paws" finds "cats’ paws". */
const norm = (s: string) => s.toLowerCase().replace(/['’‘]/g, '')

/** Lesson source → readable text: drops the meta export, JSX tags/props and markdown punctuation. */
function plain(mdx: string) {
  return mdx
    .replace(/^export const meta = \{[\s\S]*?\n\}\s*$/m, '')
    .replace(/\[\s*'([^']*)',\s*'([^']*)'\s*\],?/g, '$1 — $2 ') // KeyTerms rows
    .replace(/<\/?[A-Za-z][\w.]*|\/?>/g, ' ')
    .replace(/\w+="([^"]*)"/g, '$1')
    .replace(/\w+=\{\[?|\]?\}/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>|]/g, '')
    .replace(/^\s*(?:[-+]|\d+\.)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const lessonEntry = (l: (typeof LESSONS)[number], intro = ''): Entry => ({
  kind: 'lesson',
  title: l.meta.title,
  subtitle: courseById(l.courseId)?.title,
  text: `${l.meta.summary} ${intro}`.trim(),
  to: `/courses/${l.courseId}/${l.slug}`,
})

function staticEntries(admin: boolean): Entry[] {
  const pages: Entry[] = [
    { kind: 'page', title: 'Home', text: 'Continue where you left off, wind now', to: '/' },
    { kind: 'page', title: 'Courses', text: 'Your keelboat pathway, all courses', to: '/courses' },
    { kind: 'page', title: 'Sim Lab', text: 'Interactive simulators', to: '/lab' },
    { kind: 'page', title: 'Toolbox', text: 'Anatomy, knots, Beaufort scale, flags, checklists', to: '/toolbox' },
    { kind: 'page', title: 'Weather', text: 'Live wind forecast Matilda Bay', to: '/weather' },
    { kind: 'page', title: 'Profile', text: 'Your progress, theme, change password, sign out', to: '/profile' },
    ...(admin ? [{ kind: 'page' as const, title: 'Admin', text: 'Manage users, add user, reset password', to: '/admin' }] : []),
  ]
  return [
    ...pages,
    ...COURSES.map((c) => ({ kind: 'course' as const, title: c.title, subtitle: c.tagline, text: `${c.description} ${c.outcomes.join('. ')}`, to: `/courses/${c.id}` })),
    ...SIMS.map((s) => ({ kind: 'sim' as const, title: s.title, subtitle: 'Sim Lab', text: s.blurb, to: `/lab/${s.id}` })),
    ...TOOLS.map((t) => ({ kind: 'tool' as const, title: t.title, subtitle: 'Toolbox', text: t.blurb, to: `/toolbox/${t.id}` })),
    ...KNOTS.map((k) => ({ kind: 'knot' as const, title: k.name, subtitle: 'Knots', text: k.use, to: `/toolbox/knots?knot=${k.id}` })),
    ...CHECKLISTS.map((c) => ({
      kind: 'checklist' as const,
      title: c.title,
      subtitle: 'Checklists',
      text: `${c.blurb} ${c.items.join('. ')}`,
      to: `/toolbox/checklists#checklist-${c.id}`,
    })),
  ]
}

/** Every lesson with its intro text, plus one entry per "## heading" linking straight to that heading. */
async function lessonEntries(): Promise<Entry[]> {
  const sources = import.meta.glob<string>('../content/*/*.mdx', { query: '?raw', import: 'default' })
  const files = await Promise.all(Object.entries(sources).map(async ([path, load]) => [path, await load()] as const))
  return files.flatMap(([path, src]) => {
    const [, courseId, slug] = path.match(/\/([^/]+)\/\d+-(.+)\.mdx$/)!
    const lesson = LESSONS.find((l) => l.courseId === courseId && l.slug === slug)
    if (!lesson) return []
    const [intro, ...parts] = src.split(/^## /m)
    const base = `/courses/${courseId}/${slug}`
    const where = `${lesson.meta.title} · ${courseById(courseId)?.short ?? ''}`
    return [
      lessonEntry(lesson, plain(intro)),
      ...parts.map((part) => {
        const [heading, ...body] = part.split('\n')
        const title = plain(heading)
        return { kind: 'section' as const, title, subtitle: where, text: plain(body.join('\n')), to: `${base}#${slugify(title)}` }
      }),
    ]
  })
}

const prep = (e: Entry): Indexed => ({ ...e, titleLc: norm(e.title), hay: norm(`${e.title} ${e.subtitle ?? ''} ${e.text}`) })

let cache: { admin: boolean; index: Promise<Indexed[]> } | undefined

export function loadIndex(admin: boolean): Promise<Indexed[]> {
  if (cache?.admin !== admin) {
    cache = {
      admin,
      // If lesson text can't load, still search lesson titles and summaries.
      index: lessonEntries()
        .catch(() => LESSONS.map((l) => lessonEntry(l)))
        .then((lessons) => [...staticEntries(admin), ...lessons].map(prep)),
    }
  }
  return cache.index
}

export const queryWords = (q: string) => norm(q).split(/\s+/).filter(Boolean)

function snippet(text: string, words: string[]) {
  // Search the normalised text, but cut the excerpt from the original (norm drops characters, so map positions back).
  const pos: number[] = []
  let lc = ''
  for (let i = 0; i < text.length; i++) {
    const c = norm(text[i])
    if (c) (lc += c), pos.push(i)
  }
  const found = Math.min(...words.map((w) => lc.indexOf(w)).filter((i) => i >= 0))
  if (!Number.isFinite(found)) return undefined
  const at = pos[found]
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - 50)) + 1)
  const end = Math.min(text.length, at + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

export function search(index: Indexed[], q: string, limit = 12): Hit[] {
  const words = queryWords(q)
  if (!words.length) return []
  const phrase = words.join(' ')
  return index
    .filter((e) => words.every((w) => e.hay.includes(w)))
    .map((e) => {
      const inTitle = words.filter((w) => e.titleLc.includes(w)).length
      const score =
        inTitle * 3 +
        (inTitle === words.length ? 6 : 0) +
        (e.titleLc.startsWith(phrase) ? 5 : 0) +
        (e.hay.includes(phrase) ? 2 : 0) +
        KIND_WEIGHT[e.kind]
      return { e, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ e }) => {
      const { titleLc: _t, hay: _h, ...hit } = e
      const allInTitle = words.every((w) => e.titleLc.includes(w))
      return { ...hit, snippet: allInTitle ? undefined : snippet(e.text, words) }
    })
}
