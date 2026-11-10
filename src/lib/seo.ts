import type { Metadata } from 'next'
import { getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

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
