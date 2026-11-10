import { getLocale, getTranslations } from 'next-intl/server'
import { MascoteSvg } from '@/components/mascote/MascoteSvg'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

export default async function NotFound() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'notFound' })

  return (
    <main
      id="conteudo"
      className="relative flex flex-1 items-center overflow-hidden py-24"
    >
      <Container className="relative">
        <h1 className="font-heading text-4xl md:text-6xl">{t('title')}</h1>
        <p className="text-muted mt-4 text-lg">{t('body')}</p>
        <Button className="mt-8" href={`/${locale}`}>
          {t('back')}
        </Button>
      </Container>
      <MascoteSvg
        pupils={[
          { dx: 3, dy: 0 },
          { dx: 3, dy: 0 },
        ]}
        className="pointer-events-none absolute top-1/2 -right-16 w-48 -translate-y-1/2 -rotate-12 md:w-72"
      />
    </main>
  )
}
