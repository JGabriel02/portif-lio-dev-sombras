import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aparelhoDe,
  ehBot,
  limparCaminho,
  origemDe,
} from '@/lib/coleta/normalizar'
import { visitanteHash } from '@/lib/coleta/hash'

describe('limparCaminho', () => {
  it('strips query and hash', () => {
    expect(limparCaminho('/pt/projetos/x?token=abc#y')).toBe('/pt/projetos/x')
  })
  it('cuts to 200 chars', () => {
    expect(limparCaminho('a'.repeat(5000))).toHaveLength(200)
  })
})

describe('truncamento por code point', () => {
  it('limparCaminho does not split an emoji at the limit', () => {
    const r = limparCaminho('a'.repeat(199) + '😀' + 'b')
    expect(r).toBe('a'.repeat(199) + '😀')
    expect(Array.from(r)).toHaveLength(200)
    expect(r.isWellFormed()).toBe(true)
  })
})

describe('origemDe', () => {
  it('returns the hostname without www', () => {
    expect(origemDe('https://www.linkedin.com/feed', 'site.vercel.app')).toBe(
      'linkedin.com',
    )
  })
  it('returns direto for empty or invalid', () => {
    expect(origemDe('', 'h')).toBe('direto')
    expect(origemDe('nota url', 'h')).toBe('direto')
  })
  it('returns interno for the same host', () => {
    expect(origemDe('https://site.vercel.app/pt', 'site.vercel.app')).toBe(
      'interno',
    )
  })
})

describe('ehBot / aparelhoDe', () => {
  it('detects bots and empty UA', () => {
    expect(ehBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(ehBot('')).toBe(true)
    expect(
      ehBot('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36'),
    ).toBe(false)
  })
  it('detects mobile', () => {
    expect(aparelhoDe('Mozilla/5.0 (Linux; Android 14) Mobile')).toBe('mobile')
    expect(aparelhoDe('Mozilla/5.0 (Windows NT 10.0)')).toBe('desktop')
  })
})

describe('visitanteHash', () => {
  beforeEach(() => vi.stubEnv('COLETA_SEGREDO', 'segredo'))
  afterEach(() => vi.unstubAllEnvs())
  const h = () =>
    new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'UA' })

  it('is stable within a day, differs next day, 64 hex', () => {
    const a = visitanteHash(h(), new Date('2026-01-01T10:00:00Z'))
    const b = visitanteHash(h(), new Date('2026-01-01T22:00:00Z'))
    const c = visitanteHash(h(), new Date('2026-01-02T10:00:00Z'))
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
  it('returns null without secret', () => {
    vi.stubEnv('COLETA_SEGREDO', '')
    expect(visitanteHash(h())).toBeNull()
  })
})
