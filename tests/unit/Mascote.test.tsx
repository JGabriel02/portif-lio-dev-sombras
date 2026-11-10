import { act } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Mascote } from '@/components/mascote/Mascote'
import { MascoteSvg } from '@/components/mascote/MascoteSvg'
import { renderWithIntl } from './test-utils'

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function move(x: number, y: number) {
  act(() => {
    const ev = new Event('pointermove')
    Object.assign(ev, { clientX: x, clientY: y })
    window.dispatchEvent(ev)
    vi.advanceTimersByTime(20)
  })
}

const firstPupil = (c: HTMLElement) =>
  c.querySelectorAll('circle')[0]?.getAttribute('cx')

describe('Mascote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 220,
      height: 200,
      right: 220,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    mockMatchMedia(false)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is hidden from assistive tech', () => {
    const { container } = renderWithIntl(<Mascote />)
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  function fire(
    target: EventTarget,
    type: string,
    init: { relatedTarget?: EventTarget | null; pointerType?: string } = {},
  ) {
    act(() => {
      const ev = new MouseEvent(type, {
        bubbles: type !== 'pointerleave',
        relatedTarget: init.relatedTarget ?? null,
      })
      Object.defineProperty(ev, 'pointerType', { value: init.pointerType })
      target.dispatchEvent(ev)
    })
  }

  function moved(container: HTMLElement) {
    move(2000, 106)
    expect(Number(firstPupil(container))).toBeGreaterThan(86)
  }

  it('moves pupils toward the pointer', () => {
    const { container } = renderWithIntl(<Mascote />)
    expect(firstPupil(container)).toBe('86')
    moved(container)
  })

  it('resets when the pointer leaves the document element', () => {
    const { container } = renderWithIntl(<Mascote />)
    moved(container)
    fire(document.documentElement, 'pointerleave')
    expect(firstPupil(container)).toBe('86')
  })

  it('resets on pointerout with no relatedTarget (left the window)', () => {
    const { container } = renderWithIntl(<Mascote />)
    moved(container)
    fire(document.body, 'pointerout', { relatedTarget: document.body })
    expect(Number(firstPupil(container))).toBeGreaterThan(86)
    fire(document.body, 'pointerout', { relatedTarget: null })
    expect(firstPupil(container)).toBe('86')
  })

  it('resets on window blur', () => {
    const { container } = renderWithIntl(<Mascote />)
    moved(container)
    fire(window, 'blur')
    expect(firstPupil(container)).toBe('86')
  })

  it('resets when a touch pointer ends or is cancelled, not a mouse one', () => {
    const { container } = renderWithIntl(<Mascote />)
    moved(container)
    fire(window, 'pointerup', { pointerType: 'mouse' })
    expect(Number(firstPupil(container))).toBeGreaterThan(86)
    fire(window, 'pointerup', { pointerType: 'touch' })
    expect(firstPupil(container)).toBe('86')
    moved(container)
    fire(window, 'pointercancel', { pointerType: 'touch' })
    expect(firstPupil(container)).toBe('86')
  })

  it('removes every listener and cancels the frame on unmount', () => {
    const winAdd = vi.spyOn(window, 'addEventListener')
    const winRemove = vi.spyOn(window, 'removeEventListener')
    const rootAdd = vi.spyOn(document.documentElement, 'addEventListener')
    const rootRemove = vi.spyOn(document.documentElement, 'removeEventListener')
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const { unmount } = renderWithIntl(<Mascote />)
    unmount()
    const pairs = (
      add: { mock: { calls: unknown[][] } },
      remove: { mock: { calls: unknown[][] } },
      types: string[],
    ) => {
      for (const type of types) {
        const added = add.mock.calls.find((c) => c[0] === type)
        expect(added, `added ${type}`).toBeDefined()
        expect(remove.mock.calls).toContainEqual([type, added?.[1]])
      }
    }
    pairs(winAdd, winRemove, [
      'pointermove',
      'pointerout',
      'blur',
      'pointerup',
      'pointercancel',
    ])
    pairs(rootAdd, rootRemove, ['pointerleave'])
    expect(cancel).toHaveBeenCalled()
  })

  it('does not move under reduced motion', () => {
    mockMatchMedia(true)
    const { container } = renderWithIntl(<Mascote />)
    move(2000, 106)
    expect(firstPupil(container)).toBe('86')
  })

  it('keeps the svg markup under 3 KB', () => {
    const html = renderToStaticMarkup(
      <MascoteSvg
        pupils={[
          { dx: 0, dy: 0 },
          { dx: 0, dy: 0 },
        ]}
      />,
    )
    expect(html.length).toBeLessThan(3072)
  })
})
