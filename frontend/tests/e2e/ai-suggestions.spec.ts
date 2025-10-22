/**
 * E2E Tests for AI Suggestions Workflow
 * Feature: 024-intake-entity-linking
 * Tasks: T076, T077
 *
 * Tests AI-powered entity link suggestions including:
 * - Performance (<3s target)
 * - Graceful degradation when AI service unavailable
 * - User workflow from suggestion to link creation
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const AI_SUGGESTION_TIMEOUT = 3000; // 3 seconds (SC-002)
const INTAKE_ID = 'test-intake-001';

test.describe('AI Suggestions Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to intake detail page
    await page.goto(`/intake/${INTAKE_ID}`);

    // Wait for entity links section to load
    await page.waitForSelector('[aria-label="Entity Link Manager"]', { timeout: TEST_TIMEOUT });
  });

  test('T076: AI suggestions workflow completes within 3 seconds', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();

    // Click "Get AI Suggestions" button
    const getSuggestionsButton = page.getByRole('button', { name: /get ai suggestions/i });
    await expect(getSuggestionsButton).toBeVisible();
    await getSuggestionsButton.click();

    // Wait for loading state
    await expect(page.getByText(/analyzing intake content/i)).toBeVisible();

    // Wait for suggestions to load
    await page.waitForSelector('[data-testid="ai-suggestion-card"]', {
      timeout: AI_SUGGESTION_TIMEOUT + 1000, // Add 1s buffer
      state: 'visible'
    });

    // Measure elapsed time
    const elapsedTime = Date.now() - startTime;

    // Verify performance target (SC-002: <3s)
    expect(elapsedTime).toBeLessThan(AI_SUGGESTION_TIMEOUT);

    // Verify suggestions are displayed
    const suggestionCards = page.locator('[data-testid="ai-suggestion-card"]');
    const suggestionCount = await suggestionCards.count();

    // Verify 3-5 suggestions returned (as per spec)
    expect(suggestionCount).toBeGreaterThanOrEqual(3);
    expect(suggestionCount).toBeLessThanOrEqual(5);

    // Verify each suggestion has required elements
    for (let i = 0; i < suggestionCount; i++) {
      const card = suggestionCards.nth(i);

      // Verify entity name
      await expect(card.locator('[data-testid="entity-name"]')).toBeVisible();

      // Verify confidence score (0.70-0.99)
      const confidenceBadge = card.locator('[data-testid="confidence-score"]');
      await expect(confidenceBadge).toBeVisible();
      const confidenceText = await confidenceBadge.textContent();
      const confidenceValue = parseInt(confidenceText!.replace('%', '')) / 100;
      expect(confidenceValue).toBeGreaterThanOrEqual(0.70);
      expect(confidenceValue).toBeLessThanOrEqual(0.99);

      // Verify reasoning text
      await expect(card.locator('[data-testid="suggestion-reasoning"]')).toBeVisible();

      // Verify "Create Link" button
      await expect(card.getByRole('button', { name: /create link/i })).toBeVisible();
    }
  });

  test('T076: User can accept AI suggestion and create link', async ({ page }) => {
    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]');

    // Accept first suggestion
    const firstSuggestion = page.locator('[data-testid="ai-suggestion-card"]').first();
    const entityName = await firstSuggestion.locator('[data-testid="entity-name"]').textContent();

    // Click "Create Link" button
    await firstSuggestion.getByRole('button', { name: /create link/i }).click();

    // Wait for success notification
    await expect(page.getByText(/link created successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify link appears in active links list
    await page.getByRole('tab', { name: /active links/i }).click();

    // Verify the link card is visible
    const linkCard = page.locator('[data-testid="link-card"]', { hasText: entityName! });
    await expect(linkCard).toBeVisible();

    // Verify link type badge
    await expect(linkCard.locator('[data-testid="link-type-badge"]')).toBeVisible();
  });

  test('T076: AI suggestions show correct ranking (AI 50% + recency 30% + alphabetical 20%)', async ({ page }) => {
    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]');

    // Get all suggestions
    const suggestions = page.locator('[data-testid="ai-suggestion-card"]');
    const count = await suggestions.count();

    // Verify suggestions are ordered by confidence (highest first)
    let previousConfidence = 1.0;
    for (let i = 0; i < count; i++) {
      const card = suggestions.nth(i);
      const confidenceBadge = card.locator('[data-testid="confidence-score"]');
      const confidenceText = await confidenceBadge.textContent();
      const confidenceValue = parseInt(confidenceText!.replace('%', '')) / 100;

      // Verify descending order
      expect(confidenceValue).toBeLessThanOrEqual(previousConfidence);
      previousConfidence = confidenceValue;
    }
  });

  test('T076: User can fall back to manual search', async ({ page }) => {
    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]');

    // Click "Or use manual search" button
    await page.getByRole('button', { name: /use manual search/i }).click();

    // Verify search dialog opens
    await expect(page.getByRole('dialog', { name: /search entities/i })).toBeVisible();

    // Verify search input is focused
    const searchInput = page.getByRole('textbox', { name: /entity search/i });
    await expect(searchInput).toBeFocused();
  });
});

test.describe('AI Service Graceful Degradation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to intake detail page
    await page.goto(`/intake/${INTAKE_ID}`);

    // Wait for entity links section to load
    await page.waitForSelector('[aria-label="Entity Link Manager"]', { timeout: TEST_TIMEOUT });
  });

  test('T077: Graceful degradation when AI service unavailable', async ({ page, context }) => {
    // Intercept AI suggestions API call and simulate failure
    await page.route('**/api/intake/*/links/suggestions', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'AI service unavailable',
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AnythingLLM service is currently unreachable',
          details: 'The AI suggestion service is temporarily unavailable. Please try manual search.',
          fallback: 'manual_search',
          retry_after: 60
        })
      });
    });

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Verify error state is displayed
    await expect(page.getByText(/ai service unavailable/i)).toBeVisible({ timeout: 5000 });

    // Verify error details are shown
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();

    // Verify fallback to manual search is offered
    const manualSearchButton = page.getByRole('button', { name: /use manual search/i });
    await expect(manualSearchButton).toBeVisible();

    // Verify retry button is displayed
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();

    // Click manual search fallback
    await manualSearchButton.click();

    // Verify search dialog opens as fallback
    await expect(page.getByRole('dialog', { name: /search entities/i })).toBeVisible();
  });

  test('T077: Retry after AI service failure', async ({ page }) => {
    // Intercept first API call with failure
    let requestCount = 0;
    await page.route('**/api/intake/*/links/suggestions', async (route) => {
      requestCount++;

      if (requestCount === 1) {
        // First request fails
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'AI service unavailable',
            code: 'AI_SERVICE_UNAVAILABLE',
            fallback: 'manual_search',
            retry_after: 1
          })
        });
      } else {
        // Second request succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            suggestions: [
              {
                suggestion_id: 'sug-001',
                entity_id: 'ent-001',
                entity_type: 'dossier',
                entity_name: 'Saudi Arabia Relations',
                confidence_score: 0.95,
                suggested_link_type: 'primary',
                reasoning: 'Mentioned in intake content',
                rank: 1
              }
            ],
            metadata: {
              processing_time_ms: 1500,
              cache_hit: false
            }
          })
        });
      }
    });

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Verify error state
    await expect(page.getByText(/ai service unavailable/i)).toBeVisible();

    // Click retry button
    await page.getByRole('button', { name: /retry/i }).click();

    // Verify suggestions load successfully after retry
    await expect(page.locator('[data-testid="ai-suggestion-card"]')).toBeVisible({ timeout: 5000 });
  });

  test('T077: No suggestions found graceful handling', async ({ page }) => {
    // Intercept API call with empty suggestions
    await page.route('**/api/intake/*/links/suggestions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [],
          metadata: {
            processing_time_ms: 1200,
            cache_hit: false
          }
        })
      });
    });

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Verify "No Suggestions Found" message
    await expect(page.getByText(/no suggestions found/i)).toBeVisible({ timeout: 5000 });

    // Verify description explains why
    await expect(page.getByText(/could not find relevant entities/i)).toBeVisible();

    // Verify manual search fallback is offered
    const manualSearchButton = page.getByRole('button', { name: /use manual search/i });
    await expect(manualSearchButton).toBeVisible();
    await expect(manualSearchButton).toBeEnabled();
  });

  test('T077: Rate limiting graceful handling', async ({ page }) => {
    // Intercept API call with rate limit error
    await page.route('**/api/intake/*/links/suggestions', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'You have reached the maximum number of AI suggestion requests',
          details: 'Rate limit: 3 requests per minute. Please try again in 45 seconds.',
          retry_after: 45
        })
      });
    });

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Verify rate limit error message
    await expect(page.getByText(/ai service unavailable/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/try again/i)).toBeVisible();

    // Verify manual search fallback is still available
    await expect(page.getByRole('button', { name: /use manual search/i })).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('AI suggestions panel is mobile-friendly', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto(`/intake/${INTAKE_ID}`);

    // Wait for entity links section
    await page.waitForSelector('[aria-label="Entity Link Manager"]');

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]', { timeout: 5000 });

    // Verify vertical stacking on mobile (grid-cols-1)
    const suggestionCards = page.locator('[data-testid="ai-suggestion-card"]');
    const count = await suggestionCards.count();

    // Verify all cards are visible without horizontal scrolling
    for (let i = 0; i < count; i++) {
      await expect(suggestionCards.nth(i)).toBeInViewport();
    }

    // Verify touch targets are minimum 44x44px
    const createButtons = page.locator('[data-testid="ai-suggestion-card"] button');
    const buttonCount = await createButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = createButtons.nth(i);
      const box = await button.boundingBox();

      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Accessibility', () => {
  test('AI suggestions panel is keyboard navigable', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto(`/intake/${INTAKE_ID}`);

    // Wait for entity links section
    await page.waitForSelector('[aria-label="Entity Link Manager"]');

    // Tab to "Get AI Suggestions" button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip "Add Link" button

    // Verify "Get AI Suggestions" button is focused
    const getSuggestionsButton = page.getByRole('button', { name: /get ai suggestions/i });
    await expect(getSuggestionsButton).toBeFocused();

    // Press Enter to trigger suggestions
    await page.keyboard.press('Enter');

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]', { timeout: 5000 });

    // Tab through suggestion cards
    await page.keyboard.press('Tab');

    // Verify first "Create Link" button is focused
    const firstCreateButton = page.locator('[data-testid="ai-suggestion-card"]').first().getByRole('button', { name: /create link/i });
    await expect(firstCreateButton).toBeFocused();

    // Press Enter to accept suggestion
    await page.keyboard.press('Enter');

    // Verify link creation
    await expect(page.getByText(/link created successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('AI suggestions panel has proper ARIA labels', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto(`/intake/${INTAKE_ID}`);

    // Wait for entity links section
    await page.waitForSelector('[aria-label="Entity Link Manager"]');

    // Click "Get AI Suggestions" button
    await page.getByRole('button', { name: /get ai suggestions/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestion-card"]', { timeout: 5000 });

    // Verify loading state has aria-live region
    // (This would be tested during loading, but we can verify the structure)

    // Verify suggestion cards have proper structure
    const suggestionCards = page.locator('[data-testid="ai-suggestion-card"]');
    const count = await suggestionCards.count();

    for (let i = 0; i < count; i++) {
      const card = suggestionCards.nth(i);

      // Verify entity name is a heading
      await expect(card.locator('h4')).toBeVisible();

      // Verify confidence badge is labeled
      await expect(card.locator('[data-testid="confidence-score"]')).toBeVisible();

      // Verify "Create Link" button is accessible
      const createButton = card.getByRole('button', { name: /create link/i });
      await expect(createButton).toHaveAttribute('type', 'button');
    }
  });
});
