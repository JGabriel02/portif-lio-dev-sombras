import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: 'corepack pnpm build && corepack pnpm start',
    port: 3000,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    // Banco fictício e inalcançável: o formulário de contato aparece (depende de
    // DATABASE_URL) e leituras/gravações falham rápido, caindo nos arquivos.
    env: { DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:1/e2e' },
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
