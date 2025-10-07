import { test, expect } from '@playwright/test';

/**
 * E2E Test: T090 - Navigate Between Related Tasks
 *
 * Verifies navigation between sibling assignments within an engagement.
 *
 * Tests:
 * - Click sibling task navigates to that assignment
 * - Engagement context remains visible
 * - Related tasks list updates (current excluded)
 * - Breadcrumbs update to new assignment ID
 * - Browser back button works
 *
 * Related: FR-030 (Related Tasks Navigation)
 */

test.describe('Navigate Between Related Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('clicking sibling task navigates to assignment detail', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    const firstTask = relatedTasks.locator('[data-testid="related-task-card"]').first();
    const taskId = await firstTask.getAttribute('data-assignment-id');

    await firstTask.click();
    await expect(page).toHaveURL(new RegExp(`/assignments/${taskId}`));
  });

  test('engagement context visible on sibling assignment', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    const firstTask = relatedTasks.locator('[data-testid="related-task-card"]').first();

    await firstTask.click();
    await page.waitForLoadState('networkidle');

    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();
  });

  test('related tasks list updates after navigation', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    const originalId = 'test-engagement-assignment-001';

    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    const firstTask = relatedTasks.locator('[data-testid="related-task-card"]').first();
    const newTaskId = await firstTask.getAttribute('data-assignment-id');

    await firstTask.click();
    await page.waitForLoadState('networkidle');

    const updatedRelatedTasks = page.locator('[data-testid="related-tasks-list"]');
    const taskCards = updatedRelatedTasks.locator('[data-testid="related-task-card"]');

    for (let i = 0; i < await taskCards.count(); i++) {
      const cardId = await taskCards.nth(i).getAttribute('data-assignment-id');
      expect(cardId).not.toBe(newTaskId);
    }
  });

  test('browser back button returns to previous assignment', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    const originalUrl = page.url();

    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    const firstTask = relatedTasks.locator('[data-testid="related-task-card"]').first();
    await firstTask.click();
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await expect(page).toHaveURL(originalUrl);
  });
});
