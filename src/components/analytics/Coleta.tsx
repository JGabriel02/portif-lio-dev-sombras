'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useRef } from 'react'

function enviar(corpo: Record<string, string>) {
  if (typeof navigator.sendBeacon !== 'function') return
  navigator.sendBeacon('/api/coleta', JSON.stringify(corpo))
}

function recusado() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true
}

export function Coleta(): null {
  const pathname = usePathname()
  const idioma = useLocale()
  const primeira = useRef(true)
  const idiomaRef = useRef(idioma)
  useEffect(() => {
    idiomaRef.current = idioma
  }, [idioma])

  useEffect(() => {
    if (recusado()) return
    const ref = primeira.current ? document.referrer : location.origin
    primeira.current = false
    enviar({ t: 'v', caminho: pathname, idioma: idiomaRef.current, ref })
  }, [pathname])

  useEffect(() => {
    if (recusado()) return
    const aoClicar = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-evento]')
      const valor = el?.getAttribute('data-evento')
      if (!valor) return
      const [tipo, alvo] = valor.split(':', 2)
      enviar({ t: 'e', tipo, alvo, idioma: idiomaRef.current })
    }
    document.addEventListener('click', aoClicar, { capture: true })
    return () =>
      document.removeEventListener('click', aoClicar, { capture: true })
  }, [])

  return null
}
