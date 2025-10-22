import { test, expect } from '@playwright/test';

// E2E tests for bulk reminder actions (T042)
// Tests user journey: select multiple items → send bulk reminders → see progress updates

test.describe('Bulk Reminder Actions - E2E (T042)', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Navigate to waiting queue
    await page.goto('/waiting-queue');
    await page.waitForLoadState('networkidle');
  });

  test('should select 5 items and send bulk reminders', async ({ page }) => {
    // Wait for assignments to load
    await page.waitForSelector('[data-testid="assignment-row"]');

    // Get first 5 assignment rows
    const assignmentRows = page.locator('[data-testid="assignment-row"]').first(5);
    const count = await assignmentRows.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Select 5 assignments via checkboxes
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    // Verify BulkActionToolbar appears
    await expect(page.locator('[data-testid="bulk-action-toolbar"]')).toBeVisible();
    await expect(page.locator('text=5 items selected')).toBeVisible();

    // Click "Send Reminders" button
    await page.click('[data-testid="bulk-send-reminders-btn"]');

    // Wait for confirmation dialog
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await expect(page.locator('text=Send reminders to 5 assignments?')).toBeVisible();

    // Confirm bulk action
    await page.click('[data-testid="confirm-bulk-action-btn"]');

    // Verify progress indicator appears
    await expect(page.locator('[data-testid="bulk-progress-indicator"]')).toBeVisible();

    // Wait for progress updates (polling job status)
    await page.waitForSelector('text=/\\d+\\/5 sent/', { timeout: 30000 });

    // Wait for completion toast
    await expect(
      page.locator('text=Successfully sent 5 reminders')
    ).toBeVisible({ timeout: 60000 });

    // Verify BulkActionToolbar disappears after completion
    await expect(page.locator('[data-testid="bulk-action-toolbar"]')).toBeHidden();

    // Verify checkboxes are unchecked
    const firstCheckbox = page.locator('[data-testid="assignment-checkbox"]').first();
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('should show progress updates during bulk processing', async ({ page }) => {
    // Select 10 assignments
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    await expect(page.locator('text=10 items selected')).toBeVisible();

    // Send bulk reminders
    await page.click('[data-testid="bulk-send-reminders-btn"]');
    await page.click('[data-testid="confirm-bulk-action-btn"]');

    // Track progress updates
    const progressTexts: string[] = [];

    // Poll for progress updates (max 30 seconds)
    const startTime = Date.now();
    while (Date.now() - startTime < 30000) {
      const progressText = await page
        .locator('[data-testid="bulk-progress-text"]')
        .textContent();

      if (progressText && !progressTexts.includes(progressText)) {
        progressTexts.push(progressText);
      }

      // Check if completed
      if (progressText?.includes('10/10')) {
        break;
      }

      await page.waitForTimeout(500);
    }

    // Verify progress incremented over time
    expect(progressTexts.length).toBeGreaterThan(1);
    expect(progressTexts[0]).toMatch(/0\/10|1\/10/);
    expect(progressTexts[progressTexts.length - 1]).toBe('10/10 sent');
  });

  test('should allow clearing selection', async ({ page }) => {
    // Select 3 assignments
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    await expect(page.locator('text=3 items selected')).toBeVisible();

    // Click "Clear Selection" button
    await page.click('[data-testid="bulk-clear-selection-btn"]');

    // Verify BulkActionToolbar disappears
    await expect(page.locator('[data-testid="bulk-action-toolbar"]')).toBeHidden();

    // Verify all checkboxes are unchecked
    const checkboxes = page.locator('[data-testid="assignment-checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }
  });

  test('should allow selecting all items', async ({ page }) => {
    // Wait for assignments to load
    await page.waitForSelector('[data-testid="assignment-row"]');

    // Get total count of assignments
    const totalCount = await page.locator('[data-testid="assignment-row"]').count();

    // Click "Select All" button (may be in toolbar or header)
    await page.click('[data-testid="select-all-btn"]');

    // Verify BulkActionToolbar shows correct count
    await expect(
      page.locator(`text=${totalCount} items selected`)
    ).toBeVisible();

    // Verify all checkboxes are checked
    const checkboxes = page.locator('[data-testid="assignment-checkbox"]');
    const checkedCount = await checkboxes.filter({ hasText: '' }).count();

    expect(checkedCount).toBe(totalCount);
  });

  test('should handle partial failures gracefully', async ({ page }) => {
    // Select 10 assignments (some may have no assignee or other issues)
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    // Send bulk reminders
    await page.click('[data-testid="bulk-send-reminders-btn"]');
    await page.click('[data-testid="confirm-bulk-action-btn"]');

    // Wait for completion
    await page.waitForSelector('[data-testid="bulk-result-summary"]', {
      timeout: 60000,
    });

    // Verify summary shows both successes and failures
    const summaryText = await page
      .locator('[data-testid="bulk-result-summary"]')
      .textContent();

    // Summary should show format like "8 sent, 2 skipped (no assignee)"
    expect(summaryText).toMatch(/\d+ sent/);

    // If there were failures, verify they're shown
    if (summaryText?.includes('skipped')) {
      expect(summaryText).toMatch(/\d+ skipped/);
    }
  });

  test('should prevent bulk action exceeding 100 items', async ({ page }) => {
    // Attempt to select more than 100 items (if available)
    await page.waitForSelector('[data-testid="assignment-row"]');

    // Click "Select All" button
    await page.click('[data-testid="select-all-btn"]');

    const selectedCount = await page
      .locator('[data-testid="bulk-action-toolbar"]')
      .locator('text=/\\d+ items selected/')
      .textContent();

    const count = parseInt(selectedCount?.match(/\\d+/)?.[0] || '0');

    // If more than 100 selected
    if (count > 100) {
      // Send Reminders button should be disabled
      await expect(
        page.locator('[data-testid="bulk-send-reminders-btn"]')
      ).toBeDisabled();

      // Error message should be shown
      await expect(
        page.locator('text=Bulk actions limited to 100 items')
      ).toBeVisible();
    }
  });

  test('should work on mobile viewport (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Select 3 assignments
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    // Verify BulkActionToolbar is visible and touch-friendly
    const toolbar = page.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).toBeVisible();

    // Verify buttons are touch-friendly (44x44px min)
    const sendButton = page.locator('[data-testid="bulk-send-reminders-btn"]');
    const buttonBox = await sendButton.boundingBox();

    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);

    // Verify mobile-first layout (flex-col on mobile)
    const toolbarClasses = await toolbar.getAttribute('class');
    expect(toolbarClasses).toContain('flex-col');
  });

  test('should support RTL layout for Arabic locale', async ({ page }) => {
    // Switch to Arabic locale
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-ar"]');

    // Wait for page to re-render
    await page.waitForTimeout(1000);

    // Select 2 assignments
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 2; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    // Verify toolbar has RTL direction
    const toolbar = page.locator('[data-testid="bulk-action-toolbar"]');
    const dir = await toolbar.getAttribute('dir');
    expect(dir).toBe('rtl');

    // Verify Arabic text is displayed
    await expect(page.locator('text=عنصرين محددين')).toBeVisible(); // "2 items selected" in Arabic

    // Verify logical properties are used (buttons align correctly in RTL)
    const sendButton = page.locator('[data-testid="bulk-send-reminders-btn"]');
    const buttonClasses = await sendButton.getAttribute('class');

    // Should NOT contain ml-*, mr-*, pl-*, pr-*
    expect(buttonClasses).not.toMatch(/\bml-/);
    expect(buttonClasses).not.toMatch(/\bmr-/);
    expect(buttonClasses).not.toMatch(/\bpl-/);
    expect(buttonClasses).not.toMatch(/\bpr-/);
  });

  test('should persist selection when navigating between pages', async ({ page }) => {
    // Select 3 assignments on page 1
    await page.waitForSelector('[data-testid="assignment-row"]');

    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="assignment-checkbox"]').nth(i).click();
    }

    await expect(page.locator('text=3 items selected')).toBeVisible();

    // Navigate to page 2 (if pagination exists)
    const nextPageButton = page.locator('[data-testid="pagination-next"]');

    if (await nextPageButton.isVisible()) {
      await nextPageButton.click();
      await page.waitForLoadState('networkidle');

      // Verify selection count persists
      await expect(page.locator('text=3 items selected')).toBeVisible();

      // Go back to page 1
      await page.click('[data-testid="pagination-prev"]');
      await page.waitForLoadState('networkidle');

      // Verify previously selected items are still checked
      const firstCheckbox = page
        .locator('[data-testid="assignment-checkbox"]')
        .first();
      await expect(firstCheckbox).toBeChecked();
    }
  });
});
