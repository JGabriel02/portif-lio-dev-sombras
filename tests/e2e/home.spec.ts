import { expect, test } from '@playwright/test'
import { locales, messages, modes, setMode } from './helpers'

const sections = ['inicio', 'sobre', 'skills', 'projetos', 'contato']

for (const locale of locales) {
  for (const mode of modes) {
    test.describe(`/${locale} (${mode})`, () => {
      test.beforeEach(async ({ context }) => {
        await setMode(context, mode)
      })

      test('renders every section', async ({ page }) => {
        await page.goto(`/${locale}`)
        for (const id of sections) {
          await expect(page.locator(`main#conteudo #${id}`)).toBeVisible()
        }
      })

      test('nav link scrolls the section heading below the header', async ({
        page,
      }) => {
        await page.goto(`/${locale}`)
        const nav = page.getByRole('navigation', {
          name: messages[locale].nav.label,
        })
        await nav
          .getByRole('link', { name: messages[locale].nav.projetos })
          .click()
        const heading = page.locator('#projetos h2')
        const header = page.locator('header.site-header')
        await expect
          .poll(async () => {
            const h = await heading.boundingBox()
            const hb = await header.boundingBox()
            const vp = page.viewportSize()
            if (!h || !hb || !vp) return false
            return h.y >= hb.height && h.y + h.height <= vp.height
          })
          .toBe(true)
      })

      test('data-mode is correct before first paint (no flash)', async ({
        page,
      }) => {
        // Record every value data-mode ever takes and the value at first paint.
        await page.addInitScript(() => {
          const seen: string[] = []
          const w = window as unknown as {
            __modes: string[]
            __paintMode?: string
          }
          w.__modes = seen
          new MutationObserver((records) => {
            for (const r of records) {
              const v = (r.target as HTMLElement).dataset.mode
              if (v) seen.push(v)
            }
          }).observe(document, {
            attributes: true,
            attributeFilter: ['data-mode'],
            subtree: true,
          })
          new PerformanceObserver(() => {
            w.__paintMode ??= document.documentElement.dataset.mode
          }).observe({ type: 'paint', buffered: true })
        })
        await page.goto(`/${locale}`)
        await page.waitForLoadState('load')
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode)
        // The paint observer may not have fired yet at `load` in headless.
        await expect
          .poll(() =>
            page.evaluate(
              () => (window as unknown as { __paintMode?: string }).__paintMode,
            ),
          )
          .toBe(mode)
        const result = await page.evaluate(() => {
          const w = window as unknown as {
            __modes: string[]
            __paintMode?: string
          }
          return { seen: w.__modes, paint: w.__paintMode }
        })
        // Set once and never changed afterwards: only the cookie value is seen.
        expect(result.seen.length).toBeGreaterThan(0)
        expect(new Set(result.seen)).toEqual(new Set([mode]))
        expect(result.paint).toBe(mode)
      })

      test('inline theme script is a blocking script in <head>', async ({
        request,
      }) => {
        // Next hoists its own `async` chunks and the CSS link above head
        // children, which is harmless: async scripts never block and a
        // stylesheet only delays the (still pre-body) inline script. What
        // matters is that the theme script is inline, synchronous and runs
        // before <body> is parsed, so nothing is painted without data-mode.
        const res = await request.get(`/${locale}`, {
          headers: { Cookie: `mode=${mode}` },
        })
        const html = await res.text()
        const head = html.slice(0, html.indexOf('<body'))
        const inline = [...head.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)]
          .map((m) => m[0])
          .find((tag) => !tag.includes('type="application/'))
        expect(head).toContain("setAttribute('data-mode'")
        expect(inline).toBeDefined()
        expect(inline).not.toMatch(/\b(async|defer)\b|type="module"/)
      })

      test('mode toggle persists across reload', async ({ page }) => {
        await page.goto(`/${locale}`)
        const other = mode === 'dark' ? 'shiny' : 'dark'
        const label =
          mode === 'dark'
            ? messages[locale].mode.toShiny
            : messages[locale].mode.toDark
        const toggle = page
          .getByRole('button', { name: label })
          .filter({ visible: true })
        await toggle.click()
        await expect(page.locator('html')).toHaveAttribute('data-mode', other)
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('data-mode', other)
      })
    })
  }
}

test('unknown path under a locale shows the notFound page', async ({
  page,
}) => {
  const response = await page.goto('/pt/xyz')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: messages.pt.notFound.title }),
  ).toBeVisible()
})
