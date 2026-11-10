import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

for (const path of ['/pt', '/en', '/pt/projetos/npc-forge']) {
  test(`${path} has no horizontal scroll at 375px`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('load')
    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }))
    expect(scrollW).toBeLessThanOrEqual(clientW)
  })
}

test('project cards are revealed even after jumping past them', async ({
  page,
}) => {
  await page.goto('/pt')
  await page.waitForLoadState('load')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll('[data-materializar]')].every((e) =>
          e.hasAttribute('data-visivel'),
        ),
      ),
    )
    .toBe(true)
})

test('visible links and buttons are at least 24px tall and wide', async ({
  page,
}) => {
  await page.goto('/pt')
  await page.waitForLoadState('load')
  const pequenos = await page.evaluate(() =>
    [...document.querySelectorAll('a, button')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        return (
          r.width > 0 &&
          !e.closest('.sr-only') &&
          (r.height < 24 || r.width < 24)
        )
      })
      .map((e) => (e.textContent ?? '').trim()),
  )
  expect(pequenos).toEqual([])
})

test('mobile menu opens and lists the sections', async ({ page }) => {
  await page.goto('/pt')
  const botao = page.getByRole('button', { name: 'Menu' })
  await botao.click()
  await expect(botao).toHaveAttribute('aria-expanded', 'true')
  const menu = page.locator(`#${await botao.getAttribute('aria-controls')}`)
  await expect(
    menu.getByRole('link', { name: 'Projetos', exact: true }),
  ).toBeVisible()
})
