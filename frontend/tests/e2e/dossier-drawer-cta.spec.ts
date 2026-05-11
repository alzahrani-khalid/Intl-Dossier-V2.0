// D-13 case 8 — Open full dossier navigates
// D-13 case 9 — Log engagement navigates with deferred prefill
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// Plan 41-02 D-08: Log engagement → /dossiers/engagements/create (prefill
// deferred per RESEARCH §3 — assert navigation only, NOT prefilled fields).
// Plan 41-02 D-06: Open full dossier → getDossierDetailPath which returns
// /dossiers/{segment}/{id} (no /overview suffix in current routes lib).
// Brief + Follow are stubs (D-05) — clicking does NOT navigate, aria-disabled="true".
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import {
  openDrawerForFixtureDossier,
  FIXTURE_DOSSIER_ID,
} from './support/dossier-drawer-fixture'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — CTA buttons (D-13 cases 8 + 9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  // D-13 case 8 — Open full dossier navigates
  test('Open full dossier navigates to /dossiers/{segment}/{id}', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    await page.getByTestId('cta-open-full-dossier').click()

    // getDossierDetailPath('country') → 'countries' segment.
    await expect(page).toHaveURL(
      new RegExp(`/dossiers/countries/${FIXTURE_DOSSIER_ID}(?:[/?#]|$)`),
    )
    // Drawer closes because the next route's validateSearch drops ?dossier=.
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  // D-13 case 9 — Log engagement navigates with deferred prefill
  test('Log engagement navigates to /dossiers/engagements/create (prefill deferred)', async ({
    page,
  }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    await page.getByTestId('cta-log-engagement').click()
    await expect(page).toHaveURL(/\/dossiers\/engagements\/create/)
    // Prefill deferred per RESEARCH §3 — assertion is navigation only.
  })

  test('Brief stub does NOT navigate and exposes aria-disabled="true"', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    const urlBefore = page.url()
    const brief = page.getByTestId('cta-brief')
    await expect(brief).toHaveAttribute('aria-disabled', 'true')

    await brief.click({ force: true })
    expect(page.url()).toBe(urlBefore)
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
