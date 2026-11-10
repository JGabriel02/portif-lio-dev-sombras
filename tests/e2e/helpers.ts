import type { BrowserContext } from '@playwright/test'
import pt from '../../src/content/messages/pt.json'
import en from '../../src/content/messages/en.json'

export const locales = ['pt', 'en'] as const
export const modes = ['dark', 'shiny'] as const
export type Locale = (typeof locales)[number]
export type Mode = (typeof modes)[number]

export const messages = { pt, en } as const

export async function setMode(context: BrowserContext, mode: Mode) {
  await context.addCookies([
    { name: 'mode', value: mode, url: 'http://localhost:3000' },
  ])
}
