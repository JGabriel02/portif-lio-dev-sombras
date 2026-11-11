import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cvDisponivel,
  getPerfil,
  getProjeto,
  getProjetos,
  getSkills,
} from '@/content'
import { projetos } from '@/content/projetos'
import { getRepos } from '@/lib/github'

vi.mock('next/cache', () => ({ unstable_cache: <T>(f: T) => f }))
vi.mock('@/lib/db/conteudo', () => ({
  lerProjetos: vi.fn().mockResolvedValue(null),
  lerSkills: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, getRepos: vi.fn(), getCalendario: vi.fn() }
})

beforeEach(() => {
  vi.mocked(getRepos).mockResolvedValue(null)
})

function nonEmpty(v: { pt: string; en: string }) {
  return v.pt.trim().length > 0 && v.en.trim().length > 0
}

describe('projetos', () => {
  it('has exactly one destaque and it comes first', async () => {
    const lista = await getProjetos()
    expect(lista.filter((p) => p.destaque)).toHaveLength(1)
    expect(lista[0].destaque).toBe(true)
  })

  it('orders non-featured by position in projetos.ts', async () => {
    const rest = (await getProjetos()).slice(1).map((p) => p.slug)
    const esperado = projetos.filter((p) => !p.destaque).map((p) => p.slug)
    expect(rest).toEqual(esperado)
  })

  it('has unique, url-safe slugs and getProjeto resolves them', async () => {
    const slugs = (await getProjetos()).map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/)
      expect((await getProjeto(s))?.slug).toBe(s)
    }
    expect(await getProjeto('nope')).toBeUndefined()
  })

  it('has non-empty localized fields and a repo', async () => {
    for (const p of await getProjetos()) {
      expect(p.nome.trim().length).toBeGreaterThan(0)
      expect(nonEmpty(p.resumo)).toBe(true)
      expect(nonEmpty(p.descricao)).toBe(true)
      expect(nonEmpty(p.aprendizados)).toBe(true)
      for (const i of p.imagens) expect(nonEmpty(i.alt)).toBe(true)
    }
  })
})

describe('perfil', () => {
  it('has non-empty localized cargo, intro and curiosities', () => {
    const p = getPerfil()
    expect(nonEmpty(p.cargo)).toBe(true)
    for (const parts of [p.intro.pt, p.intro.en]) {
      expect(parts).toHaveLength(3)
      expect(parts[1].trim().length).toBeGreaterThan(0)
    }
    expect(p.cidade.trim().length).toBeGreaterThan(0)
    expect(p.curiosidades.length).toBeGreaterThan(0)
    for (const c of p.curiosidades) {
      expect(c.emoji.trim().length).toBeGreaterThan(0)
      expect(nonEmpty(c.texto)).toBe(true)
    }
    for (const i of p.idiomas) {
      expect(nonEmpty(i.idioma)).toBe(true)
      expect(nonEmpty(i.nivel)).toBe(true)
    }
    for (const e of p.educacao) expect(nonEmpty(e.curso)).toBe(true)
  })
})

describe('skills', () => {
  it('filters by categoria', async () => {
    const fe = await getSkills('frontend')
    expect(fe.length).toBeGreaterThan(0)
    expect(fe.every((s) => s.categoria === 'frontend')).toBe(true)
  })

  it('puts learning items last, others by anos desc', async () => {
    const all = await getSkills()
    const idx = all.findIndex((s) => s.aprendendo)
    const firstLearning = idx === -1 ? all.length : idx
    expect(all.slice(firstLearning).every((s) => s.aprendendo)).toBe(true)
    const rest = all.slice(0, firstLearning).map((s) => s.anos)
    expect([...rest].sort((a, b) => b - a)).toEqual(rest)
  })
})

describe('cvDisponivel', () => {
  let root: string
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-'))
    fs.mkdirSync(path.join(root, 'cv'))
  })
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it.each([
    ['pt', '/cv/joao-gabriel-pt.pdf'],
    ['en', '/cv/joao-gabriel-en.pdf'],
  ] as const)('%s: null when absent, path when present', (locale, p) => {
    expect(cvDisponivel(locale, root)).toBeNull()
    fs.writeFileSync(path.join(root, p), '%PDF-1.4')
    expect(cvDisponivel(locale, root)).toBe(p)
  })
})
