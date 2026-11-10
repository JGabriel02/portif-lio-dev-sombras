import { setRequestLocale } from 'next-intl/server'

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)

  // Placeholder: sections arrive in later tasks.
  return <main id="conteudo" />
}
