import 'server-only'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

const TIMEOUT_MS = 3000

let memo: { url: string; fn: NeonQueryFunction<false, false> } | null = null

export function sql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!memo || memo.url !== url) memo = { url, fn: neon(url) }
  return memo.fn
}

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const limite = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const e = new Error('timeout')
      e.name = 'TimeoutError'
      reject(e)
    }, ms)
  })
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer))
}

export async function consultar<T>(
  texto: string,
  params: unknown[],
): Promise<T[] | null> {
  const cliente = sql()
  if (!cliente) return null
  try {
    return (await comTimeout(cliente.query(texto, params), TIMEOUT_MS)) as T[]
  } catch (e) {
    console.warn('[db] falha', {
      tipo: e instanceof Error ? e.name : 'desconhecido',
    })
    return null
  }
}
