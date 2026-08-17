// Phase 39 Plan 39-07 — Calendar mobile week-list (<640px) vs cal-grid (≥640px)
// Activated by Plan 39-07. Playwright runner is repaired in 39-09.
import { test, expect } from '@playwright/test'

test.describe('Phase 39: Calendar mobile week-list', () => {
  test('shows week-list (not cal-grid) below 640px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.week-list-mobile')).toBeVisible()
    await expect(page.locator('.cal-grid')).not.toBeVisible()

    // Phase 96 DEAD-07: with the grid no longer replaced by an empty-month
    // placeholder, BOTH "Today" affordances render below 640px — the header
    // control and WeekListMobile's own `.weeklist-today`. The bare locator was
    // written when neither reached the DOM and now trips strict mode; scope it
    // to the first match, which is the header control the assertion meant.
    const today = page.getByRole('button', { name: /Today|اليوم/ }).first()
    await expect(today).toBeVisible()
  })

  test('shows cal-grid (not week-list) above 640px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.cal-grid')).toBeVisible()
    await expect(page.locator('.week-list-mobile')).not.toBeVisible()
  })
})
