# Portfólio Parte 4: Painel admin, plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Um painel Java local (127.0.0.1:8080) que mostra acessos e mensagens e edita projetos e skills, sobre um Postgres no Neon que o site na Vercel também usa para gravar coleta e contato e para ler conteúdo.

**Arquitetura:**
- O painel (Spring Boot, Thymeleaf + HTMX) é dono do schema via Flyway e usa a role `painel`.
- O site (Next.js) usa a role `site`, que só tem `INSERT` em coleta e contato e `SELECT` em conteúdo, pelo driver HTTP do Neon com SQL escrito à mão.
- Tudo no site tem fallback para os arquivos `.ts` atuais.
- O painel avisa o site por `POST /api/revalidar`.

**Tech Stack:**
- Painel: Java 21, Spring Boot 3.5, Maven Wrapper, Spring JDBC (`JdbcClient`), Flyway, Thymeleaf, HTMX e Chart.js via WebJars, JUnit 5 + Testcontainers.
- Site: Next.js 16, `@neondatabase/serverless`, Zod 4, Vitest 5, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-portfolio-painel-design.md`

## Restrições globais

- Java **21** (Temurin no CI). Spring Boot **3.5.x**. Pacote raiz `dev.jg.painel`. Pasta `painel/`.
- `server.address=127.0.0.1` e `server.port=8080`. Sem autenticação.
- O site usa só `@neondatabase/serverless`, sem ORM. As consultas ficam em `src/lib/db/`, todos os arquivos com `import 'server-only'`.
- Toda consulta do site tem timeout de **3000 ms**. Em falha, devolve `null`/`false` e nunca lança exceção para a página.
- Nenhuma variável nova é `NEXT_PUBLIC_`. As variáveis são `DATABASE_URL`, `COLETA_SEGREDO` e `REVALIDATE_SECRET`. `NEXT_PUBLIC_CONTATO_ATIVO` é removida.
- Logs nunca contêm IP, user-agent, email, nome nem texto de mensagem. Só o tipo do erro.
- A role `site` nunca recebe `SELECT` em `visita`, `evento` ou `mensagem`. Os INSERTs do site **não usam `RETURNING`**, porque ele exige SELECT.
- Retenção de **13 meses** para `visita` e `evento`.
- Tag de cache `conteudo`, `revalidate: 3600`.
- Fuso das estatísticas: `America/Sao_Paulo`.
- Textos de interface do painel em português.
- Comandos do site com `corepack pnpm`. Os do painel com `./mvnw` (ou `mvnw.cmd` no Windows), rodados dentro de `painel/`.
- Commits em Conventional Commits, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Pré-requisitos locais** (o dono instala, e o implementador só verifica):
- JDK 21 com `JAVA_HOME` apontando para ele. Hoje a máquina tem só Java 8 no PATH.
- Docker rodando, para os Testcontainers.
- Se faltar algum, as tarefas do painel param e avisam. As do site (5–10) seguem normalmente.

## Ajustes em relação à spec (decididos aqui)

1. `aprendizados_pt`/`aprendizados_en` são `text`, não `jsonb`, porque `ProjetoCurado.aprendizados` é `Localized<string>`. O formulário usa textarea.
2. Origem de navegação interna: a 1ª visualização da sessão de página manda `document.referrer`, e as trocas de rota seguintes mandam a própria origem do site. O site grava isso como `interno`, e o painel exclui `interno` do top de origens. Ficaria `direto` só sem referrer.
3. O CI do painel é um workflow separado, `.github/workflows/painel.yml`, com filtro `paths`, porque filtro de paths não existe por job.
4. Ordem dos projetos no site: destaque primeiro, depois `ordem` (no fallback, a ordem do array em `projetos.ts`). Isso substitui o "atualizadoEm desc" atual.

A Tarefa 1 atualiza a spec com esses quatro pontos.

## Foco de revisão

1. **Segredo de revalidação com tamanho diferente:** `timingSafeEqual` lança exceção para buffers de tamanhos diferentes. A rota tem que responder 401, não 500 (teste na Tarefa 7).
2. **Strings enormes ou estranhas na coleta:** `caminho` com 5 000 caracteres, emoji ou `?token=...` precisa ser cortado em 200 sem query. `alvo` é cortado em 100 (teste na Tarefa 9).
3. **Zero ou dois destaques:** apagar o projeto em destaque deixa zero, e o site precisa renderizar sem quebrar. Marcar um novo destaque desmarca o anterior na mesma transação (testes nas Tarefas 6 e 14).
4. **Projeto despublicado ou slug novo:** um slug criado depois do build abre a página de detalhe sob demanda. Um projeto `publicado=false` dá 404 no detalhe e some da home (teste na Tarefa 6).
5. **Virada do dia no fuso:** uma visita às 01:00 UTC conta no dia anterior em São Paulo. Um formulário com stack `" Java, ,Spring "` vira `["Java","Spring"]`, e um texto em branco vira `null` (testes nas Tarefas 11 e 14).

---

## Fase 1: Painel, esqueleto e banco

### Tarefa 1: Esqueleto do projeto Spring Boot + CI do painel

**Arquivos:**
- Criar:
  - Projeto em `painel/`: `pom.xml`, `mvnw`, `mvnw.cmd` e `.mvn/wrapper/`.
  - Código e configuração: `painel/src/main/java/dev/jg/painel/PainelApplication.java` e `painel/src/main/resources/application.yml`.
  - Testes: `painel/src/test/java/dev/jg/painel/TestcontainersConfig.java` e `painel/src/test/java/dev/jg/painel/PainelApplicationTest.java`.
  - Documentação e atalhos: `painel/.env.example`, `painel/README.md` e `painel.cmd` (na raiz).
  - CI: `.github/workflows/painel.yml`.
- Modificar:
  - `.gitignore`: adicionar `!.env.example` e `painel/target/`.
  - `.prettierignore` e `eslint.config.mjs` (`globalIgnores`): adicionar `painel/`.
  - A spec, com os 4 ajustes acima.

**Interfaces:**
- Produz: `@TestConfiguration TestcontainersConfig` com um bean `@ServiceConnection PostgreSQLContainer<?>("postgres:17-alpine")`. Todos os testes de integração seguintes usam `@SpringBootTest @Import(TestcontainersConfig.class)`.

- [ ] **Passo 1: Verificar os pré-requisitos.** Rode `"$JAVA_HOME/bin/java" -version` (esperado: `21`) e `docker info` (esperado: sem erro). Se falhar, pare e informe o dono.
- [ ] **Passo 2: Gerar o projeto pelo Spring Initializr** num diretório temporário do scratchpad e copiar para `painel/`:
  - `curl https://start.spring.io/starter.zip -d type=maven-project -d language=java -d javaVersion=21 -d groupId=dev.jg -d artifactId=painel -d packageName=dev.jg.painel -d dependencies=web,thymeleaf,jdbc,flyway,postgresql,validation,testcontainers -o painel.zip`
  - Depois, adicionar ao `pom.xml`: `org.flywaydb:flyway-database-postgresql`, `org.webjars:webjars-locator-lite`, `org.webjars.npm:htmx.org` (2.0.x) e `org.webjars.npm:chart.js` (4.4.x). Confirme as versões exatas no Maven Central.
