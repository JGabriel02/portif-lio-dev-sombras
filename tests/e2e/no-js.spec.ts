import { expect, test } from '@playwright/test'
import { messages } from './helpers'

test.use({ javaScriptEnabled: false })

test('project cards are fully opaque without JS', async ({ page }) => {
  await page.goto('/pt')
  const cards = page.locator('[data-materializar]')
  expect(await cards.count()).toBeGreaterThan(0)
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS('opacity', '1')
  }
})

test('contact form submits and shows success without JS', async ({ page }) => {
  await page.goto('/pt')
  await page.getByLabel(messages.pt.contato.name).fill('Ana Teste')
  await page.getByLabel(messages.pt.contato.email).fill('ana@example.com')
  await page
    .getByLabel(messages.pt.contato.message)
    .fill('Olá, gostaria de conversar sobre uma vaga.')
  await page.getByRole('button', { name: messages.pt.contato.send }).click()
  await expect(page.getByText(messages.pt.contato.success)).toBeVisible()
})
