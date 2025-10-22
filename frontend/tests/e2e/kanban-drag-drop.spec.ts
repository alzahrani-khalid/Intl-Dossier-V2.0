import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Kanban Drag-and-Drop Functionality
 * Feature: 025-unified-tasks-model
 * User Story: US3 - Manage Engagement Tasks via Kanban
 * Tasks: T065-T067
 */

test.describe('Kanban Board Drag-and-Drop', () => {
  let page: Page;
  let testEngagementId: string;
  let testTaskId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Login with test credentials
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[type="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for authentication to complete
    await page.waitForURL('**/tasks', { timeout: 10000 });

    // Create test engagement for kanban testing
    // Note: This assumes an API endpoint exists to create engagements
    const response = await page.request.post('/api/engagements', {
      data: {
        title: 'E2E Test Engagement - Kanban',
        description: 'Test engagement for kanban drag-drop E2E tests',
      },
    });
    const engagement = await response.json();
    testEngagementId = engagement.id;

    // Create test task in "todo" stage
    const taskResponse = await page.request.post('/api/tasks', {
      data: {
        title: 'E2E Test Task - Drag and Drop',
        description: 'Task for testing drag-and-drop functionality',
        engagement_id: testEngagementId,
        workflow_stage: 'todo',
        status: 'pending',
        priority: 'medium',
      },
    });
    const task = await taskResponse.json();
    testTaskId = task.id;
  });

  test.afterAll(async () => {
    // Cleanup: Delete test task and engagement
    if (testTaskId) {
      await page.request.delete(`/api/tasks/${testTaskId}`);
    }
    if (testEngagementId) {
      await page.request.delete(`/api/engagements/${testEngagementId}`);
    }
    await page.close();
  });

  test.describe('T065: Drag task from "todo" to "in_progress" and verify workflow_stage updates', () => {
    test('should successfully drag task between columns', async () => {
      // Navigate to engagement kanban board
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);

      // Wait for kanban board to load
      await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 5000 });

      // Verify task appears in "todo" column initially
      const todoColumn = page.locator('[data-testid="kanban-column-todo"]');
      await expect(todoColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).toBeVisible();

      // Get task card element
      const taskCard = page.locator(`[data-testid="task-card-${testTaskId}"]`);

      // Get "in_progress" column element
      const inProgressColumn = page.locator('[data-testid="kanban-column-in_progress"]');

      // Perform drag-and-drop operation
      await taskCard.dragTo(inProgressColumn, {
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 10, y: 10 },
      });

      // Wait for optimistic update and backend sync
      await page.waitForTimeout(1000);

      // Verify task now appears in "in_progress" column
      await expect(inProgressColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).toBeVisible();

      // Verify task no longer in "todo" column
      await expect(todoColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).not.toBeVisible();

      // Verify workflow_stage updated in database via API
      const response = await page.request.get(`/api/tasks/${testTaskId}`);
      const updatedTask = await response.json();
      expect(updatedTask.workflow_stage).toBe('in_progress');
      expect(updatedTask.status).toBe('in_progress');
    });

    test('should persist drag-and-drop changes after page refresh', async () => {
      // Navigate to kanban board
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);
      await page.waitForSelector('[data-testid="kanban-board"]');

      // Verify task is still in "in_progress" column after page refresh
      const inProgressColumn = page.locator('[data-testid="kanban-column-in_progress"]');
      await expect(inProgressColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).toBeVisible();

      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="kanban-board"]');

      // Verify task persists in "in_progress" column
      await expect(inProgressColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).toBeVisible();
    });
  });

  test.describe('T066: Completed tasks appear in "done" column with completion indicators', () => {
    test('should display completed task in "done" column with completion metadata', async () => {
      // Navigate to kanban board
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);
      await page.waitForSelector('[data-testid="kanban-board"]');

      // Get task card and drag to "done" column
      const taskCard = page.locator(`[data-testid="task-card-${testTaskId}"]`);
      const doneColumn = page.locator('[data-testid="kanban-column-done"]');

      await taskCard.dragTo(doneColumn, {
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 10, y: 10 },
      });

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify task appears in "done" column
      await expect(doneColumn.locator(`text="${'E2E Test Task - Drag and Drop'}"`)).toBeVisible();

      // Verify completion indicators are present
      const completedTaskCard = doneColumn.locator(`[data-testid="task-card-${testTaskId}"]`);

      // Check for completion badge or icon
      await expect(completedTaskCard.locator('[data-testid="completion-indicator"]')).toBeVisible();

      // Verify task status updated to "completed" via API
      const response = await page.request.get(`/api/tasks/${testTaskId}`);
      const completedTask = await response.json();
      expect(completedTask.workflow_stage).toBe('done');
      expect(completedTask.status).toBe('completed');
      expect(completedTask.completed_at).toBeTruthy();
      expect(completedTask.completed_by).toBeTruthy();
    });

    test('should show completed timestamp on hover/click', async () => {
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);
      await page.waitForSelector('[data-testid="kanban-board"]');

      const doneColumn = page.locator('[data-testid="kanban-column-done"]');
      const completedTaskCard = doneColumn.locator(`[data-testid="task-card-${testTaskId}"]`);

      // Click on completed task to open detail view
      await completedTaskCard.click();

      // Wait for task detail dialog/page to open
      await page.waitForSelector('[data-testid="task-detail"]');

      // Verify completion timestamp is displayed
      await expect(page.locator('[data-testid="completed-at"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-by"]')).toBeVisible();
    });
  });

  test.describe('T067: Network failure during drag - verify card returns with error message', () => {
    test('should revert card position on network failure and show error notification', async () => {
      // Create a fresh test task for network failure testing
      const networkTestTask = await page.request.post('/api/tasks', {
        data: {
          title: 'E2E Network Failure Test Task',
          description: 'Task for testing network failure handling',
          engagement_id: testEngagementId,
          workflow_stage: 'todo',
          status: 'pending',
          priority: 'high',
        },
      });
      const networkTestTaskData = await networkTestTask.json();
      const networkTestTaskId = networkTestTaskData.id;

      // Navigate to kanban board
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);
      await page.waitForSelector('[data-testid="kanban-board"]');

      // Simulate network failure by going offline before drag
      await page.context().setOffline(true);

      // Attempt to drag task from "todo" to "review"
      const taskCard = page.locator(`[data-testid="task-card-${networkTestTaskId}"]`);
      const reviewColumn = page.locator('[data-testid="kanban-column-review"]');
      const todoColumn = page.locator('[data-testid="kanban-column-todo"]');

      await taskCard.dragTo(reviewColumn, {
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 10, y: 10 },
      });

      // Wait for retry attempts to complete (3 retries with exponential backoff)
      // 500ms + 1000ms + 2000ms = ~3500ms total
      await page.waitForTimeout(4000);

      // Verify error toast notification appears
      await expect(page.locator('[data-testid="toast-notification"]')).toBeVisible();
      await expect(page.locator('text=/Failed to move task/i')).toBeVisible();

      // Verify task card reverted to original "todo" column
      await expect(todoColumn.locator(`text="${'E2E Network Failure Test Task'}"`)).toBeVisible();
      await expect(reviewColumn.locator(`text="${'E2E Network Failure Test Task'}"`)).not.toBeVisible();

      // Restore network connection
      await page.context().setOffline(false);

      // Verify task still in "todo" stage in database
      const response = await page.request.get(`/api/tasks/${networkTestTaskId}`);
      const unchangedTask = await response.json();
      expect(unchangedTask.workflow_stage).toBe('todo');
      expect(unchangedTask.status).toBe('pending');

      // Cleanup network test task
      await page.request.delete(`/api/tasks/${networkTestTaskId}`);
    });

    test('should show loading indicator during retry attempts (<200ms visibility)', async () => {
      // Create test task for loading indicator testing
      const loadingTestTask = await page.request.post('/api/tasks', {
        data: {
          title: 'E2E Loading Indicator Test Task',
          description: 'Task for testing loading indicator during retries',
          engagement_id: testEngagementId,
          workflow_stage: 'todo',
          status: 'pending',
          priority: 'low',
        },
      });
      const loadingTestTaskData = await loadingTestTask.json();
      const loadingTestTaskId = loadingTestTaskData.id;

      // Navigate to kanban board
      await page.goto(`http://localhost:5173/engagements/${testEngagementId}/kanban`);
      await page.waitForSelector('[data-testid="kanban-board"]');

      // Throttle network to "Slow 3G" to see loading indicator
      await page.route('**/api/tasks/**', route => {
        // Delay response by 500ms to trigger loading state
        setTimeout(() => route.continue(), 500);
      });

      // Drag task
      const taskCard = page.locator(`[data-testid="task-card-${loadingTestTaskId}"]`);
      const inProgressColumn = page.locator('[data-testid="kanban-column-in_progress"]');

      await taskCard.dragTo(inProgressColumn);

      // Verify loading indicator appears within 200ms (NFR-010)
      const loadingIndicator = page.locator(`[data-testid="task-loading-${loadingTestTaskId}"]`);
      await expect(loadingIndicator).toBeVisible({ timeout: 200 });

      // Wait for operation to complete
      await page.waitForTimeout(1000);

      // Verify loading indicator disappears after success
      await expect(loadingIndicator).not.toBeVisible();

      // Cleanup
      await page.request.delete(`/api/tasks/${loadingTestTaskId}`);
    });
  });
});

test.describe('Kanban Board Accessibility', () => {
  test('should support keyboard navigation for drag-and-drop', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[type="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/tasks');

    // Navigate to any engagement kanban board
    await page.goto('http://localhost:5173/engagements');
    await page.waitForSelector('[data-testid="engagement-list"]');

    // Click first engagement to open kanban
    await page.click('[data-testid="engagement-item"]:first-child');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Tab to first task card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify task card is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toContain('task-card');

    // Use keyboard to activate drag (Space key)
    await page.keyboard.press('Space');

    // Use arrow keys to move to different column
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space'); // Drop

    // Verify accessibility announcement
    await expect(page.locator('[role="status"]')).toContainText(/moved/i);
  });
});
