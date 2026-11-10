/**
 * The contact form has no real delivery yet. On Vercel production it stays off
 * unless NEXT_PUBLIC_CONTATO_ATIVO is explicitly "true"; elsewhere (dev, CI,
 * previews, local builds) it is on.
 */
export function contatoFormAtivo(): boolean {
  if (process.env.VERCEL_ENV !== 'production') return true
  return process.env.NEXT_PUBLIC_CONTATO_ATIVO === 'true'
}
