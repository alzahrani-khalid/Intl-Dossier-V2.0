import { test, expect } from '@playwright/test';

/**
 * E2E Test: React to Comment (T078)
 * Tests emoji reaction functionality on comments
 *
 * Validates:
 * - Add reaction to comment
 * - Reaction count updates
 * - Toggle reaction (add/remove)
 * - Reaction tooltip shows users
 */

test.describe('React to Comment', () => {
  let testAssignmentId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Login and create assignment with comment
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Create test assignment
    const response = await page.request.post('/functions/v1/assignments-auto-assign', {
      data: { work_item_type: 'dossier', work_item_id: 'test-dossier-001' }
    });
    const data = await response.json();
    testAssignmentId = data.id;

    await page.goto(`/assignments/${testAssignmentId}`);

    // Add a test comment
    await page.fill('[data-testid="comment-input"]', 'This is a test comment');
    await page.click('[data-testid="submit-comment-button"]');
    await expect(page.locator('[data-testid="comment-item"]')).toBeVisible();
  });

  test('should add reaction to comment', async ({ page }) => {
    // Hover over comment to show reaction picker
    const comment = page.locator('[data-testid="comment-item"]').first();
    await comment.hover();

    // Click reaction picker button
    await page.click('[data-testid="add-reaction-button"]');

    // Verify reaction picker is visible
    await expect(page.locator('[data-testid="reaction-picker"]')).toBeVisible();

    // Click thumbs up emoji
    await page.click('[data-testid="reaction-emoji-👍"]');

    // Verify reaction badge appears with count "1"
    await expect(comment.locator('[data-testid="reaction-badge-👍"]')).toBeVisible();
    await expect(comment.locator('[data-testid="reaction-badge-👍"]')).toContainText('1');

    // Verify reaction picker closes
    await expect(page.locator('[data-testid="reaction-picker"]')).not.toBeVisible();
  });

  test('should show reaction tooltip with user names', async ({ page }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();

    // Add reaction
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-✅"]');

    // Hover over reaction badge
    const reactionBadge = comment.locator('[data-testid="reaction-badge-✅"]');
    await reactionBadge.hover();

    // Verify tooltip shows user name
    await expect(page.locator('[data-testid="reaction-tooltip"]')).toBeVisible({ timeout: 500 });
    await expect(page.locator('[data-testid="reaction-tooltip"]')).toContainText(/test\.staff/i);
  });

  test('should toggle reaction (remove on second click)', async ({ page }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();

    // Add reaction
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-❤️"]');

    // Verify reaction appears
    await expect(comment.locator('[data-testid="reaction-badge-❤️"]')).toBeVisible();
    await expect(comment.locator('[data-testid="reaction-badge-❤️"]')).toContainText('1');

    // Click same reaction again to remove it
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-❤️"]');

    // Verify reaction is removed (badge disappears)
    await expect(comment.locator('[data-testid="reaction-badge-❤️"]')).not.toBeVisible();
  });

  test('should increment count when multiple users react', async ({ page, browser }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();

    // User 1: Add reaction
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-🎯"]');

    await expect(comment.locator('[data-testid="reaction-badge-🎯"]')).toContainText('1');

    // Open second user session
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', 'test.supervisor@gastat.gov.sa');
    await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page2.click('[data-testid="login-button"]');
    await expect(page2).toHaveURL(/\/dashboard/);

    // Escalate to give supervisor access
    await page.click('[data-testid="escalate-button"]');
    await page.fill('[data-testid="escalation-reason"]', 'Need supervisor input');
    await page.click('[data-testid="confirm-escalate-button"]');
    await page.waitForTimeout(1000);

    await page2.goto(`/assignments/${testAssignmentId}`);

    // User 2: Add same reaction
    const comment2 = page2.locator('[data-testid="comment-item"]').first();
    await comment2.hover();
    await page2.click('[data-testid="add-reaction-button"]');
    await page2.click('[data-testid="reaction-emoji-🎯"]');

    // Verify count updates to 2 in both windows
    await expect(comment.locator('[data-testid="reaction-badge-🎯"]')).toContainText('2', { timeout: 2000 });
    await expect(comment2.locator('[data-testid="reaction-badge-🎯"]')).toContainText('2');

    // Verify tooltip shows both users
    await comment.locator('[data-testid="reaction-badge-🎯"]').hover();
    await expect(page.locator('[data-testid="reaction-tooltip"]')).toContainText(/test\.staff/i);
    await expect(page.locator('[data-testid="reaction-tooltip"]')).toContainText(/supervisor/i);

    await context2.close();
  });

  test('should support all allowed emoji reactions', async ({ page }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();
    const allowedEmojis = ['👍', '✅', '❓', '❤️', '🎯', '💡'];

    for (const emoji of allowedEmojis) {
      // Add reaction
      await comment.hover();
      await page.click('[data-testid="add-reaction-button"]');
      await page.click(`[data-testid="reaction-emoji-${emoji}"]`);

      // Verify reaction badge appears
      await expect(comment.locator(`[data-testid="reaction-badge-${emoji}"]`)).toBeVisible();
    }

    // Verify all 6 reactions are visible
    const reactionBadges = comment.locator('[data-testid^="reaction-badge-"]');
    await expect(reactionBadges).toHaveCount(6);
  });

  test('should allow user to have only one of each emoji per comment', async ({ page }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();

    // Add thumbs up reaction twice
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-👍"]');

    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-👍"]');

    // Verify count remains 0 (removed on second click due to toggle behavior)
    await expect(comment.locator('[data-testid="reaction-badge-👍"]')).not.toBeVisible();
  });

  test('should persist reactions after page reload', async ({ page }) => {
    const comment = page.locator('[data-testid="comment-item"]').first();

    // Add multiple reactions
    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-👍"]');

    await comment.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-✅"]');

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="comment-item"]').first()).toBeVisible();

    // Verify reactions are still present
    const reloadedComment = page.locator('[data-testid="comment-item"]').first();
    await expect(reloadedComment.locator('[data-testid="reaction-badge-👍"]')).toBeVisible();
    await expect(reloadedComment.locator('[data-testid="reaction-badge-✅"]')).toBeVisible();
  });

  test('should update reactions in real-time between windows', async ({ page, browser }) => {
    // Setup second window
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page2.click('[data-testid="login-button"]');
    await page2.goto(`/assignments/${testAssignmentId}`);

    // Window 1: Add reaction
    const comment1 = page.locator('[data-testid="comment-item"]').first();
    await comment1.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="reaction-emoji-💡"]');

    // Window 2: Verify reaction appears within 1 second
    const comment2 = page2.locator('[data-testid="comment-item"]').first();
    await expect(comment2.locator('[data-testid="reaction-badge-💡"]')).toBeVisible({ timeout: 1000 });
    await expect(comment2.locator('[data-testid="reaction-badge-💡"]')).toContainText('1');

    await context2.close();
  });
});
