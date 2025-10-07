import { test, expect } from '@playwright/test';

/**
 * E2E Test: Global Search UI with Keyboard Navigation (T055)
 *
 * Tests keyboard navigation functionality for the global search feature:
 * - Press `/` to focus search input
 * - Type query and navigate suggestions with arrow keys
 * - Press Enter to select
 * - Press Escape to close
 * - Tests in both English and Arabic
 *
 * From: quickstart.md Step 9.1
 */

test.describe('Global Search Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a page with global search
    await page.goto('/');
    // Assume authentication is handled via test fixtures or beforeAll
  });

  test('should focus search input when pressing /', async ({ page }) => {
    // Press `/` key
    await page.keyboard.press('/');

    // Verify search input is focused
    const searchInput = page.locator('input[role="searchbox"]');
    await expect(searchInput).toBeFocused();
  });

  test('should show suggestions and navigate with arrow keys (English)', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type "climate"
    await page.keyboard.type('climate');

    // Wait for suggestions to appear
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 });

    // Verify suggestions are present
    const suggestions = page.locator('[role="option"]');
    await expect(suggestions.first()).toBeVisible();

    // Press down arrow to navigate
    await page.keyboard.press('ArrowDown');

    // Verify first suggestion is highlighted
    const firstSuggestion = suggestions.first();
    await expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');

    // Press down arrow again
    await page.keyboard.press('ArrowDown');

    // Verify second suggestion is now highlighted
    const secondSuggestion = suggestions.nth(1);
    await expect(secondSuggestion).toHaveAttribute('aria-selected', 'true');

    // Press up arrow
    await page.keyboard.press('ArrowUp');

    // Verify first suggestion is highlighted again
    await expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate to result page when pressing Enter on suggestion', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type "climate"
    await page.keyboard.type('climate');

    // Wait for suggestions
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 5000 });

    // Navigate to first suggestion
    await page.keyboard.press('ArrowDown');

    // Get the first suggestion text for verification
    const firstSuggestion = page.locator('[role="option"]').first();
    const suggestionText = await firstSuggestion.textContent();

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Verify result page loads or search results are shown
    // This could navigate to /search or show inline results
    await page.waitForLoadState('networkidle');

    // Verify we're on the search results page or results are displayed
    const resultsContainer = page.locator('[role="list"]');
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });
  });

  test('should close suggestions when pressing Escape', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type "climate"
    await page.keyboard.type('climate');

    // Wait for suggestions to appear
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify suggestions are hidden
    await expect(suggestionsDropdown).not.toBeVisible();
  });

  test('should support keyboard navigation in Arabic', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type Arabic query "مناخ" (climate)
    await page.keyboard.type('مناخ');

    // Wait for suggestions to appear
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 });

    // Verify suggestions are present (should include Arabic results)
    const suggestions = page.locator('[role="option"]');
    await expect(suggestions.first()).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');

    // Verify navigation works with Arabic content
    const firstSuggestion = suggestions.first();
    await expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');

    // Verify RTL direction is applied
    await expect(firstSuggestion).toHaveAttribute('dir', 'auto');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(suggestionsDropdown).not.toBeVisible();
  });

  test('should handle rapid keyboard input without breaking', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type rapidly
    await page.keyboard.type('climate change policy', { delay: 50 });

    // Wait for suggestions (should debounce properly)
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 });

    // Navigate rapidly
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
    }

    // Should still work without errors
    const suggestions = page.locator('[role="option"]');
    await expect(suggestions.first()).toBeVisible();
  });

  test('should clear search input with clear button', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type query
    await page.keyboard.type('climate');

    // Verify input has value
    const searchInput = page.locator('input[role="searchbox"]');
    await expect(searchInput).toHaveValue('climate');

    // Click clear button (usually an X icon)
    const clearButton = page.locator('button[aria-label*="Clear"], button[aria-label*="مسح"]');
    await clearButton.click();

    // Verify input is cleared
    await expect(searchInput).toHaveValue('');

    // Verify suggestions are hidden
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).not.toBeVisible();
  });

  test('should submit search with Enter key when no suggestion selected', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type query
    await page.keyboard.type('climate policy');

    // Wait a moment for suggestions to appear
    await page.waitForTimeout(300);

    // Press Enter without selecting a suggestion
    await page.keyboard.press('Enter');

    // Verify search results page loads
    await page.waitForLoadState('networkidle');

    // Verify we're on search results page or results are displayed
    const resultsContainer = page.locator('[role="list"]');
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });

    // Verify query parameter in URL or search query display
    expect(page.url()).toMatch(/search|q=climate/);
  });

  test('should handle Tab key to navigate between search and other elements', async ({ page }) => {
    // Focus search input
    await page.keyboard.press('/');

    // Type query to show suggestions
    await page.keyboard.type('climate');

    // Wait for suggestions
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 5000 });

    // Press Tab to exit search
    await page.keyboard.press('Tab');

    // Verify focus has moved away from search input
    const searchInput = page.locator('input[role="searchbox"]');
    await expect(searchInput).not.toBeFocused();

    // Suggestions should close
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).not.toBeVisible();
  });
});
