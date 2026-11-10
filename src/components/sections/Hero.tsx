import { getTranslations } from 'next-intl/server'
import { Mascote } from '@/components/mascote/Mascote'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { cvDisponivel, getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'hero' })
  const perfil = getPerfil()
  const cv = cvDisponivel(locale)

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="scroll-mt-16 py-16 md:py-24"
    >
      <Container className="flex flex-col items-center gap-12 md:flex-row md:justify-between">
        <div className="flex flex-col items-start gap-6 md:max-w-xl">
          {perfil.disponivel && <Chip tone="accent">{t('status')}</Chip>}
          <p className="text-muted text-xl">{t('greeting')}</p>
          <h1
            id="hero-title"
            className="font-heading text-[40px] leading-tight md:text-[56px]"
          >
            {t('tagline')} <span className="text-accent">{t('highlight')}</span>
          </h1>
          <p className="text-muted text-xl">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Button href="#projetos">{t('ctaProjects')}</Button>
            {cv && (
              <Button href={cv} variant="secondary" download>
                {t('ctaCv')}
              </Button>
            )}
          </div>
        </div>
        <Mascote className="w-48 shrink-0 md:w-80" />
      </Container>
    </section>
  )
}
