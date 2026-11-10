# Portfólio Parte 1 — Site público + design system: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (pt/en), statically generated one-page portfolio with the original "Sombra" theme (dark + shiny modes), its mascot, project pages, a validated contact form, full SEO, and CI quality gates.

**Architecture:** Next.js App Router with a `[locale]` segment (next-intl). All visual values live in CSS variables in two layers (semantic tokens in `tokens.css`, theme primitives in `sombra.css`), selected by `data-theme`/`data-mode` on `<html>` and exposed to Tailwind v4 via `@theme`. Content (profile, skills, projects) is typed local data with `{ pt, en }` fields, ready to be replaced by the GitHub API in Part 2. No database, no auth.

**Tech Stack:** Next.js 15+, React 19, TypeScript strict, Tailwind CSS v4, next-intl, Zod, Lucide, Vitest + Testing Library + jsdom, Playwright + @axe-core/playwright, Lighthouse CI, pnpm, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-10-portfolio-site-publico-design.md` — read it before starting any task; section numbers below (§) refer to it.

## Global Constraints

- TypeScript `strict: true`; no `any` in `src/`.
- Package manager: pnpm. Node ≥ 20.
- Components use **only semantic tokens** (§7.1 list); never raw hex outside `src/themes/`.
- Locales: `pt` (default) and `en`; every UI string lives in `src/content/messages/{pt,en}.json`.
- Theme attributes: `<html data-theme="sombra" data-mode="dark|shiny">`; cookie name `mode`, values `dark` | `shiny`.
- Fonts via `next/font/google`: Space Grotesk 500 (headings, CSS var `--font-heading`), Inter 400/500 (body, `--font-body`).
- Type scale px: 14 / 16 / 20 / 28 / 40 / 56. Card radius 14px; buttons/chips pill. Section padding 96px desktop / 64px mobile.
- All motion disabled under `prefers-reduced-motion: reduce`.
- Lighthouse mobile targets: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO = 100.
- Original art only — no third-party characters, names, logos, or recognizable silhouettes (§11). Mascot has no third eye, no toothy grin.
- Commit after every task with Conventional Commits; every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Invalid `mode` cookie** (e.g. `mode=purple`) → must fall back to `prefers-color-scheme`, never render without `data-mode`. Test in Task 3.
2. **JavaScript disabled** → all sections and project cards fully visible (opacity 1), form submits via progressive POST. Test in Task 12 (Playwright context with `javaScriptEnabled: false`).
3. **Unsupported / malformed `Accept-Language`** (e.g. `fr-FR`, `*`, empty) on `/` → redirect to `/pt`. Test in Task 4.
4. **Contact input at boundaries** — message of 9 / 10 / 2000 / 2001 chars, whitespace-only name, honeypot filled → correct error or silent success. Test in Task 10.
5. **Touch devices / pointer leaving the window** → mascot pupils follow `pointermove` (covers touch) and return to center on `pointerleave`; never exceed max offset. Test in Task 7.

---

## File Map

| File | Responsibility |
|---|---|
| `src/themes/tokens.css` | semantic token names + Tailwind `@theme` mapping |
| `src/themes/sombra.css` | Sombra primitives per mode |
| `src/themes/palette.ts` | same values as TS (single source for contrast test + OG image) |
| `src/themes/theme-script.ts` | inline anti-flash script string + `resolveMode()` |
| `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts` | next-intl routing |
| `src/content/types.ts` | `Localized<T>`, `Perfil`, `Skill`, `Projeto` |
| `src/content/{perfil,skills,projetos}.ts` | typed content |
| `src/components/ui/*` | Button, Card, Chip, Section, Container |
| `src/components/layout/*` | Header, Footer, ModeToggle, LocaleSwitcher, SkipLink, MobileMenu |
| `src/components/mascote/*` | Mascote, useOlhosSeguem, eyeMath |
| `src/components/sections/*` | Hero, Sobre, Skills, Projetos, Contato |
| `src/components/projetos/CardFantasma.tsx` | project card |
| `src/lib/schemas/contato.ts`, `src/app/actions/contato.ts` | contact validation + action |
| `src/lib/seo.ts` | metadata + JSON-LD builders |

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: project via `create-next-app`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.prettierrc`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` scripts, `tsconfig.json`, `.gitignore`

**Interfaces:**
- Produces: scripts `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:e2e` (`playwright test`), `format`. Path alias `@/*` → `src/*`.

- [ ] **Step 1:** Run `pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack` in the repo root (keep existing `docs/`).
- [ ] **Step 2:** Add dev deps: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test @axe-core/playwright prettier prettier-plugin-tailwindcss`. Run `pnpm exec playwright install chromium`.
- [ ] **Step 3:** Configure Vitest (`environment: 'jsdom'`, `setupFiles: ['vitest.setup.ts']` importing `@testing-library/jest-dom/vitest`, alias `@` → `src`, `include: ['tests/unit/**/*.test.{ts,tsx}']`). Configure Playwright (`testDir: 'tests/e2e'`, `webServer: { command: 'pnpm build && pnpm start', port: 3000, reuseExistingServer: !process.env.CI }`, project `chromium`).
- [ ] **Step 4:** Write `tests/unit/smoke.test.ts` (`expect(1 + 1).toBe(2)`) and `tests/e2e/smoke.spec.ts` (`page.goto('/')` → response status < 400).
- [ ] **Step 5:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`. Expected: all pass.
- [ ] **Step 6:** Commit `chore: scaffold next.js app with vitest, playwright and prettier`.

---

### Task 2: Theme tokens, palette and contrast guarantee

**Files:**
- Create: `src/themes/palette.ts`, `src/themes/tokens.css`, `src/themes/sombra.css`, `src/lib/contrast.ts`, `tests/unit/contrast.test.ts`, `tests/unit/palette-css-sync.test.ts`
- Modify: `src/app/globals.css` (import tokens + sombra, base `body { background: var(--bg); color: var(--text) }`)

**Interfaces:**
- Produces:
  - `type Mode = 'dark' | 'shiny'`
  - `type TokenName = 'bg' | 'surface' | 'surface-raised' | 'line' | 'text' | 'text-muted' | 'accent' | 'accent-hover' | 'on-accent' | 'chip-bg' | 'chip-text' | 'eye' | 'mascote-body' | 'mascote-tip' | 'focus-ring'`
  - `export const sombra: Record<Mode, Record<TokenName, string>>` (values from §7.1 table; choose `surface-raised`, `accent-hover`, `focus-ring` so they pass the test below — suggested dark `#2A2040` / `#B994FF` / `#A77BFF`, shiny `#FFFFFF` / `#5A2FC0` / `#6D3FD6`)
  - `contrastRatio(hexA: string, hexB: string): number` (WCAG 2.x relative luminance)
  - Tailwind utilities: `bg-bg`, `bg-surface`, `bg-surface-raised`, `border-line`, `text-text`, `text-muted`, `bg-accent`, `text-accent`, `text-on-accent`, `bg-chip`, `text-chip`, `text-eye`, `font-heading`, `font-body`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/contrast.test.ts
