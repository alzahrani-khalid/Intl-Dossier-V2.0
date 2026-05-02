// Phase 42-04 — Briefs functional E2E scaffold.
//
// `test.skip` until Wave 1 plan 42-05 un-skips after the BriefsPage reskin.
// Covers golden-path interactions:
//   - card grid renders
//   - card click → BriefViewer modal
//   - "New brief" CTA → BriefGenerationPanel modal
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — Briefs page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.skip('renders the card grid (golden path)', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await expect(page.locator('[data-testid="briefs-card-grid"]')).toBeVisible()
  })

  test.skip('card-click opens BriefViewer modal', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await page.locator('[data-testid="brief-card"]').first().click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test.skip('cta opens BriefGenerationPanel modal', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await page.getByRole('button', { name: /new brief|ملخص جديد/i }).click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})
