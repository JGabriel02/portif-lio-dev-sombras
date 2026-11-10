# Portfólio — Parte 2: Integração com o GitHub

- **Data:** 2026-11-10
- **Status:** aguardando revisão
- **Depende de:** Parte 1 (`2026-11-10-portfolio-site-publico-design.md`), já na `main`.

## 1. Objetivo

Trocar os números inventados do site por dados reais do GitHub do dono (`JGabriel02`), mantendo a curadoria manual de quais projetos aparecem e com textos PT/EN.

**Critérios de sucesso**

1. Os cards de projeto mostram estrelas, linguagem, cor da linguagem e data do último push reais. Eles se atualizam sozinhos em até 1 hora, sem deploy.
2. A seção Skills mostra quantos repositórios públicos usam cada linguagem, calculado automaticamente.
3. Um card "Atividade no GitHub" mostra a sequência de dias com contribuição e o total do ano.
4. Sem token, com o GitHub fora do ar ou com uma resposta inesperada, o site continua funcionando com os dados de fallback do arquivo curado. Nenhuma página quebra.
5. Os testes (unit e e2e) não acessam a internet.

## 2. Decisões

| Decisão | Escolha |
|---|---|
| Fonte da lista | **Curada** num arquivo. O GitHub só fornece dados vivos. |
| Token | **`GITHUB_TOKEN`** fine-grained, somente leitura de repositórios públicos, guardado nas variáveis da Vercel. Nunca é `NEXT_PUBLIC_`. |
| Busca | No servidor, com `fetch` + ISR (`revalidate: 3600`) e fallback local. Sem banco e sem job agendado. |
| Usuário | `JGabriel02`, derivado de `perfil.links.github`. |
| Fuso da sequência | `America/Sao_Paulo`. |

**Fora do escopo:** a curadoria pelo painel (Parte 4), o banco de dados, repositórios privados e organizações.

## 3. Modelo de dados

### 3.1 Curadoria (`src/content/projetos.ts`)

```ts
interface ProjetoCurado {
  slug: string                    // rota do site
  repo: string                    // nome do repositório em github.com/JGabriel02
  destaque: boolean               // exatamente 1 true
  resumo: Localized
  descricao: Localized
  aprendizados: Localized
  stack: string[]
  demoUrl?: string                // vence a homepage do GitHub
  imagens: { src: string; alt: Localized }[]
  fallback: { linguagem: string; estrelas: number; atualizadoEm: string /* ISO */ }
}
```

Conteúdo inicial (rascunhos marcados `TODO(conteúdo)` para o dono revisar):

- `npc-forge` (destaque)
- `Missions_API`
- `VacationSchedulerApplication`, com `stack` citando o front `vacation-scheduler-web`
- `cardapio`

Os projetos de exemplo da Parte 1 (`geje-api`, `painel-metricas`) são removidos.

### 3.2 Projeto entregue aos componentes (`Projeto`)

A interface da Parte 1 não muda e ganha um campo: `fonte: 'github' | 'fallback'`.

Regras de mescla:

| Campo | Regra |
|---|---|
| `estrelas` | `stargazers_count`, se houver; senão o fallback |
| `linguagem.nome` | `language`, se houver; senão o fallback |
| `linguagem.cor` | `corDaLinguagem(nome)` |
| `atualizadoEm` | `pushed_at`, se houver; senão o fallback |
| `repoUrl` | `html_url`, se houver; senão `https://github.com/JGabriel02/<repo>` |
| `demoUrl` | o manual; senão `homepage` não vazia; senão ausente |

### 3.3 Skills (`src/content/skills.ts`)

- `Skill` ganha o campo opcional `linguagemGithub?: string`, por exemplo `'C#'` ou `'TypeScript'`.
- `repos` deixa de ser escrito à mão.
  - `getSkills()` preenche `repos` com a contagem de repositórios públicos do dono cuja linguagem principal é `linguagemGithub`.
  - Forks e repositórios sem linguagem não entram na contagem.
  - Sem dados do GitHub, `repos` fica indefinido e não é exibido.
