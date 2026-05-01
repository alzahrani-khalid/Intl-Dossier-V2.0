// D-13 case 3 — deep link restores drawer state on refresh
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// URL search-param mount (plan 41-01 D-02): visiting /?dossier=<id>&dossierType=<type>
// directly opens the drawer; reload preserves it.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier } from './support/dossier-drawer-fixture'

const FIXTURE_DOSSIER_ID = process.env.E2E_DOSSIER_FIXTURE_ID ?? 'seed-country-sa'
const FIXTURE_DOSSIER_TYPE = 'country'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — deep-link restoration (D-13 case 3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  test('visiting /?dossier=...&dossierType=... opens drawer and survives reload', async ({
    page,
  }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: FIXTURE_DOSSIER_TYPE,
    })

    await expect(
      page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
    ).toBeVisible()

    await page.reload()
    await page.evaluate(() => document.fonts.ready)

    await expect(
      page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
    ).toBeVisible()
    await expect(page).toHaveURL(/[?&]dossier=/)
    await expect(page).toHaveURL(/[?&]dossierType=country/)
  })
})
