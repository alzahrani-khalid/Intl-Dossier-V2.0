// Phase 42-04 — Activity visual baseline scaffold (LTR + AR @ 1280).
//
// `test.skip` until Wave 1 plan 42-08 un-skips after the ActivityPage reskin.
// Wave 2 plan 42-10 generates the .png baselines via `--update-snapshots`.
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
} from './support/phase-42-fixtures'

test.describe('Phase 42 — Activity visual', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.skip('LTR baseline @ 1280', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.activity)
    await expect(page).toHaveScreenshot('activity-page-en.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test.skip('AR baseline @ 1280', async ({ page }) => {
    await switchToArabic(page)
    await gotoPhase42Page(page, PHASE_42_ROUTES.activity)
    await expect(page).toHaveScreenshot('activity-page-ar.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })
})
