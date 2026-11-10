'use server'

import {
  contatoSchema,
  type ContatoField,
  type ContatoState,
} from '@/lib/schemas/contato'

function text(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v : ''
}

export async function enviarContato(
  _prev: ContatoState,
  formData: FormData,
): Promise<ContatoState> {
  try {
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

    const { nome, email, mensagem } = parsed.data
    console.info('[contato] dev only, not sent', {
      nome,
      email,
      length: mensagem.length,
    })
    return { status: 'ok' }
  } catch {
    return { status: 'error' }
  }
}
