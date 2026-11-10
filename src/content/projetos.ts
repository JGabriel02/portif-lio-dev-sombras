import type { Projeto } from './types'

// TODO(conteúdo): substituir pelos projetos reais
export const projetos: Projeto[] = [
  {
    slug: 'npc-forge',
    nome: 'npc-forge',
    resumo: {
      pt: 'Gerador de NPCs para mesas de RPG, com atributos e histórias coerentes.',
      en: 'NPC generator for tabletop RPG, with coherent stats and backstories.',
    },
    descricao: {
      pt: 'Aplicação web que gera NPCs completos a partir de poucos parâmetros, com atributos, personalidade e ganchos de história, e permite exportar o resultado.',
      en: 'Web app that generates complete NPCs from a few parameters, with stats, personality and story hooks, and lets you export the result.',
    },
    aprendizados: {
      pt: 'Modelagem de dados tipada, geração determinística com seeds e testes de propriedades.',
      en: 'Typed data modeling, deterministic seeded generation and property-based testing.',
    },
    linguagem: { nome: 'TypeScript', cor: '#3178C6' },
    stack: ['TypeScript', 'React', 'Next.js'],
    estrelas: 24,
    atualizadoEm: '2026-11-07',
    repoUrl: 'https://github.com/joaogabriel/npc-forge',
    imagens: [],
    destaque: true,
  },
  {
    slug: 'geje-api',
    nome: 'geje-api',
    resumo: {
      pt: 'API REST para gestão de eventos, com autenticação e documentação OpenAPI.',
      en: 'REST API for event management, with authentication and OpenAPI docs.',
    },
    descricao: {
      pt: 'API em Node.js para cadastro e gestão de eventos, com autenticação por token, validação de entrada e documentação gerada automaticamente.',
      en: 'Node.js API for creating and managing events, with token authentication, input validation and auto-generated documentation.',
    },
    aprendizados: {
      pt: 'Desenho de contratos de API, migrações de banco e observabilidade básica.',
      en: 'API contract design, database migrations and basic observability.',
    },
    linguagem: { nome: 'Node.js', cor: '#3C873A' },
    stack: ['Node.js', 'SQL', 'Docker'],
    estrelas: 9,
    atualizadoEm: '2026-10-21',
    repoUrl: 'https://github.com/joaogabriel/geje-api',
    imagens: [],
    destaque: false,
  },
  {
    slug: 'painel-metricas',
    nome: 'painel-metricas',
    resumo: {
      pt: 'Painel de métricas em tempo real com gráficos acessíveis.',
      en: 'Real-time metrics dashboard with accessible charts.',
    },
    descricao: {
      pt: 'Dashboard que consome eventos em streaming e exibe gráficos com alternativas textuais e navegação por teclado.',
      en: 'Dashboard that consumes streaming events and renders charts with text alternatives and keyboard navigation.',
    },
    aprendizados: {
      pt: 'Renderização incremental, acessibilidade em visualização de dados e ajuste de desempenho.',
      en: 'Incremental rendering, data-visualization accessibility and performance tuning.',
    },
    linguagem: { nome: 'TypeScript', cor: '#3178C6' },
    stack: ['TypeScript', 'React', 'Node.js'],
    estrelas: 5,
    atualizadoEm: '2026-09-12',
    repoUrl: 'https://github.com/joaogabriel/painel-metricas',
    imagens: [],
    destaque: false,
  },
]
