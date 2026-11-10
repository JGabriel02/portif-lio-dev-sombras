'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LocaleSwitcher() {
  const t = useTranslations('locale')
  const current = useLocale()
  const pathname = usePathname()

  return (
    <div role="group" aria-label={t('label')} className="inline-flex gap-1">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          lang={locale}
          aria-current={locale === current ? 'true' : undefined}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium"
        >
          {t(locale)}
        </Link>
      ))}
    </div>
  )
}
