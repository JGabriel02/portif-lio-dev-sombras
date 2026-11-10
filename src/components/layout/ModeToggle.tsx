'use client'

import { Moon, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Mode } from '@/themes/palette'

type ModeToggleProps = {
  labels: { toShiny: string; toDark: string }
}

export function ModeToggle({ labels }: ModeToggleProps) {
  // Unknown until mounted: avoids a hydration mismatch with the anti-flash script.
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with DOM mode set by the inline script
    setMode(
      document.documentElement.dataset.mode === 'shiny' ? 'shiny' : 'dark',
    )
  }, [])

  function toggle() {
    const next: Mode = mode === 'dark' ? 'shiny' : 'dark'
    document.documentElement.dataset.mode = next
    document.cookie = `mode=${next}; path=/; max-age=31536000; samesite=lax`
    setMode(next)
  }

  const label = mode === 'shiny' ? labels.toDark : labels.toShiny
  const Icon = mode === 'shiny' ? Moon : Sparkles

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
    >
      <Icon aria-hidden="true" size={20} />
    </button>
  )
}
