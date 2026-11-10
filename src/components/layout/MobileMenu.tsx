'use client'

import { Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type MobileMenuProps = {
  links: { href: string; label: string }[]
  label: string
  children?: ReactNode
}

export function MobileMenu({ links, label, children }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const Icon = open ? X : Menu

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full"
      >
        <Icon aria-hidden="true" size={20} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="bg-bg border-line absolute inset-x-0 top-full border-b px-4 py-4"
      >
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="hover:bg-surface-raised rounded-card flex min-h-11 items-center px-3"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        {children ? (
          <div className="mt-3 flex items-center gap-2">{children}</div>
        ) : null}
      </div>
    </div>
  )
}
