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
    alias: [
      { find: '~~', replacement: resolve(__dirname, '.') },
      { find: '~', replacement: resolve(__dirname, './app') },
      { find: '#imports', replacement: resolve(__dirname, './tests/__mocks__/nuxt-imports.ts') },
      { find: '#supabase/server', replacement: resolve(__dirname, './tests/__mocks__/supabase-server.ts') },
      { find: '@supabase/supabase-js', replacement: resolve(__dirname, 'node_modules/.pnpm/@supabase+supabase-js@2.101.1/node_modules/@supabase/supabase-js') },
      // Bracket paths in Nuxt dynamic route files confuse Vite's glob analysis — alias to absolute paths
      {
        find: /.*server\/api\/embed\/\[tenantId\]\/submit\.post$/,
        replacement: resolve(__dirname, 'server/api/embed/[tenantId]/submit.post.ts'),
      },
      {
        find: /.*server\/api\/sequences\/\[id\]\/enroll\.post$/,
        replacement: resolve(__dirname, 'server/api/sequences/[id]/enroll.post.ts'),
      },
      // Integration tests in tests/integration/ are one level shallower than unit tests
      // in tests/unit/server/, so their ../../../ paths resolve outside the project root.
      // Alias these to the correct absolute paths.
      {
        find: /.*\/server\/lib\/email$/,
        replacement: resolve(__dirname, 'server/lib/email'),
      },
    ],
  },
})
