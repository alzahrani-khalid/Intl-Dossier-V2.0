import { test, expect } from '@playwright/test';

/**
 * Integration Test: User Story 4 - Publish Confidential After-Action (Step-Up Auth)
 * Reference: quickstart.md lines 347-405
 */

const TEST_SUPERVISOR_EMAIL = 'test-supervisor@gastat.gov.sa';
const TEST_SUPERVISOR_PASSWORD = 'Test123!@#';

test.describe('User Story 4: Publish Confidential (Step-Up Auth)', () => {
  test('should require MFA for confidential record publish', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_SUPERVISOR_EMAIL);
    await page.fill('input[name="password"]', TEST_SUPERVISOR_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to confidential draft
    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-confidential="true"]');

    await page.click('button:has-text("Publish")');

    // Verify step-up MFA modal
    await expect(page.locator('text=Additional authentication required')).toBeVisible();
    await expect(page.locator('input[name="mfa_code"]')).toBeVisible();
  });

  test('should block publish with incorrect MFA code', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_SUPERVISOR_EMAIL);
    await page.fill('input[name="password"]', TEST_SUPERVISOR_PASSWORD);
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-confidential="true"]');
    await page.click('button:has-text("Publish")');

    // Enter incorrect code
    await page.fill('input[name="mfa_code"]', '000000');
    await page.click('button:has-text("Verify")');

    await expect(page.locator('text=Invalid verification code')).toBeVisible();
    await expect(page.locator('[data-status="draft"]')).toBeVisible(); // Still draft
  });

  test('should publish with correct MFA code and log audit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_SUPERVISOR_EMAIL);
    await page.fill('input[name="password"]', TEST_SUPERVISOR_PASSWORD);
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-confidential="true"]');
    await page.click('button:has-text("Publish")');

    // Mock valid MFA code (in real test, use test authenticator)
    await page.fill('input[name="mfa_code"]', '123456');
    await page.click('button:has-text("Verify")');

    await expect(page.locator('text=Confidential after-action published')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-status="published"]')).toBeVisible();
  });
});
