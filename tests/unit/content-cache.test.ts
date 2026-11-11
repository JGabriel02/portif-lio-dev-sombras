import { beforeEach, describe, expect, it, vi } from 'vitest'

// Memoizes resolved values only, like the real unstable_cache: a rejection
// is never stored.
vi.mock('next/cache', () => ({
  unstable_cache: <T>(f: () => Promise<T>) => {
    let guardado: { v: T } | null = null
    return async () => {
      if (guardado) return guardado.v
      const v = await f()
      guardado = { v }
      return v
    }
  },
}))
vi.mock('@/lib/db/conteudo', () => ({
  lerProjetos: vi.fn(),
  lerSkills: vi.fn(),
}))
vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, getRepos: vi.fn(), getCalendario: vi.fn() }
})

import { getProjetos, getSkills } from '@/content'
import { projetos } from '@/content/projetos'
import { skills } from '@/content/skills'
import type { ProjetoCurado, Skill } from '@/content/types'
import { lerProjetos, lerSkills } from '@/lib/db/conteudo'
import { getRepos } from '@/lib/github'

beforeEach(() => {
  vi.mocked(getRepos).mockResolvedValue(null)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('falha do banco não é cacheada', () => {
  it('projetos: usa os arquivos na falha e tenta o banco de novo', async () => {
    const doBanco: ProjetoCurado = {
      ...projetos[0],
      slug: 'so-no-banco',
      repo: 'so-no-banco',
    }
    vi.mocked(lerProjetos)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue([doBanco])
    const a = await getProjetos()
    expect(a.map((p) => p.slug).sort()).toEqual(
      projetos.map((p) => p.slug).sort(),
    )
    expect((await getProjetos()).map((p) => p.slug)).toEqual(['so-no-banco'])
    expect(lerProjetos).toHaveBeenCalledTimes(2)
    // success is cached
    await getProjetos()
    expect(lerProjetos).toHaveBeenCalledTimes(2)
  })

  it('skills: usa os arquivos na falha e tenta o banco de novo', async () => {
    const doBanco: Skill = { ...skills[0], nome: 'So no banco' }
    vi.mocked(lerSkills)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue([doBanco])
    expect((await getSkills()).length).toBe(skills.length)
    expect((await getSkills()).map((s) => s.nome)).toEqual(['So no banco'])
    expect(lerSkills).toHaveBeenCalledTimes(2)
  })
})
