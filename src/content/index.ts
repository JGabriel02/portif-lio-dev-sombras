import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import type { Locale } from '@/i18n/routing'
import { perfil } from './perfil'
import { projetos } from './projetos'
import { skills } from './skills'
import type { Perfil, Projeto, Skill, SkillCategoria } from './types'

export type { Localized, Perfil, Projeto, Skill, SkillCategoria } from './types'

export function getPerfil(): Perfil {
  return perfil
}

/** Non-learning skills by anos desc, then learning skills. */
export function getSkills(categoria?: SkillCategoria): Skill[] {
  const list = categoria
    ? skills.filter((s) => s.categoria === categoria)
    : [...skills]
  return list.sort((a, b) => {
    if (!!a.aprendendo !== !!b.aprendendo) return a.aprendendo ? 1 : -1
    return b.anos - a.anos
  })
}

/** Featured first, then atualizadoEm desc. */
export function getProjetos(): Projeto[] {
  return [...projetos].sort((a, b) => {
    if (a.destaque !== b.destaque) return a.destaque ? -1 : 1
    return b.atualizadoEm.localeCompare(a.atualizadoEm)
  })
}

export function getProjeto(slug: string): Projeto | undefined {
  return projetos.find((p) => p.slug === slug)
}

/** Public path of the CV for the locale, only if the file exists in public/. */
export function cvDisponivel(
  locale: Locale,
  root: string = path.join(process.cwd(), 'public'),
): string | null {
  const p = perfil.cv[locale]
  if (!p) return null
  return fs.existsSync(path.join(root, p)) ? p : null
}
