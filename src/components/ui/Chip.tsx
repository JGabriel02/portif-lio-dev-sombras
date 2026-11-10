import type { ComponentPropsWithoutRef } from 'react'

type ChipProps = ComponentPropsWithoutRef<'span'> & {
  tone?: 'default' | 'accent'
}

export function Chip({
  tone = 'default',
  className = '',
  ...props
}: ChipProps) {
  const toneClass =
    tone === 'accent' ? 'bg-accent text-on-accent' : 'bg-chip text-chip'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${toneClass} ${className}`}
      {...props}
    />
  )
}
