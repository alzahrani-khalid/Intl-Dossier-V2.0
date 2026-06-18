import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * agent-runtime workspace vitest config (Wave 0, Plan 72-01; tool tests, Plan 72-06).
 *
 * Mirrors backend/vitest.config.ts. `pnpm --filter agent-runtime test` runs the
 * reads-only tool roster tests (src/mastra/tools/tools.test.ts) which assert the JWT
 * keystone + indistinguishable-empty per tool.
 *
 * The Wave-0 __scaffold__ exclusion has been REMOVED (per the 72-01 cross-wave contract):
 * 72-06 landed the real tools and the live tools.test.ts replaces the skipped scaffold.
 */
export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    // Kept harmless: an empty collection is a PASS, not a failure. The tool tests exist
    // now, so this only matters if all tests are filtered out.
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
