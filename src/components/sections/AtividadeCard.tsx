import { Flame } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import type { Atividade } from '@/content'
import type { Locale } from '@/i18n/routing'

type Props = {
  atividade: Atividade | null
  githubUrl: string
  locale: Locale
}

export async function AtividadeCard({ atividade, githubUrl, locale }: Props) {
  if (!atividade) return null
  const t = await getTranslations({ locale, namespace: 'sobre.atividade' })

  return (
    <Card className="h-full p-6">
      <h3 className="font-heading text-xl">{t('titulo')}</h3>
      {atividade.sequenciaAtual > 0 && (
        <p className="text-accent mt-2 flex items-center gap-2 text-base">
          <Flame aria-hidden="true" className="size-5" />
          {t('sequencia', { count: atividade.sequenciaAtual })}
        </p>
      )}
      <p className="text-muted mt-2 text-base">
        {t('total', { count: atividade.totalAno, ano: atividade.ano })}
      </p>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent mt-4 inline-block text-base underline underline-offset-4"
      >
        {t('link')}
        <span className="sr-only"> {t('novaAba')}</span>
      </a>
    </Card>
  )
}
