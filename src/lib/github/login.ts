export function githubLogin(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.hostname !== 'github.com') return null
  const login = parsed.pathname.split('/').filter(Boolean)[0]
  return login ?? null
}
