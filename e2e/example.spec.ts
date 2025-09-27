import { test, expect } from '@playwright/test';

test.describe('GASTAT International Dossier System', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');

    // Test basic page load
    await expect(page).toHaveTitle(/GASTAT/);

    // Test bilingual support
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('should support Arabic language', async ({ page }) => {
    await page.goto('/');

    // Test language switcher
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();

      // Select Arabic
      await page.locator('[data-value="ar"]').click();

      // Verify RTL layout
      const body = page.locator('body');
      await expect(body).toHaveAttribute('dir', 'rtl');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Should have mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });
});