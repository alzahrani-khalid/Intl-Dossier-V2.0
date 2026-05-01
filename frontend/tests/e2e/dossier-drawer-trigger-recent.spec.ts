// D-13 case 1 — drawer opens from RecentDossiers click
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// Asserts the RecentDossiers widget trigger wired in plan 41-06 opens
// the drawer with all 5 body sections rendered (kpi/summary/upcoming/
// activity/commitments) per DRAWER-01 + DRAWER-02 contracts.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — opens from RecentDossiers (D-13 case 1)', () => {
  test.beforeEach(async ({ page }) => {
    // Phase 40 visual-determinism layer — see list-pages-visual.spec.ts.
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  test('clicking a recent dossier row opens drawer with all sections', async ({ page }) => {
    await loginForListPages(page)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const trigger = page.getByTestId('recent-dossier-trigger').first()
    await trigger.click()

    await expect(
      page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
    ).toBeVisible()

    // Wait for drawer body to finish loading before asserting section markers.
    await page
      .locator('.drawer-body[data-loading="false"]')
      .waitFor({ state: 'attached', timeout: 10_000 })

    await expect(page.getByTestId('dossier-drawer-kpi-strip')).toBeVisible()
    await expect(page.getByTestId('dossier-drawer-summary')).toBeVisible()
    await expect(page.getByTestId('dossier-drawer-upcoming')).toBeVisible()
    await expect(page.getByTestId('dossier-drawer-activity')).toBeVisible()
    await expect(page.getByTestId('dossier-drawer-commitments')).toBeVisible()
  })
})
