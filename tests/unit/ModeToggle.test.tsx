import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ModeToggle } from '@/components/layout/ModeToggle'

const labels = { toShiny: 'Ativar modo shiny', toDark: 'Ativar modo escuro' }

describe('ModeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.mode = 'dark'
  })
  afterEach(() => {
    cleanup()
    document.cookie = 'mode=; path=/; max-age=0'
    delete document.documentElement.dataset.mode
  })

  it('renders both labels as visually hidden text, with no stateful aria-label', () => {
    render(<ModeToggle labels={labels} />)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveAttribute('aria-label')
    for (const text of Object.values(labels)) {
      const span = screen.getByText(text)
      expect(span).toHaveClass('sr-only')
    }
    expect(btn.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2)
  })

  it('tags each label and icon with the mode where it is shown', () => {
    render(<ModeToggle labels={labels} />)
    expect(screen.getByText(labels.toShiny)).toHaveClass('mode-when-dark')
    expect(screen.getByText(labels.toDark)).toHaveClass('mode-when-shiny')
  })

  it('flips mode from the DOM value and writes the cookie', async () => {
    const user = userEvent.setup()
    render(<ModeToggle labels={labels} />)
    const btn = screen.getByRole('button')

    await user.click(btn)
    expect(document.documentElement.dataset.mode).toBe('shiny')
    expect(document.cookie).toContain('mode=shiny')

    await user.click(btn)
    expect(document.documentElement.dataset.mode).toBe('dark')
    expect(document.cookie).toContain('mode=dark')
  })

  it('has no per-instance state: follows a mode changed elsewhere', async () => {
    const user = userEvent.setup()
    render(<ModeToggle labels={labels} />)
    document.documentElement.dataset.mode = 'shiny'
    await user.click(screen.getByRole('button'))
    expect(document.documentElement.dataset.mode).toBe('dark')
  })
})
