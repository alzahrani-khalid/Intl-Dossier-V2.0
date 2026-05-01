// D-13 case 5 — RTL slides from inline-start (physical-edge geometry assertion)
//
// Phase 41 plan 07 Task 1 — Wave 2 functional E2E.
// The Radix Sheet with side="right" anchors via `inset-inline-end: 0`. Under
// `dir=rtl` that logical edge resolves to the physical LEFT, so the drawer's
// rect.left === 0. Under `dir=ltr` it resolves to the physical RIGHT, so
// rect.right === innerWidth. We assert geometry, not the inset-inline-start
// computed value (which would be `auto` in both locales — see plan note).
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier } from './support/dossier-drawer-fixture'

const FIXTURE_DOSSIER_ID = process.env.E2E_DOSSIER_FIXTURE_ID ?? 'seed-country-sa'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — RTL slide direction (D-13 case 5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('AR locale — drawer renders at physical LEFT edge (inline-end maps to left under RTL)', async ({
    page,
  }) => {
    await loginForListPages(page, 'ar')
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })
    await page.evaluate(() => document.fonts.ready)

    const styles = await page.locator('.drawer').evaluate((el) => {
      const computed = getComputedStyle(el as HTMLElement)
      const rect = el.getBoundingClientRect()
      return {
        insetInlineEnd: computed.insetInlineEnd,
        rectLeft: rect.left,
        rectRight: rect.right,
        viewportWidth: window.innerWidth,
        dir: computed.direction,
      }
    })

    expect(styles.dir).toBe('rtl')
    expect(styles.insetInlineEnd).toBe('0px')
    expect(Math.round(styles.rectLeft)).toBe(0)
  })

  test('EN locale — drawer renders at physical RIGHT edge (sanity for inverse)', async ({
    page,
  }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })
    await page.evaluate(() => document.fonts.ready)

    const styles = await page.locator('.drawer').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const computed = getComputedStyle(el as HTMLElement)
      return {
        rectRight: rect.right,
        viewportWidth: window.innerWidth,
        dir: computed.direction,
      }
    })

    expect(styles.dir).toBe('ltr')
    expect(Math.round(styles.rectRight)).toBe(Math.round(styles.viewportWidth))
  })
})
