import { screen } from '@testing-library/react'
import { createTranslator } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'
import { AtividadeCard } from '@/components/sections/AtividadeCard'
import en from '@/content/messages/en.json'
import pt from '@/content/messages/pt.json'
import type { Locale } from '@/i18n/routing'
import { renderWithIntl } from './test-utils'

vi.mock('next-intl/server', () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: Locale
    namespace: string
  }) =>
    createTranslator({
      locale,
      messages: locale === 'en' ? en : pt,
      namespace,
    } as never),
}))

const URL = 'https://github.com/JGabriel02'

async function renderCard(
  atividade: { sequenciaAtual: number; totalAno: number; ano: number } | null,
  locale: Locale = 'pt',
) {
  const ui = await AtividadeCard({ atividade, githubUrl: URL, locale })
  return renderWithIntl(<>{ui}</>, { locale })
}

describe('AtividadeCard', () => {
  it('shows streak and total when sequenciaAtual > 0 (pt)', async () => {
    await renderCard({ sequenciaAtual: 27, totalAno: 412, ano: 2026 })
    expect(screen.getByText('27 dias seguidos')).toBeInTheDocument()
    expect(screen.getByText('412 contribuições em 2026')).toBeInTheDocument()
  })

  it('shows streak and total in English', async () => {
    await renderCard({ sequenciaAtual: 1, totalAno: 412, ano: 2026 }, 'en')
    expect(screen.getByText('1 day in a row')).toBeInTheDocument()
    expect(screen.getByText('412 contributions in 2026')).toBeInTheDocument()
  })

  it('hides the streak line when sequenciaAtual is 0', async () => {
    await renderCard({ sequenciaAtual: 0, totalAno: 412, ano: 2026 })
    expect(screen.queryByText(/seguidos?/)).not.toBeInTheDocument()
    expect(screen.getByText('412 contribuições em 2026')).toBeInTheDocument()
  })

  it('shows "0 contribuições em 2026" for an empty year', async () => {
    await renderCard({ sequenciaAtual: 0, totalAno: 0, ano: 2026 })
    expect(screen.getByText('0 contribuições em 2026')).toBeInTheDocument()
  })

  it('renders nothing when atividade is null', async () => {
    const { container } = await renderCard(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('links to the GitHub profile in a new tab', async () => {
    await renderCard({ sequenciaAtual: 3, totalAno: 10, ano: 2026 })
    const a = screen.getByRole('link', { name: /Ver perfil no GitHub/ })
    expect(a).toHaveAttribute('href', URL)
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    expect(a).toHaveAccessibleName(/abre em nova aba/)
  })
})
