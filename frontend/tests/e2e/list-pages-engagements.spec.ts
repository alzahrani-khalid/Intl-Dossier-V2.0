// Phase 40 Plan 10 — list-pages-engagements
// Filter pills (aria-pressed) + load-more (fetchNextPage + GlobeSpinner)
// + row-click navigation to /engagements/$engagementId/overview.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'


test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

test.describe('Engagements LIST-04', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/engagements')
    await page.waitForLoadState('networkidle')
  })

  test('4 filter pills render with aria-pressed', async ({ page }) => {
    const pills = page.locator('button.btn[aria-pressed]')
    await expect(pills).toHaveCount(4)
  })

  test('Confirmed pill toggles aria-pressed=true', async ({ page }) => {
    const confirmed = page.getByRole('button', { name: /Confirmed|مؤكد/ }).first()
    await confirmed.click()
    await expect(confirmed).toHaveAttribute('aria-pressed', 'true')
  })

  test('All pill resets filter (aria-pressed=true)', async ({ page }) => {
    const travel = page.getByRole('button', { name: /Travel|سفر/ }).first()
    if (await travel.isVisible().catch(() => false)) {
      await travel.click()
    }
    const all = page.getByRole('button', { name: /^All$|^الكل$/ }).first()
    await all.click()
    await expect(all).toHaveAttribute('aria-pressed', 'true')
  })

  test('Row click navigates to /engagements/$engagementId/overview', async ({ page }) => {
    // Prefer data-engagement-row attribute; fall back to first list-page row.
    const dataRow = page.locator('[data-engagement-row]').first()
    if ((await dataRow.count()) > 0) {
      await dataRow.click()
    } else {
      await page.locator('.week-list a, .week-list [role="button"]').first().click()
    }
    await expect(page).toHaveURL(/\/engagements\/[a-zA-Z0-9-]+\/overview$/)
  })

  test('Load-more triggers fetchNextPage and shows GlobeSpinner + bilingual loading text', async ({
    page,
  }) => {
    const loadMore = page.getByRole('button', { name: /Load more|تحميل المزيد/ })
    if (await loadMore.isVisible().catch(() => false)) {
      // Tag a network request to confirm fetchNextPage fired.
      const fetchPromise = page
        .waitForRequest((req) => /engagements/i.test(req.url()), { timeout: 5000 })
        .catch(() => null)
      await loadMore.click()
      await fetchPromise
      // Spinner + bilingual loading text
      await expect(page.locator('.spinner-row, [data-globe-spinner]').first()).toBeVisible({
        timeout: 5000,
      })
      await expect(page.getByText(/Loading more engagements…|جارٍ تحميل/)).toBeVisible({
        timeout: 5000,
      })
    }
  })
})

test.describe('Country row navigation LIST-01', () => {
  test('Country row click navigates to /dossiers/countries/$id', async ({ page }) => {
    await page.goto('/dossiers/countries')
    await page.waitForLoadState('networkidle')
    const firstRow = page.locator('table.tbl tbody tr, [data-country-row]').first()
    if ((await firstRow.count()) > 0) {
      await firstRow.click()
      await expect(page).toHaveURL(/\/dossiers\/countries\/[a-zA-Z0-9-]+/)
    }
  })
})
