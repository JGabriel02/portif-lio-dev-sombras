'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef } from 'react'
import { enviarContato } from '@/app/actions/contato'
import { Button } from '@/components/ui/Button'
import type { ContatoField, ContatoState } from '@/lib/schemas/contato'

const idle: ContatoState = { status: 'idle' }

const inputClass =
  'bg-surface border-line text-text focus-visible:outline-focus-ring min-h-11 w-full rounded-card border px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 aria-[invalid=true]:border-accent aria-[invalid=true]:border-2'

export function ContatoForm({ email }: { email: string }) {
  const t = useTranslations('contato')
  const [state, formAction, pending] = useActionState(enviarContato, idle)
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === 'invalid') alertRef.current?.focus()
  }, [state])

  if (state.status === 'ok') {
    return (
      <p role="status" className="font-heading text-xl">
        {t('success')}
      </p>
    )
  }

  const invalid = state.status === 'invalid'
  const errors = invalid ? state.fieldErrors : {}
  const values = invalid ? state.values : { nome: '', email: '', mensagem: '' }

  const field = (name: ContatoField, label: string, multiline = false) => {
    const error = errors[name]
    const common = {
      id: `contato-${name}`,
      name,
      defaultValue: values[name],
      className: inputClass,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `contato-${name}-error` : undefined,
    }
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`contato-${name}`} className="text-base font-medium">
          {label}
        </label>
        {multiline ? (
          <textarea {...common} rows={5} />
        ) : (
          <input
            {...common}
            type={name === 'email' ? 'email' : 'text'}
            autoComplete={name === 'email' ? 'email' : 'name'}
          />
        )}
        {error ? (
          <p id={`contato-${name}-error`} className="text-sm font-medium">
            {t(error as never)}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {invalid || state.status === 'error' ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-accent rounded-card border-2 p-4 text-base"
        >
          {state.status === 'error' ? (
            <>
              <p>{t('error')}</p>
              <p>
                <a href={`mailto:${email}`} className="underline">
                  {t('fallback')}
                </a>
              </p>
            </>
          ) : (
            <ul className="list-disc pl-5">
              {Object.values(errors).map((key) => (
                <li key={key}>{t(key as never)}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {field('nome', t('name'))}
      {field('email', t('email'))}
      {field('mensagem', t('message'), true)}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <input type="text" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t('sending') : t('send')}
        </Button>
      </div>
    </form>
  )
}
