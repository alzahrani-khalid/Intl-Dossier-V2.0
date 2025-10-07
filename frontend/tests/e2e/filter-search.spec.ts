import { test, expect } from '@playwright/test';

/**
 * E2E Test: Apply Filters and Search (T049)
 * Tests filtering and search functionality in dossiers hub
 *
 * Validates:
 * - Navigate to dossiers hub
 * - Select type filter → list updates
 * - Only matching types shown
 * - Enter search term → results filtered
 * - Multiple filters combine correctly
 * - Reset filters works
 * - URL params update with filters
 */

test.describe('Dossiers Filter and Search', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should filter dossiers by type', async ({ page }) => {
    // Step 1: Navigate to dossiers hub
    await page.goto('/dossiers');
    await expect(page).toHaveURL('/dossiers');

    // Step 2: Count initial dossiers
    const initialCount = await page.locator('[data-testid^="dossier-card-"]').count();
    expect(initialCount).toBeGreaterThan(0);

    // Step 3: Select "country" type filter
    await page.click('[data-testid="filter-type-country"]');
    await expect(page.locator('[data-testid="filter-type-country"]')).toBeChecked();

    // Step 4: Wait for list to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow debounce

    // Step 5: Assert URL updated with filter
    await expect(page).toHaveURL(/[?&]type=country/);

    // Step 6: Assert only country dossiers are shown
    const countryCards = await page.locator('[data-testid^="dossier-card-"]').count();
    expect(countryCards).toBeGreaterThan(0);
    expect(countryCards).toBeLessThanOrEqual(initialCount);

    // Step 7: Verify all visible cards have country type
    const typesBadges = page.locator('[data-testid="dossier-type-badge"]');
    const count = await typesBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(typesBadges.nth(i)).toContainText(/country/i);
    }
  });

  test('should filter dossiers by status', async ({ page }) => {
    await page.goto('/dossiers');

    // Select "active" status filter
    await page.click('[data-testid="filter-status-active"]');
    await expect(page.locator('[data-testid="filter-status-active"]')).toBeChecked();

    await page.waitForLoadState('networkidle');

    // Assert URL updated
    await expect(page).toHaveURL(/[?&]status=active/);

    // Verify all visible cards have active status
    const statusBadges = page.locator('[data-testid="dossier-status-badge"]');
    const count = await statusBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText(/active/i);
    }
  });

  test('should filter dossiers by sensitivity level', async ({ page }) => {
    await page.goto('/dossiers');

    // Select "high" sensitivity filter
    await page.click('[data-testid="filter-sensitivity-high"]');
    await expect(page.locator('[data-testid="filter-sensitivity-high"]')).toBeChecked();

    await page.waitForLoadState('networkidle');

    // Assert URL updated
    await expect(page).toHaveURL(/[?&]sensitivity=high/);

    // Verify all visible cards have high sensitivity
    const sensitivityBadges = page.locator('[data-testid="dossier-sensitivity-badge"]');
    const count = await sensitivityBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(sensitivityBadges.nth(i)).toContainText(/high/i);
    }
  });

  test('should search dossiers by name', async ({ page }) => {
    await page.goto('/dossiers');

    // Enter search term
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Saudi');

    // Wait for debounce and results
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Assert URL updated with search param
    await expect(page).toHaveURL(/[?&]search=Saudi/);

    // Assert results contain search term
    const dossierCards = page.locator('[data-testid^="dossier-card-"]');
    const count = await dossierCards.count();
    expect(count).toBeGreaterThan(0);

    // At least one card should contain "Saudi"
    const firstCard = dossierCards.first();
    await expect(firstCard).toContainText(/Saudi/i);
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/dossiers');

    // Apply multiple filters
    await page.click('[data-testid="filter-type-country"]');
    await page.click('[data-testid="filter-status-active"]');
    await page.click('[data-testid="filter-sensitivity-high"]');

    await page.waitForLoadState('networkidle');

    // Assert URL contains all filter params
    await expect(page).toHaveURL(/type=country/);
    await expect(page).toHaveURL(/status=active/);
    await expect(page).toHaveURL(/sensitivity=high/);

    // Assert results match all filters
    const cards = page.locator('[data-testid^="dossier-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no matches

    if (count > 0) {
      const firstCard = cards.first();
      await expect(firstCard.locator('[data-testid="dossier-type-badge"]')).toContainText(/country/i);
      await expect(firstCard.locator('[data-testid="dossier-status-badge"]')).toContainText(/active/i);
      await expect(firstCard.locator('[data-testid="dossier-sensitivity-badge"]')).toContainText(/high/i);
    }
  });

  test('should combine search with filters', async ({ page }) => {
    await page.goto('/dossiers');

    // Apply type filter
    await page.click('[data-testid="filter-type-country"]');

    // Enter search term
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Saudi');

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Assert URL contains both
    await expect(page).toHaveURL(/type=country/);
    await expect(page).toHaveURL(/search=Saudi/);

    // Assert results match both criteria
    const cards = page.locator('[data-testid^="dossier-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="dossier-type-badge"]')).toContainText(/country/i);
    await expect(firstCard).toContainText(/Saudi/i);
  });

  test('should reset all filters', async ({ page }) => {
    await page.goto('/dossiers');

    // Apply multiple filters and search
    await page.click('[data-testid="filter-type-country"]');
    await page.click('[data-testid="filter-status-active"]');
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Saudi');

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Count filtered results
    const filteredCount = await page.locator('[data-testid^="dossier-card-"]').count();

    // Click reset button
    await page.click('[data-testid="reset-filters-button"]');

    await page.waitForLoadState('networkidle');

    // Assert URL has no filter params
    await expect(page).toHaveURL(/^[^?]*$/); // No query params

    // Assert all filters are unchecked
    await expect(page.locator('[data-testid="filter-type-country"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="filter-status-active"]')).not.toBeChecked();

    // Assert search input is cleared
    await expect(searchInput).toHaveValue('');

    // Assert more dossiers are shown (unfiltered)
    const unfilteredCount = await page.locator('[data-testid^="dossier-card-"]').count();
    expect(unfilteredCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.goto('/dossiers');

    // Enter search term that will not match anything
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('XYZ_NONEXISTENT_DOSSIER_12345');

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Assert empty state is displayed
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText(/no.*dossiers.*found/i);

    // Assert "Clear filters" or "Reset" button is shown
    await expect(page.locator('[data-testid="reset-filters-button"]')).toBeVisible();
  });

  test('should persist filters in URL on page reload', async ({ page }) => {
    await page.goto('/dossiers');

    // Apply filters
    await page.click('[data-testid="filter-type-country"]');
    await page.click('[data-testid="filter-status-active"]');

    await page.waitForLoadState('networkidle');

    // Get current URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('type=country');
    expect(currentUrl).toContain('status=active');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert filters are still applied
    await expect(page.locator('[data-testid="filter-type-country"]')).toBeChecked();
    await expect(page.locator('[data-testid="filter-status-active"]')).toBeChecked();

    // Assert URL still has filters
    await expect(page).toHaveURL(/type=country/);
    await expect(page).toHaveURL(/status=active/);
  });

  test('should debounce search input', async ({ page }) => {
    await page.goto('/dossiers');

    // Track network requests
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/dossiers') && request.url().includes('search=')) {
        requestCount++;
      }
    });

    const searchInput = page.locator('[data-testid="search-input"]');

    // Type quickly
    await searchInput.fill('S');
    await page.waitForTimeout(100);
    await searchInput.fill('Sa');
    await page.waitForTimeout(100);
    await searchInput.fill('Sau');
    await page.waitForTimeout(100);
    await searchInput.fill('Saud');
    await page.waitForTimeout(100);
    await searchInput.fill('Saudi');

    // Wait for debounce to complete
    await page.waitForTimeout(1000);

    // Assert only one API request was made (debounced)
    expect(requestCount).toBeLessThanOrEqual(2); // Allow 1-2 requests due to timing
  });
});