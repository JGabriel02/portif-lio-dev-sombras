import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { montarSeed } from '../../scripts/exportar-seed'
import { projetos } from '@/content/projetos'
import { skills } from '@/content/skills'
import type { ProjetoCurado, Skill } from '@/content/types'

const base: ProjetoCurado = {
  slug: 'a',
  repo: 'r-a',
  destaque: false,
  resumo: { pt: 'r', en: 'r' },
  descricao: { pt: 'd', en: 'd' },
  aprendizados: { pt: 'a', en: 'a' },
  stack: ['X'],
  imagens: [],
  fallback: { linguagem: 'X', estrelas: 1, atualizadoEm: '2026-01-01' },
}

describe('montarSeed', () => {
  it('mantém a ordem e preenche ordem por índice', () => {
    const seed = montarSeed(
      [base, { ...base, slug: 'b' }],
      [
        { nome: 'A', categoria: 'tools', anos: 1 },
        { nome: 'B', categoria: 'tools', anos: 2 },
      ],
    )
    expect(seed.projetos.map((p) => [p.slug, p.ordem])).toEqual([
      ['a', 0],
      ['b', 1],
    ])
    expect(seed.skills.map((s) => [s.nome, s.ordem])).toEqual([
      ['A', 0],
      ['B', 1],
    ])
  })

  it('normaliza campos ausentes', () => {
    const skill: Skill = { nome: 'A', categoria: 'tools', anos: 1 }
    const seed = montarSeed([base], [skill])
    expect(seed.projetos[0]).toMatchObject({
      demoUrl: null,
      ocultarDemo: false,
      publicado: true,
    })
    expect(seed.skills[0]).toMatchObject({
      aprendendo: false,
      linguagemGithub: null,
    })
  })

  it('o seed.json commitado está atualizado', () => {
    const arquivo = readFileSync(
      resolve(__dirname, '../../painel/src/main/resources/seed.json'),
      'utf8',
    )
    expect(arquivo).toBe(
      JSON.stringify(montarSeed(projetos, skills), null, 2) + '\n',
    )
  })
})
