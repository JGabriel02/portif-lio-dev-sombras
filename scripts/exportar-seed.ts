import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { projetos } from '../src/content/projetos'
import { skills } from '../src/content/skills'
import type { Localized, ProjetoCurado, Skill } from '../src/content/types'

export type Seed = {
  projetos: {
    slug: string
    repo: string
    ordem: number
    destaque: boolean
    publicado: true
    demoUrl: string | null
    ocultarDemo: boolean
    stack: string[]
    imagens: ProjetoCurado['imagens']
    resumo: Localized
    descricao: Localized
    aprendizados: Localized
    fallback: ProjetoCurado['fallback']
  }[]
  skills: {
    nome: string
    categoria: Skill['categoria']
    anos: number
    aprendendo: boolean
    linguagemGithub: string | null
    ordem: number
  }[]
}

export function montarSeed(
  listaProjetos: ProjetoCurado[],
  listaSkills: Skill[],
): Seed {
  return {
    projetos: listaProjetos.map((p, ordem) => ({
      slug: p.slug,
      repo: p.repo,
      ordem,
      destaque: p.destaque,
      publicado: true,
      demoUrl: p.demoUrl ?? null,
      ocultarDemo: p.ocultarDemo ?? false,
      stack: p.stack,
      imagens: p.imagens,
      resumo: p.resumo,
      descricao: p.descricao,
      aprendizados: p.aprendizados,
      fallback: p.fallback,
    })),
    skills: listaSkills.map((s, ordem) => ({
      nome: s.nome,
      categoria: s.categoria,
      anos: s.anos,
      aprendendo: s.aprendendo ?? false,
      linguagemGithub: s.linguagemGithub ?? null,
      ordem,
    })),
  }
}

const ehMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (ehMain) {
  const destino = resolve(
    fileURLToPath(import.meta.url),
    '../../painel/src/main/resources/seed.json',
  )
  writeFileSync(
    destino,
    JSON.stringify(montarSeed(projetos, skills), null, 2) + '\n',
  )
  console.log(`seed gravado em ${destino}`)
}
