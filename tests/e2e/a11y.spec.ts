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
      // Freeze the drifting background fog so contrast is measured at a fixed
      // position (axe treats the blurred blobs as solid, and their position
      // otherwise depends on timing).
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('load')
      const { violations } = await new AxeBuilder({ page }).analyze()
      expect(violations).toEqual([])
    })
  }
}
