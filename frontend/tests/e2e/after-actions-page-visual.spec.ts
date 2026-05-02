// Phase 42-04 — After-actions visual baseline scaffold (LTR + AR @ 1280).
//
// `test.skip` until Wave 1 plan 42-06 un-skips after the AfterActionsPage
// reskin. Wave 2 plan 42-10 generates the .png baselines via
// `--update-snapshots`.
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
} from './support/phase-42-fixtures'

test.describe('Phase 42 — After-actions visual', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.skip('LTR baseline @ 1280', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await expect(page).toHaveScreenshot('after-actions-page-en.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test.skip('AR baseline @ 1280', async ({ page }) => {
    await switchToArabic(page)
    await gotoPhase42Page(page, PHASE_42_ROUTES.afterActions)
    await expect(page).toHaveScreenshot('after-actions-page-ar.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })
})
