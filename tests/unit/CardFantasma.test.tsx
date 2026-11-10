import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardFantasma } from '@/components/projetos/CardFantasma'
import type { Projeto } from '@/content'
import { renderWithIntl } from './test-utils'

const projeto: Projeto = {
  slug: 'npc-forge',
  nome: 'npc-forge',
  resumo: { pt: 'Resumo pt', en: 'Summary en' },
  descricao: { pt: 'd', en: 'd' },
  aprendizados: { pt: 'a', en: 'a' },
  linguagem: { nome: 'TypeScript', cor: '#3178C6' },
  stack: ['TypeScript'],
  estrelas: 24,
  atualizadoEm: '2026-11-07',
  repoUrl: 'https://github.com/x/npc-forge',
  demoUrl: 'https://demo.example.com',
  imagens: [],
  destaque: true,
}

describe('CardFantasma', () => {
  it('links the whole card to the detail page and shows stars', () => {
    const { container } = renderWithIntl(
      <CardFantasma projeto={projeto} locale="pt" />,
    )
    const main = container.querySelector('a[href="/pt/projetos/npc-forge"]')
    expect(main).not.toBeNull()
    expect(screen.getByText('★ 24')).toBeInTheDocument()
    expect(screen.getByText('Resumo pt')).toBeInTheDocument()
  })

  it('never nests anchors and keeps repo/demo links as siblings', () => {
    const { container } = renderWithIntl(
      <CardFantasma projeto={projeto} locale="pt" />,
    )
    expect(container.querySelectorAll('a a').length).toBe(0)
    expect(
      container.querySelector('a[href="https://github.com/x/npc-forge"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('a[href="https://demo.example.com"]'),
    ).not.toBeNull()
  })

  it('spans two columns when featured', () => {
    const { container } = renderWithIntl(
      <CardFantasma projeto={projeto} locale="pt" featured />,
    )
    expect(container.firstElementChild).toHaveClass('md:col-span-2')
  })

  it('does not span when not featured', () => {
    const { container } = renderWithIntl(
      <CardFantasma projeto={projeto} locale="en" />,
    )
    expect(container.firstElementChild).not.toHaveClass('md:col-span-2')
  })
})
