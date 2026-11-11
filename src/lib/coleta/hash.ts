import 'server-only'
import { createHash } from 'node:crypto'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export function visitanteHash(h: Headers, agora = new Date()): string | null {
  const segredo = process.env.COLETA_SEGREDO
  if (!segredo) return null
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
  const ua = h.get('user-agent') ?? ''
  const sal = sha256(segredo + agora.toISOString().slice(0, 10))
  return sha256(sal + ip + ua)
}
