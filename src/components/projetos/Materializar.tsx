'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Cards start faded (only when <html> has `.js` and motion is allowed, see
 * globals.css) and materialize once they reach the viewport, or on hover or
 * focus. A card that is already above the viewport (fast fling, anchor jump)
 * is revealed too, so no card can stay faded after the user scrolls past it.
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

    let frame = 0
    const revelar = () => {
      el.dataset.visivel = ''
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(frame)
      io?.disconnect()
    }
    const checar = () => {
      frame = 0
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) revelar()
    }
    const aoRolar = () => {
      if (!frame) frame = requestAnimationFrame(checar)
    }

    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) revelar()
            },
            { threshold: 0.15 },
          )
    io?.observe(el)
    window.addEventListener('scroll', aoRolar, { passive: true })
    checar()

    return () => {
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(frame)
      io?.disconnect()
    }
  }, [])

  return (
    <div ref={ref} data-materializar="" className={className}>
      {children}
    </div>
  )
}
