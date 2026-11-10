import { expect, test } from '@playwright/test'

// Browser contexts inject their own Accept-Language (from `locale`), which
// would mask the '' and '*' cases, so negotiation is exercised through the
// request API, which follows redirects and reports the final URL.
const cases: Array<[header: string, expected: RegExp]> = [
  ['en-US,en;q=0.9', /\/en$/],
  ['fr-FR', /\/pt$/],
  ['*', /\/pt$/],
  ['', /\/pt$/],
]

test.describe('locale negotiation', () => {
  for (const [header, expected] of cases) {
    test(`Accept-Language "${header}" resolves to ${expected}`, async ({
      request,
    }) => {
      const response = await request.get('/', {
        headers: { 'Accept-Language': header },
      })
      expect(response.status()).toBe(200)
      expect(response.url()).toMatch(expected)
    })
  }

  test('html lang matches the locale', async ({ page }) => {
    await page.goto('/pt')
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt')
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('unknown locale is 404', async ({ page }) => {
    const response = await page.goto('/de/anything')
    expect(response?.status()).toBe(404)
  })
})
