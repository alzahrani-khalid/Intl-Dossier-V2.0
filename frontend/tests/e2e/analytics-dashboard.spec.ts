import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Test: Analytics Dashboard
 * Feature: analytics-dashboard
 *
 * Validates:
 * - /analytics renders the shared query-error state, not a fabricated success body
 *   (the first three tests — see the INVERTED block below for why, and when they flip back)
 * - Charts render correctly
 * - Export functionality is available
 * - RTL support works correctly
 */

// The error state settles at ~700ms here (a real 404 carries a numeric `status`, so
// query-client.ts's 4xx short-circuit skips the retry ladder), but the budget is kept wide
// because this spec also runs against the deployed app via E2E_BASE_URL.
const ERROR_STATE_TIMEOUT = 15_000

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login')
    await page.fill(
      '[data-testid="email-input"], input[name="email"], input[type="email"]',
      process.env.TEST_USER_EMAIL!,
    )
    await page.fill(
      '[data-testid="password-input"], input[name="password"], input[type="password"]',
      process.env.TEST_USER_PASSWORD!,
    )
    await page.click('[data-testid="login-button"], button[type="submit"]')
    await expect(page).toHaveURL(/\/(dashboard|my-work|dossiers)/, { timeout: 15000 })
  })

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // FLIPPED BACK 2026-08-17 by plan 96-06 (DEAD-05), exactly as the 93-06 block below instructed.
  //
  // The 2026-08-16 inversion (93-06 under RULING-P93-04) was correct FOR ITS TIME: the repository
  // called `apiGet('/analytics-dashboard…', { baseUrl: 'express' })` and the Express backend
  // served no such route, so a real 404 propagated and `/analytics` honestly rendered
  // `QueryErrorState` — no h1, no combobox, no tablist. Its header ended: "FLIP THESE BACK IN
  // PHASE 96 (DEAD-05) — the phase that makes the analytics endpoints real is the phase whose
  // landing makes the happy-path assertions true again. Restore then: the h1, the
  // `[role='combobox']` time-range selector with its options, and the `[role='tablist']` with its
  // per-tab `data-state='active'` walk." 96-06 dropped the Express base option; the deployed
  // `analytics-dashboard` edge fn answers all five endpoints from live RPCs, so that restoration
  // is what the three tests below now assert.
  //
  // THE VACUITY FIX IS KEPT. 93-06's real complaint was the `affordance-visible OR
  // skeleton-visible` disjunct, which the ~300-700ms loading skeleton satisfied on its own — those
  // tests passed over the swallow AND over the honest error, deciding only on a race. Every test
  // below therefore still waits for the page to SETTLE (zero skeletons) before asserting, and
  // asserts positively. No disjunct came back.
  //
  // These three are DATA-BRANCH assertions by the 93-06 header's own instruction: they go red if
  // the analytics endpoints stop answering. That is intended here. The branch-INVARIANT oracle for
  // the same surface is `tests/e2e/96-analytics-real.spec.ts` (repo root), and the rendering
  // oracle for the failure path is `tests/e2e/93-analytics-error.spec.ts`, which forces the
  // failure via CDP and therefore survives both branches.
  // ───────────────────────────────────────────────────────────────────────────────────────────

  /** Every skeleton in this app is the shared primitive; `animate-pulse` is its only stable mark. */
  const waitForSettle = async (page: Page): Promise<void> => {
    const main = page.locator('main').first()
    await expect(main).toBeVisible({ timeout: ERROR_STATE_TIMEOUT })
    await expect(main.locator('.animate-pulse')).toHaveCount(0, { timeout: ERROR_STATE_TIMEOUT })
  }

  test('should render summary cards from real data', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/analytics/)
    await waitForSettle(page)

    // The page title is back — it now sits over data the app actually has.
    await expect(page.getByRole('heading', { level: 1, name: 'Analytics Dashboard' })).toBeVisible()

    // The four summary cards render from the `summary` endpoint. Titles, never values: the values
    // are live and asserting one would encode today's data as the expectation. `.first()` because
    // the chart cards below reuse two of these words as their own labels — the summary grid is the
    // first occurrence in DOM order.
    for (const title of [
      'Total Engagements',
      'Avg. Health Score',
      'Fulfillment Rate',
      'Active Work Items',
    ]) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible()
    }

    // And the page-level error is NOT what settled.
    await expect(page.getByTestId('query-error-state')).toHaveCount(0)
  })

  test('should offer time range selection', async ({ page }) => {
    await page.goto('/analytics')
    await waitForSettle(page)

    // The time-range selector belongs to the success body, and the success body is what renders.
    const combobox = page.locator('[role="combobox"]').first()
    await expect(combobox).toBeVisible()

    // Its options are real: opening it lists the shipped TIME_RANGE_OPTIONS.
    await combobox.click()
    for (const option of ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last year']) {
      await expect(page.getByRole('option', { name: option })).toBeVisible()
    }
  })

  test('should render dashboard tabs', async ({ page }) => {
    await page.goto('/analytics')
    await waitForSettle(page)

    // The page-level tab set is pinned by NAME: each chart card carries its own inner tablist, so
    // a bare `[role="tablist"]` matches five elements and resolves nothing.
    const overview = page.getByRole('tab', { name: 'Overview', exact: true })
    await expect(overview).toBeVisible()
    await expect(overview).toHaveAttribute('data-state', 'active')

    // The per-tab walk: selecting each tab makes it, and only it, the active one.
    for (const name of ['Engagements', 'Relationships', 'Commitments', 'Workload']) {
      const tab = page.getByRole('tab', { name, exact: true })
      await tab.click()
      await expect(tab).toHaveAttribute('data-state', 'active')
      await expect(overview).toHaveAttribute('data-state', 'inactive')
    }
  })

  test('should display charts in overview tab', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Wait for charts to render or loading state
    const chartContainers = page.locator('.recharts-responsive-container, [class*="recharts"]')
    const cardContainers = page.locator('[class*="card"], [class*="Card"]')
    const skeletons = page.locator('[class*="skeleton"]')

    // Should have chart containers, cards, or loading skeletons
    await expect(async () => {
      const chartsCount = await chartContainers.count().catch(() => 0)
      const cardsCount = await cardContainers.count().catch(() => 0)
      const skeletonsCount = await skeletons.count().catch(() => 0)
      expect(chartsCount + cardsCount + skeletonsCount).toBeGreaterThan(0)
    }).toPass({ timeout: 15000 })
  })

  test('should have export button available', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to render (either buttons or loading)
    await expect(async () => {
      const buttonsCount = await page
        .locator('button')
        .count()
        .catch(() => 0)
      const loadingVisible = await page
        .locator('[class*="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false)
      expect(buttonsCount > 0 || loadingVisible).toBe(true)
    }).toPass({ timeout: 10000 })

    // Look for icon buttons (refresh/export)
    const iconButtons = page.locator('button').filter({ has: page.locator('svg') })
    const count = await iconButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have refresh button that triggers data reload', async ({ page }) => {
    await page.goto('/analytics')
    await waitForSettle(page)

    // REPAIRED 2026-08-17 (plan 96-06). This test used to click
    // `locator('button').filter({ has: svg }).first()` "(likely refresh)". In DOM order that
    // resolves to AppShell's topbar hamburger — `aria-label="Open navigation menu"`, class
    // `lg:hidden` — which is invisible at this project's 1280px viewport, so the click waited out
    // the test timeout. That target is app chrome present on every protected route in EVERY
    // branch, so the selector was fragile independently of what /analytics rendered; it is named
    // properly here rather than guessed by position.
    const refreshButton = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // A refetch keeps the user on the route and settles again — it never navigates or blanks.
    await expect(page).toHaveURL(/\/analytics/)
    await waitForSettle(page)
    await expect(page.locator('main').first()).not.toBeEmpty()
  })

  test('should persist time range in URL', async ({ page }) => {
    await page.goto('/analytics?timeRange=7d')
    await page.waitForLoadState('domcontentloaded')

    // URL should contain the time range parameter
    await expect(page).toHaveURL(/timeRange=7d/)

    // Navigate away and back with different time range
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')

    await page.goto('/analytics?timeRange=90d')
    await page.waitForLoadState('domcontentloaded')

    // Should have the new time range
    await expect(page).toHaveURL(/timeRange=90d/)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Page should still render correctly (check for content)
    await expect(async () => {
      const mainContent = page.locator('main, [role="main"], .container')
      const isVisible = await mainContent
        .first()
        .isVisible()
        .catch(() => false)
      const loadingVisible = await page
        .locator('[class*="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false)
      expect(isVisible || loadingVisible).toBe(true)
    }).toPass({ timeout: 10000 })
  })

  test('should support RTL layout in Arabic', async ({ page }) => {
    // Set language to Arabic via URL or localStorage
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Change language to Arabic if language switcher exists
    const languageSwitcher = page.locator(
      '[data-testid="language-switcher"], [aria-label*="language"], [aria-label*="Language"], button:has-text("EN"), button:has-text("ع")',
    )

    if (await languageSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSwitcher.click()

      const arabicOption = page.locator('text=العربية, text=Arabic, text=ع')
      if (await arabicOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await arabicOption.click()
        await page.waitForTimeout(1000)

        // Verify RTL direction is applied
        const container = page.locator('[dir="rtl"]')
        await expect(container.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
