import { GraduationCap, Languages } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { getAtividade, getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'
import { AtividadeCard } from './AtividadeCard'

const CARDS = ['faco', 'trabalho', 'busco'] as const

export async function Sobre({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'sobre' })
  const { bio, links, idiomas, educacao } = getPerfil()
  const atividade = await getAtividade()

  return (
    <Section id="sobre" titleId="sobre-title" title={t('title')}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="text-muted flex max-w-2xl flex-col gap-4 text-lg leading-relaxed">
          {bio[locale].map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
          ))}
        </div>
        <Card className="flex flex-col gap-6 self-start p-6">
          <div>
            <h3 className="font-heading flex items-center gap-2 text-xl">
              <Languages aria-hidden="true" size={20} className="text-accent" />
              {t('idiomas')}
            </h3>
            <dl className="mt-3 flex flex-col gap-2">
              {idiomas.map((i) => (
                <div
                  key={i.idioma.pt}
                  className="flex items-center justify-between gap-3"
                >
                  <dt>{i.idioma[locale]}</dt>
                  <dd className="bg-chip text-chip rounded-full px-3 py-0.5 text-sm">
                    {i.nivel[locale]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="font-heading flex items-center gap-2 text-xl">
              <GraduationCap
                aria-hidden="true"
                size={20}
                className="text-accent"
              />
              {t('educacao')}
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {educacao.map((e) => (
                <li key={e.curso.pt}>
                  <p className="flex flex-wrap items-center gap-2">
                    {e.curso[locale]}
                    {e.emAndamento && (
                      <span className="bg-chip text-chip rounded-full px-3 py-0.5 text-sm">
                        {t('emAndamento')}
                      </span>
                    )}
                  </p>
                  {e.instituicao && (
                    <p className="text-muted text-sm">{e.instituicao}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
      <ul
        className={`mt-8 grid gap-4 ${atividade ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}
      >
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
        {atividade && (
          <li>
            {await AtividadeCard({
              atividade,
              githubUrl: links.github,
              locale,
            })}
          </li>
        )}
      </ul>
    </Section>
  )
}
