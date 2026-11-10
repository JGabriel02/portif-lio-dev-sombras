import { describe, expect, it } from 'vitest'
import { githubLogin } from '@/lib/github/login'

describe('githubLogin', () => {
  it('extracts the login', () => {
    expect(githubLogin('https://github.com/JGabriel02')).toBe('JGabriel02')
  })
  it('tolerates a trailing slash', () => {
    expect(githubLogin('https://github.com/JGabriel02/')).toBe('JGabriel02')
  })
  it('returns null for non-GitHub or invalid urls', () => {
    expect(githubLogin('https://gitlab.com/x')).toBeNull()
    expect(githubLogin('nope')).toBeNull()
    expect(githubLogin('https://github.com/')).toBeNull()
  })
})
