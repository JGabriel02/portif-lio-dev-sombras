import 'server-only'
import { z } from 'zod'
import type { ProjetoCurado, Skill } from '@/content/types'
import { consultar } from './cliente'

const texto = z.string().nullable()

const projetoLinha = z.object({
  slug: z.string(),
  repo: z.string(),
  destaque: z.boolean(),
  demo_url: z.string().nullable(),
  ocultar_demo: z.boolean(),
  stack: z.array(z.string()),
  imagens: z.array(
    z.object({
      src: z.string(),
      alt: z.object({ pt: z.string(), en: z.string() }),
    }),
  ),
  resumo_pt: texto,
  resumo_en: texto,
  descricao_pt: texto,
  descricao_en: texto,
  aprendizados_pt: texto,
  aprendizados_en: texto,
  fallback_linguagem: z.string().nullable(),
  fallback_estrelas: z.number().nullable(),
  fallback_atualizado_em: z.string().nullable(),
})

const skillLinha = z.object({
  nome: z.string(),
  categoria: z.enum(['frontend', 'backend', 'tools']),
  anos: z.number(),
  aprendendo: z.boolean(),
  linguagem_github: z.string().nullable(),
})

const SQL_PROJETOS = `select slug, repo, destaque, demo_url, ocultar_demo, stack, imagens,
  resumo_pt, resumo_en, descricao_pt, descricao_en, aprendizados_pt, aprendizados_en,
  fallback_linguagem, fallback_estrelas,
  to_char(fallback_atualizado_em, 'YYYY-MM-DD') as fallback_atualizado_em
  from projeto where publicado order by ordem`

const SQL_SKILLS = `select nome, categoria, anos, aprendendo, linguagem_github
  from skill order by ordem`

function avisar(motivo: string): void {
  console.warn(`[db] ${motivo}`)
}

async function ler<L, R>(
  consulta: string,
  schema: z.ZodType<L>,
  converter: (l: L) => R,
): Promise<R[] | null> {
  const linhas = await consultar<unknown>(consulta, [])
  if (!linhas) return null
  if (linhas.length === 0) {
    avisar('conteúdo vazio')
    return null
  }
  const out: R[] = []
  for (const linha of linhas) {
    const r = schema.safeParse(linha)
    if (!r.success) {
      avisar('linha inválida')
      return null
    }
    out.push(converter(r.data))
  }
  return out
}

export function lerProjetos(): Promise<ProjetoCurado[] | null> {
  return ler(SQL_PROJETOS, projetoLinha, (p): ProjetoCurado => ({
    slug: p.slug,
    repo: p.repo,
    destaque: p.destaque,
    resumo: { pt: p.resumo_pt ?? '', en: p.resumo_en ?? '' },
    descricao: { pt: p.descricao_pt ?? '', en: p.descricao_en ?? '' },
    aprendizados: { pt: p.aprendizados_pt ?? '', en: p.aprendizados_en ?? '' },
    stack: p.stack,
    ...(p.demo_url ? { demoUrl: p.demo_url } : {}),
    ...(p.ocultar_demo ? { ocultarDemo: true } : {}),
    imagens: p.imagens,
    fallback: {
      linguagem: p.fallback_linguagem ?? '',
      estrelas: p.fallback_estrelas ?? 0,
      atualizadoEm: p.fallback_atualizado_em ?? '',
    },
  }))
}

export function lerSkills(): Promise<Skill[] | null> {
  return ler(SQL_SKILLS, skillLinha, (s): Skill => ({
    nome: s.nome,
    categoria: s.categoria,
    anos: s.anos,
    ...(s.linguagem_github ? { linguagemGithub: s.linguagem_github } : {}),
    ...(s.aprendendo ? { aprendendo: true } : {}),
  }))
}
