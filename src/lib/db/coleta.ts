import 'server-only'
import { consultar } from './cliente'

export type TipoEvento = 'repo' | 'demo' | 'cv' | 'contato' | 'idioma'

export async function inserirEvento(e: {
  tipo: TipoEvento
  alvo: string | null
  idioma: string | null
  visitanteHash: string
}): Promise<boolean> {
  const r = await consultar(
    'insert into evento(tipo,alvo,idioma,visitante_hash) values ($1,$2,$3,$4)',
    [e.tipo, e.alvo, e.idioma, e.visitanteHash],
  )
  return r !== null
}

export async function inserirVisita(v: {
  caminho: string
  idioma: string
  origem: string
  aparelho: 'mobile' | 'desktop'
  pais: string | null
  visitanteHash: string
}): Promise<boolean> {
  const r = await consultar(
    'insert into visita(caminho,idioma,origem,aparelho,pais,visitante_hash) values ($1,$2,$3,$4,$5,$6)',
    [v.caminho, v.idioma, v.origem, v.aparelho, v.pais, v.visitanteHash],
  )
  return r !== null
}