const pairs: [fg: TokenName, bg: TokenName, min: number][] = [
  ['text','bg',4.5], ['text','surface',4.5], ['text-muted','bg',4.5], ['text-muted','surface',4.5],
  ['on-accent','accent',4.5], ['chip-text','chip-bg',4.5], ['accent','bg',3], ['accent','surface',3],
  ['focus-ring','bg',3], ['eye','bg',3],
];
it('contrastRatio white/black is 21', () => expect(contrastRatio('#FFFFFF','#000000')).toBeCloseTo(21, 1));
for (const mode of ['dark','shiny'] as const)
  for (const [fg,bg,min] of pairs)
    it(`${mode}: ${fg} on ${bg} ≥ ${min}`, () => expect(contrastRatio(sombra[mode][fg], sombra[mode][bg])).toBeGreaterThanOrEqual(min));
```

```ts
// tests/unit/palette-css-sync.test.ts — reads src/themes/sombra.css as text
// for each mode/token asserts the CSS contains `--${token}: ${value}` inside the
// [data-theme="sombra"][data-mode="${mode}"] block (case-insensitive hex).
```

- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement `palette.ts`, `contrast.ts`, `sombra.css` (selectors `[data-theme="sombra"][data-mode="dark"]` and `…="shiny"`), `tokens.css` (`@theme inline` mapping `--color-surface: var(--surface)` etc., fonts, radius `--radius-card: 14px`). If any shiny/dark pair fails, adjust only the derived tokens (`surface-raised`, `accent-hover`, `focus-ring`); §7.1 table values are fixed.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(theme): add sombra tokens with wcag contrast tests`.

