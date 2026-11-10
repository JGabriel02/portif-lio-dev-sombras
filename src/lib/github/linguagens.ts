import type { Repo } from './schemas'

export function contarPorLinguagem(repos: Repo[]): Map<string, number> {
  const contagem = new Map<string, number>()
  for (const repo of repos) {
    if (repo.fork || repo.language === null) continue
    contagem.set(repo.language, (contagem.get(repo.language) ?? 0) + 1)
  }
  return contagem
}
