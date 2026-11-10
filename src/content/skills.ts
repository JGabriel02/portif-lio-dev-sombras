import type { Skill } from './types'

// TODO(conteúdo): ajustar anos e repositórios reais
export const skills: Skill[] = [
  { nome: 'TypeScript', categoria: 'frontend', anos: 4, repos: 18 },
  { nome: 'React', categoria: 'frontend', anos: 4, repos: 14 },
  { nome: 'Next.js', categoria: 'frontend', anos: 3, repos: 8 },
  { nome: 'Node.js', categoria: 'backend', anos: 4, repos: 12 },
  { nome: 'SQL', categoria: 'backend', anos: 3, repos: 9 },
  { nome: 'Docker', categoria: 'tools', anos: 3, repos: 7 },
  { nome: 'Git', categoria: 'tools', anos: 5, repos: 30 },
  { nome: 'Rust', categoria: 'backend', anos: 0, aprendendo: true },
]
