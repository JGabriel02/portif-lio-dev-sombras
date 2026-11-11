import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const inserirVisita = vi.fn()
const inserirEvento = vi.fn()
vi.mock('@/lib/db/coleta', () => ({
  inserirVisita: (...a: unknown[]) => inserirVisita(...a),
  inserirEvento: (...a: unknown[]) => inserirEvento(...a),
}))

import { POST } from '@/app/api/coleta/route'

const UA = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36'
function req(body: string, headers: Record<string, string> = {}) {
  return new Request('https://site.vercel.app/api/coleta', {
    method: 'POST',
    body,
    headers: {
      'user-agent': UA,
      'x-forwarded-for': '1.2.3.4',
      'x-vercel-ip-country': 'BR',
      ...headers,
    },
  })
}
const visita = JSON.stringify({
  t: 'v',
  caminho: '/pt?x=1',
  idioma: 'pt',
  ref: 'https://github.com/x',
})

beforeEach(() => {
  vi.stubEnv('COLETA_SEGREDO', 'segredo')
  inserirVisita.mockResolvedValue(true)
  inserirEvento.mockResolvedValue(true)
})
afterEach(() => {
  vi.unstubAllEnvs()
  inserirVisita.mockReset()
  inserirEvento.mockReset()
})

describe('POST /api/coleta', () => {
  it('stores a valid visit', async () => {
    const r = await POST(req(visita))
    expect(r.status).toBe(204)
    expect(inserirVisita).toHaveBeenCalledWith(
      expect.objectContaining({
        caminho: '/pt',
        idioma: 'pt',
        origem: 'github.com',
        aparelho: 'desktop',
        pais: 'BR',
      }),
    )
  })

  it('stores a valid event', async () => {
    const r = await POST(
      req(
        JSON.stringify({
          t: 'e',
          tipo: 'repo',
          alvo: 'npc-forge',
          idioma: 'en',
        }),
      ),
    )
    expect(r.status).toBe(204)
    expect(inserirEvento).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'repo', alvo: 'npc-forge' }),
    )
  })

  it.each([
    ['invalid body', () => req(JSON.stringify({ t: 'x' }))],
    ['broken json', () => req('{')],
    ['oversized body', () => req(visita + ' '.repeat(3000))],
    ['bot UA', () => req(visita, { 'user-agent': 'Googlebot/2.1' })],
    ['prefetch', () => req(visita, { 'sec-purpose': 'prefetch' })],
  ])('drops %s', async (_n, make) => {
    const r = await POST(make())
    expect(r.status).toBe(204)
    expect(inserirVisita).not.toHaveBeenCalled()
    expect(inserirEvento).not.toHaveBeenCalled()
  })

  it('cuts alvo to 100 chars', async () => {
    await POST(
      req(
        JSON.stringify({
          t: 'e',
          tipo: 'repo',
          alvo: 'a'.repeat(150),
          idioma: 'pt',
        }),
      ),
    )
    expect(inserirEvento).toHaveBeenCalledWith(
      expect.objectContaining({ alvo: 'a'.repeat(100) }),
    )
  })

  it('does not split an emoji at the alvo boundary', async () => {
    const alvo = 'a'.repeat(99) + '😀' + 'b'
    await POST(
      req(JSON.stringify({ t: 'e', tipo: 'repo', alvo, idioma: 'pt' })),
    )
    expect(inserirEvento).toHaveBeenCalledWith(
      expect.objectContaining({ alvo: 'a'.repeat(99) + '😀' }),
    )
  })

  it('stores a same-host referrer as interno', async () => {
    await POST(
      req(
        JSON.stringify({
          t: 'v',
          caminho: '/pt',
          idioma: 'pt',
          ref: 'https://site.vercel.app/pt',
        }),
      ),
    )
    expect(inserirVisita).toHaveBeenCalledWith(
      expect.objectContaining({ origem: 'interno' }),
    )
  })

  it('drops a contato event posted by the client', async () => {
    const r = await POST(
      req(
        JSON.stringify({ t: 'e', tipo: 'contato', alvo: 'form', idioma: 'pt' }),
      ),
    )
    expect(r.status).toBe(204)
    expect(inserirEvento).not.toHaveBeenCalled()
  })

  it('drops without COLETA_SEGREDO', async () => {
    vi.stubEnv('COLETA_SEGREDO', '')
    const r = await POST(req(visita))
    expect(r.status).toBe(204)
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('still answers 204 when the insert throws', async () => {
    inserirVisita.mockRejectedValue(new Error('x'))
    const r = await POST(req(visita))
    expect(r.status).toBe(204)
  })

  it('turns a malformed country into null', async () => {
    await POST(req(visita, { 'x-vercel-ip-country': 'XX1' }))
    expect(inserirVisita).toHaveBeenCalledWith(
      expect.objectContaining({ pais: null }),
    )
  })
})
