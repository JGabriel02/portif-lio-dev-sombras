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

  it('moves pupils toward the pointer and resets on leave', () => {
    const { container } = renderWithIntl(<Mascote />)
    expect(firstPupil(container)).toBe('86')
    move(2000, 106)
    expect(Number(firstPupil(container))).toBeGreaterThan(86)
    act(() => {
      document.dispatchEvent(new Event('pointerleave'))
    })
    expect(firstPupil(container)).toBe('86')
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
