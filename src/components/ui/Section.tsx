import type { ReactNode } from 'react'
import { Container } from './Container'

type SectionProps = {
  id: string
  titleId: string
  title: ReactNode
  children?: ReactNode
  className?: string
}

export function Section({
  id,
  titleId,
  title,
  children,
  className = '',
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`scroll-mt-16 py-16 md:py-24 ${className}`}
    >
      <Container>
        <h2 id={titleId} className="font-heading text-3xl md:text-5xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  )
}
