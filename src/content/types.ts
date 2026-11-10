import type { Locale } from '@/i18n/routing'

export type Localized<T = string> = { pt: T; en: T }

export interface Perfil {
  nome: string
  cargo: Localized
  disponivel: boolean
  email: string
  links: { github: string; linkedin: string }
  /** Public paths, e.g. '/cv/joao-gabriel-pt.pdf' */
  cv: Partial<Record<Locale, string>>
  bio: Localized
}

export type SkillCategoria = 'frontend' | 'backend' | 'tools'

export interface Skill {
  nome: string
  categoria: SkillCategoria
  anos: number
  repos?: number
  aprendendo?: boolean
}

export interface Projeto {
  slug: string
  nome: string
  resumo: Localized
  descricao: Localized
  aprendizados: Localized
  linguagem: { nome: string; cor: string }
  stack: string[]
  estrelas: number
  /** ISO date */
  atualizadoEm: string
  repoUrl: string
  demoUrl?: string
  imagens: { src: string; alt: Localized }[]
  destaque: boolean
}
