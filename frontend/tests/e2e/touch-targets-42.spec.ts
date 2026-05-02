// Phase 42-04 — touch-targets gate scaffold (5 pages, ≥44×44 boundingBox).
//
// `test.skip` until Wave 2 plan 42-11 un-skips after all 5 page reskins
// ship. Samples first 5 hits per selector to keep runtime bounded
// (Phase 40 list-pages-touch-targets precedent).
import { test, expect } from '@playwright/test'
import {
  setupPhase42Test,
  gotoPhase42Page,
  PHASE_42_ROUTES,
  type Phase42Route,
} from './support/phase-42-fixtures'

const PAGES_AND_SELECTORS: Array<[string, Phase42Route, string]> = [
  ['briefs', PHASE_42_ROUTES.briefs, '[data-testid="brief-card"]'],
  ['after-actions', PHASE_42_ROUTES.afterActions, 'table.tbl tbody tr'],
  ['tasks', PHASE_42_ROUTES.tasks, 'button.task-box'],
  ['activity', PHASE_42_ROUTES.activity, 'ul.act-list li.act-row'],
  ['settings', PHASE_42_ROUTES.settings, 'button.settings-nav'],
]

test.describe('Phase 42 — touch targets ≥ 44×44', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 375, height: 800 })
  })

  for (const [name, route, selector] of PAGES_AND_SELECTORS) {
    test.skip(`${name} — interactive elements ≥ 44 in min dimension`, async ({ page }) => {
      await gotoPhase42Page(page, route)
      const handles = await page.locator(selector).all()
      expect(handles.length, `No matches for ${selector}`).toBeGreaterThan(0)
      for (const h of handles.slice(0, 5)) {
        const box = await h.boundingBox()
        if (!box) continue
        expect(
          Math.min(box.height, box.width),
          `${name} ${selector} below 44px`,
        ).toBeGreaterThanOrEqual(44)
      }
    })
  }
})
