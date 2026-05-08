// D-13 case 10 — commitment row click navigates to commitment detail
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// Plan 41-05 D-08 REVISED: clicking a commitment row routes to /commitments
// (no work-item detail dialog component exists per RESEARCH §4). The dossier
// drawer closes because the row navigation drops the ?dossier= keys while the
// commitments route may open its own detail drawer for ?id=.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import {
  openDrawerForFixtureDossier,
  FIXTURE_DOSSIER_ID,
} from './support/dossier-drawer-fixture'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — commitment row click (D-13 case 10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  test('clicking a commitment row navigates to /commitments?id=<uuid>', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    // Wait for the commitments section + at least one row.
    await expect(page.getByTestId('dossier-drawer-commitments')).toBeVisible()
    const firstRow = page.getByTestId('dossier-drawer-commitment-row').first()
    await firstRow.waitFor({ state: 'visible', timeout: 10_000 })

    await firstRow.click()

    await expect(page).toHaveURL(/\/commitments(?:\?|#|$)/)
    await expect(page).toHaveURL(/[?&]id=[A-Za-z0-9-]+/)
    await expect(page).not.toHaveURL(/[?&]dossier=/)
    await expect(page).not.toHaveURL(/[?&]dossierType=/)
    await expect(
      page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
    ).toHaveCount(0)
    await expect(page.getByTestId('dossier-drawer-commitments')).toHaveCount(0)
  })
})
