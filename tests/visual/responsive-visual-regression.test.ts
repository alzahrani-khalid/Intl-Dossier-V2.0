import { test, expect } from '@playwright/test';

test.describe('Responsive Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Desktop layout - LTR vs RTL', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('desktop-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('desktop-rtl.png');
  });

  test('Laptop layout - LTR vs RTL', async ({ page }) => {
    // Set laptop viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('laptop-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('laptop-rtl.png');
  });

  test('Tablet layout - LTR vs RTL', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('tablet-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('tablet-rtl.png');
  });

  test('Mobile layout - LTR vs RTL', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('mobile-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('mobile-rtl.png');
  });

  test('Small mobile layout - LTR vs RTL', async ({ page }) => {
    // Set small mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('small-mobile-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('small-mobile-rtl.png');
  });

  test('Header component responsive - LTR vs RTL', async ({ page }) => {
    const header = page.locator('header');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(header).toHaveScreenshot('header-desktop-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(header).toHaveScreenshot('header-desktop-rtl.png');
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(header).toHaveScreenshot('header-tablet-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(header).toHaveScreenshot('header-tablet-rtl.png');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(header).toHaveScreenshot('header-mobile-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(header).toHaveScreenshot('header-mobile-rtl.png');
  });

  test('Sidebar component responsive - LTR vs RTL', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-desktop-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-desktop-rtl.png');
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-tablet-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-tablet-rtl.png');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-mobile-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(sidebar).toHaveScreenshot('sidebar-mobile-rtl.png');
  });

  test('DataTable component responsive - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with DataTable
    await page.goto('/countries');
    
    const dataTable = page.locator('[data-testid="data-table"]');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(dataTable).toHaveScreenshot('data-table-desktop-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(dataTable).toHaveScreenshot('data-table-desktop-rtl.png');
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(dataTable).toHaveScreenshot('data-table-tablet-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(dataTable).toHaveScreenshot('data-table-tablet-rtl.png');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(dataTable).toHaveScreenshot('data-table-mobile-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(dataTable).toHaveScreenshot('data-table-mobile-rtl.png');
  });

  test('Form components responsive - LTR vs RTL', async ({ page }) => {
    // Navigate to a form page
    await page.goto('/organizations/new');
    
    const form = page.locator('form');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(form).toHaveScreenshot('form-desktop-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(form).toHaveScreenshot('form-desktop-rtl.png');
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(form).toHaveScreenshot('form-tablet-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(form).toHaveScreenshot('form-tablet-rtl.png');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(form).toHaveScreenshot('form-mobile-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(form).toHaveScreenshot('form-mobile-rtl.png');
  });

  test('Card components responsive - LTR vs RTL', async ({ page }) => {
    const cards = page.locator('[data-testid="card"]');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(cards.first()).toHaveScreenshot('card-desktop-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(cards.first()).toHaveScreenshot('card-desktop-rtl.png');
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(cards.first()).toHaveScreenshot('card-tablet-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(cards.first()).toHaveScreenshot('card-tablet-rtl.png');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    await expect(cards.first()).toHaveScreenshot('card-mobile-ltr.png');
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    await expect(cards.first()).toHaveScreenshot('card-mobile-rtl.png');
  });
});
