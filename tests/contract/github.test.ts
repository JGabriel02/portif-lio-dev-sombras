import { describe, expect, it } from 'vitest'
import { RepoSchema, getCalendario, getRepos } from '@/lib/github'

const LOGIN = 'JGabriel02'

describe.skipIf(!process.env.GITHUB_TOKEN)('GitHub API (contrato real)', () => {
  it('getRepos retorna repositórios que passam no RepoSchema', async () => {
    const repos = await getRepos(LOGIN)
    expect(repos).not.toBeNull()
    expect(repos!.length).toBeGreaterThan(0)
    for (const repo of repos!) {
      expect(RepoSchema.safeParse(repo).success).toBe(true)
    }
  })

  it('getCalendario retorna pelo menos 300 dias', async () => {
    const dias = await getCalendario(LOGIN)
    expect(dias).not.toBeNull()
    expect(dias!.length).toBeGreaterThanOrEqual(300)
  })
})
