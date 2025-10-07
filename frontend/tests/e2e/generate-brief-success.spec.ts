import { test, expect } from '@playwright/test';

/**
 * E2E Test: Generate Brief Success Path (T052)
 * Tests successful AI brief generation
 */

test.describe('Generate Brief - Success Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should generate brief with AI successfully', async ({ page }) => {
    // Mock successful AI response
    await page.route('**/api/dossiers/*/briefs', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'brief-123',
          dossier_id: '123e4567-e89b-12d3-a456-426614174000',
          content_en: {
            summary: 'Executive summary of bilateral relations...',
            sections: [
              { title: 'Recent Activity', content: 'Three high-level meetings...' },
              { title: 'Open Commitments', content: 'Five pending commitments...' },
            ],
          },
          content_ar: {
            summary: 'ملخص تنفيذي للعلاقات الثنائية...',
            sections: [
              { title: 'النشاط الأخير', content: 'ثلاثة اجتماعات رفيعة المستوى...' },
              { title: 'الالتزامات المفتوحة', content: 'خمسة التزامات معلقة...' },
            ],
          },
          generated_by: 'ai',
          generated_at: new Date().toISOString(),
        }),
      });
    });

    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    // Click "Generate Brief" button
    await page.click('[data-testid="generate-brief-button"]');

    // Assert loading indicator appears
    await expect(page.locator('[data-testid="brief-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="brief-countdown"]')).toBeVisible();

    // Assert brief loads within timeout
    await expect(page.locator('[data-testid="brief-content"]')).toBeVisible({ timeout: 65000 });

    // Assert brief displays bilingual content
    await expect(page.locator('[data-testid="brief-summary-en"]')).toContainText('Executive summary');
    await expect(page.locator('[data-testid="brief-section-0"]')).toContainText('Recent Activity');

    // Toggle to Arabic
    await page.click('[data-testid="language-toggle"]');
    await expect(page.locator('[data-testid="brief-summary-ar"]')).toContainText('ملخص تنفيذي');
  });

  test('should show progress indicator during generation', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await page.click('[data-testid="generate-brief-button"]');

    // Assert countdown timer is shown
    await expect(page.locator('[data-testid="brief-countdown"]')).toBeVisible();

    // Assert countdown decrements
    const initialTime = await page.locator('[data-testid="brief-countdown"]').textContent();
    await page.waitForTimeout(2000);
    const laterTime = await page.locator('[data-testid="brief-countdown"]').textContent();
    expect(initialTime).not.toBe(laterTime);
  });
});