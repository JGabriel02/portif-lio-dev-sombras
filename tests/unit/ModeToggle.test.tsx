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

  it('shows the target-mode label for the current mode', async () => {
    render(<ModeToggle labels={labels} />)
    expect(
      await screen.findByRole('button', { name: labels.toShiny }),
    ).toBeInTheDocument()
  })

  it('flips mode, writes the cookie and updates the label', async () => {
    const user = userEvent.setup()
    render(<ModeToggle labels={labels} />)
    await user.click(
      await screen.findByRole('button', { name: labels.toShiny }),
    )
    expect(document.documentElement.dataset.mode).toBe('shiny')
    expect(document.cookie).toContain('mode=shiny')
    const btn = screen.getByRole('button')
    expect(btn).toHaveAccessibleName(labels.toDark)

    await user.click(btn)
    expect(document.documentElement.dataset.mode).toBe('dark')
    expect(document.cookie).toContain('mode=dark')
    expect(btn).toHaveAccessibleName(labels.toShiny)
  })
})
