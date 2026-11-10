import { afterEach, describe, expect, it, vi } from 'vitest'
import { contatoFormAtivo } from '@/lib/contato-flag'

afterEach(() => vi.unstubAllEnvs())

describe('contatoFormAtivo', () => {
  it('is on outside Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NEXT_PUBLIC_CONTATO_ATIVO', '')
    expect(contatoFormAtivo()).toBe(true)
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(contatoFormAtivo()).toBe(true)
  })

  it('is off on Vercel production by default', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_CONTATO_ATIVO', '')
    expect(contatoFormAtivo()).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_CONTATO_ATIVO', 'false')
    expect(contatoFormAtivo()).toBe(false)
  })

  it('is on in production only when explicitly "true"', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_CONTATO_ATIVO', 'true')
    expect(contatoFormAtivo()).toBe(true)
  })
})
