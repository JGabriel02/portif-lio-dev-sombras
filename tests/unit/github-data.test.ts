import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import calendarFixture from '../fixtures/github/calendar.json'
import reposFixture from '../fixtures/github/repos.json'
import { calcularAtividade } from '@/lib/github/atividade'
import { corDaLinguagem } from '@/lib/github/cores'
import { contarPorLinguagem } from '@/lib/github/linguagens'
import { getCalendario, getRepos } from '@/lib/github/repos'
import type { Dia, Repo } from '@/lib/github/schemas'

const rest = vi.hoisted(() => vi.fn())
const graphql = vi.hoisted(() => vi.fn())
vi.mock('@/lib/github/client', () => ({ ghRest: rest, ghGraphql: graphql }))

const dia = (date: string, contributionCount: number): Dia => ({
  date,
  contributionCount,
})

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  rest.mockReset()
  graphql.mockReset()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

describe('getRepos', () => {
  it('drops invalid items and keeps valid ones', async () => {
    rest.mockResolvedValue(reposFixture)
    const repos = await getRepos('JGabriel02')
    expect(rest).toHaveBeenCalledWith(
      '/users/JGabriel02/repos?per_page=100&type=owner&sort=pushed',
    )
    expect(repos).toHaveLength(reposFixture.length - 1)
    expect(repos?.map((r) => r.name)).toContain('npc-forge')
    expect(repos?.find((r) => r.name === 'cardapio')?.stargazers_count).toBe(3)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('[github] schema mismatch', {
      path: '/users/JGabriel02/repos?per_page=100&type=owner&sort=pushed',
      dropped: 1,
    })
  })

  it('returns null for non-array body', async () => {
    rest.mockResolvedValue({ message: 'Not Found' })
    expect(await getRepos('JGabriel02')).toBeNull()
    expect(warn).toHaveBeenCalledWith('[github] schema mismatch', {
      path: '/users/JGabriel02/repos?per_page=100&type=owner&sort=pushed',
    })
    rest.mockResolvedValue(null)
    expect(await getRepos('JGabriel02')).toBeNull()
  })
})

describe('getCalendario', () => {
  it('flattens weeks into days', async () => {
    graphql.mockResolvedValue(calendarFixture)
    const dias = await getCalendario('JGabriel02')
    expect(dias?.length).toBeGreaterThan(300)
    expect(dias?.find((d) => d.date === '2026-11-10')?.contributionCount).toBe(
      5,
    )
  })

  it('returns null for invalid data', async () => {
    graphql.mockResolvedValue({ user: null })
    expect(await getCalendario('JGabriel02')).toBeNull()
    expect(warn).toHaveBeenCalledWith('[github] schema mismatch', {
      path: 'graphql',
    })
    graphql.mockResolvedValue(null)
    expect(await getCalendario('JGabriel02')).toBeNull()
  })
})

describe('contarPorLinguagem', () => {
  it('ignores forks and null language', async () => {
    rest.mockResolvedValue(reposFixture)
    const repos = (await getRepos('JGabriel02')) as Repo[]
    const contagem = contarPorLinguagem(repos)
    expect(contagem.get('Java')).toBe(2)
    expect(contagem.get('TypeScript')).toBe(2)
    expect(contagem.get('C#')).toBe(1)
    expect(contagem.has('Python')).toBe(false)
    expect(contagem.size).toBe(3)
  })
})

describe('corDaLinguagem', () => {
  it('known and unknown', () => {
    expect(corDaLinguagem('C#')).toBe('#178600')
    expect(corDaLinguagem('Java')).toBe('#B07219')
    expect(corDaLinguagem('TypeScript')).toBe('#3178C6')
    expect(corDaLinguagem('Brainfuck')).toBe('#8B8B9A')
    expect(corDaLinguagem('toString')).toBe('#8B8B9A')
  })
})

describe('calcularAtividade', () => {
  const dias =
    calendarFixture.user.contributionsCollection.contributionCalendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => dia(d.date, d.contributionCount))

  it('counts from today when today > 0', () => {
    const r = calcularAtividade(dias, new Date('2026-11-10T15:00:00Z'))
    expect(r.sequenciaAtual).toBe(3) // 10, 09, 08; 07 is 0
    expect(r.ano).toBe(2026)
  })

  it('counts from yesterday when today is 0', () => {
    const r = calcularAtividade(dias, new Date('2026-11-11T15:00:00Z'))
    expect(r.sequenciaAtual).toBe(3)
  })

  it('stops at a one-day gap', () => {
    const r = calcularAtividade(
      [dia('2026-11-10', 1), dia('2026-11-09', 1), dia('2026-11-07', 9)],
      new Date('2026-11-10T15:00:00Z'),
    )
    expect(r.sequenciaAtual).toBe(2)
  })

  it('totalAno only sums current year across a year boundary', () => {
    const r = calcularAtividade(dias, new Date('2026-11-10T15:00:00Z'))
    const esperado = dias
      .filter((d) => d.date.startsWith('2026-'))
      .reduce((s, d) => s + d.contributionCount, 0)
    expect(r.totalAno).toBe(esperado)
    expect(r.totalAno).toBe(14)
    const anterior = calcularAtividade(dias, new Date('2025-12-31T15:00:00Z'))
    expect(anterior).toMatchObject({ ano: 2025, totalAno: 7 })
  })

  it('empty calendar → { sequenciaAtual: 0, totalAno: 0 }', () => {
    expect(calcularAtividade([], new Date('2026-11-10T15:00:00Z'))).toEqual({
      sequenciaAtual: 0,
      totalAno: 0,
      ano: 2026,
    })
  })

  it('23:30 São Paulo (02:30Z next day) still uses the São Paulo date', () => {
    const d = [dia('2026-12-30', 1), dia('2026-12-31', 3), dia('2027-01-01', 7)]
    const r = calcularAtividade(d, new Date('2027-01-01T02:30:00Z'))
    expect(r).toEqual({ sequenciaAtual: 2, totalAno: 4, ano: 2026 })
  })

  it('00:30 São Paulo uses the new São Paulo day; yesterday keeps the streak', () => {
    const d = [dia('2026-12-30', 1), dia('2026-12-31', 3), dia('2027-01-01', 0)]
    const r = calcularAtividade(d, new Date('2027-01-01T03:30:00Z'))
    expect(r).toEqual({ sequenciaAtual: 2, totalAno: 0, ano: 2027 })
  })
})
