import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
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

/** Non-learning skills by anos desc, then learning skills. */
export async function getSkills(categoria?: SkillCategoria): Promise<Skill[]> {
  const repos = await carregarRepos()
  const contagem = repos ? contarPorLinguagem(repos) : null
  const list = (
    categoria ? skills.filter((s) => s.categoria === categoria) : [...skills]
  ).map((s): Skill => {
    if (!contagem || !s.linguagemGithub) return { ...s, repos: undefined }
    return { ...s, repos: contagem.get(s.linguagemGithub) ?? 0 }
  })
  return list.sort((a, b) => {
    if (!!a.aprendendo !== !!b.aprendendo) return a.aprendendo ? 1 : -1
    return b.anos - a.anos
  })
}

/** Featured first, then atualizadoEm desc. */
export async function getProjetos(): Promise<Projeto[]> {
  const login = loginDoDono() ?? ''
  const repos = await carregarRepos()
  const porNome = new Map((repos ?? []).map((r) => [r.name, r]))
  const lista = projetos.map((curado) => {
    const repo = porNome.get(curado.repo)
    if (repos && !repo) {
      console.warn('[github] repo curado não encontrado', { repo: curado.repo })
    }
    return mesclarProjeto(curado, repo, login)
  })
  return lista.sort((a, b) => {
    if (a.destaque !== b.destaque) return a.destaque ? -1 : 1
    return b.atualizadoEm.localeCompare(a.atualizadoEm)
  })
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
