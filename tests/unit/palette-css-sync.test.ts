import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sombra, type Mode, type TokenName } from '@/themes/palette'

const css = readFileSync('src/themes/sombra.css', 'utf8')

function block(mode: Mode): string {
  const open = `[data-theme="sombra"][data-mode="${mode}"]`
  const start = css.indexOf(open)
  if (start === -1) return ''
  return css.slice(start, css.indexOf('}', start))
}

describe('sombra.css matches palette.ts', () => {
  for (const mode of ['dark', 'shiny'] as const) {
    const body = block(mode).toLowerCase()
    it(`${mode} block exists`, () => expect(body).not.toBe(''))
    for (const token of Object.keys(sombra[mode]) as TokenName[])
      it(`${mode}: --${token}`, () =>
        expect(body).toContain(`--${token}: ${sombra[mode][token].toLowerCase()}`))
  }
})
