import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { getProjeto, getProjetos } from '@/content'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const projetos = await getProjetos()
  return routing.locales.flatMap((locale) =>
    projetos.map((p) => ({ locale, slug: p.slug })),
  )
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projetos/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const projeto = await getProjeto(slug)
  if (!projeto || !routing.locales.includes(locale as Locale)) return {}
  return buildMetadata({
    locale: locale as Locale,
    path: `/projetos/${slug}`,
    title: projeto.nome,
    description: projeto.resumo[locale as Locale],
  })
}

export default async function ProjetoPage({
  params,
}: PageProps<'/[locale]/projetos/[slug]'>) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const loc = locale as Locale
  const projeto = await getProjeto(slug)
  if (!projeto) notFound()
  const t = await getTranslations({ locale: loc, namespace: 'projetos' })

  return (
    <main id="conteudo" className="py-16 md:py-24">
      <Container className="flex max-w-[800px] flex-col gap-8">
        <Link
          href="/"
          locale={loc}
          className="text-muted hover:text-text text-base"
        >
          ← {t('back')}
        </Link>
        <h1 className="font-heading text-4xl md:text-6xl">{projeto.nome}</h1>
        <p className="text-muted text-lg">{projeto.descricao[loc]}</p>
        <div className="flex flex-wrap gap-3">
          <Button href={projeto.repoUrl} target="_blank" rel="noreferrer">
            {t('repo')}
          </Button>
          {projeto.demoUrl && (
            <Button
              variant="secondary"
              href={projeto.demoUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('demo')}
            </Button>
          )}
        </div>
        <section aria-labelledby="stack-title">
          <h2 id="stack-title" className="font-heading text-xl">
            {t('stack')}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {projeto.stack.map((s) => (
              <li key={s}>
                <Chip>{s}</Chip>
              </li>
            ))}
          </ul>
        </section>
        {projeto.imagens.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {projeto.imagens.map((img) => (
              <Image
                key={img.src}
                src={img.src}
                alt={img.alt[loc]}
                width={800}
                height={450}
                className="border-line rounded-card border"
              />
            ))}
          </div>
        )}
        <section aria-labelledby="learned-title">
          <h2 id="learned-title" className="font-heading text-xl">
            {t('learned')}
          </h2>
          <p className="text-muted mt-3 text-base">
            {projeto.aprendizados[loc]}
          </p>
        </section>
      </Container>
    </main>
  )
}
