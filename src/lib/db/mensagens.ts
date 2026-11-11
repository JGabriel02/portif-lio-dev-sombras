import 'server-only'
import { consultar } from './cliente'

export async function inserirMensagem(m: {
  nome: string
  email: string
  texto: string
}): Promise<boolean> {
  const r = await consultar(
    'insert into mensagem(nome,email,texto) values ($1,$2,$3)',
    [m.nome, m.email, m.texto],
  )
  return r !== null
}
