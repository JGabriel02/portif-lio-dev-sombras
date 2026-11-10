'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Cards start faded (only when <html> has `.js` and motion is allowed, see
 * globals.css) and materialize on viewport entry, hover or focus.
 */
export function Materializar({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.visivel = ''
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.visivel = ''
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} data-materializar="" className={className}>
      {children}
    </div>
  )
}
