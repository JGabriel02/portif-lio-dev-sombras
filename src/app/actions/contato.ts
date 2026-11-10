'use server'

import {
  contatoSchema,
  type ContatoField,
  type ContatoState,
} from '@/lib/schemas/contato'
import { contatoFormAtivo } from '@/lib/contato-flag'

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

    if (process.env.NODE_ENV !== 'production') {
      console.info('[contato] dev only, not sent', {
        length: parsed.data.mensagem.length,
      })
    }
    return { status: 'ok' }
  } catch {
    return { status: 'error' }
  }
}
