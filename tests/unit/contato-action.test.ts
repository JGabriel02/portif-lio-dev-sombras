import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const inserirMensagem = vi.fn()
const inserirEvento = vi.fn()
vi.mock('@/lib/db/mensagens', () => ({
  inserirMensagem: (...a: unknown[]) => inserirMensagem(...a),
}))
vi.mock('@/lib/db/coleta', () => ({
  inserirEvento: (...a: unknown[]) => inserirEvento(...a),
}))

vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA' }),
}))

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

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://x')
  vi.stubEnv('COLETA_SEGREDO', 'segredo')
  inserirMensagem.mockResolvedValue(true)
  inserirEvento.mockResolvedValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  inserirMensagem.mockReset()
  inserirEvento.mockReset()
})

describe('enviarContato', () => {
  it('returns ok silently and stores nothing when the honeypot is filled', async () => {
    const r = await enviarContato(
      { status: 'idle' },
      fd({ nome: '', email: 'x', mensagem: '', site: 'bot' }),
    )
    expect(r).toEqual({ status: 'ok' })
    expect(inserirMensagem).not.toHaveBeenCalled()
    expect(inserirEvento).not.toHaveBeenCalled()
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
    expect(inserirMensagem).not.toHaveBeenCalled()
  })

  it('stores the message and a contato event for a valid payload', async () => {
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'ok' })
    expect(inserirMensagem).toHaveBeenCalledWith({
      nome: 'Ana',
      email: 'ana@exemplo.com',
      texto: valid.mensagem,
      visitanteHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    })
    expect(inserirEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'contato',
        visitanteHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    )
  })

  it('saves the message but skips the event without COLETA_SEGREDO', async () => {
    vi.stubEnv('COLETA_SEGREDO', '')
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'ok' })
    expect(inserirMensagem).toHaveBeenCalled()
    expect(inserirEvento).not.toHaveBeenCalled()
  })

  it('returns error when the message could not be stored', async () => {
    inserirMensagem.mockResolvedValue(false)
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'error' })
    expect(inserirEvento).not.toHaveBeenCalled()
  })

  it('still returns ok when only the event fails to be stored', async () => {
    inserirEvento.mockRejectedValue(new Error('x'))
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'ok' })
  })

  it('refuses when there is no DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const r = await enviarContato({ status: 'idle' }, fd(valid))
    expect(r).toEqual({ status: 'error' })
    expect(inserirMensagem).not.toHaveBeenCalled()
  })

  it('never logs the name, email or text', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (m) => vi.spyOn(console, m).mockImplementation(() => {}),
    )
    inserirMensagem.mockRejectedValue(new Error('boom'))
    await enviarContato({ status: 'idle' }, fd(valid))
    await enviarContato({ status: 'idle' }, fd({ ...valid, nome: 'Ana' }))
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls))
    expect(logged).not.toContain('ana@exemplo.com')
    expect(logged).not.toContain('Ana')
    expect(logged).not.toContain(valid.mensagem)
  })
})
