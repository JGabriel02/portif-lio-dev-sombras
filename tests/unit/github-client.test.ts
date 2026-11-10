import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const TOKEN = 'ghp_secret_token_value'
const fetchMock = vi.fn()
const warn = vi.spyOn(console, 'warn')

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

async function load() {
  return import('@/lib/github/client')
}

beforeEach(() => {
  vi.resetModules()
  fetchMock.mockReset()
  warn.mockReset().mockImplementation(() => {})
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('GITHUB_TOKEN', TOKEN)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('github client', () => {
  it('returns null and never fetches without token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const { ghRest, ghGraphql } = await load()
    expect(await ghRest('/x')).toBeNull()
    expect(await ghGraphql('q', {})).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('sends auth, accept, api-version and user-agent headers', async () => {
    fetchMock.mockResolvedValue(ok([]))
    const { ghRest } = await load()
    await ghRest('/users/JGabriel02/repos')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/users/JGabriel02/repos')
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-site',
    })
  })

  it('passes next.revalidate 3600 and tags ["github"]', async () => {
    fetchMock.mockResolvedValue(ok([]))
    const { ghRest } = await load()
    await ghRest('/x')
    const init = fetchMock.mock.calls[0][1]
    expect(init.next).toEqual({ revalidate: 3600, tags: ['github'] })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it.each([401, 403, 500])(
    'returns null on %i and warns without the token',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('{}', { status }))
      const { ghRest } = await load()
      expect(await ghRest('/x')).toBeNull()
      expect(warn).toHaveBeenCalled()
      expect(JSON.stringify(warn.mock.calls)).not.toContain(TOKEN)
      expect(warn.mock.calls[0][1]).toEqual({ status, path: '/x' })
    },
  )

  it('returns null on network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const { ghRest } = await load()
    expect(await ghRest('/x')).toBeNull()
    expect(String(warn.mock.calls[0][0])).toContain('network error')
  })

  it('returns null on timeout and labels it', async () => {
    fetchMock.mockRejectedValue(new DOMException('t', 'TimeoutError'))
    const { ghRest } = await load()
    expect(await ghRest('/x')).toBeNull()
    expect(String(warn.mock.calls[0][0])).toContain('timeout')
  })

  it('returns null when body is not JSON (rate-limit HTML)', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>rate limit</html>', { status: 200 }),
    )
    const { ghRest } = await load()
    expect(await ghRest('/x')).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('ghGraphql posts JSON and returns data', async () => {
    fetchMock.mockResolvedValue(ok({ data: { user: 1 } }))
    const { ghGraphql } = await load()
    expect(await ghGraphql('query', { login: 'a' })).toEqual({ user: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/graphql')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      query: 'query',
      variables: { login: 'a' },
    })
  })

  it('ghGraphql returns null when errors present or data null', async () => {
    const { ghGraphql } = await load()
    fetchMock.mockResolvedValueOnce(
      ok({ data: { a: 1 }, errors: [{ message: 'x' }] }),
    )
    expect(await ghGraphql('q', {})).toBeNull()
    fetchMock.mockResolvedValueOnce(ok({ data: null }))
    expect(await ghGraphql('q', {})).toBeNull()
  })
})