- [ ] **Passo 3: Escrever o teste `PainelApplicationTest`:**
  - `contextLoads()` sobe o contexto com Testcontainers.
  - `escutaSoNoLoopback()` faz `assertThat(env.getProperty("server.address")).isEqualTo("127.0.0.1")`.
- [ ] **Passo 4: Rodar** `./mvnw -q test`. Esperado: falha em `escutaSoNoLoopback`.
- [ ] **Passo 5: Escrever o `application.yml`:**
  - `spring.config.import: optional:file:.env[.properties]`.
  - Datasource: `url: ${PAINEL_DATABASE_URL:}`, `username: ${PAINEL_DATABASE_USER:}`, `password: ${PAINEL_DATABASE_PASSWORD:}`.
  - `server.address: 127.0.0.1`, `server.port: 8080`, `spring.flyway.enabled: true`.
  - `painel.site-url: ${SITE_URL:}`, `painel.revalidate-secret: ${REVALIDATE_SECRET:}`.
  - O `.env.example` lista as 5 variáveis, com URL no formato `jdbc:postgresql://<host>/<db>?sslmode=require`.
- [ ] **Passo 6: Rodar** `./mvnw -q test`. Esperado: PASS.
- [ ] **Passo 7: Criar o atalho e o CI:**
  - `painel.cmd`: `@echo off` + `cd /d "%~dp0painel" && mvnw.cmd spring-boot:run`.
  - `painel.yml`: `on.push.branches [main]` e `on.pull_request`, os dois com `paths: ['painel/**', '.github/workflows/painel.yml']`, mais `permissions: contents: read`.
  - Os passos do workflow: `actions/checkout@v4`, `actions/setup-java@v4` (`distribution: temurin`, `java-version: 21`, `cache: maven`) e `./mvnw -B verify` com `working-directory: painel`.
  - O README cobre os pré-requisitos e como subir.
- [ ] **Passo 8: Verificar que o site não foi afetado.** Rode `corepack pnpm lint && corepack pnpm exec prettier --check .`. Esperado: PASS.
- [ ] **Passo 9: Commit:** `feat(painel): esqueleto Spring Boot local com CI próprio`.

### Tarefa 2: Migrations (schema + roles)

**Arquivos:**
- Criar: `painel/src/main/resources/db/migration/V1__schema.sql`, `V2__role_site.sql` e `painel/src/test/java/dev/jg/painel/MigracoesTest.java`.

**Interfaces:**
- Produz:
  - As tabelas `visita`, `evento`, `mensagem`, `projeto` e `skill`, exatamente como na spec §4.2, com `aprendizados_*` como `text`.
  - Os índices `visita(criado_em)`, `evento(criado_em)`, `evento(tipo, alvo)` e `create unique index projeto_um_destaque on projeto ((true)) where destaque`.
  - A role `site`.

- [ ] **Passo 1: Escrever os testes em `MigracoesTest`:**
  - `criaAsCincoTabelas()`: em `information_schema.tables` do schema `public` existem as 5.
  - `soUmDestaque()`: inserir 2 projetos com `destaque=true` lança `DataIntegrityViolationException`.
  - `roleSitePodeInserirColetaMasNaoLer()`:
    - Executa `ALTER ROLE site LOGIN PASSWORD 'teste'`.
    - Abre um `DriverManager.getConnection(jdbcUrl, "site", "teste")`.
    - `insert into visita(caminho, origem, visitante_hash) values ('/pt','direto', repeat('a',64))` funciona.
    - `select * from mensagem` lança `SQLException` com SQLState `42501`.
    - `select * from projeto` funciona.
    - `delete from visita` lança `42501`.
- [ ] **Passo 2: Rodar** `./mvnw -q test -Dtest=MigracoesTest`. Esperado: FAIL.
- [ ] **Passo 3: Escrever `V1__schema.sql`** (spec §4.2, com os checks de domínio) **e `V2__role_site.sql`:**
  - Um bloco `DO $$ ... IF NOT EXISTS (select from pg_roles where rolname='site') THEN CREATE ROLE site NOLOGIN; END IF; $$`.
  - `GRANT USAGE ON SCHEMA public TO site`.
  - `GRANT INSERT ON visita, evento, mensagem TO site`.
  - `GRANT USAGE ON SEQUENCE visita_id_seq, evento_id_seq, mensagem_id_seq TO site`.
  - `GRANT SELECT ON projeto, skill TO site`.
- [ ] **Passo 4: Rodar** de novo. Esperado: PASS.
- [ ] **Passo 5: Commit:** `feat(painel): schema inicial e role limitada do site`.

### Tarefa 3: Seed (exportação no site + importação no painel)

**Arquivos:**
- Criar:
  - Site: `scripts/exportar-seed.ts` e `tests/unit/exportar-seed.test.ts`.
  - Painel: `painel/src/main/resources/seed.json` (gerado), `painel/src/main/java/dev/jg/painel/conteudo/SeedImportador.java` e `painel/src/test/java/dev/jg/painel/conteudo/SeedImportadorTest.java`.
- Modificar: `package.json`, com o script `"db:seed-export": "tsx scripts/exportar-seed.ts"`.

