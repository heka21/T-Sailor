import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import type { Vec } from '../../lib/sailing'

/** Convert a pointer event to the SVG's own user coordinates. */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Vec {
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

/**
 * Pointer-drag helper. Returns handlers to spread on the element that starts the drag.
 * `onMove` receives the pointer position in SVG coordinates.
 */
export function useSvgDrag(svgRef: RefObject<SVGSVGElement | null>, onMove: (p: Vec) => void, onEnd?: () => void) {
  const active = useRef(false)
  const move = useCallback(
    (e: ReactPointerEvent) => {
      if (!active.current || !svgRef.current) return
      onMove(svgPoint(svgRef.current, e.clientX, e.clientY))
    },
    [onMove, svgRef],
  )
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      active.current = true
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      if (svgRef.current) onMove(svgPoint(svgRef.current, e.clientX, e.clientY))
      e.preventDefault()
    },
    onPointerMove: move,
    onPointerUp: (e: ReactPointerEvent) => {
      active.current = false
      ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
      onEnd?.()
    },
    onPointerCancel: () => {
      active.current = false
    },
  }
}
