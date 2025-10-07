import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test: Screen Reader (English)
 * Reference: quickstart.md lines 835-839
 */

test.describe('Accessibility: Screen Reader (English)', () => {
  test('should pass axe accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels on form fields', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Verify ARIA labels
    const attendeesInput = page.locator('input[name="attendees"]');
    const ariaLabel = await attendeesInput.getAttribute('aria-label');
    expect(ariaLabel || await page.locator('label[for="attendees"]').textContent()).toBeTruthy();

    // Verify required fields have aria-required
    const requiredFields = page.locator('input[required], textarea[required]');
    const count = await requiredFields.count();
    for (let i = 0; i < count; i++) {
      const field = requiredFields.nth(i);
      const ariaRequired = await field.getAttribute('aria-required');
      expect(ariaRequired).toBe('true');
    }
  });

  test('should announce error messages with aria-live', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Try to save without required fields
    await page.click('button:has-text("Save Draft")');

    // Verify error region has aria-live
    const errorRegion = page.locator('[role="alert"], [aria-live]');
    await expect(errorRegion.first()).toBeVisible();
  });
});