---

### Task 3: Mode resolution, anti-flash script and ModeToggle

**Files:**
- Create: `src/themes/theme-script.ts`, `src/components/layout/ModeToggle.tsx`, `tests/unit/theme-script.test.ts`, `tests/unit/ModeToggle.test.tsx`
- Modify: root layout (temporary `src/app/layout.tsx`; moved to `[locale]/layout.tsx` in Task 4) to inject `<script dangerouslySetInnerHTML={{ __html: themeScript }} />` in `<head>` and `suppressHydrationWarning` on `<html>`.

**Interfaces:**
- Produces:
  - `resolveMode(cookie: string | undefined, prefersDark: boolean): Mode`
  - `export const themeScript: string` — IIFE that reads `document.cookie` `mode`, `matchMedia('(prefers-color-scheme: dark)')`, sets `data-theme="sombra"`, `data-mode`, and adds class `js` to `<html>`. Must embed the same logic as `resolveMode` (generate the string from `resolveMode.toString()` or duplicate with the shared test below).
  - `<ModeToggle labels={{ toShiny: string; toDark: string }} />` — client component; button with `aria-label` = target-mode label; icon ✨ (`Sparkles`) when current is dark, 🌙 (`Moon`) when shiny; on click flips `document.documentElement.dataset.mode` and writes `mode=<value>; path=/; max-age=31536000; samesite=lax`.

- [ ] **Step 1: Write failing tests**

```ts
// theme-script.test.ts
expect(resolveMode('dark', false)).toBe('dark');
expect(resolveMode('shiny', true)).toBe('shiny');
expect(resolveMode(undefined, true)).toBe('dark');
expect(resolveMode(undefined, false)).toBe('shiny');
expect(resolveMode('purple', true)).toBe('dark');    // Review Focus #1
expect(resolveMode('', false)).toBe('shiny');
// execute themeScript via new Function in jsdom with document.cookie='mode=purple'
// and matchMedia mocked → documentElement.dataset.mode === 'shiny' (prefers light), classList contains 'js'
```

```tsx
// ModeToggle.test.tsx — with <html data-mode="dark">
// click → dataset.mode === 'shiny', document.cookie contains 'mode=shiny', button aria-label === labels.toDark
// click again → 'dark'
```

- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(theme): resolve mode without flash and add mode toggle`.

---

### Task 4: Internationalization and locale routing

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `src/content/messages/pt.json`, `src/content/messages/en.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx` (placeholder `<main id="conteudo">`), `src/components/layout/LocaleSwitcher.tsx`, `tests/unit/messages-parity.test.ts`, `tests/unit/LocaleSwitcher.test.tsx`, `tests/e2e/i18n.spec.ts`
- Modify: `next.config.ts` (next-intl plugin); delete root `src/app/page.tsx`; move theme script + fonts into `[locale]/layout.tsx` (`<html lang={locale}>`).

**Interfaces:**
- Produces:
  - `routing = defineRouting({ locales: ['pt','en'], defaultLocale: 'pt', localePrefix: 'always' })`; navigation helpers `Link`, `usePathname`, `useRouter` exported from `src/i18n/navigation.ts`.
  - `type Locale = 'pt' | 'en'`.
  - Message namespaces (keys must exist in both files): `nav.{sobre,skills,projetos,contato,menu}`, `mode.{toShiny,toDark}`, `locale.{label,pt,en}`, `skip`, `hero.{status,greeting,tagline,highlight,subtitle,ctaProjects,ctaCv}`, `sobre.{title,body,cards.{faco,trabalho,busco}.{title,body}}`, `skills.{title,frontend,backend,tools,years,repos,learning}`, `projetos.{title,featured,updated,viewAll,repo,demo,learned,stack,back}`, `contato.{title,intro,name,email,message,send,sending,success,error,fallback,errors.{nameRequired,emailInvalid,messageMin,messageMax}}`, `notFound.{title,body,back}`, `footer.{rights,top}`, `meta.{title,description}`.
  - `<LocaleSwitcher />` — links to the same pathname in the other locale; `aria-label` from `locale.label`; current locale has `aria-current="true"`.

- [ ] **Step 1: Write failing tests**

```ts
// messages-parity.test.ts: flattened key sets of pt.json and en.json are equal; no value is empty string.
// LocaleSwitcher.test.tsx: on /pt/projetos/x renders link href '/en/projetos/x'.
// i18n.spec.ts (Playwright):
//   request '/' with Accept-Language 'en-US,en;q=0.9' → final URL /en
//   for each of 'fr-FR', '*', '' → final URL /pt          // Review Focus #3
//   /pt has <html lang="pt">, /en has <html lang="en">
//   /de/anything → 404
```

- [ ] **Step 2:** Run unit + e2e. Expected: FAIL.
- [ ] **Step 3:** Implement with next-intl; middleware matcher excludes `api`, `_next`, files with extensions, `cv/`. Fill messages with real pt copy from spec §6 and English equivalents; bio text marked `TODO(conteúdo)` in a code comment in `perfil.ts`, not in JSON.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(i18n): add pt/en routing, messages and locale switcher`.

