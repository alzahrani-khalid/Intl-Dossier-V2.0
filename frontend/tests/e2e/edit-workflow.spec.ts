import { test, expect } from '@playwright/test';

/**
 * Integration Test: User Story 5 - Request and Approve Edits
 * Reference: quickstart.md lines 407-514
 */

test.describe('User Story 5: Request and Approve Edits', () => {
  const staffEmail = 'test-staff@gastat.gov.sa';
  const supervisorEmail = 'test-supervisor@gastat.gov.sa';

  test('should allow staff to request edit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', staffEmail);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-status="published"]');

    await expect(page.locator('button:has-text("Request Edit")')).toBeVisible();
    await page.click('button:has-text("Request Edit")');

    await page.fill('textarea[name="reason"]', 'Incorrect due date for budget proposal commitment');
    await page.fill('input[name="commitments.0.due_date"]', '2025-10-08');
    await page.click('button:has-text("Submit")');

    await expect(page.locator('text=Edit request submitted')).toBeVisible();
    await expect(page.locator('[data-status="edit_requested"]')).toBeVisible();
  });

  test('should allow supervisor to review and approve edit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', supervisorEmail);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-status="edit_requested"]');

    await page.click('button:has-text("Review Edit Request")');

    // Verify diff view
    await expect(page.locator('text=Current version')).toBeVisible();
    await expect(page.locator('text=Proposed changes')).toBeVisible();

    await page.click('button:has-text("Approve")');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Version 2')).toBeVisible();
    await expect(page.locator('[data-status="published"]')).toBeVisible();
  });

  test('should allow supervisor to reject edit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', supervisorEmail);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-status="edit_requested"]');

    await page.click('button:has-text("Review Edit Request")');
    await page.click('button:has-text("Reject")');
    await page.fill('textarea[name="rejection_reason"]', 'Coordinate with owner first');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Edit request rejected')).toBeVisible();
    await expect(page.locator('text=Version 1').first()).toBeVisible(); // No new version
  });
});
