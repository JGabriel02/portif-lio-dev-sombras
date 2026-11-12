import { afterEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn()
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => ({ query })),
}))

import { inserirMensagem } from '@/lib/db/mensagens'
import { inserirEvento } from '@/lib/db/coleta'

afterEach(() => {
  vi.unstubAllEnvs()
  query.mockReset()
})

describe('inserirMensagem', () => {
  it('inserts with parameters and returns true', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://x')
    query.mockResolvedValue([])
    const ok = await inserirMensagem({
      nome: 'A',
      email: 'a@b.c',
      texto: 't',
      visitanteHash: 'h'.repeat(64),
    })
    expect(ok).toBe(true)
    expect(query).toHaveBeenCalledWith(
      'insert into mensagem(nome,email,texto,visitante_hash) values ($1,$2,$3,$4)',
      ['A', 'a@b.c', 't', 'h'.repeat(64)],
    )
  })

  it('returns false without DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    expect(
      await inserirMensagem({
        nome: 'A',
        email: 'a',
        texto: 't',
        visitanteHash: null,
      }),
    ).toBe(false)
  })

  it('returns false when the query fails', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://x')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    query.mockRejectedValue(new Error('x'))
    expect(
      await inserirMensagem({
        nome: 'A',
        email: 'a',
        texto: 't',
        visitanteHash: null,
      }),
    ).toBe(false)
  })
})

describe('inserirEvento', () => {
  it('inserts with parameters and returns true', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://x')
    query.mockResolvedValue([])
    const ok = await inserirEvento({
      tipo: 'contato',
      alvo: null,
      idioma: null,
      visitanteHash: 'h',
    })
    expect(ok).toBe(true)
    expect(query).toHaveBeenCalledWith(
      'insert into evento(tipo,alvo,idioma,visitante_hash) values ($1,$2,$3,$4)',
      ['contato', null, null, 'h'],
    )
  })
})
