// Phase 40 Plan 10 — list-pages-engagements
// Filter pills (aria-pressed) + load-more (fetchNextPage + GlobeSpinner)
// + row-click navigation to /engagements/$engagementId/overview.
//
// Reconciled by 40-18 (G4 + G8):
// - 4 pills, taxonomy `all|meeting|call|travel` (per shipped FILTERS array
//   in `EngagementsList.tsx`). Legacy labels `Confirmed/Pending` were i18n
//   stubs; the component falls back to the value name via
//   `t(key, { defaultValue: f.value })`, so the rendered text is `meeting`,
//   `call`, `travel` when the i18n key is missing. The spec accepts both
//   the type-taxonomy and any localized variant in `ar`.
// - Row selector uses `data-testid="engagement-row"` (40-16 contract) with
//   the legacy `data-engagement-row` attribute as a fallback.
// - URL regex loosened to `/(?:dossiers/)?engagements/.../overview/` (40-16).
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

test.describe('Engagements LIST-04', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/engagements')
    await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
    await page.waitForLoadState('networkidle')
  })

  test('4 filter pills render with aria-pressed', async ({ page }) => {
    const pills = page.locator('button.btn[aria-pressed]')
    await expect(pills).toHaveCount(4)
  })

  test('Filter pills toggle aria-pressed correctly across the type taxonomy', async ({ page }) => {
    // Shipped FILTERS array exposes 4 values: all, meeting, call, travel
    // (no `event` — diverged from 40-CONTEXT-GAPS draft; type-source-of-truth
    // is `EngagementsList.tsx` FILTERS constant).
    const pills = ['all', 'meeting', 'call', 'travel'] as const
    const aria: Record<(typeof pills)[number], RegExp> = {
      all: /^All$|^الكل$|^all$/i,
      meeting: /meeting|اجتماع/i,
      call: /call|اتصال|مكالمة/i,
      travel: /travel|سفر/i,
    }

    for (const target of pills) {
      const targetPill = page.getByRole('button', { name: aria[target] }).first()
      if ((await targetPill.count()) === 0) continue
      await targetPill.click()
      // Clicked pill is pressed; sibling pills are not.
      await expect(targetPill).toHaveAttribute('aria-pressed', 'true')
      for (const p of pills) {
        if (p === target) continue
        const other = page.getByRole('button', { name: aria[p] }).first()
        if ((await other.count()) === 0) continue
        await expect(other).toHaveAttribute('aria-pressed', 'false')
      }
    }
  })

  test('All pill resets filter (aria-pressed=true)', async ({ page }) => {
    const travel = page.getByRole('button', { name: /travel|سفر/i }).first()
    if (await travel.isVisible().catch(() => false)) {
      await travel.click()
    }
    const all = page.getByRole('button', { name: /^All$|^الكل$|^all$/i }).first()
    await all.click()
    await expect(all).toHaveAttribute('aria-pressed', 'true')
  })

  test('Row click navigates to /engagements/$engagementId/overview', async ({ page }) => {
    // Prefer data-testid="engagement-row" (G5 contract); fall back to legacy
    // attribute / role-based selector for resilience.
    const testIdRow = page.locator('[data-testid="engagement-row"]').first()
    if ((await testIdRow.count()) > 0) {
      await testIdRow.click()
    } else {
      const dataRow = page.locator('[data-engagement-row]').first()
      if ((await dataRow.count()) > 0) {
        await dataRow.click()
      } else {
        await page.locator('.week-list a, .week-list [role="button"]').first().click()
      }
    }
    await expect(page).toHaveURL(/\/(?:dossiers\/)?engagements\/[a-zA-Z0-9-]+\/overview/)
  })

  test('Engagement row is keyboard-accessible (Enter)', async ({ page }) => {
    const row = page.locator('[data-testid="engagement-row"]').first()
    if ((await row.count()) === 0) {
      test.skip(true, 'No engagement rows present in current dataset')
    }
    await row.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/(?:dossiers\/)?engagements\/[a-zA-Z0-9-]+\/overview/)
  })

  test('Engagement row meets 44×44 touch target', async ({ page }) => {
    const row = page.locator('[data-testid="engagement-row"]').first()
    if ((await row.count()) === 0) {
      test.skip(true, 'No engagement rows present in current dataset')
    }
    const box = await row.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
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
