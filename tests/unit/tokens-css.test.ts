import { readFileSync } from 'node:fs'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

async function build(candidates: string[]): Promise<string> {
  const source = `${readFileSync('src/themes/tokens.css', 'utf8')}\n@tailwind utilities;`
  const { build: run } = await compile(source)
  return run(candidates)
}

function rule(css: string, selector: string): string {
  const start = css.indexOf(selector)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

describe('tokens.css compiled with Tailwind', () => {
  it('text-chip resolves only to --chip-text', async () => {
    const body = rule(await build(['text-chip']), '.text-chip')
    expect(body).toContain('var(--chip-text)')
    expect(body).not.toContain('--chip-bg')
  })

  it('bg-chip resolves only to --chip-bg', async () => {
    const body = rule(await build(['bg-chip']), '.bg-chip')
    expect(body).toContain('var(--chip-bg)')
    expect(body).not.toContain('--chip-text')
  })

  it('has no self-referencing font variables', async () => {
    const css = await build(['font-heading', 'font-body'])
    expect(css).not.toMatch(/--font-heading:\s*var\(--font-heading\)/)
    expect(css).not.toMatch(/--font-body:\s*var\(--font-body\)/)
    expect(css).toContain('var(--font-space-grotesk)')
    expect(css).toContain('var(--font-inter)')
  })
})
