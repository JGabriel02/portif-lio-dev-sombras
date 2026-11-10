# Portfólio — João Gabriel

Site público bilíngue (PT/EN) de portfólio de desenvolvedor full stack, com tema
"sombra" em dois modos (`dark` e `shiny`), mascote em SVG e cards de projeto
"fantasma".

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript estrito
- Tailwind CSS v4 com tokens semânticos (`src/themes/`)
- next-intl para i18n (`/pt` padrão e `/en`; negociação de idioma em `src/proxy.ts`)
- Zod + Server Action no formulário de contato (funciona sem JavaScript)
- Vitest + Testing Library (unitários), Playwright + axe-core (e2e e acessibilidade)
- Lighthouse CI para as metas de performance, acessibilidade, boas práticas e SEO

## Requisitos

- Node 22 ou superior (o Vitest 5 não roda no Node 20)
- pnpm 12 (versão fixada em `packageManager`; use `corepack enable`)

## Scripts

| Comando                      | O que faz                                                         |
| ---------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                   | Servidor de desenvolvimento                                       |
| `pnpm build`                 | Build de produção                                                 |
| `pnpm start`                 | Serve o build de produção em `localhost:3000`                     |
| `pnpm lint`                  | ESLint                                                            |
| `pnpm typecheck`             | `next typegen` + `tsc --noEmit`                                   |
| `pnpm test`                  | Testes unitários (Vitest)                                         |
| `pnpm test:e2e`              | Testes e2e e axe (Playwright; faz build e sobe o site)            |
| `pnpm format`                | Prettier                                                          |
| `pnpm dlx @lhci/cli autorun` | Lighthouse CI (config em `lighthouserc.json`; exige build prévio) |

Em ambientes sem `pnpm` no PATH, use `corepack pnpm <comando>`.

Na primeira vez, instale o navegador do Playwright:
`pnpm exec playwright install chromium`.

## Deploy na Vercel

Configure as variáveis de ambiente do projeto:

- `NEXT_PUBLIC_SITE_URL`: origem pública com `https://` (ex.: `https://seu-dominio.dev`).
  Usada em canonical, hreflang, sitemap, JSON-LD e Open Graph. Se omitida, o site usa
  `VERCEL_PROJECT_PRODUCTION_URL`, depois `VERCEL_URL` e, por fim, `http://localhost:3000`.
- `NEXT_PUBLIC_CONTATO_ATIVO`: `true` para exibir o formulário de contato. Enquanto não
  for `true`, em produção (`VERCEL_ENV=production`) a seção Contato mostra apenas
  e-mail, LinkedIn e GitHub com um aviso de que o formulário chega em breve.
  Ative somente quando o envio real existir (hoje a Server Action não envia nada).

Veja `.env.example`.

## Dados do GitHub

O site lê repositórios, linguagens e atividade da conta pública `JGabriel02` (login
derivado de `perfil.links.github`) e revalida a cada hora (ISR). Sem token ou com a API
fora do ar, o site continua funcionando com o `fallback` estático de cada projeto.

### Criar o token

1. Em github.com, vá em Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
2. Defina nome e expiração.
3. Em Repository access, escolha **Public repositories**.
4. Não adicione nenhuma permissão extra (somente leitura de dados públicos).
5. Gere e copie o token.

### Configurar

- Na Vercel: Project → Settings → Environment Variables, adicione `GITHUB_TOKEN` em
  **Production** e **Preview** e faça um novo deploy.
- Local (opcional): coloque `GITHUB_TOKEN=...` em `.env.local`. Nunca use o prefixo
  `NEXT_PUBLIC_` e nunca faça commit do token.

### Curar projetos

Edite `src/content/projetos.ts`. Cada item de `ProjetoCurado` tem:

- `slug`: rota do site (`/[locale]/projetos/<slug>`).
- `repo`: nome exato do repositório na conta.
- `destaque`: `true` em exatamente um projeto (o destacado).
- `resumo`, `descricao`, `aprendizados`: textos em PT e EN.
- `stack`, `imagens` e `demoUrl` (opcional; vence o homepage do GitHub).
- `fallback`: `linguagem`, `estrelas` e `atualizadoEm` (data ISO) usados quando o
  repositório não vem da API.

