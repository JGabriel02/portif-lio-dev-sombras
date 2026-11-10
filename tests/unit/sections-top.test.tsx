import { screen, within } from '@testing-library/react'
import { createTranslator } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hero } from '@/components/sections/Hero'
import { Skills } from '@/components/sections/Skills'
import { Sobre } from '@/components/sections/Sobre'
import * as content from '@/content'
import en from '@/content/messages/en.json'
import pt from '@/content/messages/pt.json'
import type { Locale } from '@/i18n/routing'
import { renderWithIntl } from './test-utils'

// Server components are awaited directly; only the server-side translator is
// swapped for next-intl's real createTranslator over the real messages.
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

vi.mock('@/content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content')>()
  return {
    ...actual,
    getPerfil: vi.fn(actual.getPerfil),
    getSkills: vi.fn(actual.getSkills),
    cvDisponivel: vi.fn(),
  }
})

const perfilReal = vi.mocked(content.getPerfil).getMockImplementation()!
const skillsReal = vi.mocked(content.getSkills).getMockImplementation()!

beforeEach(() => {
  vi.mocked(content.getPerfil).mockImplementation(perfilReal)
  vi.mocked(content.getSkills).mockImplementation(skillsReal)
  vi.mocked(content.cvDisponivel).mockReturnValue(null)
})

async function renderHero(locale: Locale = 'pt') {
  const ui = await Hero({ locale })
  return renderWithIntl(ui, { locale })
}

describe('Hero', () => {
  it('shows the status chip when disponivel is true', async () => {
    vi.mocked(content.getPerfil).mockReturnValue({
      ...perfilReal(),
      disponivel: true,
    })
    await renderHero()
    expect(screen.getByText(pt.hero.status)).toBeInTheDocument()
  })

  it('hides the status chip when disponivel is false', async () => {
    vi.mocked(content.getPerfil).mockReturnValue({
      ...perfilReal(),
      disponivel: false,
    })
    await renderHero()
    expect(screen.queryByText(pt.hero.status)).not.toBeInTheDocument()
  })

  it('puts the highlight inside a text-accent element in the H1', async () => {
    await renderHero()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(within(h1).getByText(pt.hero.highlight)).toHaveClass('text-accent')
  })

  it('omits the CV button when no CV is available', async () => {
    await renderHero()
    expect(
      screen.queryByRole('link', { name: pt.hero.ctaCv }),
    ).not.toBeInTheDocument()
  })

  it('renders the CV button with href and download when available', async () => {
    vi.mocked(content.cvDisponivel).mockReturnValue('/cv/x-pt.pdf')
    await renderHero()
    const a = screen.getByRole('link', { name: pt.hero.ctaCv })
    expect(a).toHaveAttribute('href', '/cv/x-pt.pdf')
    expect(a).toHaveAttribute('download')
    expect(content.cvDisponivel).toHaveBeenCalledWith('pt')
  })
})

describe('Sobre', () => {
  it('renders the bio for the locale and the three cards', async () => {
    renderWithIntl(await Sobre({ locale: 'en' }), { locale: 'en' })
    expect(screen.getByText(perfilReal().bio.en)).toBeInTheDocument()
    expect(screen.getByText(en.sobre.cards.busco.title)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })
})

describe('Skills', () => {
  it('renders three groups with years, no progressbar, and learning marker', async () => {
    const { container } = renderWithIntl(await Skills({ locale: 'pt' }))
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(screen.getAllByText(/4 anos/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    const learning = container.querySelectorAll('[data-aprendendo]')
    expect(learning.length).toBeGreaterThan(0)
    expect(learning[0]).toHaveTextContent('aprendendo: Rust')
  })

  it('shows the repo count only when repos > 0', async () => {
    const base = { categoria: 'frontend', anos: 3 } as const
    vi.mocked(content.getSkills).mockResolvedValue([
      { ...base, nome: 'A', repos: 2 },
      { ...base, nome: 'B', repos: undefined },
      { ...base, nome: 'C', repos: 0 },
    ])
    renderWithIntl(await Skills({ locale: 'pt' }))
    expect(screen.getAllByText(/repositório/)).toHaveLength(1)
    expect(screen.getByText(/2 repositórios/)).toBeInTheDocument()
  })

  it('uses English plurals', async () => {
    renderWithIntl(await Skills({ locale: 'en' }), { locale: 'en' })
    expect(screen.getAllByText(/4 years/).length).toBeGreaterThan(0)
  })
})
