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
  // Texto do portfólio antigo (meu-portfolio), revisado para PT/EN.
  bio: {
    pt: [
      'Olá! Meu nome é João Gabriel, e sou um desenvolvedor apaixonado por tecnologia, aprendizado contínuo e soluções criativas. Transformo ideias em código e ajudo novos talentos a brilharem no mundo tech. Desenvolvo aplicações web e mobile e compartilho dicas e conteúdos sobre frontend nas redes sociais para quem quer se aventurar nesse vasto universo da tecnologia.',
      'Sou de Alvorada/RS e apaixonado por games e futebol. Também gosto muito de tatuagens, e todas as minhas têm relação com o mundo geek. Meu Pokémon favorito é o Gengar e meu herói favorito é o Homem-Aranha. Adoro explorar lugares novos, principalmente os que têm comida boa, e minha comida favorita é um bom sushi.',
    ],
    en: [
      "Hi! I'm João Gabriel, a developer who loves technology, continuous learning and creative solutions. I turn ideas into code and help new talent shine in tech. I build web and mobile applications and share frontend tips and content on social media for anyone who wants to explore this vast world of technology.",
      "I'm from Alvorada, in southern Brazil, and I'm into games and football. I also love tattoos, and all of mine are geek-themed. My favorite Pokémon is Gengar and my favorite hero is Spider-Man. I enjoy exploring new places, especially ones with good food, and my favorite dish is a good sushi.",
    ],
  },
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
