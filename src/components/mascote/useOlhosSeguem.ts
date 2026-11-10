'use client'

import { useEffect, useMemo, useState, type RefObject } from 'react'
import { pupilOffset, type Offset, type Point } from './eyeMath'

export function useOlhosSeguem(
  svgRef: RefObject<SVGSVGElement | null>,
  eyes: Point[],
  viewBox: { w: number; h: number },
): Offset[] {
  const zeros = (): Offset[] => eyes.map(() => ({ dx: 0, dy: 0 }))
  const [offsets, setOffsets] = useState<Offset[]>(zeros)
  const eyesKey = JSON.stringify(eyes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableEyes = useMemo(() => eyes, [eyesKey])
  const { w, h } = viewBox

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let frame = 0
    let pending: Point | null = null
    const reset = () => {
      pending = null
      cancelAnimationFrame(frame)
      frame = 0
      setOffsets(stableEyes.map(() => ({ dx: 0, dy: 0 })))
    }
    const flush = () => {
      frame = 0
      const svg = svgRef.current
      const p = pending
      if (!svg || !p) return
      const rect = svg.getBoundingClientRect()
      const sx = rect.width / w
      const sy = rect.height / h
      setOffsets(
        stableEyes.map((e) =>
          pupilOffset({ x: rect.left + e.x * sx, y: rect.top + e.y * sy }, p),
        ),
      )
    }
    const onMove = (ev: PointerEvent) => {
      pending = { x: ev.clientX, y: ev.clientY }
      if (!frame) frame = requestAnimationFrame(flush)
    }

    const onOut = (ev: PointerEvent) => {
      // Pointer left the window: no element receives it.
      if (ev.relatedTarget === null) reset()
    }
    const onTouchEnd = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') reset()
    }

    const root = document.documentElement
    window.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', reset)
    window.addEventListener('pointerout', onOut)
    window.addEventListener('blur', reset)
    window.addEventListener('pointerup', onTouchEnd)
    window.addEventListener('pointercancel', onTouchEnd)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', reset)
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', reset)
      window.removeEventListener('pointerup', onTouchEnd)
      window.removeEventListener('pointercancel', onTouchEnd)
    }
  }, [svgRef, stableEyes, w, h])

  return offsets
}
