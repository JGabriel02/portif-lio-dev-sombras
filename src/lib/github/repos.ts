import { z } from 'zod'
import { ghGraphql, ghRest } from './client'
import { CalendarSchema, RepoSchema } from './schemas'
import type { Dia, Repo } from './schemas'

export async function getRepos(login: string): Promise<Repo[] | null> {
  const body = await ghRest(
    `/users/${login}/repos?per_page=100&type=owner&sort=pushed`,
  )
  const envelope = z.array(z.unknown()).safeParse(body)
  if (!envelope.success) return null

  const repos: Repo[] = []
  for (const item of envelope.data) {
    const parsed = RepoSchema.safeParse(item)
    if (parsed.success) repos.push(parsed.data)
  }
  return repos
}

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`

export async function getCalendario(login: string): Promise<Dia[] | null> {
  const body = await ghGraphql(QUERY, { login })
  const parsed = CalendarSchema.safeParse(body)
  if (!parsed.success) return null
  return parsed.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (semana) => semana.contributionDays,
  )
}
