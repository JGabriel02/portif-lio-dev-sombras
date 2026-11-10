import { z } from 'zod'
import { ghGraphql, ghRest } from './client'
import { CalendarSchema, RepoSchema } from './schemas'
import type { Dia, Repo } from './schemas'

export async function getRepos(login: string): Promise<Repo[] | null> {
  const path = `/users/${login}/repos?per_page=100&type=owner&sort=pushed`
  const body = await ghRest(path)
  const envelope = z.array(z.unknown()).safeParse(body)
  if (!envelope.success) {
    console.warn('[github] schema mismatch', { path })
    return null
  }

  const repos: Repo[] = []
  for (const item of envelope.data) {
    const parsed = RepoSchema.safeParse(item)
    if (parsed.success) repos.push(parsed.data)
  }
  const dropped = envelope.data.length - repos.length
  if (dropped > 0) console.warn('[github] schema mismatch', { path, dropped })
  return repos
}

export const CALENDAR_QUERY = `query($login: String!) {
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
  const body = await ghGraphql(CALENDAR_QUERY, { login })
  const parsed = CalendarSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[github] schema mismatch', { path: 'graphql' })
    return null
  }
  return parsed.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (semana) => semana.contributionDays,
  )
}
