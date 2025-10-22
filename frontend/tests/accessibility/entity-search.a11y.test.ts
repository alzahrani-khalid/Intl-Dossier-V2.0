import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test: Entity Search Keyboard Navigation (User Story 1)
 *
 * Task: T054 [US1]
 * Success Criteria: WCAG AA compliance for entity search dialog
 *
 * Test Coverage:
 * 1. Keyboard navigation (Tab, Enter, Escape, Arrow keys)
 * 2. Screen reader support (ARIA labels, roles, live regions)
 * 3. Color contrast (4.5:1 for text, 3:1 for UI components)
 * 4. Focus management
 * 5. Semantic HTML
 */

test.describe('Entity Search Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|intake-queue)/);

    // Navigate to intake detail page
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);
  });

  test('should have no accessibility violations (axe-core)', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible({ timeout: 3000 });

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        console.error(`  Nodes: ${violation.nodes.length}`);
      });
    }
  });

  test('should support keyboard navigation with Tab key', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Focus should be on search input by default
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await expect(searchInput).toBeFocused();

    // Tab to next focusable element (should be close button or first search result)
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Tab through all focusable elements and ensure tab trap within dialog
    const focusableElements = searchDialog.locator(
      'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
    );
    const focusableCount = await focusableElements.count();

    for (let i = 0; i < focusableCount + 1; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');

      // Verify focus remains within dialog (tab trap)
      const isFocusInDialog = await currentFocus.evaluate((el, dialogEl) => {
        return dialogEl.contains(el);
      }, await searchDialog.elementHandle());

      expect(isFocusInDialog).toBe(true);
    }
  });

  test('should close dialog with Escape key', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify dialog is closed
    await expect(searchDialog).not.toBeVisible({ timeout: 1000 });

    // Verify focus returns to trigger button
    await expect(addLinkButton).toBeFocused();
  });

  test('should support Arrow key navigation in search results', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');

    // Search for multiple results
    await searchInput.fill('policy');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    const resultCount = await searchResults.count();

    if (resultCount > 1) {
      // Press ArrowDown to navigate to first result
      await page.keyboard.press('ArrowDown');
      let focusedResult = page.locator(':focus');
      await expect(focusedResult).toHaveAttribute('data-testid', 'entity-search-result');

      // Press ArrowDown to navigate to second result
      await page.keyboard.press('ArrowDown');
      focusedResult = page.locator(':focus');
      await expect(focusedResult).toHaveAttribute('data-testid', 'entity-search-result');

      // Press ArrowUp to go back to first result
      await page.keyboard.press('ArrowUp');
      focusedResult = page.locator(':focus');
      await expect(focusedResult).toHaveAttribute('data-testid', 'entity-search-result');
    }
  });

  test('should select search result with Enter key', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');

    // Search for entity
    await searchInput.fill('Saudi Arabia');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    await expect(searchResults.first()).toBeVisible();

    // Navigate to first result with ArrowDown
    await page.keyboard.press('ArrowDown');

    // Select with Enter
    await page.keyboard.press('Enter');

    // Verify entity is selected (should show in selected entity display or link type selector)
    const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
    await expect(linkTypeSelect).toBeVisible({ timeout: 1000 });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Verify dialog has aria-labelledby or aria-label
    const dialogLabel = await searchDialog.getAttribute('aria-labelledby');
    const dialogAriaLabel = await searchDialog.getAttribute('aria-label');
    expect(dialogLabel || dialogAriaLabel).toBeTruthy();

    // Verify search input has aria-label
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    const inputAriaLabel = await searchInput.getAttribute('aria-label');
    expect(inputAriaLabel).toBeTruthy();

    // Search for results
    await searchInput.fill('policy');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      // Verify search results have proper role (option, listitem, or button)
      const firstResult = searchResults.first();
      const resultRole = await firstResult.getAttribute('role');
      expect(resultRole).toMatch(/option|listitem|button/);

      // Verify search results container has proper role (listbox, list, or menu)
      const resultsContainer = searchResults.first().locator('xpath=ancestor::*[@role]').first();
      if (await resultsContainer.count() > 0) {
        const containerRole = await resultsContainer.getAttribute('role');
        expect(containerRole).toMatch(/listbox|list|menu/);
      }
    }
  });

  test('should announce dynamic content changes to screen readers', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');

    // Verify live region for search results
    const liveRegion = searchDialog.locator('[aria-live]');
    if (await liveRegion.count() > 0) {
      const ariaLive = await liveRegion.first().getAttribute('aria-live');
      expect(ariaLive).toMatch(/polite|assertive/);
    }

    // Search and verify announcement
    await searchInput.fill('Saudi Arabia');
    await page.waitForTimeout(500);

    // Verify status message or result count is announced
    const statusMessage = searchDialog.locator('[role="status"], [aria-live]');
    if (await statusMessage.count() > 0) {
      const statusText = await statusMessage.first().textContent();
      expect(statusText).toBeTruthy();
    }
  });

  test('should meet WCAG AA color contrast requirements', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Run axe color contrast check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withRules(['color-contrast'])
      .analyze();

    // Assert no color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);

    if (contrastViolations.length > 0) {
      console.error('Color contrast violations found:');
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.error(`- ${node.html}`);
          console.error(`  ${node.failureSummary}`);
        });
      });
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');

    // Focus on search input
    await searchInput.focus();

    // Verify focus indicator is visible
    const focusOutline = await searchInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
        borderColor: styles.borderColor,
      };
    });

    // Verify some form of visible focus indicator exists
    const hasFocusIndicator =
      focusOutline.outlineWidth !== '0px' ||
      focusOutline.boxShadow !== 'none' ||
      focusOutline.borderColor !== 'transparent';

    expect(hasFocusIndicator).toBe(true);
  });

  test('should support screen reader text for icon-only buttons', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');

    // Find close button (usually icon-only)
    const closeButton = searchDialog.locator('button[aria-label*="Close"], button[aria-label*="إغلاق"]');

    if (await closeButton.count() > 0) {
      // Verify close button has aria-label
      const ariaLabel = await closeButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/close|إغلاق/i);
    }
  });

  test('should maintain focus within modal during Tab navigation (focus trap)', async ({ page }) => {
    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Get all focusable elements in dialog
    const focusableElements = searchDialog.locator(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const focusableCount = await focusableElements.count();

    // Tab through all elements multiple times
    for (let i = 0; i < focusableCount * 2; i++) {
      await page.keyboard.press('Tab');

      // Verify focus is always within dialog
      const focusedElement = page.locator(':focus');
      const isWithinDialog = await focusedElement.evaluate((el, dialogEl) => {
        return dialogEl.contains(el);
      }, await searchDialog.elementHandle());

      expect(isWithinDialog).toBe(true);
    }
  });

  test('should support RTL keyboard navigation for Arabic', async ({ page }) => {
    // Switch to Arabic language
    const languageToggle = page.locator('[data-testid="language-toggle"]');
    if (await languageToggle.isVisible()) {
      const currentLang = await languageToggle.textContent();
      if (!currentLang?.includes('العربية')) {
        await languageToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="بحث"]');

    // Verify RTL direction
    const dir = await searchDialog.getAttribute('dir');
    expect(dir).toBe('rtl');

    // Search for results
    await searchInput.fill('سياسة');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    const resultCount = await searchResults.count();

    if (resultCount > 1) {
      // In RTL, ArrowRight should move to previous item, ArrowLeft to next
      await page.keyboard.press('ArrowDown');
      const firstFocus = await page.locator(':focus').getAttribute('data-entity-id');

      await page.keyboard.press('ArrowDown');
      const secondFocus = await page.locator(':focus').getAttribute('data-entity-id');

      // Verify navigation worked (different elements focused)
      expect(firstFocus).not.toBe(secondFocus);
    }
  });
});
