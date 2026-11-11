# Portfólio — Parte 4: Painel admin (Java local + Neon)

- **Data:** 2026-11-11
- **Status:** aguardando revisão
- **Depende de:** Parte 1 (site público) e Parte 2 (GitHub), ambas na `main`.
- **Antes de:** Parte 3 (blog), que vai reaproveitar o banco e o painel.

## 1. Objetivo

Dar ao dono um painel para ver os acessos ao portfólio, ler as mensagens de contato e editar projetos e skills sem commit nem deploy. O painel é uma aplicação **Java Spring Boot que roda só localmente** (`http://localhost:8080`), ligada a um **Postgres no Neon** que o site na Vercel também usa.

**Critérios de sucesso**

1. O site grava visitas e eventos de clique sem cookies, sem guardar IP e sem banner de consentimento.
2. O painel mostra visitas, visitantes únicos, origens, países, aparelhos, idiomas e ranking de projetos por período (7d/30d/90d/12m).
3. As mensagens do formulário de contato ficam no banco e são lidas, marcadas como lidas e apagadas pelo painel.
4. Editar um projeto ou skill no painel muda o site em produção em segundos, via revalidação sob demanda.
5. Com o banco fora do ar ou sem `DATABASE_URL`, o site continua funcionando: o conteúdo volta para os arquivos `.ts`, a coleta é descartada em silêncio e o formulário de contato some.
6. A credencial do site, se vazar, não permite ler mensagens nem apagar ou alterar dados.
7. Os testes do site não acessam a internet. Os testes do painel usam Postgres real via Testcontainers.

## 2. Decisões

| Decisão | Escolha |
|---|---|
| Linguagem do painel | Java 21 LTS, Spring Boot 3.5, Maven (com `mvnw`) |
| Interface | Spring Web + Thymeleaf + HTMX, Chart.js servido localmente |
| Acesso a dados (Java) | Spring Data JDBC / `JdbcClient`, sem Hibernate |
| Dono do schema | O painel, via Flyway |
| Onde fica | Pasta `painel/` neste repositório |
| Autenticação | Nenhuma. O servidor escuta só em `127.0.0.1`. |
| Acesso a dados (site) | `@neondatabase/serverless` (HTTP) + SQL escrito à mão + Zod, em `src/lib/db/` (`server-only`) |
| Analytics | Básico + eventos, sem cookies, com hash diário do visitante |
| Editável pelo painel | Projetos e skills. O perfil continua em `perfil.ts`. |
| Retenção | 13 meses para visitas e eventos |

**Fora do escopo:** artigos/blog (Parte 3), edição do perfil, login e acesso remoto ao painel, upload de imagens, exportação de relatórios, notificação por email de novas mensagens.

## 3. Arquitetura

```
Visitante ──► Site Next.js (Vercel) ──┐
                │ sendBeacon /api/coleta │  role "site": INSERT visita/evento/mensagem,
                │ form de contato        │               SELECT projeto/skill
                ▼                        ▼
                         Neon Postgres
                              ▲
                              │  role "painel": dono do schema + Flyway
Dono ──► 127.0.0.1:8080 ──► Painel Spring Boot (painel/)
                              │
                              └─► POST {SITE_URL}/api/revalidar (Bearer secret) ──► revalidateTag('conteudo')
```

## 4. Banco de dados

### 4.1 Roles

- **`painel`**: dono do banco e das tabelas. Roda as migrations. A connection string fica só em `painel/.env`, que é ignorado pelo git.
- **`site`**: criado por uma migration, mas a senha é definida manualmente no console do Neon (fora do git). A migration usa `CREATE ROLE ... NOLOGIN` quando a role ainda não existe. O dono roda `ALTER ROLE site LOGIN PASSWORD '...'` uma vez, e o passo a passo fica no README do painel.
  - `INSERT` em `visita`, `evento` e `mensagem` (sem `SELECT`, `UPDATE` ou `DELETE`), mais `USAGE` nas sequences.
  - `SELECT` em `projeto` e `skill`.
  - Nada mais. Os `GRANT`s ficam numa migration versionada.

### 4.2 Tabelas (Flyway, `painel/src/main/resources/db/migration/`)

