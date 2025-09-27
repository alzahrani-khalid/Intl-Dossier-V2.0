import { test, expect } from '@playwright/test';

test.describe('RTL/LTR Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('Header component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const headerLTR = page.locator('header');
    await expect(headerLTR).toBeVisible();
    await expect(headerLTR).toHaveScreenshot('header-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(headerLTR).toHaveScreenshot('header-rtl.png');
  });

  test('MainLayout component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toBeVisible();
    await expect(mainLayout).toHaveScreenshot('main-layout-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(mainLayout).toHaveScreenshot('main-layout-rtl.png');
  });

  test('Sidebar component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveScreenshot('sidebar-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(sidebar).toHaveScreenshot('sidebar-rtl.png');
  });

  test('DataTable component - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with DataTable
    await page.goto('/countries');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const dataTable = page.locator('[data-testid="data-table"]');
    await expect(dataTable).toBeVisible();
    await expect(dataTable).toHaveScreenshot('data-table-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(dataTable).toHaveScreenshot('data-table-rtl.png');
  });

  test('Form components - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with forms
    await page.goto('/organizations/new');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const form = page.locator('form');
    await expect(form).toBeVisible();
    await expect(form).toHaveScreenshot('form-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(form).toHaveScreenshot('form-rtl.png');
  });

  test('Card components - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const cards = page.locator('[data-testid="card"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toHaveScreenshot('card-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(cards.first()).toHaveScreenshot('card-rtl.png');
  });

  test('Language Toggle component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const languageToggle = page.locator('[data-testid="language-toggle"]');
    await expect(languageToggle).toBeVisible();
    await expect(languageToggle).toHaveScreenshot('language-toggle-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(languageToggle).toHaveScreenshot('language-toggle-rtl.png');
  });

  test('MFA Setup component - LTR vs RTL', async ({ page }) => {
    // Navigate to MFA setup page
    await page.goto('/mfa/setup');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const mfaSetup = page.locator('[data-testid="mfa-setup"]');
    await expect(mfaSetup).toBeVisible();
    await expect(mfaSetup).toHaveScreenshot('mfa-setup-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(mfaSetup).toHaveScreenshot('mfa-setup-rtl.png');
  });

  test('File Upload component - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with file upload
    await page.goto('/data-library/upload');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const fileUpload = page.locator('[data-testid="file-upload"]');
    await expect(fileUpload).toBeVisible();
    await expect(fileUpload).toHaveScreenshot('file-upload-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(fileUpload).toHaveScreenshot('file-upload-rtl.png');
  });

  test('Error Boundary component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible();
    await expect(errorBoundary).toHaveScreenshot('error-boundary-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(errorBoundary).toHaveScreenshot('error-boundary-rtl.png');
  });

  test('Offline Indicator component - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-rtl.png');
  });

  test('Full page layout - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    await expect(page).toHaveScreenshot('full-page-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    await expect(page).toHaveScreenshot('full-page-rtl.png');
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
});
