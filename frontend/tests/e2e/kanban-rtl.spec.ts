/**
 * Phase 39 Plan 04 — Kanban RTL activation (logical-property parity).
 *
 * Phase 85 D-85-01: the overdue edge bar is gone, so there is no longer a
 * directional border to check. This spec now asserts logical-property parity
 * a different way: under dir=rtl the overdue card's physical left/right borders
 * are SYMMETRIC (the plain 1px .kcard hairline — no leftover physical bias),
 * and the red due chip (.kdue.is-overdue) still renders in RTL (digits stay LTR
 * via the untouched LtrIsolate wrapper).
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban RTL', () => {
  test('overdue kcard has symmetric borders and renders the red due chip in rtl', async ({
    page,
  }) => {
    await page.goto('/kanban')
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
    await page.waitForLoadState('networkidle')

    const overdueCard = page.locator('.kcard.overdue').first()
    if ((await overdueCard.count()) === 0) {
      test.skip(true, 'No overdue cards seeded for current user')
    }

    const offsets = await overdueCard.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { borderRight: cs.borderRightWidth, borderLeft: cs.borderLeftWidth }
    })
    // No physical bias left over — the removed inline-start bar means both
    // horizontal borders are the same 1px hairline in RTL.
    expect(offsets.borderRight).toBe(offsets.borderLeft)

    // The red due chip renders in RTL too (one chip per overdue card).
    await expect(overdueCard.locator('.kdue.is-overdue')).toHaveCount(1)
  })
})
