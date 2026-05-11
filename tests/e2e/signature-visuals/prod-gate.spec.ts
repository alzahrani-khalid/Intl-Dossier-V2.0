/**
 * Phase 37 — E2E: Prod-gate for T-37-02 defense-in-depth (VALIDATION 37-08-03).
 *
 * Asserts that `window.__showGlobeLoader` is STRIPPED from production bundles
 * via Vite's `import.meta.env.DEV` dead-code elimination. This is the runtime
 * counterpart to the Plan 03 unit test — both must stay green so a future
 * refactor can't accidentally leak the DEV-only global into prod.
 *
 * Run mode:
 *   This spec is PROD-ONLY. It must run against `vite preview` of a
 *   production build, NOT the default dev server. Guarded by the
 *   `PROD_PREVIEW=1` env flag; otherwise the test is skipped with a clear
 *   reason so CI wiring is unambiguous.
 *
 * Manual run:
 *   1. pnpm --filter frontend build
 *   2. pnpm --filter frontend preview &     # listens on http://localhost:4173
 *   3. PROD_PREVIEW=1 E2E_BASE_URL=http://localhost:4173 \
 *        pnpm exec playwright test tests/e2e/signature-visuals/prod-gate.spec.ts \
 *        --project=chromium-en
 */
import { expect, test } from '@playwright/test'

test.describe('37-08-03 prod-gate (T-37-02)', () => {
  test('window.__showGlobeLoader is undefined in prod build', async ({
    page,
  }): Promise<void> => {
    test.skip(
      process.env.PROD_PREVIEW !== '1',
      'Set PROD_PREVIEW=1 after running `pnpm --filter frontend build && pnpm --filter frontend preview` — see spec header.',
    )

    await page.goto('/')

    const globalType = await page.evaluate((): string =>
      typeof (window as unknown as { __showGlobeLoader?: unknown }).__showGlobeLoader,
    )

    expect(globalType).toBe('undefined')
  })
})
