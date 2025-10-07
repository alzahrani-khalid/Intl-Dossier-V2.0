import { test, expect } from '@playwright/test';

/**
 * E2E Test: T088 - View Engagement-Linked Assignment
 *
 * Verifies that assignments linked to an engagement display the engagement context
 * banner, progress bar, related tasks, and kanban access.
 *
 * Tests:
 * - Engagement context banner visible
 * - Progress bar shows correct stats
 * - Related tasks listed
 * - "View Full Engagement" link present
 * - "Show Kanban" button accessible
 *
 * Related: FR-029, FR-030 (Engagement Context & Related Tasks)
 */

test.describe('View Engagement-Linked Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test staff user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('engagement context banner displays with correct information', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify engagement context banner is visible
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Verify engagement title is displayed
    await expect(contextBanner.locator('[data-testid="engagement-title"]')).toBeVisible();
    const titleText = await contextBanner.locator('[data-testid="engagement-title"]').textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);

    // Verify engagement type is displayed
    const engagementType = contextBanner.locator('[data-testid="engagement-type"]');
    if (await engagementType.isVisible()) {
      const typeText = await engagementType.textContent();
      expect(typeText).toBeTruthy();
    }

    // Verify engagement date range is displayed
    const dateRange = contextBanner.locator('[data-testid="engagement-dates"]');
    if (await dateRange.isVisible()) {
      const dateText = await dateRange.textContent();
      expect(dateText).toBeTruthy();
      // Should contain date separator like "-" or "to"
      expect(dateText).toMatch(/[-–—]|to/i);
    }
  });

  test('progress bar shows correct completion statistics', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find engagement context banner
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Verify progress bar exists
    const progressBar = contextBanner.locator('[data-testid="engagement-progress"]');
    await expect(progressBar).toBeVisible();

    // Verify progress percentage is displayed
    const progressText = await progressBar.textContent();
    expect(progressText).toMatch(/\d+%/); // Should contain percentage like "40%"

    // Verify progress stats (e.g., "2/5 tasks complete")
    const statsText = await contextBanner.locator('[data-testid="progress-stats"]').textContent();
    expect(statsText).toMatch(/\d+\/\d+/); // Should contain fraction like "2/5"

    // Verify progress bar has ARIA attributes
    const progressElement = progressBar.locator('[role="progressbar"]');
    if (await progressElement.isVisible()) {
      await expect(progressElement).toHaveAttribute('aria-valuenow');
      await expect(progressElement).toHaveAttribute('aria-valuemin', '0');
      await expect(progressElement).toHaveAttribute('aria-valuemax', '100');

      // Verify progress value is between 0 and 100
      const valueNow = await progressElement.getAttribute('aria-valuenow');
      const progressValue = parseInt(valueNow || '0');
      expect(progressValue).toBeGreaterThanOrEqual(0);
      expect(progressValue).toBeLessThanOrEqual(100);
    }
  });

  test('"View Full Engagement" button navigates to engagement detail', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find engagement context banner
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Find and click "View Full Engagement" button
    const viewEngagementButton = contextBanner.locator('button:has-text("View Full Engagement"), a:has-text("View Full Engagement")');
    await expect(viewEngagementButton).toBeVisible();

    // Get the engagement ID from the button's href or data attribute
    const href = await viewEngagementButton.getAttribute('href');

    // Click the button
    await viewEngagementButton.click();

    // Verify navigation occurred
    if (href) {
      await expect(page).toHaveURL(new RegExp(href));
    } else {
      // Should navigate to an engagement detail page
      await expect(page).toHaveURL(/\/engagements\/.+/);
    }
  });

  test('"Show Kanban" button is visible and accessible', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find engagement context banner
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Find "Show Kanban" button
    const kanbanButton = contextBanner.locator('button:has-text("Show Kanban")');
    await expect(kanbanButton).toBeVisible();

    // Verify button is enabled
    await expect(kanbanButton).toBeEnabled();

    // Verify button has accessible label
    const ariaLabel = await kanbanButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('related tasks section displays sibling assignments', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find related tasks section
    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    await expect(relatedTasks).toBeVisible();

    // Verify section has a heading
    const heading = relatedTasks.locator('h2, h3, h4').first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/related|sibling|other/i);

    // Verify at least one related task is displayed
    const taskCards = relatedTasks.locator('[data-testid="related-task-card"]');
    const taskCount = await taskCards.count();
    expect(taskCount).toBeGreaterThan(0);

    // Verify first task card has required information
    const firstTask = taskCards.first();

    // Task title
    await expect(firstTask.locator('[data-testid="task-title"]')).toBeVisible();

    // Task assignee
    const assignee = firstTask.locator('[data-testid="task-assignee"]');
    if (await assignee.isVisible()) {
      const assigneeText = await assignee.textContent();
      expect(assigneeText).toBeTruthy();
    }

    // Task status
    await expect(firstTask.locator('[data-testid="task-status"]')).toBeVisible();

    // Workflow stage badge
    const workflowBadge = firstTask.locator('[data-testid="workflow-stage"]');
    if (await workflowBadge.isVisible()) {
      const stageText = await workflowBadge.textContent();
      expect(stageText).toMatch(/todo|in.progress|review|done/i);
    }
  });

  test('current assignment NOT listed in related tasks', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Get current assignment ID from URL
    const currentUrl = page.url();
    const assignmentIdMatch = currentUrl.match(/\/assignments\/([^/]+)/);
    const currentAssignmentId = assignmentIdMatch ? assignmentIdMatch[1] : null;

    expect(currentAssignmentId).toBeTruthy();

    // Find related tasks section
    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    await expect(relatedTasks).toBeVisible();

    // Get all related task cards
    const taskCards = relatedTasks.locator('[data-testid="related-task-card"]');
    const taskCount = await taskCards.count();

    // Verify current assignment is not in the list
    for (let i = 0; i < taskCount; i++) {
      const taskCard = taskCards.nth(i);
      const taskId = await taskCard.getAttribute('data-assignment-id');
      expect(taskId).not.toBe(currentAssignmentId);
    }
  });

  test('related task cards are clickable and navigate correctly', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find related tasks section
    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');
    await expect(relatedTasks).toBeVisible();

    // Get first related task card
    const firstTask = relatedTasks.locator('[data-testid="related-task-card"]').first();
    await expect(firstTask).toBeVisible();

    // Get the task ID before clicking
    const taskId = await firstTask.getAttribute('data-assignment-id');
    expect(taskId).toBeTruthy();

    // Click the task card
    await firstTask.click();

    // Verify navigation to the sibling assignment
    await expect(page).toHaveURL(new RegExp(`/assignments/${taskId}`));

    // Verify the new assignment page loaded
    await page.waitForLoadState('networkidle');

    // Engagement context should still be visible (same engagement)
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();
  });

  test('engagement progress bar updates reflect all tasks', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Get initial progress
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    const progressBar = contextBanner.locator('[data-testid="engagement-progress"]');
    const initialProgressText = await progressBar.textContent();

    // Complete the current assignment
    const completeButton = page.locator('button:has-text("Mark Complete")');
    if (await completeButton.isVisible() && await completeButton.isEnabled()) {
      await completeButton.click();

      // Fill completion notes
      await page.fill('textarea[name="completion_notes"]', 'Task completed');
      await page.click('button:has-text("Confirm")');

      // Wait for completion to process
      await page.waitForTimeout(2000);

      // Reload page or wait for real-time update
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify progress updated
      const updatedProgressText = await progressBar.textContent();
      expect(updatedProgressText).not.toBe(initialProgressText);
    }
  });

  test('engagement banner displays in both English and Arabic', async ({ page }) => {
    // Navigate to engagement-linked assignment (English)
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify context banner visible in English
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Get English engagement title
    const englishTitle = await contextBanner.locator('[data-testid="engagement-title"]').textContent();

    // Switch to Arabic
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      await page.click('text=العربية, text=Arabic');
      await page.waitForTimeout(1000);

      // Verify page direction changed to RTL
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir).toBe('rtl');

      // Verify context banner still visible
      await expect(contextBanner).toBeVisible();

      // Engagement title should be in Arabic (or same if no translation)
      const arabicTitle = await contextBanner.locator('[data-testid="engagement-title"]').textContent();
      expect(arabicTitle).toBeTruthy();

      // Buttons should be translated
      const viewButton = contextBanner.locator('button:has-text("عرض"), button:has-text("View")');
      await expect(viewButton.first()).toBeVisible();
    }
  });

  test('engagement context has proper accessibility attributes', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find engagement context banner
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).toBeVisible();

    // Verify region role
    await expect(contextBanner).toHaveAttribute('role', 'region');

    // Verify aria-label
    await expect(contextBanner).toHaveAttribute('aria-label');

    // Verify progress bar accessibility
    const progressBar = contextBanner.locator('[role="progressbar"]');
    if (await progressBar.isVisible()) {
      await expect(progressBar).toHaveAttribute('aria-label');
      await expect(progressBar).toHaveAttribute('aria-valuenow');
      await expect(progressBar).toHaveAttribute('aria-valuemin');
      await expect(progressBar).toHaveAttribute('aria-valuemax');
    }

    // Verify buttons have accessible names
    const viewEngagementButton = contextBanner.locator('button, a').first();
    const hasAccessibleName = await viewEngagementButton.evaluate((el) => {
      return el.hasAttribute('aria-label') || el.textContent!.trim().length > 0;
    });
    expect(hasAccessibleName).toBe(true);
  });
});
