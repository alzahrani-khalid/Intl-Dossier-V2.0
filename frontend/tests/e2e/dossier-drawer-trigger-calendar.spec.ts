// D-13 case 2 — drawer opens from calendar event click
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// Asserts the calendar onEventClick handler wired in plan 41-06 Task 2
// opens the drawer when a calendar event with a non-empty dossier_id is
// clicked. Events without a dossier are not exercised here (different code path).
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — opens from calendar event (D-13 case 2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  test('clicking an event whose dossier_id is set opens the drawer', async ({ page }) => {
    await loginForListPages(page)
    await page.goto('/calendar')
    await page.evaluate(() => document.fonts.ready)

    // Calendar events that link to a dossier expose data-dossier-id.  Wait
    // for at least one to render then click it.
    const dossierEvent = page.locator('[data-dossier-id]').first()
    await dossierEvent.waitFor({ state: 'visible', timeout: 15_000 })
    await dossierEvent.click()

    await expect(
      page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
    ).toBeVisible()
    await expect(page).toHaveURL(/[?&]dossier=/)
  })
})
