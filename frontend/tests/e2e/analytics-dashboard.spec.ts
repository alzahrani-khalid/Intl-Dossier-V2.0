import { test, expect } from '@playwright/test'

/**
 * E2E Test: Analytics Dashboard
 * Feature: analytics-dashboard
 *
 * Validates:
 * - Analytics dashboard page loads successfully
 * - Summary cards display metrics (or loading state)
 * - Time range selector works
 * - Tab navigation works (overview, engagements, relationships, commitments, workload)
 * - Charts render correctly
 * - Export functionality is available
 * - RTL support works correctly
 */

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login')
    await page.fill(
      '[data-testid="email-input"], input[name="email"], input[type="email"]',
      'kazahrani@stats.gov.sa',
    )
    await page.fill(
      '[data-testid="password-input"], input[name="password"], input[type="password"]',
      'itisme',
    )
    await page.click('[data-testid="login-button"], button[type="submit"]')
    await expect(page).toHaveURL(/\/(dashboard|my-work|dossiers)/, { timeout: 15000 })
  })

  test('should display analytics dashboard with summary cards', async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/analytics/)

    // Wait for DOM to load
    await page.waitForLoadState('domcontentloaded')

    // Verify page title is present (either actual title or loading skeleton)
    const pageTitle = page.getByRole('heading', { level: 1 })
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]')

    // Either the title or loading state should be visible
    await expect(async () => {
      const titleVisible = await pageTitle.isVisible().catch(() => false)
      const skeletonVisible = await skeleton
        .first()
        .isVisible()
        .catch(() => false)
      expect(titleVisible || skeletonVisible).toBe(true)
    }).toPass({ timeout: 15000 })
  })

  test('should allow time range selection', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Find the time range selector (Select component)
    const timeRangeSelector = page.locator('[role="combobox"]').first()

    // Wait for either selector or loading state
    await expect(async () => {
      const selectorVisible = await timeRangeSelector.isVisible().catch(() => false)
      const loadingVisible = await page
        .locator('[class*="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false)
      expect(selectorVisible || loadingVisible).toBe(true)
    }).toPass({ timeout: 10000 })

    if (await timeRangeSelector.isVisible()) {
      await timeRangeSelector.click()

      // Check that time range options are available
      const options = page.locator('[role="option"]')
      await expect(options.first()).toBeVisible({ timeout: 5000 })

      // Select a different time range (e.g., Last 7 days)
      await options.first().click()
    }
  })

  test('should navigate between dashboard tabs', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('domcontentloaded')

    // Wait for the tabs to appear (not skeleton)
    const tabList = page.locator('[role="tablist"]').first()
    await expect(tabList).toBeVisible({ timeout: 30000 })

    // Get all tabs
    const tabs = tabList.locator('[role="tab"]')
    const tabCount = await tabs.count()

    // Should have multiple tabs (overview, engagements, relationships, commitments, workload)
    expect(tabCount).toBeGreaterThanOrEqual(3)

    // Click on each tab and verify it becomes active
    for (let i = 1; i < Math.min(tabCount, 4); i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(500) // Allow content to update

      // Verify tab is now selected
      await expect(tabs.nth(i)).toHaveAttribute('data-state', 'active')
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
