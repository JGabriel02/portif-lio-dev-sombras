'use server'

import {
  contatoSchema,
  type ContatoField,
  type ContatoState,
} from '@/lib/schemas/contato'
import { contatoFormAtivo } from '@/lib/contato-flag'
import { inserirMensagem } from '@/lib/db/mensagens'
import { headers } from 'next/headers'
import { inserirEvento } from '@/lib/db/coleta'
import { visitanteHash } from '@/lib/coleta/hash'

function text(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v : ''
}

export async function enviarContato(
  _prev: ContatoState,
  formData: FormData,
): Promise<ContatoState> {
  try {
    if (!contatoFormAtivo()) return { status: 'error' }
    if (text(formData, 'site') !== '') return { status: 'ok' }

    const values = {
      nome: text(formData, 'nome'),
      email: text(formData, 'email'),
      mensagem: text(formData, 'mensagem'),
    }
    const parsed = contatoSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<ContatoField, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (
          (field === 'nome' || field === 'email' || field === 'mensagem') &&
          fieldErrors[field] === undefined
        ) {
          fieldErrors[field] = issue.message
        }
      }
      return { status: 'invalid', fieldErrors, values }
    }

    const hash = visitanteHash(await headers())
    const gravada = await inserirMensagem({
      nome: parsed.data.nome,
      email: parsed.data.email,
      texto: parsed.data.mensagem,
      visitanteHash: hash,
    })
    if (!gravada) return { status: 'error' }

    // O evento é só métrica: falha aqui não derruba o envio.
    try {
      if (hash !== null) {
        await inserirEvento({
          tipo: 'contato',
          alvo: null,
          idioma: null,
          visitanteHash: hash,
        })
      }
    } catch {}
    return { status: 'ok' }
  } catch {
    return { status: 'error' }
  }
}
