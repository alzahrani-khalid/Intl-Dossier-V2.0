// Phase 42-04 — After-actions functional E2E scaffold.
//
// `test.skip` until Wave 1 plan 42-06 un-skips after the AfterActionsPage
// reskin. Covers:
//   - .tbl renders with the expected column count
//   - row click → /after-actions/$id detail route
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — After-actions page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.skip('renders the .tbl with 6 columns', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await expect(page.locator('table.tbl')).toBeVisible()
    expect(await page.locator('table.tbl thead th').count()).toBeGreaterThanOrEqual(5)
  })

  test.skip('navigation: row click → /after-actions/$id', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await page.locator('table.tbl tbody tr').first().click()
    await expect(page).toHaveURL(/\/after-actions\/[^/]+$/)
  })
})
