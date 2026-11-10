import { describe, expect, it } from 'vitest'
import { getPerfil, getProjetos } from '@/content'
import { buildMetadata, personJsonLd, SITE_URL } from '@/lib/seo'
import sitemap from '@/app/sitemap'

describe('buildMetadata', () => {
  const m = buildMetadata({ locale: 'en', path: '/projetos/npc-forge' })

  it('sets canonical for the locale', () => {
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/en/projetos/npc-forge`)
  })

  it('sets hreflang alternates with x-default pointing to pt', () => {
    const langs = m.alternates?.languages as Record<string, string>
    expect(langs.pt).toBe(`${SITE_URL}/pt/projetos/npc-forge`)
    expect(langs.en).toBe(`${SITE_URL}/en/projetos/npc-forge`)
    expect(langs['x-default']).toBe(`${SITE_URL}/pt/projetos/npc-forge`)
  })

  it('maps openGraph locale', () => {
    expect(m.openGraph?.locale).toBe('en_US')
    expect(
      buildMetadata({ locale: 'pt', path: '' }).openGraph?.locale,
    ).toBe('pt_BR')
  })

  it('uses given title and description', () => {
    const x = buildMetadata({
      locale: 'pt',
      path: '',
      title: 'T',
      description: 'D',
    })
    expect(x.title).toBe('T')
    expect(x.description).toBe('D')
  })
})

describe('buildMetadata home', () => {
  it('has no double slashes for path empty', () => {
    const m = buildMetadata({ locale: 'pt', path: '' })
    const langs = m.alternates?.languages as Record<string, string>
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/pt`)
    expect(langs.en).toBe(`${SITE_URL}/en`)
    expect(SITE_URL.endsWith('/')).toBe(false)
    expect(String(m.alternates?.canonical).replace('://', '')).not.toContain('//')
  })
})

describe('sitemap', () => {
  it('lists both locale URLs for home and every project', () => {
    const urls = sitemap().map((e) => e.url)
    const paths = ['', ...getProjetos().map((p) => `/projetos/${p.slug}`)]
    for (const p of paths) {
      expect(urls).toContain(`${SITE_URL}/pt${p}`)
      expect(urls).toContain(`${SITE_URL}/en${p}`)
    }
  })
})

describe('personJsonLd', () => {
  it('builds a Person with sameAs links', () => {
    const perfil = getPerfil()
    const ld = personJsonLd('pt') as Record<string, unknown>
    expect(ld['@type']).toBe('Person')
    expect(ld.name).toBe(perfil.nome)
    expect(ld.jobTitle).toBe(perfil.cargo.pt)
    expect(ld.sameAs).toEqual([perfil.links.github, perfil.links.linkedin])
  })
})
