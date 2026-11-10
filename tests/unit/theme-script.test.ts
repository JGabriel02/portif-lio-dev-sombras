import { afterEach, describe, expect, it } from 'vitest'
import { resolveMode, themeScript } from '@/themes/theme-script'

function mockMatchMedia(prefersDark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

function clearCookie() {
  document.cookie = 'mode=; path=/; max-age=0'
}

describe('resolveMode', () => {
  it('honours a valid cookie over the system preference', () => {
    expect(resolveMode('dark', false)).toBe('dark')
    expect(resolveMode('shiny', true)).toBe('shiny')
  })

  it('falls back to the system preference without a cookie', () => {
    expect(resolveMode(undefined, true)).toBe('dark')
    expect(resolveMode(undefined, false)).toBe('shiny')
    expect(resolveMode('', false)).toBe('shiny')
  })

  it('ignores invalid cookie values', () => {
    expect(resolveMode('purple', true)).toBe('dark')
    expect(resolveMode('purple', false)).toBe('shiny')
  })
})

describe('themeScript', () => {
  afterEach(() => {
    clearCookie()
    const el = document.documentElement
    el.removeAttribute('data-theme')
    el.removeAttribute('data-mode')
    el.classList.remove('js')
  })

  it('sets theme, mode and js class (invalid cookie, prefers light)', () => {
    document.cookie = 'mode=purple; path=/'
    mockMatchMedia(false)
    new Function(themeScript)()
    const el = document.documentElement
    expect(el.dataset.theme).toBe('sombra')
    expect(el.dataset.mode).toBe('shiny')
    expect(el.classList.contains('js')).toBe(true)
  })

  it('finds the cookie when it is not the first one', () => {
    document.cookie = 'NEXT_LOCALE=pt; path=/'
    document.cookie = 'mode=dark; path=/'
    mockMatchMedia(false)
    new Function(themeScript)()
    expect(document.documentElement.dataset.mode).toBe('dark')
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
  })

  it('emits a real \\s in the cookie regex (not a stripped escape)', () => {
    expect(themeScript).toContain(String.raw`;\s*)mode=`)
  })

  it('uses the cookie when valid', () => {
    document.cookie = 'mode=dark; path=/'
    mockMatchMedia(false)
    new Function(themeScript)()
    expect(document.documentElement.dataset.mode).toBe('dark')
  })

  it('uses system preference without cookie', () => {
    mockMatchMedia(true)
    new Function(themeScript)()
    expect(document.documentElement.dataset.mode).toBe('dark')
  })
})

describe('themeScript with a malformed cookie', () => {
  afterEach(() => {
    clearCookie()
    document.documentElement.removeAttribute('data-mode')
  })

  it('falls back to prefers-color-scheme instead of the catch branch', () => {
    document.cookie = 'mode=%E0%A4%A; path=/'
    mockMatchMedia(false)
    new Function(themeScript)()
    expect(document.documentElement.dataset.mode).toBe('shiny')
  })
})
