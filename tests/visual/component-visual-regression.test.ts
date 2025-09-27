import { test, expect } from '@playwright/test';

test.describe('Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Button component states - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
    
    // Test normal state
    await expect(buttons.first()).toHaveScreenshot('button-normal-ltr.png');
    
    // Test hover state
    await buttons.first().hover();
    await expect(buttons.first()).toHaveScreenshot('button-hover-ltr.png');
    
    // Test focus state
    await buttons.first().focus();
    await expect(buttons.first()).toHaveScreenshot('button-focus-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(buttons.first()).toHaveScreenshot('button-normal-rtl.png');
    
    // Test hover state
    await buttons.first().hover();
    await expect(buttons.first()).toHaveScreenshot('button-hover-rtl.png');
    
    // Test focus state
    await buttons.first().focus();
    await expect(buttons.first()).toHaveScreenshot('button-focus-rtl.png');
  });

  test('Form Input component states - LTR vs RTL', async ({ page }) => {
    // Navigate to a form page
    await page.goto('/organizations/new');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    
    // Test normal state
    await expect(input).toHaveScreenshot('input-normal-ltr.png');
    
    // Test focus state
    await input.focus();
    await expect(input).toHaveScreenshot('input-focus-ltr.png');
    
    // Test filled state
    await input.fill('Test Organization');
    await expect(input).toHaveScreenshot('input-filled-ltr.png');
    
    // Test error state
    await input.fill('');
    await input.blur();
    await expect(input).toHaveScreenshot('input-error-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(input).toHaveScreenshot('input-normal-rtl.png');
    
    // Test focus state
    await input.focus();
    await expect(input).toHaveScreenshot('input-focus-rtl.png');
    
    // Test filled state
    await input.fill('منظمة تجريبية');
    await expect(input).toHaveScreenshot('input-filled-rtl.png');
    
    // Test error state
    await input.fill('');
    await input.blur();
    await expect(input).toHaveScreenshot('input-error-rtl.png');
  });

  test('Form Select component states - LTR vs RTL', async ({ page }) => {
    // Navigate to a form page
    await page.goto('/organizations/new');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    
    // Test normal state
    await expect(select).toHaveScreenshot('select-normal-ltr.png');
    
    // Test open state
    await select.click();
    await expect(select).toHaveScreenshot('select-open-ltr.png');
    
    // Test selected state
    await select.selectOption({ index: 1 });
    await expect(select).toHaveScreenshot('select-selected-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(select).toHaveScreenshot('select-normal-rtl.png');
    
    // Test open state
    await select.click();
    await expect(select).toHaveScreenshot('select-open-rtl.png');
    
    // Test selected state
    await select.selectOption({ index: 1 });
    await expect(select).toHaveScreenshot('select-selected-rtl.png');
  });

  test('DataTable component states - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with DataTable
    await page.goto('/countries');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const dataTable = page.locator('[data-testid="data-table"]');
    await expect(dataTable).toBeVisible();
    
    // Test normal state
    await expect(dataTable).toHaveScreenshot('data-table-normal-ltr.png');
    
    // Test with sorting
    const sortButton = dataTable.locator('th[data-sortable="true"]').first();
    await sortButton.click();
    await expect(dataTable).toHaveScreenshot('data-table-sorted-ltr.png');
    
    // Test with pagination
    const nextPageButton = dataTable.locator('button[aria-label="Next page"]');
    if (await nextPageButton.isVisible()) {
      await nextPageButton.click();
      await expect(dataTable).toHaveScreenshot('data-table-paginated-ltr.png');
    }

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(dataTable).toHaveScreenshot('data-table-normal-rtl.png');
    
    // Test with sorting
    await sortButton.click();
    await expect(dataTable).toHaveScreenshot('data-table-sorted-rtl.png');
    
    // Test with pagination
    if (await nextPageButton.isVisible()) {
      await nextPageButton.click();
      await expect(dataTable).toHaveScreenshot('data-table-paginated-rtl.png');
    }
  });

  test('Card component states - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const card = page.locator('[data-testid="card"]').first();
    await expect(card).toBeVisible();
    
    // Test normal state
    await expect(card).toHaveScreenshot('card-normal-ltr.png');
    
    // Test hover state
    await card.hover();
    await expect(card).toHaveScreenshot('card-hover-ltr.png');
    
    // Test focus state
    await card.focus();
    await expect(card).toHaveScreenshot('card-focus-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(card).toHaveScreenshot('card-normal-rtl.png');
    
    // Test hover state
    await card.hover();
    await expect(card).toHaveScreenshot('card-hover-rtl.png');
    
    // Test focus state
    await card.focus();
    await expect(card).toHaveScreenshot('card-focus-rtl.png');
  });

  test('Language Toggle component states - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const languageToggle = page.locator('[data-testid="language-toggle"]');
    await expect(languageToggle).toBeVisible();
    
    // Test normal state
    await expect(languageToggle).toHaveScreenshot('language-toggle-normal-ltr.png');
    
    // Test hover state
    await languageToggle.hover();
    await expect(languageToggle).toHaveScreenshot('language-toggle-hover-ltr.png');
    
    // Test focus state
    await languageToggle.focus();
    await expect(languageToggle).toHaveScreenshot('language-toggle-focus-ltr.png');
    
    // Test clicked state
    await languageToggle.click();
    await expect(languageToggle).toHaveScreenshot('language-toggle-clicked-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(languageToggle).toHaveScreenshot('language-toggle-normal-rtl.png');
    
    // Test hover state
    await languageToggle.hover();
    await expect(languageToggle).toHaveScreenshot('language-toggle-hover-rtl.png');
    
    // Test focus state
    await languageToggle.focus();
    await expect(languageToggle).toHaveScreenshot('language-toggle-focus-rtl.png');
    
    // Test clicked state
    await languageToggle.click();
    await expect(languageToggle).toHaveScreenshot('language-toggle-clicked-rtl.png');
  });

  test('MFA Setup component states - LTR vs RTL', async ({ page }) => {
    // Navigate to MFA setup page
    await page.goto('/mfa/setup');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const mfaSetup = page.locator('[data-testid="mfa-setup"]');
    await expect(mfaSetup).toBeVisible();
    
    // Test normal state
    await expect(mfaSetup).toHaveScreenshot('mfa-setup-normal-ltr.png');
    
    // Test with QR code
    const qrCode = mfaSetup.locator('[data-testid="qr-code"]');
    if (await qrCode.isVisible()) {
      await expect(qrCode).toHaveScreenshot('mfa-setup-qr-ltr.png');
    }
    
    // Test with verification code input
    const verificationInput = mfaSetup.locator('input[type="text"]');
    if (await verificationInput.isVisible()) {
      await verificationInput.focus();
      await expect(verificationInput).toHaveScreenshot('mfa-setup-verification-ltr.png');
    }

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(mfaSetup).toHaveScreenshot('mfa-setup-normal-rtl.png');
    
    // Test with QR code
    if (await qrCode.isVisible()) {
      await expect(qrCode).toHaveScreenshot('mfa-setup-qr-rtl.png');
    }
    
    // Test with verification code input
    if (await verificationInput.isVisible()) {
      await verificationInput.focus();
      await expect(verificationInput).toHaveScreenshot('mfa-setup-verification-rtl.png');
    }
  });

  test('File Upload component states - LTR vs RTL', async ({ page }) => {
    // Navigate to a page with file upload
    await page.goto('/data-library/upload');
    
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const fileUpload = page.locator('[data-testid="file-upload"]');
    await expect(fileUpload).toBeVisible();
    
    // Test normal state
    await expect(fileUpload).toHaveScreenshot('file-upload-normal-ltr.png');
    
    // Test drag over state
    await fileUpload.hover();
    await expect(fileUpload).toHaveScreenshot('file-upload-hover-ltr.png');
    
    // Test with file selected
    const fileInput = fileUpload.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Simulate file selection
      await fileInput.setInputFiles({
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      });
      await expect(fileUpload).toHaveScreenshot('file-upload-selected-ltr.png');
    }

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(fileUpload).toHaveScreenshot('file-upload-normal-rtl.png');
    
    // Test drag over state
    await fileUpload.hover();
    await expect(fileUpload).toHaveScreenshot('file-upload-hover-rtl.png');
    
    // Test with file selected
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      });
      await expect(fileUpload).toHaveScreenshot('file-upload-selected-rtl.png');
    }
  });

  test('Error Boundary component states - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible();
    
    // Test normal state
    await expect(errorBoundary).toHaveScreenshot('error-boundary-normal-ltr.png');
    
    // Test error state
    const errorButton = errorBoundary.locator('button[data-testid="error-button"]');
    if (await errorButton.isVisible()) {
      await errorButton.click();
      await expect(errorBoundary).toHaveScreenshot('error-boundary-error-ltr.png');
    }

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(errorBoundary).toHaveScreenshot('error-boundary-normal-rtl.png');
    
    // Test error state
    if (await errorButton.isVisible()) {
      await errorButton.click();
      await expect(errorBoundary).toHaveScreenshot('error-boundary-error-rtl.png');
    }
  });

  test('Offline Indicator component states - LTR vs RTL', async ({ page }) => {
    // Test LTR layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    });
    
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
    
    // Test normal state
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-normal-ltr.png');
    
    // Test offline state
    await page.context().setOffline(true);
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-offline-ltr.png');
    
    // Test online state
    await page.context().setOffline(false);
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-online-ltr.png');

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
    
    // Test normal state
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-normal-rtl.png');
    
    // Test offline state
    await page.context().setOffline(true);
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-offline-rtl.png');
    
    // Test online state
    await page.context().setOffline(false);
    await expect(offlineIndicator).toHaveScreenshot('offline-indicator-online-rtl.png');
  });
});