```sql
visita   (id bigserial PK, criado_em timestamptz default now(),
          caminho text not null,             -- sem query string, máx. 200
          idioma text check (idioma in ('pt','en')),
          origem text not null,              -- domínio do referrer ou 'direto'
          aparelho text check (aparelho in ('mobile','desktop')),
          pais char(2),                       -- null se desconhecido
          visitante_hash char(64) not null)

evento   (id bigserial PK, criado_em timestamptz default now(),
          tipo text check (tipo in ('repo','demo','cv','contato','idioma')),
          alvo text,                          -- ex.: slug do projeto, máx. 100
          idioma text, visitante_hash char(64) not null)

mensagem (id bigserial PK, criado_em timestamptz default now(),
          nome text not null, email text not null, texto text not null,
          lida boolean not null default false)

projeto  (slug text PK, repo text not null, ordem int not null,
          destaque boolean not null default false,
          publicado boolean not null default true,
          demo_url text, ocultar_demo boolean not null default false,
          stack text[] not null default '{}',
          imagens jsonb not null default '[]',
          resumo_pt text, resumo_en text,
          descricao_pt text, descricao_en text,
          aprendizados_pt jsonb, aprendizados_en jsonb,
          fallback_linguagem text, fallback_estrelas int, fallback_atualizado_em date,
          atualizado_em timestamptz default now())

skill    (id serial PK, nome text unique not null,
          categoria text check (categoria in ('frontend','backend','tools')),
          anos int not null, aprendendo boolean not null default false,
          linguagem_github text, ordem int not null)
```

Há índices em `visita(criado_em)`, `evento(criado_em)` e `evento(tipo, alvo)`. Um índice único parcial garante no máximo um `projeto` com `destaque = true`.

### 4.3 Hash do visitante

`visitante_hash = sha256(salDoDia + ip + userAgent)`, em hex, sendo `salDoDia = sha256(COLETA_SEGREDO + dataUTC)`. O sal nunca é gravado, e por isso não dá para ligar o mesmo visitante entre dias diferentes. O IP só existe na memória da requisição.

### 4.4 Retenção

Ao iniciar, e depois uma vez por dia (`@Scheduled`), o painel apaga linhas de `visita` e `evento` com mais de 13 meses. As mensagens só são apagadas manualmente.

## 5. Site (Next.js)

### 5.1 Módulo de banco (`src/lib/db/`, `server-only`)

- `cliente.ts`: cria o cliente `neon(DATABASE_URL)` de forma preguiçosa. Sem a variável, devolve `null`.
- Toda consulta tem timeout de 3s. Uma falha vira `null` ou `false`, sem lançar exceção para a página. Os logs registram só o tipo do erro, nunca dados.
- `conteudo.ts`: `lerProjetos()` e `lerSkills()` validam as linhas com Zod e as convertem para `ProjetoCurado[]` e `Skill[]`. São cacheadas com `unstable_cache` (o projeto não usa `cacheComponents`), com a tag `conteudo` e `revalidate: 3600`.
- `coleta.ts`: `inserirVisita()` e `inserirEvento()`.
- `mensagens.ts`: `inserirMensagem()`.

### 5.2 Conteúdo

- `getProjetos()`/`getProjeto()`/`getSkills()` em `src/content/index.ts` tentam primeiro o banco. Se o resultado for `null` ou uma lista vazia, usam `projetos.ts`/`skills.ts`. A mescla com o GitHub (`mesclarProjeto`) não muda.
- Só aparecem projetos com `publicado = true`, na ordem do campo `ordem`.
- `generateStaticParams` das páginas de detalhe usa a mesma fonte. Um slug novo que não estava no build é renderizado sob demanda (`dynamicParams = true`).
- Os arquivos `.ts` continuam no repositório como fallback e como fonte do seed.

### 5.3 Revalidação (`src/app/api/revalidar/route.ts`)

- Só aceita `POST` com `Authorization: Bearer ${REVALIDATE_SECRET}`, comparado em tempo constante. Sem a variável configurada, responde sempre `401`.
- Em caso de sucesso, chama `revalidateTag('conteudo')` e responde `200 {ok:true}`. Caso contrário, responde `401`, sem corpo útil.

### 5.4 Coleta (`src/app/api/coleta/route.ts` + `<Coleta />`)

- **Cliente.** `src/components/analytics/Coleta.tsx` (client) fica montado no layout do locale.
  - A cada troca de rota, manda `navigator.sendBeacon('/api/coleta', JSON)` com `{t:'v', caminho, idioma, ref}`.
  - Um único listener delegado de `click` procura o `[data-evento]` mais próximo, no formato `tipo:alvo`, e manda `{t:'e', tipo, alvo, idioma}`.
  - Não envia nada quando `navigator.doNotTrack === '1'` ou `globalPrivacyControl` está ativo, nem fora de produção (o componente só é renderizado quando `VERCEL_ENV === 'production'` ou `COLETA_FORCAR === '1'`, usado nos testes).
- **Marcação.** `data-evento` é adicionado em:
  - "Ver repositório" e "Ver aplicação" (`CardFantasma` e página de detalhe): `repo:<slug>` / `demo:<slug>`.
  - Botão do CV: `cv:<locale>`.
  - Troca de idioma: `idioma:<destino>`.
  - O envio de contato com sucesso vira o evento `contato`, inserido pela própria server action.
