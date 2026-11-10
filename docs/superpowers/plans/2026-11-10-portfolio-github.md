# Portfólio Parte 2 — Integração com o GitHub: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-written project/skill numbers with live GitHub data (stars, language, last push, repo counts per language, contribution streak) for user `JGabriel02`, keeping a curated, bilingual project list and a local fallback so the site never breaks.

**Architecture:** A `server-only` module `src/lib/github/` makes two cached requests per hour (REST repos list + GraphQL contribution calendar) via `fetch` with `next.revalidate: 3600`, validates with Zod, and returns `null` on any failure. Pure functions merge curated content with that data. `src/content/index.ts` getters become `async`; components and routes `await` them. Without `GITHUB_TOKEN` nothing is fetched and fallback data is used — this is how unit, e2e and CI run.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Zod 4, next-intl, lucide-react, Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-10-portfolio-github-design.md` (§ numbers below refer to it). Part 1 spec/README describe the existing app.

## Global Constraints

- pnpm only via `corepack pnpm …`; never bare `pnpm` in scripts.
- TypeScript `strict`; no `any` in `src/`.
- `GITHUB_TOKEN` read only in `server-only` modules; never `NEXT_PUBLIC_`; never logged (nor headers).
- Request headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: portfolio-site`.
- Fetch options: `{ next: { revalidate: 3600, tags: ['github'] }, signal: AbortSignal.timeout(5000) }`.
- REST path: `/users/JGabriel02/repos?per_page=100&type=owner&sort=pushed` (login derived from `perfil.links.github` = `https://github.com/JGabriel02`).
- Streak "today" computed in `America/Sao_Paulo`.
- Unknown language color: `#8B8B9A`.
- `revalidate = 3600` on home and project detail pages.
- Every UI string in `src/content/messages/{pt,en}.json` (parity test must stay green).
- Unit and e2e tests never touch the network.
- Conventional Commits; trailer `Co-Authored-By: Claude <Model> 5.5 <noreply@anthropic.com>` naming the authoring model.

## Review Focus

