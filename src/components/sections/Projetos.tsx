import { getTranslations } from 'next-intl/server'
import { CardFantasma } from '@/components/projetos/CardFantasma'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { getPerfil, getProjetos } from '@/content'
import type { Locale } from '@/i18n/routing'

export async function Projetos({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'projetos' })
  const projetos = await getProjetos()
  const destaque = projetos.find((p) => p.destaque)

  return (
    <Section id="projetos" titleId="projetos-title" title={t('title')}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projetos.map((p) => (
          <CardFantasma
            key={p.slug}
            projeto={p}
            locale={locale}
            featured={p.slug === destaque?.slug}
          />
        ))}
      </div>
      <div className="mt-8">
        <Button
          variant="secondary"
          href={getPerfil().links.github}
          target="_blank"
          rel="noreferrer"
        >
          {t('viewAll')}
        </Button>
      </div>
    </Section>
  )
}
