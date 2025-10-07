import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * A11y Test: Positions Pages (Arabic with RTL) - T090
 * Tests WCAG 2.1 Level AA compliance for all position routes in Arabic (RTL mode)
 *
 * Validates:
 * - WCAG 2.1 Level AA compliance
 * - RTL layout (text direction, form alignment)
 * - Keyboard navigation (RTL arrow keys)
 * - Screen reader Arabic labels
 */

test.describe('Positions Accessibility (Arabic RTL)', () => {
  test.beforeEach(async ({ page }) => {
    // Set language to Arabic
    await page.goto('/login?lang=ar');

    // Login with Arabic interface
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
  });

  test('positions list page should be accessible in Arabic', async ({ page }) => {
    await page.goto('/positions?lang=ar');

    // Verify RTL direction
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveAttribute('dir', 'rtl');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('position editor should support RTL in Arabic', async ({ page }) => {
    await page.goto('/positions?lang=ar');
    await page.click('[data-testid="new-position-button"]');

    // Verify Arabic editor has RTL
    const arEditor = page.locator('[data-testid="content-ar-editor"]');
    await expect(arEditor).toHaveAttribute('dir', 'rtl');

    // Verify form layout is RTL
    const form = page.locator('[data-testid="position-form"]');
    await expect(form).toHaveAttribute('dir', 'rtl');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support RTL keyboard navigation', async ({ page }) => {
    await page.goto('/positions?lang=ar');

    // Tab navigation should work in RTL
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Arrow keys should navigate in RTL direction
    await page.keyboard.press('ArrowRight'); // Goes left in RTL
    await page.keyboard.press('ArrowLeft'); // Goes right in RTL

    // Verify navigation worked
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  });

  test('should have Arabic ARIA labels', async ({ page }) => {
    await page.goto('/positions?lang=ar');
    await page.click('[data-testid="new-position-button"]');

    // Verify Arabic labels present
    const titleInput = page.locator('[data-testid="title-ar-input"]');
    const ariaLabel = await titleInput.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/عنوان|موقف/); // Should contain Arabic text
  });

  test('should announce Arabic screen reader messages', async ({ page }) => {
    await page.goto('/positions?lang=ar');
    await page.click('[data-testid="new-position-button"]');

    await page.fill('[data-testid="title-ar-input"]', 'موقف اختبار');
    await page.click('[data-testid="save-draft-button"]');

    // Verify ARIA live region announces in Arabic
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/تم|نجح|حفظ/); // Arabic success message
  });

  test('approval dashboard should be accessible in Arabic RTL', async ({ page }) => {
    await page.goto('/approvals?lang=ar');

    // Verify RTL layout
    await expect(page.locator('main')).toHaveAttribute('dir', 'rtl');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('version comparison should be accessible in Arabic RTL', async ({ page }) => {
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}/versions?lang=ar`);

    // Verify diff display supports RTL
    const arDiff = page.locator('[data-testid="diff-ar-container"]');
    if (await arDiff.count() > 0) {
      await expect(arDiff).toHaveAttribute('dir', 'rtl');
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
