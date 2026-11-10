import { Code, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import type { Projeto } from '@/content'
import type { Locale } from '@/i18n/routing'
import { relativeTime } from '@/lib/relativeTime'
import { Materializar } from './Materializar'

const iconLink =
  'text-muted hover:text-text relative z-10 inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-focus-ring'

export function CardFantasma({
  projeto,
  locale,
  featured = false,
}: {
  projeto: Projeto
  locale: Locale
  featured?: boolean
}) {
  const t = useTranslations('projetos')

  return (
    <Materializar className={featured ? 'md:col-span-2' : ''}>
      <Card
        as="article"
        className="hover:bg-surface-raised focus-within:bg-surface-raised relative flex h-full flex-col gap-3 overflow-hidden p-6 pb-9 transition-colors"
      >
        {featured && (
          <Chip tone="accent" className="self-start">
            {t('featured')}
          </Chip>
        )}
        <h3 className="font-heading text-xl">
          <Link
            href={`/projetos/${projeto.slug}`}
            locale={locale}
            className="focus-visible:outline-focus-ring after:absolute after:inset-0 after:content-[''] focus-visible:outline-2"
          >
            {projeto.nome}
          </Link>
        </h3>
        <p className="text-muted truncate text-base">
          {projeto.resumo[locale]}
        </p>
        <div className="text-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{ backgroundColor: projeto.linguagem.cor }}
            />
            {projeto.linguagem.nome}
          </span>
          <span>{`★ ${projeto.estrelas}`}</span>
          <span>
            {t('updated', {
              when: relativeTime(projeto.atualizadoEm, locale),
            })}
          </span>
          <span className="ml-auto inline-flex">
            <a
              href={projeto.repoUrl}
              aria-label={t('repo')}
              className={iconLink}
              target="_blank"
              rel="noreferrer"
            >
              <Code aria-hidden="true" size={20} />
            </a>
            {projeto.demoUrl && (
              <a
                href={projeto.demoUrl}
                aria-label={t('demo')}
                className={iconLink}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden="true" size={20} />
              </a>
            )}
          </span>
        </div>
        <svg
          aria-hidden="true"
          focusable="false"
          className="absolute inset-x-0 bottom-0 h-3 w-full"
          viewBox="0 0 120 12"
          preserveAspectRatio="none"
        >
          <path
            d="M0 6 Q10 0 20 6 T40 6 T60 6 T80 6 T100 6 T120 6 V12 H0 Z"
            fill="var(--surface-raised)"
            stroke="var(--line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Card>
    </Materializar>
  )
}
