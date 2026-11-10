import { describe, expect, it } from 'vitest'
import { pupilOffset } from '@/components/mascote/eyeMath'

describe('pupilOffset', () => {
  it('points right at max x', () => {
    expect(pupilOffset({ x: 0, y: 0 }, { x: 100, y: 0 })).toEqual({
      dx: 5,
      dy: 0,
    })
  })

  it('points down at max y', () => {
    expect(pupilOffset({ x: 0, y: 0 }, { x: 0, y: 100 }).dy).toBeCloseTo(3.5)
  })

  it('returns zero when pointer is on the eye', () => {
    expect(pupilOffset({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual({
      dx: 0,
      dy: 0,
    })
  })

  it('never exceeds the max for random pointers', () => {
    for (let i = 0; i < 50; i++) {
      const { dx, dy } = pupilOffset(
        { x: 10, y: 20 },
        { x: Math.random() * 4000 - 2000, y: Math.random() * 4000 - 2000 },
      )
      expect(Math.abs(dx)).toBeLessThanOrEqual(5)
      expect(Math.abs(dy)).toBeLessThanOrEqual(3.5)
    }
  })
})
