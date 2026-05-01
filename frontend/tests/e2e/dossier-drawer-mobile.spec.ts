// D-13 case 6 — mobile viewport renders drawer full-screen
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// D-12 / D-13: at ≤640px the drawer occupies 100% viewport width with
// no box-shadow.  This spec is a DOM render assertion only — no visual
// snapshot per Phase 38 D-13 / Phase 40 D-06 precedent (visual baselines
// are 1280×800 LTR + AR; mobile is functional).
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier } from './support/dossier-drawer-fixture'

const FIXTURE_DOSSIER_ID = process.env.E2E_DOSSIER_FIXTURE_ID ?? 'seed-country-sa'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — mobile render (D-13 case 6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('drawer fills viewport width and has no box-shadow at 390×844', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })

    const drawer = page.locator('.drawer').first()
    await expect(drawer).toBeVisible()

    const computed = await drawer.evaluate((el) => {
      const styles = getComputedStyle(el as HTMLElement)
      const rect = el.getBoundingClientRect()
      return {
        boxShadow: styles.boxShadow,
        rectWidth: rect.width,
        viewportWidth: window.innerWidth,
      }
    })

    expect(computed.boxShadow).toBe('none')
    // Tolerate sub-pixel rounding on the final layout pass.
    expect(Math.round(computed.rectWidth)).toBe(Math.round(computed.viewportWidth))

    // Tab cycle assertion (no snapshot per D-12).
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]')
        return Boolean(dlg && dlg.contains(document.activeElement))
      })
      expect(focusedInsideDialog).toBe(true)
    }
  })
})