**Interfaces:**
- Produz:
  - `export function montarSeed(projetos: ProjetoCurado[], skills: Skill[]): Seed` em `scripts/exportar-seed.ts`, com:

    ```ts
    type Seed = {
      projetos: {
        slug; repo; ordem: number; destaque; publicado: true
        demoUrl: string | null; ocultarDemo: boolean; stack: string[]
        imagens: ProjetoCurado['imagens']
        resumo: Localized; descricao: Localized; aprendizados: Localized
        fallback: ProjetoCurado['fallback']
      }[]
      skills: {
        nome; categoria; anos: number; aprendendo: boolean
        linguagemGithub: string | null; ordem: number
      }[]
    }
    ```

  - `ordem` é o índice no array.
  - O script, ao rodar como main, grava `painel/src/main/resources/seed.json` com 2 espaços de indentação e uma quebra de linha final.
  - Painel: `SeedImportador implements ApplicationRunner`. Para cada tabela vazia, importa as linhas correspondentes do `seed.json` numa transação. Nunca toca numa tabela que já tem linhas.

- [ ] **Passo 1: Teste do site.**
  - `montarSeed` mantém a ordem e preenche `ordem` por índice.
  - Converte `demoUrl` ausente em `null`, `ocultarDemo` ausente em `false` e `aprendendo` ausente em `false`.
  - Também confere que o `seed.json` commitado é igual a `JSON.stringify(montarSeed(projetos, skills), null, 2) + '\n'`. Isso pega um seed desatualizado.
- [ ] **Passo 2:** `corepack pnpm test exportar-seed`. Esperado: FAIL.
- [ ] **Passo 3:** implementar o script e rodar `corepack pnpm db:seed-export`.
- [ ] **Passo 4:** `corepack pnpm test exportar-seed`. Esperado: PASS.
- [ ] **Passo 5: Teste do painel (`SeedImportadorTest`).**
  - Com o banco limpo, o importador gera `count(projeto)` igual ao número de projetos do seed (4) e `count(skill)` igual a 11. O `slug='npc-forge'` tem `destaque=true`.
  - Rodar o importador uma 2ª vez não duplica nada.
  - Com uma skill pré-inserida, a tabela de skill não é tocada, mas a de projetos é importada.
- [ ] **Passo 6:** `./mvnw -q test -Dtest=SeedImportadorTest`. Esperado: FAIL. Depois, implementar com Jackson + `JdbcClient` (`stack` via `createArrayOf("text", ...)`, `imagens` como `?::jsonb`).
- [ ] **Passo 7:** rodar de novo. Esperado: PASS.
- [ ] **Passo 8: Commit:** `feat(painel): seed inicial gerado a partir do conteúdo do site`.

### Tarefa 4: Retenção

**Arquivos:**
- Criar: `painel/src/main/java/dev/jg/painel/retencao/Retencao.java` e `painel/src/test/java/dev/jg/painel/retencao/RetencaoTest.java`.
- Modificar: `PainelApplication` (`@EnableScheduling`).

**Interfaces:**
- Produz:
  - `Retencao(JdbcClient, Clock)` com o método `int limpar()`, que devolve o total de linhas apagadas de visita + evento com `criado_em < now - 13 meses`.
  - `@EventListener(ApplicationReadyEvent)` e `@Scheduled(cron = "0 0 4 * * *", zone = "America/Sao_Paulo")` chamam `limpar()`.
  - Um bean `Clock` (`Clock.systemUTC()`) em `PainelApplication`.

- [ ] **Passo 1: Teste.** Insere visitas de 14 meses, 12 meses e hoje, e eventos de 14 meses e hoje. `limpar()` devolve 2 e sobram 2 visitas e 1 evento. As mensagens antigas ficam intactas.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar usando `clock.instant()` menos 13 meses calculado em `ZonedDateTime` UTC (`minusMonths(13)`).
- [ ] **Passo 4:** rodar. Esperado: PASS.
- [ ] **Passo 5: Commit:** `feat(painel): retenção de 13 meses para visitas e eventos`.

---

## Fase 2: Site

### Tarefa 5: Cliente do banco e leitura de conteúdo

**Arquivos:**
- Criar: `src/lib/db/cliente.ts`, `src/lib/db/conteudo.ts` e `tests/unit/db-conteudo.test.ts`.
- Modificar: `package.json` (dependência `@neondatabase/serverless`) e `.env.example`.

**Interfaces:**
- Produz:
  - `cliente.ts`:
    - `export function sql(): NeonQueryFunction<false, false> | null`. É preguiçosa e memoiza por `DATABASE_URL`. Devolve `null` sem a variável.
    - `export async function consultar<T>(texto: string, params: unknown[]): Promise<T[] | null>`. Usa `sql().query(texto, params)` dentro de `comTimeout(…, 3000)`. Qualquer erro ou timeout vira `null`, e o log é `console.warn('[db] falha', { tipo: e.name })`.
  - `conteudo.ts`:
    - `export async function lerProjetos(): Promise<ProjetoCurado[] | null>`. Faz `select ... from projeto where publicado order by ordem`, com `to_char(fallback_atualizado_em,'YYYY-MM-DD')`. Valida cada linha com Zod e converte para `ProjetoCurado`: `demo_url null` some, e `ocultar_demo` vira `ocultarDemo` apenas se true.
    - `export async function lerSkills(): Promise<Skill[] | null>`. Faz `order by ordem`.
    - As duas devolvem `null` se a consulta falhar, se a lista vier vazia ou se alguma linha for inválida, sempre com warn sem dados.

- [ ] **Passo 1: Testes** (`vi.mock('@neondatabase/serverless')`, com `neon` devolvendo um objeto `{ query: vi.fn() }`):
  - `sql()` é null sem `DATABASE_URL`, e `lerProjetos()` devolve `null` sem chamar `query`.
  - Uma linha válida é mapeada para `ProjetoCurado` (`resumo: {pt,en}`, `fallback.atualizadoEm: '2025-01-02'`, sem chave `demoUrl` quando `demo_url` é null).
  - Lista vazia dá `null`. Uma linha com `categoria: 'x'` em skill dá `null`.
  - `query` rejeitado dá `null`, e o `console.warn` não contém o texto do erro.
  - `query` que nunca resolve dá `null` após 3000 ms (`vi.useFakeTimers()` + `advanceTimersByTimeAsync(3000)`).
