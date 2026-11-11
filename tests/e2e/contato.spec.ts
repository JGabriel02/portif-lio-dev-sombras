import { expect, test } from '@playwright/test'
import { messages } from './helpers'

const c = messages.pt.contato

// O e2e roda sem DATABASE_URL, então o formulário fica oculto. A interação
// com o formulário é coberta pelos testes unitários (ContatoForm e action).
test('without a database the form is hidden and links remain', async ({
  page,
}) => {
  await page.goto('/pt')
  await expect(page.getByText(c.formIndisponivel)).toBeVisible()
  await expect(page.locator('#contato form')).toHaveCount(0)
  await expect(
    page.locator('#contato').getByRole('link', { name: 'GitHub' }),
  ).toBeVisible()
})
