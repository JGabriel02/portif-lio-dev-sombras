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
