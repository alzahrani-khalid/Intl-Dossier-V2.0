/**
 * Phase 43 — qa-sweep-focus-outline (D-08); collapsed to Linear in Phase 77.
 *
 * Settings page × Linear × 2 modes = 2 focus-outline visual baselines, each
 * paired with a programmatic ≥3:1 contrast assertion via
 * `assertFocusOutlineVisible`. Locale is NOT part of the matrix per D-08.
 *
 * Phase 77 (linear-token-system): the engine is single-direction now, so the
 * former direction×mode matrix (chancery/situation/ministerial/bureau × light/
 * dark = 8 shots) collapsed to Linear × {light, dark} = 2 shots. The 8 obsolete
 * direction-named PNGs were deleted; the direction-matrix surface is treated by
 * Phase 80 as structurally replaced (intended change), not a silent baseline
 * swap — the pre-swap PNGs remain in git history under the 77-01 baseline
 * lineage.
 *
 * Mode is pinned per shot via `window.__design.setMode` (env-gated to DEV/test
 * by `DesignProvider.tsx`), which persists `id.theme` — so each baseline is
 * theme-explicit and reproducible regardless of the app's dark default
 * (Pitfall-6 discipline). The `test.afterEach` resets the hatch to the Linear
 * defaults to avoid poisoning subsequent specs.
 */

import { test, expect } from '@playwright/test'

import { loginForListPages } from './support/list-pages-auth'
import { settlePage, assertFocusOutlineVisible } from './helpers/qa-sweep'

const MODES = ['light', 'dark'] as const

// Representative primitive on Settings — first visible interactive in <main>.
// Settings (Phase 33-07) defaults to the 'general' tab on load, so the
// settings-nav buttons are stable on initial paint.
//
// Note: `:visible` is a Playwright/jQuery extension and is NOT valid CSS for
// `document.querySelector`. The Playwright locator `.first()` will pick the
// first DOM-order match; combined with `assertFocusOutlineVisible` reading
// `document.activeElement`, this is sufficient.
const PRIMITIVE_SELECTOR = 'main button, main a[href], main input'

test.describe('Phase 77 — qa-sweep-focus-outline (Settings × Linear × 2 modes)', () => {
  for (const mode of MODES) {
    test(`settings [linear/${mode}] — focus outline visible + ≥3:1 contrast`, async ({ page }) => {
      await loginForListPages(page, 'en')
      await page.goto('/settings')
      await settlePage(page)

      // Wait for the test hatch (env-gated to DEV/test).
      await page.waitForFunction(
        () =>
          typeof (window as unknown as { __design?: { setMode?: unknown } }).__design?.setMode ===
          'function',
        { timeout: 5000 },
      )

      // Pin the mode via the hatch (persists id.theme → theme-explicit baseline).
      await page.evaluate((m) => {
        const hatch = (window as unknown as { __design: { setMode: (m: string) => void } }).__design
        hatch.setMode(m)
      }, mode)

      // Settle paint after token swap.
      await page.waitForTimeout(150)

      // Focus the first visible primitive in <main>.
      const target = page.locator(PRIMITIVE_SELECTOR).first()
      await target.focus()
      await page.waitForTimeout(50)

      // Programmatic contrast assertion (returns ratio + colors for snapshot context).
      const probe = await assertFocusOutlineVisible(page, PRIMITIVE_SELECTOR)

      // Visual baseline (captured locally + human-reviewed before commit).
      await expect(page).toHaveScreenshot(`linear-${mode}-focused-primitive.png`, {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
        caret: 'hide',
      })

      // Surface diagnostics in CI logs (lint config allows warn/error only).
      console.warn(
        `[settings][linear/${mode}] outline=${probe.outlineColor} bg=${probe.bgColor} ratio=${probe.ratio.toFixed(2)}`,
      )
    })
  }

  test.afterEach(async ({ page }) => {
    // Reset to the Linear defaults so subsequent tests aren't poisoned
    // (RESEARCH §5 pitfall, T-43-11 mitigation).
    await page
      .evaluate(() => {
        const hatch = (
          window as unknown as {
            __design?: {
              setMode: (m: string) => void
              setDensity: (d: string) => void
            }
          }
        ).__design
        if (hatch) {
          hatch.setMode('dark')
          hatch.setDensity('comfortable')
        }
      })
      .catch(() => {})
  })
})
