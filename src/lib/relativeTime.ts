import type { Locale } from '@/i18n/routing'

const DAY_MS = 86_400_000

/** "há 3 dias" / "3 days ago", picking the coarsest sensible unit. */
export function relativeTime(
  iso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const days = Math.round((new Date(iso).getTime() - now.getTime()) / DAY_MS)
  const abs = Math.abs(days)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
  if (abs < 30) return rtf.format(days, 'day')
  if (abs < 365) return rtf.format(Math.trunc(days / 30), 'month')
  return rtf.format(Math.trunc(days / 365), 'year')
}
