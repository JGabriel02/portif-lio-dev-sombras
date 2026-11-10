import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { getPerfil } from '@/content'

export async function Footer() {
  const t = await getTranslations()
  const { links } = getPerfil()
  const year = new Date().getFullYear()
  const linkClass =
    'text-muted hover:text-text inline-flex min-h-10 items-center rounded-full px-3 text-base'

  return (
    <footer className="border-line mt-auto border-t py-8">
      <Container className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-muted text-sm">{t('footer.rights', { year })}</p>
        <ul className="flex items-center gap-1">
          <li>
            <a
              href={links.github}
              className={linkClass}
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href={links.linkedin}
              className={linkClass}
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a href="#conteudo" className={linkClass}>
              {t('footer.top')}
            </a>
          </li>
        </ul>
      </Container>
    </footer>
  )
}
