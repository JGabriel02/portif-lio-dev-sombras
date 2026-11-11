import { inserirEvento, inserirVisita } from '@/lib/db/coleta'
import { visitanteHash } from '@/lib/coleta/hash'
import {
  aparelhoDe,
  CorpoColeta,
  ehBot,
  limparCaminho,
  origemDe,
} from '@/lib/coleta/normalizar'

const MAX_BYTES = 2048

async function coletar(req: Request): Promise<void> {
  const texto = await req.text()
  if (new TextEncoder().encode(texto).length > MAX_BYTES) return

  const h = req.headers
  const proposito = `${h.get('sec-purpose') ?? ''} ${h.get('purpose') ?? ''}`
  if (/prefetch/i.test(proposito)) return
  const ua = h.get('user-agent') ?? ''
  if (ehBot(ua)) return

  let json: unknown
  try {
    json = JSON.parse(texto)
  } catch {
    return
  }
  const corpo = CorpoColeta.safeParse(json)
  if (!corpo.success) return

  const hash = visitanteHash(h)
  if (hash === null) return

  const paisBruto = h.get('x-vercel-ip-country') ?? ''
  const pais = /^[A-Z]{2}$/.test(paisBruto) ? paisBruto : null
  const hostDoSite = new URL(req.url).host

  const c = corpo.data
  if (c.t === 'v') {
    await inserirVisita({
      caminho: limparCaminho(c.caminho),
      idioma: c.idioma,
      origem: origemDe(c.ref, hostDoSite),
      aparelho: aparelhoDe(ua),
      pais,
      visitanteHash: hash,
    })
  } else {
    await inserirEvento({
      tipo: c.tipo,
      alvo: c.alvo.slice(0, 100),
      idioma: c.idioma,
      visitanteHash: hash,
    })
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await coletar(req)
  } catch {}
  return new Response(null, { status: 204 })
}