1. **Curated repo renamed/privated on GitHub** → that project still renders from `fallback` with `fonte: 'fallback'`; other projects keep live data. Test in Task 3.
2. **Streak at day boundaries in Brazil** — 23:30 and 00:30 `America/Sao_Paulo` with UTC dates in the calendar → today/yesterday resolved in São Paulo time, streak not reset before the day ends. Test in Task 2.
3. **GitHub returns 200 with an unexpected body** (e.g. rate-limit HTML, `{ message }`, GraphQL `errors` with `data: null`) → treated as failure, fallback, no throw. Test in Task 1.
4. **Token present but invalid (401)** in production → site renders with fallback and logs a warning containing status and path but not the token. Test in Task 1.
5. **Activity with zero streak but contributions this year / zero everything** → card shows total line only; streak line hidden; card not shown when data is `null`. Test in Task 5.

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/github/client.ts` | `ghRest(path)`, `ghGraphql(query, variables)` → `Promise<unknown \| null>` |
| `src/lib/github/schemas.ts` | Zod schemas + inferred types `Repo`, `Dia` |
| `src/lib/github/repos.ts` | `getRepos()` |
| `src/lib/github/atividade.ts` | `getCalendario()`, `calcularAtividade()` |
| `src/lib/github/linguagens.ts` | `contarPorLinguagem()` |
| `src/lib/github/cores.ts` | `corDaLinguagem()` |
| `src/lib/github/login.ts` | `githubLogin(url)` |
| `src/lib/github/index.ts` | re-exports |
| `src/content/types.ts` | `ProjetoCurado`, `Projeto.fonte`, `Skill.linguagemGithub`, `Atividade` |
| `src/content/{projetos,skills,perfil}.ts` | real curated content |
| `src/content/index.ts` | async getters + `mesclarProjeto` |
| `src/components/sections/AtividadeCard.tsx` | activity card |
| `tests/fixtures/github/{repos,calendar}.json` | recorded responses |
| `tests/unit/github-*.test.ts`, `tests/unit/content.test.ts` | unit tests |
| `tests/contract/github.test.ts`, `vitest.contract.config.mts` | optional live contract test |

---

### Task 1: GitHub client and schemas

**Files:**
- Create: `src/lib/github/client.ts`, `src/lib/github/schemas.ts`, `src/lib/github/login.ts`, `src/lib/github/index.ts`, `tests/unit/github-client.test.ts`, `tests/unit/github-login.test.ts`
- Modify: `.env.example` (add `GITHUB_TOKEN=`)

**Interfaces:**
- Produces:
  - `ghRest(path: string): Promise<unknown | null>` — GET `https://api.github.com${path}`.
  - `ghGraphql(query: string, variables: Record<string, unknown>): Promise<unknown | null>` — POST `https://api.github.com/graphql` with JSON body; returns `data` only; `null` if `errors` present or `data` null.
  - Both: no token → return `null` without calling `fetch` (dev-only `console.warn('[github] GITHUB_TOKEN ausente — usando fallback')` once per process); non-2xx / network error / timeout / non-JSON → `console.warn('[github] <reason>', { status, path })` and `null`.
  - `RepoSchema = z.object({ name: z.string(), html_url: z.url(), stargazers_count: z.number().int(), language: z.string().nullable(), pushed_at: z.string(), homepage: z.string().nullable().optional(), fork: z.boolean() })`; `type Repo = z.infer<typeof RepoSchema>`.
  - `CalendarSchema` for `{ user: { contributionsCollection: { contributionCalendar: { totalContributions: number, weeks: { contributionDays: { date: string /* YYYY-MM-DD */, contributionCount: number }[] }[] } } } }`; `type Dia = { date: string; contributionCount: number }`.
  - `githubLogin(url: string): string | null` — `'https://github.com/JGabriel02'` → `'JGabriel02'`; trailing slash tolerated; non-GitHub URL → `null`.

- [ ] **Step 1: Write failing tests** (`vi.stubEnv`, `vi.stubGlobal('fetch', vi.fn())`, `vi.resetModules()` per test)

```ts
// github-client.test.ts
it('returns null and never fetches without token')            // fetch not called
it('sends auth, accept, api-version and user-agent headers')   // inspect fetch mock call
it('passes next.revalidate 3600 and tags ["github"]')
it.each([401, 403, 500])('returns null on %i and warns without the token', ...)
  // console.warn spy: called; JSON.stringify(args) does not contain the token value
it('returns null on network error / AbortError')
it('returns null when body is not JSON (rate-limit HTML)')     // Review Focus #3
it('ghGraphql returns data; null when errors present or data null') // Review Focus #3
```

```ts
// github-login.test.ts
expect(githubLogin('https://github.com/JGabriel02')).toBe('JGabriel02')
expect(githubLogin('https://github.com/JGabriel02/')).toBe('JGabriel02')
expect(githubLogin('https://gitlab.com/x')).toBeNull()
```

- [ ] **Step 2:** Run `corepack pnpm test`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement. `import 'server-only'` in `client.ts` (Vitest alias already stubs it).
- [ ] **Step 4:** Run `corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test`. Expected: PASS, no warnings in output (silence expected `console.warn` with spies).
- [ ] **Step 5:** Commit `feat(github): add server-only api client with zod schemas`.

---

### Task 2: Repos, languages, colors and activity calculation

**Files:**
- Create: `src/lib/github/repos.ts`, `src/lib/github/atividade.ts`, `src/lib/github/linguagens.ts`, `src/lib/github/cores.ts`, `tests/fixtures/github/repos.json`, `tests/fixtures/github/calendar.json`, `tests/unit/github-data.test.ts`
- Modify: `src/lib/github/index.ts`

