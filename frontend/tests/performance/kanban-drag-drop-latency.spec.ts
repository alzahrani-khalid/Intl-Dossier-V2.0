import { test, expect } from '@playwright/test';

/**
 * Performance Test: T097 - Kanban Drag-Drop Latency
 * Optimistic update < 100ms, database persistence < 500ms.
 */

test.describe('Kanban Drag-Drop Latency', () => {
  test('optimistic update latency < 100ms', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.click('button:has-text("Show Kanban")');

    const todoColumn = page.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const taskCard = todoColumn.locator('[data-testid="kanban-card"]').first();
    const inProgressColumn = page.locator('[data-testid="kanban-column"][data-stage="in_progress"]');

    const startTime = Date.now();
    await taskCard.dragTo(inProgressColumn);
    
    await inProgressColumn.locator('[data-testid="kanban-card"]').first().waitFor({ state: 'visible' });
    const endTime = Date.now();
    const latency = endTime - startTime;

    expect(latency).toBeLessThan(100);
    console.log(`Optimistic update latency: ${latency}ms`);
  });

  test('database persistence latency < 500ms', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.click('button:has-text("Show Kanban")');

    const todoColumn = page.locator('[data-testid="kanban-column"][data-stage="todo"]');
    const taskCard = todoColumn.locator('[data-testid="kanban-card"]').first();
    const taskId = await taskCard.getAttribute('data-assignment-id');
    const inProgressColumn = page.locator('[data-testid="kanban-column"][data-stage="in_progress"]');

    const startTime = Date.now();
    await taskCard.dragTo(inProgressColumn);
    
    await page.waitForResponse(resp => resp.url().includes('workflow-stage-update') && resp.status() === 200, { timeout: 1000 });
    const endTime = Date.now();
    const latency = endTime - startTime;

    expect(latency).toBeLessThan(500);
    console.log(`Database persistence latency: ${latency}ms`);
  });
});
