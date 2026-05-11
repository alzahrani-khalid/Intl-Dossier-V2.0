/**
 * Phase 39 Plan 04 — Kanban RTL activation (BOARD-02 inline-start = right edge in RTL).
 *
 * Forces the page to RTL via the document `dir` attribute and confirms the
 * inline-start border on `.kcard.overdue` resolves to a non-zero RIGHT-side
 * physical border (because logical inline-start maps to right in RTL).
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban RTL', () => {
  test('overdue kcard inline-start border lands on the right edge in rtl', async ({ page }) => {
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
    // In RTL, inline-start = physical right edge.
    expect(parseInt(offsets.borderRight, 10)).toBeGreaterThan(0)
  })
})
