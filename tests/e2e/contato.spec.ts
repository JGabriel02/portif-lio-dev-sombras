import { expect, test } from '@playwright/test'
import { messages } from './helpers'

const c = messages.pt.contato

test('invalid submit shows errors and focuses the alert summary', async ({
  page,
}) => {
  await page.goto('/pt')
  await page.waitForLoadState('load')
  await page.getByRole('button', { name: c.send }).click()
  const alert = page.locator('form [role="alert"]')
  await expect(alert).toBeVisible()
  await expect(alert).toBeFocused()
  await expect(alert).toContainText(c.errors.nameRequired)
  await expect(page.getByLabel(c.name)).toHaveAttribute('aria-invalid', 'true')
})

test('valid submit shows the success message', async ({ page }) => {
  await page.goto('/pt')
  await page.waitForLoadState('load')
  await page.getByLabel(c.name).fill('Ana Teste')
  await page.getByLabel(c.email).fill('ana@example.com')
  await page
    .getByLabel(c.message)
    .fill('Olá, gostaria de conversar sobre uma vaga.')
  await page.getByRole('button', { name: c.send }).click()
  await expect(page.getByText(c.success)).toBeVisible()
})