- `anos` continua manual.
- A lista inicial vira a stack real (`TODO(conteúdo)` nos anos):
  - backend: C#, Java, Node.js;
  - frontend: TypeScript, JavaScript, React, Next.js;
  - tools: Python, Git, Docker.
  - A categoria de cada uma é revisável pelo dono.

### 3.4 Atividade (`getAtividade()`)

```ts
interface Atividade { sequenciaAtual: number; totalAno: number; ano: number }
```

- A fonte é a GraphQL `user(login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } }`. Ela cobre os últimos 12 meses.
- **`sequenciaAtual`:** a contagem começa em "hoje" (data em `America/Sao_Paulo`).
  - Se hoje tem 0 contribuições, a contagem começa em ontem, para a sequência não zerar antes do dia acabar.
  - A partir desse dia, contam-se os dias consecutivos com `contributionCount > 0`.
- **`totalAno`:** a soma das contribuições do ano civil atual (a partir dos dias do calendário com `date` no ano corrente).
- Sem dados, `getAtividade()` retorna `null`.

## 4. Arquitetura

```
src/lib/github/
  client.ts      ghFetch(path | graphql): Promise<unknown | null>
  schemas.ts     Zod: RepoSchema, ReposSchema, CalendarSchema
  repos.ts       getRepos(): Promise<Repo[] | null>        (1 REST request)
  atividade.ts   getCalendario(): Promise<Dia[] | null>    (1 GraphQL request)
                 calcularAtividade(dias, hoje): Atividade   (pura)
  linguagens.ts  contarPorLinguagem(repos): Map<string, number>  (pura)
  cores.ts       corDaLinguagem(nome): string               (pura)
  index.ts       re-exports
src/content/index.ts
  getProjetos(), getProjeto(slug), getSkills(categoria?), getAtividade()  → async
  mesclarProjeto(curado, repo | undefined): Projeto        (pura, exportada para testes)
```

### 4.1 `client.ts`

- Se `process.env.GITHUB_TOKEN` estiver ausente, retorna `null` sem fazer requisição e loga um aviso uma vez, só em desenvolvimento.
- Os headers são `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28` e `User-Agent: portfolio-site`.
- `fetch` recebe `{ next: { revalidate: 3600, tags: ['github'] }, signal: AbortSignal.timeout(5000) }`.
- Qualquer status fora de 2xx, timeout, erro de rede ou JSON inválido faz a função retornar `null` e registrar `console.warn('[github] <motivo>', { status, path })`. O log **nunca** inclui o token nem os headers.
- Na GraphQL, uma resposta com `errors` também retorna `null`.

### 4.2 Requisições

- **REST:** `GET /users/JGabriel02/repos?per_page=100&type=owner&sort=pushed`. É uma página só, o que basta para menos de 100 repositórios. Se um dia passar de 100, a paginação vira uma melhoria futura, registrada no README.
- **GraphQL:** `POST /graphql` com a query da §3.4 e `variables: { login }`.
- O total é de **2 requisições por janela de revalidação**.

### 4.3 Validação

As respostas passam por Zod.

- Um repositório que não valida é descartado, e os demais seguem.
- Se o envelope inteiro não valida, o resultado é `null`.

### 4.4 Componentes e rotas

- `Projetos`, `Skills`, `projetos/[slug]/page.tsx` (`generateStaticParams`, `generateMetadata`, página) e `sitemap.ts` passam a usar `await` nas funções de conteúdo.
- `export const revalidate = 3600` na home (era 86400) e na página de detalhe.

## 5. Interface

