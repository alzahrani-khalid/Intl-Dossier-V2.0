import { test, expect } from '@playwright/test';

/**
 * E2E Test: Generate Brief Fallback Path (T053)
 * Tests manual template fallback when AI unavailable
 */

test.describe('Generate Brief - Fallback Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should show manual template when AI service unavailable', async ({ page }) => {
    // Mock AI service unavailable (503)
    await page.route('**/api/dossiers/*/briefs', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message_en: 'AI service temporarily unavailable',
            message_ar: 'خدمة الذكاء الاصطناعي غير متوفرة مؤقتًا',
          },
          fallback: {
            template: {
              sections: [
                {
                  id: 'summary',
                  title_en: 'Executive Summary',
                  title_ar: 'ملخص تنفيذي',
                  placeholder_en: 'Enter executive summary...',
                  placeholder_ar: 'أدخل الملخص التنفيذي...',
                  required: true,
                },
              ],
            },
            pre_populated_data: {
              dossier_name: 'Saudi Arabia Relations',
              type: 'country',
            },
          },
        }),
      });
    });

    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await page.click('[data-testid="generate-brief-button"]');

    // Assert fallback template appears
    await expect(page.locator('[data-testid="brief-fallback-form"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="fallback-message"]')).toContainText(/unavailable|manually/i);

    // Assert template has pre-populated data
    await expect(page.locator('[data-testid="prepopulated-dossier-name"]')).toContainText('Saudi Arabia');

    // Fill manual sections
    await page.fill('[data-testid="section-summary-en"]', 'Manual executive summary');
    await page.fill('[data-testid="section-summary-ar"]', 'ملخص تنفيذي يدوي');

    // Submit manual brief
    await page.click('[data-testid="submit-manual-brief"]');

    // Assert brief saved successfully
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="brief-content"]')).toBeVisible();
  });

  test('should validate required fields in manual template', async ({ page }) => {
    await page.route('**/api/dossiers/*/briefs', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'AI_SERVICE_UNAVAILABLE', message_en: 'Service unavailable', message_ar: 'غير متوفر' },
          fallback: {
            template: { sections: [{ id: 'summary', title_en: 'Summary', title_ar: 'ملخص', required: true }] },
            pre_populated_data: {},
          },
        }),
      });
    });

    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);
    await page.click('[data-testid="generate-brief-button"]');

    await expect(page.locator('[data-testid="brief-fallback-form"]')).toBeVisible();

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-manual-brief"]');

    // Assert validation errors
    await expect(page.locator('[data-testid="error-section-summary"]')).toBeVisible();
  });
});