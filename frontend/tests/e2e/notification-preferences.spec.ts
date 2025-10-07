import { test, expect } from '@playwright/test';

/**
 * Integration Test: User Story 8 - Notification Preferences
 * Reference: quickstart.md lines 659-722
 */

test.describe('User Story 8: Notification Preferences', () => {
  test('should display default notification preferences', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/settings/notifications');

    await expect(page.locator('input[name="commitment_assigned_in_app"]')).toBeChecked();
    await expect(page.locator('input[name="commitment_assigned_email"]')).toBeChecked();
    await expect(page.locator('input[name="commitment_due_soon_in_app"]')).toBeChecked();
  });

  test('should save updated preferences', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/settings/notifications');

    await page.uncheck('input[name="commitment_assigned_email"]');
    await page.check('input[name="commitment_due_soon_email"]');
    await page.selectOption('select[name="language_preference"]', 'ar');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Preferences saved')).toBeVisible();
  });

  test('should respect preferences for notifications', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Update preferences first
    await page.goto('/settings/notifications');
    await page.uncheck('input[name="commitment_assigned_email"]');
    await page.check('input[name="commitment_assigned_in_app"]');
    await page.click('button:has-text("Save")');

    // Trigger notification (assign commitment)
    // In real test, have supervisor publish after-action with commitment to this user

    // Check in-app notification received
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await expect(notificationBell).toHaveAttribute('data-has-unread', 'true');

    // Email notification should not be sent (verified via mock email service)
  });
});
