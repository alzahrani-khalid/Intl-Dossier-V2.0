import { test, expect } from '@playwright/test';

test.describe('Standalone Positions Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should navigate to standalone positions library', async ({ page }) => {
    // Navigate to /positions
    await page.click('[data-testid="nav-positions"]');
    await page.waitForURL('/positions');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Positions Library');
  });

  test('should display all positions across dossiers', async ({ page }) => {
    await page.goto('/positions');

    // Wait for positions to load
    await page.waitForSelector('[data-testid="position-card"]');

    const positionCards = page.locator('[data-testid="position-card"]');
    const count = await positionCards.count();

    // Should have positions from multiple dossiers
    expect(count).toBeGreaterThan(0);

    // Verify dossier context shown
    const firstCard = positionCards.first();
    await expect(firstCard.locator('[data-testid="dossier-badge"]')).toBeVisible();
  });

  test('should enforce RLS (only accessible positions)', async ({ page }) => {
    await page.goto('/positions');

    // All displayed positions should be from accessible dossiers
    const positionCards = page.locator('[data-testid="position-card"]');
    const count = await positionCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const dossierBadge = positionCards.nth(i).locator('[data-testid="dossier-badge"]');
      await expect(dossierBadge).toBeVisible();
      // Badge text should not be "Unauthorized" or similar
      const badgeText = await dossierBadge.textContent();
      expect(badgeText).not.toContain('Unauthorized');
    }
  });

  test('should search positions globally', async ({ page }) => {
    await page.goto('/positions');

    const searchInput = page.locator('[data-testid="positions-search"]');
    await searchInput.fill('economic policy');

    // Wait for search results
    await page.waitForResponse((response) => response.url().includes('search='));

    // Verify filtered results
    const positionCards = page.locator('[data-testid="position-card"]');
    const firstTitle = await positionCards.first().locator('[data-testid="position-title"]').textContent();

    expect(firstTitle?.toLowerCase()).toMatch(/economic|policy/);
  });

  test('should filter by type', async ({ page }) => {
    await page.goto('/positions');

    // Open type filter
    await page.click('[data-testid="filter-type"]');
    await page.click('[data-value="policy_brief"]');

    // Wait for filtered results
    await page.waitForResponse((response) => response.url().includes('type=eq.policy_brief'));

    // Verify all results are policy briefs
    const typeBadges = page.locator('[data-testid="position-type"]');
    const count = await typeBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(typeBadges.nth(i)).toContainText('Policy Brief');
    }
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/positions');

    // Open status filter
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-value="published"]');

    // Wait for filtered results
    await page.waitForResponse((response) => response.url().includes('status=eq.published'));

    // Verify all results are published
    const statusBadges = page.locator('[data-testid="position-status"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('Published');
    }
  });

  test('should navigate to position detail', async ({ page }) => {
    await page.goto('/positions');

    await page.waitForSelector('[data-testid="position-card"]');

    // Click first position
    await page.locator('[data-testid="position-card"]').first().click();

    // Verify navigation to detail
    await page.waitForURL(/\/positions\/[^/]+$/);

    // Verify detail page loaded
    await expect(page.locator('[data-testid="position-detail"]')).toBeVisible();
  });

  test('should display related engagements in detail view', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Click position with engagements
    await page.locator('[data-testid="position-card"]').first().click();

    // Verify related engagements section
    const relatedEngagements = page.locator('[data-testid="related-engagements"]');
    await relatedEngagements.scrollIntoViewIfNeeded();
    await expect(relatedEngagements).toBeVisible();

    // Verify engagement cards
    const engagementCards = relatedEngagements.locator('[data-testid="engagement-card"]');
    if ((await engagementCards.count()) > 0) {
      await expect(engagementCards.first()).toBeVisible();
    }
  });

  test('should cross-navigate to engagement from position detail', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Navigate to position detail
    await page.locator('[data-testid="position-card"]').first().click();

    // Find and click related engagement
    const engagementCards = page.locator('[data-testid="related-engagements"] [data-testid="engagement-card"]');
    const count = await engagementCards.count();

    if (count > 0) {
      await engagementCards.first().click();

      // Verify navigation to engagement detail
      await page.waitForURL(/\/engagements\/[^/]+$/);

      // Verify positions section highlighted
      const positionsSection = page.locator('[data-testid="positions-section"]');
      await expect(positionsSection).toBeVisible();
    }
  });

  test('should display usage analytics in position detail', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Navigate to position detail
    await page.locator('[data-testid="position-card"]').first().click();

    // Verify analytics card
    const analyticsCard = page.locator('[data-testid="position-analytics-card"]');
    await analyticsCard.scrollIntoViewIfNeeded();
    await expect(analyticsCard).toBeVisible();

    // Verify metrics displayed
    await expect(analyticsCard).toContainText('Views');
    await expect(analyticsCard).toContainText('Attachments');
    await expect(analyticsCard).toContainText('Briefing Packs');
  });

  test('should display popularity rank', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Navigate to position detail
    await page.locator('[data-testid="position-card"]').first().click();

    // Verify popularity rank badge
    const popularityBadge = page.locator('[data-testid="popularity-rank"]');
    if (await popularityBadge.isVisible()) {
      const rankText = await popularityBadge.textContent();
      expect(rankText).toMatch(/Rank|#\d+/);
    }
  });

  test('should sort positions by different criteria', async ({ page }) => {
    await page.goto('/positions');

    // Open sort dropdown
    await page.click('[data-testid="sort-select"]');

    // Select sort by recent
    await page.click('[data-value="recent"]');

    // Wait for re-sorted results
    await page.waitForResponse((response) => response.url().includes('order='));

    // Verify results updated
    await page.waitForTimeout(500);
    const firstCard = page.locator('[data-testid="position-card"]').first();
    await expect(firstCard).toBeVisible();
  });

  test('should implement virtual scrolling for performance', async ({ page }) => {
    await page.goto('/positions');

    await page.waitForSelector('[data-testid="position-card"]');

    // Verify virtual scroll container
    const scrollContainer = page.locator('[data-testid="virtual-scroll-container"]');
    if (await scrollContainer.isVisible()) {
      // Scroll down
      await scrollContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Wait for new items to render
      await page.waitForTimeout(500);

      // Verify more positions loaded
      const positionCards = page.locator('[data-testid="position-card"]');
      expect(await positionCards.count()).toBeGreaterThan(10);
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/positions');

    // Verify breadcrumb
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Positions');
  });

  test('should handle empty positions library', async ({ page }) => {
    // Mock empty response
    await page.route('**/positions*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/positions');

    // Verify empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No positions found');
  });
});
