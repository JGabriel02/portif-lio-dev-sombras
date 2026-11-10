'use client'

import { Moon, Sparkles } from 'lucide-react'
import type { Mode } from '@/themes/palette'

type ModeToggleProps = {
  labels: { toShiny: string; toDark: string }
}

/**
 * Stateless: the current mode lives only in `<html data-mode>`. Both icons and
 * both visually hidden labels are rendered and switched by CSS (see
 * `.mode-when-*` in globals.css), so there is no flicker before hydration and
 * the accessible name always names the mode the click switches to.
 */
export function ModeToggle({ labels }: ModeToggleProps) {
  function toggle() {
    const root = document.documentElement
    const next: Mode = root.dataset.mode === 'shiny' ? 'dark' : 'shiny'
    root.dataset.mode = next
    document.cookie = `mode=${next}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
    >
      <Sparkles aria-hidden="true" size={20} className="mode-when-dark" />
      <Moon aria-hidden="true" size={20} className="mode-when-shiny" />
      <span className="mode-when-dark sr-only">{labels.toShiny}</span>
      <span className="mode-when-shiny sr-only">{labels.toDark}</span>
    </button>
  )
}
