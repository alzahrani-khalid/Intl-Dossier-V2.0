import { test, expect } from '@playwright/test';

/**
 * E2E Test: T092 - Drag Task Between Kanban Columns
 * Verifies drag-and-drop functionality in the kanban board.
 */

test.describe('Drag Task Between Kanban Columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('drag task from To Do to In Progress column', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Show Kanban")');

    const todoColumn = page.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const inProgressColumn = page.locator('[data-testid="kanban-column"][data-stage="in_progress"]');
    
    const taskCard = todoColumn.locator('[data-testid="kanban-card"]').first();
    await taskCard.dragTo(inProgressColumn);

    await page.waitForTimeout(500);
    await expect(inProgressColumn.locator('[data-testid="kanban-card"]')).toContainText(await taskCard.textContent() || '');
  });

  test('column counts update after drag', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Show Kanban")');

    const todoColumn = page.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const initialCount = await todoColumn.locator('[data-testid="column-count"]').textContent();

    const taskCard = todoColumn.locator('[data-testid="kanban-card"]').first();
    const inProgressColumn = page.locator('[data-testid="kanban-column"][data-stage="in_progress"]');
    await taskCard.dragTo(inProgressColumn);

    await page.waitForTimeout(500);
    const newCount = await todoColumn.locator('[data-testid="column-count"]').textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('database persists workflow stage change', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Show Kanban")');

    const todoColumn = page.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const taskCard = todoColumn.locator('[data-testid="kanban-card"]').first();
    const taskId = await taskCard.getAttribute('data-assignment-id');

    const doneColumn = page.locator('[data-testid="kanban-column"][data-stage="done"]');
    await taskCard.dragTo(doneColumn);
    await page.waitForTimeout(1000);

    await page.click('[data-testid="close-kanban"]');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Show Kanban")');

    const doneColumnAfter = page.locator('[data-testid="kanban-column"][data-stage="done"]');
    await expect(doneColumnAfter.locator(`[data-assignment-id="${taskId}"]`)).toBeVisible();
  });
});
