import { describe, expect, it } from 'vitest'
import { relativeTime } from '@/lib/relativeTime'

const now = new Date('2026-11-10T00:00:00Z')

describe('relativeTime', () => {
  it('formats days in pt', () => {
    expect(relativeTime('2026-11-07T00:00:00Z', 'pt', now)).toBe('há 3 dias')
  })
  it('formats days in en', () => {
    expect(relativeTime('2026-11-07T00:00:00Z', 'en', now)).toBe('3 days ago')
  })
  it('uses larger units for older dates', () => {
    expect(relativeTime('2026-08-10T00:00:00Z', 'en', now)).toBe('3 months ago')
    expect(relativeTime('2024-11-10T00:00:00Z', 'en', now)).toBe('2 years ago')
  })
})
