import { Briefcase, GraduationCap, Languages, MapPin } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { getAtividade, getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'
import { AtividadeCard } from './AtividadeCard'

const CARDS = ['faco', 'trabalho', 'busco'] as const

export async function Sobre({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'sobre' })
  const { intro, cidade, curiosidades, disponivel, links, idiomas, educacao } =
    getPerfil()
  const atividade = await getAtividade()
  const [antes, destaque, depois] = intro[locale]

  return (
    <Section id="sobre" titleId="sobre-title" title={t('title')}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, no optimization needed */}
        <img
          src="/icone.gif"
          alt={t('avatarAlt')}
          width={112}
          height={112}
          className="border-accent size-28 shrink-0 rounded-3xl border-2 bg-white"
        />
        <div className="max-w-2xl">
          <p className="text-xl leading-relaxed md:text-2xl">
            {antes}
            <span className="text-accent">{destaque}</span>
            {depois}
          </p>
          <ul className="text-muted mt-4 flex flex-wrap gap-x-5 gap-y-2 text-base">
            <li className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={18} className="text-accent" />
              {cidade}
            </li>
            <li className="inline-flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                size={18}
                className="text-accent"
              />
              {t('estudando')}
            </li>
            {disponivel && (
              <li className="inline-flex items-center gap-2">
                <Briefcase
                  aria-hidden="true"
                  size={18}
                  className="text-accent"
                />
                {t('disponivel')}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="p-6">
          <h3 className="font-heading text-xl">{t('foraDoCodigo')}</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {curiosidades.map((c) => (
              <li
                key={c.texto.pt}
                className="border-line bg-surface-raised inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base"
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.texto[locale]}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-6 p-6">
          <div>
            <h3 className="font-heading flex items-center gap-2 text-xl">
              <GraduationCap
                aria-hidden="true"
                size={20}
                className="text-accent"
              />
              {t('formacao')}
            </h3>
            <ol className="border-line mt-4 flex flex-col gap-4 border-l-2 pl-5">
              {educacao.map((e) => (
                <li key={e.curso.pt} className="relative">
                  <span
                    aria-hidden="true"
                    className={`border-accent absolute top-1.5 -left-[27px] size-3 rounded-full border-2 ${
                      e.status === 'cursando' ? 'bg-accent' : 'bg-surface'
                    }`}
                  />
                  <p>{e.curso[locale]}</p>
                  <p className="text-muted mt-1 flex flex-wrap items-center gap-2 text-sm">
                    {e.instituicao}
                    {e.status && (
                      <span className="bg-chip text-chip rounded-full px-3 py-0.5">
                        {t(`status.${e.status}`)}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>
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
        </Card>
      </div>

      <ul
        className={`mt-4 grid grid-cols-1 gap-4 ${atividade ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}
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
