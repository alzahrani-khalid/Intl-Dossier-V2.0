import { test, expect } from '@playwright/test';

/**
 * Edge Case Test: Permission Check (Dossier Assignment)
 * Reference: quickstart.md lines 765-768
 */

test.describe('Edge Case: Permission - Dossier Assignment', () => {
  test('should block access to after-action if not assigned to dossier', async ({ page }) => {
    // Login as user not assigned to dossier
    await page.goto('/login');
    await page.fill('input[name="email"]', 'unassigned-user@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Try to access after-action from dossier user is not assigned to
    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');

    // Verify 403 error or redirect
    await expect(page.locator('text=403').or(page.locator('text=Forbidden'))).toBeVisible();
    await expect(page.locator('text=You do not have access to this resource')).toBeVisible();
  });

  test('should block direct after-action URL access without dossier assignment', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'unassigned-user@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Try to access after-action directly by ID
    await page.goto('/_protected/after-actions/33333333-3333-3333-3333-333333333333');

    await expect(page.locator('text=403').or(page.locator('text=You do not have access'))).toBeVisible();
  });
});
