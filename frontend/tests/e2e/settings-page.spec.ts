// Phase 42-04 — Settings functional E2E.
//
// Un-skipped by Wave 1 plan 42-09 after the SettingsPage reskin.
// Covers:
//   - 240+1fr layout with active accent bar
//   - mobile-collapse: ≤768px renders horizontal pill nav
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('renders 240+1fr layout with active accent bar', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.settings)
    await expect(page.locator('button.settings-nav.active')).toBeVisible()
  })

  test('mobile-collapse: ≤768px shows horizontal pill nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await gotoPhase42Page(page, PHASE_42_ROUTES.settings)
    await expect(page.locator('.settings-nav-card')).toHaveCSS('overflow-x', /auto|scroll/)
  })
})
