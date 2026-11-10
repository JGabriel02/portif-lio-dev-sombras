import { setRequestLocale } from 'next-intl/server'
import { Contato } from '@/components/sections/Contato'
import { Hero } from '@/components/sections/Hero'
import { Projetos } from '@/components/sections/Projetos'
import { Skills } from '@/components/sections/Skills'
import { Sobre } from '@/components/sections/Sobre'
import type { Locale } from '@/i18n/routing'
import { personJsonLd } from '@/lib/seo'

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = locale as Locale

  return (
    <main id="conteudo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd(loc)).replace(/</g, '\\u003c'),
        }}
      />
      <Hero locale={loc} />
      <Sobre locale={loc} />
      <Skills locale={loc} />
      <Projetos locale={loc} />
      <Contato locale={loc} />
    </main>
  )
}
