import { z } from 'zod'

const idioma = z.enum(['pt', 'en'])

export const CorpoColeta = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('v'),
    caminho: z.string().max(2048),
    idioma,
    ref: z.string().max(2048),
  }),
  z.object({
    t: z.literal('e'),
    tipo: z.enum(['repo', 'demo', 'cv', 'idioma']),
    alvo: z.string().max(512),
    idioma,
  }),
])

/** Truncates by code points so a surrogate pair is never split. */
export function cortar(s: string, n: number): string {
  return Array.from(s).slice(0, n).join('')
}

export function limparCaminho(c: string): string {
  return cortar(c.split(/[?#]/)[0], 200)
}

export function origemDe(ref: string, hostDoSite: string): string {
  if (!ref) return 'direto'
  try {
    const u = new URL(ref)
    if (u.host === hostDoSite) return 'interno'
    const host = u.hostname.replace(/^www\./, '')
    return host ? cortar(host, 100) : 'direto'
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
