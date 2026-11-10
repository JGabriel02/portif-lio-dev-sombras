import { afterEach, describe, expect, it, vi } from 'vitest'
import { enviarContato } from '@/app/actions/contato'

function fd(data: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(data)) f.set(k, v)
  return f
}
const valid = {
  nome: 'Ana',
  email: 'ana@exemplo.com',
  mensagem: 'uma mensagem longa',
}

afterEach(() => vi.restoreAllMocks())

describe('enviarContato', () => {
  it('returns ok silently when the honeypot is filled', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const r = await enviarContato(
      { status: 'idle' },
      fd({ nome: '', email: 'x', mensagem: '', site: 'bot' }),
    )
    expect(r).toEqual({ status: 'ok' })
    expect(info).not.toHaveBeenCalled()
  })

  it('returns field errors and preserves values', async () => {
    const r = await enviarContato(
      { status: 'idle' },
      fd({ ...valid, email: 'nope' }),
    )
    expect(r).toMatchObject({
      status: 'invalid',
      fieldErrors: { email: 'errors.emailInvalid' },
      values: { nome: 'Ana', email: 'nope', mensagem: valid.mensagem },
    })
  })

  it('returns ok and logs a dev notice for a valid payload', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'ok' })
    expect(info).toHaveBeenCalledWith('[contato] dev only, not sent', {
      nome: 'Ana',
      email: 'ana@exemplo.com',
      length: valid.mensagem.length,
    })
  })
})
