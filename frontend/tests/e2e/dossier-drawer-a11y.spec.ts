// D-13 case 4 — ESC closes drawer and clears search params
// D-13 case 7 — Tab cycles within drawer (focus trap)
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E (focus + ESC behavior).
// axe-core gate is in dossier-drawer-axe.spec.ts.  This spec asserts the
// keyboard contract: ESC dismissal strips ?dossier= and ?dossierType=,
// and Tab/Shift+Tab keep focus inside the drawer's focus scope.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier } from './support/dossier-drawer-fixture'

const FIXTURE_DOSSIER_ID = process.env.E2E_DOSSIER_FIXTURE_ID ?? 'seed-country-sa'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — keyboard a11y (D-13 cases 4 + 7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  // D-13 case 4 — ESC closes drawer and clears search params
  test('ESC closes drawer and removes ?dossier=/?dossierType= from URL', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog')).toHaveCount(0)
    const url = page.url()
    expect(url).not.toMatch(/[?&]dossier=/)
    expect(url).not.toMatch(/[?&]dossierType=/)
  })

  // D-13 case 7 — Tab cycles within drawer (focus trap)
  test('Tab and Shift+Tab keep focus inside the drawer (focus trap)', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Cycle forward 8 times — focus must remain inside the dialog.
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]')
        return Boolean(dlg && dlg.contains(document.activeElement))
      })
      expect(focusedInsideDialog).toBe(true)
    }

    // Cycle backward — same invariant.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Shift+Tab')
      const focusedInsideDialog = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]')
        return Boolean(dlg && dlg.contains(document.activeElement))
      })
      expect(focusedInsideDialog).toBe(true)
    }
  })
})
