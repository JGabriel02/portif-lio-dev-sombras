# Portfólio — Parte 1: Site público + design system

- **Data:** 2026-11-10
- **Status:** aguardando revisão
- **Escopo desta spec:** apenas a Parte 1. As partes 2–4 terão specs próprias.

## 1. Contexto e objetivo

Portfólio pessoal de um desenvolvedor full stack cujo **público principal são recrutadores** (vagas CLT/PJ, remotas e internacionais). O site precisa ser lido rápido, parecer profissional e, ao mesmo tempo, ter personalidade própria por meio de um tema visual original ("Sombra").

**Critérios de sucesso**

1. Um recrutador entende em menos de 10 segundos quem é a pessoa, o que ela faz e que está aberta a vagas.
2. O site funciona em PT e EN, com a mesma qualidade nos dois.
3. Lighthouse: Performance ≥ 95, Acessibilidade = 100, Boas práticas ≥ 95, SEO = 100 (mobile, na home de cada idioma).
4. A arquitetura de temas permite adicionar um tema novo criando apenas um arquivo de tokens, sem alterar componentes.

**Referência estrutural:** renatarsilva.com (one-page: hero → sobre → skills → projetos → contato). A identidade visual é própria.

## 2. Projeto completo (visão geral, fora do escopo desta spec)

| Parte | Conteúdo | Ordem |
|---|---|---|
| 1 | Site público + design system (**esta spec**) | 1ª |
| 2 | Integração com o GitHub (repositórios, estrelas, linguagens, sequência de commits, cache) | 2ª |
| 4 | Painel admin (login via GitHub OAuth, analytics próprio, mensagens do contato, curadoria de repositórios) | 3ª |
| 3 | Blog/artigos (rascunho, publicação, SEO, PT/EN) | 4ª |

**Infraestrutura decidida para o projeto todo:** Next.js (App Router) + TypeScript, deploy na Vercel, Postgres gerenciado (Neon) com Drizzle ORM, Auth.js com GitHub OAuth restrito à conta do dono, e analytics próprio sem cookies. A **Parte 1 não usa banco nem autenticação.**

## 3. Escopo da Parte 1

**Inclui**

- A home one-page bilíngue (`/pt`, `/en`) com 5 seções: hero, sobre, skills, projetos e contato.
- A página de detalhe de projeto (`/[locale]/projetos/[slug]`).
- Uma página 404 temática.
- O design system com o tema "Sombra" nos modos escuro e shiny.
- Os componentes de assinatura: `Mascote` e `CardFantasma`.
- O formulário de contato com validação (o envio fica para a Parte 4).
- SEO completo, OG image dinâmica e favicons.
- Testes e CI (seção 9).

**Não inclui:** a API do GitHub, a persistência de mensagens, o analytics, o login, o painel e o blog. A estrutura de pastas reserva espaço para eles.

## 4. Stack e dependências

| Item | Escolha |
|---|---|
| Framework | Next.js 15+ (App Router), React 19, TypeScript `strict` |
| Estilo | Tailwind CSS v4 lendo CSS variables do tema |
| i18n | `next-intl` (rotas `[locale]`, mensagens em JSON) |
| Validação | Zod (compartilhado entre cliente e servidor) |
| Fontes | `next/font` — Space Grotesk (títulos), Inter (texto) |
| Testes | Vitest + Testing Library; Playwright + `@axe-core/playwright` |
| Qualidade | ESLint, Prettier, Lighthouse CI (GitHub Actions) |
| Gerenciador | pnpm |
| Hospedagem | Vercel (com preview por PR) |

## 5. Estrutura de pastas

