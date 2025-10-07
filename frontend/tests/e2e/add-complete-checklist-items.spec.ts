import { test, expect } from '@playwright/test';

/**
 * E2E Test: Add and Complete Checklist Items (T079)
 * Tests adding manual checklist items and completing them
 *
 * Validates:
 * - Add manual checklist item
 * - Complete checklist items
 * - Progress percentage updates correctly
 * - Completed metadata (timestamp, user) displayed
 */

test.describe('Add and Complete Checklist Items', () => {
  let testAssignmentId: string;

  test.beforeEach(async ({ page }) => {
    // Setup
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Create assignment
    const response = await page.request.post('/functions/v1/assignments-auto-assign', {
      data: { work_item_type: 'dossier', work_item_id: 'test-dossier-001' }
    });
    const data = await response.json();
    testAssignmentId = data.id;

    await page.goto(`/assignments/${testAssignmentId}`);
  });

  test('should add manual checklist item', async ({ page }) => {
    // Click "Add Item" button
    await page.click('[data-testid="add-checklist-item-button"]');

    // Verify input appears
    await expect(page.locator('[data-testid="checklist-item-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="checklist-item-input"]')).toBeFocused();

    // Type item text
    const itemText = 'Review all supporting documents';
    await page.fill('[data-testid="checklist-item-input"]', itemText);

    // Submit item (press Enter or click Save)
    await page.keyboard.press('Enter');

    // Verify item appears in list
    await expect(page.locator('[data-testid="checklist-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="checklist-item"]').first()).toContainText(itemText);

    // Verify checkbox is unchecked
    const checkbox = page.locator('[data-testid="checklist-item"]').first().locator('[data-testid="checklist-checkbox"]');
    await expect(checkbox).not.toBeChecked();

    // Verify progress shows 0%
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('0%');

    // Verify input is cleared
    await expect(page.locator('[data-testid="checklist-item-input"]')).toHaveValue('');
  });

  test('should complete checklist item and update progress', async ({ page }) => {
    // Add 3 items
    const items = ['Review documents', 'Verify data accuracy', 'Prepare brief'];

    for (const itemText of items) {
      await page.click('[data-testid="add-checklist-item-button"]');
      await page.fill('[data-testid="checklist-item-input"]', itemText);
      await page.keyboard.press('Enter');
    }

    // Verify 3 items exist
    await expect(page.locator('[data-testid="checklist-item"]')).toHaveCount(3);

    // Verify initial progress is 0%
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('0%');

    // Complete first item
    await page.click('[data-testid="checklist-item"]').first().locator('[data-testid="checklist-checkbox"]');

    // Verify progress updates to 33% (1/3)
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('33%', { timeout: 1000 });

    // Verify completed timestamp is shown
    const firstItem = page.locator('[data-testid="checklist-item"]').first();
    await expect(firstItem.locator('[data-testid="completed-timestamp"]')).toBeVisible();

    // Verify completed by user is shown
    await expect(firstItem.locator('[data-testid="completed-by"]')).toContainText(/test\.staff/i);

    // Complete second item
    await page.locator('[data-testid="checklist-item"]').nth(1).locator('[data-testid="checklist-checkbox"]').click();

    // Verify progress updates to 67% (2/3)
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('67%', { timeout: 1000 });

    // Complete third item
    await page.locator('[data-testid="checklist-item"]').nth(2).locator('[data-testid="checklist-checkbox"]').click();

    // Verify progress updates to 100% (3/3)
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('100%', { timeout: 1000 });

    // Verify all checkboxes are checked
    const checkboxes = page.locator('[data-testid="checklist-checkbox"]');
    for (let i = 0; i < 3; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('should uncheck completed item and recalculate progress', async ({ page }) => {
    // Add 2 items
    await page.click('[data-testid="add-checklist-item-button"]');
    await page.fill('[data-testid="checklist-item-input"]', 'Item 1');
    await page.keyboard.press('Enter');

    await page.click('[data-testid="add-checklist-item-button"]');
    await page.fill('[data-testid="checklist-item-input"]', 'Item 2');
    await page.keyboard.press('Enter');

    // Complete both items
    await page.locator('[data-testid="checklist-item"]').first().locator('[data-testid="checklist-checkbox"]').click();
    await page.locator('[data-testid="checklist-item"]').nth(1).locator('[data-testid="checklist-checkbox"]').click();

    // Verify 100% progress
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('100%');

    // Uncheck first item
    await page.locator('[data-testid="checklist-item"]').first().locator('[data-testid="checklist-checkbox"]').click();

    // Verify progress recalculated to 50% (1/2)
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('50%', { timeout: 1000 });

    // Verify completed metadata is cleared for unchecked item
    const firstItem = page.locator('[data-testid="checklist-item"]').first();
    await expect(firstItem.locator('[data-testid="completed-timestamp"]')).not.toBeVisible();
    await expect(firstItem.locator('[data-testid="completed-by"]')).not.toBeVisible();
  });

  test('should display sequence numbers correctly', async ({ page }) => {
    // Add 3 items
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="add-checklist-item-button"]');
      await page.fill('[data-testid="checklist-item-input"]', `Item ${i}`);
      await page.keyboard.press('Enter');
    }

    // Verify sequence numbers
    for (let i = 0; i < 3; i++) {
      const item = page.locator('[data-testid="checklist-item"]').nth(i);
      await expect(item.locator('[data-testid="sequence-number"]')).toContainText(`${i + 1}`);
    }
  });

  test('should enforce 500 character limit on item text', async ({ page }) => {
    const longText = 'A'.repeat(501);

    await page.click('[data-testid="add-checklist-item-button"]');
    await page.fill('[data-testid="checklist-item-input"]', longText);

    // Verify character counter shows exceeded
    const charCount = await page.locator('[data-testid="item-char-count"]').textContent();
    expect(charCount).toContain('501/500');

    // Verify save button is disabled
    await expect(page.locator('[data-testid="save-checklist-item-button"]')).toBeDisabled();

    // Try to submit with Enter (should not work)
    await page.keyboard.press('Enter');

    // Verify item was not added
    await expect(page.locator('[data-testid="checklist-item"]')).toHaveCount(0);
  });

  test('should record timeline event for checklist updates', async ({ page }) => {
    // Add item
    await page.click('[data-testid="add-checklist-item-button"]');
    await page.fill('[data-testid="checklist-item-input"]', 'Test item');
    await page.keyboard.press('Enter');

    // Verify timeline shows "Checklist Item Added"
    const timelineEvents = page.locator('[data-testid="timeline-event"]');
    await expect(timelineEvents.last()).toContainText(/checklist.*added/i);

    // Complete item
    await page.locator('[data-testid="checklist-checkbox"]').first().click();

    // Verify timeline shows "Checklist Item Completed"
    await expect(timelineEvents.last()).toContainText(/checklist.*completed/i, { timeout: 1000 });

    // Verify event shows which item was completed
    await expect(timelineEvents.last()).toContainText('Test item');
  });

  test('should persist checklist across page reload', async ({ page }) => {
    // Add and complete items
    await page.click('[data-testid="add-checklist-item-button"]');
    await page.fill('[data-testid="checklist-item-input"]', 'Persistent item');
    await page.keyboard.press('Enter');

    await page.locator('[data-testid="checklist-checkbox"]').first().click();

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="checklist-section"]')).toBeVisible();

    // Verify item still exists and is checked
    await expect(page.locator('[data-testid="checklist-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="checklist-item"]').first()).toContainText('Persistent item');
    await expect(page.locator('[data-testid="checklist-checkbox"]').first()).toBeChecked();

    // Verify progress is correct
    await expect(page.locator('[data-testid="checklist-progress-percentage"]')).toContainText('100%');
  });

  test('should cancel adding item with Escape key', async ({ page }) => {
    await page.click('[data-testid="add-checklist-item-button"]');
    await expect(page.locator('[data-testid="checklist-item-input"]')).toBeVisible();

    // Type some text
    await page.fill('[data-testid="checklist-item-input"]', 'Cancelled item');

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify input is hidden
    await expect(page.locator('[data-testid="checklist-item-input"]')).not.toBeVisible();

    // Verify no item was added
    await expect(page.locator('[data-testid="checklist-item"]')).toHaveCount(0);
  });
});
