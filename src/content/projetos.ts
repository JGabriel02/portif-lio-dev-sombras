import type { ProjetoCurado } from './types'

export const projetos: ProjetoCurado[] = [
  {
    slug: 'npc-forge',
    repo: 'npc-forge',
    destaque: true,
    // TODO(conteúdo): revisar textos
    resumo: {
      pt: 'Gerador de NPCs para mesas de RPG, com atributos e histórias coerentes.',
      en: 'NPC generator for tabletop RPG, with coherent stats and backstories.',
    },
    descricao: {
      pt: 'Aplicação em C# que gera NPCs completos a partir de poucos parâmetros, com atributos, personalidade e ganchos de história.',
      en: 'C# application that generates complete NPCs from a few parameters, with stats, personality and story hooks.',
    },
    aprendizados: {
      pt: 'Modelagem de domínio, geração controlada por parâmetros e testes automatizados.',
      en: 'Domain modeling, parameter-driven generation and automated testing.',
    },
    stack: ['C#', '.NET'],
    imagens: [],
    fallback: { linguagem: 'C#', estrelas: 0, atualizadoEm: '2026-10-30' },
  },
  {
    slug: 'missions-api',
    repo: 'Missions_API',
    destaque: false,
    // TODO(conteúdo): revisar textos
    resumo: {
      pt: 'API REST em Java para cadastro e acompanhamento de missões.',
      en: 'Java REST API for creating and tracking missions.',
    },
    descricao: {
      pt: 'API em Java que permite criar, atualizar e consultar missões, com validação de entrada e persistência em banco de dados.',
      en: 'Java API to create, update and query missions, with input validation and database persistence.',
    },
    aprendizados: {
      pt: 'Desenho de endpoints REST, camadas de serviço e persistência de dados.',
      en: 'REST endpoint design, service layers and data persistence.',
    },
    stack: ['Java', 'REST', 'SQL'],
    imagens: [],
    fallback: { linguagem: 'Java', estrelas: 0, atualizadoEm: '2026-09-03' },
  },
  {
    slug: 'vacation-scheduler',
    repo: 'VacationSchedulerApplication',
    destaque: false,
    // TODO(conteúdo): revisar textos
    resumo: {
      pt: 'Aplicação para agendar férias de equipes, com front-end em vacation-scheduler-web.',
      en: 'Application for scheduling team vacations, with a front end in vacation-scheduler-web.',
    },
    descricao: {
      pt: 'Back-end em Java que organiza períodos de férias de uma equipe e evita conflitos; o front-end vive no repositório vacation-scheduler-web.',
      en: 'Java back end that organizes a team’s vacation periods and avoids conflicts; the front end lives in the vacation-scheduler-web repository.',
    },
    aprendizados: {
      pt: 'Regras de negócio com datas, integração entre back-end e front-end e testes de cenários.',
      en: 'Date-based business rules, back-end and front-end integration and scenario testing.',
    },
    stack: ['Java', 'vacation-scheduler-web'],
    imagens: [],
    fallback: { linguagem: 'Java', estrelas: 0, atualizadoEm: '2026-07-02' },
  },
  {
    slug: 'cardapio',
    repo: 'cardapio',
    destaque: false,
    // TODO(conteúdo): revisar textos
    resumo: {
      pt: 'Cardápio digital responsivo para restaurantes.',
      en: 'Responsive digital menu for restaurants.',
    },
    descricao: {
      pt: 'Cardápio online em TypeScript com categorias, busca e layout pensado para celular.',
      en: 'Online menu in TypeScript with categories, search and a mobile-first layout.',
    },
    aprendizados: {
      pt: 'Componentização, estado de interface e design responsivo.',
      en: 'Componentization, UI state and responsive design.',
    },
    stack: ['TypeScript', 'React'],
    imagens: [],
    fallback: {
      linguagem: 'TypeScript',
      estrelas: 3,
      atualizadoEm: '2025-09-25',
    },
  },
]
