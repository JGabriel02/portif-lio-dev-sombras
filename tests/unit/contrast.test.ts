import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/lib/contrast'
import { sombra, type TokenName } from '@/themes/palette'

const pairs: [fg: TokenName, bg: TokenName, min: number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['chip-text', 'chip-bg', 4.5],
  ['accent', 'bg', 3],
  ['accent', 'surface', 3],
  ['focus-ring', 'bg', 3],
  ['eye', 'bg', 3],
]

describe('contrast', () => {
  it('contrastRatio white/black is 21', () =>
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1))
  for (const mode of ['dark', 'shiny'] as const)
    for (const [fg, bg, min] of pairs)
      it(`${mode}: ${fg} on ${bg} >= ${min}`, () =>
        expect(contrastRatio(sombra[mode][fg], sombra[mode][bg])).toBeGreaterThanOrEqual(min))
})
