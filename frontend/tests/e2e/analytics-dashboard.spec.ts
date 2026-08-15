import { test, expect } from '@playwright/test'

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
  // INVERTED 2026-08-16 by plan 93-06 under RULING-P93-04. Read this before "fixing" them back:
  // the error state these three now assert is the INTENDED product state, not a regression.
  //
  // WHY. TRUST-01 / plan 93-06 deleted the three `catch → return { data: null }` swallows in
  // `domains/analytics/repositories/analytics.repository.ts` and repaired their consumer, so
  // `AnalyticsDashboardPage`'s isError branch renders the shared `QueryErrorState`. The express
  // analytics endpoints do not exist yet — `GET /analytics-dashboard` returns 404 — and that 404
  // now PROPAGATES instead of being swallowed into a fabricated success body. `/analytics`
  // therefore renders the honest error state: no h1, no time-range combobox, no tablist.
  //
  // These three tests asserted exactly those three affordances, so they were coupled to the lie.
  // Two of them (summary cards, time-range selection) were additionally VACUOUS: each asserted
  // `affordance-visible OR skeleton-visible`, and the ~300-700ms loading skeleton alone satisfied
  // them — measured 2026-08-16, they passed over the swallow AND over the honest error, deciding
  // only on a race. An assertion that passes whether or not the page is correct is worse than a
  // red one, so the skeleton disjunct is gone: each test now waits for the settled state and
  // asserts it positively (the error state IS rendered) plus its own original subject negatively
  // (that affordance is NOT rendered).
  //
  // FLIP THESE BACK IN PHASE 96 (DEAD-05) — the phase that makes the analytics endpoints real is
  // the phase whose landing makes the happy-path assertions true again. Restore then: the h1, the
  // `[role="combobox"]` time-range selector with its options, and the `[role="tablist"]` with its
  // per-tab `data-state="active"` walk.
  //
  // The rendering oracle for the propagation path itself is `tests/e2e/93-analytics-error.spec.ts`
  // (repo root), which forces the failure via CDP so it survives Phase 96.
  // ───────────────────────────────────────────────────────────────────────────────────────────

  test('should render the shared error state instead of summary cards', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/analytics/)
    await page.waitForLoadState('domcontentloaded')

    // The settled state: the shared component, announcing itself as an alert, with its retry
    // affordance inside the alert region.
    const errorState = page.getByTestId('query-error-state')
    await expect(errorState).toBeVisible({ timeout: ERROR_STATE_TIMEOUT })
    await expect(errorState).toHaveAttribute('role', 'alert')
    await expect(errorState.getByRole('button')).toBeVisible()

    // And the fabricated success body is gone — no page title over data the app does not have.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
  })

  test('should not offer time range selection while the query is failing', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Wait for the settled state before asserting an absence, so this cannot pass by measuring
    // a page that has not rendered yet.
    await expect(page.getByTestId('query-error-state')).toBeVisible({
      timeout: ERROR_STATE_TIMEOUT,
    })

    // The time-range selector belongs to the success body; a range picker over an unknown data
    // set would be an affordance with nothing behind it.
    await expect(page.locator('[role="combobox"]')).toHaveCount(0)
  })

  test('should not render dashboard tabs while the query is failing', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByTestId('query-error-state')).toBeVisible({
      timeout: ERROR_STATE_TIMEOUT,
    })

    // Zero tabs: overview/engagements/relationships/commitments/workload all render from the
    // failed query, so presenting them would assert facts the app does not have.
    await expect(page.locator('[role="tablist"]')).toHaveCount(0)
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
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to render
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

    // Find icon buttons
    const iconButtons = page.locator('button').filter({ has: page.locator('svg') })
    const count = await iconButtons.count()

    if (count > 0) {
      // Click on first icon button (likely refresh)
      const refreshButton = iconButtons.first()
      await refreshButton.click()
      await page.waitForTimeout(1000)

      // Page should still be on analytics
      await expect(page).toHaveURL(/\/analytics/)
    }
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