```
src/
  app/
    [locale]/
      layout.tsx            # html lang, data-theme, fontes, header, footer
      page.tsx              # home one-page
      projetos/[slug]/page.tsx
      not-found.tsx
      opengraph-image.tsx   # OG image dinâmica por idioma
    actions/contato.ts      # server action: valida com Zod e retorna o resultado (sem enviar)
    sitemap.ts
    robots.ts
    icon.svg / favicon.ico / apple-icon.png
  components/
    ui/                     # Button, Card, Chip, Section, Container
    mascote/                # Mascote.tsx, useOlhosSeguem.ts
    sections/               # Hero, Sobre, Skills, Projetos, Contato
    layout/                 # Header, Footer, ModeToggle, LocaleSwitcher, SkipLink
  themes/
    tokens.css              # camada semântica (nomes usados pelos componentes)
    sombra.css              # primitivos + mapeamento escuro/shiny
    theme-script.ts         # script inline anti-flash
  content/
    messages/pt.json, en.json
    perfil.ts               # nome, cargo, links, status de vaga
    skills.ts               # skills com anos de uso e categoria
    projetos.ts             # projetos em destaque (fonte local até a Parte 2)
  lib/
    i18n.ts, seo.ts, schemas/contato.ts
tests/
  unit/  e2e/
docs/superpowers/specs/
```

## 6. Páginas e seções

### 6.1 Header (fixo)

- Logo "jg." com o ponto na cor dos olhos (`--eye`).
- Links âncora: Sobre, Skills, Projetos, Contato.
- `LocaleSwitcher` (PT/EN) e `ModeToggle` (✨ shiny / 🌙 sombra).
- O header tem **fundo sólido com blur** ao rolar, para que o conteúdo não passe por baixo do texto. Esse é um problema observado na referência.
- No mobile, os links vão para um menu acessível (botão com `aria-expanded`).

### 6.2 Hero

