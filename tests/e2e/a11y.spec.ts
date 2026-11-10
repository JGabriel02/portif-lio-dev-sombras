import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { modes, setMode } from './helpers'

const paths = ['/pt', '/en', '/pt/projetos/npc-forge', '/pt/xyz']

for (const mode of modes) {
  for (const path of paths) {
    test(`no axe violations on ${path} (${mode})`, async ({
      page,
      context,
    }) => {
      await setMode(context, mode)
      await page.goto(path)
      await page.waitForLoadState('load')
      const { violations } = await new AxeBuilder({ page }).analyze()
      expect(violations).toEqual([])
    })
  }
}
