import type { Perfil } from './types'

export const perfil: Perfil = {
  nome: 'João Gabriel',
  cargo: { pt: 'Desenvolvedor full stack', en: 'Full stack developer' },
  disponivel: true,
  email: 'joaogabrielrocha.dev@gmail.com',
  links: {
    github: 'https://github.com/JGabriel02',
    // TODO(conteúdo): substituir pelo link real
    linkedin: 'https://www.linkedin.com/in/joaogabriel',
  },
  cv: {
    pt: '/cv/joao-gabriel-pt.pdf',
    en: '/cv/joao-gabriel-en.pdf',
  },
  // Intro profissional (revisável). O destaque fica no meio da tupla.
  intro: {
    pt: [
      'Desenvolvedor focado em ',
      'Java, C# e APIs REST',
      '. Transformo ideias em código, gosto de aprender todo dia e de ajudar quem está começando na área.',
    ],
    en: [
      'developer focused on ',
      'Java, C# and REST APIs',
      '. I turn ideas into code, love learning every day and enjoy helping people who are just starting out in tech.',
    ],
  },
  cidade: 'Alvorada/RS',
  // Do portfólio antigo, em formato de figurinhas.
  curiosidades: [
    { emoji: '🎮', texto: { pt: 'Games', en: 'Games' } },
    { emoji: '⚽', texto: { pt: 'Futebol', en: 'Football' } },
    { emoji: '🖋️', texto: { pt: 'Tatuagens geek', en: 'Geek tattoos' } },
    {
      emoji: '👻',
      texto: { pt: 'Pokémon favorito: Gengar', en: 'Favorite Pokémon: Gengar' },
    },
    {
      emoji: '🕷️',
      texto: {
        pt: 'Herói favorito: Homem-Aranha',
        en: 'Favorite hero: Spider-Man',
      },
    },
    { emoji: '🍣', texto: { pt: 'Sushi', en: 'Sushi' } },
    {
      emoji: '🧭',
      texto: { pt: 'Explorar lugares novos', en: 'Exploring new places' },
    },
  ],
  idiomas: [
    {
      idioma: { pt: 'Português', en: 'Portuguese' },
      nivel: { pt: 'Nativo', en: 'Native' },
    },
    {
      idioma: { pt: 'Inglês', en: 'English' },
      nivel: { pt: 'Intermediário', en: 'Intermediate' },
    },
  ],
  educacao: [
    {
      curso: {
        pt: 'Bacharelado em Ciência da Computação',
        en: "Bachelor's in Computer Science",
      },
      instituicao: 'SENAC/RS',
      status: 'cursando',
    },
    {
      curso: {
        pt: 'Análise e Desenvolvimento de Sistemas (superior)',
        en: 'Systems Analysis and Development (degree)',
      },
      instituicao: 'SENAC/RS',
      status: 'concluido',
    },
  ],
}