**Interfaces:**
- Consumes: `ghRest`, `ghGraphql`, `RepoSchema`, `CalendarSchema`, `githubLogin` (Task 1).
- Produces:
  - `getRepos(login: string): Promise<Repo[] | null>` — validates the array envelope (`z.array(z.unknown())`), then each item with `RepoSchema.safeParse`, dropping invalid items; envelope invalid → `null`.
  - `getCalendario(login: string): Promise<Dia[] | null>` — flattens weeks → days.
  - `calcularAtividade(dias: Dia[], agora: Date): Atividade` where `type Atividade = { sequenciaAtual: number; totalAno: number; ano: number }` (export from `src/content/types.ts` in Task 3; define here and re-export there — put the type in `src/lib/github/atividade.ts` and have `types.ts` re-export it).
    - `hoje` = `agora` formatted `YYYY-MM-DD` with `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`; `ano` = its year.
    - start = `hoje` if its count > 0, else the previous day; count consecutive days backward with count > 0.
    - `totalAno` = sum of counts for dates in `ano`.
  - `contarPorLinguagem(repos: Repo[]): Map<string, number>` — excludes `fork` and `language === null`.
  - `corDaLinguagem(nome: string): string` — map for `C#` `#178600`, `Java` `#B07219`, `TypeScript` `#3178C6`, `JavaScript` `#F1E05A`, `Python` `#3572A5`, `CSS` `#663399`, `HTML` `#E34C26`; else `#8B8B9A`.

- [ ] **Step 1: Record fixtures.** `repos.json`: a trimmed realistic array (≥6 items) using the owner's real repo names (`npc-forge` C#, `Missions_API` Java, `VacationSchedulerApplication` Java, `vacation-scheduler-web` TypeScript, `cardapio` TypeScript ★3, one fork, one `language: null`, one invalid item missing `name`). `calendar.json`: GraphQL `data` shape spanning a year boundary (late Dec 2025 → Nov 2026) with a gap.
- [ ] **Step 2: Write failing tests**

```ts
// github-data.test.ts
it('getRepos drops invalid items and keeps valid ones')
it('getRepos returns null for non-array body')
it('contarPorLinguagem ignores forks and null language')     // e.g. Java → 2, TypeScript → 2
it('corDaLinguagem known and unknown')                       // 'C#' → '#178600', 'Brainfuck' → '#8B8B9A'
describe('calcularAtividade', () => {
  it('counts from today when today > 0')
  it('counts from yesterday when today is 0')
  it('stops at a one-day gap')
  it('totalAno only sums current year across a year boundary')
  it('empty calendar → { sequenciaAtual: 0, totalAno: 0 }')
  it('23:30 São Paulo (02:30Z next day) still uses the São Paulo date')   // Review Focus #2
  it('00:30 São Paulo uses the new São Paulo day; yesterday keeps the streak') // Review Focus #2
})
```

- [ ] **Step 3:** Run. Expected: FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** Run lint, typecheck, test. Expected: PASS.
- [ ] **Step 6:** Commit `feat(github): add repos, language counts, colors and activity streak`.

---

### Task 3: Curated content and async content layer

**Files:**
- Modify: `src/content/types.ts`, `src/content/projetos.ts`, `src/content/skills.ts`, `src/content/perfil.ts`, `src/content/index.ts`, `tests/unit/content.test.ts`
- Create: `tests/unit/content-github.test.ts`

