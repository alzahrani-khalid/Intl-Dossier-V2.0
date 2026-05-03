/**
 * Phase 43 — qa-sweep-focus-outline (D-08)
 *
 * Settings page × 4 directions × 2 modes = 8 focus-outline visual baselines,
 * each paired with a programmatic ≥3:1 contrast assertion via
 * `assertFocusOutlineVisible`. Locale is NOT part of the matrix per D-08.
 *
 * Direction/mode are flipped via the `window.__design` test hatch (env-gated
 * to DEV/test by `DesignProvider.tsx`) — NOT through UI clicks. The
 * `test.afterEach` resets the hatch to v6.0 defaults to avoid poisoning
 * subsequent specs (RESEARCH §5 pitfall, T-43-11 mitigation).
 *
 * Baselines are NOT committed by this plan. The first run will fail with
 * "snapshot not found" — Plan 43-07 runs `--update-snapshots`, then a human
 * reviews and commits the 8 PNGs.
 */

import { test, expect } from '@playwright/test'

import { loginForListPages } from './support/list-pages-auth'
import { settlePage, assertFocusOutlineVisible } from './helpers/qa-sweep'

const DIRECTIONS = ['chancery', 'situation', 'ministerial', 'bureau'] as const
const MODES = ['light', 'dark'] as const

// Representative primitive on Settings — first visible interactive in <main>.
// Settings (Phase 33-07) defaults to the 'general' tab on load, so the
// settings-nav buttons are stable on initial paint.
const PRIMITIVE_SELECTOR = 'main button:visible, main a[href]:visible, main input:visible'

test.describe('Phase 43 — qa-sweep-focus-outline (Settings × 4 dirs × 2 modes)', () => {
  for (const direction of DIRECTIONS) {
    for (const mode of MODES) {
      test(`settings [${direction}/${mode}] — focus outline visible + ≥3:1 contrast`, async ({
        page,
      }) => {
        await loginForListPages(page, 'en')
        await page.goto('/settings')
        await settlePage(page)

        // Wait for the test hatch (env-gated to DEV/test).
        await page.waitForFunction(
          () =>
            typeof (window as unknown as { __design?: { setDirection?: unknown } }).__design
              ?.setDirection === 'function',
          { timeout: 5000 },
        )

        // Apply direction + mode via hatch.
        await page.evaluate(
          ([d, m]) => {
            const hatch = (
              window as unknown as {
                __design: { setDirection: (d: string) => void; setMode: (m: string) => void }
              }
            ).__design
            hatch.setDirection(d)
            hatch.setMode(m)
          },
          [direction, mode] as const,
        )

        // Settle paint after token swap.
        await page.waitForTimeout(150)

        // Focus the first visible primitive in <main>.
        const target = page.locator(PRIMITIVE_SELECTOR).first()
        await target.focus()
        await page.waitForTimeout(50)

        // Programmatic contrast assertion (returns ratio + colors for snapshot context).
        const probe = await assertFocusOutlineVisible(page, PRIMITIVE_SELECTOR)

        // Visual baseline (committed by Plan 43-07 after human approval).
        await expect(page).toHaveScreenshot(`${direction}-${mode}-focused-primitive.png`, {
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
          caret: 'hide',
        })

        // Surface diagnostics in CI logs (lint config allows warn/error only).
        console.warn(
          `[settings][${direction}/${mode}] outline=${probe.outlineColor} bg=${probe.bgColor} ratio=${probe.ratio.toFixed(2)}`,
        )
      })
    }
  }

  test.afterEach(async ({ page }) => {
    // Reset to v6.0 defaults so subsequent tests aren't poisoned
    // (RESEARCH §5 pitfall, T-43-11 mitigation).
    await page
      .evaluate(() => {
        const hatch = (
          window as unknown as {
            __design?: {
              setDirection: (d: string) => void
              setMode: (m: string) => void
              setHue: (h: number) => void
              setDensity: (d: string) => void
            }
          }
        ).__design
        if (hatch) {
          hatch.setDirection('bureau')
          hatch.setMode('light')
          hatch.setHue(32)
          hatch.setDensity('comfortable')
        }
      })
      .catch(() => {})
  })
})
