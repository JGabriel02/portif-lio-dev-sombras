import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Coleta } from '@/components/analytics/Coleta'
import { renderWithIntl } from './test-utils'

vi.mock('next/navigation', () => ({ usePathname: () => '/pt' }))

const beacon = vi.fn()

beforeEach(() => {
  beacon.mockReset()
  Object.defineProperty(navigator, 'sendBeacon', {
    value: beacon,
    configurable: true,
  })
})

afterEach(() => {
  Object.defineProperty(navigator, 'doNotTrack', {
    value: null,
    configurable: true,
  })
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value: undefined,
    configurable: true,
  })
})

const corpos = () =>
  beacon.mock.calls.map(([, corpo]) => JSON.parse(corpo as string))

describe('Coleta', () => {
  it('sends a visit on mount with the referrer', () => {
    renderWithIntl(<Coleta />)
    expect(beacon).toHaveBeenCalledTimes(1)
    expect(beacon.mock.calls[0][0]).toBe('/api/coleta')
    expect(corpos()[0]).toEqual({
      t: 'v',
      caminho: '/pt',
      idioma: 'pt',
      ref: document.referrer,
    })
  })

  it('sends an event when clicking inside a data-evento element', () => {
    renderWithIntl(
      <>
        <Coleta />
        <a href="#x" data-evento="repo:npc-forge">
          <span>x</span>
        </a>
      </>,
    )
    beacon.mockClear()
    fireEvent.click(screen.getByText('x'))
    expect(corpos()).toEqual([
      { t: 'e', tipo: 'repo', alvo: 'npc-forge', idioma: 'pt' },
    ])
  })

  it('does nothing when doNotTrack is on', () => {
    Object.defineProperty(navigator, 'doNotTrack', {
      value: '1',
      configurable: true,
    })
    renderWithIntl(
      <>
        <Coleta />
        <a href="#x" data-evento="repo:a">
          x
        </a>
      </>,
    )
    fireEvent.click(screen.getByText('x'))
    expect(beacon).not.toHaveBeenCalled()
  })

  it('does nothing when Global Privacy Control is on', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    })
    renderWithIntl(<Coleta />)
    expect(beacon).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const { unmount } = renderWithIntl(
      <>
        <Coleta />
        <a href="#x" data-evento="repo:a">
          x
        </a>
      </>,
    )
    const link = screen.getByText('x')
    unmount()
    beacon.mockClear()
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(beacon).not.toHaveBeenCalled()
  })
})
