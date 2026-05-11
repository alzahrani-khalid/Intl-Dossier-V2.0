// D-12 — visual regression baselines for the dossier drawer
//
// Phase 41 plan 07 Task 2 — Wave 2 visual gate.
// Two baselines at 1280×800: LTR and AR.  Mobile is covered by a DOM
// render assertion in dossier-drawer-mobile.spec.ts (no snapshot, per
// Phase 38 D-13 / Phase 40 D-06 precedent).  Phase 40 visual-determinism
// stack: clock freeze, transition kill (config), font readiness,
// data-loading=false ready marker.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import {
  openDrawerForFixtureDossier,
  FIXTURE_DOSSIER_ID,
  FIXTURE_DOSSIER_TYPE,
} from './support/dossier-drawer-fixture'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — visual regression (D-12)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('LTR @ 1280×800 — drawer visual baseline', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: FIXTURE_DOSSIER_TYPE,
    })
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.drawer-body[data-loading="false"]')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.locator('.drawer')).toHaveScreenshot('dossier-drawer-ltr-1280.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('AR @ 1280×800 — drawer visual baseline (RTL slide direction)', async ({ page }) => {
    await loginForListPages(page, 'ar')
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: FIXTURE_DOSSIER_TYPE,
    })
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.drawer-body[data-loading="false"]')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.locator('.drawer')).toHaveScreenshot('dossier-drawer-ar-1280.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
