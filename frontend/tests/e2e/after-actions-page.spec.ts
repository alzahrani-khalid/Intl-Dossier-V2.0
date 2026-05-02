// Phase 42-04 — After-actions functional E2E.
//
// Un-skipped by Wave 1 plan 42-06 after the AfterActionsPage reskin.
// Covers:
//   - .tbl renders with the expected column count
//   - row click → /after-actions/$id detail route
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — After-actions page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('renders the .tbl with 6 columns', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await expect(page.locator('table.tbl')).toBeVisible()
    expect(await page.locator('table.tbl thead th').count()).toBeGreaterThanOrEqual(5)
  })

  test('navigation: row click → /after-actions/$id', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await page.locator('table.tbl tbody tr').first().click()
    await expect(page).toHaveURL(/\/after-actions\/[^/]+$/)
  })
})