### Skills e contagem de repositórios

Em `src/content/skills.ts`, defina `linguagemGithub` com o nome da linguagem como o
GitHub a exibe (ex.: `'TypeScript'`) para mostrar quantos repositórios públicos usam
aquela linguagem. Sem `linguagemGithub`, a skill não exibe contagem.

### Limites

Só os 100 repositórios mais recentemente enviados (`per_page=100`, sem paginação) são
considerados.

### Teste de contrato

`corepack pnpm test:contract` chama a API real do GitHub. Ele não roda em
`pnpm test` nem na CI e é ignorado (saída 0) quando `GITHUB_TOKEN` não está definido:

```bash
GITHUB_TOKEN=... corepack pnpm test:contract
```

No PowerShell:

```powershell
$env:GITHUB_TOKEN='seu_token'; corepack pnpm test:contract
```

O Vitest não carrega o `.env.local`; exporte a variável no shell como acima.

## Como adicionar um tema

O tema atual é `sombra`. Para criar outro (por exemplo `aurora`):

1. Crie `src/themes/aurora.css` com dois blocos, um por modo, definindo todos os
   tokens (veja `src/themes/sombra.css`):
   `[data-theme='aurora'][data-mode='dark'] { --bg: ...; }` e
   `[data-theme='aurora'][data-mode='shiny'] { ... }`.
2. Importe o arquivo em `src/app/globals.css` (`@import '../themes/aurora.css';`).
3. Adicione a paleta em `src/themes/palette.ts` (`export const aurora = { dark: {...}, shiny: {...} }`).
   Os testes de contraste e de sincronia CSS/paleta (`tests/unit/contrast.test.ts`,
   `palette-css-sync.test.ts`) mostram quais pares de cores precisam passar em WCAG AA.
4. Ative o tema trocando o valor `sombra` em `src/app/[locale]/layout.tsx`
   (atributo `data-theme`) e em `src/themes/theme-script.ts`. Componentes usam
   apenas tokens semânticos: não use cores cruas fora de `src/themes/`.

## Como editar o conteúdo

Todo o conteúdo fica em `src/content/`:

- `perfil.ts`: nome, e-mail, links (GitHub, LinkedIn), bio, disponibilidade e caminhos dos CVs.
  Procure por `TODO(conteúdo)` para ver o que ainda é texto de exemplo.
- `projetos.ts`: lista de projetos (slug, resumos e descrições em PT/EN, stack, estrelas, links).
  Cada slug gera a página `/[locale]/projetos/<slug>`.
- `skills.ts`: skills por categoria, anos de experiência e o que está em aprendizado.
- `messages/pt.json` e `messages/en.json`: todos os textos da interface. As duas
  línguas precisam ter as mesmas chaves (há um teste de paridade).

## Currículo (CV)

Coloque os PDFs em:

- `public/cv/joao-gabriel-pt.pdf`
- `public/cv/joao-gabriel-en.pdf`

O botão "CV" da home só aparece para o idioma cujo arquivo existe.

## Testes e qualidade

- `pnpm test`: unitários (tokens, contraste, i18n, componentes, SEO, formulário).
- `pnpm test:e2e`: seções, navegação com header fixo, modo sem flash, persistência
  do modo, 404, formulário (com e sem JS), cards visíveis sem JS e zero violações
  do axe em `/pt`, `/en`, detalhe de projeto e 404, nos dois modos.
- Lighthouse CI (mobile): performance e boas práticas ≥ 0.95, acessibilidade e SEO = 1.

A CI (`.github/workflows/ci.yml`) roda lint, typecheck, testes, build, e2e e Lighthouse
em pull requests e em pushes para `main`.

## Licença e arte

Mascote e ilustrações são originais, sem personagens, nomes ou logotipos de terceiros.
