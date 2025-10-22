import { test, expect } from '@playwright/test';

/**
 * E2E Test: Assignment Details View
 * Feature: Waiting Queue Actions (User Story 1)
 * Scope: Verify users can click "View" on an assignment and see complete details in a modal
 */

test.describe('Assignment Details View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to waiting queue page
    await page.goto('/waiting-queue');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Ensure we're authenticated (test credentials from CLAUDE.md)
    // If not authenticated, log in
    const loginButton = page.locator('text=Sign In');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
      await page.fill('input[type="password"]', 'itisme');
      await page.click('button[type="submit"]');
      await page.waitForURL('/waiting-queue');
    }
  });

  test('should open assignment details modal when clicking View button', async ({ page }) => {
    // Wait for assignment list to load
    await page.waitForSelector('[data-testid="assignment-row"]', { timeout: 5000 });

    // Click the first "View" button
    const viewButton = page.locator('[data-testid="view-assignment-button"]').first();
    await viewButton.click();

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modal should have a title
    await expect(page.locator('[role="dialog"] [data-testid="modal-title"]')).toBeVisible();
  });

  test('should display all assignment fields in the modal', async ({ page }) => {
    // Click View button
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    // Wait for modal to be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify all key fields are displayed
    await expect(modal.locator('[data-testid="work-item-id"]')).toBeVisible();
    await expect(modal.locator('[data-testid="assignee-name"]')).toBeVisible();
    await expect(modal.locator('[data-testid="assignee-email"]')).toBeVisible();
    await expect(modal.locator('[data-testid="assignment-status"]')).toBeVisible();
    await expect(modal.locator('[data-testid="assignment-priority"]')).toBeVisible();
    await expect(modal.locator('[data-testid="assigned-at"]')).toBeVisible();
    await expect(modal.locator('[data-testid="days-waiting"]')).toBeVisible();
  });

  test('should display aging indicator with correct color based on days waiting', async ({ page }) => {
    // Click View button for an assignment
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Get aging badge
    const agingBadge = modal.locator('[data-testid="aging-badge"]');
    await expect(agingBadge).toBeVisible();

    // Get the aging level attribute
    const agingLevel = await agingBadge.getAttribute('data-aging-level');

    // Should be one of: 'ok' (0-2 days), 'warning' (3-6 days), 'danger' (7+ days)
    expect(['ok', 'warning', 'danger']).toContain(agingLevel);
  });

  test('should show last reminder timestamp if reminder was sent', async ({ page }) => {
    // Find an assignment with a reminder sent (has data-has-reminder="true")
    const assignmentWithReminder = page.locator('[data-testid="assignment-row"][data-has-reminder="true"]').first();

    // If exists, click its View button
    if (await assignmentWithReminder.isVisible()) {
      await assignmentWithReminder.locator('[data-testid="view-assignment-button"]').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Should display last reminder timestamp
      await expect(modal.locator('[data-testid="last-reminder-sent"]')).toBeVisible();
      await expect(modal.locator('[data-testid="last-reminder-sent"]')).not.toContainText('No reminder sent');
    }
  });

  test('should show "No reminder sent" if no reminder has been sent', async ({ page }) => {
    // Find an assignment with no reminder (has data-has-reminder="false" or missing)
    const assignmentWithoutReminder = page.locator('[data-testid="assignment-row"][data-has-reminder="false"]').first();

    // Click its View button
    await assignmentWithoutReminder.locator('[data-testid="view-assignment-button"]').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Should display "No reminder sent"
    await expect(modal.locator('[data-testid="last-reminder-sent"]')).toContainText(/No reminder sent/i);
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click close button
    await page.locator('[data-testid="close-modal-button"]').click();

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking outside (overlay)', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click outside the modal (on the overlay)
    await page.locator('[data-testid="modal-overlay"]').click({ position: { x: 10, y: 10 } });

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should display correct data for specific assignment', async ({ page }) => {
    // Get data from the first assignment row
    const assignmentRow = page.locator('[data-testid="assignment-row"]').first();
    const workItemId = await assignmentRow.locator('[data-testid="row-work-item-id"]').textContent();
    const assigneeName = await assignmentRow.locator('[data-testid="row-assignee-name"]').textContent();

    // Open modal
    await assignmentRow.locator('[data-testid="view-assignment-button"]').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify modal displays the same data
    await expect(modal.locator('[data-testid="work-item-id"]')).toContainText(workItemId || '');
    await expect(modal.locator('[data-testid="assignee-name"]')).toContainText(assigneeName || '');
  });

  test('should navigate to full work item page when clicking link', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click "View Full Details" link
    const viewFullDetailsLink = modal.locator('[data-testid="view-full-details-link"]');
    await expect(viewFullDetailsLink).toBeVisible();

    // Click the link
    await viewFullDetailsLink.click();

    // Should navigate to dossier/ticket/position page
    await page.waitForURL(/\/(dossiers|tickets|positions|tasks)\/.+/);

    // Verify we're on the work item page
    expect(page.url()).toMatch(/\/(dossiers|tickets|positions|tasks)\/.+/);
  });
});

test.describe('Assignment Details View - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    // Navigate to waiting queue page
    await page.goto('/waiting-queue');
    await page.waitForLoadState('networkidle');

    // Login if needed
    const loginButton = page.locator('text=Sign In');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
      await page.fill('input[type="password"]', 'itisme');
      await page.click('button[type="submit"]');
      await page.waitForURL('/waiting-queue');
    }
  });

  test('should open modal on mobile with touch-friendly close button', async ({ page }) => {
    // Click View button
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close button should be touch-friendly (44x44px minimum)
    const closeButton = page.locator('[data-testid="close-modal-button"]');
    const boundingBox = await closeButton.boundingBox();

    expect(boundingBox).toBeDefined();
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44);
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should display modal content in mobile-first responsive layout', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should fit within mobile viewport
    const boundingBox = await modal.boundingBox();
    expect(boundingBox).toBeDefined();
    expect(boundingBox!.width).toBeLessThanOrEqual(375); // Should fit within viewport
  });
});

test.describe('Assignment Details View - RTL (Arabic)', () => {
  test.beforeEach(async ({ page }) => {
    // Set Arabic locale
    await page.goto('/waiting-queue?lang=ar');
    await page.waitForLoadState('networkidle');

    // Login if needed
    const loginButton = page.locator('text=تسجيل الدخول');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
      await page.fill('input[type="password"]', 'itisme');
      await page.click('button[type="submit"]');
      await page.waitForURL('/waiting-queue');
    }
  });

  test('should display modal with RTL direction in Arabic locale', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should have dir="rtl"
    const dir = await modal.getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('should use logical properties for spacing (no ml-*, mr-*, pl-*, pr-*)', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="view-assignment-button"]').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Get computed classes and check for logical properties
    const className = await modal.getAttribute('class');

    // Should not use directional properties
    expect(className).not.toMatch(/\bml-/);
    expect(className).not.toMatch(/\bmr-/);
    expect(className).not.toMatch(/\bpl-/);
    expect(className).not.toMatch(/\bpr-/);

    // Should use logical properties (ps-*, pe-*, ms-*, me-*)
    expect(className).toMatch(/\b(ps|pe|ms|me)-/);
  });
});
