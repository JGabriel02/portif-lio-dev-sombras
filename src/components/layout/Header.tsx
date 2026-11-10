'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MobileMenu } from './MobileMenu'
import { ModeToggle } from './ModeToggle'

const SECTIONS = ['sobre', 'skills', 'projetos', 'contato'] as const

export function Header() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onHome = pathname === '/'
  const prefix = onHome ? '' : `/${locale}`
  const links = SECTIONS.map((id) => ({
    href: `${prefix}#${id}`,
    label: t(`nav.${id}`),
  }))
  const modeLabels = { toShiny: t('mode.toShiny'), toDark: t('mode.toDark') }

  return (
    <header
      data-scrolled={scrolled ? 'true' : undefined}
      className="site-header data-[scrolled=true]:border-line sticky top-0 z-40 border-b border-transparent transition-colors data-[scrolled=true]:backdrop-blur"
    >
      <div className="relative mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-4">
        <a
          href={onHome ? '#' : `/${locale}`}
          className="font-heading inline-flex items-center gap-2 text-xl"
          aria-label="jg."
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, no optimization needed */}
          <img
            src="/icone.gif"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span aria-hidden="true">
            jg<span className="text-eye">.</span>
          </span>
        </a>
        <nav aria-label={t('nav.label')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-muted hover:text-text inline-flex min-h-10 items-center rounded-full px-3 text-base"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            <LocaleSwitcher />
            <ModeToggle labels={modeLabels} />
          </div>
          <MobileMenu links={links} label={t('nav.menu')}>
            <LocaleSwitcher />
            <ModeToggle labels={modeLabels} />
          </MobileMenu>
        </div>
      </div>
    </header>
  )
}
