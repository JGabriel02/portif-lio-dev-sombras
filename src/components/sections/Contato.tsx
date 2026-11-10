import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/Section'
import { getPerfil } from '@/content'
import type { Locale } from '@/i18n/routing'
import { contatoFormAtivo } from '@/lib/contato-flag'
import { ContatoForm } from './ContatoForm'

export async function Contato({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contato' })
  const { email, links } = getPerfil()
  const formAtivo = contatoFormAtivo()
  const linkClass =
    'text-accent focus-visible:outline-focus-ring inline-flex min-h-11 items-center underline underline-offset-4 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2'

  return (
    <Section id="contato" titleId="contato-title" title={t('title')}>
      <div
        className={
          formAtivo ? 'grid grid-cols-1 gap-10 md:grid-cols-2' : undefined
        }
      >
        <div>
          <p className="text-muted max-w-md text-xl">{t('intro')}</p>
          <ul className="mt-6 flex flex-col gap-1 text-base">
            <li>
              <a href={`mailto:${email}`} className={linkClass}>
                {email}
              </a>
            </li>
            <li>
              <a href={links.linkedin} className={linkClass}>
                LinkedIn
              </a>
            </li>
            <li>
              <a href={links.github} className={linkClass}>
                GitHub
              </a>
            </li>
          </ul>
          {!formAtivo && (
            <p className="text-muted mt-6 max-w-md text-base">
              {t('formIndisponivel')}
            </p>
          )}
        </div>
        {formAtivo && <ContatoForm email={email} />}
      </div>
    </Section>
  )
}
