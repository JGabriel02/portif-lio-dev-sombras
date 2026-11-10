import { z } from 'zod'

// Messages are keys under the `contato` i18n namespace; the UI translates them.
export const contatoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'errors.nameRequired')
    .max(100, 'errors.nameRequired'),
  email: z.string().trim().email('errors.emailInvalid'),
  mensagem: z
    .string()
    .trim()
    .min(10, 'errors.messageMin')
    .max(2000, 'errors.messageMax'),
  site: z.string().optional(),
})

export type ContatoInput = z.infer<typeof contatoSchema>

export type ContatoField = 'nome' | 'email' | 'mensagem'

export type ContatoState =
  | { status: 'idle' }
  | { status: 'ok' }
  | {
      status: 'invalid'
      fieldErrors: Partial<Record<ContatoField, string>>
      values: { nome: string; email: string; mensagem: string }
    }
  | { status: 'error' }
