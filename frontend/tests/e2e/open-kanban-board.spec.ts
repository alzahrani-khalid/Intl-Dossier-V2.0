import { test, expect } from '@playwright/test';

/**
 * E2E Test: T091 - Open Kanban Board
 * Verifies the kanban modal opens correctly with all columns and task cards.
 */

test.describe('Open Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('kanban modal opens with full-screen view', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Show Kanban")');
    const modal = page.locator('[role="dialog"][data-testid="kanban-modal"]');
    await expect(modal).toBeVisible();
  });

  test('modal shows engagement name and progress bar', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Show Kanban")');
    const modal = page.locator('[role="dialog"][data-testid="kanban-modal"]');

    await expect(modal.locator('[data-testid="engagement-title"]')).toBeVisible();
    await expect(modal.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test('displays 4 kanban columns', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Show Kanban")');
    const columns = page.locator('[data-testid="kanban-column"]');
    expect(await columns.count()).toBe(4);
  });

  test('current assignment highlighted with star', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Show Kanban")');
    const currentCard = page.locator('[data-testid="kanban-card"][data-current="true"]');
    await expect(currentCard).toBeVisible();
  });

  test('close button closes kanban modal', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Show Kanban")');
    const modal = page.locator('[role="dialog"][data-testid="kanban-modal"]');
    await expect(modal).toBeVisible();

    await page.click('[data-testid="close-kanban"]');
    await expect(modal).not.toBeVisible();
  });
});
