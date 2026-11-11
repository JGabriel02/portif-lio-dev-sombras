import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: <T>(f: T) => f,
}))
vi.mock('@/lib/db/conteudo', () => ({
  lerProjetos: vi.fn(),
  lerSkills: vi.fn(),
}))
vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, getRepos: vi.fn(), getCalendario: vi.fn() }
})

import { getProjeto, getProjetos, getSkills } from '@/content'
import { projetos } from '@/content/projetos'
import { skills } from '@/content/skills'
import type { ProjetoCurado, Skill } from '@/content/types'
import { lerProjetos, lerSkills } from '@/lib/db/conteudo'
import { getRepos } from '@/lib/github'

const base = projetos[0]
function proj(slug: string, destaque = false): ProjetoCurado {
  return { ...base, slug, repo: slug, destaque }
}

beforeEach(() => {
  vi.mocked(getRepos).mockResolvedValue(null)
  vi.mocked(lerProjetos).mockResolvedValue(null)
  vi.mocked(lerSkills).mockResolvedValue(null)
})

describe('projetos do banco', () => {
  it('prioriza o banco e mantém a ordem sem destaque', async () => {
    vi.mocked(lerProjetos).mockResolvedValue([proj('b'), proj('a')])
    expect((await getProjetos()).map((p) => p.slug)).toEqual(['b', 'a'])
  })

  it('cai nos arquivos quando o banco devolve null', async () => {
    const lista = await getProjetos()
    expect(lista.map((p) => p.slug).sort()).toEqual(
      projetos.map((p) => p.slug).sort(),
    )
    expect(lista[0].slug).toBe('npc-forge')
  })

  it('coloca o destaque primeiro e depois segue a posição', async () => {
    vi.mocked(lerProjetos).mockResolvedValue([
      proj('x'),
      proj('y', true),
      proj('z'),
    ])
    expect((await getProjetos()).map((p) => p.slug)).toEqual(['y', 'x', 'z'])
  })

  it('getProjeto devolve undefined para slug fora da lista do banco', async () => {
    vi.mocked(lerProjetos).mockResolvedValue([proj('a')])
    expect(await getProjeto('inexistente-no-banco')).toBeUndefined()
  })
})

describe('skills do banco', () => {
  const s = (nome: string, anos: number, aprendendo = false): Skill => ({
    ...skills[0],
    nome,
    anos,
    aprendendo,
    linguagemGithub: undefined,
  })

  it('usa o banco quando há dados, com a posição como desempate', async () => {
    vi.mocked(lerSkills).mockResolvedValue([
      s('A', 1),
      s('L', 5, true),
      s('B', 1),
      s('C', 3),
    ])
    expect((await getSkills()).map((x) => x.nome)).toEqual(['C', 'A', 'B', 'L'])
  })

  it('cai nos arquivos quando o banco devolve null', async () => {
    expect((await getSkills()).length).toBe(skills.length)
  })
})