**Interfaces:**
- Consumes: `getRepos`, `getCalendario`, `calcularAtividade`, `contarPorLinguagem`, `corDaLinguagem`, `githubLogin`, `Atividade`.
- Produces:
  - `interface ProjetoCurado` exactly as spec §3.1.
  - `Projeto` gains `fonte: 'github' | 'fallback'` (all other fields unchanged).
  - `Skill` gains `linguagemGithub?: string`; `repos` no longer authored in `skills.ts`.
  - `mesclarProjeto(curado: ProjetoCurado, repo: Repo | undefined, login: string): Projeto` — rules of spec §3.2.
  - `getProjetos(): Promise<Projeto[]>` (destaque first, then `atualizadoEm` desc), `getProjeto(slug): Promise<Projeto | undefined>`, `getSkills(categoria?): Promise<Skill[]>` (same sort as Part 1; `repos` filled from `contarPorLinguagem` when `linguagemGithub` set and data available, else `undefined`), `getAtividade(): Promise<Atividade | null>`.
  - Each async getter calls `getRepos`/`getCalendario` (Next dedupes the cached fetch).
  - Content: projects `npc-forge` (destaque), `Missions_API`, `VacationSchedulerApplication`, `cardapio` with pt/en draft texts marked `// TODO(conteúdo)`; `fallback` values from the owner's current public data (stars 0/0/0/3, languages C#/Java/Java/TypeScript, last push dates as of 2026-11-10). Skills per spec §3.3 with `linguagemGithub` set for C#, Java, TypeScript, JavaScript, Python. `perfil.links.github = 'https://github.com/JGabriel02'`.

- [ ] **Step 1: Write failing tests**

```ts
// content-github.test.ts — mock '@/lib/github' getRepos/getCalendario with fixtures
it('mesclarProjeto: live data overrides fallback; fonte github; color from corDaLinguagem')
it('mesclarProjeto: repo missing → fallback values; fonte fallback; repoUrl built from login') // Review Focus #1
it('mesclarProjeto: manual demoUrl wins over homepage; empty homepage ignored')
it('getProjetos: one curated repo missing from response → only that one is fallback')         // Review Focus #1
it('getProjetos/getSkills/getAtividade with getRepos → null: all fallback, repos undefined, atividade null')
it('getSkills fills repos from language counts; framework skills stay undefined')
```

Update `content.test.ts` for the new async API and the new curated data (one destaque, unique slugs matching `/^[a-z0-9-]+$/`, all `Localized` non-empty, `repo` non-empty).

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Slugs are lowercase-kebab (e.g. `missions-api`, `vacation-scheduler`), `repo` keeps the GitHub name.
- [ ] **Step 4:** Run lint, typecheck, test. Typecheck will fail in components/routes (sync → async) — that is Task 4; to keep this commit green, make the minimal `await` edits in callers here (`Projetos.tsx`, `Skills.tsx`, `projetos/[slug]/page.tsx`, `sitemap.ts`) without UI changes. Expected: PASS.
- [ ] **Step 5:** Commit `feat(content): curate real projects and merge live github data`.

---

### Task 4: Wire routes, revalidation and skills/project UI

