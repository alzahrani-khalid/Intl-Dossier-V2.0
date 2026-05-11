// Phase 40 Plan 10 — list-pages-touch-targets
// Asserts every interactive element bounding box ≥ 44×44 px on key list pages.
// Samples first 5 hits per selector to keep runtime bounded.
//
// Reconciled by 40-18:
// - Working-groups route uses underscored form (40-08 SUMMARY).
// - Engagement-row baseline now uses `data-testid="engagement-row"` (40-16),
//   complementing the filter-pill row.
// - DossierTable row baselines: `<button>` rows (mobile cards) and
//   `<tr>` rows (desktop table) both honor `min-h-11` per 40-14.
// - Filter-pill chips: `min-h-11 min-w-11` per FilterPill primitive.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

const PAGES_AND_SELECTORS: Array<[string, string]> = [
  ['/dossiers/countries', 'table.tbl tbody tr, .md\\:hidden a, .md\\:hidden button'],
  ['/dossiers/forums', 'li.forum-row, [data-forum-row]'],
  ['/persons', 'a[href^="/persons/"]'],
  ['/dossiers/topics', 'a[href^="/dossiers/topics/"], li.topic-row'],
  ['/dossiers/working_groups', 'a[href^="/dossiers/working_groups/"], li.wg-row'],
  ['/engagements', 'button.btn[aria-pressed]'],
  // 40-16: engagement rows (the row primitive itself, not the filter pills).
  ['/engagements', '[data-testid="engagement-row"]'],
]

test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

for (const [route, selector] of PAGES_AND_SELECTORS) {
  test(`${route} (${selector.slice(0, 40)}…) interactive elements ≥ 44×44`, async ({ page }) => {
    await page.goto(route)
    await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
    await page.waitForLoadState('networkidle')
    const handles = await page.locator(selector).all()
    const sample = handles.slice(0, 5)
    for (const h of sample) {
      const box = await h.boundingBox()
      if (box) {
        // Allow 2px tolerance for fractional sub-pixel measurements that
        // round below 44 in some browser builds.
        expect(box.height, `height on ${route} (${selector})`).toBeGreaterThanOrEqual(44)
        // Width can be the column width on full-row buttons; only assert
        // for compact controls (chips/pills/icons).
        if (selector.includes('aria-pressed') || selector.includes('btn')) {
          expect(box.width, `width on ${route} (${selector})`).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })
}
