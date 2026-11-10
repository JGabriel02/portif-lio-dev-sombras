import type { Dia } from './schemas'

export type Atividade = {
  sequenciaAtual: number
  totalAno: number
  ano: number
}

const TIME_ZONE = 'America/Sao_Paulo'
const formatador = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })

function diaAnterior(data: string): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function calcularAtividade(dias: Dia[], agora: Date): Atividade {
  const hoje = formatador.format(agora)
  const ano = Number(hoje.slice(0, 4))
  const porData = new Map(dias.map((d) => [d.date, d.contributionCount]))

  let cursor = (porData.get(hoje) ?? 0) > 0 ? hoje : diaAnterior(hoje)
  let sequenciaAtual = 0
  while ((porData.get(cursor) ?? 0) > 0) {
    sequenciaAtual += 1
    cursor = diaAnterior(cursor)
  }

  const prefixo = `${ano}-`
  const totalAno = dias
    .filter((d) => d.date.startsWith(prefixo))
    .reduce((soma, d) => soma + d.contributionCount, 0)

  return { sequenciaAtual, totalAno, ano }
}
