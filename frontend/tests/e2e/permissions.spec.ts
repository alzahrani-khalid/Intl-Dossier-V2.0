import { test, expect } from '@playwright/test';

/**
 * E2E Test: Permission Model (T054)
 * Tests hybrid permission model (owner + admin/manager)
 *
 * Validates:
 * - Owner can edit their dossier
 * - Admin can edit any dossier
 * - Analyst cannot edit (only view if clearance sufficient)
 * - Analyst with low clearance cannot view high sensitivity dossier
 */

test.describe('Dossier Permissions', () => {
  const dossierId = '123e4567-e89b-12d3-a456-426614174000';

  test('owner can edit their assigned dossier', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'dossier.owner@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Navigate to owned dossier
    await page.goto(`/dossiers/${dossierId}`);

    // Assert edit button is visible
    await expect(page.locator('[data-testid="edit-dossier-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-dossier-button"]')).not.toBeDisabled();

    // Click edit button
    await page.click('[data-testid="edit-dossier-button"]');

    // Assert edit form appears
    await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();

    // Edit summary
    await page.fill('[data-testid="summary-en-input"]', 'Updated by owner');

    // Save changes
    await page.click('[data-testid="save-changes-button"]');

    // Assert save succeeds
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });
  });

  test('admin can edit any dossier', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Navigate to any dossier (not owned by admin)
    await page.goto(`/dossiers/${dossierId}`);

    // Assert edit button is visible
    await expect(page.locator('[data-testid="edit-dossier-button"]')).toBeVisible();

    // Click edit and modify
    await page.click('[data-testid="edit-dossier-button"]');
    await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();

    await page.fill('[data-testid="summary-en-input"]', 'Updated by admin');
    await page.click('[data-testid="save-changes-button"]');

    // Assert save succeeds
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });
  });

  test('manager can edit any dossier', async ({ page }) => {
    // Login as manager
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'manager.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    await page.goto(`/dossiers/${dossierId}`);

    // Assert edit button is visible
    await expect(page.locator('[data-testid="edit-dossier-button"]')).toBeVisible();

    await page.click('[data-testid="edit-dossier-button"]');
    await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();

    await page.fill('[data-testid="summary-en-input"]', 'Updated by manager');
    await page.click('[data-testid="save-changes-button"]');

    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });
  });

  test('analyst cannot edit dossier (only view)', async ({ page }) => {
    // Login as analyst
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'analyst.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    await page.goto(`/dossiers/${dossierId}`);

    // Assert can view dossier
    await expect(page.locator('[data-testid="dossier-header"]')).toBeVisible();

    // Assert edit button is NOT visible or disabled
    const editButton = page.locator('[data-testid="edit-dossier-button"]');
    await expect(editButton).not.toBeVisible().catch(() => {
      // If visible, should be disabled
      expect(editButton).toBeDisabled();
    });
  });

  test('analyst with low clearance cannot view high sensitivity dossier', async ({ page }) => {
    // Login as analyst with low clearance
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'analyst.low@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Try to navigate to high sensitivity dossier
    const highSensitivityDossierId = 'high-sensitivity-dossier-id';
    await page.goto(`/dossiers/${highSensitivityDossierId}`);

    // Assert 403 Forbidden or access denied message
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-denied"]')).toContainText(/access.*denied|insufficient.*clearance/i);
  });

  test('analyst with medium clearance can view medium sensitivity dossier', async ({ page }) => {
    // Login as analyst with medium clearance
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'analyst.medium@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Navigate to medium sensitivity dossier
    const mediumSensitivityDossierId = 'medium-sensitivity-dossier-id';
    await page.goto(`/dossiers/${mediumSensitivityDossierId}`);

    // Assert can view
    await expect(page.locator('[data-testid="dossier-header"]')).toBeVisible();

    // Assert sensitivity badge shows "medium"
    await expect(page.locator('[data-testid="dossier-sensitivity-badge"]')).toContainText(/medium/i);
  });

  test('dossier list filters by user clearance level', async ({ page }) => {
    // Login as analyst with low clearance
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'analyst.low@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Navigate to dossiers hub
    await page.goto('/dossiers');

    // Assert only low sensitivity dossiers are shown
    const sensitivityBadges = page.locator('[data-testid="dossier-sensitivity-badge"]');
    const count = await sensitivityBadges.count();

    for (let i = 0; i < count; i++) {
      const badgeText = await sensitivityBadges.nth(i).textContent();
      expect(badgeText?.toLowerCase()).toBe('low');
    }

    // Assert high/medium dossiers are NOT in the list
    await expect(page.locator('[data-testid="dossier-card-high-sensitivity"]')).not.toBeVisible();
  });

  test('archive permission follows edit permission', async ({ page }) => {
    // Login as analyst (cannot edit)
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'analyst.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    await page.goto(`/dossiers/${dossierId}`);

    // Assert archive button is NOT visible or disabled
    const archiveButton = page.locator('[data-testid="archive-dossier-button"]');
    await expect(archiveButton).not.toBeVisible().catch(() => {
      expect(archiveButton).toBeDisabled();
    });
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    // Try to access dossier without authentication
    await page.goto(`/dossiers/${dossierId}`);

    // Assert redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});