---

### Task 5: Typed content (profile, skills, projects)

**Files:**
- Create: `src/content/types.ts`, `src/content/perfil.ts`, `src/content/skills.ts`, `src/content/projetos.ts`, `src/content/index.ts`, `public/cv/.gitkeep`, `tests/unit/content.test.ts`

**Interfaces:**
- Produces:

```ts
type Localized<T = string> = { pt: T; en: T };
interface Perfil { nome: string; cargo: Localized; disponivel: boolean; email: string;
  links: { github: string; linkedin: string }; cv: Partial<Record<Locale, string>>; // public paths, e.g. '/cv/joao-gabriel-pt.pdf'
  bio: Localized; }
type SkillCategoria = 'frontend' | 'backend' | 'tools';
interface Skill { nome: string; categoria: SkillCategoria; anos: number; repos?: number; aprendendo?: boolean }
interface Projeto { slug: string; nome: string; resumo: Localized; descricao: Localized; aprendizados: Localized;
  linguagem: { nome: string; cor: string }; stack: string[]; estrelas: number; atualizadoEm: string; // ISO date
  repoUrl: string; demoUrl?: string; imagens: { src: string; alt: Localized }[]; destaque: boolean }
export function getPerfil(): Perfil
export function getSkills(categoria?: SkillCategoria): Skill[]   // sorted: non-learning by anos desc, then learning
export function getProjetos(): Projeto[]                         // destaque first, then atualizadoEm desc
export function getProjeto(slug: string): Projeto | undefined
export function cvDisponivel(locale: Locale): string | null      // path only if file exists in public/
```

- [ ] **Step 1: Write failing tests**

```ts
// content.test.ts
// exactly one projeto has destaque === true; getProjetos()[0].destaque === true
// slugs are unique and match /^[a-z0-9-]+$/
// every Localized field has non-empty pt and en
// getSkills('frontend') all categoria 'frontend'; learning items come last
// cvDisponivel('pt') === null when public/cv/joao-gabriel-pt.pdf absent; returns path when present (use tmp file via fs + cleanup)
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement with 3–4 sample projects (e.g. `npc-forge` featured) and the skills from the mockups; `cvDisponivel` uses `fs.existsSync(path.join(process.cwd(),'public',p))` (server-only module, `import 'server-only'`).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(content): add typed profile, skills and projects`.

---

### Task 6: UI primitives and page shell (header, footer, skip link, mobile menu)

**Files:**
- Create: `src/components/ui/{Button,Card,Chip,Section,Container}.tsx`, `src/components/layout/{Header,Footer,SkipLink,MobileMenu}.tsx`, `tests/unit/MobileMenu.test.tsx`, `tests/unit/Header.test.tsx`
- Modify: `src/app/[locale]/layout.tsx` (render SkipLink, Header, `{children}`, Footer)

