/**
 * Phase 37 — E2E: axe-core WCAG 2.1 AA compliance check (VALIDATION 37-08-02).
 *
 * Forces the splash open via the DEV-only `window.__showGlobeLoader` global,
 * then runs axe-core to confirm ZERO WCAG 2.1 AA violations across the
 * mounted shell + primitives.
 *
 * Manual run:
 *   pnpm exec playwright test tests/e2e/signature-visuals/a11y.spec.ts \
 *     --project=chromium-en
 *
 * Requires: `@axe-core/playwright` (already in frontend/package.json devDeps).
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('37-08-02 axe-core a11y gate', () => {
  test('no axe violations on the main shell with splash open', async ({
    page,
  }): Promise<void> => {
    await page.goto('/')

    // Force the splash open via the DEV global (only works against dev build —
    // prod is covered by prod-gate.spec.ts).
    await page.evaluate((): void => {
      const g = (window as unknown as { __showGlobeLoader?: (ms: number) => void })
        .__showGlobeLoader
      if (typeof g === 'function') g(3000)
    })

    // Small settle; the loader reacts synchronously via useSyncExternalStore
    // but axe prefers a fully painted frame.
    await page.waitForTimeout(100)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
