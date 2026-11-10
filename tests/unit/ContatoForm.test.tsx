import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContatoForm } from '@/components/sections/ContatoForm'
import pt from '@/content/messages/pt.json'
import { renderWithIntl } from './test-utils'

describe('ContatoForm', () => {
  it('shows translated field errors, aria wiring and an alert on empty submit', async () => {
    renderWithIntl(<ContatoForm email="a@b.com" />)
    fireEvent.submit(
      screen.getByRole('button', { name: pt.contato.send }).closest('form')!,
    )
    const alert = await screen.findByRole('alert')
    await waitFor(() => expect(document.activeElement).toBe(alert))
    const expected = {
      nome: pt.contato.errors.nameRequired,
      email: pt.contato.errors.emailInvalid,
      mensagem: pt.contato.errors.messageMin,
    }
    for (const [name, text] of Object.entries(expected)) {
      const input = document.querySelector(`[name="${name}"]`)!
      expect(input.getAttribute('aria-invalid')).toBe('true')
      const id = input.getAttribute('aria-describedby')!
      expect(document.getElementById(id)!.textContent).toBe(text)
    }
    const honeypot = document.querySelector('[name="site"]')!
    expect(honeypot.getAttribute('tabindex')).toBe('-1')
    expect(honeypot.getAttribute('autocomplete')).toBe('off')
  })
})