**Interfaces:**
- Consumes: `ModeToggle`, `LocaleSwitcher`, messages `nav.*`, `skip`, `footer.*`.
- Produces:
  - `<Button variant="primary" | "secondary" href?: string ...>` (renders `<a>` with href, else `<button>`); pill, focus ring `--focus-ring` 2px.
  - `<Card as?: ElementType className?>` — `bg-surface border-line rounded-card`.
  - `<Chip tone="default" | "accent">`.
  - `<Section id: string; titleId: string; title: ReactNode>` — `<section aria-labelledby={titleId}>`, vertical padding per Global Constraints.
  - `<Container>` max-width 1120px, 16px side gutter on mobile.
  - `<Header>`: logo "jg." (dot `text-eye`), anchor links `#sobre #skills #projetos #contato` (prefixed with `/${locale}` when not on home), LocaleSwitcher, ModeToggle; sticky; adds `data-scrolled` after 8px scroll → solid `bg-bg/85` + `backdrop-blur`.
  - `<MobileMenu>` below 768px: button `aria-expanded`, `aria-controls`; Escape closes and returns focus to button.
  - `<SkipLink>` → `#conteudo`, visible on focus.

- [ ] **Step 1: Write failing tests** — MobileMenu: toggles `aria-expanded` false→true, Escape → false and `document.activeElement` is the button. Header: renders 4 nav links with hrefs ending `#sobre`, `#skills`, `#projetos`, `#contato`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test && pnpm build`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(layout): add ui primitives, header, footer and mobile menu`.

---

### Task 7: Mascot and eye tracking

**Files:**
- Create: `src/components/mascote/eyeMath.ts`, `src/components/mascote/useOlhosSeguem.ts`, `src/components/mascote/Mascote.tsx`, `src/components/mascote/MascoteSvg.tsx`, `tests/unit/eyeMath.test.ts`, `tests/unit/Mascote.test.tsx`

**Interfaces:**
- Produces:
  - `pupilOffset(eye: {x:number;y:number}, pointer: {x:number;y:number}, max: {x:number;y:number} = {x:5,y:3.5}): {dx:number;dy:number}` — `dx = cos(a)*max.x`, `dy = sin(a)*max.y`, `a = atan2(py-ey, px-ex)`; returns `{0,0}` when pointer equals eye.
  - `useOlhosSeguem(svgRef: RefObject<SVGSVGElement>, eyes: {x:number;y:number}[], viewBox: {w:number;h:number}): {dx:number;dy:number}[]` — listens to `window` `pointermove` (covers mouse + touch), throttled with `requestAnimationFrame`; resets all to `{0,0}` on `document` `pointerleave` / `blur`; returns all zeros when `matchMedia('(prefers-reduced-motion: reduce)')` matches.
  - `<MascoteSvg mode-agnostic pupils={{dx,dy}[]} />` — pure SVG, viewBox `0 0 220 200`, fills from CSS vars (`--mascote-body`, `--mascote-tip`, `--eye`, `--bg`), gradient id unique via `useId`; geometry from the approved mockup (spiky silhouette path, triangular eyes at (86,106) and (134,106), side smile). `aria-hidden="true"`, `focusable="false"`.
  - `<Mascote className? />` — client component wrapping MascoteSvg + hook; float animation class `animate-flutuar` (3.2s, 5px) disabled under reduced motion.

- [ ] **Step 1: Write failing tests**

```ts
// eyeMath.test.ts
expect(pupilOffset({x:0,y:0},{x:100,y:0})).toEqual({dx:5,dy:0});
expect(pupilOffset({x:0,y:0},{x:0,y:100}).dy).toBeCloseTo(3.5);
expect(pupilOffset({x:0,y:0},{x:0,y:0})).toEqual({dx:0,dy:0});
// for 50 random pointers: |dx| ≤ 5 and |dy| ≤ 3.5          // Review Focus #5
```

```tsx
// Mascote.test.tsx
// svg has aria-hidden="true"
// dispatch pointermove far right → after rAF, first pupil cx > 86
// dispatch pointerleave on document → pupil cx === 86
// with matchMedia reduced-motion true → pointermove leaves cx === 86
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Verify gzipped SVG markup < 3 KB (`pnpm build` then inspect, or a unit test rendering `renderToStaticMarkup(<MascoteSvg pupils=…/>)` and asserting `.length < 3072`).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(mascote): add original ghost mascot with pointer-following eyes`.

---

### Task 8: Hero, Sobre and Skills sections

