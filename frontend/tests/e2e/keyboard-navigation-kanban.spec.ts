import { test, expect } from '@playwright/test';

/** E2E Test: T094 - Keyboard Navigation in Kanban */
test.describe('Keyboard Navigation Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.click('button:has-text("Show Kanban")');
  });

  test('Tab navigates through kanban cards', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('Escape closes kanban modal', async ({ page }) => {
    const modal = page.locator('[role="dialog"][data-testid="kanban-modal"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Enter opens focused card detail', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const taskId = await focused.getAttribute('data-assignment-id');
    await page.keyboard.press('Enter');
    if (taskId) {
      await expect(page).toHaveURL(new RegExp(`/assignments/${taskId}`));
    }
  });
});