- [ ] **Passo 2:** `corepack pnpm test db-conteudo`. Esperado: FAIL.
- [ ] **Passo 3:** `corepack pnpm add @neondatabase/serverless` e implementar.
- [ ] **Passo 4:** rodar. Esperado: PASS. Depois, `corepack pnpm typecheck`. Esperado: PASS.
- [ ] **Passo 5: Commit:** `feat(db): cliente Neon com timeout e leitura de projetos e skills`.

### Tarefa 6: Conteúdo do site vindo do banco, com fallback

**Arquivos:**
- Modificar: `src/content/index.ts`, `tests/unit/content.test.ts` e `tests/unit/content-github.test.ts`.
- Teste: `tests/unit/content-db.test.ts`.

**Interfaces:**
- Consome: `lerProjetos`, `lerSkills` (Tarefa 5).
- Produz:
  - Em `src/content/index.ts`:
    - `async function curados(): Promise<ProjetoCurado[]>` = `(await lerProjetosCache()) ?? projetos`.
    - `async function skillsBase(): Promise<Skill[]>` = `(await lerSkillsCache()) ?? skills`.
    - `lerProjetosCache`/`lerSkillsCache` = `unstable_cache(lerX, ['conteudo-projetos'|'conteudo-skills'], { tags: ['conteudo'], revalidate: 3600 })`.
    - `export const TAG_CONTEUDO = 'conteudo'`.
  - `getProjetos()` ordena por destaque primeiro, depois pela posição em `curados()`.
  - `getSkills()` mantém aprendendo por último e anos desc, com a posição de origem como desempate.

- [ ] **Passo 1: Testes** (`vi.mock('next/cache', () => ({ unstable_cache: (f) => f }))` e mock de `@/lib/db/conteudo` e `@/lib/github`):
  - O banco tem prioridade: com `lerProjetos` → `[b, a]` sem destaque, `getProjetos()` devolve os slugs `['b','a']`.
  - Com `lerProjetos` → `null`, os slugs são os de `projetos.ts`, com `npc-forge` em primeiro.
  - Zero destaque: com uma lista em que nenhum projeto tem destaque, `getProjetos()` resolve sem erro e mantém a ordem.
  - `getProjeto('inexistente-no-banco')` devolve `undefined` quando o banco devolve uma lista sem ele, porque o banco só devolve publicados.
  - `getSkills()` usa o banco quando há dados e cai nos arquivos quando dá `null`.
- [ ] **Passo 2:** `corepack pnpm test content`. Esperado: FAIL.
- [ ] **Passo 3:** implementar e atualizar o teste de ordenação antigo em `content.test.ts`, que esperava atualizadoEm desc, para a nova regra.
- [ ] **Passo 4:** `corepack pnpm test`. Esperado: tudo PASS.
- [ ] **Passo 5:** `corepack pnpm build`. Esperado: sucesso sem `DATABASE_URL`, com as páginas de detalhe pré-renderizadas a partir do fallback.
- [ ] **Passo 6: Commit:** `feat(content): projetos e skills do banco com fallback para os arquivos`.

### Tarefa 7: Rota de revalidação

**Arquivos:**
- Criar: `src/app/api/revalidar/route.ts` e `tests/unit/api-revalidar.test.ts`.

**Interfaces:**
- Consome: `TAG_CONTEUDO` (Tarefa 6).
- Produz:
  - `export async function POST(req: Request): Promise<Response>`.
  - Compara `Authorization` com `Bearer ${REVALIDATE_SECRET}` via `timingSafeEqual` sobre o sha256 dos dois lados. O hash garante o mesmo tamanho, então não há exceção.
  - Em caso de sucesso, chama `revalidateTag(TAG_CONTEUDO, { expire: 0 })` e responde `Response.json({ ok: true })`. Confira a assinatura de `revalidateTag` do Next 16 instalado em `node_modules/next/dist/docs/` ou nos tipos, e use a forma de expiração imediata.
  - Sem segredo configurado ou com um header diferente, responde `401` com o corpo vazio.

- [ ] **Passo 1: Testes** (mock de `next/cache`):
  - Sem a env, mesmo com header, a resposta é 401.
  - Com um header errado de mesmo tamanho, 401.
  - Com um header de tamanho diferente (`Bearer x`), 401, e não lança exceção.
  - Sem header, 401.
  - Com o header certo, 200 com `{ok:true}`, e `revalidateTag` é chamado com `'conteudo'`.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: PASS.
- [ ] **Passo 5: Commit:** `feat(api): revalidação sob demanda protegida por segredo`.

### Tarefa 8: Contato gravado no banco

**Arquivos:**
- Criar: `src/lib/db/mensagens.ts` e `src/lib/db/coleta.ts` (só o `inserirEvento` aqui, e a Tarefa 9 completa).
- Modificar: `src/lib/contato-flag.ts`, `src/app/actions/contato.ts`, `tests/unit/contato-action.test.ts`, `tests/unit/contato-flag.test.ts` e `.env.example` (remove `NEXT_PUBLIC_CONTATO_ATIVO`, adiciona `DATABASE_URL`, `COLETA_SEGREDO` e `REVALIDATE_SECRET` com comentários).

**Interfaces:**
- Consome: `consultar` (Tarefa 5).
- Produz:
  - `inserirMensagem(m: { nome: string; email: string; texto: string }): Promise<boolean>`.
  - `inserirEvento(e: { tipo: TipoEvento; alvo: string | null; idioma: string | null; visitanteHash: string }): Promise<boolean>`, com `export type TipoEvento = 'repo' | 'demo' | 'cv' | 'contato' | 'idioma'`.
  - As duas devolvem `consultar(...) !== null`.
  - `contatoFormAtivo()` = `Boolean(process.env.DATABASE_URL)`.

