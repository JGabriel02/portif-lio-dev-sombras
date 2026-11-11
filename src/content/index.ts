import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { unstable_cache } from 'next/cache'
import type { Locale } from '@/i18n/routing'
import { perfil } from './perfil'
import { projetos } from './projetos'
import { skills } from './skills'
import {
  calcularAtividade,
  contarPorLinguagem,
  corDaLinguagem,
  getCalendario,
  getRepos,
  githubLogin,
} from '@/lib/github'
import type { Atividade, Repo } from '@/lib/github'
import { lerProjetos, lerSkills } from '@/lib/db/conteudo'
import type {
  Perfil,
  Projeto,
  ProjetoCurado,
  Skill,
  SkillCategoria,
} from './types'

export type {
  Localized,
  Perfil,
  Projeto,
  ProjetoCurado,
  Skill,
  SkillCategoria,
} from './types'
export type { Atividade } from '@/lib/github'

export const TAG_CONTEUDO = 'conteudo'

const lerProjetosCache = unstable_cache(lerProjetos, ['conteudo-projetos'], {
  tags: [TAG_CONTEUDO],
  revalidate: 3600,
})
const lerSkillsCache = unstable_cache(lerSkills, ['conteudo-skills'], {
  tags: [TAG_CONTEUDO],
  revalidate: 3600,
})

// The cached readers throw on DB failure (so unstable_cache never stores it);
// the catch lives outside the cache and falls back to the files. A null/empty
// result (no DATABASE_URL, empty tables) also means "use the files".
async function curados(): Promise<ProjetoCurado[]> {
  try {
    return (await lerProjetosCache()) ?? projetos
  } catch (e) {
    console.warn('[db] falha', {
      tipo: e instanceof Error ? e.name : 'desconhecido',
    })
    return projetos
  }
}

async function skillsBase(): Promise<Skill[]> {
  try {
    return (await lerSkillsCache()) ?? skills
  } catch (e) {
    console.warn('[db] falha', {
      tipo: e instanceof Error ? e.name : 'desconhecido',
    })
    return skills
  }
}

export function getPerfil(): Perfil {
  return perfil
}

function loginDoDono(): string | null {
  return githubLogin(perfil.links.github)
}

async function carregarRepos(): Promise<Repo[] | null> {
  const login = loginDoDono()
  return login ? getRepos(login) : null
}

/** Merge a curated entry with live GitHub data (spec 3.2). */
export function mesclarProjeto(
  curado: ProjetoCurado,
  repo: Repo | undefined,
  login: string,
): Projeto {
  const { fallback } = curado
  const linguagem = repo?.language ?? fallback.linguagem
  const homepage = repo?.homepage?.trim()
  const demoUrl = curado.ocultarDemo
    ? undefined
    : (curado.demoUrl ?? (homepage ? homepage : undefined))
  return {
    slug: curado.slug,
    nome: curado.repo,
    resumo: curado.resumo,
    descricao: curado.descricao,
    aprendizados: curado.aprendizados,
    linguagem: { nome: linguagem, cor: corDaLinguagem(linguagem) },
    stack: curado.stack,
    estrelas: repo?.stargazers_count ?? fallback.estrelas,
    atualizadoEm: repo?.pushed_at ?? fallback.atualizadoEm,
    repoUrl: repo?.html_url ?? `https://github.com/${login}/${curado.repo}`,
    ...(demoUrl ? { demoUrl } : {}),
    imagens: curado.imagens,
    destaque: curado.destaque,
    fonte: repo ? 'github' : 'fallback',
  }
}

/** Non-learning skills by anos desc, then learning; source order breaks ties. */
export async function getSkills(categoria?: SkillCategoria): Promise<Skill[]> {
  const repos = await carregarRepos()
  const contagem = repos ? contarPorLinguagem(repos) : null
  const base = await skillsBase()
  const list = base
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !categoria || s.categoria === categoria)
    .map(({ s, i }) => {
      const skill: Skill =
        !contagem || !s.linguagemGithub
          ? { ...s, repos: undefined }
          : { ...s, repos: contagem.get(s.linguagemGithub) ?? 0 }
      return { skill, i }
    })
  return list
    .sort((a, b) => {
      if (!!a.skill.aprendendo !== !!b.skill.aprendendo) {
        return a.skill.aprendendo ? 1 : -1
      }
      return b.skill.anos - a.skill.anos || a.i - b.i
    })
    .map(({ skill }) => skill)
}

/** Featured first, then position in the source list (DB `ordem` or file). */
export async function getProjetos(): Promise<Projeto[]> {
  const login = loginDoDono() ?? ''
  const repos = await carregarRepos()
  const porNome = new Map((repos ?? []).map((r) => [r.name, r]))
  const lista = (await curados()).map((curado, i) => {
    const repo = porNome.get(curado.repo)
    if (repos && !repo) {
      console.warn('[github] repo curado não encontrado', { repo: curado.repo })
    }
    return { projeto: mesclarProjeto(curado, repo, login), i }
  })
  return lista
    .sort((a, b) => {
      if (a.projeto.destaque !== b.projeto.destaque) {
        return a.projeto.destaque ? -1 : 1
      }
      return a.i - b.i
    })
    .map(({ projeto }) => projeto)
}

export async function getProjeto(slug: string): Promise<Projeto | undefined> {
  return (await getProjetos()).find((p) => p.slug === slug)
}

export async function getAtividade(): Promise<Atividade | null> {
  const login = loginDoDono()
  if (!login) return null
  const dias = await getCalendario(login)
  return dias ? calcularAtividade(dias, new Date()) : null
}

/** Public path of the CV for the locale, only if the file exists in public/. */
export function cvDisponivel(
  locale: Locale,
  root: string = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public'),
): string | null {
  const p = perfil.cv[locale]
  if (!p) return null
  return fs.existsSync(/*turbopackIgnore: true*/ path.join(root, p)) ? p : null
}
