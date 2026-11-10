import 'server-only'

const API = 'https://api.github.com'
let warnedNoToken = false

function warn(reason: string, status: number | null, path: string): void {
  console.warn(`[github] ${reason}`, { status, path })
}

function token(): string | null {
  const value = process.env.GITHUB_TOKEN
  if (value) return value
  if (process.env.NODE_ENV !== 'production' && !warnedNoToken) {
    warnedNoToken = true
    console.warn('[github] GITHUB_TOKEN ausente — usando fallback')
  }
  return null
}

async function request(
  path: string,
  init: { method: 'GET' | 'POST'; body?: string },
): Promise<unknown | null> {
  const auth = token()
  if (!auth) return null

  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      method: init.method,
      body: init.body,
      headers: {
        Authorization: `Bearer ${auth}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'portfolio-site',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      next: { revalidate: 3600, tags: ['github'] },
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    const timeout =
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      err.name === 'TimeoutError'
    warn(timeout ? 'timeout' : 'network error', null, path)
    return null
  }

  if (!res.ok) {
    warn('http error', res.status, path)
    return null
  }
  try {
    return (await res.json()) as unknown
  } catch {
    warn('invalid json', res.status, path)
    return null
  }
}

export function ghRest(path: string): Promise<unknown | null> {
  return request(path, { method: 'GET' })
}

export async function ghGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<unknown | null> {
  const json = await request('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  })
  if (typeof json !== 'object' || json === null) return null
  const { data, errors } = json as { data?: unknown; errors?: unknown }
  if (errors) {
    warn('graphql errors', null, '/graphql')
    return null
  }
  return data ?? null
}
