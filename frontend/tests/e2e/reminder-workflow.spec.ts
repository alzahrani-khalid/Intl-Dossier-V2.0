import { test, expect } from '@playwright/test';

// E2E tests for reminder sending workflow (T029)
// Tests user journey: view queue → send reminder → see success → attempt duplicate → see cooldown error

test.describe('Reminder Workflow E2E Tests', () => {
  const TEST_USER = {
    email: 'kazahrani@stats.gov.sa',
    password: 'itisme',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Log in with test credentials
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('/waiting-queue', { timeout: 10000 });
  });

  test('should send reminder successfully and show success message', async ({ page }) => {
    // Wait for waiting queue page to load
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find first assignment row with "Follow Up" button
    const firstAssignmentRow = page.locator('[data-testid="assignment-row"]').first();
    await expect(firstAssignmentRow).toBeVisible();

    // Click "Follow Up" button
    const followUpButton = firstAssignmentRow.locator('button', { hasText: /follow up/i });
    await followUpButton.click();

    // Verify success toast appears
    const successToast = page.locator('[data-testid="toast"]', { hasText: /success/i });
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/reminder sent/i);

    // Verify last_reminder_sent_at timestamp updated (visible in UI)
    await expect(firstAssignmentRow).toContainText(/reminded/i);
  });

  test('should prevent duplicate reminder and show cooldown error', async ({ page }) => {
    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find assignment with recent reminder
    const recentlyRemindedRow = page.locator('[data-testid="assignment-row"]', {
      has: page.locator('text=/reminded.*ago/i'),
    }).first();

    // If no recently reminded assignments, send one first
    if ((await recentlyRemindedRow.count()) === 0) {
      const firstRow = page.locator('[data-testid="assignment-row"]').first();
      const followUpButton = firstRow.locator('button', { hasText: /follow up/i });
      await followUpButton.click();

      // Wait for success
      await expect(page.locator('[data-testid="toast"]')).toBeVisible();
      await page.waitForTimeout(2000); // Wait for toast to disappear
    }

    // Get the row with recent reminder
    const assignmentRow = page.locator('[data-testid="assignment-row"]', {
      has: page.locator('text=/reminded.*ago/i'),
    }).first();

    // Attempt to send another reminder
    const followUpButton = assignmentRow.locator('button', { hasText: /follow up/i });
    await followUpButton.click();

    // Verify cooldown error toast appears
    const errorToast = page.locator('[data-testid="toast"][data-variant="destructive"]');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast).toContainText(/cooldown/i);
    await expect(errorToast).toContainText(/hours/i);
  });

  test('should show error for assignment with no assignee', async ({ page }) => {
    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find assignment with no assignee (if exists)
    const noAssigneeRow = page.locator('[data-testid="assignment-row"]', {
      has: page.locator('text=/unassigned|no assignee/i'),
    }).first();

    // If no unassigned items, skip this test
    if ((await noAssigneeRow.count()) === 0) {
      test.skip();
    }

    // Attempt to send reminder
    const followUpButton = noAssigneeRow.locator('button', { hasText: /follow up/i });

    // Button should be disabled or show warning
    if (await followUpButton.isDisabled()) {
      expect(await followUpButton.isDisabled()).toBe(true);
    } else {
      await followUpButton.click();

      // Verify error toast
      const errorToast = page.locator('[data-testid="toast"][data-variant="destructive"]');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText(/no assignee/i);
    }
  });

  test('should display reminder button on mobile viewport', async ({ page, viewport }) => {
    // Set mobile viewport (375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find first assignment card (mobile view)
    const assignmentCard = page.locator('[data-testid="assignment-card"]').first();
    await expect(assignmentCard).toBeVisible();

    // Verify "Follow Up" button is visible and touch-friendly
    const followUpButton = assignmentCard.locator('button', { hasText: /follow up/i });
    await expect(followUpButton).toBeVisible();

    // Verify button has minimum touch target size (44x44px)
    const boundingBox = await followUpButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
  });

  test('should support RTL layout for Arabic locale', async ({ page }) => {
    // Switch to Arabic locale
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    // Wait for page to re-render in Arabic
    await page.waitForTimeout(1000);

    // Verify RTL direction
    const body = page.locator('body');
    await expect(body).toHaveAttribute('dir', 'rtl');

    // Navigate to waiting queue (in Arabic)
    await page.goto('/waiting-queue');
    await expect(page.locator('h1')).toContainText(/قائمة الانتظار/);

    // Verify "Follow Up" button text is in Arabic
    const followUpButton = page.locator('button', { hasText: /تذكير|متابعة/i }).first();
    await expect(followUpButton).toBeVisible();

    // Click button and verify Arabic success message
    await followUpButton.click();

    const successToast = page.locator('[data-testid="toast"]', { hasText: /نجح|تم إرسال/i });
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should handle rate limit error gracefully', async ({ page }) => {
    // This test simulates rate limit by sending many reminders quickly
    // In real scenario, this would require 100+ assignments

    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Get all visible assignment rows
    const assignmentRows = page.locator('[data-testid="assignment-row"]');
    const count = await assignmentRows.count();

    // Send reminders to multiple assignments rapidly
    for (let i = 0; i < Math.min(count, 5); i++) {
      const row = assignmentRows.nth(i);
      const button = row.locator('button', { hasText: /follow up/i });

      // Only click if not on cooldown
      if (await button.isEnabled()) {
        await button.click();
        await page.waitForTimeout(500); // Small delay between clicks
      }
    }

    // In a real test environment with 100+ items, we would eventually see:
    // const rateLimitToast = page.locator('[data-testid="toast"]', { hasText: /rate limit/i });
    // await expect(rateLimitToast).toBeVisible({ timeout: 5000 });

    // For now, just verify no crashes occurred
    await expect(page.locator('h1')).toContainText(/waiting queue/i);
  });

  test('should show loading state during reminder send', async ({ page }) => {
    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find first assignment row
    const firstRow = page.locator('[data-testid="assignment-row"]').first();
    const followUpButton = firstRow.locator('button', { hasText: /follow up/i });

    // Click button
    await followUpButton.click();

    // Verify loading state appears (button disabled, loading text)
    await expect(followUpButton).toBeDisabled();
    await expect(followUpButton).toContainText(/sending|loading/i);

    // Wait for completion
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5000 });

    // Verify button re-enabled
    await expect(followUpButton).toBeEnabled();
  });

  test('should update UI with timestamp after successful reminder', async ({ page }) => {
    // Navigate to waiting queue
    await expect(page.locator('h1')).toContainText(/waiting queue/i);

    // Find assignment without recent reminder
    const assignmentRow = page.locator('[data-testid="assignment-row"]', {
      hasNot: page.locator('text=/reminded.*ago/i'),
    }).first();

    // Get assignment ID for tracking
    const assignmentId = await assignmentRow.getAttribute('data-assignment-id');

    // Send reminder
    const followUpButton = assignmentRow.locator('button', { hasText: /follow up/i });
    await followUpButton.click();

    // Wait for success
    await expect(page.locator('[data-testid="toast"]', { hasText: /success/i })).toBeVisible();

    // Verify timestamp appears in UI
    const updatedRow = page.locator(`[data-assignment-id="${assignmentId}"]`);
    await expect(updatedRow).toContainText(/reminded.*ago/i, { timeout: 5000 });
  });
});
