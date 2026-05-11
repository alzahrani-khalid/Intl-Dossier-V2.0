// Phase 42-04 — Briefs functional E2E.
//
// Un-skipped in Wave 1 plan 42-05 after the BriefsPage reskin.
// Covers golden-path interactions:
//   - card grid renders (or empty state if dataset is empty)
//   - card click → BriefViewer dialog
//   - "New brief" CTA → BriefGenerationPanel dialog
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — Briefs page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('renders the card grid (golden path)', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    // Either the grid renders OR the empty-state heading does — both are
    // valid post-reskin states depending on seed data.
    const grid = page.locator('[data-testid="briefs-card-grid"]')
    const empty = page.getByRole('heading', { name: /no briefs yet|لا توجد ملخصات/i })
    await expect(grid.or(empty)).toBeVisible()
  })

  test('card-click opens BriefViewer dialog', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    const firstCard = page.locator('[data-testid="brief-card"]').first()
    const cardCount = await page.locator('[data-testid="brief-card"]').count()
    test.skip(cardCount === 0, 'No briefs in dataset — card-click path not exercisable')
    await firstCard.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('cta opens BriefGenerationPanel dialog', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await page.getByRole('button', { name: /new brief|ملخص جديد/i }).click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})
