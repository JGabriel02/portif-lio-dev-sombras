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

    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
    }
  }, [svgRef, stableEyes, w, h])

  return offsets
}
