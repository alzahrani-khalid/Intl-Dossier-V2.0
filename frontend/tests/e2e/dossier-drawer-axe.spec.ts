// D-14 — axe-core zero serious/critical violations on drawer (EN + AR)
//
// Phase 41 plan 07 Task 3 — Wave 2 a11y gate.
// Scoped to `.drawer` to avoid coupling drawer regressions to pre-existing
// page-level violations.  Tags align with the rest of the suite:
// wcag2a, wcag2aa, wcag21a, wcag21aa.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginForListPages } from './support/list-pages-auth'
import {
  openDrawerForFixtureDossier,
  FIXTURE_DOSSIER_ID,
} from './support/dossier-drawer-fixture'

test.describe.configure({ retries: 1 })

test.describe('DossierDrawer — axe-core zero serious/critical (D-14)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
  })

  test('EN locale — zero violations', async ({ page }) => {
    await loginForListPages(page)
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })
    await page
      .locator('.drawer-body[data-loading="false"]')
      .waitFor({ state: 'attached', timeout: 10_000 })
      .catch(() => null)

    const results = await new AxeBuilder({ page })
      .include('.drawer')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(seriousOrCritical).toEqual([])
  })

  test('AR locale — zero violations', async ({ page }) => {
    await loginForListPages(page, 'ar')
    await openDrawerForFixtureDossier(page, {
      id: FIXTURE_DOSSIER_ID,
      type: 'country',
    })
    await page
      .locator('.drawer-body[data-loading="false"]')
      .waitFor({ state: 'attached', timeout: 10_000 })
      .catch(() => null)

    const results = await new AxeBuilder({ page })
      .include('.drawer')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(seriousOrCritical).toEqual([])
  })
})
