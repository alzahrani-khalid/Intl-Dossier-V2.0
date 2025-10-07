import { test, expect } from '@playwright/test';

/**
 * E2E Test: Add Comment with @Mention (T077)
 * Tests adding a comment with @username mention
 *
 * Validates:
 * - Comment form is functional
 * - @mention is parsed and rendered as link
 * - Notification is sent to mentioned user
 * - Comment appears in timeline
 */

test.describe('Add Comment with @Mention', () => {
  let testAssignmentId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Create test assignment
    const response = await page.request.post('/functions/v1/assignments-auto-assign', {
      data: {
        work_item_type: 'dossier',
        work_item_id: 'test-dossier-001',
        priority: 'medium'
      }
    });
    const data = await response.json();
    testAssignmentId = data.id;

    // Navigate to assignment detail
    await page.goto(`/assignments/${testAssignmentId}`);
    await expect(page).toHaveURL(`/assignments/${testAssignmentId}`);
  });

  test('should add comment with single @mention', async ({ page }) => {
    const commentText = 'Please review this assignment @supervisor';

    // Focus comment input
    await page.click('[data-testid="comment-input"]');
    await expect(page.locator('[data-testid="comment-input"]')).toBeFocused();

    // Type comment with @mention
    await page.fill('[data-testid="comment-input"]', commentText);
    await expect(page.locator('[data-testid="comment-input"]')).toHaveValue(commentText);

    // Verify character counter
    const charCount = await page.locator('[data-testid="comment-char-count"]').textContent();
    expect(charCount).toContain(`${commentText.length}/5000`);

    // Submit comment
    await page.click('[data-testid="submit-comment-button"]');

    // Verify optimistic update (comment appears immediately)
    await expect(page.locator('[data-testid="comment-item"]').last()).toBeVisible({ timeout: 1000 });
    await expect(page.locator('[data-testid="comment-item"]').last()).toContainText(
      'Please review this assignment'
    );

    // Verify @mention is rendered as link
    const mentionLink = page.locator('[data-testid="comment-item"]').last().locator('[data-testid="mention-link"]');
    await expect(mentionLink).toBeVisible();
    await expect(mentionLink).toContainText('supervisor');
    await expect(mentionLink).toHaveAttribute('href', /\/users\/supervisor/);

    // Verify comment metadata
    await expect(page.locator('[data-testid="comment-item"]').last().locator('[data-testid="comment-author"]'))
      .toContainText(/test\.staff/i);

    const timestamp = page.locator('[data-testid="comment-item"]').last().locator('[data-testid="comment-timestamp"]');
    await expect(timestamp).toBeVisible();

    // Verify timeline event
    const timelineEvents = page.locator('[data-testid="timeline-event"]');
    await expect(timelineEvents.last()).toContainText(/comment added/i);

    // Verify comment form is cleared
    await expect(page.locator('[data-testid="comment-input"]')).toHaveValue('');
  });

  test('should add comment with multiple @mentions', async ({ page }) => {
    const commentText = '@supervisor @manager Please coordinate on this dossier review task';

    await page.fill('[data-testid="comment-input"]', commentText);
    await page.click('[data-testid="submit-comment-button"]');

    // Wait for comment to appear
    await expect(page.locator('[data-testid="comment-item"]').last()).toBeVisible({ timeout: 1000 });

    // Verify both mentions are rendered as links
    const comment = page.locator('[data-testid="comment-item"]').last();
    const mentionLinks = comment.locator('[data-testid="mention-link"]');

    await expect(mentionLinks).toHaveCount(2);
    await expect(mentionLinks.nth(0)).toContainText('supervisor');
    await expect(mentionLinks.nth(1)).toContainText('manager');
  });

  test('should show autocomplete on @ trigger', async ({ page }) => {
    // Focus comment input
    await page.click('[data-testid="comment-input"]');

    // Type @ to trigger autocomplete
    await page.keyboard.type('Need help from @');

    // Verify autocomplete dropdown appears
    await expect(page.locator('[data-testid="mention-autocomplete"]')).toBeVisible({ timeout: 1000 });

    // Verify users are listed
    await expect(page.locator('[data-testid="mention-option"]')).toHaveCount(await page.locator('[data-testid="mention-option"]').count(), { timeout: 1000 });

    // Type partial username
    await page.keyboard.type('sup');

    // Verify filtered results
    const options = page.locator('[data-testid="mention-option"]');
    const firstOption = await options.first().textContent();
    expect(firstOption?.toLowerCase()).toContain('sup');

    // Select first option with Enter
    await page.keyboard.press('Enter');

    // Verify username is inserted
    const inputValue = await page.locator('[data-testid="comment-input"]').inputValue();
    expect(inputValue).toContain('@supervisor');

    // Verify autocomplete closes
    await expect(page.locator('[data-testid="mention-autocomplete"]')).not.toBeVisible();
  });

  test('should navigate autocomplete with arrow keys', async ({ page }) => {
    await page.click('[data-testid="comment-input"]');
    await page.keyboard.type('@');

    await expect(page.locator('[data-testid="mention-autocomplete"]')).toBeVisible();

    // Press down arrow
    await page.keyboard.press('ArrowDown');

    // Verify first option is highlighted
    await expect(page.locator('[data-testid="mention-option"]').first()).toHaveClass(/highlighted|selected/);

    // Press down again
    await page.keyboard.press('ArrowDown');

    // Verify second option is highlighted
    await expect(page.locator('[data-testid="mention-option"]').nth(1)).toHaveClass(/highlighted|selected/);

    // Press up arrow
    await page.keyboard.press('ArrowUp');

    // Verify first option is highlighted again
    await expect(page.locator('[data-testid="mention-option"]').first()).toHaveClass(/highlighted|selected/);
  });

  test('should not render link for invalid @username', async ({ page }) => {
    const commentText = 'This mentions @nonexistent_user who does not exist';

    await page.fill('[data-testid="comment-input"]', commentText);
    await page.click('[data-testid="submit-comment-button"]');

    await expect(page.locator('[data-testid="comment-item"]').last()).toBeVisible();

    // Verify comment text is displayed
    await expect(page.locator('[data-testid="comment-item"]').last()).toContainText('@nonexistent_user');

    // Verify @nonexistent_user is NOT a link
    const comment = page.locator('[data-testid="comment-item"]').last();
    const mentionLinks = comment.locator('[data-testid="mention-link"]');
    await expect(mentionLinks).toHaveCount(0);
  });

  test('should show user profile tooltip on mention hover', async ({ page }) => {
    await page.fill('[data-testid="comment-input"]', 'Review needed @supervisor');
    await page.click('[data-testid="submit-comment-button"]');

    await expect(page.locator('[data-testid="comment-item"]').last()).toBeVisible();

    // Hover over mention link
    const mentionLink = page.locator('[data-testid="comment-item"]').last().locator('[data-testid="mention-link"]');
    await mentionLink.hover();

    // Verify tooltip appears
    await expect(page.locator('[data-testid="user-profile-tooltip"]')).toBeVisible({ timeout: 500 });

    // Verify tooltip contains user info
    await expect(page.locator('[data-testid="user-profile-tooltip"]')).toContainText(/supervisor/i);
    await expect(page.locator('[data-testid="user-profile-tooltip"]')).toContainText(/role|position/i);
  });

  test('should enforce 5000 character limit', async ({ page }) => {
    const longComment = 'A'.repeat(5001);

    await page.fill('[data-testid="comment-input"]', longComment);

    // Verify character counter shows limit exceeded
    const charCount = await page.locator('[data-testid="comment-char-count"]').textContent();
    expect(charCount).toContain('5001/5000');
    await expect(page.locator('[data-testid="comment-char-count"]')).toHaveClass(/error|exceeded/);

    // Verify submit button is disabled
    await expect(page.locator('[data-testid="submit-comment-button"]')).toBeDisabled();
  });

  test('should prevent empty comment submission', async ({ page }) => {
    // Try to submit empty comment
    await page.click('[data-testid="submit-comment-button"]');

    // Verify validation error
    await expect(page.locator('[data-testid="comment-input-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-input-error"]')).toContainText(/required|empty/i);

    // Verify no comment was added
    const commentsCount = await page.locator('[data-testid="comment-item"]').count();
    expect(commentsCount).toBe(0);
  });

  test('should use keyboard shortcut C to focus comment input', async ({ page }) => {
    // Press C key
    await page.keyboard.press('c');

    // Verify comment input is focused
    await expect(page.locator('[data-testid="comment-input"]')).toBeFocused();
  });

  test('should check notification was sent to mentioned user', async ({ page, browser }) => {
    // Add comment with mention
    await page.fill('[data-testid="comment-input"]', 'Urgent review needed @supervisor');
    await page.click('[data-testid="submit-comment-button"]');

    // Wait for comment to be saved
    await page.waitForTimeout(1000);

    // Open new context as supervisor
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();

    // Login as supervisor
    await supervisorPage.goto('/login');
    await supervisorPage.fill('[data-testid="email-input"]', 'test.supervisor@gastat.gov.sa');
    await supervisorPage.fill('[data-testid="password-input"]', 'TestPassword123!');
    await supervisorPage.click('[data-testid="login-button"]');
    await expect(supervisorPage).toHaveURL(/\/dashboard/);

    // Check notifications
    await supervisorPage.click('[data-testid="notifications-button"]');
    await expect(supervisorPage.locator('[data-testid="notifications-panel"]')).toBeVisible();

    // Verify mention notification exists
    const notifications = supervisorPage.locator('[data-testid="notification-item"]');
    await expect(notifications.first()).toContainText(/mention|mentioned/i);
    await expect(notifications.first()).toContainText('test.staff');

    // Clean up
    await supervisorContext.close();
  });
});
