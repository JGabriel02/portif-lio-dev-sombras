const DESCONHECIDA = '#8B8B9A'

const CORES: Record<string, string> = {
  'C#': '#178600',
  Java: '#B07219',
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  Python: '#3572A5',
  CSS: '#663399',
  HTML: '#E34C26',
}

export function corDaLinguagem(nome: string): string {
  return Object.hasOwn(CORES, nome) ? CORES[nome] : DESCONHECIDA
}
