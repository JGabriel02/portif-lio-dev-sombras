'use client'

import { useRef } from 'react'
import { MASCOTE_PUPILS, MASCOTE_VIEWBOX, MascoteSvg } from './MascoteSvg'
import { useOlhosSeguem } from './useOlhosSeguem'

export function Mascote({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const pupils = useOlhosSeguem(ref, MASCOTE_PUPILS, MASCOTE_VIEWBOX)
  return <MascoteSvg svgRef={ref} pupils={pupils} className={className} />
}
