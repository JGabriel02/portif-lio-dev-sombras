import { z } from 'zod'

const idioma = z.enum(['pt', 'en'])

export const CorpoColeta = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('v'),
    caminho: z.string().max(5000),
    idioma,
    ref: z.string().max(5000),
  }),
  z.object({
    t: z.literal('e'),
    tipo: z.enum(['repo', 'demo', 'cv', 'contato', 'idioma']),
    alvo: z.string().max(5000),
    idioma,
  }),
])

export function limparCaminho(c: string): string {
  return c.split(/[?#]/)[0].slice(0, 200)
}

export function origemDe(ref: string, hostDoSite: string): string {
  if (!ref) return 'direto'
  try {
    const u = new URL(ref)
    if (u.host === hostDoSite) return 'interno'
    const host = u.hostname.replace(/^www\./, '')
    return host ? host.slice(0, 100) : 'direto'
  } catch {
    return 'direto'
  }
}

export function aparelhoDe(ua: string): 'mobile' | 'desktop' {
  return /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop'
}

export function ehBot(ua: string): boolean {
  if (!ua) return true
  return /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|quora|whatsapp/i.test(
    ua,
  )
}
