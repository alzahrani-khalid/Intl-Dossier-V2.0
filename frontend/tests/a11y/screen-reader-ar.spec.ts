import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test: Screen Reader (Arabic)
 * Reference: quickstart.md lines 841-845
 */

test.describe('Accessibility: Screen Reader (Arabic)', () => {
  test('should pass axe accessibility scan in Arabic', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Verify RTL layout
    const body = page.locator('body');
    const dir = await body.getAttribute('dir');
    expect(dir).toBe('rtl');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper Arabic labels', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Verify Arabic text present
    await expect(page.locator('text=الحضور').or(page.locator('text=المشاركون'))).toBeVisible();
  });
});
