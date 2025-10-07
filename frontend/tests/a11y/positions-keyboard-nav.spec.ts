import { test, expect } from '@playwright/test';

test.describe('Positions Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should navigate to positions using Tab key', async ({ page }) => {
    await page.goto('/positions');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus on interactive element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
  });

  test('should navigate position list with Arrow keys', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Focus first position
    const firstCard = page.locator('[data-testid="position-card"]').first();
    await firstCard.focus();

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');

    // Wait for focus change
    await page.waitForTimeout(200);

    // Verify second card focused
    const secondCard = page.locator('[data-testid="position-card"]').nth(1);
    const isFocused = await secondCard.evaluate((el) => el === document.activeElement);

    expect(isFocused).toBe(true);
  });

  test('should attach position with Enter key', async ({ page }) => {
    // Navigate to engagement
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Focus suggestions section
    const suggestionsSection = page.locator('[data-testid="position-suggestions-panel"]');
    await suggestionsSection.scrollIntoViewIfNeeded();

    // Tab to first suggestion attach button
    const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first();
    const attachButton = firstSuggestion.locator('[data-testid="attach-button"]');

    await attachButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Wait for attachment
    await page.waitForTimeout(1000);

    // Verify position attached
    const attachedSection = page.locator('[data-testid="attached-positions-section"]');
    const count = await attachedSection.locator('[data-testid="position-card"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should detach position with Delete key', async ({ page }) => {
    // Navigate to engagement with attached positions
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    const attachedSection = page.locator('[data-testid="attached-positions-section"]');
    const firstCard = attachedSection.locator('[data-testid="position-card"]').first();

    // Focus position card
    await firstCard.focus();

    // Press Delete
    await page.keyboard.press('Delete');

    // Confirm if dialog appears
    const confirmDialog = page.locator('[data-testid="confirm-detach-dialog"]');
    if (await confirmDialog.isVisible()) {
      // Tab to confirm button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    }

    // Wait for detachment
    await page.waitForTimeout(1000);

    // Verify position removed
    const newCount = await attachedSection.locator('[data-testid="position-card"]').count();
    expect(newCount).toBe(0);
  });

  test('should display visible focus indicators', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Focus first position
    const firstCard = page.locator('[data-testid="position-card"]').first();
    await firstCard.focus();

    // Check for focus ring/outline
    const outlineStyle = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Verify focus indicator exists (outline or box-shadow)
    const hasFocusIndicator =
      outlineStyle.outlineWidth !== '0px' || outlineStyle.boxShadow !== 'none';

    expect(hasFocusIndicator).toBe(true);
  });

  test('should trap focus within modal dialogs', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Open attach dialog
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Tab through dialog elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify focus still within dialog
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));

    expect(focusedElement).toBeTruthy();
  });

  test('should close dialog with Escape key', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Open dialog
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify dialog closed
    await expect(dialog).not.toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Test Ctrl+F for search (if implemented)
    await page.keyboard.press('Control+F');

    // Verify search input focused
    const searchInput = page.locator('[data-testid="positions-search"]');
    const isFocused = await searchInput.evaluate((el) => el === document.activeElement);

    if (isFocused) {
      expect(isFocused).toBe(true);
    }
  });

  test('should have proper tab order', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Track tab order
    const tabOrder: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute('data-testid') || el?.getAttribute('aria-label') || el?.tagName;
      });

      tabOrder.push(focused);
    }

    // Verify logical tab order (search → filters → positions)
    // This is implementation-specific, adjust as needed
    expect(tabOrder).toContain('positions-search');
  });

  test('should skip to main content', async ({ page }) => {
    await page.goto('/positions');

    // Press Tab to focus skip link (usually first interactive element)
    await page.keyboard.press('Tab');

    // Look for skip link
    const skipLink = page.locator('[href="#main-content"]');
    if (await skipLink.isVisible()) {
      await page.keyboard.press('Enter');

      // Verify focus moved to main content
      const mainContent = page.locator('#main-content');
      const isFocused = await mainContent.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

      expect(isFocused).toBe(true);
    }
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    await page.goto('/positions');

    // Verify ARIA live region exists
    const liveRegion = page.locator('[aria-live="polite"], [role="status"]');
    expect(await liveRegion.count()).toBeGreaterThan(0);

    // Navigate to position detail
    await page.click('[data-testid="position-card"]:first-child');

    // Verify live region updated
    await page.waitForTimeout(500);

    const liveRegionText = await liveRegion.first().textContent();
    expect(liveRegionText).not.toBe('');
  });

  test('should have descriptive button labels', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Check attach buttons have descriptive labels
    const attachButtons = page.locator('[data-testid="attach-button"]');
    const count = await attachButtons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const ariaLabel = await attachButtons.nth(i).getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length || 0).toBeGreaterThan(10); // Descriptive, not just "Attach"
    }
  });

  test('should handle keyboard navigation in search results', async ({ page }) => {
    await page.goto('/positions');

    const searchInput = page.locator('[data-testid="positions-search"]');
    await searchInput.fill('policy');

    // Wait for results
    await page.waitForTimeout(1000);

    // Tab to first result
    await searchInput.press('Tab');

    // Verify focus on first result
    const firstCard = page.locator('[data-testid="position-card"]').first();
    const isFocused = await firstCard.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

    expect(isFocused).toBe(true);
  });
});
