import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * agent-runtime EVAL-only vitest config (Phase 74, Plan 74-01).
 *
 * SEPARATE from the unit config (agent-runtime/vitest.config.ts) by design (D6 +
 * threat T-74-01-02). The unit config's `include` is `src/**\/*.test.ts` +
 * `tests/**\/*.test.ts`; this config's `include` is `evals/**\/*.eval.test.ts` and its
 * `root` is `evals/` — the two globs are DISJOINT, so:
 *   - `pnpm --filter agent-runtime test`      runs ONLY unit tests (never evals)
 *   - `pnpm --filter agent-runtime test:eval` runs ONLY `*.eval.test.ts` under evals/
 * Neither run can be silently broadened to pick up the other's files.
 *
 * What runs here in CI now (Plan 74-01 + the CI eval-gate job in 74-09):
 *   - EVAL-02 computed precision/recall of query_graph edges vs a golden edge set
 *     (no LLM, no DB) + its degraded positive-failure proof.
 * Deploy-gated (added in Plan 74-08, run only when secrets.EVAL_AI_URL is set):
 *   - EVAL-01 / EVAL-03 generative judge scoring via getCopilotModel().
 */
export default defineConfig({
  // root = evals/ so the include glob is relative to this directory, and unit-config
  // collection (rooted at the workspace) can never reach `evals/**`.
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    // An empty collection is a PASS (mirrors the unit config). Eval tests exist now,
    // so this only matters if every eval is filtered out by a name argument.
    passWithNoTests: true,
    // ONLY *.eval.test.ts under evals/ — disjoint from the unit `src|tests/**\/*.test.ts`.
    include: ['**/*.eval.test.ts'],
    exclude: ['node_modules/', 'dist/', 'fixtures/'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      // `@` resolves to agent-runtime/src so a rubric can import the real tool/runtime
      // modules (e.g. the EVAL-01/03 judge in 74-08). evals/ is one level under the
      // workspace root, so src/ is `../src` from here.
      '@': path.resolve(__dirname, '../src'),
    },
  },
})
