import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Section } from '@/components/ui/Section'
import { getSkills, type SkillCategoria } from '@/content'
import type { Locale } from '@/i18n/routing'

const GRUPOS: SkillCategoria[] = ['frontend', 'backend', 'tools']

export async function Skills({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'skills' })
  const porGrupo = await Promise.all(GRUPOS.map((g) => getSkills(g)))

  return (
    <Section id="skills" titleId="skills-title" title={t('title')}>
      <div className="grid gap-4 md:grid-cols-3">
        {GRUPOS.map((grupo, i) => (
          <Card
            key={grupo}
            as="section"
            aria-labelledby={`skills-${grupo}`}
            className="p-6"
          >
            <h3 id={`skills-${grupo}`} className="font-heading text-xl">
              {t(grupo)}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {porGrupo[i].map((s) => (
                <li
                  key={s.nome}
                  data-aprendendo={s.aprendendo ? '' : undefined}
                  className={`flex items-center justify-between gap-3 rounded-full px-4 py-2 text-base ${
                    s.aprendendo
                      ? 'border-line text-muted border border-dashed'
                      : 'bg-surface-raised'
                  }`}
                >
                  <span className="font-medium">{s.nome}</span>
                  {s.aprendendo ? (
                    <Chip>{t('learning', { name: s.nome })}</Chip>
                  ) : (
                    <span className="text-muted text-sm">
                      {t('years', { count: s.anos })}
                      {s.repos !== undefined &&
                        ` · ${t('repos', { count: s.repos })}`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  )
}
