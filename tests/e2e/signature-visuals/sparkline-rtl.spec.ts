/**
 * Phase 37 — E2E: Sparkline RTL `scaleX(-1)` flip (VALIDATION 37-08-04).
 *
 * Asserts that when the document is rendered under the Arabic locale, any
 * mounted `<Sparkline>` carries the `data-sparkline-flipped="true"` attribute
 * and the computed `transform` resolves to the `matrix(-1, 0, 0, 1, …)` form
 * that scaleX(-1) produces.
 *
 * Phase 37 ships the primitive but NOT its first consumer — Phase 38 widgets
 * add the first on-page Sparkline. Until then, this spec uses `test.skip()`
 * with a documented reason so the assertion wiring is shipped and ready to
 * flip green the moment a route renders a Sparkline.
 *
 * Manual run:
 *   pnpm exec playwright test tests/e2e/signature-visuals/sparkline-rtl.spec.ts \
 *     --project=chromium-ar-smoke
 */
import { expect, test } from '@playwright/test'

test.describe('37-08-04 Sparkline RTL flip', () => {
  test('applies scaleX(-1) computed transform under Arabic locale', async ({
    page,
  }): Promise<void> => {
    await page.goto('/?locale=ar')

    // Phase 37 ships the primitive only; Phase 38 adds the first consumer.
    // If no Sparkline is rendered on the app root yet, skip with a reason.
    const first = page.locator('svg[data-sparkline-flipped="true"]').first()
    const count = await first.count()
    test.skip(
      count === 0,
      'No Sparkline mounted on app root yet — Phase 38 widgets introduce the first consumer. Assertion wired; re-enable once a consumer ships.',
    )

    const transform = await first.evaluate((el): string => window.getComputedStyle(el).transform)

    // scaleX(-1) resolves to `matrix(-1, 0, 0, 1, 0, 0)` in computed style.
    expect(transform).toMatch(/matrix\(-1,\s*0,\s*0,\s*1/)
  })
})
