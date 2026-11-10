import { useId, type Ref } from 'react'
import type { Offset } from './eyeMath'

export const MASCOTE_VIEWBOX = { w: 220, h: 200 }
export const MASCOTE_PUPILS: { x: number; y: number }[] = [
  { x: 86, y: 106 },
  { x: 134, y: 106 },
]

const BODY =
  'M110 22 L122 52 L150 18 L148 58 L186 40 L166 78 L200 82 L170 104 L196 128 L162 126 L176 170 L146 146 L138 186 L118 156 L104 190 L94 154 L72 182 L70 144 L38 166 L52 126 L18 128 L46 104 L16 82 L52 78 L32 40 L70 58 L68 18 L96 50 Z'

export function MascoteSvg({
  pupils,
  svgRef,
  className,
}: {
  pupils: Offset[]
  svgRef?: Ref<SVGSVGElement>
  className?: string
}) {
  const gid = `mascote-${useId().replace(/:/g, '')}`
  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="0 0 220 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" style={{ stopColor: 'var(--mascote-body)' }} />
          <stop
            offset="0.8"
            style={{
              stopColor:
                'color-mix(in srgb, var(--mascote-body) 50%, var(--mascote-tip))',
            }}
          />
          <stop offset="1" style={{ stopColor: 'var(--mascote-tip)' }} />
        </linearGradient>
      </defs>
      <g className="animate-flutuar">
        <path d={BODY} fill={`url(#${gid})`} />
        <path d="M70 92 L102 104 L76 118 Z" fill="var(--eye)" />
        <path d="M150 92 L118 104 L144 118 Z" fill="var(--eye)" />
        {MASCOTE_PUPILS.map((p, i) => (
          <circle
            key={i}
            cx={p.x + (pupils[i]?.dx ?? 0)}
            cy={p.y + (pupils[i]?.dy ?? 0)}
            r="4"
            fill="var(--bg)"
          />
        ))}
        <path
          d="M92 132 Q114 146 134 128"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
