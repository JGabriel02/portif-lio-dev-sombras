import 'server-only'
import { consultar } from './cliente'

export async function inserirMensagem(m: {
  nome: string
  email: string
  texto: string
  /** Usado pelo banco para limitar mensagens por visitante por dia. */
  visitanteHash: string | null
}): Promise<boolean> {
  const r = await consultar(
    'insert into mensagem(nome,email,texto,visitante_hash) values ($1,$2,$3,$4)',
    [m.nome, m.email, m.texto, m.visitanteHash],
  )
  return r !== null
}
