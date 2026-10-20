import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'

interface ProgressState {
  /** lessonId → completion timestamp */
  completed: Record<string, number>
  last?: { courseId: string; slug: string }
  checks: Record<string, boolean>
  theme: Theme
  toggleComplete: (lessonId: string) => void
  setLast: (courseId: string, slug: string) => void
  toggleCheck: (id: string) => void
  resetChecks: (prefix: string) => void
  setTheme: (t: Theme) => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},
      checks: {},
      theme: 'system',
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
    }),
    { name: 't-sailor-progress' },
  ),
)