- **Rota.**
  1. Corpo de até 2 KB, validado com Zod (união discriminada `v`/`e`). Valores fora do esperado são descartados.
  2. Ignora user-agents de bots (lista de regex: `bot|crawler|spider|preview|headless|lighthouse`…) e requisições com `purpose: prefetch`/`Sec-Purpose: prefetch`.
  3. `caminho` perde a query string. `origem` é o hostname do `ref`, sem `www.`, e vira `direto` quando está vazio ou é o próprio site. `aparelho` vem da regex `Mobi|Android` no UA. `pais` vem de `x-vercel-ip-country`.
  4. Calcula o hash (§4.3) e insere os dados.
  5. Responde **sempre** `204`, mesmo quando dá erro.
- O matcher do `proxy.ts` já ignora `/api`, então as rotas novas ficam fora do roteamento de idioma.

### 5.5 Contato

- `contatoFormAtivo()` passa a ser `Boolean(process.env.DATABASE_URL)`. `NEXT_PUBLIC_CONTATO_ATIVO` deixa de existir.
- A server action, depois do honeypot e do Zod, chama `inserirMensagem()`. Se ela falhar, responde `{status:'error'}`. Se der certo, grava um evento `contato` e responde `{status:'ok'}`.
- Os logs continuam sem nome, email nem texto.

### 5.6 Variáveis de ambiente (site)

| Variável | Onde | Uso |
|---|---|---|
| `DATABASE_URL` | Vercel | role `site` |
| `COLETA_SEGREDO` | Vercel | base do sal diário (≥32 caracteres aleatórios) |
| `REVALIDATE_SECRET` | Vercel + `painel/.env` | autoriza o painel a revalidar |

Nenhuma delas é `NEXT_PUBLIC_`. O `.env.example` do site é atualizado.

## 6. Painel (`painel/`)

### 6.1 Estrutura

```
painel/
  pom.xml, mvnw, mvnw.cmd, .mvn/
  .env.example            # PAINEL_DATABASE_URL, PAINEL_DATABASE_USER, PAINEL_DATABASE_PASSWORD, SITE_URL, REVALIDATE_SECRET
  README.md               # como subir, criar as roles no Neon, rodar os testes
  src/main/java/dev/jg/painel/
    PainelApplication.java
    estatisticas/  (controller, repositório, DTOs)
    mensagens/
    conteudo/      (projetos, skills, revalidação, seed)
    retencao/
  src/main/resources/
    application.yml       # server.address=127.0.0.1, port 8080, lê o .env
    db/migration/V1__schema.sql, V2__roles.sql, ...
    templates/            # Thymeleaf (layout + telas + fragmentos HTMX)
    static/               # css do tema Sombra, htmx.min.js, chart.umd.min.js
    seed.json
  src/test/java/...
painel.cmd                # na raiz: cd painel && mvnw spring-boot:run
```

- O `.env` é carregado com `spring.config.import=optional:file:.env[.properties]`.
- `painel/.env` já é coberto pelo `.env*` do `.gitignore`. Entram `!.env.example` (para versionar os exemplos) e `painel/target/`.

### 6.2 Telas

1. **Visão geral (`/`)**
   - Seletor de período (7d/30d/90d/12m, via HTMX).
   - Cartões: visitas, visitantes únicos, cliques em repositório, cliques em aplicação, downloads de CV e mensagens não lidas.
   - Gráfico de linha de visitas por dia (por mês em 12m).
   - Tabelas top 10: páginas, origens e países. Proporções mobile × desktop e pt × en.
2. **Projetos (`/projetos`)**: por projeto, mostra visualizações de `/{locale}/projetos/{slug}`, cliques `repo` e cliques `demo` no período.
3. **Mensagens (`/mensagens`)**
   - Lista paginada (20 por página) com filtro de não lidas.
   - Abrir uma mensagem a marca como lida.
   - Também dá para marcar como não lida e apagar, sempre com confirmação.
4. **Conteúdo › Projetos (`/conteudo/projetos`)**
   - Lista com botões ↑/↓ para a ordem. Arrastar é um extra opcional, e os botões garantem acessibilidade.
   - Formulário de edição e criação: slug (só na criação), repo, abas pt/en para resumo, descrição e aprendizados (um por linha), stack (separada por vírgulas), demo_url, ocultar_demo, destaque (marcar um desmarca o anterior na mesma transação) e publicado.
   - Validação com Bean Validation.
   - Remover pede confirmação.
