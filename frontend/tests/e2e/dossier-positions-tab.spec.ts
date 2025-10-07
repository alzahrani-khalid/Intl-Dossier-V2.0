import { test, expect } from '@playwright/test';

test.describe('Dossier Positions Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should display positions tab in dossier detail', async ({ page }) => {
    // Navigate to dossier detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.waitForURL(/\/dossiers\/[^/]+$/);

    // Verify positions tab exists
    const positionsTab = page.locator('[data-testid="positions-tab"]');
    await expect(positionsTab).toBeVisible();

    // Click positions tab
    await positionsTab.click();

    // Verify positions list is displayed
    const positionsList = page.locator('[data-testid="positions-list"]');
    await expect(positionsList).toBeVisible();
  });

  test('should filter positions by current dossier', async ({ page }) => {
    // Navigate to dossier detail
    await page.click('[data-testid="dossier-card"]:first-child');

    // Get dossier ID from URL
    const url = page.url();
    const dossierId = url.split('/').pop();

    // Click positions tab
    await page.click('[data-testid="positions-tab"]');

    // Wait for positions to load
    await page.waitForResponse(
      (response) =>
        response.url().includes('/positions') &&
        response.url().includes(`dossier_id=eq.${dossierId}`)
    );

    // Verify positions are from current dossier
    const positionCards = page.locator('[data-testid="position-card"]');
    await expect(positionCards).not.toHaveCount(0);

    // Verify each position has dossier context
    const firstCard = positionCards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should display search and filter controls', async ({ page }) => {
    // Navigate to dossier with positions
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="positions-tab"]');

    // Verify search bar
    const searchInput = page.locator('[data-testid="positions-search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder');

    // Verify filter controls
    await expect(page.locator('[data-testid="filter-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-date-range"]')).toBeVisible();
  });

  test('should search positions with <1s response time', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="positions-tab"]');

    const searchInput = page.locator('[data-testid="positions-search"]');

    // Start timing
    const startTime = Date.now();

    // Type search query
    await searchInput.fill('policy');

    // Wait for search results
    await page.waitForResponse((response) =>
      response.url().includes('/positions') && response.status() === 200
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Verify response time < 1000ms
    expect(responseTime).toBeLessThan(1000);

    // Verify filtered results displayed
    await expect(page.locator('[data-testid="position-card"]')).not.toHaveCount(0);
  });

  test('should filter positions by type', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="positions-tab"]');

    // Open type filter
    await page.click('[data-testid="filter-type"]');

    // Select policy_brief type
    await page.click('[data-value="policy_brief"]');

    // Wait for filtered results
    await page.waitForResponse((response) =>
      response.url().includes('type=eq.policy_brief')
    );

    // Verify results filtered
    const positionCards = page.locator('[data-testid="position-card"]');
    const count = await positionCards.count();

    for (let i = 0; i < count; i++) {
      const typeBadge = positionCards.nth(i).locator('[data-testid="position-type"]');
      await expect(typeBadge).toContainText('Policy Brief');
    }
  });

  test('should filter positions by status', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="positions-tab"]');

    // Open status filter
    await page.click('[data-testid="filter-status"]');

    // Select published status
    await page.click('[data-value="published"]');

    // Wait for filtered results
    await page.waitForResponse((response) =>
      response.url().includes('status=eq.published')
    );

    // Verify status badges show 'Published'
    const statusBadges = page.locator('[data-testid="position-status"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('Published');
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="positions-tab"]');

    // Verify breadcrumb
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Verify breadcrumb structure
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Dossiers');
    await expect(breadcrumb).toContainText('Positions');
  });

  test('should handle empty positions list', async ({ page }) => {
    // Navigate to dossier with no positions
    // (Assumes test data has at least one empty dossier)
    const dossierCards = page.locator('[data-testid="dossier-card"]');
    const count = await dossierCards.count();

    // Try to find a dossier with no positions
    for (let i = 0; i < count; i++) {
      await dossierCards.nth(i).click();
      await page.click('[data-testid="positions-tab"]');

      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.isVisible()) {
        // Verify empty state message
        await expect(emptyState).toContainText('No positions found');
        await expect(emptyState).toContainText('Create your first position');
        break;
      }

      // Go back if this dossier has positions
      await page.goto('/dossiers');
    }
  });
});
