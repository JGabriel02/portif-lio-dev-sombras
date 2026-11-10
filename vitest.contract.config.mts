import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Contrato com a API real do GitHub. Nunca roda no `pnpm test` nem na CI;
// sem GITHUB_TOKEN a suíte é ignorada.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(
        new URL('./tests/unit/stubs/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/contract/**/*.test.ts'],
  },
})
