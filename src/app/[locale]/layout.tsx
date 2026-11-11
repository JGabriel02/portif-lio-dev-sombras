import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Inter, Space_Grotesk } from 'next/font/google'
import { notFound } from 'next/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { Coleta } from '@/components/analytics/Coleta'
import { Footer } from '@/components/layout/Footer'
import { FundoSombra } from '@/components/layout/FundoSombra'
import { Header } from '@/components/layout/Header'
import { SkipLink } from '@/components/layout/SkipLink'
import { themeScript } from '@/themes/theme-script'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  weight: '500',
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const inter = Inter({
  weight: ['400', '500'],
  variable: '--font-inter',
  subsets: ['latin'],
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    ...buildMetadata({
      locale: locale as Locale,
      path: '',
      title: t('title'),
      description: t('description'),
    }),
    // GIF desenhado pelo dono (anima no Firefox; outros navegadores mostram o 1º quadro).
    icons: { icon: [{ url: '/icone.gif', type: 'image/gif' }] },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html
      lang={locale}
      data-theme="sombra"
      data-mode="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <FundoSombra />
          <SkipLink />
          <Header />
          {children}
          <Footer />
          {(process.env.VERCEL_ENV === 'production' ||
            process.env.COLETA_FORCAR === '1') && <Coleta />}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
