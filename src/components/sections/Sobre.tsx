import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'

const CARDS = ['faco', 'trabalho', 'busco'] as const

export async function Sobre({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'sobre' })
  const { bio } = getPerfil()

  return (
    <Section id="sobre" titleId="sobre-title" title={t('title')}>
      <p className="text-muted max-w-2xl text-xl">{bio[locale]}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {CARDS.map((key) => (
          <li key={key}>
            <Card className="h-full p-6">
              <h3 className="font-heading text-xl">
                {t(`cards.${key}.title`)}
              </h3>
              <p className="text-muted mt-2 text-base">
                {t(`cards.${key}.body`)}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  )
}