**Files:**
- Create: `src/components/sections/{Hero,Sobre,Skills}.tsx`, `tests/unit/sections-top.test.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getPerfil`, `getSkills`, `cvDisponivel`, `Mascote`, `Button`, `Chip`, `Card`, `Section`.
- Produces: server components `<Hero locale />`, `<Sobre locale />`, `<Skills locale />` with section ids `inicio`, `sobre`, `skills`; `<main id="conteudo">` in page.

- [ ] **Step 1: Write failing tests**
  - Hero shows status chip when `disponivel: true`, hides it when `false` (mock `getPerfil`).
  - Hero H1 contains `hero.highlight` text inside an element with class `text-accent`.
  - CV button rendered only when `cvDisponivel(locale)` returns a path; its href equals that path and has `download` attribute.
  - Skills renders three groups; each skill shows `anos` text (e.g. "4 anos" / "4 years"); no element with role `progressbar` exists (no level bars, §6.4); learning skills rendered with dashed style marker `data-aprendendo`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per §6.2–6.4 (hero H1 56px desktop / 40px mobile; mascot right on ≥768px, below text on mobile).
- [ ] **Step 4:** Run `pnpm test && pnpm build`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(home): add hero, about and skills sections`.

---

### Task 9: Project cards, Projetos section, project detail page and 404

**Files:**
- Create: `src/components/projetos/CardFantasma.tsx`, `src/components/projetos/Materializar.tsx`, `src/components/sections/Projetos.tsx`, `src/app/[locale]/projetos/[slug]/page.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/[locale]/[...rest]/page.tsx` (calls `notFound()`), `src/lib/relativeTime.ts`, `tests/unit/relativeTime.test.ts`, `tests/unit/CardFantasma.test.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getProjetos`, `getProjeto`, `Projeto`, `Card`, `MascoteSvg`.
- Produces:
  - `relativeTime(iso: string, locale: Locale, now?: Date): string` via `Intl.RelativeTimeFormat` ("há 3 dias" / "3 days ago").
  - `<CardFantasma projeto locale featured?: boolean />` — whole card is a `Link` to `/${locale}/projetos/${slug}`; secondary repo/demo icon links are siblings (not nested anchors) positioned over the card; wavy bottom border SVG uses `--line`.
  - `<Materializar>` — client wrapper: when `<html>` has class `js` and reduced motion is off, starts `opacity:.35; translateY(6px)` and transitions to 1/0 on IntersectionObserver entry, `:hover` or `:focus-within`. CSS rule scoped to `.js` so no-JS stays at opacity 1.
  - `generateStaticParams()` for detail page returning every `{locale, slug}`; `notFound()` when `getProjeto` is undefined.

- [ ] **Step 1: Write failing tests**
  - `relativeTime('2026-11-07T00:00:00Z','pt', new Date('2026-11-10T00:00:00Z'))` → `'há 3 dias'`; `'en'` → `'3 days ago'`.
  - CardFantasma: main link href `/pt/projetos/npc-forge`; shows `★ 24`; no `<a>` inside another `<a>` (`container.querySelectorAll('a a').length === 0`).
  - Featured card has class spanning two columns (`md:col-span-2`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per §6.5, §6.6, §6.8 (404 shows mascot peeking from page edge, text from `notFound.*`, button back to `/${locale}`).
- [ ] **Step 4:** Run `pnpm test && pnpm build`; confirm build output lists `/pt/projetos/npc-forge` and `/en/projetos/npc-forge` as static (●/SSG).
- [ ] **Step 5:** Commit `feat(projetos): add ghost cards, projects section, detail page and 404`.

---

### Task 10: Contact section, schema and server action

**Files:**
- Create: `src/lib/schemas/contato.ts`, `src/app/actions/contato.ts`, `src/components/sections/Contato.tsx`, `src/components/sections/ContatoForm.tsx`, `tests/unit/contato-schema.test.ts`, `tests/unit/contato-action.test.ts`, `tests/unit/ContatoForm.test.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Produces:
  - `contatoSchema` (Zod): `nome` trimmed string 1–100 (`errors.nameRequired`), `email` `z.string().trim().email()` (`errors.emailInvalid`), `mensagem` trimmed 10–2000 (`messageMin` / `messageMax`), `site` honeypot `z.string().optional()`. Error messages are **message keys**, translated in the UI.
  - `type ContatoState = { status: 'idle' } | { status: 'ok' } | { status: 'invalid'; fieldErrors: Partial<Record<'nome'|'email'|'mensagem', string>>; values: { nome: string; email: string; mensagem: string } } | { status: 'error' }`
  - `enviarContato(prev: ContatoState, formData: FormData): Promise<ContatoState>` (`'use server'`): honeypot filled → `{status:'ok'}` without logging; invalid → `invalid`; valid → `console.info('[contato] dev only, not sent', { nome, email, length })` and `{status:'ok'}`; unexpected throw → `{status:'error'}`.
  - `<ContatoForm>` uses `useActionState(enviarContato, {status:'idle'})`, `<form action={formAction}>` (works without JS), labels, `aria-describedby` per field error, `aria-invalid`, summary `role="alert"`, honeypot input `name="site"` visually hidden + `tabIndex={-1}` + `autoComplete="off"`; on `error` shows `contato.fallback` with `mailto:` link.

