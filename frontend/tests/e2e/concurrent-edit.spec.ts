import { test, expect, chromium } from '@playwright/test';

/**
 * E2E Test: Concurrent Edit Conflict (T050)
 * Tests optimistic locking and conflict resolution
 *
 * Validates:
 * - Open dossier in two contexts (different users or tabs)
 * - Tab 1: Edit summary, save successfully
 * - Tab 2: Edit tags (without refreshing), try to save
 * - Assert: ConflictDialog appears with diff
 * - Click "Use Their Changes" → Local changes discarded, remote data loaded
 * - Test "Keep My Changes" → Force overwrite
 */

test.describe('Concurrent Edit Conflict Detection', () => {
  test('should detect version conflict and show conflict dialog', async () => {
    const browser = await chromium.launch();
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup: Login both users
      for (const page of [page1, page2]) {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      }

      // Step 1: Navigate both pages to the same dossier
      const dossierId = '123e4567-e89b-12d3-a456-426614174000'; // Test dossier
      await page1.goto(`/dossiers/${dossierId}`);
      await page2.goto(`/dossiers/${dossierId}`);

      // Wait for both pages to load
      await expect(page1.locator('[data-testid="dossier-header"]')).toBeVisible();
      await expect(page2.locator('[data-testid="dossier-header"]')).toBeVisible();

      // Step 2: Page 1 - Click edit button
      await page1.click('[data-testid="edit-dossier-button"]');
      await expect(page1.locator('[data-testid="edit-form"]')).toBeVisible();

      // Step 3: Page 1 - Edit summary field
      const newSummaryEn = 'Updated summary by User 1 - ' + Date.now();
      await page1.fill('[data-testid="summary-en-input"]', newSummaryEn);

      // Step 4: Page 1 - Save changes
      await page1.click('[data-testid="save-changes-button"]');

      // Wait for save to complete
      await expect(page1.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });

      // Assert version incremented in page 1
      await expect(page1.locator('[data-testid="dossier-version"]')).toContainText(/2|3|4/); // New version

      // Step 5: Page 2 - Click edit button (WITHOUT refreshing)
      await page2.click('[data-testid="edit-dossier-button"]');
      await expect(page2.locator('[data-testid="edit-form"]')).toBeVisible();

      // Step 6: Page 2 - Edit tags field (different field)
      await page2.fill('[data-testid="tags-input"]', 'new-tag');
      await page2.keyboard.press('Enter');
      await expect(page2.locator('[data-testid="tag-badge-new-tag"]')).toBeVisible();

      // Step 7: Page 2 - Try to save changes
      await page2.click('[data-testid="save-changes-button"]');

      // Step 8: Assert ConflictDialog appears
      await expect(page2.locator('[data-testid="conflict-dialog"]')).toBeVisible({ timeout: 5000 });

      // Step 9: Assert dialog shows diff between versions
      await expect(page2.locator('[data-testid="conflict-current-data"]')).toBeVisible();
      await expect(page2.locator('[data-testid="conflict-remote-data"]')).toBeVisible();

      // Step 10: Assert "Use Their Changes" button is visible
      await expect(page2.locator('[data-testid="conflict-use-theirs-button"]')).toBeVisible();

      // Step 11: Click "Use Their Changes"
      await page2.click('[data-testid="conflict-use-theirs-button"]');

      // Step 12: Assert dialog closes
      await expect(page2.locator('[data-testid="conflict-dialog"]')).not.toBeVisible({ timeout: 5000 });

      // Step 13: Assert page 2 data refreshed with remote changes
      await page2.waitForLoadState('networkidle');
      await expect(page2.locator('[data-testid="dossier-summary"]')).toContainText(newSummaryEn);

      // Step 14: Assert version updated in page 2
      await expect(page2.locator('[data-testid="dossier-version"]')).toContainText(/2|3|4/);
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
      await browser.close();
    }
  });

  test('should allow user to keep their changes with force overwrite', async () => {
    const browser = await chromium.launch();
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup: Login both users
      for (const page of [page1, page2]) {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      }

      const dossierId = '123e4567-e89b-12d3-a456-426614174000';
      await page1.goto(`/dossiers/${dossierId}`);
      await page2.goto(`/dossiers/${dossierId}`);

      await expect(page1.locator('[data-testid="dossier-header"]')).toBeVisible();
      await expect(page2.locator('[data-testid="dossier-header"]')).toBeVisible();

      // Page 1: Edit and save
      await page1.click('[data-testid="edit-dossier-button"]');
      await page1.fill('[data-testid="summary-en-input"]', 'User 1 changes - ' + Date.now());
      await page1.click('[data-testid="save-changes-button"]');
      await expect(page1.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });

      // Page 2: Edit different field
      await page2.click('[data-testid="edit-dossier-button"]');
      const myChanges = 'User 2 changes - ' + Date.now();
      await page2.fill('[data-testid="summary-ar-input"]', myChanges);

      // Page 2: Try to save (will trigger conflict)
      await page2.click('[data-testid="save-changes-button"]');

      // Assert conflict dialog appears
      await expect(page2.locator('[data-testid="conflict-dialog"]')).toBeVisible({ timeout: 5000 });

      // Click "Keep My Changes" button
      await page2.click('[data-testid="conflict-keep-mine-button"]');

      // Assert save retry with force flag
      await expect(page2.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });

      // Assert my changes are visible
      await expect(page2.locator('[data-testid="dossier-summary-ar"]')).toContainText(myChanges);
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
      await browser.close();
    }
  });

  test('should allow user to cancel and review changes', async () => {
    const browser = await chromium.launch();
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup: Login both users
      for (const page of [page1, page2]) {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      }

      const dossierId = '123e4567-e89b-12d3-a456-426614174000';
      await page1.goto(`/dossiers/${dossierId}`);
      await page2.goto(`/dossiers/${dossierId}`);

      await expect(page1.locator('[data-testid="dossier-header"]')).toBeVisible();
      await expect(page2.locator('[data-testid="dossier-header"]')).toBeVisible();

      // Page 1: Edit and save
      await page1.click('[data-testid="edit-dossier-button"]');
      await page1.fill('[data-testid="summary-en-input"]', 'Changes from page 1');
      await page1.click('[data-testid="save-changes-button"]');
      await expect(page1.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });

      // Page 2: Edit and try to save
      await page2.click('[data-testid="edit-dossier-button"]');
      await page2.fill('[data-testid="summary-ar-input"]', 'Changes from page 2');
      await page2.click('[data-testid="save-changes-button"]');

      // Assert conflict dialog appears
      await expect(page2.locator('[data-testid="conflict-dialog"]')).toBeVisible({ timeout: 5000 });

      // Click "Cancel" or close button
      await page2.click('[data-testid="conflict-cancel-button"]');

      // Assert dialog closes
      await expect(page2.locator('[data-testid="conflict-dialog"]')).not.toBeVisible();

      // Assert edit form is still visible with my changes
      await expect(page2.locator('[data-testid="edit-form"]')).toBeVisible();
      await expect(page2.locator('[data-testid="summary-ar-input"]')).toHaveValue(/Changes from page 2/);
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
      await browser.close();
    }
  });

  test('should display bilingual conflict messages', async () => {
    const browser = await chromium.launch();
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login and setup
      for (const page of [page1, page2]) {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      }

      const dossierId = '123e4567-e89b-12d3-a456-426614174000';
      await page1.goto(`/dossiers/${dossierId}`);
      await page2.goto(`/dossiers/${dossierId}`);

      // Create conflict scenario
      await page1.click('[data-testid="edit-dossier-button"]');
      await page1.fill('[data-testid="summary-en-input"]', 'Edit 1');
      await page1.click('[data-testid="save-changes-button"]');
      await expect(page1.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 5000 });

      await page2.click('[data-testid="edit-dossier-button"]');
      await page2.fill('[data-testid="summary-en-input"]', 'Edit 2');
      await page2.click('[data-testid="save-changes-button"]');

      // Assert conflict dialog shows bilingual message
      await expect(page2.locator('[data-testid="conflict-dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('[data-testid="conflict-message"]')).toBeVisible();

      // Test language toggle in conflict dialog
      await page2.click('[data-testid="language-toggle"]');
      await page2.waitForTimeout(500);

      // Assert Arabic conflict message is displayed
      await expect(page2.locator('[data-testid="conflict-message"]')).toContainText(/تم تعديل|تعارض/);
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
      await browser.close();
    }
  });
});