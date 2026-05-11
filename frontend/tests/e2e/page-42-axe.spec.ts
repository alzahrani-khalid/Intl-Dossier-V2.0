// Phase 42-04 — axe-core WCAG AA gate scaffold (5 pages × LTR + AR).
//
// 10 scenarios total. `test.skip` until Wave 2 plan 42-11 un-skips after all
// 5 page reskins ship. Scoped to `.page` to avoid coupling Phase 42 gates
// to pre-existing shell-level violations.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  setupPhase42Test,
  gotoPhase42Page,
  switchToArabic,
  PHASE_42_ROUTES,
  type Phase42Route,
} from './support/phase-42-fixtures'

const PAGES: Array<[string, Phase42Route]> = [
  ['briefs', PHASE_42_ROUTES.briefs],
  ['after-actions', PHASE_42_ROUTES.afterActions],
  ['tasks', PHASE_42_ROUTES.tasks],
  ['activity', PHASE_42_ROUTES.activity],
  ['settings', PHASE_42_ROUTES.settings],
]

test.describe('Phase 42 — axe-core WCAG AA', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  for (const [name, route] of PAGES) {
    test(`${name} — LTR has zero serious/critical violations`, async ({ page }) => {
      await gotoPhase42Page(page, route)
      const results = await new AxeBuilder({ page })
        .include('.page')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(
        seriousOrCritical,
        `Found ${seriousOrCritical.length} serious/critical violations on ${name} (LTR)`,
      ).toEqual([])
    })

    test(`${name} — AR has zero serious/critical violations`, async ({ page }) => {
      await switchToArabic(page)
      await gotoPhase42Page(page, route)
      const results = await new AxeBuilder({ page })
        .include('.page')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(
        seriousOrCritical,
        `Found ${seriousOrCritical.length} serious/critical violations on ${name} (AR)`,
      ).toEqual([])
    })
  }
})
