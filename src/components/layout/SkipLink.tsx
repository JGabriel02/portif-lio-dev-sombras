import { getTranslations } from 'next-intl/server'

export async function SkipLink() {
  const t = await getTranslations()
  return (
    <a
      href="#conteudo"
      className="bg-accent text-on-accent sr-only rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      {t('skip')}
    </a>
  )
}
