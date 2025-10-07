import { test, expect, chromium } from '@playwright/test';

/**
 * E2E Test: Approval Flow with Multiple Users (T084)
 * Tests complete approval workflow across multiple user contexts
 *
 * Validates:
 * - Drafter creates and submits position
 * - Approver 1 reviews and approves at stage 1
 * - Approver 2 reviews and approves at stage 2
 * - Position status transitions correctly
 * - Notifications sent to next approver
 */

test.describe('Multi-User Approval Flow', () => {
  test('should complete full approval workflow with three users', async () => {
    const browser = await chromium.launch();

    // Create three user contexts: drafter, approver1, approver2
    const drafterContext = await browser.newContext();
    const approver1Context = await browser.newContext();
    const approver2Context = await browser.newContext();

    const drafterPage = await drafterContext.newPage();
    const approver1Page = await approver1Context.newPage();
    const approver2Page = await approver2Context.newPage();

    try {
      // Login as drafter
      await drafterPage.goto('/login');
      await drafterPage.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
      await drafterPage.fill('[data-testid="password-input"]', 'TestPassword123!');
      await drafterPage.click('[data-testid="login-button"]');
      await expect(drafterPage).toHaveURL(/\/dashboard/, { timeout: 5000 });

      // Step 1: Drafter creates new position
      await drafterPage.goto('/positions');
      await drafterPage.click('[data-testid="new-position-button"]');

      // Fill position form
      await drafterPage.selectOption('[data-testid="position-type-select"]', 'Standard Position');
      await drafterPage.fill('[data-testid="title-en-input"]', 'Test Position for Approval');
      await drafterPage.fill('[data-testid="title-ar-input"]', 'موقف اختبار للموافقة');
      await drafterPage.fill('[data-testid="content-en-editor"]', 'English content for testing approval workflow');
      await drafterPage.fill('[data-testid="content-ar-editor"]', 'محتوى عربي لاختبار سير عمل الموافقة');
      await drafterPage.selectOption('[data-testid="thematic-category-select"]', 'Trade Policy');
      await drafterPage.check('[data-testid="audience-group-management"]');

      // Save draft
      await drafterPage.click('[data-testid="save-draft-button"]');
      await expect(drafterPage.locator('[data-testid="success-toast"]')).toContainText('Draft saved');

      // Get position ID from URL
      const positionUrl = drafterPage.url();
      const positionId = positionUrl.match(/\/positions\/([^\/]+)/)?.[1];
      expect(positionId).toBeDefined();

      // Submit for review
      await drafterPage.click('[data-testid="submit-review-button"]');
      await drafterPage.click('[data-testid="confirm-submit-button"]');
      await expect(drafterPage.locator('[data-testid="success-toast"]')).toContainText('Submitted for review');

      // Verify status changed to under_review
      await expect(drafterPage.locator('[data-testid="position-status"]')).toContainText('Under Review');

      // Login as approver 1
      await approver1Page.goto('/login');
      await approver1Page.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
      await approver1Page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await approver1Page.click('[data-testid="login-button"]');
      await expect(approver1Page).toHaveURL(/\/dashboard/, { timeout: 5000 });

      // Step 2: Approver 1 navigates to My Approvals
      await approver1Page.goto('/approvals');

      // Find pending approval
      await expect(approver1Page.locator(`[data-testid="pending-position-${positionId}"]`)).toBeVisible();
      await approver1Page.click(`[data-testid="pending-position-${positionId}"]`);

      // View position details
      await expect(approver1Page.locator('[data-testid="position-title-en"]')).toContainText('Test Position for Approval');
      await expect(approver1Page.locator('[data-testid="approval-stage"]')).toContainText('Stage 1');

      // Approve (requires step-up)
      await approver1Page.click('[data-testid="approve-button"]');

      // Complete step-up MFA
      await expect(approver1Page.locator('[data-testid="step-up-modal"]')).toBeVisible();
      await approver1Page.fill('[data-testid="mfa-code-input"]', '123456');
      await approver1Page.click('[data-testid="verify-mfa-button"]');

      // Add approval comments
      await approver1Page.fill('[data-testid="approval-comments"]', 'Approved at stage 1');
      await approver1Page.click('[data-testid="confirm-approval-button"]');

      // Verify approval success
      await expect(approver1Page.locator('[data-testid="success-toast"]')).toContainText('Position approved');

      // Login as approver 2
      await approver2Page.goto('/login');
      await approver2Page.fill('[data-testid="email-input"]', 'approver2@gastat.gov.sa');
      await approver2Page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await approver2Page.click('[data-testid="login-button"]');
      await expect(approver2Page).toHaveURL(/\/dashboard/, { timeout: 5000 });

      // Step 3: Approver 2 navigates to My Approvals
      await approver2Page.goto('/approvals');

      // Find position now at stage 2
      await expect(approver2Page.locator(`[data-testid="pending-position-${positionId}"]`)).toBeVisible();
      await approver2Page.click(`[data-testid="pending-position-${positionId}"]`);

      // View position details
      await expect(approver2Page.locator('[data-testid="approval-stage"]')).toContainText('Stage 2');

      // View approval history
      await expect(approver2Page.locator('[data-testid="approval-history"]')).toContainText('Stage 1');
      await expect(approver2Page.locator('[data-testid="approval-history"]')).toContainText('Approved');

      // Approve at stage 2
      await approver2Page.click('[data-testid="approve-button"]');

      // Complete step-up MFA
      await expect(approver2Page.locator('[data-testid="step-up-modal"]')).toBeVisible();
      await approver2Page.fill('[data-testid="mfa-code-input"]', '123456');
      await approver2Page.click('[data-testid="verify-mfa-button"]');

      // Add approval comments
      await approver2Page.fill('[data-testid="approval-comments"]', 'Approved at stage 2');
      await approver2Page.click('[data-testid="confirm-approval-button"]');

      // Verify approval success
      await expect(approver2Page.locator('[data-testid="success-toast"]')).toContainText('Position approved');

      // Step 4: Drafter verifies final status
      await drafterPage.goto(`/positions/${positionId}`);
      await expect(drafterPage.locator('[data-testid="position-status"]')).toContainText('Approved');

      // Verify approval chain shows both approvals
      await expect(drafterPage.locator('[data-testid="approval-chain"]')).toContainText('Stage 1: Approved');
      await expect(drafterPage.locator('[data-testid="approval-chain"]')).toContainText('Stage 2: Approved');

    } finally {
      await drafterContext.close();
      await approver1Context.close();
      await approver2Context.close();
      await browser.close();
    }
  });

  test('should handle notifications between approval stages', async () => {
    const browser = await chromium.launch();
    const drafterContext = await browser.newContext();
    const approverContext = await browser.newContext();

    const drafterPage = await drafterContext.newPage();
    const approverPage = await approverContext.newPage();

    try {
      // Login as drafter and submit position
      await drafterPage.goto('/login');
      await drafterPage.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
      await drafterPage.fill('[data-testid="password-input"]', 'TestPassword123!');
      await drafterPage.click('[data-testid="login-button"]');

      await drafterPage.goto('/positions');
      await drafterPage.click('[data-testid="new-position-button"]');

      // Create and submit position
      await drafterPage.selectOption('[data-testid="position-type-select"]', 'Standard Position');
      await drafterPage.fill('[data-testid="title-en-input"]', 'Notification Test Position');
      await drafterPage.fill('[data-testid="title-ar-input"]', 'موقف اختبار الإشعارات');
      await drafterPage.fill('[data-testid="content-en-editor"]', 'Content');
      await drafterPage.fill('[data-testid="content-ar-editor"]', 'المحتوى');

      await drafterPage.click('[data-testid="save-draft-button"]');
      await drafterPage.click('[data-testid="submit-review-button"]');
      await drafterPage.click('[data-testid="confirm-submit-button"]');

      // Login as approver
      await approverPage.goto('/login');
      await approverPage.fill('[data-testid="email-input"]', 'approver1@gastat.gov.sa');
      await approverPage.fill('[data-testid="password-input"]', 'TestPassword123!');
      await approverPage.click('[data-testid="login-button"]');

      // Check for notification
      await approverPage.click('[data-testid="notifications-bell"]');
      await expect(approverPage.locator('[data-testid="notification-list"]')).toContainText('Notification Test Position');
      await expect(approverPage.locator('[data-testid="notification-list"]')).toContainText('pending your approval');

    } finally {
      await drafterContext.close();
      await approverContext.close();
      await browser.close();
    }
  });
});
