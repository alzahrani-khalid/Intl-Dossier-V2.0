// Phase 42-04 — Briefs visual baseline scaffold (LTR + AR @ 1280).
//
// `test.skip` until Wave 1 plan 42-05 un-skips after the BriefsPage reskin.
// Wave 2 plan 42-10 generates the .png baselines via `--update-snapshots`.
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
} from './support/phase-42-fixtures'

test.describe('Phase 42 — Briefs visual', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('LTR baseline @ 1280', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await expect(page).toHaveScreenshot('briefs-page-en.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test('AR baseline @ 1280', async ({ page }) => {
    await switchToArabic(page)
    await gotoPhase42Page(page, PHASE_42_ROUTES.briefs)
    await expect(page).toHaveScreenshot('briefs-page-ar.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })
})
