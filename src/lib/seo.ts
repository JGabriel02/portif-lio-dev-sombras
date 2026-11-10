import type { Metadata } from 'next'
import { getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'

/**
 * Public origin, resolved in order: explicit NEXT_PUBLIC_SITE_URL, the Vercel
 * production domain, the Vercel deployment URL, then localhost (dev only).
 */
export function resolveSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim()
  const prod = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const deploy = env.VERCEL_URL?.trim()
  const raw = explicit
    ? explicit
    : prod
      ? `https://${prod}`
      : deploy
        ? `https://${deploy}`
        : 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export const SITE_URL = resolveSiteUrl()

const OG_LOCALE: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' }

export function buildMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: Locale
  path: string
  title?: string
  description?: string
}): Metadata {
  const url = `${SITE_URL}/${locale}${path}`
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        pt: `${SITE_URL}/pt${path}`,
        en: `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/pt${path}`,
      },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      locale: OG_LOCALE[locale],
      images: [{ url: `/${locale}/opengraph-image`, width: 1200, height: 630 }],
    },
  }
}

export function personJsonLd(locale: Locale): object {
  const perfil = getPerfil()
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: perfil.nome,
    jobTitle: perfil.cargo[locale],
    url: `${SITE_URL}/${locale}`,
    sameAs: [perfil.links.github, perfil.links.linkedin],
  }
}
