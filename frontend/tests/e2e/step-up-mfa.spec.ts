import { test, expect } from '@playwright/test';

/**
 * E2E Test: Step-Up MFA Challenge (T087)
 * Tests step-up authentication for approvals
 *
 * Validates:
 * - Navigate to approval dashboard
 * - Click Approve triggers step-up modal
 * - Enter TOTP code
 * - Verify elevated token obtained
 * - Approval succeeds with step-up
 */

test.describe('Step-Up MFA Challenge', () => {
  test('should trigger step-up modal when approving position', async ({ page }) => {
    // Login as approver
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to My Approvals dashboard
    await page.goto('/approvals');

    // Click on pending position
    await page.click('[data-testid="pending-position"]').first();

    // Click Approve button
    await page.click('[data-testid="approve-button"]');

    // Verify step-up modal appears
    await expect(page.locator('[data-testid="step-up-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-up-title"]')).toContainText('Additional Verification Required');
    await expect(page.locator('[data-testid="step-up-title"]')).toContainText('التحقق الإضافي مطلوب');
  });

  test('should complete step-up and approve position', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/approvals');
    await page.click('[data-testid="pending-position"]').first();
    await page.click('[data-testid="approve-button"]');

    // Step-up modal visible
    await expect(page.locator('[data-testid="step-up-modal"]')).toBeVisible();

    // Enter TOTP code
    await page.fill('[data-testid="mfa-code-input"]', '123456');

    // Verify countdown timer visible
    await expect(page.locator('[data-testid="challenge-timer"]')).toBeVisible();

    // Click verify button
    await page.click('[data-testid="verify-mfa-button"]');

    // Wait for elevated token obtained
    await expect(page.locator('[data-testid="step-up-modal"]')).not.toBeVisible({ timeout: 3000 });

    // Approval form now enabled
    await page.fill('[data-testid="approval-comments"]', 'Approved with step-up');
    await page.click('[data-testid="confirm-approval-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('approved');
  });

  test('should show error on invalid MFA code', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/approvals');
    await page.click('[data-testid="pending-position"]').first();
    await page.click('[data-testid="approve-button"]');

    // Enter invalid code
    await page.fill('[data-testid="mfa-code-input"]', '000000');
    await page.click('[data-testid="verify-mfa-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="mfa-error"]')).toContainText('Invalid code');
    await expect(page.locator('[data-testid="mfa-error"]')).toContainText('رمز غير صالح');
  });

  test('should auto-trigger step-up before approval actions', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/approvals');
    await page.click('[data-testid="pending-position"]').first();

    // ANY approval action should trigger step-up
    await page.click('[data-testid="approve-button"]');
    await expect(page.locator('[data-testid="step-up-modal"]')).toBeVisible();

    // Close modal
    await page.click('[data-testid="close-step-up-modal"]');

    // Try request revisions - should also trigger step-up
    await page.click('[data-testid="request-revisions-button"]');
    await expect(page.locator('[data-testid="step-up-modal"]')).toBeVisible();
  });
});
