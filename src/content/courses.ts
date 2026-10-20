import type { ComponentType } from 'react'
import type { MDXProps } from 'mdx/types'

export interface CourseMeta {
  id: string
  title: string
  short: string
  tagline: string
  description: string
  color: string
  outcomes: string[]
}

export interface LessonMeta {
  title: string
  summary: string
  minutes: number
}

export interface Lesson {
  id: string
  courseId: string
  slug: string
  order: number
  meta: LessonMeta
  Component: ComponentType<MDXProps>
}

export const COURSES: CourseMeta[] = [
  {
    id: 'start-crewing',
    title: 'Start Crewing',
    short: 'Crewing',
    tagline: 'Your first steps aboard a keelboat',
    description:
      'Learn the language of the boat, how to stay safe, and how to be a useful crew: handling sheets and winches, tying the essential knots, and working through tacks and gybes.',
    color: '#0e8f9b',
    outcomes: ['Name the parts of a keelboat', 'Trim a headsail', 'Use winches & cleats safely', 'Tie six key knots', 'Crew through tacks and gybes'],
  },
  {
    id: 'start-helming',
    title: 'Start Helming',
    short: 'Helming',
    tagline: 'Take the tiller and steer with confidence',
    description:
      'Steer upwind and downwind, feel the wind, read the telltales, and lead the crew through tacks and gybes. Plus heaving-to and coming alongside.',
    color: '#2f7de1',
    outcomes: ['Steer by the telltales', 'Sail upwind and downwind', 'Helm tacks and gybes', 'Heave-to', 'Return to the mooring'],
  },
  {
    id: 'start-skippering',
    title: 'Start Skippering',
    short: 'Skippering',
    tagline: 'In charge of the boat and the crew',
    description:
      'Brief and lead a crew, plan a sail on the Swan River, read the weather (hello Fremantle Doctor), reef, recover a man overboard, anchor, and apply the rules of the road.',
    color: '#7c5cff',
    outcomes: ['Brief and manage crew', 'Plan for weather & the river', 'Reef the main', 'Recover a man overboard', 'Anchor and moor'],
  },
  {
    id: 'spinnakers',
    title: 'Spinnakers',
    short: 'Spinnakers',
    tagline: 'Fly the big colourful one',
    description:
      'The gear, roles and techniques to hoist, trim, gybe and drop a symmetric spinnaker — and what to do when it all goes sideways (the broach).',
    color: '#f26b1d',
    outcomes: ['Rig the spinnaker', 'Hoist and trim', 'Gybe the pole', 'Drop cleanly', 'Recover from a broach'],
  },
  {
    id: 'start-racing',
    title: 'Start Racing',
    short: 'Racing',
    tagline: 'From the start gun to the finish line',
    description:
      'Courses and marks, the start sequence and flags, getting a good start, the key right-of-way rules, rounding marks, taking penalties, and using wind shifts.',
    color: '#d6336c',
    outcomes: ['Read a course & sailing instructions', 'Run a start sequence', 'Apply rules 10–18', 'Round marks', 'Tack on the shifts'],
  },
]

export const courseById = (id: string) => COURSES.find((c) => c.id === id)

const modules = import.meta.glob<{ default: ComponentType<MDXProps>; meta: LessonMeta }>('./*/*.mdx', { eager: true })

export const LESSONS: Lesson[] = Object.entries(modules)
  .map(([path, mod]) => {
    const [, courseId, num, slug] = path.match(/^\.\/([^/]+)\/(\d+)-(.+)\.mdx$/)!
    return { id: `${courseId}/${slug}`, courseId, slug, order: Number(num), meta: mod.meta, Component: mod.default }
  })
  .sort((a, b) => a.order - b.order)

export const lessonsFor = (courseId: string) => LESSONS.filter((l) => l.courseId === courseId)
export const lessonBy = (courseId: string, slug: string) => LESSONS.find((l) => l.courseId === courseId && l.slug === slug)
