// Phase 42-04 — Tasks visual baseline scaffold (LTR + AR @ 1280).
//
// `test.skip` until Wave 1 plan 42-07 un-skips after the MyTasksPage reskin.
// Wave 2 plan 42-10 generates the .png baselines via `--update-snapshots`.
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
} from './support/phase-42-fixtures'

test.describe('Phase 42 — Tasks visual', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('LTR baseline @ 1280', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.tasks)
    await expect(page).toHaveScreenshot('tasks-page-en.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test('AR baseline @ 1280', async ({ page }) => {
    await switchToArabic(page)
    await gotoPhase42Page(page, PHASE_42_ROUTES.tasks)
    await expect(page).toHaveScreenshot('tasks-page-ar.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })
})
