import { create } from 'zustand'

export type Theme = 'system' | 'light' | 'dark'

/** The per-user state saved on the server (see session.ts). */
export interface ProgressData {
  /** lessonId → completion timestamp */
  completed: Record<string, number>
  last?: { courseId: string; slug: string }
  checks: Record<string, boolean>
  theme: Theme
}

interface ProgressState extends ProgressData {
  toggleComplete: (lessonId: string) => void
  setLast: (courseId: string, slug: string) => void
  toggleCheck: (id: string) => void
  resetChecks: (prefix: string) => void
  setTheme: (t: Theme) => void
}

export const EMPTY_PROGRESS: ProgressData = { completed: {}, last: undefined, checks: {}, theme: 'system' }

export const pickProgress = ({ completed, last, checks, theme }: ProgressData): ProgressData => ({ completed, last, checks, theme })

export const useProgress = create<ProgressState>()((set) => ({
  ...EMPTY_PROGRESS,
  toggleComplete: (id) =>
    set((s) => {
      const completed = { ...s.completed }
      if (completed[id]) delete completed[id]
      else completed[id] = Date.now()
      return { completed }
    }),
  setLast: (courseId, slug) => set({ last: { courseId, slug } }),
  toggleCheck: (id) => set((s) => ({ checks: { ...s.checks, [id]: !s.checks[id] } })),
  resetChecks: (prefix) =>
    set((s) => ({
      checks: Object.fromEntries(Object.entries(s.checks).filter(([k]) => !k.startsWith(prefix))),
    })),
  setTheme: (theme) => set({ theme }),
}))
