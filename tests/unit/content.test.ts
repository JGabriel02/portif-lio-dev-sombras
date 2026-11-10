import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  cvDisponivel,
  getPerfil,
  getProjeto,
  getProjetos,
  getSkills,
} from '@/content'

function nonEmpty(v: { pt: string; en: string }) {
  return v.pt.trim().length > 0 && v.en.trim().length > 0
}

describe('projetos', () => {
  it('has exactly one destaque and it comes first', () => {
    expect(getProjetos().filter((p) => p.destaque)).toHaveLength(1)
    expect(getProjetos()[0].destaque).toBe(true)
  })

  it('orders non-featured by atualizadoEm desc', () => {
    const rest = getProjetos()
      .slice(1)
      .map((p) => p.atualizadoEm)
    expect([...rest].sort().reverse()).toEqual(rest)
  })

  it('has unique, url-safe slugs and getProjeto resolves them', () => {
    const slugs = getProjetos().map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/)
      expect(getProjeto(s)?.slug).toBe(s)
    }
    expect(getProjeto('nope')).toBeUndefined()
  })

  it('has non-empty localized fields', () => {
    for (const p of getProjetos()) {
      expect(nonEmpty(p.resumo)).toBe(true)
      expect(nonEmpty(p.descricao)).toBe(true)
      expect(nonEmpty(p.aprendizados)).toBe(true)
      for (const i of p.imagens) expect(nonEmpty(i.alt)).toBe(true)
    }
  })
})

describe('perfil', () => {
  it('has non-empty localized cargo and bio', () => {
    const p = getPerfil()
    expect(nonEmpty(p.cargo)).toBe(true)
    expect(nonEmpty(p.bio)).toBe(true)
  })
})

describe('skills', () => {
  it('filters by categoria', () => {
    const fe = getSkills('frontend')
    expect(fe.length).toBeGreaterThan(0)
    expect(fe.every((s) => s.categoria === 'frontend')).toBe(true)
  })

  it('puts learning items last, others by anos desc', () => {
    const all = getSkills()
    const firstLearning = all.findIndex((s) => s.aprendendo)
    expect(firstLearning).toBeGreaterThan(-1)
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
