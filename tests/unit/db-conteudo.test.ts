import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn()
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => ({ query })),
}))

import { sql } from '@/lib/db/cliente'
import { lerProjetos, lerSkills } from '@/lib/db/conteudo'

const linhaProjeto = {
  slug: 'a',
  repo: 'a-repo',
  destaque: true,
  demo_url: null,
  ocultar_demo: false,
  stack: ['TS'],
  imagens: [{ src: '/x.png', alt: { pt: 'a', en: 'b' } }],
  resumo_pt: 'r',
  resumo_en: 'rr',
  descricao_pt: 'd',
  descricao_en: 'dd',
  aprendizados_pt: 'p',
  aprendizados_en: 'pp',
  fallback_linguagem: 'TypeScript',
  fallback_estrelas: 3,
  fallback_atualizado_em: '2025-01-02',
}

describe('db conteudo', () => {
  let warn: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    query.mockReset()
    vi.stubEnv('DATABASE_URL', 'postgres://x')
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    warn.mockRestore()
  })

  it('sem DATABASE_URL: sql() é null e nada é consultado', async () => {
    vi.stubEnv('DATABASE_URL', '')
    expect(sql()).toBeNull()
    expect(await lerProjetos()).toBeNull()
    expect(query).not.toHaveBeenCalled()
  })

  it('mapeia linha válida para ProjetoCurado', async () => {
    query.mockResolvedValue([linhaProjeto])
    const r = await lerProjetos()
    expect(r).toEqual([
      {
        slug: 'a',
        repo: 'a-repo',
        destaque: true,
        resumo: { pt: 'r', en: 'rr' },
        descricao: { pt: 'd', en: 'dd' },
        aprendizados: { pt: 'p', en: 'pp' },
        stack: ['TS'],
        imagens: [{ src: '/x.png', alt: { pt: 'a', en: 'b' } }],
        fallback: {
          linguagem: 'TypeScript',
          estrelas: 3,
          atualizadoEm: '2025-01-02',
        },
      },
    ])
    expect(r![0]).not.toHaveProperty('demoUrl')
    expect(r![0]).not.toHaveProperty('ocultarDemo')
  })

  it('inclui demoUrl e ocultarDemo quando presentes', async () => {
    query.mockResolvedValue([
      { ...linhaProjeto, demo_url: 'https://d.io', ocultar_demo: true },
    ])
    const r = await lerProjetos()
    expect(r![0].demoUrl).toBe('https://d.io')
    expect(r![0].ocultarDemo).toBe(true)
  })

  it('lista vazia dá null', async () => {
    query.mockResolvedValue([])
    expect(await lerProjetos()).toBeNull()
    expect(await lerSkills()).toBeNull()
  })

  it('skills válidas são mapeadas; categoria inválida lança', async () => {
    query.mockResolvedValue([
      {
        nome: 'React',
        categoria: 'frontend',
        anos: 2,
        aprendendo: false,
        linguagem_github: null,
      },
    ])
    expect(await lerSkills()).toEqual([
      { nome: 'React', categoria: 'frontend', anos: 2 },
    ])
    query.mockResolvedValue([
      {
        nome: 'X',
        categoria: 'x',
        anos: 1,
        aprendendo: false,
        linguagem_github: null,
      },
    ])
    await expect(lerSkills()).rejects.toThrow()
  })

  it('query rejeitada lança sem vazar o erro no log', async () => {
    query.mockRejectedValue(new Error('segredo-na-mensagem'))
    await expect(lerProjetos()).rejects.toThrow()
    expect(JSON.stringify(warn.mock.calls)).not.toContain('segredo')
  })

  it('query que nunca resolve lança após 3000 ms', async () => {
    vi.useFakeTimers()
    query.mockReturnValue(new Promise(() => {}))
    const p = expect(lerProjetos()).rejects.toThrow('timeout')
    await vi.advanceTimersByTimeAsync(3000)
    await p
  })
})
