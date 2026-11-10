import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '@/components/layout/Header'
import { renderWithIntl } from './test-utils'

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/pt',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ locale: 'pt' }),
}))

describe('Header', () => {
  it('renders the four section anchors', () => {
    renderWithIntl(<Header />)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    )
    for (const id of ['sobre', 'skills', 'projetos', 'contato']) {
      expect(hrefs.some((h) => h?.endsWith(`#${id}`))).toBe(true)
    }
  })
})
