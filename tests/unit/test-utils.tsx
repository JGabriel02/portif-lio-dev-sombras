import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import en from '@/content/messages/en.json'
import pt from '@/content/messages/pt.json'
import type { Locale } from '@/i18n/routing'

const messages = { pt, en }

export function renderWithIntl(
  ui: ReactElement,
  { locale = 'pt' }: { locale?: Locale } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {ui}
    </NextIntlClientProvider>,
  )
}
