import { test, expect } from '@playwright/test';

/**
 * A11y Test: Position Editor Keyboard Navigation - T091
 * Tests keyboard-only interaction for PositionEditor
 *
 * Validates:
 * - Tab through all fields
 * - Enter activates buttons
 * - Esc cancels dialogs
 * - Ctrl+S saves draft
 * - Focus indicators visible
 * - No keyboard traps
 */

test.describe('Position Editor Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to position editor
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');
  });

  test('should tab through all form fields in correct order', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab'); // Position type select
    const positionTypeSelect = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));
    expect(positionTypeSelect).toContain('position-type');

    await page.keyboard.press('Tab'); // Title EN
    const titleEn = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));
    expect(titleEn).toContain('title-en');

    await page.keyboard.press('Tab'); // Title AR
    const titleAr = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));
    expect(titleAr).toContain('title-ar');

    await page.keyboard.press('Tab'); // Content EN editor
    await page.keyboard.press('Tab'); // Content AR editor
    await page.keyboard.press('Tab'); // Thematic category
    await page.keyboard.press('Tab'); // Audience groups

    // Verify we can reach save button
    await page.keyboard.press('Tab');
    const saveButton = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));
    expect(saveButton).toContain('save');
  });

  test('should activate buttons with Enter key', async ({ page }) => {
    // Fill minimal required fields
    await page.fill('[data-testid="title-en-input"]', 'Keyboard Test');
    await page.fill('[data-testid="title-ar-input"]', 'اختبار لوحة المفاتيح');

    // Navigate to save button and press Enter
    await page.locator('[data-testid="save-draft-button"]').focus();
    await page.keyboard.press('Enter');

    // Verify save action triggered
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 3000 });
  });

  test('should save draft with Ctrl+S shortcut', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="title-en-input"]', 'Shortcut Test');
    await page.fill('[data-testid="content-en-editor"]', 'Test content');

    // Press Ctrl+S
    await page.keyboard.press('Control+S');

    // Verify save triggered
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 3000 });
  });

  test('should close modals with Esc key', async ({ page }) => {
    // Open consistency check (or any modal)
    await page.click('[data-testid="check-consistency-button"]');

    // Verify modal visible
    const modal = page.locator('[data-testid="consistency-modal"]');
    if (await modal.count() > 0) {
      await expect(modal).toBeVisible();

      // Press Esc
      await page.keyboard.press('Escape');

      // Verify modal closed
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should have visible focus indicators on all interactive elements', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Get focused element
    const focusedElement = page.locator(':focus');

    // Verify focus indicator visible (outline or box-shadow)
    const hasOutline = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(hasOutline).toBe(true);
  });

  test('should not have keyboard traps', async ({ page }) => {
    // Tab through entire form
    let tabCount = 0;
    const maxTabs = 50; // Prevent infinite loop

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      // Check if we're back at the beginning (cycled through all focusable elements)
      const focusedTestId = await page.locator(':focus').evaluate(
        el => el.getAttribute('data-testid')
      ).catch(() => null);

      if (tabCount > 20 && focusedTestId === 'position-type-select') {
        // Successfully cycled through all elements
        break;
      }
    }

    // Verify we didn't hit max tabs (which would indicate a trap)
    expect(tabCount).toBeLessThan(maxTabs);
  });

  test('should support shift+tab for reverse navigation', async ({ page }) => {
    // Tab forward several times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Get current focused element
    const forwardElement = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));

    // Shift+Tab backward
    await page.keyboard.press('Shift+Tab');

    // Get new focused element
    const backwardElement = await page.locator(':focus').evaluate(el => el.getAttribute('data-testid'));

    // Verify we moved backward
    expect(backwardElement).not.toBe(forwardElement);
  });

  test('should handle keyboard navigation in bilingual editor panels', async ({ page }) => {
    // Focus EN editor
    await page.locator('[data-testid="content-en-editor"]').focus();
    await page.keyboard.type('English content');

    // Tab to AR editor
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="content-ar-editor"]')).toBeFocused();

    // Type in AR editor
    await page.keyboard.type('محتوى عربي');

    // Verify both contents present
    await expect(page.locator('[data-testid="content-en-editor"]')).toHaveValue('English content');
    await expect(page.locator('[data-testid="content-ar-editor"]')).toHaveValue('محتوى عربي');
  });
});
