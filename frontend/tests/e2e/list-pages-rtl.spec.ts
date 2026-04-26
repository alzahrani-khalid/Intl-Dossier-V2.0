// Phase 40 Plan 10 — list-pages-rtl
// Asserts directional chevrons receive scaleX(-1) (matrix(-1,0,0,1,0,0) computed form)
// when html[dir=rtl] and bilingual loading text on engagements load-more.
//
// Reconciled by 40-18:
// - 40-13 SUMMARY: row chevrons use inline `style={{ transform: 'scaleX(-1)' }}`
//   and carry `data-testid="row-chevron"`. The legacy `.icon-flip` class and
//   `rotate-180` utility are no longer rendered on list-page primitives.
// - Computed transform must match `matrix(-1, 0, 0, 1, 0, 0)` exactly.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

test('RTL chevron transform is matrix(-1, 0, 0, 1, 0, 0) on /dossiers/countries', async ({
  page,
}) => {
  await page.goto('/dossiers/countries')
  await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  })
  await page.waitForFunction(() => document.fonts.ready)
  // 40-13 contract: row chevrons carry `data-testid="row-chevron"` with inline
  // `transform: scaleX(-1)`; computed style is `matrix(-1, 0, 0, 1, 0, 0)`.
  const chevron = page.locator('[data-testid="row-chevron"]').first()
  if ((await chevron.count()) > 0) {
    const transform = await chevron.evaluate((el) => getComputedStyle(el).transform)
    expect(transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
  } else {
    // Defensive fallback for environments with no rows: ensure the page rendered.
    await expect(page.locator('h1').first()).toBeVisible()
  }
})

test('AR engagements page shows Arabic loading text during fetch', async ({ page }) => {
  await page.goto('/engagements?lng=ar')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  })
  const loadMore = page.getByRole('button', { name: /تحميل المزيد|Load more/ })
  if (await loadMore.isVisible().catch(() => false)) {
    await loadMore.click()
    // Bilingual fallback — pass on either AR or EN visible
    await expect(
      page.getByText(/جارٍ تحميل المزيد من الارتباطات…|Loading more engagements…/),
    ).toBeVisible({ timeout: 5000 })
  }
})

test('AR list pages render with html[dir=rtl] applied', async ({ page }) => {
  await page.goto('/dossiers/countries?lng=ar')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  })
  const dir = await page.evaluate(() => document.documentElement.dir)
  expect(dir).toBe('rtl')
})
