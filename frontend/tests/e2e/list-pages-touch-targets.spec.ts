// Phase 40 Plan 10 — list-pages-touch-targets
// Asserts every interactive element bounding box ≥ 44×44 px on key list pages.
// Samples first 5 hits per selector to keep runtime bounded.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

const PAGES_AND_SELECTORS: Array<[string, string]> = [
  ['/dossiers/countries', 'table.tbl tbody tr, .md\\:hidden a, .md\\:hidden button'],
  ['/dossiers/forums', 'li.forum-row, [data-forum-row]'],
  ['/persons', 'a[href^="/persons/"]'],
  ['/dossiers/topics', 'a[href^="/dossiers/topics/"], li.topic-row'],
  ['/dossiers/working-groups', 'a[href^="/dossiers/working-groups/"], li.wg-row'],
  ['/engagements', 'button.btn[aria-pressed]'],
]


test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

for (const [route, selector] of PAGES_AND_SELECTORS) {
  test(`${route} interactive elements ≥ 44×44`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    const handles = await page.locator(selector).all()
    const sample = handles.slice(0, 5)
    for (const h of sample) {
      const box = await h.boundingBox()
      if (box) {
        expect(box.width, `width on ${route}`).toBeGreaterThanOrEqual(44)
        expect(box.height, `height on ${route}`).toBeGreaterThanOrEqual(44)
      }
    }
  })
}