- **Cards de projeto:** passam a mostrar os dados reais. A cor da bolinha vem de `corDaLinguagem` (cores oficiais do GitHub Linguist para as linguagens do dono, com `#8B8B9A` para as desconhecidas). O texto continua usando tokens semânticos; a cor da bolinha é dado de conteúdo, como na Parte 1.
- **Skills:** mostra "· N repositórios" quando `repos > 0`.
- **Card "Atividade no GitHub"** (novo, 4º card da seção Sobre):
  - Ícone `Flame` (lucide) e o título `sobre.atividade.titulo`.
  - Linha principal `sobre.atividade.sequencia` (ICU plural: "{count} dia seguido / dias seguidos").
  - Linha secundária `sobre.atividade.total` ("{count} contribuições em {ano}").
  - Link `sobre.atividade.link` para `perfil.links.github`.
  - A linha da sequência só aparece se `sequenciaAtual > 0`, e o card inteiro só aparece se `getAtividade()` não for `null`.
  - As chaves novas vão para `pt.json` e `en.json`, e o teste de paridade continua valendo.
- **Perfil:** `perfil.links.github` passa a ser `https://github.com/JGabriel02`, e o login é derivado dessa URL.

## 6. Tratamento de erros

| Situação | Comportamento |
|---|---|
| Sem `GITHUB_TOKEN` | Nenhuma chamada. Tudo vem do fallback e a atividade fica `null` (card oculto). |
| 401 / 403 / 5xx / timeout / rede | `console.warn` sem segredo e fallback. Na Vercel, o ISR mantém a última versão boa. |
| JSON fora do schema | Fallback (no envelope inteiro) ou descarte do item. |
| Repositório curado ausente na resposta | Fallback só desse projeto, `fonte: 'fallback'` e `console.warn('[github] repo curado não encontrado', { repo })`. |
| Calendário vazio | `{ sequenciaAtual: 0, totalAno: 0 }`. O card mostra só o total; se o total for 0, o card mostra "0 contribuições em {ano}". |

## 7. Segurança e privacidade

- O token só é lido em módulos `server-only` e nunca é serializado para o cliente nem logado.
- As permissões necessárias são *Public repositories (read-only)* e o padrão *Metadata: read*.
- Nenhum dado de visitante é enviado ao GitHub.

## 8. Testes

| Tipo | Cobertura |
|---|---|
| Unit — `mesclarProjeto` | dado vivo sobrescreve o fallback; repositório ausente vira fallback com `fonte: 'fallback'`; `demoUrl` manual vence `homepage`; `homepage` vazia é ignorada |
| Unit — `calcularAtividade` | hoje com contribuição; hoje 0 e ontem > 0 (continua); buraco de 1 dia (para); virada de ano (`totalAno` só do ano corrente); calendário vazio; "hoje" em `America/Sao_Paulo` às 23h30 e às 00h30 |
| Unit — `contarPorLinguagem` | ignora forks e `language: null`; agrega por nome exato |
| Unit — `corDaLinguagem` | conhecidas e desconhecidas |
| Unit — `client` | sem token, sem fetch; 401, 500, timeout e JSON inválido retornam `null`; o log não contém o token (com `fetch` mockado) |
| Unit — `getProjetos`/`getSkills`/`getAtividade` | com fixtures gravadas em `tests/fixtures/github/{repos,calendar}.json`, mais o caminho de fallback sem token |
| Componente | card de atividade com dados, sem dados e com sequência 0, em pt e en; skill com e sem contagem |
| E2E | a suíte da Parte 1 continua passando **sem token** (modo fallback) e o axe continua sem violações |
| Contrato (opcional) | `tests/contract/github.test.ts` chama a API real e valida os schemas. Roda com `corepack pnpm test:contract` só se `GITHUB_TOKEN` estiver definido e fica fora do CI. |

## 9. Documentação

O README ganha uma seção "Dados do GitHub":

- como criar o token fine-grained (somente leitura, repositórios públicos);
- como cadastrar `GITHUB_TOKEN` na Vercel;
- como adicionar, remover ou destacar um projeto em `src/content/projetos.ts`;
- como ligar uma skill a uma linguagem;
- o limite de 100 repositórios.

O `.env.example` ganha `GITHUB_TOKEN=`.
