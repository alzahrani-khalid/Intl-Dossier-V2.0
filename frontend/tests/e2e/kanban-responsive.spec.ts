// Phase 39 Plan 39-07 — Kanban responsive 320/768/1280
// Activated by Plan 39-07. Playwright runner is repaired in 39-09.
import { test, expect } from '@playwright/test'

const viewports = [
  { width: 320, height: 640 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]

test.describe('Phase 39: Kanban responsive', () => {
  for (const vp of viewports) {
    test(`renders without overflow at ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.goto('/kanban')
      await page.waitForLoadState('networkidle')

      const columns = page.locator('section.col')
      await expect(columns).toHaveCount(4)

      // At <640px, columns must scroll horizontally (parent has overflow-x: auto)
      if (vp.width < 640) {
        const parent = page.locator('.board-columns')
        const scrollWidth = await parent.evaluate((el) => el.scrollWidth)
        const clientWidth = await parent.evaluate((el) => el.clientWidth)
        expect(scrollWidth).toBeGreaterThan(clientWidth)
      }
    })
  }
})
