import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { renderWithIntl } from './test-utils'

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/pt/projetos/x',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ locale: 'pt' }),
}))

describe('LocaleSwitcher', () => {
  it('links to the same path in the other locale', () => {
    renderWithIntl(<LocaleSwitcher />)
    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute(
      'href',
      '/en/projetos/x',
    )
  })

  it('marks the current locale and labels the group', () => {
    renderWithIntl(<LocaleSwitcher />)
    expect(screen.getByRole('link', { name: 'PT' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('link', { name: 'EN' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument()
  })
})
