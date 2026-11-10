import { setRequestLocale } from 'next-intl/server'
import { Hero } from '@/components/sections/Hero'
import { Projetos } from '@/components/sections/Projetos'
import { Skills } from '@/components/sections/Skills'
import { Sobre } from '@/components/sections/Sobre'
import type { Locale } from '@/i18n/routing'

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = locale as Locale

  return (
    <main id="conteudo">
      <Hero locale={loc} />
      <Sobre locale={loc} />
      <Skills locale={loc} />
      <Projetos locale={loc} />
    </main>
  )
}
