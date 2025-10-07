import { test, expect } from '@playwright/test';

test.describe('AI Position Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should display AI suggestions in engagement detail', async ({ page }) => {
    // Navigate to engagement detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');
    await page.waitForURL(/\/engagements\/[^/]+$/);

    // Scroll to positions section
    await page.locator('[data-testid="positions-section"]').scrollIntoViewIfNeeded();

    // Verify suggestions panel exists
    const suggestionsPanel = page.locator('[data-testid="position-suggestions-panel"]');
    await expect(suggestionsPanel).toBeVisible();

    // Verify suggestions title
    await expect(suggestionsPanel).toContainText('Suggested Positions');
  });

  test('should load suggestions within 2 seconds', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    const startTime = Date.now();

    // Wait for AI suggestions API call
    await page.waitForResponse(
      (response) =>
        response.url().includes('/positions/suggestions') && response.status() === 200,
      { timeout: 3000 }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Verify loading time < 2000ms
    expect(responseTime).toBeLessThan(2000);

    // Verify suggestions displayed
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    await expect(suggestionCards.first()).toBeVisible();
  });

  test('should display relevance scores and indicators', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Wait for suggestions to load
    await page.waitForSelector('[data-testid="suggestion-card"]');

    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const firstCard = suggestionCards.first();

    // Verify relevance score displayed
    const relevanceScore = firstCard.locator('[data-testid="relevance-score"]');
    await expect(relevanceScore).toBeVisible();

    // Verify relevance indicator (High/Medium/Low)
    const relevanceIndicator = firstCard.locator('[data-testid="relevance-indicator"]');
    await expect(relevanceIndicator).toBeVisible();

    const indicatorText = await relevanceIndicator.textContent();
    expect(['High', 'Medium', 'Low']).toContain(indicatorText?.trim());
  });

  test('should sort suggestions by relevance descending', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForSelector('[data-testid="suggestion-card"]');

    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const count = await suggestionCards.count();

    if (count > 1) {
      const scores: number[] = [];

      for (let i = 0; i < count; i++) {
        const scoreText = await suggestionCards
          .nth(i)
          .locator('[data-testid="relevance-score"]')
          .textContent();

        // Extract numeric score (e.g., "0.85" from "Relevance: 0.85")
        const scoreMatch = scoreText?.match(/\d+\.\d+/);
        if (scoreMatch) {
          scores.push(parseFloat(scoreMatch[0]));
        }
      }

      // Verify descending order
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    }
  });

  test('should attach position with one click', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForSelector('[data-testid="suggestion-card"]');

    const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first();
    const positionTitle = await firstSuggestion
      .locator('[data-testid="position-title"]')
      .textContent();

    // Click attach button
    const attachButton = firstSuggestion.locator('[data-testid="attach-button"]');
    await attachButton.click();

    // Wait for optimistic update
    await page.waitForTimeout(500);

    // Verify position moved to attached section
    const attachedSection = page.locator('[data-testid="attached-positions-section"]');
    await expect(attachedSection).toContainText(positionTitle || '');

    // Verify attach button changed state
    await expect(attachButton).toBeDisabled();
    await expect(attachButton).toContainText('Attached');
  });

  test('should display fallback indicator when AI unavailable', async ({ page, context }) => {
    // Mock AI service failure by intercepting request
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            {
              id: 'fallback-1',
              title: 'Keyword Match Position',
              relevance_score: 0.60,
            },
          ],
          fallback_mode: true,
        }),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify fallback mode indicator
    const fallbackIndicator = page.locator('[data-testid="fallback-mode-indicator"]');
    await expect(fallbackIndicator).toBeVisible();
    await expect(fallbackIndicator).toContainText('AI service unavailable');
    await expect(fallbackIndicator).toContainText('keyword matches');
  });

  test('should update suggestion action on acceptance', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForSelector('[data-testid="suggestion-card"]');

    const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first();

    // Click attach (accept suggestion)
    await firstSuggestion.locator('[data-testid="attach-button"]').click();

    // Wait for API call to update suggestion action
    await page.waitForResponse(
      (response) =>
        response.url().includes('/positions/suggestions') &&
        response.method() === 'POST' &&
        response.status() === 200
    );

    // Verify suggestion marked as accepted (visual feedback)
    await expect(firstSuggestion).toHaveAttribute('data-action', 'accepted');
  });

  test('should handle empty suggestions gracefully', async ({ page }) => {
    // Mock empty suggestions response
    await page.route('**/positions/suggestions*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [] }),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify empty state message
    const emptyState = page.locator('[data-testid="suggestions-empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No suggested positions found');

    // Verify manual add button still available
    const manualAddButton = page.locator('[data-testid="manual-add-position-button"]');
    await expect(manualAddButton).toBeVisible();
  });

  test('should display suggestion reasoning tooltip', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForSelector('[data-testid="suggestion-card"]');

    const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first();

    // Hover over reasoning icon
    const reasoningIcon = firstSuggestion.locator('[data-testid="reasoning-icon"]');
    await reasoningIcon.hover();

    // Verify tooltip appears
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Verify tooltip contains reasoning
    await expect(tooltip).not.toBeEmpty();
  });

  test('should filter suggestions by minimum relevance', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    await page.waitForSelector('[data-testid="suggestion-card"]');

    // All displayed suggestions should have relevance >= 0.70 (threshold)
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const count = await suggestionCards.count();

    for (let i = 0; i < count; i++) {
      const scoreText = await suggestionCards
        .nth(i)
        .locator('[data-testid="relevance-score"]')
        .textContent();

      const scoreMatch = scoreText?.match(/\d+\.\d+/);
      if (scoreMatch) {
        const score = parseFloat(scoreMatch[0]);
        expect(score).toBeGreaterThanOrEqual(0.7);
      }
    }
  });
});
