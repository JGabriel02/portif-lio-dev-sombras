import type { ComponentPropsWithoutRef, ElementType } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

export function Card<T extends ElementType = 'div'>({
  as,
  className = '',
  ...props
}: CardProps<T>) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      className={`bg-surface border-line rounded-card border ${className}`}
      {...props}
    />
  )
}
