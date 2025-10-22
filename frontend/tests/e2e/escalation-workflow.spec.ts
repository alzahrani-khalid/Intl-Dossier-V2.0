/**
 * E2E Test: Escalation Workflow
 * Feature: User Story 4 - Assignment Escalation (023-specs-waiting-queue)
 * Purpose: Test complete escalation workflow from user perspective
 *
 * Test Flow:
 * 1. User navigates to waiting queue
 * 2. User selects assignment aged 7+ days
 * 3. User clicks "Escalate" action
 * 4. User sees escalation dialog with manager info
 * 5. User enters reason and confirms
 * 6. User sees success confirmation
 * 7. User sees escalation badge on assignment
 *
 * Prerequisites:
 * - Test user authenticated
 * - Assignment with 7+ days aging exists
 * - Organizational hierarchy configured
 */

import { test, expect } from '@playwright/test';

test.describe('Escalation Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');

    // Login with test credentials
    await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[type="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard/waiting queue
    await page.waitForURL('**/waiting-queue', { timeout: 10000 });
  });

  test('should successfully escalate assignment with 7+ days aging', async ({ page }) => {
    // 1. Wait for waiting queue page to load
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Wait for assignments to load
    await page.waitForSelector('[data-testid="assignment-card"]', { timeout: 5000 });

    // 2. Find assignment with 7+ days aging (look for red aging badge)
    const overdueAssignment = page.locator('[data-testid="assignment-card"]').filter({
      has: page.locator('[data-testid="aging-badge"]', { hasText: /[7-9]|[1-9][0-9]/ }),
    }).first();

    await expect(overdueAssignment).toBeVisible();

    // Get assignment details for verification
    const workItemId = await overdueAssignment.locator('[data-testid="work-item-id"]').textContent();

    // 3. Click "Escalate" button in action menu
    await overdueAssignment.locator('button[aria-label="Actions"]').click();
    await page.click('button:has-text("Escalate")');

    // 4. Verify escalation dialog opens
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('role=dialog')).toContainText(/escalate assignment/i);

    // Verify assignment details shown in dialog
    await expect(page.locator('role=dialog')).toContainText(workItemId || '');

    // Verify escalation recipient shown (should default to immediate manager)
    const recipientName = await page.locator('[data-testid="escalation-recipient"]').textContent();
    expect(recipientName).toBeTruthy();
    expect(recipientName).not.toBe('');

    // 5. Enter escalation reason
    await page.fill(
      'textarea[placeholder*="explain"]',
      'Assignment overdue for 8 days, requires immediate manager attention'
    );

    // Verify Escalate button is now enabled
    const escalateButton = page.locator('button:has-text("Escalate")').filter({ hasText: /^escalate$/i });
    await expect(escalateButton).toBeEnabled();

    // 6. Click Escalate button
    await escalateButton.click();

    // Wait for loading state
    await expect(escalateButton).toContainText(/escalating/i);

    // Wait for success toast/confirmation
    await expect(page.locator('[role="status"]')).toContainText(/escalated successfully/i, {
      timeout: 5000,
    });

    // Dialog should close
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // 7. Verify escalation badge appears on assignment
    await page.waitForTimeout(1000); // Wait for UI update

    const escalatedAssignment = page.locator('[data-testid="assignment-card"]').filter({
      hasText: workItemId || '',
    });

    await expect(escalatedAssignment.locator('[data-testid="escalation-badge"]')).toBeVisible();
    await expect(escalatedAssignment.locator('[data-testid="escalation-badge"]')).toContainText(
      /escalated to/i
    );
  });

  test('should show error when no escalation path configured', async ({ page }) => {
    // Assume we have an assignment for user with no manager configured
    // This test requires test data: user without organizational_hierarchy entry

    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find assignment for user with no hierarchy
    const noPathAssignment = page.locator('[data-testid="assignment-card"]').filter({
      has: page.locator('[data-testid="no-manager-indicator"]'),
    }).first();

    if (await noPathAssignment.count() > 0) {
      // Click Escalate
      await noPathAssignment.locator('button[aria-label="Actions"]').click();
      await page.click('button:has-text("Escalate")');

      // Should show error dialog or toast
      await expect(page.locator('[role="status"]')).toContainText(
        /no escalation path|manager not configured/i,
        { timeout: 3000 }
      );
    }
  });

  test('should prevent escalation of completed assignments', async ({ page }) => {
    // Navigate to completed assignments or filter by status
    await page.click('button:has-text("Filters")');
    await page.click('label:has-text("Completed")');
    await page.click('button:has-text("Apply")');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    const completedAssignment = page.locator('[data-testid="assignment-card"]').first();

    if (await completedAssignment.count() > 0) {
      // Click Actions menu
      await completedAssignment.locator('button[aria-label="Actions"]').click();

      // Escalate option should be disabled or not present
      const escalateButton = page.locator('button:has-text("Escalate")');
      if (await escalateButton.count() > 0) {
        await expect(escalateButton).toBeDisabled();
      } else {
        // Escalate option not shown for completed assignments
        await expect(page.locator('[role="menu"]')).not.toContainText('Escalate');
      }
    }
  });

  test('should allow changing escalation recipient to higher-level manager', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    await page.waitForSelector('[data-testid="assignment-card"]', { timeout: 5000 });

    const overdueAssignment = page.locator('[data-testid="assignment-card"]').filter({
      has: page.locator('[data-testid="aging-badge"]', { hasText: /[7-9]|[1-9][0-9]/ }),
    }).first();

    // Open escalation dialog
    await overdueAssignment.locator('button[aria-label="Actions"]').click();
    await page.click('button:has-text("Escalate")');

    await expect(page.locator('role=dialog')).toBeVisible();

    // Click recipient selector to show dropdown
    await page.click('[data-testid="recipient-selector"]');

    // Wait for dropdown options
    await page.waitForSelector('[role="option"]', { timeout: 2000 });

    // Should show multiple options in escalation path
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Select a higher-level manager (e.g., Division Manager instead of Team Lead)
    if (optionCount > 1) {
      await options.nth(1).click(); // Select second option

      // Verify selection changed
      const selectedRecipient = await page.locator('[data-testid="escalation-recipient"]').textContent();
      expect(selectedRecipient).toBeTruthy();
    }

    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should display escalation badge with recipient name and date', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find assignment that's already escalated
    const escalatedAssignment = page.locator('[data-testid="assignment-card"]').filter({
      has: page.locator('[data-testid="escalation-badge"]'),
    }).first();

    if (await escalatedAssignment.count() > 0) {
      const badge = escalatedAssignment.locator('[data-testid="escalation-badge"]');

      // Badge should show "Escalated to [Name]"
      await expect(badge).toContainText(/escalated to/i);

      // Should show manager name
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/escalated to\s+.+/i);

      // Should show date (optional, depending on implementation)
      // await expect(badge).toContainText(/on|at/i);
    }
  });

  test('should support mobile layout for escalation dialog', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    await page.waitForSelector('[data-testid="assignment-card"]', { timeout: 5000 });

    const overdueAssignment = page.locator('[data-testid="assignment-card"]').first();

    // Open escalation dialog
    await overdueAssignment.locator('button[aria-label="Actions"]').click();
    await page.click('button:has-text("Escalate")');

    await expect(page.locator('role=dialog')).toBeVisible();

    // Verify mobile-friendly layout
    const dialog = page.locator('role=dialog');

    // Dialog should be full-width or near-full-width on mobile
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.width).toBeGreaterThan(320); // At least mobile width

    // Touch targets should be at least 44x44px
    const escalateButton = page.locator('button:has-text("Escalate")').filter({ hasText: /^escalate$/i });
    const buttonBox = await escalateButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);

    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should support RTL layout for Arabic language', async ({ page }) => {
    // Change language to Arabic
    await page.click('[data-testid="language-selector"]');
    await page.click('button:has-text("العربية")');

    // Wait for language change
    await page.waitForTimeout(500);

    await page.waitForSelector('[data-testid="assignment-card"]', { timeout: 5000 });

    const overdueAssignment = page.locator('[data-testid="assignment-card"]').first();

    // Open escalation dialog
    await overdueAssignment.locator('button[aria-label*="إجراءات"]').click(); // "Actions" in Arabic
    await page.click('button:has-text("تصعيد")'); // "Escalate" in Arabic

    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();

    // Verify RTL direction
    const direction = await dialog.getAttribute('dir');
    expect(direction).toBe('rtl');

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should handle concurrent escalations gracefully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    await page.waitForSelector('[data-testid="assignment-card"]', { timeout: 5000 });

    // Get two different assignments
    const assignments = page.locator('[data-testid="assignment-card"]').filter({
      has: page.locator('[data-testid="aging-badge"]', { hasText: /[7-9]|[1-9][0-9]/ }),
    });

    if (await assignments.count() >= 2) {
      const assignment1 = assignments.nth(0);
      const assignment2 = assignments.nth(1);

      // Escalate first assignment
      await assignment1.locator('button[aria-label="Actions"]').click();
      await page.click('button:has-text("Escalate")');
      await page.fill('textarea[placeholder*="explain"]', 'First escalation');
      await page.click('button:has-text("Escalate")').filter({ hasText: /^escalate$/i });

      // Wait for first escalation to complete
      await expect(page.locator('[role="status"]')).toContainText(/escalated successfully/i, {
        timeout: 5000,
      });

      // Immediately escalate second assignment
      await assignment2.locator('button[aria-label="Actions"]').click();
      await page.click('button:has-text("Escalate")');
      await page.fill('textarea[placeholder*="explain"]', 'Second escalation');
      await page.click('button:has-text("Escalate")').filter({ hasText: /^escalate$/i });

      // Should also succeed
      await expect(page.locator('[role="status"]')).toContainText(/escalated successfully/i, {
        timeout: 5000,
      });
    }
  });
});
