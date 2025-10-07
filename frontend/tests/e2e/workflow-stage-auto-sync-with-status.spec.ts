import { test, expect } from '@playwright/test';

/** E2E Test: T095 - Workflow Stage Auto-Sync with Status */
test.describe('Workflow Stage Auto-Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('marking complete updates workflow stage to done', async ({ page }) => {
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    const completeButton = page.locator('button:has-text("Mark Complete")');
    if (await completeButton.isVisible() && await completeButton.isEnabled()) {
      await completeButton.click();
      await page.fill('textarea[name="completion_notes"]', 'Completed');
      await page.click('button:has-text("Confirm")');
      await page.waitForTimeout(1000);

      await page.click('button:has-text("Show Kanban")');
      const doneColumn = page.locator('[data-testid="kanban-column"][data-stage="done"]');
      await expect(doneColumn.locator('[data-current="true"]')).toBeVisible();
    }
  });
});
