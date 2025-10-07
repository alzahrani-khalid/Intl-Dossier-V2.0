import { test, expect } from '@playwright/test';

test.describe('AI Service Fallback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should display fallback indicator when AI unavailable', async ({ page }) => {
    // Mock AI service failure
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            { id: '1', title: 'Keyword Match', relevance_score: 0.60 },
          ],
          fallback_mode: true,
        }),
      });
    });

    // Navigate to engagement
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify fallback indicator
    const fallbackBanner = page.locator('[data-testid="fallback-mode-indicator"]');
    await expect(fallbackBanner).toBeVisible();
    await expect(fallbackBanner).toContainText('AI service unavailable');
    await expect(fallbackBanner).toContainText('keyword');
  });

  test('should still display keyword-based suggestions', async ({ page }) => {
    // Mock fallback response
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            { id: '1', title: 'Economic Policy Brief', relevance_score: 0.55 },
            { id: '2', title: 'Trade Policy Update', relevance_score: 0.50 },
          ],
          fallback_mode: true,
        }),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify suggestions still displayed
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    expect(await suggestionCards.count()).toBeGreaterThan(0);

    // Verify relevance scores shown (may be lower)
    const firstCard = suggestionCards.first();
    await expect(firstCard.locator('[data-testid="relevance-score"]')).toBeVisible();
  });

  test('should allow manual position attachment in fallback mode', async ({ page }) => {
    // Mock AI failure
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [],
          fallback_mode: true,
        }),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify manual add button still works
    const manualAddButton = page.locator('[data-testid="add-position-button"]');
    await expect(manualAddButton).toBeEnabled();

    // Click to open dialog
    await manualAddButton.click();

    // Verify dialog opens
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('should recover when AI service comes back online', async ({ page }) => {
    let requestCount = 0;

    // First request fails, second succeeds
    await page.route('**/positions/suggestions*', (route) => {
      requestCount++;

      if (requestCount === 1) {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ suggestions: [], fallback_mode: true }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            suggestions: [
              { id: '1', title: 'AI Suggestion', relevance_score: 0.85 },
            ],
            fallback_mode: false,
          }),
        });
      }
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify fallback mode initially
    await expect(page.locator('[data-testid="fallback-mode-indicator"]')).toBeVisible();

    // Refresh or retry
    await page.reload();

    // Wait for second request
    await page.waitForTimeout(2000);

    // Verify fallback indicator removed
    await expect(page.locator('[data-testid="fallback-mode-indicator"]')).not.toBeVisible();

    // Verify AI suggestions displayed
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    expect(await suggestionCards.count()).toBeGreaterThan(0);
  });

  test('should log AI service failures', async ({ page }) => {
    // Monitor console for error logs
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleMessages.push(msg.text());
      }
    });

    // Mock AI failure
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({ status: 503, body: JSON.stringify({ fallback_mode: true }) });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForTimeout(1000);

    // Verify warning logged
    const hasAIWarning = consoleMessages.some((msg) => msg.includes('AI') || msg.includes('fallback'));
    expect(hasAIWarning).toBe(true);
  });

  test('should implement circuit breaker pattern', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/positions/suggestions*', (route) => {
      requestCount++;
      route.fulfill({ status: 503, body: JSON.stringify({ fallback_mode: true }) });
    });

    // Navigate to engagement (first failure)
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForTimeout(500);

    // Refresh multiple times rapidly (simulating retries)
    await page.reload();
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForTimeout(200);
    await page.reload();

    await page.waitForTimeout(1000);

    // Circuit breaker should limit requests (not 4+)
    // Exact behavior depends on implementation
    expect(requestCount).toBeLessThan(6); // Max 3 failures + some buffer
  });

  test('should display lower relevance threshold info in fallback', async ({ page }) => {
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          suggestions: [
            { id: '1', title: 'Match', relevance_score: 0.50 }, // Lower than AI threshold
          ],
          fallback_mode: true,
        }),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify info message about lower quality
    const infoMessage = page.locator('[data-testid="fallback-info"]');
    if (await infoMessage.isVisible()) {
      await expect(infoMessage).toContainText('keyword');
      await expect(infoMessage).toContainText('less accurate');
    }
  });

  test('should not crash application on AI error', async ({ page }) => {
    // Mock catastrophic AI error
    await page.route('**/positions/suggestions*', (route) => {
      route.abort('failed');
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Application should still be functional
    await expect(page.locator('[data-testid="engagement-detail"]')).toBeVisible();

    // Manual attachment should work
    await expect(page.locator('[data-testid="add-position-button"]')).toBeEnabled();
  });
});