- [ ] **Step 1: Write failing tests**

```ts
// contato-schema.test.ts                                     // Review Focus #4
const base = { nome: 'Ana', email: 'ana@exemplo.com', mensagem: 'a'.repeat(10) };
expect(contatoSchema.safeParse(base).success).toBe(true);
expect(contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(9) }).success).toBe(false);
expect(contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(2000) }).success).toBe(true);
expect(contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(2001) }).success).toBe(false);
expect(contatoSchema.safeParse({ ...base, nome: '   ' }).success).toBe(false);
expect(contatoSchema.safeParse({ ...base, mensagem: '          ' + 'abc' }).success).toBe(false); // trimmed < 10
expect(contatoSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false);
```

```ts
// contato-action.test.ts
// honeypot 'site=bot' with invalid fields → { status: 'ok' }
// invalid email → status 'invalid', fieldErrors.email === 'errors.emailInvalid', values preserved
// valid → { status: 'ok' }
```

```tsx
// ContatoForm.test.tsx — submitting empty form shows 3 field errors, each input has aria-invalid="true"
// and aria-describedby pointing to an element with the translated text; an element with role="alert" exists.
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per §6.7 and §10.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(contato): add contact form with zod validation and server action`.

---

### Task 11: SEO, OG image and icons

**Files:**
- Create: `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/[locale]/opengraph-image.tsx`, `src/app/icon.svg`, `src/app/favicon.ico`, `src/app/apple-icon.png`, `scripts/gerar-icones.ts`, `tests/unit/seo.test.ts`
- Modify: `src/app/[locale]/layout.tsx` and page files (`generateMetadata`), `src/app/[locale]/page.tsx` (JSON-LD `<script type="application/ld+json">`)

**Interfaces:**
- Consumes: `getPerfil`, `getProjetos`, `sombra` palette.
- Produces:
  - `SITE_URL` from `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`.
  - `buildMetadata({ locale, path, title?, description? }): Metadata` — canonical `${SITE_URL}/${locale}${path}`, `alternates.languages` `{ pt: …/pt${path}, en: …/en${path}, 'x-default': …/pt${path} }`, openGraph locale `pt_BR` / `en_US`.
  - `personJsonLd(locale): object` — `@type: 'Person'`, `name`, `jobTitle`, `url`, `sameAs: [github, linkedin]`.
  - `icon.svg`: favicon from approved mockup (mascot peeking through rounded purple window), with internal `<style>@media (prefers-color-scheme: dark){…}</style>` switching sombra/shiny fills. `scripts/gerar-icones.ts` (run with `pnpm tsx`, dev dep `sharp`) rasterizes it to `favicon.ico` (32px) and `apple-icon.png` (180px, dark variant); generated files are committed.
  - OG image 1200×630 via `ImageResponse`: `--bg` dark background, mascot SVG, name, localized `cargo`; fonts loaded from `next/font`-compatible local TTF in `src/app/[locale]/_og/`.

- [ ] **Step 1: Write failing tests**
  - `buildMetadata({locale:'en', path:'/projetos/npc-forge'})` → canonical ends `/en/projetos/npc-forge`; `alternates.languages.pt` ends `/pt/projetos/npc-forge`; `x-default` points to pt.
  - `sitemap()` contains, for every route (home + each project), both locale URLs.
  - `personJsonLd('pt').sameAs` equals `[perfil.links.github, perfil.links.linkedin]`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; run `pnpm tsx scripts/gerar-icones.ts`.
