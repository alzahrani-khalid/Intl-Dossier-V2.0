/**
 * Phase 39 Plan 04 — Kanban render activation (BOARD-01, BOARD-02).
 *
 * Asserts the WorkBoard renders the BoardToolbar + 4 BoardColumn sections,
 * and that any seeded `.kcard.overdue` carries the BOARD-02 inline-start
 * 3px border. The legacy kanban-drag-drop.spec.ts is preserved until 39-09.
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban render', () => {
  test('renders BoardToolbar and 4 columns', async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('searchbox')).toBeVisible()

    const columns = page.locator('section.col')
    await expect(columns).toHaveCount(4)

    // BOARD-02: any overdue card must have a 3px inline-start border (RTL-correct).
    const overdueCard = page.locator('.kcard.overdue').first()
    if ((await overdueCard.count()) > 0) {
      const borderInlineStart = await overdueCard.evaluate(
        (el) => getComputedStyle(el).borderInlineStartWidth,
      )
      expect(borderInlineStart).toBe('3px')
    }
  })
})
