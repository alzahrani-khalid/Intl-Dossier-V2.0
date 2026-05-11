// Phase 42-04 — Settings visual baseline scaffold (LTR + AR @ 1280, plus
// mobile pill nav @ 768).
//
// `test.skip` until Wave 1 plan 42-09 un-skips after the SettingsPage reskin.
// Wave 2 plan 42-10 generates the .png baselines via `--update-snapshots`.
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
} from './support/phase-42-fixtures'

test.describe('Phase 42 — Settings visual', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('LTR baseline @ 1280', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.settings)
    await expect(page).toHaveScreenshot('settings-page-en.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test('AR baseline @ 1280', async ({ page }) => {
    await switchToArabic(page)
    await gotoPhase42Page(page, PHASE_42_ROUTES.settings)
    await expect(page).toHaveScreenshot('settings-page-ar.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test('mobile pill nav @ 768', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoPhase42Page(page, PHASE_42_ROUTES.settings)
    await expect(page).toHaveScreenshot('settings-page-mobile.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })
})
