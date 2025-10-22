import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: User Story 4 - Link Tasks to Multiple Work Items
 *
 * Goal: Allow a single task to reference multiple work items (e.g., review 3 related dossiers together)
 *
 * Test coverage:
 * - T073: Create task with 2 dossiers and 1 position link
 * - T074: Click linked dossier and navigate to dossier detail page
 * - T075: Task summary showing "3 linked items" count
 */

test.describe('User Story 4: Multi-Work-Items Task Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');

    // Login with test credentials
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for redirect to tasks page
    await page.waitForURL('**/tasks');
    await expect(page).toHaveURL(/\/tasks/);
  });

  /**
   * T073: Create task with 2 dossiers and 1 position link
   *
   * Acceptance:
   * - Task creation form allows selecting multiple work items
   * - Task is created successfully with all 3 work items linked
   * - All 3 work items appear in task's "Linked Items" section
   */
  test('T073: should create task with 2 dossiers and 1 position', async ({ page }) => {
    // Navigate to create task page
    await page.click('a[href="/tasks/new"]');
    await expect(page).toHaveURL(/\/tasks\/new/);

    // Fill in basic task info
    await page.fill('input[name="title"]', 'Review related dossiers and position');
    await page.fill('textarea[name="description"]', 'Comprehensive review of 2 dossiers and 1 position for policy coordination');

    // Select priority
    await page.selectOption('select[name="priority"]', 'high');

    // Select status
    await page.selectOption('select[name="status"]', 'pending');

    // Open work item linker
    await page.click('button:has-text("Add Work Items")');

    // Select first dossier
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Australia');
    await page.waitForSelector('div[role="option"]:has-text("Australia")');
    await page.click('div[role="option"]:has-text("Australia")');
    await page.click('button:has-text("Confirm")');

    // Select second dossier
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Canada');
    await page.waitForSelector('div[role="option"]:has-text("Canada")');
    await page.click('div[role="option"]:has-text("Canada")');
    await page.click('button:has-text("Confirm")');

    // Select position
    await page.click('button:has-text("Add Position")');
    await page.fill('input[placeholder="Search positions"]', 'Data Analyst');
    await page.waitForSelector('div[role="option"]:has-text("Data Analyst")');
    await page.click('div[role="option"]:has-text("Data Analyst")');
    await page.click('button:has-text("Confirm")');

    // Verify all 3 items are displayed in linked items list
    const linkedItems = page.locator('.linked-items-list .linked-item');
    await expect(linkedItems).toHaveCount(3);
    await expect(linkedItems.nth(0)).toContainText('Australia');
    await expect(linkedItems.nth(1)).toContainText('Canada');
    await expect(linkedItems.nth(2)).toContainText('Data Analyst');

    // Submit task creation
    await page.click('button[type="submit"]:has-text("Create Task")');

    // Wait for redirect to task detail page
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

    // Verify task was created with all linked items
    await expect(page.locator('h1')).toContainText('Review related dossiers and position');

    const linkedItemsInDetail = page.locator('.linked-items-section .linked-item');
    await expect(linkedItemsInDetail).toHaveCount(3);
    await expect(linkedItemsInDetail.nth(0)).toContainText('Australia');
    await expect(linkedItemsInDetail.nth(1)).toContainText('Canada');
    await expect(linkedItemsInDetail.nth(2)).toContainText('Data Analyst');

    // Success notification
    await expect(page.locator('.toast-success')).toContainText('Task created successfully');
  });

  /**
   * T074: Click linked dossier and navigate to dossier detail page
   *
   * Acceptance:
   * - Linked dossier items are clickable
   * - Clicking a linked dossier navigates to its detail page
   * - Dossier detail page loads correctly
   * - Breadcrumb shows navigation path
   */
  test('T074: should navigate to linked dossier detail page', async ({ page }) => {
    // First, create a task with linked dossiers (setup)
    await page.goto('http://localhost:5173/tasks/new');
    await page.fill('input[name="title"]', 'Test task with linked dossier');
    await page.selectOption('select[name="priority"]', 'medium');
    await page.selectOption('select[name="status"]', 'pending');

    // Link a dossier
    await page.click('button:has-text("Add Work Items")');
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Australia');
    await page.waitForSelector('div[role="option"]:has-text("Australia")');
    await page.click('div[role="option"]:has-text("Australia")');
    await page.click('button:has-text("Confirm")');

    await page.click('button[type="submit"]:has-text("Create Task")');
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

    // Get task ID from URL
    const taskUrl = page.url();
    const taskId = taskUrl.split('/').pop();

    // Verify linked dossier is clickable
    const linkedDossier = page.locator('.linked-item:has-text("Australia")');
    await expect(linkedDossier).toBeVisible();
    await expect(linkedDossier.locator('a')).toBeVisible();

    // Click the linked dossier
    await linkedDossier.locator('a').click();

    // Wait for navigation to dossier detail page
    await page.waitForURL(/\/dossiers\/[a-f0-9-]+/);
    await expect(page).toHaveURL(/\/dossiers\/[a-f0-9-]+/);

    // Verify dossier detail page loaded
    await expect(page.locator('h1')).toContainText('Australia');

    // Verify breadcrumb navigation
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toContainText('Tasks');
    await expect(breadcrumb).toContainText('Australia');

    // Navigate back to task using breadcrumb
    await page.click('nav[aria-label="breadcrumb"] a:has-text("Tasks")');
    await expect(page).toHaveURL(/\/tasks$/);
  });

  /**
   * T075: Task summary showing "3 linked items" count
   *
   * Acceptance:
   * - Task card in list view shows linked items count
   * - Count is accurate (matches number of linked items)
   * - Count updates when items are added/removed
   * - Tooltip shows item types on hover
   */
  test('T075: should display linked items count in task summary', async ({ page }) => {
    // Create a task with 3 linked items
    await page.goto('http://localhost:5173/tasks/new');
    await page.fill('input[name="title"]', 'Task with multiple linked items');
    await page.selectOption('select[name="priority"]', 'high');
    await page.selectOption('select[name="status"]', 'pending');

    // Link 2 dossiers and 1 position
    await page.click('button:has-text("Add Work Items")');

    // First dossier
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Australia');
    await page.waitForSelector('div[role="option"]:has-text("Australia")');
    await page.click('div[role="option"]:has-text("Australia")');
    await page.click('button:has-text("Confirm")');

    // Second dossier
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Canada');
    await page.waitForSelector('div[role="option"]:has-text("Canada")');
    await page.click('div[role="option"]:has-text("Canada")');
    await page.click('button:has-text("Confirm")');

    // Position
    await page.click('button:has-text("Add Position")');
    await page.fill('input[placeholder="Search positions"]', 'Data Analyst');
    await page.waitForSelector('div[role="option"]:has-text("Data Analyst")');
    await page.click('div[role="option"]:has-text("Data Analyst")');
    await page.click('button:has-text("Confirm")');

    await page.click('button[type="submit"]:has-text("Create Task")');
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

    // Navigate back to tasks list
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/\/tasks$/);

    // Find the created task card
    const taskCard = page.locator('.task-card').filter({ hasText: 'Task with multiple linked items' });
    await expect(taskCard).toBeVisible();

    // Verify linked items count badge
    const itemsCountBadge = taskCard.locator('.linked-items-count');
    await expect(itemsCountBadge).toBeVisible();
    await expect(itemsCountBadge).toContainText('3 linked items');

    // Hover over count badge to see tooltip
    await itemsCountBadge.hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('2 dossiers');
    await expect(tooltip).toContainText('1 position');

    // Click on task card to open detail
    await taskCard.click();
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

    // Remove one dossier link
    const linkedItemToRemove = page.locator('.linked-item:has-text("Canada")');
    await linkedItemToRemove.locator('button[aria-label="Remove link"]').click();

    // Confirm removal
    await page.click('button:has-text("Confirm")');

    // Wait for update
    await page.waitForTimeout(1000);

    // Navigate back to tasks list
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/\/tasks$/);

    // Verify count updated to 2
    const updatedTaskCard = page.locator('.task-card').filter({ hasText: 'Task with multiple linked items' });
    const updatedCountBadge = updatedTaskCard.locator('.linked-items-count');
    await expect(updatedCountBadge).toContainText('2 linked items');

    // Hover to verify tooltip updated
    await updatedCountBadge.hover();
    const updatedTooltip = page.locator('[role="tooltip"]');
    await expect(updatedTooltip).toContainText('1 dossier');
    await expect(updatedTooltip).toContainText('1 position');
  });

  /**
   * Edge case: Task with no linked items should not show count badge
   */
  test('should not show linked items count for tasks with no linked items', async ({ page }) => {
    // Create a task without linked items
    await page.goto('http://localhost:5173/tasks/new');
    await page.fill('input[name="title"]', 'Task with no linked items');
    await page.selectOption('select[name="priority"]', 'low');
    await page.selectOption('select[name="status"]', 'pending');

    await page.click('button[type="submit"]:has-text("Create Task")');
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

    // Navigate back to tasks list
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/\/tasks$/);

    // Find the created task card
    const taskCard = page.locator('.task-card').filter({ hasText: 'Task with no linked items' });
    await expect(taskCard).toBeVisible();

    // Verify no linked items count badge is shown
    const itemsCountBadge = taskCard.locator('.linked-items-count');
    await expect(itemsCountBadge).not.toBeVisible();
  });

  /**
   * Edge case: Validation for conflicting work_item_id and source fields
   */
  test('should prevent setting both work_item_id and source JSONB', async ({ page }) => {
    // This test verifies backend validation prevents conflicting fields
    await page.goto('http://localhost:5173/tasks/new');
    await page.fill('input[name="title"]', 'Task with conflicting work items');
    await page.selectOption('select[name="priority"]', 'medium');
    await page.selectOption('select[name="status"]', 'pending');

    // Try to set both single work item AND multiple work items
    // This should be prevented by the UI or backend validation

    // Select single work item (work_item_id)
    await page.selectOption('select[name="work_item_type"]', 'dossier');
    await page.fill('input[name="work_item_id"]', 'single-dossier-id');

    // Then try to add multiple work items (source JSONB)
    await page.click('button:has-text("Add Work Items")');
    await page.click('button:has-text("Add Dossier")');
    await page.fill('input[placeholder="Search dossiers"]', 'Australia');
    await page.waitForSelector('div[role="option"]:has-text("Australia")');
    await page.click('div[role="option"]:has-text("Australia")');
    await page.click('button:has-text("Confirm")');

    // Submit should fail with validation error
    await page.click('button[type="submit"]:has-text("Create Task")');

    // Expect validation error message
    await expect(page.locator('.error-message')).toContainText('Cannot set both work_item_id and source');
  });
});
