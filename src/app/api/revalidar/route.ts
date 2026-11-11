import { createHash, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { TAG_CONTEUDO } from '@/content'

const sha256 = (valor: string) => createHash('sha256').update(valor).digest()

export async function POST(req: Request): Promise<Response> {
  const segredo = process.env.REVALIDATE_SECRET
  if (!segredo) return new Response(null, { status: 401 })

  const recebido = req.headers.get('authorization') ?? ''
  // O hash iguala o tamanho dos dois lados, então timingSafeEqual nunca lança.
  if (!timingSafeEqual(sha256(recebido), sha256(`Bearer ${segredo}`))) {
    return new Response(null, { status: 401 })
  }

  revalidateTag(TAG_CONTEUDO, { expire: 0 })
  return Response.json({ ok: true })
}
