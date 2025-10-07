import { test, expect } from '@playwright/test';

/**
 * Integration Test: User Story 6 - Generate Bilingual PDF
 * Reference: quickstart.md lines 516-586
 */

test.describe('User Story 6: Generate Bilingual PDF', () => {
  test('should generate bilingual PDF', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-status="published"]');

    await page.click('button:has-text("Generate PDF")');
    await page.click('input[value="both"]');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Generating PDF')).toBeVisible();
    await expect(page.locator('a[href*=".pdf"]')).toBeVisible({ timeout: 5000 });
  });

  test('should require MFA for confidential PDF', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-supervisor@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-confidential="true"]');

    await page.click('button:has-text("Generate PDF")');
    await expect(page.locator('text=Additional authentication required')).toBeVisible();
  });
});
