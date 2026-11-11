import { afterEach, describe, expect, it, vi } from 'vitest'
import { contatoFormAtivo } from '@/lib/contato-flag'

afterEach(() => vi.unstubAllEnvs())

describe('contatoFormAtivo', () => {
  it('is on when DATABASE_URL is set, regardless of VERCEL_ENV', () => {
    vi.stubEnv('DATABASE_URL', 'postgres://x')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(contatoFormAtivo()).toBe(true)
    vi.stubEnv('VERCEL_ENV', '')
    expect(contatoFormAtivo()).toBe(true)
  })

  it('is off without DATABASE_URL, regardless of VERCEL_ENV', () => {
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(contatoFormAtivo()).toBe(false)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(contatoFormAtivo()).toBe(false)
  })
})
