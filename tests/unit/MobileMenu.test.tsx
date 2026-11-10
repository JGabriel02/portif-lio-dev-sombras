import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { renderWithIntl } from './test-utils'

const links = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#skills', label: 'Skills' },
]

describe('MobileMenu', () => {
  it('toggles aria-expanded on click', async () => {
    renderWithIntl(<MobileMenu links={links} label="Menu" />)
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls')
  })

  it('closes on Escape and returns focus to the button', async () => {
    renderWithIntl(<MobileMenu links={links} label="Menu" />)
    const button = screen.getByRole('button', { name: 'Menu' })
    await userEvent.click(button)
    await userEvent.click(screen.getByRole('link', { name: 'Sobre' }))
    await userEvent.click(button)
    await userEvent.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(button)
  })
})
