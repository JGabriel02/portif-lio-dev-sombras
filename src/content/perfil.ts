import type { Perfil } from './types'

export const perfil: Perfil = {
  nome: 'João Gabriel',
  cargo: { pt: 'Desenvolvedor full stack', en: 'Full stack developer' },
  disponivel: true,
  // TODO(conteúdo): substituir pelo e-mail real
  email: 'contato@exemplo.com',
  links: {
    github: 'https://github.com/JGabriel02',
    // TODO(conteúdo): substituir pelo link real
    linkedin: 'https://www.linkedin.com/in/joaogabriel',
  },
  cv: {
    pt: '/cv/joao-gabriel-pt.pdf',
    en: '/cv/joao-gabriel-en.pdf',
  },
  // TODO(conteúdo): substituir pela bio real
  bio: {
    pt: 'Desenvolvedor full stack que gosta de transformar problemas confusos em software simples de usar. Trabalho do banco de dados à interface, com atenção a desempenho, acessibilidade e código fácil de manter.',
    en: 'Full stack developer who likes turning messy problems into software that is simple to use. I work from the database to the interface, with attention to performance, accessibility and maintainable code.',
  },
}