- [ ] **Passo 1: Testes:**
  - Flag: true com `DATABASE_URL` e false sem ela, independente de `VERCEL_ENV`.
  - Action com envio válido e `inserirMensagem` → true: resposta `{status:'ok'}`, `inserirMensagem` chamado com `{nome:'Ana', email:'ana@exemplo.com', texto: valid.mensagem}`, e `inserirEvento` chamado com `tipo:'contato'`.
  - Se `inserirMensagem` → false, a resposta é `{status:'error'}`.
  - Honeypot preenchido não grava nada.
  - Nenhum `console.*` recebe o email.
  - Para o hash do evento de contato, a action usa `visitanteHash(headers())` da Tarefa 9. Até lá, use `'0'.repeat(64)` e deixe um TODO, que a Tarefa 9 resolve.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar, com os SQLs `insert into mensagem(nome,email,texto) values ($1,$2,$3)` e `insert into evento(tipo,alvo,idioma,visitante_hash) values ($1,$2,$3,$4)`.
- [ ] **Passo 4:** `corepack pnpm test`. Esperado: PASS.
- [ ] **Passo 5: Commit:** `feat(contato): mensagens gravadas no Neon; formulário ativo com DATABASE_URL`.

### Tarefa 9: Rota de coleta

**Arquivos:**
- Criar: `src/lib/coleta/normalizar.ts`, `src/lib/coleta/hash.ts`, `src/app/api/coleta/route.ts`, `tests/unit/coleta-normalizar.test.ts` e `tests/unit/api-coleta.test.ts`.
- Modificar: `src/lib/db/coleta.ts` (adiciona `inserirVisita`) e `src/app/actions/contato.ts` (usa o hash real).

**Interfaces:**
- Produz:
  - `normalizar.ts`:
    - `export const CorpoColeta` é uma união discriminada Zod:
      - `{t:'v', caminho: string, idioma: 'pt'|'en', ref: string}`.
      - `{t:'e', tipo: TipoEvento, alvo: string, idioma: 'pt'|'en'}`.
      - As strings têm `.max(5000)` antes do corte.
    - `export function limparCaminho(c: string): string` tira a query e o hash e corta em 200.
    - `export function origemDe(ref: string, hostDoSite: string): string`:
      - Devolve `'direto'` para vazio ou inválido e `'interno'` para o mesmo host.
      - Nos outros casos, devolve o hostname sem `www.`, cortado em 100.
    - `export function aparelhoDe(ua: string): 'mobile'|'desktop'` usa `/Mobi|Android/i`.
    - `export function ehBot(ua: string): boolean` usa `/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|quora|whatsapp/i`, e ua vazio também conta como bot.
  - `hash.ts`: `export function visitanteHash(h: Headers, agora = new Date()): string | null`.
    - Sem `COLETA_SEGREDO`, devolve null.
    - O IP é o 1º valor de `x-forwarded-for`, com fallback para `x-real-ip` e depois `''`.
    - `sal = sha256(segredo + agora.toISOString().slice(0,10))`, e o resultado é `sha256(sal + ip + ua)` em hex.
  - `inserirVisita(v: {caminho; idioma; origem; aparelho; pais: string|null; visitanteHash}): Promise<boolean>`.
  - `route.ts` `POST`:
    1. Lê `req.text()`. Acima de 2048 bytes, descarta.
    2. Descarta se for prefetch (`sec-purpose` ou `purpose` contém `prefetch`) ou bot.
    3. Faz `JSON.parse` + `safeParse`.
    4. Se `visitanteHash` der null, descarta.
    5. Calcula `pais` = `x-vercel-ip-country` se casar com `/^[A-Z]{2}$/`, senão null. O host do site vem de `new URL(req.url).host`.
    6. Insere.
    7. Sempre `new Response(null, { status: 204 })`, inclusive dentro de `catch`.

- [ ] **Passo 1: Testes de normalização:**
  - `limparCaminho('/pt/projetos/x?token=abc#y')` dá `'/pt/projetos/x'`.
  - Um caminho de 5 000 `'a'` dá tamanho 200.
  - `origemDe('https://www.linkedin.com/feed', 'site.vercel.app')` dá `'linkedin.com'`.
  - `origemDe('', h)` dá `'direto'`. `origemDe('nota url', h)` dá `'direto'`.
  - `origemDe('https://site.vercel.app/pt', 'site.vercel.app')` dá `'interno'`.
  - `ehBot('Mozilla/5.0 (compatible; Googlebot/2.1)')` é true. `ehBot('')` é true. Um UA de Chrome é false.
  - `aparelhoDe` de um UA Android dá `'mobile'`.
  - O hash é igual para os mesmos headers no mesmo dia e diferente no dia seguinte. Tem 64 caracteres hex. Sem segredo, é null.
- [ ] **Passo 2: Testes da rota** (mock de `@/lib/db/coleta`):
  - Uma visita válida chama `inserirVisita` com `{caminho:'/pt', idioma:'pt', origem:'github.com', aparelho:'desktop', pais:'BR'}`, e a resposta é 204.
  - Um evento válido chama `inserirEvento` com `{tipo:'repo', alvo:'npc-forge'}`.
  - Corpo inválido, JSON quebrado, corpo de 3 000 bytes, UA de bot, header `sec-purpose: prefetch` ou falta de `COLETA_SEGREDO`: nada é inserido, e a resposta é 204.
  - `inserirVisita` que lança exceção ainda dá 204.
  - `x-vercel-ip-country: 'XX1'` vira `pais: null`.
- [ ] **Passo 3:** rodar. Esperado: FAIL.
- [ ] **Passo 4:** implementar e trocar o hash provisório da action de contato por `visitanteHash(await headers())`. Se der null, ignora o evento, mas grava a mensagem.
- [ ] **Passo 5:** `corepack pnpm test`. Esperado: PASS.
- [ ] **Passo 6: Commit:** `feat(api): coleta de visitas e eventos sem cookies`.

### Tarefa 10: Componente `<Coleta />` e marcação de eventos

**Arquivos:**
- Criar: `src/components/analytics/Coleta.tsx` e `tests/unit/Coleta.test.tsx`.
- Modificar:
  - Layout: `src/app/[locale]/layout.tsx`.
  - Pontos que recebem `data-evento`: `src/components/projetos/CardFantasma.tsx`, `src/app/[locale]/projetos/[slug]/page.tsx`, `src/components/sections/Hero.tsx` e `src/components/layout/LocaleSwitcher.tsx`.
  - E2E: `playwright.config.ts` e `tests/e2e/coleta.spec.ts` (criar).

