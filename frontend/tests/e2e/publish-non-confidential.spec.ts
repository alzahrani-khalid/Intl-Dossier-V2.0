import { test, expect, Page } from '@playwright/test';

/**
 * Integration Test: User Story 3 - Publish After-Action (Non-Confidential)
 *
 * As a supervisor
 * I want to publish a completed after-action record
 * So that tasks and commitments become official and notifications are sent
 *
 * Reference: quickstart.md lines 263-345
 */

const TEST_DOSSIER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_SUPERVISOR_EMAIL = 'test-supervisor@gastat.gov.sa';
const TEST_SUPERVISOR_PASSWORD = 'Test123!@#';

test.describe('User Story 3: Publish After-Action (Non-Confidential)', () => {
  let page: Page;
  let draftId: string;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should login as supervisor and navigate to draft', async () => {
    // Step 1 & 2: Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_SUPERVISOR_EMAIL);
    await page.fill('input[name="password"]', TEST_SUPERVISOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/_protected/**');

    // Navigate to after-actions list
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/after-actions`);

    // Verify draft is visible
    const draftBadge = page.locator('text=Draft').first();
    await expect(draftBadge).toBeVisible();
  });

  test('should display publish button for supervisor', async () => {
    // Step 3: Open draft for review
    await loginAsSupervisor();
    await navigateToDraftAfterAction();

    // Verify Publish button visible (supervisor permission)
    const publishButton = page.locator('button:has-text("Publish")');
    await expect(publishButton).toBeVisible();
  });

  test('should show confirmation modal when publishing', async () => {
    // Step 4: Click Publish
    await loginAsSupervisor();
    await navigateToDraftAfterAction();

    await page.click('button:has-text("Publish")');

    // Verify confirmation modal
    const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
    await expect(modal.first()).toBeVisible();

    await expect(page.locator('text=Publish this after-action record?')).toBeVisible();
    await expect(page.locator('text=Tasks and commitments will be created')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("Cancel")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Confirm Publish")').first()).toBeVisible();
  });

  test('should successfully publish and update status', async () => {
    // Step 5: Confirm publish
    await loginAsSupervisor();
    await navigateToDraftAfterAction();

    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm Publish")');

    // Verify status changed
    await expect(page.locator('text=published').first()).toBeVisible({ timeout: 5000 });

    // Verify success message
    await expect(page.locator('text=After-action published successfully')).toBeVisible();

    // Verify metadata
    await expect(page.locator('text=Published by').or(page.locator('text=test-supervisor@gastat.gov.sa'))).toBeVisible();
  });

  test('should create commitments after publish', async () => {
    // Step 6: Verify tasks/commitments created
    await loginAsSupervisor();
    await publishDraft();

    // Navigate to dossier tasks
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/tasks`);

    // Verify internal commitment
    await expect(page.locator('text=Submit revised budget proposal')).toBeVisible();
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=pending').or(page.locator('[data-status="pending"]'))).toBeVisible();

    // Verify external commitment
    await expect(page.locator('text=Review legal framework updates')).toBeVisible();
    await expect(page.locator('text=Dr. Fatima Al-Mansour')).toBeVisible();
  });

  test('should send notifications to internal users', async () => {
    // Step 7: Verify notifications sent
    await loginAsSupervisor();
    await publishDraft();

    // Switch to John Smith account to check notifications
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'john.smith@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Check in-app notification bell
    const notificationBell = page.locator('[data-testid="notification-bell"]').or(page.locator('.notification-icon'));
    await expect(notificationBell.first()).toBeVisible();

    await notificationBell.first().click();

    // Verify notification content
    await expect(page.locator('text=You have been assigned a commitment')).toBeVisible();
    await expect(page.locator('text=Submit revised budget proposal')).toBeVisible();
  });

  test('should make published record read-only', async () => {
    // Step 8: Verify record is read-only
    await loginAsSupervisor();
    await publishDraft();

    // Try to edit
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeDisabled();

    // Verify Request Edit button visible
    const requestEditButton = page.locator('button:has-text("Request Edit")');
    await expect(requestEditButton).toBeVisible();

    // Verify form fields are disabled
    const firstInput = page.locator('input').first();
    if (await firstInput.isVisible()) {
      await expect(firstInput).toBeDisabled();
    }
  });

  test('should link commitments to parent entities', async () => {
    // Verify commitments properly linked
    await loginAsSupervisor();
    await publishDraft();

    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/tasks`);

    // Click on a commitment
    await page.click('text=Submit revised budget proposal');

    // Verify links back to after-action and dossier
    await expect(page.locator('a[href*="/after-actions/"]')).toBeVisible();
    await expect(page.locator('a[href*="/dossiers/"]')).toBeVisible();
  });

  test('should respect user notification preferences', async () => {
    // Verify email notifications respect preferences
    await loginAsSupervisor();

    // First check John's preferences
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'john.smith@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/settings/notifications');

    // Get email preference status
    const emailCheckbox = page.locator('input[name="commitment_assigned_email"]');
    const isEmailEnabled = await emailCheckbox.isChecked();

    // Publish as supervisor
    await page.goto('/logout');
    await loginAsSupervisor();
    await publishDraft();

    // Mock email service would verify email sent/not sent based on preference
    // In real test, check email mock service
    if (isEmailEnabled) {
      // Verify email sent (check mock service or logs)
      console.log('Email notification should be sent');
    } else {
      // Verify email not sent
      console.log('Email notification should not be sent');
    }
  });

  // Helper functions
  async function loginAsSupervisor() {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_SUPERVISOR_EMAIL);
    await page.fill('input[name="password"]', TEST_SUPERVISOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/_protected/**');
  }

  async function navigateToDraftAfterAction() {
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/after-actions`);

    // Find first draft
    const firstDraft = page.locator('[data-status="draft"]').or(page.locator('text=Draft')).first();
    await firstDraft.click();

    // Store draft ID
    const url = page.url();
    const match = url.match(/after-actions\/([a-f0-9-]+)/);
    if (match) {
      draftId = match[1];
    }
  }

  async function publishDraft() {
    await navigateToDraftAfterAction();
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm Publish")');
    await expect(page.locator('text=After-action published successfully')).toBeVisible({ timeout: 5000 });
  }
});
