import type { ComponentPropsWithoutRef } from 'react'

type Variant = 'primary' | 'secondary'

type CommonProps = { variant?: Variant }
type AnchorProps = CommonProps &
  ComponentPropsWithoutRef<'a'> & { href: string }
type NativeButtonProps = CommonProps &
  ComponentPropsWithoutRef<'button'> & { href?: undefined }

export type ButtonProps = AnchorProps | NativeButtonProps

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border-line text-text hover:bg-surface-raised border',
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant = 'primary', className = '', ...rest } = props
    return (
      <a className={`${base} ${variants[variant]} ${className}`} {...rest} />
    )
  }
  const {
    variant = 'primary',
    className = '',
    type = 'button',
    ...rest
  } = props
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