**Interfaces:**
- Produz: `export function Coleta(): null` (client), que usa `usePathname` (`next/navigation`) e `useLocale`.
  - Sai cedo se `navigator.doNotTrack === '1'` ou `(navigator as any).globalPrivacyControl === true`.
  - Num `useEffect([pathname])`, envia `{t:'v', caminho: pathname, idioma, ref}`:
    - Na 1ª execução, `ref = document.referrer`. Depois, `ref = location.origin`.
  - Num `useEffect([])`, registra um listener `click` em `document` (`capture: true`):
    - Pega `(e.target as Element).closest('[data-evento]')` e faz `split(':', 2)`.
    - Envia `{t:'e', tipo, alvo, idioma}`.
    - Remove o listener no cleanup.
  - O envio é `navigator.sendBeacon('/api/coleta', JSON.stringify(corpo))`. Sem `sendBeacon`, não faz nada.
  - No layout, renderiza `{(process.env.VERCEL_ENV === 'production' || process.env.COLETA_FORCAR === '1') && <Coleta />}` dentro do `NextIntlClientProvider`.
  - Marcação `data-evento`:
    - Card: `repo:${slug}` e `demo:${slug}`.
    - Página de detalhe: o mesmo nos dois `Button`.
    - CV no Hero: `cv:${locale}`.
    - LocaleSwitcher: `idioma:${locale}`.

- [ ] **Passo 1: Testes unitários** (stub de `navigator.sendBeacon` com `vi.fn()` e mock de `next/navigation` `usePathname`):
  - Ao montar, envia uma visita com `caminho:'/pt'` e `ref` igual a `document.referrer`.
  - Clicar num `<a data-evento="repo:npc-forge"><span>x</span></a>`, renderizado ao lado, envia `{t:'e', tipo:'repo', alvo:'npc-forge', idioma:'pt'}`.
  - Com `doNotTrack = '1'`, não envia nada.
  - Depois do unmount, um clique não envia.
  - No `CardFantasma.test`, o link do repositório tem `data-evento="repo:<slug>"`.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar o componente, a marcação e o layout. No `playwright.config.ts`, adicionar `env: { COLETA_FORCAR: '1' }` ao `webServer`.
- [ ] **Passo 4: E2E `coleta.spec.ts`:**
  - Faz `page.route('**/api/coleta', r => { corpos.push(r.request().postData()); r.fulfill({ status: 204 }) })` antes do `goto('/pt')`.
  - Aguarda pelo menos 1 corpo com `"t":"v"`.
  - Clica no link "Ver repositório" do 1º card com `context.on('page')` (a nova aba é fechada).
  - Faz poll até existir um corpo com `"tipo":"repo"`.
- [ ] **Passo 5:** encerrar qualquer `next dev` e rodar `corepack pnpm test && corepack pnpm test:e2e`. Esperado: tudo PASS, incluindo axe e mobile.
- [ ] **Passo 6: Commit:** `feat(coleta): beacon de visitas e cliques com respeito a DNT/GPC`.

---

## Fase 3: Painel, estatísticas e mensagens

### Tarefa 11: Layout, tema e Visão geral

**Arquivos:**
- Criar:
  - Estatísticas: `painel/src/main/java/dev/jg/painel/estatisticas/{Periodo.java, Resumo.java, PontoSerie.java, Contagem.java, EstatisticasRepositorio.java, VisaoGeralController.java}`.
  - Tratamento de erro: `painel/src/main/java/dev/jg/painel/web/ErroBancoAdvice.java`.
  - Templates: `painel/src/main/resources/templates/{fragmentos/layout.html, visao-geral.html, fragmentos/visao-geral-corpo.html, erro-banco.html}`.
  - Estáticos: `painel/src/main/resources/static/{painel.css, painel.js}`.
  - Testes: `.../estatisticas/EstatisticasRepositorioTest.java` e `.../estatisticas/VisaoGeralControllerTest.java`.

**Interfaces:**
- Produz:
  - `enum Periodo { D7(7), D30(30), D90(90), M12(365) }`, com:
    - `Instant inicio(Clock)` (início do dia em São Paulo, `dias-1` dias atrás).
    - `boolean porMes()` (só M12).
    - `static Periodo de(String)`, em que um valor inválido vira D30.
  - Registros:
    - `record Resumo(long visitas, long unicos, long cliquesRepo, long cliquesDemo, long downloadsCv, long naoLidas)`.
    - `record PontoSerie(LocalDate dia, long visitas)`.
    - `record Contagem(String chave, long total)`.
  - `EstatisticasRepositorio(JdbcClient, Clock)` com:
    - `resumo(Periodo)` e `serie(Periodo)`. A série preenche dias sem dados com 0 (em M12, agrupa por mês com `dia` no 1º dia do mês).
    - `topPaginas(Periodo, int)`, `topOrigens(Periodo, int)` (exclui `'interno'`) e `topPaises(Periodo, int)` (`pais` null vira `'??'`).
    - `porAparelho(Periodo)` e `porIdioma(Periodo)`.
  - Rotas: `GET /?periodo=d30` renderiza `visao-geral`. Com o header `HX-Request`, renderiza só `fragmentos/visao-geral-corpo`.
  - `ErroBancoAdvice` (`@ControllerAdvice`) trata `DataAccessException`, devolvendo status 503 e a view `erro-banco` com um link "Tentar de novo".
  - Layout:
    - Navegação para Visão geral, Projetos, Mensagens (com o contador de não lidas), Conteúdo › Projetos e Conteúdo › Skills.
    - Carrega `/webjars/htmx.org/dist/htmx.min.js` e `/webjars/chart.js/dist/chart.umd.js`, mais `painel.css`.
    - O `painel.css` usa as cores do modo `dark` de `src/themes/sombra.css` copiadas como variáveis CSS, com foco visível em `outline: 2px solid`.
  - `painel.js` monta o gráfico de linha a partir de `data-serie` (JSON) no `<canvas>` e o remonta depois de `htmx:afterSwap`.

