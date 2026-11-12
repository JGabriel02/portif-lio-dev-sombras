import { describe, expect, it } from 'vitest'
import { contatoSchema } from '@/lib/schemas/contato'

const base = { nome: 'Ana', email: 'ana@exemplo.com', mensagem: 'a'.repeat(10) }

describe('contatoSchema', () => {
  it('accepts a valid payload', () => {
    expect(contatoSchema.safeParse(base).success).toBe(true)
  })
  it('enforces message length bounds after trimming', () => {
    expect(
      contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(9) }).success,
    ).toBe(false)
    expect(
      contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(2000) }).success,
    ).toBe(true)
    expect(
      contatoSchema.safeParse({ ...base, mensagem: 'a'.repeat(2001) }).success,
    ).toBe(false)
    expect(
      contatoSchema.safeParse({ ...base, mensagem: '          abc' }).success,
    ).toBe(false)
  })
  it('rejects blank name and bad email', () => {
    expect(contatoSchema.safeParse({ ...base, nome: '   ' }).success).toBe(
      false,
    )
    expect(contatoSchema.safeParse({ ...base, email: 'nope' }).success).toBe(
      false,
    )
  })

  it('rejects an email longer than 254 characters', () => {
    const email = 'a'.repeat(250) + '@b.com'
    expect(contatoSchema.safeParse({ ...base, email }).success).toBe(false)
  })
})