**Files:**
- Modify: `src/app/[locale]/page.tsx`, `src/app/[locale]/projetos/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/components/sections/Skills.tsx`, `src/components/sections/Projetos.tsx` (if needed), `tests/unit/sections-top.test.tsx`, `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: async getters (Task 3).
- Produces: `export const revalidate = 3600` on home and detail page; `generateStaticParams` and `generateMetadata` async; `sitemap()` async; Skills shows `skills.repos` (existing ICU key — verify name in messages) only when `repos > 0`.

- [ ] **Step 1: Write failing tests** — sections-top: Skills renders "N repositórios" for a skill with `repos: 2` and nothing for `repos: undefined` (mock `getSkills` as async); seo: `await sitemap()` contains both locales for every curated slug.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run lint, typecheck, test, `corepack pnpm build` (confirm `/pt/projetos/<slug>` SSG ● for all 4 slugs with revalidate 1h), `corepack pnpm test:e2e` (runs without token — fallback). Expected: PASS. `npc-forge` stays; replace any e2e/unit reference to the removed slugs `geje-api` / `painel-metricas` with a current curated slug.
- [ ] **Step 5:** Commit `feat(site): render live skills counts and hourly revalidation`.

---

### Task 5: Activity card

**Files:**
- Create: `src/components/sections/AtividadeCard.tsx`, `tests/unit/AtividadeCard.test.tsx`
- Modify: `src/components/sections/Sobre.tsx`, `src/content/messages/pt.json`, `src/content/messages/en.json`, `tests/e2e/a11y.spec.ts` (only if needed)

**Interfaces:**
- Consumes: `getAtividade()`, `getPerfil()`.
- Produces: `<AtividadeCard atividade: Atividade | null; githubUrl: string; locale: Locale />` (async server component or pure component receiving translated strings — follow the existing section test pattern). Messages `sobre.atividade.{titulo, sequencia, total, link}`: pt `"Atividade no GitHub"`, `"{count, plural, one {# dia seguido} other {# dias seguidos}}"`, `"{count, plural, one {# contribuição} other {# contribuições}} em {ano}"`, `"Ver perfil no GitHub"`; en `"GitHub activity"`, `"{count, plural, one {# day in a row} other {# days in a row}}"`, `"{count, plural, one {# contribution} other {# contributions}} in {ano}"`, `"View GitHub profile"`. Icon `Flame` (lucide, `aria-hidden`). Sobre grid becomes 4 cards when present (`md:grid-cols-2 lg:grid-cols-4`).

- [ ] **Step 1: Write failing tests** (pt and en)

```tsx
it('shows streak and total when sequenciaAtual > 0')       // "27 dias seguidos", "412 contribuições em 2026"
it('hides the streak line when sequenciaAtual is 0')       // Review Focus #5
it('shows "0 contribuições em 2026" for an empty year')    // Review Focus #5
it('renders nothing when atividade is null')
it('links to the GitHub profile')
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; keep tokens-only styling; card matches existing Sobre cards.
- [ ] **Step 4:** Run lint, typecheck, test, build, test:e2e. Expected: PASS (card hidden in e2e — no token).
- [ ] **Step 5:** Commit `feat(sobre): add github activity card`.

---

### Task 6: Contract test and documentation

**Files:**
- Create: `vitest.contract.config.mts`, `tests/contract/github.test.ts`
- Modify: `package.json` (script `"test:contract": "vitest run --config vitest.contract.config.mts"`), `README.md`

**Interfaces:**
- Consumes: `getRepos`, `getCalendario` (Task 2), `RepoSchema`, `CalendarSchema` (Task 1).

- [ ] **Step 1:** Write `tests/contract/github.test.ts`: `describe.skipIf(!process.env.GITHUB_TOKEN)` — real `getRepos('JGabriel02')` returns a non-empty array where every item parses; real `getCalendario('JGabriel02')` returns ≥ 300 days. Config: same aliases as `vitest.config.mts` but `include: ['tests/contract/**/*.test.ts']`, `environment: 'node'`, `server-only` aliased to the stub, and `next` fetch options ignored (plain fetch).
- [ ] **Step 2:** Run `corepack pnpm test:contract` without token. Expected: suite skipped, exit 0. Confirm `corepack pnpm test` does not pick it up.
- [ ] **Step 3:** README (pt) section "Dados do GitHub" per spec §9 (create fine-grained token: Public repositories read-only; set `GITHUB_TOKEN` on Vercel; curate projects in `src/content/projetos.ts`; link skills via `linguagemGithub`; 100-repo limit; how to run `test:contract`).
- [ ] **Step 4:** Run lint, typecheck, test, `corepack pnpm exec prettier --check .`. Expected: PASS.
- [ ] **Step 5:** Commit `docs(github): add contract test and token setup guide`.

---

## Spec coverage

| Spec § | Task |
|---|---|
| 1 success criteria | 2, 3, 4, 5 |
| 2 decisions (token, ISR, user, tz) | 1, 2, 4 |
| 3.1 curation / 3.2 merge | 3 |
| 3.3 skills | 3, 4 |
| 3.4 activity | 2, 5 |
| 4.1 client / 4.2 requests / 4.3 validation | 1, 2 |
| 4.4 routes + revalidate | 3 (callers), 4 |
| 5 UI | 4, 5 |
| 6 errors | 1, 2, 3, 5 |
| 7 security | 1 (Global Constraints) |
| 8 tests | every task + 6 |
| 9 docs | 1 (.env.example), 6 |
