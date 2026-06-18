import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * agent-runtime workspace vitest config (Wave 0, Plan 72-01).
 *
 * Mirrors backend/vitest.config.ts. `pnpm --filter agent-runtime test` runs this and
 * EXITS 0 in Wave 1 because:
 *   - `include` only collects real tests under src/ (none exist yet, vitest passes on 0).
 *   - the Wave-0 tool-test SCAFFOLD lives under src/mastra/tools/__scaffold__/** and is
 *     held out via `test.exclude` so its references to ./tools/* modules (which do NOT
 *     exist until 72-06 / Wave 5) cannot break per-wave sampling continuity.
 *
 * CROSS-WAVE CONTRACT: when 72-06 lands the real tools, it REMOVES the __scaffold__ glob
 * from `exclude` (and renames/moves the scaffold to the live tools dir) so the JWT-scoping
 * + indistinguishable-empty assertions turn GREEN.
 *
 * The scaffold ALSO compiles cleanly today because it never statically imports ./tools/*
 * — it uses lazy dynamic `await import()` / vi.mock inside the (skipped) test bodies.
 * Double-safety: excluded here AND lazy-imported there.
 */
export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    // Wave 1 has no runnable tests yet (the only scaffold is excluded below), so an
    // empty collection is a PASS — NOT a failure. Without this, `vitest run` exits 1
    // on "No test files found" and breaks per-wave sampling continuity. 72-06 lands
    // real tests; this flag stays harmless once tests exist.
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      // Wave 0: hold the tool-test scaffold out until 72-06 lands the real tools.
      'src/mastra/tools/__scaffold__/**',
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
