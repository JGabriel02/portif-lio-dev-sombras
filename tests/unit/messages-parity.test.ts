import { describe, expect, it } from 'vitest'
import en from '@/content/messages/en.json'
import pt from '@/content/messages/pt.json'

function flatten(obj: object, prefix = ''): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      if (value !== null && typeof value === 'object') {
        Object.assign(acc, flatten(value, path))
      } else {
        acc[path] = value
      }
      return acc
    },
    {},
  )
}

describe('messages parity', () => {
  const flatPt = flatten(pt)
  const flatEn = flatten(en)

  it('pt and en have exactly the same keys', () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatPt).sort())
  })

  it('no value is an empty string', () => {
    for (const [key, value] of [
      ...Object.entries(flatPt),
      ...Object.entries(flatEn),
    ]) {
      expect(typeof value, key).toBe('string')
      expect((value as string).trim(), key).not.toBe('')
    }
  })
})
