import { expect, test } from '@playwright/test'

test('beacon envia visita e clique em repositório', async ({
  page,
  context,
}) => {
  const corpos: string[] = []
  await page.route('**/api/coleta', async (route) => {
    corpos.push(route.request().postData() ?? '')
    await route.fulfill({ status: 204 })
  })
  await page.goto('/pt')
  await expect.poll(() => corpos.some((c) => c.includes('"t":"v"'))).toBe(true)

  const abaNova = context.waitForEvent('page')
  await page
    .getByRole('link', { name: /Ver repositório/ })
    .first()
    .click()
  const aba = await abaNova
  await aba.close()

  await expect
    .poll(() => corpos.some((c) => c.includes('"tipo":"repo"')))
    .toBe(true)
})