- [ ] **Step 4:** Run `pnpm test && pnpm build`; open `/pt/opengraph-image` locally and confirm a 1200×630 PNG renders.
- [ ] **Step 5:** Commit `feat(seo): add metadata, hreflang, sitemap, json-ld, og image and icons`.

---

### Task 12: End-to-end, accessibility, Lighthouse and CI

**Files:**
- Create: `tests/e2e/home.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/no-js.spec.ts`, `tests/e2e/contato.spec.ts`, `lighthouserc.json`, `.github/workflows/ci.yml`, `README.md`
- Delete: `tests/e2e/smoke.spec.ts`, `tests/unit/smoke.test.ts`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the e2e suites**
  - `home.spec.ts`, for each `locale × mode` (set cookie `mode` before navigation): sections `#inicio #sobre #skills #projetos #contato` visible; clicking nav "Projetos" scrolls so `#projetos` heading is in viewport and not covered by the header (heading's bounding top ≥ header height); `html[data-mode]` equals the cookie value **on the first response HTML snapshot** (check via `page.on('domcontentloaded')` evaluation) — no flash; toggling mode persists across reload; `/pt/xyz` shows notFound title.
  - `a11y.spec.ts`: `new AxeBuilder({ page }).analyze()` → `violations` is `[]` for `/pt`, `/en`, `/pt/projetos/npc-forge`, 404, in both modes.
  - `no-js.spec.ts` (context `javaScriptEnabled: false`) — Review Focus #2: every `CardFantasma` has computed opacity `"1"`; submitting a valid form navigates/re-renders with `contato.success` text.
  - `contato.spec.ts`: invalid submit shows errors and focus moves to the alert summary; valid submit shows success.
- [ ] **Step 2:** Run `pnpm test:e2e`. Expected: PASS (fix any real defects in the owning task's files, commit separately as `fix:`).
- [ ] **Step 3:** Add `lighthouserc.json` (`collect.url`: `http://localhost:3000/pt`, `/en`; `settings.preset` mobile default; assertions `categories:performance ≥ 0.95`, `accessibility = 1`, `best-practices ≥ 0.95`, `seo = 1`). Run `pnpm dlx @lhci/cli autorun`. Expected: all assertions pass.
- [ ] **Step 4:** Add `.github/workflows/ci.yml` on `pull_request` and `push` to `main`: pnpm setup, Node 20, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec playwright install --with-deps chromium`, `pnpm test:e2e`, `pnpm dlx @lhci/cli autorun`.
- [ ] **Step 5:** Write `README.md` (stack, scripts, how to add a theme: create `src/themes/<nome>.css` + palette entry, how to edit content in `src/content/`, where to drop CVs `public/cv/joao-gabriel-{pt,en}.pdf`).
- [ ] **Step 6:** Run the full chain locally: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`. Expected: all pass.
- [ ] **Step 7:** Commit `test: add e2e, accessibility and lighthouse ci gates`.

---

## Spec coverage

| Spec § | Task |
|---|---|
| 1 success criteria (Lighthouse, bilingual, theme file only) | 2, 4, 12 |
| 4 stack | 1 |
| 5 folder structure | all (File Map) |
| 6.1 header (solid on scroll, mobile menu) | 6 |
| 6.2 hero / 6.3 sobre / 6.4 skills | 8 |
| 6.5 projetos / 6.6 detalhe / 6.8 404 | 9 |
| 6.7 contato | 10 |
| 6.9 footer | 6 |
| 7.1 tokens + contrast | 2 |
| 7.2 theme application + anti-flash | 3 |
| 7.3 type & shape | 2, 6 |
| 7.4 Mascote / CardFantasma | 7, 9 |
| 7.5 icons | 11 |
| 8 i18n / SEO / a11y | 4, 11, 6, 12 |
| 9 tests & CI | every task + 12 |
| 10 error handling | 5 (CV), 9 (notFound), 10 (form), 9 + 12 (no-JS) |
| 11 IP | Global Constraints, 7, 11 |
