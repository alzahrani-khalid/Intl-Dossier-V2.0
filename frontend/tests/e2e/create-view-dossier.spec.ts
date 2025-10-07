import { test, expect } from '@playwright/test';

/**
 * E2E Test: Create and View Dossier (T048)
 * Tests the complete flow from hub → create → detail page
 *
 * Validates:
 * - Navigation to dossiers hub
 * - Create dossier button click
 * - Form completion (bilingual)
 * - Successful submission
 * - Redirect to detail page
 * - Header displays name
 * - Stats loaded
 * - Timeline displays
 */

test.describe('Create and View Dossier Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.manager@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should create and view dossier successfully', async ({ page }) => {
    // Step 1: Navigate to dossiers hub
    await page.goto('/dossiers');
    await expect(page).toHaveURL('/dossiers');
    await expect(page.locator('h1')).toContainText(/dossiers|hub/i);

    // Step 2: Click "Create Dossier" button
    await page.click('[data-testid="create-dossier-button"]');

    // Wait for create form modal or page
    await expect(page.locator('[data-testid="create-dossier-form"]')).toBeVisible();

    // Step 3: Fill in dossier name (English)
    const nameEn = 'Saudi Arabia Bilateral Relations';
    await page.fill('[data-testid="name-en-input"]', nameEn);
    await expect(page.locator('[data-testid="name-en-input"]')).toHaveValue(nameEn);

    // Step 4: Fill in dossier name (Arabic)
    const nameAr = 'العلاقات الثنائية مع المملكة العربية السعودية';
    await page.fill('[data-testid="name-ar-input"]', nameAr);
    await expect(page.locator('[data-testid="name-ar-input"]')).toHaveValue(nameAr);

    // Step 5: Select type
    await page.click('[data-testid="type-country"]');
    await expect(page.locator('[data-testid="type-country"]')).toHaveClass(/selected|checked/);

    // Step 6: Select sensitivity level
    await page.selectOption('[data-testid="sensitivity-select"]', 'high');
    await expect(page.locator('[data-testid="sensitivity-select"]')).toHaveValue('high');

    // Step 7: Fill summary (English)
    const summaryEn =
      'Comprehensive bilateral relations covering trade agreements, security cooperation, ' +
      'and cultural exchange programs. Strategic partnership focused on mutual economic development.';
    await page.fill('[data-testid="summary-en-input"]', summaryEn);
    await expect(page.locator('[data-testid="summary-en-input"]')).toHaveValue(summaryEn);

    // Step 8: Fill summary (Arabic)
    const summaryAr =
      'علاقات ثنائية شاملة تغطي الاتفاقيات التجارية والتعاون الأمني ' +
      'وبرامج التبادل الثقافي. شراكة استراتيجية تركز على التنمية الاقتصادية المشتركة.';
    await page.fill('[data-testid="summary-ar-input"]', summaryAr);
    await expect(page.locator('[data-testid="summary-ar-input"]')).toHaveValue(summaryAr);

    // Step 9: Add tags
    await page.fill('[data-testid="tags-input"]', 'bilateral');
    await page.keyboard.press('Enter');
    await page.fill('[data-testid="tags-input"]', 'strategic');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="tag-badge-bilateral"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-badge-strategic"]')).toBeVisible();

    // Step 10: Submit form
    await page.click('[data-testid="submit-dossier-button"]');

    // Wait for submission to complete
    await expect(page.locator('[data-testid="submit-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-loading"]')).not.toBeVisible({ timeout: 10000 });

    // Step 11: Assert redirected to detail page
    await expect(page).toHaveURL(/\/dossiers\/[a-f0-9-]+$/);

    // Extract dossier ID from URL
    const url = page.url();
    const dossierId = url.split('/').pop();
    expect(dossierId).toMatch(/^[a-f0-9-]+$/);

    // Step 12: Assert header shows dossier name
    await expect(page.locator('[data-testid="dossier-header-name"]')).toContainText(nameEn);

    // Step 13: Assert stats are loaded
    await expect(page.locator('[data-testid="dossier-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-engagements"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-positions"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-commitments"]')).toBeVisible();

    // Step 14: Assert timeline tab is active and displayed
    await expect(page.locator('[data-testid="tab-timeline"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Step 15: Verify version is 1 (new dossier)
    await expect(page.locator('[data-testid="dossier-version"]')).toContainText('1');

    // Step 16: Verify bilingual content toggle works
    await page.click('[data-testid="language-toggle"]');
    await expect(page.locator('[data-testid="dossier-header-name"]')).toContainText(nameAr);
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Navigate to dossiers hub
    await page.goto('/dossiers');
    await page.click('[data-testid="create-dossier-button"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-dossier-button"]');

    // Assert validation errors are displayed
    await expect(page.locator('[data-testid="error-name-en"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-name-en"]')).toContainText(/required/i);

    await expect(page.locator('[data-testid="error-name-ar"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-name-ar"]')).toContainText(/required/i);

    await expect(page.locator('[data-testid="error-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-type"]')).toContainText(/required/i);
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/dossiers');
    await page.click('[data-testid="create-dossier-button"]');

    // Fill minimum required fields
    await page.fill('[data-testid="name-en-input"]', 'Test Dossier');
    await page.fill('[data-testid="name-ar-input"]', 'ملف اختبار');
    await page.click('[data-testid="type-country"]');

    // Click submit
    await page.click('[data-testid="submit-dossier-button"]');

    // Assert loading spinner is visible
    await expect(page.locator('[data-testid="submit-loading"]')).toBeVisible();

    // Assert submit button is disabled during submission
    await expect(page.locator('[data-testid="submit-dossier-button"]')).toBeDisabled();
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/dossiers', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message_en: 'Failed to create dossier',
            message_ar: 'فشل في إنشاء الملف',
          },
        }),
      });
    });

    await page.goto('/dossiers');
    await page.click('[data-testid="create-dossier-button"]');

    // Fill form and submit
    await page.fill('[data-testid="name-en-input"]', 'Test Dossier');
    await page.fill('[data-testid="name-ar-input"]', 'ملف اختبار');
    await page.click('[data-testid="type-country"]');
    await page.click('[data-testid="submit-dossier-button"]');

    // Assert error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/failed/i);

    // Assert user can retry
    await expect(page.locator('[data-testid="submit-dossier-button"]')).not.toBeDisabled();
  });
});