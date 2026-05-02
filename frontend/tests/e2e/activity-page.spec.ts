// Phase 42-04 — Activity functional E2E scaffold.
//
// `test.skip` until Wave 1 plan 42-08 un-skips after the ActivityPage reskin.
// Covers:
//   - .act-list renders with 3-col grid rows
//   - All/Following tabs swap
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — Activity page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.skip('renders .act-list with 3-col grid rows', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.activity)
    await expect(page.locator('ul.act-list')).toBeVisible()
    await expect(page.locator('ul.act-list li.act-row').first()).toHaveCSS('display', 'grid')
  })

  test.skip('tabs swap All/Following', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.activity)
    await page.getByRole('tab', { name: /following|متابَع/i }).click()
    await expect(page.getByRole('tab', { name: /following|متابَع/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
