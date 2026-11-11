import { expect, test } from '@playwright/test'
import { messages } from './helpers'

test.use({ javaScriptEnabled: false })

test('page is themed (dark) and not in js mode without JS', async ({
  page,
}) => {
  await page.goto('/pt')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'sombra')
  await expect(html).toHaveAttribute('data-mode', 'dark')
  await expect(html).not.toHaveClass(/(^|\s)js(\s|$)/)
  // #140F1F, the dark --bg
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(20, 15, 31)',
  )
})

test('project cards are visible and unhidden without JS', async ({ page }) => {
  await page.goto('/pt')
  const cards = page.locator('[data-materializar] > article')
  expect(await cards.count()).toBeGreaterThan(0)
  for (const card of await cards.all()) {
    // Real dark --surface (#1F1730), not the transparent "unrevealed" state.
    await expect(card).toHaveCSS('background-color', 'rgb(31, 23, 48)')
  }
})

test('contact form submits without JS and shows the error alert (fake database)', async ({
  page,
}) => {
  await page.goto('/pt')
  await page.getByLabel(messages.pt.contato.name).fill('Ana Teste')
  await page.getByLabel(messages.pt.contato.email).fill('ana@example.com')
  await page
    .getByLabel(messages.pt.contato.message)
    .fill('Olá, gostaria de conversar sobre uma vaga.')
  await page.getByRole('button', { name: messages.pt.contato.send }).click()
  await expect(page.locator('form [role="alert"]')).toContainText(
    messages.pt.contato.error,
  )
})
