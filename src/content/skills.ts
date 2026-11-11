import type { Skill } from './types'

// TODO(conteúdo): ajustar anos e categorias reais
export const skills: Skill[] = [
  { nome: 'C#', categoria: 'backend', anos: 3, linguagemGithub: 'C#' },
  { nome: 'Java', categoria: 'backend', anos: 3, linguagemGithub: 'Java' },
  { nome: 'Node.js', categoria: 'backend', anos: 3 },
  { nome: 'Python', categoria: 'backend', anos: 2, linguagemGithub: 'Python' },
  {
    nome: 'TypeScript',
    categoria: 'frontend',
    anos: 4,
    linguagemGithub: 'TypeScript',
  },
  {
    nome: 'JavaScript',
    categoria: 'frontend',
    anos: 4,
    linguagemGithub: 'JavaScript',
  },
  { nome: 'React', categoria: 'frontend', anos: 3 },
  { nome: 'Next.js', categoria: 'frontend', anos: 2 },
  { nome: 'Git', categoria: 'tools', anos: 4 },
  { nome: 'Docker', categoria: 'tools', anos: 2 },
  // TODO(conteúdo): confirmar anos de SQL
  { nome: 'SQL', categoria: 'tools', anos: 2 },
]