- [ ] **Passo 1: Testes do repositório** (`Clock.fixed(2026-11-11T15:00Z)`, com inserts diretos):
  - Com 3 visitas em 2 hashes hoje e 1 visita há 40 dias, `resumo(D30)` dá `visitas=3` e `unicos=2`.
  - Os eventos repo/demo/cv contam certo, e `naoLidas` conta só as mensagens com `lida=false`.
  - Virada do dia: uma visita em `2026-11-11T01:00Z` aparece em `serie(D7)` no dia `2026-11-10`.
  - `serie(D7)` tem 7 pontos, com zeros nos dias vazios.
  - `topOrigens` não contém `'interno'` e vem ordenado por total desc.
  - `Periodo.de("xyz")` dá D30.
- [ ] **Passo 2:** rodar. Esperado: FAIL. Depois, implementar o repositório (SQL com `date_trunc('day', criado_em at time zone 'America/Sao_Paulo')` e `generate_series` para preencher os dias).
- [ ] **Passo 3:** rodar. Esperado: PASS.
- [ ] **Passo 4: Testes do controller** (`@WebMvcTest` com o repositório mockado):
  - `GET /` tem status 200 e mostra "Visitas" e o número do resumo.
  - `GET /?periodo=d7` com `HX-Request: true` não contém `<nav`.
  - Um repositório que lança `DataAccessResourceFailureException` dá 503 com o texto "Sem conexão com o banco".
- [ ] **Passo 5:** implementar o controller, os templates, o CSS, o JS e o advice. Rodar `./mvnw -q test`. Esperado: PASS.
- [ ] **Passo 6: Verificação manual opcional:** subir com `.env` de um Neon de teste e abrir `http://127.0.0.1:8080`.
- [ ] **Passo 7: Commit:** `feat(painel): visão geral de acessos com períodos e gráfico`.

### Tarefa 12: Ranking de projetos

**Arquivos:**
- Criar: `.../estatisticas/RankingProjeto.java`, `.../estatisticas/ProjetosEstatController.java`, `templates/projetos-estat.html` e os testes correspondentes.
- Modificar: `EstatisticasRepositorio` (adiciona `ranking`).

**Interfaces:**
- Produz:
  - `record RankingProjeto(String slug, long visualizacoes, long cliquesRepo, long cliquesDemo)`.
  - `List<RankingProjeto> ranking(Periodo)`: todas as linhas de `projeto` (incluindo despublicados) num left join, com:
    - `visualizacoes` = visitas cujo `caminho ~ '^/(pt|en)/projetos/' || slug || '$'`.
    - Os cliques vêm de `evento.alvo = slug`.
    - Ordenado por visualizações e depois cliques, desc.
  - Rota: `GET /projetos?periodo=`.

- [ ] **Passo 1: Teste.**
  - Visitas em `/pt/projetos/npc-forge` e `/en/projetos/npc-forge` dão `visualizacoes=2`.
  - `/pt/projetos/npc-forge-extra` não conta para `npc-forge`.
  - Um projeto sem dados aparece com zeros.
  - A view lista os slugs.
- [ ] **Passo 2:** rodar. Esperado: FAIL. Depois, implementar. Rodar de novo. Esperado: PASS.
- [ ] **Passo 3: Commit:** `feat(painel): ranking de interesse por projeto`.

### Tarefa 13: Mensagens

**Arquivos:**
- Criar: `.../mensagens/{Mensagem.java, Pagina.java, MensagemRepositorio.java, MensagensController.java}`, `templates/mensagens.html`, `templates/mensagem.html` e os testes.

**Interfaces:**
- Produz:
  - `record Mensagem(long id, OffsetDateTime criadoEm, String nome, String email, String texto, boolean lida)`.
  - `record Pagina<T>(List<T> itens, int pagina, boolean temProxima)`.
  - `MensagemRepositorio` com:
    - `listar(boolean soNaoLidas, int pagina)` (20 por página, `criado_em desc`, `pagina` a partir de 0).
    - `Optional<Mensagem> buscar(long)`, `marcarLida(long, boolean)`, `apagar(long)` e `long naoLidas()`.
  - Rotas:
    - `GET /mensagens?naoLidas=true&pagina=0`.
    - `GET /mensagens/{id}` marca a mensagem como lida e a exibe.
    - `POST /mensagens/{id}/nao-lida` e `POST /mensagens/{id}/apagar`, que redirecionam para `/mensagens` com flash. O formulário de apagar tem `hx-confirm="Apagar esta mensagem? Não dá para desfazer."` e `onsubmit` de confirmação como fallback sem JS.
  - Thymeleaf escapa o texto (`th:text`, nunca `th:utext`).

- [ ] **Passo 1: Testes do repositório:**
  - 25 mensagens dão 20 itens com `temProxima=true` na página 0, e 5 itens com `temProxima=false` na página 1.
  - O filtro de não lidas funciona.
  - `buscar` + `marcarLida(id,true)` atualizam o registro, e `apagar` o remove.
- [ ] **Passo 2: Testes do controller:**
  - `GET /mensagens/1` chama `marcarLida(1,true)`.
  - Um texto `<script>alert(1)</script>` aparece escapado como `&lt;script&gt;`.
  - `POST /mensagens/1/apagar` redireciona para `/mensagens`.
  - Um id inexistente dá 404.
- [ ] **Passo 3:** rodar. Esperado: FAIL. Depois, implementar. Rodar de novo. Esperado: PASS.
- [ ] **Passo 4: Commit:** `feat(painel): caixa de mensagens de contato`.

---

## Fase 4: Painel, edição de conteúdo

### Tarefa 14: Revalidação + edição de projetos

**Arquivos:**
- Criar:
  - Conteúdo: `.../conteudo/{RevalidacaoCliente.java, ProjetoForm.java, ProjetoRepositorio.java, ProjetosConteudoController.java}`.
  - Templates: `templates/conteudo/projetos.html` e `templates/conteudo/projeto-form.html`.
  - Testes correspondentes, incluindo `RevalidacaoClienteTest` com `com.sun.net.httpserver.HttpServer` local.

