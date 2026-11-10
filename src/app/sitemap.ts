import type { MetadataRoute } from 'next'
import { getProjetos } from '@/content'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ['', ...(await getProjetos()).map((p) => `/projetos/${p.slug}`)]
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  )
}
