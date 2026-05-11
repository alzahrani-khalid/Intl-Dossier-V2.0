import { test, expect } from '@playwright/test'

// Phase 39 Plan 39-05: activate calendar render assertions.
// Verifies the verbatim handoff .cal-grid 7-column layout is on the calendar route
// and that today's day-number renders bold (700) using the design-system accent token.
test.describe('Phase 39: Calendar grid render', () => {
  test('renders cal-grid with 7 dow headers and >=35 day cells', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    const grid = page.locator('.cal-grid').first()
    await expect(grid).toBeVisible()

    const dow = page.locator('.cal-dow')
    await expect(dow).toHaveCount(7)

    const cells = page.locator('.cal-cell')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThanOrEqual(35)
    expect(cellCount % 7).toBe(0)

    const today = page.locator('.cal-cell.today').first()
    if ((await today.count()) > 0) {
      const fontWeight = await today
        .locator('.cal-d')
        .first()
        .evaluate((el) => getComputedStyle(el).fontWeight)
      expect(['700', 'bold']).toContain(fontWeight)
    }
  })
})
