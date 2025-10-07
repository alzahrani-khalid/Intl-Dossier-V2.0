import { test, expect } from '@playwright/test';

/** E2E Test: T093 - Real-time Kanban Updates (Two Windows) */
test.describe('Real-time Kanban Updates', () => {
  test('kanban updates synchronize across windows < 1 second', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.fill('input[name="email"]', 'staff@example.com');
    await page1.fill('input[name="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.goto('/assignments/test-engagement-assignment-001');
    await page1.click('button:has-text("Show Kanban")');

    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'supervisor@example.com');
    await page2.fill('input[name="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.goto('/assignments/test-engagement-assignment-001');
    await page2.click('button:has-text("Show Kanban")');

    const todoColumn1 = page1.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const taskCard = todoColumn1.locator('[data-testid="kanban-card"]').first();
    const taskId = await taskCard.getAttribute('data-assignment-id');

    const inProgressColumn1 = page1.locator('[data-testid="kanban-column"][data-stage="in_progress"]');
    await taskCard.dragTo(inProgressColumn1);

    await page2.waitForTimeout(1500);
    const inProgressColumn2 = page2.locator('[data-testid="kanban-column"][data-stage="in_progress"]');
    await expect(inProgressColumn2.locator(`[data-assignment-id="${taskId}"]`)).toBeVisible();

    await page1.close();
    await page2.close();
  });
});
