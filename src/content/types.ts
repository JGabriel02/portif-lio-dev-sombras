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
  /** Paragraphs of the "Sobre mim" text. */
  bio: Localized<string[]>
  idiomas: { idioma: Localized; nivel: Localized }[]
  educacao: {
    curso: Localized
    instituicao?: string
    /** Shown as a badge: "cursando" / "concluído". */
    status?: 'cursando' | 'concluido'
  }[]
}

export type SkillCategoria = 'frontend' | 'backend' | 'tools'

export interface Skill {
  nome: string
  categoria: SkillCategoria
  anos: number
  /** Primary language name on GitHub, used to count public repos. */
  linguagemGithub?: string
  /** Filled at runtime from GitHub data; never authored. */
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
  fonte: 'github' | 'fallback'
}

export interface ProjetoCurado {
  /** Site route */
  slug: string
  /** Repository name under the owner's GitHub account */
  repo: string
  /** Exactly one is true */
  destaque: boolean
  resumo: Localized
  descricao: Localized
  aprendizados: Localized
  stack: string[]
  /** Wins over the GitHub homepage */
  demoUrl?: string
  /** Never show an app link, even if the GitHub repo has a homepage. */
  ocultarDemo?: boolean
  imagens: { src: string; alt: Localized }[]
  fallback: {
    linguagem: string
    estrelas: number
    /** ISO date */
    atualizadoEm: string
  }
}