5. **Conteúdo › Skills (`/conteudo/skills`)**: tabela editável (nome, categoria, anos, aprendendo, linguagem_github) com ordem ↑/↓, adicionar e remover.

Depois de qualquer gravação em conteúdo, o painel chama `/api/revalidar` (timeout de 5s) e mostra um aviso de "Site atualizado" ou "Salvo, mas o site não respondeu, e a mudança vai aparecer em até 1 hora".

O visual segue o tema Sombra escuro, com as cores primitivas copiadas de `sombra.css`, contraste AA e foco visível.

### 6.3 Seed

- `pnpm db:seed-export` (script `scripts/exportar-seed.ts`) gera `painel/src/main/resources/seed.json` a partir de `projetos.ts` e `skills.ts`. O arquivo gerado é commitado.
- Ao iniciar, se `projeto` e `skill` estiverem vazias, o painel importa o `seed.json` numa transação. Nunca sobrescreve dados existentes.

### 6.4 Consultas de estatística

- São SQL direto com `JdbcClient`, agregando por período, como `date_trunc('day', criado_em AT TIME ZONE 'America/Sao_Paulo')`.
- Visitantes únicos = `count(distinct visitante_hash)`. Como o hash muda por dia, num período maior isso é a soma de únicos diários, e a tela diz isso num texto de ajuda.

## 7. Tratamento de erros

| Situação | Comportamento |
|---|---|
| Neon fora do ar (site) | Conteúdo vem dos `.ts`, coleta descartada, contato responde erro amigável |
| `DATABASE_URL` ausente | Igual, e o formulário de contato fica oculto |
| Coleta com corpo inválido ou bot | `204`, nada gravado |
| Revalidação com segredo errado | `401` |
| Neon fora do ar (painel) | Página de erro "Sem conexão com o banco" com botão de tentar de novo, e o painel não quebra |
| Site não responde à revalidação | Os dados ficam salvos, com um aviso de até 1h |

## 8. Testes

**Site (Vitest, sem rede)**
- `src/lib/db/` com o cliente mockado: mapeamento de linhas, validação Zod, timeout e falha → `null`.
- `content/index`: o banco tem prioridade, há fallback quando ele falha ou vem vazio, e `publicado`/`ordem` são respeitados.
- `/api/coleta`: payload válido insere, inválido/bot/prefetch não insere, a query string é removida, a origem é normalizada, o hash é estável no mesmo dia e diferente no dia seguinte, e a resposta é sempre 204.
- `/api/revalidar`: 401 sem segredo ou com segredo errado, 200 e `revalidateTag` chamado com o segredo certo.
- Contato: grava a mensagem e o evento, e responde erro quando a inserção falha.
- `<Coleta />`: respeita DNT/GPC e envia o `data-evento` certo no clique.

**E2E (Playwright)**: os testes atuais continuam passando sem banco (fallback). Um teste novo verifica que clicar em "Ver repositório" dispara um beacon para `/api/coleta`, interceptado com `page.route`.

**Painel (JUnit 5)**
- Testcontainers Postgres: as migrations aplicam do zero, o seed importa uma vez só, as estatísticas por período batem com os dados inseridos, a retenção apaga só o que é antigo e o destaque é único.
- MockMvc: as telas renderizam, os formulários validam e salvar chama o cliente de revalidação (mockado).
- Teste de permissões: conectado como a role `site`, `SELECT` em `mensagem` falha e `INSERT` em `visita` funciona.

**CI**: um job `painel` no `ci.yml`, com `paths: painel/**`, roda `./mvnw -B verify` com Java 21 (Temurin). O Docker está disponível no runner Ubuntu para os Testcontainers.

## 9. Ordem de entrega

1. **Painel: esqueleto + migrations + roles + seed.** O projeto Spring sobe, o Flyway cria tudo e o seed importa. O CI do painel entra aqui.
2. **Site: leitura do banco + revalidação + contato no banco + coleta.** Tudo tem fallback. Com o deploy, os dados começam a entrar.
3. **Painel: estatísticas e mensagens.**
4. **Painel: edição de projetos e skills + revalidação.**

Cada etapa deixa a `main` verde e o site funcionando em produção.

## 10. Passos manuais do dono

1. Criar o projeto no Neon e copiar a connection string do dono para `painel/.env`.
2. Subir o painel uma vez (as migrations criam tabelas e a role `site`).
3. No console SQL do Neon: `ALTER ROLE site LOGIN PASSWORD '<gerada>'`.
4. Na Vercel: `DATABASE_URL` (com a role `site`), `COLETA_SEGREDO` e `REVALIDATE_SECRET`, e depois um redeploy.
5. Colocar o mesmo `REVALIDATE_SECRET` e o `SITE_URL` em `painel/.env`.
