import { test, expect } from '@playwright/test';

/**
 * Integration Test: User Story 7 - External Commitment Tracking
 * Reference: quickstart.md lines 588-657
 */

test.describe('User Story 7: External Commitment Tracking', () => {
  test('should display external commitment with manual tracking badge', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/tasks');
    await page.click('button:has-text("External")');

    await page.click('text=Review legal framework updates');
    await expect(page.locator('text=Manual').or(page.locator('[data-tracking="manual"]'))).toBeVisible();
  });

  test('should allow manual status updates for external commitments', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/tasks');
    await page.click('text=Review legal framework updates');

    await page.click('button:has-text("Update Status")');
    await page.selectOption('select[name="status"]', 'in_progress');
    await page.fill('textarea[name="notes"]', 'Confirmed by phone');
    await page.click('button:has-text("Save")');

    await expect(page.locator('[data-status="in_progress"]')).toBeVisible();
  });

  test('should restrict internal commitment to automatic tracking', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/tasks');
    await page.click('text=Submit revised budget proposal');

    await expect(page.locator('text=Automatic').or(page.locator('[data-tracking="automatic"]'))).toBeVisible();
    await expect(page.locator('button:has-text("Update Status")')).not.toBeVisible();
  });
});
