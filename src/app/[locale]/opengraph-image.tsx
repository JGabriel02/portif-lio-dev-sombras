import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getPerfil } from '@/content'
import { routing, type Locale } from '@/i18n/routing'
import { sombra } from '@/themes/palette'

export const alt = 'João Gabriel'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BODY =
  'M110 22 L122 52 L150 18 L148 58 L186 40 L166 78 L200 82 L170 104 L196 128 L162 126 L176 170 L146 146 L138 186 L118 156 L104 190 L94 154 L72 182 L70 144 L38 166 L52 126 L18 128 L46 104 L16 82 L52 78 L32 40 L70 58 L68 18 L96 50 Z'

function font(file: string): Promise<Buffer> {
  return readFile(fileURLToPath(new URL(`./_og/${file}`, import.meta.url)))
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const loc: Locale = locale === 'en' ? 'en' : 'pt'
  const perfil = getPerfil()
  const c = sombra.dark
  const [heading, body] = await Promise.all([
    font('SpaceGrotesk-500.woff'),
    font('Inter-400.woff'),
  ])

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 96px',
        background: c.bg,
        color: c.text,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            fontFamily: 'Space Grotesk',
            fontSize: 80,
            lineHeight: 1.05,
          }}
        >
          {perfil.nome}
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 40,
            color: c.accent,
          }}
        >
          {perfil.cargo[loc]}
        </div>
      </div>
      <svg width="360" height="327" viewBox="0 0 220 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor={c['mascote-body']} />
            <stop offset="1" stopColor={c['mascote-tip']} />
          </linearGradient>
        </defs>
        <path d={BODY} fill="url(#g)" />
        <path d="M70 92 L102 104 L76 118 Z" fill={c.eye} />
        <path d="M150 92 L118 104 L144 118 Z" fill={c.eye} />
        <circle cx="86" cy="106" r="4" fill={c.bg} />
        <circle cx="134" cy="106" r="4" fill={c.bg} />
        <path
          d="M92 132 Q114 146 134 128"
          fill="none"
          stroke={c.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Space Grotesk', data: heading, weight: 500, style: 'normal' },
        { name: 'Inter', data: body, weight: 400, style: 'normal' },
      ],
    },
  )
}
