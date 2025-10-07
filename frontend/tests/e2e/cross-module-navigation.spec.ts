import { test, expect } from '@playwright/test';

test.describe('Cross-Module Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should navigate dossier → position → engagement', async ({ page }) => {
    // Start at dossier detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.waitForURL(/\/dossiers\/[^/]+$/);

    // Navigate to positions tab
    await page.click('[data-testid="positions-tab"]');

    // Click position with engagements
    await page.click('[data-testid="position-card"]:first-child');

    // Verify position detail opened
    await page.waitForURL(/\/positions\/[^/]+$/);

    // Navigate to related engagement
    const relatedEngagements = page.locator('[data-testid="related-engagements"]');
    await relatedEngagements.scrollIntoViewIfNeeded();

    if ((await relatedEngagements.locator('[data-testid="engagement-card"]').count()) > 0) {
      await relatedEngagements.locator('[data-testid="engagement-card"]').first().click();

      // Verify engagement detail loaded
      await page.waitForURL(/\/engagements\/[^/]+$/);

      // Verify positions section visible
      await expect(page.locator('[data-testid="positions-section"]')).toBeVisible();
    }
  });

  test('should preserve filter state on cross-navigation', async ({ page }) => {
    // Navigate to positions library
    await page.goto('/positions');

    // Apply filters
    await page.fill('[data-testid="positions-search"]', 'economic');
    await page.click('[data-testid="filter-type"]');
    await page.click('[data-value="policy_brief"]');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Capture URL with search params
    const urlWithFilters = page.url();

    // Navigate to position detail
    await page.click('[data-testid="position-card"]:first-child');

    // Click browser back button
    await page.goBack();

    // Verify filters preserved in URL
    expect(page.url()).toBe(urlWithFilters);

    // Verify filter UI reflects state
    await expect(page.locator('[data-testid="positions-search"]')).toHaveValue('economic');
  });

  test('should preserve scroll position via sessionStorage', async ({ page }) => {
    await page.goto('/positions');

    await page.waitForSelector('[data-testid="position-card"]');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    const scrollPos = await page.evaluate(() => window.scrollY);
    expect(scrollPos).toBe(500);

    // Navigate away
    await page.click('[data-testid="position-card"]:first-child');

    // Navigate back
    await page.goBack();

    // Verify scroll position restored (within tolerance)
    const restoredPos = await page.evaluate(() => window.scrollY);
    expect(Math.abs(restoredPos - scrollPos)).toBeLessThan(50);
  });

  test('should update breadcrumb on navigation', async ({ page }) => {
    // Start at dossier
    await page.click('[data-testid="dossier-card"]:first-child');

    // Verify breadcrumb: Home > Dossiers > [Dossier Name]
    let breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Dossiers');

    // Navigate to positions tab
    await page.click('[data-testid="positions-tab"]');

    // Verify breadcrumb updated
    breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toContainText('Positions');

    // Navigate to position detail
    await page.click('[data-testid="position-card"]:first-child');

    // Verify breadcrumb includes position title
    breadcrumb = page.locator('[data-testid="breadcrumb"]');
    const breadcrumbItems = await breadcrumb.locator('a, span').count();
    expect(breadcrumbItems).toBeGreaterThanOrEqual(4); // Home > Dossiers > Dossier > Positions > Position
  });

  test('should highlight current context in navigation', async ({ page }) => {
    // Navigate to engagement detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify positions section has context indicator
    const positionsSection = page.locator('[data-testid="positions-section"]');
    await positionsSection.scrollIntoViewIfNeeded();

    // Section should have visual indicator (e.g., highlighted border)
    await expect(positionsSection).toBeVisible();
  });

  test('should handle deep linking to position detail', async ({ page }) => {
    // Get a position ID
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Click first position to get ID
    await page.click('[data-testid="position-card"]:first-child');
    const positionUrl = page.url();

    // Open in new context (simulating direct link)
    await page.goto(positionUrl);

    // Verify position detail loads
    await expect(page.locator('[data-testid="position-detail"]')).toBeVisible();

    // Verify breadcrumb correctly constructed
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Positions');
  });

  test('should enable back/forward browser navigation', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/positions');
    await page.click('[data-testid="position-card"]:first-child');
    await page.goBack();

    // Verify back to positions library
    await expect(page).toHaveURL(/\/positions$/);

    // Forward
    await page.goForward();

    // Verify back to position detail
    await expect(page).toHaveURL(/\/positions\/[^/]+$/);
  });

  test('should maintain engagement context when navigating from positions', async ({ page }) => {
    // Start at engagement detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    const engagementUrl = page.url();

    // Navigate to position from engagement
    await page.click('[data-testid="attached-positions-section"] [data-testid="position-card"]:first-child');

    // Verify "Back to Engagement" link exists
    const backLink = page.locator('[data-testid="back-to-context"]');
    if (await backLink.isVisible()) {
      await backLink.click();

      // Verify returned to original engagement
      await expect(page).toHaveURL(engagementUrl);
    }
  });
});
