import { z } from 'zod'

export const RepoSchema = z.object({
  name: z.string(),
  html_url: z.url(),
  stargazers_count: z.number().int(),
  language: z.string().nullable(),
  pushed_at: z.string(),
  homepage: z.string().nullable().optional(),
  fork: z.boolean(),
})
export type Repo = z.infer<typeof RepoSchema>

const DiaSchema = z.object({
  date: z.string(),
  contributionCount: z.number(),
})
export type Dia = z.infer<typeof DiaSchema>

export const CalendarSchema = z.object({
  user: z.object({
    contributionsCollection: z.object({
      contributionCalendar: z.object({
        totalContributions: z.number(),
        weeks: z.array(z.object({ contributionDays: z.array(DiaSchema) })),
      }),
    }),
  }),
})
export type Calendar = z.infer<typeof CalendarSchema>
