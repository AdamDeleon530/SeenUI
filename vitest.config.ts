import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'server/lib/**',
        'server/api/**',
        'app/composables/**',
        'app/stores/**',
        'app/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: {
      '~~': resolve(__dirname, '.'),
      '~': resolve(__dirname, './app'),
      '#imports': resolve(__dirname, './tests/__mocks__/nuxt-imports.ts'),
      '#supabase/server': resolve(__dirname, './tests/__mocks__/supabase-server.ts'),
    },
  },
})