- O chip "● aberto a vagas", controlado por `perfil.disponivel`. Se `false`, o chip some.
- O título "Oi, sou o João. Eu apareço onde tem **bug pra resolver.**" (EN: equivalente traduzido), com a parte final em `--accent`.
- O subtítulo com cargo e stack principal.
- Os botões **Ver projetos** (primário, rola até #projetos) e **CV** (secundário, baixa o PDF do idioma atual: `/cv/joao-gabriel-pt.pdf` ou `-en.pdf`).
- O `Mascote` à direita no desktop e abaixo do texto no mobile.

### 6.3 Sobre

- Um parágrafo curto (até 60 palavras).
- 3 cards: *O que faço*, *Como trabalho* e *O que busco*.

### 6.4 Skills

- Grupos: Frontend, Backend, Ferramentas.
- Cada skill mostra o **nome**, os **anos de uso** e, opcionalmente, o **nº de repositórios** (na Parte 1 vem de `skills.ts`, e a Parte 2 passa a calcular).
- **Sem barras de "nível"** (decisão: dados objetivos em vez de nota subjetiva).
- Um item tracejado "aprendendo: X" ao final de cada grupo, se houver.

### 6.5 Projetos

- Uma grade bento: 1 projeto em destaque ocupando 2 colunas e os demais em 1 coluna.
- Cada `CardFantasma` mostra nome, descrição de 1 linha, linguagem principal (com bolinha de cor), ★ estrelas e "atualizado há X". Na Parte 1, esses dados vêm de `projetos.ts`.
- O card inteiro é um link para `/projetos/[slug]`, com ícones secundários para o repositório e o deploy.
- Um botão "Ver todos no GitHub".

### 6.6 Detalhe do projeto

- Título, descrição longa (MDX simples em `projetos.ts` ou campo de texto), stack, links, galeria de imagens e "o que aprendi".
- Gerada estaticamente com `generateStaticParams` para cada idioma.

### 6.7 Contato

- Links: e-mail (`mailto:`), LinkedIn e GitHub.
- O formulário tem nome, e-mail e mensagem (10 a 2000 caracteres) e um campo honeypot invisível.
- A server action `contato.ts` valida com Zod e devolve `{ ok: true }` ou os erros por campo. **Na Parte 1 a mensagem não é enviada nem salva**: a UI mostra "Mensagem recebida" e um aviso de dev no log. A Parte 4 troca isso por persistência e notificação.

### 6.8 404

- O mascote espiando pela borda da página, o texto "Essa página sumiu nas sombras" e um botão para voltar à home.

### 6.9 Footer

- © ano, links sociais e o botão "voltar ao topo".

## 7. Design system

### 7.1 Tokens em duas camadas

**Semânticos** (`tokens.css`, os únicos nomes usados nos componentes):

`--bg`, `--surface`, `--surface-raised`, `--line`, `--text`, `--text-muted`, `--accent`, `--accent-hover`, `--on-accent`, `--chip-bg`, `--chip-text`, `--eye`, `--mascote-body`, `--mascote-tip`, `--focus-ring`.

**Primitivos do tema Sombra** (`sombra.css`):

| Token semântico | Escuro (`data-mode="dark"`) | Shiny (`data-mode="shiny"`) |
|---|---|---|
| `--bg` | `#140F1F` | `#F7F5FB` |
| `--surface` | `#1F1730` | `#FFFFFF` |
| `--line` | `#3A2C57` | `#E2DCEE` |
| `--text` | `#EDE7F6` | `#1E1730` |
| `--text-muted` | `#9C8FB8` | `#6B6185` |
| `--accent` | `#A77BFF` | `#6D3FD6` |
| `--on-accent` | `#140F1F` | `#FFFFFF` |
| `--chip-bg` | `#3A2C57` | `#EDE5FF` |
| `--chip-text` | `#D9C9FF` | `#4B2A9E` |
| `--eye` | `#FF4D6D` | `#E0244A` |
| `--mascote-body` | `#4A3478` | `#E9E3F4` |
| `--mascote-tip` | `#C2367A` | `#FF8AB0` |

Todas as combinações de texto e fundo listadas acima devem passar no **WCAG AA** (4.5:1 para texto normal, 3:1 para texto grande e elementos de UI). Isso é verificado por um teste unitário que calcula o contraste a partir dos valores do arquivo.

### 7.2 Aplicação do tema

- `<html data-theme="sombra" data-mode="dark|shiny">`.
- O Tailwind v4 mapeia utilitários como `bg-surface`, `text-muted` e `border-line` para as variáveis via `@theme`.
- **Modo inicial:** o cookie `mode`, se existir. Caso contrário, `prefers-color-scheme` (claro → shiny, escuro → dark).
- **Anti-flash:** um script inline mínimo no `<head>` define `data-mode` antes da primeira pintura.
- **Tema novo** = um novo arquivo `themes/<nome>.css` com os mesmos tokens semânticos. Nenhum componente muda.

### 7.3 Tipografia e forma

- Títulos: Space Grotesk 500. Texto: Inter 400/500.
- Escala (px): 14 / 16 / 20 / 28 / 40 / 56. O H1 do hero usa 56 no desktop e 40 no mobile.
- Raio: 14px nos cards e pílula nos botões e chips.
- Espaçamento base de 4px. As seções têm 96px de respiro vertical no desktop e 64px no mobile.

### 7.4 Componentes de assinatura

**`Mascote`**
- Um SVG inline original (< 3 KB): silhueta espinhosa, pontas em degradê de `--mascote-body` para `--mascote-tip`, olhos triangulares `--eye` e sorriso de canto.
- **Não reproduz** nenhum personagem existente. Não tem terceiro olho, sorriso cheio de dentes nem orelhas no formato do Gengar.
- As pupilas seguem o ponteiro (mouse ou toque) via `useOlhosSeguem`, com raio máximo de 5×3.5 unidades e atualização em `requestAnimationFrame`.
- Ele flutua com um ciclo de 3.2s e 5px de amplitude.
- É `aria-hidden="true"`. O script só carrega no cliente após a hidratação (`dynamic`/`useEffect`).
- Com `prefers-reduced-motion: reduce`, não flutua e as pupilas ficam centralizadas.

**`CardFantasma`**
- Um card com a borda inferior ondulada (SVG, `--line`).
- **Materializar:** os cards começam com opacidade de 0.35 e deslocados 6px, e chegam a 1 ao entrar na viewport (IntersectionObserver) ou ao receber hover/foco. Com `reduced-motion`, ficam sempre em 1.
- O foco por teclado tem o mesmo efeito do hover.

### 7.5 Ícones e favicon

- O favicon é o mascote espiando por uma janela arredondada roxa: `icon.svg` com `@media (prefers-color-scheme)` interno para alternar entre sombra e shiny, mais `favicon.ico` 32px e `apple-icon.png` 180px.
- Os ícones de interface vêm do Lucide.

## 8. i18n, SEO e acessibilidade

**i18n**
- Os idiomas são `pt` (padrão) e `en`. A rota `/` redireciona conforme `Accept-Language`, com fallback `pt`.
- Todo texto de interface fica em `messages/*.json`. Conteúdo como perfil, skills e projetos tem campos `{ pt, en }`.
- Um teste garante que `pt.json` e `en.json` têm exatamente as mesmas chaves.

**SEO**
- `generateMetadata` por página e idioma: title, description, canonical e `alternates.languages` (hreflang).
- `sitemap.ts` com as URLs dos dois idiomas, e `robots.ts`.
- JSON-LD `Person` na home (nome, cargo, `sameAs` com GitHub e LinkedIn).
- `opengraph-image.tsx` gera uma imagem de 1200×630 com o mascote, o nome e o cargo, no idioma da página.

**Acessibilidade**
- HTML semântico (`header`, `nav`, `main`, `section` com `aria-labelledby`, `footer`) e `SkipLink` para `#conteudo`.
- Foco visível em todos os interativos (`--focus-ring`, 2px).
- O formulário usa `<label>` reais, mostra os erros em texto associados por `aria-describedby` e um resumo de erros com `role="alert"`.
- A meta é **zero violações** no axe nos dois modos e nos dois idiomas.

## 9. Testes e CI

| Tipo | Ferramenta | Cobertura mínima |
|---|---|---|
| Unitário | Vitest | schema Zod do contato; contraste dos tokens; paridade de chaves i18n; `useOlhosSeguem` (cálculo do ângulo e limite do raio) |
| Componente | Testing Library | `ModeToggle` (troca `data-mode` e grava o cookie); `LocaleSwitcher`; formulário (erros por campo, sucesso) |
| E2E | Playwright | home em `pt` e `en` × `dark` e `shiny`: seções visíveis, âncoras, toggle de modo sem flash, formulário inválido e válido, 404 |
| Acessibilidade | `@axe-core/playwright` | zero violações nas 4 combinações |
| Performance | Lighthouse CI | as metas da seção 1, com o PR falhando abaixo delas |

**GitHub Actions** (em cada PR): `pnpm lint` → `pnpm typecheck` → `pnpm test` → build → Playwright → Lighthouse CI. A Vercel publica um preview por PR.

## 10. Tratamento de erros

- **Formulário:** erros de validação por campo. Se o honeypot vier preenchido, a resposta é um sucesso silencioso. Uma falha inesperada da action mostra "Não foi possível enviar agora. Tente pelo e-mail." com um link `mailto:`.
- **Projeto inexistente:** `notFound()` leva à 404 temática.
- **CV ausente:** o botão só é renderizado se o arquivo existir no build. Isso é checado em `perfil.ts` e garantido por um teste.
- **JavaScript desabilitado:** todo o conteúdo continua visível. Os cards não dependem de JS para opacidade (o estado inicial semitransparente só é aplicado com a classe `js` no `<html>`), e o formulário funciona como POST progressivo da server action.

## 11. Direitos e propriedade intelectual

O tema é **inspirado** em criaturas-fantasma de forma genérica. É proibido usar arte, nomes, logos ou silhuetas reconhecíveis de personagens de terceiros (por exemplo, Pokémon), inclusive no favicon e nas imagens OG. O mascote, o ícone e todas as ilustrações são originais do projeto.

## 12. Decisões em aberto para a implementação

Nenhuma decisão de produto está em aberto. Os textos finais (bio, descrição dos projetos, CV em PDF) serão fornecidos pelo dono. Até lá, o conteúdo de exemplo fica em `content/` e é marcado com `// TODO(conteúdo)`, sem bloquear a implementação.
