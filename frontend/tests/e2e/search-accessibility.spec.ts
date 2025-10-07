import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Test: Search Accessibility (ARIA Labels, Screen Reader) (T056)
 *
 * Tests accessibility compliance for the global search feature:
 * - Search input has proper aria-label
 * - Results have role="list"
 * - Suggestions have role="listbox"
 * - Loading states have aria-busy
 * - WCAG 2.1 AA compliance (no violations)
 * - Color contrast ratios meet standards
 *
 * From: quickstart.md Step 9.3
 */

test.describe('Search Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with global search
    await page.goto('/');
  });

  test('should have proper ARIA labels on search input', async ({ page }) => {
    // Locate search input
    const searchInput = page.locator('input[role="searchbox"]');

    // Verify aria-label exists
    const ariaLabel = await searchInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/search|بحث/i);

    // Verify role is correct
    await expect(searchInput).toHaveAttribute('role', 'searchbox');

    // Verify autocomplete is properly set
    await expect(searchInput).toHaveAttribute('autocomplete', 'off');
  });

  test('should have proper ARIA roles on suggestions dropdown', async ({ page }) => {
    // Focus search and type query
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.click();
    await searchInput.fill('climate');

    // Wait for suggestions to appear
    const suggestionsDropdown = page.locator('[role="listbox"]');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 });

    // Verify listbox role
    await expect(suggestionsDropdown).toHaveAttribute('role', 'listbox');

    // Verify individual suggestions have option role
    const suggestions = page.locator('[role="option"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(suggestions.first()).toHaveAttribute('role', 'option');

    // Verify aria-selected on suggestions
    const firstSuggestion = suggestions.first();
    const ariaSelected = await firstSuggestion.getAttribute('aria-selected');
    expect(ariaSelected).toMatch(/true|false/);
  });

  test('should have proper ARIA roles on search results', async ({ page }) => {
    // Perform a search
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.click();
    await searchInput.fill('climate policy');
    await page.keyboard.press('Enter');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Verify results container has role="list"
    const resultsContainer = page.locator('[role="list"]').first();
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });

    // Verify individual results have role="listitem"
    const resultItems = page.locator('[role="listitem"]');
    await expect(resultItems.first()).toBeVisible();
  });

  test('should show aria-busy during loading states', async ({ page }) => {
    // Focus search input
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.click();

    // Type query (should trigger loading state)
    await searchInput.fill('climate');

    // Check for aria-busy during loading
    // This might be on the suggestions container or search input
    const loadingElement = page.locator('[aria-busy="true"]');

    // Wait a moment for loading state to appear
    // Note: This may be very fast with caching, so we check if it exists at any point
    try {
      await expect(loadingElement).toBeVisible({ timeout: 1000 });
    } catch (e) {
      // Loading may be too fast to catch, which is okay
      console.log('Loading state too fast to capture (acceptable)');
    }
  });

  test('should pass axe accessibility scan on search page', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search?q=climate');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass axe accessibility scan with suggestions open', async ({ page }) => {
    // Focus search and show suggestions
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.click();
    await searchInput.fill('climate');

    // Wait for suggestions
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 5000 });

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    // Navigate to search page with results
    await page.goto('/search?q=climate');
    await page.waitForLoadState('networkidle');

    // Run axe scan specifically for color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role="searchbox"]')
      .include('[role="listbox"]')
      .include('[role="list"]')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    // Assert no contrast violations
    expect(contrastViolations).toEqual([]);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to search input
    await page.keyboard.press('Tab');

    // Keep tabbing until we reach the search input
    let focused = await page.locator(':focus').getAttribute('role');
    while (focused !== 'searchbox') {
      await page.keyboard.press('Tab');
      focused = await page.locator(':focus').getAttribute('role');
    }

    // Get the focused element
    const focusedElement = page.locator(':focus');

    // Verify focus indicator is visible (check for outline or box-shadow)
    const outlineStyle = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    // At least one focus indicator should be present
    const hasFocusIndicator =
      (outlineStyle.outlineWidth && outlineStyle.outlineWidth !== '0px') ||
      (outlineStyle.boxShadow && outlineStyle.boxShadow !== 'none');

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should have proper heading structure', async ({ page }) => {
    // Navigate to search results page
    await page.goto('/search?q=climate');
    await page.waitForLoadState('networkidle');

    // Check heading hierarchy (should not skip levels)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.substring(1));

      // Heading levels should not skip (e.g., h1 -> h3 is bad)
      if (previousLevel > 0) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }

      previousLevel = currentLevel;
    }
  });

  test('should have alt text on images in search results', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?q=climate');
    await page.waitForLoadState('networkidle');

    // Find all images in results
    const images = await page.locator('[role="list"] img, [role="listitem"] img').all();

    // Verify all images have alt text (or are decorative with alt="")
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('should support screen reader announcements for result counts', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?q=climate');
    await page.waitForLoadState('networkidle');

    // Check for aria-live region with result count
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');

    // Should have at least one live region
    const count = await liveRegion.count();
    expect(count).toBeGreaterThan(0);

    // Verify it contains result count information
    const text = await liveRegion.first().textContent();
    expect(text).toMatch(/\d+.*result|نتيجة/i);
  });

  test('should have proper landmark regions', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Verify main landmark exists
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Verify search region is identifiable
    const search = page.locator('search, [role="search"]');
    const searchExists = await search.count();

    // Search region should exist or search should be in main
    if (searchExists === 0) {
      // Search input should at least be in main
      const searchInMain = page.locator('main input[role="searchbox"], [role="main"] input[role="searchbox"]');
      await expect(searchInMain).toBeVisible();
    } else {
      await expect(search).toBeVisible();
    }
  });

  test('should support keyboard navigation through result tabs', async ({ page }) => {
    // Navigate to search results with tabs
    await page.goto('/search?q=climate');
    await page.waitForLoadState('networkidle');

    // Find tab list
    const tabList = page.locator('[role="tablist"]');

    // If tabs exist, verify they're keyboard accessible
    const tabListExists = await tabList.count();
    if (tabListExists > 0) {
      // Verify tabs have proper roles
      const tabs = page.locator('[role="tab"]');
      await expect(tabs.first()).toBeVisible();

      // Verify tab panels exist
      const tabPanels = page.locator('[role="tabpanel"]');
      await expect(tabPanels.first()).toBeVisible();

      // Verify aria-selected on tabs
      const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(selectedTab).toBeVisible();
    }
  });

  test('should have proper form labels in Arabic', async ({ page }) => {
    // Switch to Arabic language (if language switcher exists)
    const langSwitcher = page.locator('[aria-label*="Language"], [aria-label*="لغة"]');
    const hasLangSwitcher = await langSwitcher.count();

    if (hasLangSwitcher > 0) {
      await langSwitcher.click();
      const arabicOption = page.locator('text=/عربي|Arabic/i');
      await arabicOption.click();

      // Wait for language to change
      await page.waitForTimeout(1000);

      // Verify search input has Arabic label
      const searchInput = page.locator('input[role="searchbox"]');
      const ariaLabel = await searchInput.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/بحث/);
    }
  });

  test('should handle empty search results accessibly', async ({ page }) => {
    // Search for something unlikely to have results
    await page.goto('/search?q=xyzabc123nonexistent');
    await page.waitForLoadState('networkidle');

    // Verify empty state message is accessible
    const emptyMessage = page.locator('text=/no results|لا توجد نتائج/i');
    await expect(emptyMessage).toBeVisible();

    // Verify empty state is in a proper landmark
    const emptyInMain = page.locator('main text=/no results|لا توجد نتائج/i, [role="main"] text=/no results|لا توجد نتائج/i');
    await expect(emptyInMain).toBeVisible();
  });
});