**Interfaces:**
- Produz:
  - `RevalidacaoCliente` (`@Component`, recebe `painel.site-url` e `painel.revalidate-secret`) com o método `boolean revalidar()`:
    - Usa `HttpClient` com timeout de 5 s, `POST {siteUrl}/api/revalidar` e `Authorization: Bearer {secret}`.
    - Devolve true só com 2xx. Com config vazia ou exceção, devolve false.
  - `ProjetoForm`, com Bean Validation:
    - `slug` `@Pattern("[a-z0-9-]{1,60}")`, `repo` `@NotBlank`.
    - Textos pt/en para resumo, descrição e aprendizados.
    - `String stack`, `demoUrl` `@URL` ou vazio, `boolean ocultarDemo`, `destaque` e `publicado`.
    - Também `fallbackLinguagem`, `fallbackEstrelas` e `fallbackAtualizadoEm`.
    - Funções estáticas: `List<String> stackLista()` (split por vírgula, trim, remove vazios) e `static String nuloSeVazio(String)`.
  - `ProjetoRepositorio` com:
    - `List<ProjetoResumo> listar()` (`record ProjetoResumo(String slug, String repo, int ordem, boolean destaque, boolean publicado)`).
    - `Optional<ProjetoForm> buscar(String slug)` e `void criar(ProjetoForm)` (ordem = max+1).
    - `void atualizar(String slug, ProjetoForm)` e `void apagar(String slug)`.
    - `void mover(String slug, int delta)`, que troca a `ordem` com o vizinho e não faz nada nas pontas.
    - Toda gravação com `destaque=true` faz primeiro `update projeto set destaque=false where destaque and slug<>?` na mesma `@Transactional`.
  - Rotas:
    - `GET /conteudo/projetos`, `GET /conteudo/projetos/novo` e `POST /conteudo/projetos`.
    - `GET /conteudo/projetos/{slug}` e `POST /conteudo/projetos/{slug}`.
    - `POST /conteudo/projetos/{slug}/apagar` (com confirmação) e `POST /conteudo/projetos/{slug}/mover?delta=-1|1`.
    - Depois de cada gravação, chama `revalidar()` e define o flash `"Site atualizado."` ou `"Salvo, mas o site não respondeu; a mudança aparece em até 1 hora."`.
  - Formulário: abas pt/en com `role="tablist"` e foco visível. Textareas para descrição e aprendizados. Os botões ↑/↓ têm `aria-label` "Subir <slug>"/"Descer <slug>".

- [ ] **Passo 1: Testes:**
  - `RevalidacaoCliente`:
    - Contra um HttpServer local que responde 200 e confere o header `Bearer s3`, devolve true.
    - Se o servidor responde 401, devolve false.
    - Com `siteUrl` vazio, devolve false sem request.
    - Uma porta fechada dá false.
  - Repositório:
    - Criar B com destaque desmarca A.
    - Apagar o destacado deixa zero destaques.
    - `mover("a", -1)` no primeiro mantém a ordem, e `mover("a", 1)` troca com o seguinte.
  - `ProjetoForm`: o stack `" Java, ,Spring "` vira `["Java","Spring"]`, e `nuloSeVazio("  ")` dá null.
  - Controller:
    - Um POST válido redireciona, chama `revalidar()` e mostra o flash de sucesso. Com `revalidar()` → false, mostra o flash de aviso.
    - Um slug `"Com Espaço"` volta ao formulário com erro, sem gravar.
- [ ] **Passo 2:** rodar. Esperado: FAIL. Depois, implementar. Rodar de novo. Esperado: PASS.
- [ ] **Passo 3: Commit:** `feat(painel): edição de projetos com revalidação do site`.

### Tarefa 15: Edição de skills

**Arquivos:**
- Criar: `.../conteudo/{SkillForm.java, SkillRepositorio.java, SkillsConteudoController.java}`, `templates/conteudo/skills.html` e os testes.

**Interfaces:**
- Consome: `RevalidacaoCliente` (Tarefa 14), com o mesmo padrão de flash.
- Produz:
  - `SkillForm(@NotBlank nome, @Pattern("frontend|backend|tools") categoria, @Min(0) @Max(50) int anos, boolean aprendendo, String linguagemGithub)`.
  - `SkillRepositorio` com `listar()`, `criar`, `atualizar(int id, SkillForm)`, `apagar(int id)` e `mover(int id, int delta)`.
  - Rotas: `GET /conteudo/skills`, `POST /conteudo/skills`, `POST /conteudo/skills/{id}`, `POST /conteudo/skills/{id}/apagar` e `POST /conteudo/skills/{id}/mover`.
  - Tela: uma tabela com uma linha-formulário por skill (o `form` por linha usa o atributo `form=` nos inputs) e uma linha final para adicionar.

- [ ] **Passo 1: Testes:**
  - Um nome duplicado volta com o erro "Já existe uma skill com esse nome", tratado a partir de `DuplicateKeyException`.
  - Anos `-1` são rejeitados.
  - Criar, mover e apagar funcionam.
  - Cada gravação chama `revalidar()`.
- [ ] **Passo 2:** rodar. Esperado: FAIL. Depois, implementar. Rodar de novo. Esperado: PASS.
- [ ] **Passo 3: Commit:** `feat(painel): edição de skills`.

### Tarefa 16: Documentação e verificação final

**Arquivos:**
- Modificar: `painel/README.md` (passos manuais da spec §10, com comandos), `README.md` (seção "Painel" apontando para `painel/README.md`) e `.env.example`.

- [ ] **Passo 1:** escrever os READMEs:
  - Criar o projeto no Neon.
  - Preencher `painel/.env`.
  - Rodar `painel.cmd`.
  - Rodar `ALTER ROLE site LOGIN PASSWORD '...'` no console SQL do Neon.
  - Montar a `DATABASE_URL` da Vercel com o usuário `site`, gerar segredos com `openssl rand -hex 32` e fazer o redeploy.
- [ ] **Passo 2:** rodar `cd painel && ./mvnw -B verify`. Esperado: BUILD SUCCESS.
- [ ] **Passo 3:** encerrar o `next dev` e rodar `corepack pnpm lint && corepack pnpm exec prettier --check . && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`. Esperado: tudo PASS.
- [ ] **Passo 4: Commit:** `docs(painel): passo a passo de Neon, Vercel e uso local`.
