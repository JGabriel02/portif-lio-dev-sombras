import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag }))
vi.mock('@/content', () => ({ TAG_CONTEUDO: 'conteudo' }))

import { POST } from '@/app/api/revalidar/route'

const SEGREDO = 'segredo-de-teste-123'

function req(authorization?: string) {
  return new Request('http://localhost/api/revalidar', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  })
}

describe('POST /api/revalidar', () => {
  beforeEach(() => {
    revalidateTag.mockClear()
    vi.stubEnv('REVALIDATE_SECRET', SEGREDO)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('401 sem a env, mesmo com header', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '')
    const res = await POST(req('Bearer '))
    expect(res.status).toBe(401)
    expect(await res.text()).toBe('')
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('401 com header errado de mesmo tamanho', async () => {
    const res = await POST(req(`Bearer ${'x'.repeat(SEGREDO.length)}`))
    expect(res.status).toBe(401)
    expect(await res.text()).toBe('')
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('401 com header de tamanho diferente, sem lançar', async () => {
    const res = await POST(req('Bearer x'))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('401 sem header', async () => {
    const res = await POST(req())
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('200 com o header certo e revalida a tag', async () => {
    const res = await POST(req(`Bearer ${SEGREDO}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(revalidateTag).toHaveBeenCalledWith('conteudo', { expire: 0 })
  })
})
