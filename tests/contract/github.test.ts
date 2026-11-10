import { describe, expect, it } from 'vitest'
import {
  CALENDAR_QUERY,
  CalendarSchema,
  RepoSchema,
  getCalendario,
  getRepos,
  ghGraphql,
  ghRest,
} from '@/lib/github'

const LOGIN = 'JGabriel02'

describe.skipIf(!process.env.GITHUB_TOKEN)('GitHub API (contrato real)', () => {
  it('REST bruto: todo item passa no RepoSchema', async () => {
    const body = await ghRest(
      `/users/${LOGIN}/repos?per_page=100&type=owner&sort=pushed`,
    )
    expect(Array.isArray(body)).toBe(true)
    const items = body as unknown[]
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(RepoSchema.safeParse(item).success).toBe(true)
    }
  })

  it('GraphQL bruto: resposta passa no CalendarSchema', async () => {
    const body = await ghGraphql(CALENDAR_QUERY, { login: LOGIN })
    expect(CalendarSchema.safeParse(body).success).toBe(true)
  })

  it('getRepos retorna repositórios', async () => {
    const repos = await getRepos(LOGIN)
    expect(repos).not.toBeNull()
    expect(repos!.length).toBeGreaterThan(0)
  })

  it('getCalendario retorna pelo menos 300 dias', async () => {
    const dias = await getCalendario(LOGIN)
    expect(dias).not.toBeNull()
    expect(dias!.length).toBeGreaterThanOrEqual(300)
  })
})
