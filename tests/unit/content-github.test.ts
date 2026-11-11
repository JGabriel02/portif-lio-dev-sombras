import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '@/lib/github'
import repos from '../fixtures/github/repos.json'
import calendar from '../fixtures/github/calendar.json'

vi.mock('next/cache', () => ({ unstable_cache: <T>(f: T) => f }))
vi.mock('@/lib/db/conteudo', () => ({
  lerProjetos: vi.fn().mockResolvedValue(null),
  lerSkills: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, getRepos: vi.fn(), getCalendario: vi.fn() }
})

import {
  getAtividade,
  getProjeto,
  getProjetos,
  getSkills,
  mesclarProjeto,
} from '@/content'
import { projetos } from '@/content/projetos'
import {
  CalendarSchema,
  getCalendario,
  getRepos,
  RepoSchema,
} from '@/lib/github'

const todos = repos.flatMap((r) => {
  const parsed = RepoSchema.safeParse(r)
  return parsed.success ? [parsed.data] : []
})
const dias = CalendarSchema.parse(
  calendar,
).user.contributionsCollection.contributionCalendar.weeks.flatMap(
  (w) => w.contributionDays,
)

// Use a curated entry without a manual demoUrl so homepage rules are testable.
const curado = {
  ...projetos.find((p) => p.repo === 'npc-forge')!,
  demoUrl: undefined,
}
const repoNpc = todos.find((r) => r.name === 'npc-forge') as Repo

let warn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.mocked(getRepos).mockResolvedValue(todos)
  vi.mocked(getCalendario).mockResolvedValue(dias)
})
afterEach(() => {
  warn.mockRestore()
  vi.resetAllMocks()
})

describe('mesclarProjeto', () => {
  it('live data overrides fallback; fonte github; color from corDaLinguagem', () => {
    const p = mesclarProjeto(curado, repoNpc, 'JGabriel02')
    expect(p.fonte).toBe('github')
    expect(p.estrelas).toBe(repoNpc.stargazers_count)
    expect(p.linguagem).toEqual({ nome: 'C#', cor: '#178600' })
    expect(p.atualizadoEm).toBe(repoNpc.pushed_at)
    expect(p.repoUrl).toBe(repoNpc.html_url)
    expect(p.nome).toBe('npc-forge')
  })

  it('repo missing: fallback values, fonte fallback, repoUrl from login', () => {
    const p = mesclarProjeto(curado, undefined, 'JGabriel02')
    expect(p.fonte).toBe('fallback')
    expect(p.estrelas).toBe(curado.fallback.estrelas)
    expect(p.linguagem.nome).toBe(curado.fallback.linguagem)
    expect(p.atualizadoEm).toBe(curado.fallback.atualizadoEm)
    expect(p.repoUrl).toBe('https://github.com/JGabriel02/npc-forge')
    expect(p.demoUrl).toBeUndefined()
  })

  it('manual demoUrl wins over homepage; empty homepage ignored', () => {
    const comHome = { ...repoNpc, homepage: 'https://home.example.com' }
    expect(mesclarProjeto(curado, comHome, 'x').demoUrl).toBe(
      'https://home.example.com',
    )
    const manual = { ...curado, demoUrl: 'https://manual.example.com' }
    expect(mesclarProjeto(manual, comHome, 'x').demoUrl).toBe(
      'https://manual.example.com',
    )
    const vazio = { ...repoNpc, homepage: '  ' }
    expect(mesclarProjeto(curado, vazio, 'x').demoUrl).toBeUndefined()
    const nulo = { ...repoNpc, homepage: null }
    expect(mesclarProjeto(curado, nulo, 'x').demoUrl).toBeUndefined()
  })

  it('ocultarDemo hides the app link even with homepage or manual demoUrl', () => {
    const comHome = { ...repoNpc, homepage: 'https://home.example.com' }
    const oculto = {
      ...curado,
      demoUrl: 'https://manual.example.com',
      ocultarDemo: true,
    }
    expect(mesclarProjeto(oculto, comHome, 'x').demoUrl).toBeUndefined()
  })

  it('cardapio is curated without an app link', () => {
    const cardapio = projetos.find((p) => p.repo === 'cardapio')!
    const repo = { ...repoNpc, name: 'cardapio', homepage: 'https://x.app' }
    expect(mesclarProjeto(cardapio, repo, 'x').demoUrl).toBeUndefined()
  })
})

describe('getProjetos', () => {
  it('uses live data for every curated repo present', async () => {
    const lista = await getProjetos()
    expect(lista).toHaveLength(projetos.length)
    expect(lista.every((p) => p.fonte === 'github')).toBe(true)
    expect(lista[0].slug).toBe('npc-forge')
    expect(warn).not.toHaveBeenCalled()
  })

  it('one curated repo missing from response: only that one is fallback', async () => {
    vi.mocked(getRepos).mockResolvedValue(
      todos.filter((r) => r.name !== 'cardapio'),
    )
    const lista = await getProjetos()
    const fallback = lista.filter((p) => p.fonte === 'fallback')
    expect(fallback.map((p) => p.slug)).toEqual(['cardapio'])
    expect(lista.filter((p) => p.fonte === 'github')).toHaveLength(
      projetos.length - 1,
    )
    expect(warn).toHaveBeenCalledWith('[github] repo curado não encontrado', {
      repo: 'cardapio',
    })
  })

  it('getProjeto resolves by slug', async () => {
    expect((await getProjeto('missions-api'))?.nome).toBe('Missions_API')
    expect(await getProjeto('nope')).toBeUndefined()
  })
})

describe('without GitHub data', () => {
  beforeEach(() => {
    vi.mocked(getRepos).mockResolvedValue(null)
    vi.mocked(getCalendario).mockResolvedValue(null)
  })

  it('all fallback, repos undefined, atividade null', async () => {
    const lista = await getProjetos()
    expect(lista.every((p) => p.fonte === 'fallback')).toBe(true)
    expect(lista.find((p) => p.slug === 'cardapio')?.estrelas).toBe(3)
    expect((await getSkills()).every((s) => s.repos === undefined)).toBe(true)
    expect(await getAtividade()).toBeNull()
  })
})

describe('getSkills', () => {
  it('fills repos from language counts; framework skills stay undefined', async () => {
    const skills = await getSkills()
    const por = (n: string) => skills.find((s) => s.nome === n)
    expect(por('Java')?.repos).toBe(2)
    expect(por('C#')?.repos).toBe(1)
    expect(por('TypeScript')?.repos).toBe(2)
    expect(por('Python')?.repos).toBe(0)
    expect(por('React')?.repos).toBeUndefined()
    expect(por('Git')?.repos).toBeUndefined()
  })
})

describe('getAtividade', () => {
  it('computes from the calendar', async () => {
    const a = await getAtividade()
    expect(a).not.toBeNull()
    expect(typeof a?.totalAno).toBe('number')
  })
})
