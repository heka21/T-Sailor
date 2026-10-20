import { useCallback, useEffect, useRef } from 'react'

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Runs `frame(t)` with eased t from 0 → 1 over `ms`. Calling again cancels the previous run. */
export function useTween() {
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return useCallback((ms: number, frame: (t: number) => void, done?: () => void) => {
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      frame(ease(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else done?.()
    }
    raf.current = requestAnimationFrame(tick)
  }, [])
}
