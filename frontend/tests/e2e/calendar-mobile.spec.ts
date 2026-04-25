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

    const today = page.getByRole('button', { name: /Today|اليوم/ })
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
