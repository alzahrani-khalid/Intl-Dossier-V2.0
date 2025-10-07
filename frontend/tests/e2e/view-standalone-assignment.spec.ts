import { test, expect } from '@playwright/test';

/**
 * E2E Test: T089 - View Standalone Assignment
 *
 * Verifies that standalone assignments (not linked to an engagement) display
 * correctly without engagement context banner or kanban features.
 *
 * Tests:
 * - No engagement context banner visible
 * - No "Show Kanban" button
 * - Related tasks section empty or shows simple dossier-level tasks
 * - Page functions normally otherwise
 *
 * Related: FR-029, FR-030 (Engagement Context - Standalone Case)
 */

test.describe('View Standalone Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test staff user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('no engagement context banner for standalone assignment', async ({ page }) => {
    // Navigate to standalone assignment (from intake, no engagement_id)
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify engagement context banner is NOT visible
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).not.toBeVisible();

    // Verify assignment detail page loaded correctly
    await expect(page.locator('[data-testid="assignment-metadata"]')).toBeVisible();
  });

  test('no "Show Kanban" button for standalone assignment', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify "Show Kanban" button is NOT present
    const kanbanButton = page.locator('button:has-text("Show Kanban")');
    await expect(kanbanButton).not.toBeVisible();

    // Alternative: check kanban button with data-testid
    const kanbanButtonTestId = page.locator('[data-testid="show-kanban-button"]');
    await expect(kanbanButtonTestId).not.toBeVisible();
  });

  test('page functions normally without engagement context', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify all standard sections are visible
    await expect(page.locator('[data-testid="assignment-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-countdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="work-item-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="checklist-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();

    // Verify can add comments
    const commentInput = page.locator('textarea[name="comment"]');
    await commentInput.fill('Test comment on standalone assignment');
    await page.click('button:has-text("Post Comment")');
    await expect(page.locator('text=Test comment on standalone assignment')).toBeVisible();

    // Verify can manage checklist
    await page.click('button:has-text("Import Checklist")');
    await page.click('text=Dossier Review');
    await page.waitForTimeout(1000);
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  });

  test('related tasks section shows dossier-level tasks only', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find related tasks section
    const relatedTasks = page.locator('[data-testid="related-tasks-list"]');

    // Either section is not visible, or shows only dossier-level tasks
    if (await relatedTasks.isVisible()) {
      // If visible, verify it shows dossier context, not engagement
      const heading = relatedTasks.locator('h2, h3, h4').first();
      const headingText = await heading.textContent();

      // Should mention "dossier" not "engagement"
      expect(headingText?.toLowerCase()).not.toContain('engagement');
      expect(headingText?.toLowerCase()).toMatch(/dossier|related/i);

      // Task cards (if any) should not have engagement workflow stages
      const taskCards = relatedTasks.locator('[data-testid="related-task-card"]');
      const taskCount = await taskCards.count();

      if (taskCount > 0) {
        // Workflow stage badge should not be present for standalone tasks
        const workflowBadge = taskCards.first().locator('[data-testid="workflow-stage"]');
        await expect(workflowBadge).not.toBeVisible();
      }
    }
  });

  test('can escalate standalone assignment without engagement context', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify escalate button is present
    const escalateButton = page.locator('button:has-text("Escalate")');
    await expect(escalateButton).toBeVisible();

    // Click escalate
    await escalateButton.click();

    // Verify escalation modal opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill reason and confirm
    await page.fill('textarea[name="reason"]', 'Need supervisor review');
    await page.click('button:has-text("Confirm")');

    // Wait for escalation
    await page.waitForTimeout(1000);

    // Verify observer added
    const observersList = page.locator('[data-testid="observers-list"]');
    await expect(observersList).toBeVisible();
  });

  test('can complete standalone assignment', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify complete button is present
    const completeButton = page.locator('button:has-text("Mark Complete")');

    if (await completeButton.isVisible() && await completeButton.isEnabled()) {
      await completeButton.click();

      // Fill completion notes
      await page.fill('textarea[name="completion_notes"]', 'Standalone task completed');
      await page.click('button:has-text("Confirm")');

      // Wait for completion
      await page.waitForTimeout(1000);

      // Verify status changed to completed
      const status = page.locator('[data-testid="assignment-status"]');
      const statusText = await status.textContent();
      expect(statusText?.toLowerCase()).toContain('completed');
    }
  });

  test('breadcrumbs work correctly for standalone assignment', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify breadcrumbs present
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toBeVisible();

    // Should show: My Assignments > Assignment #ID
    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText).toContain('Assignment');

    // Should NOT contain engagement reference
    expect(breadcrumbText?.toLowerCase()).not.toContain('engagement');

    // Click on "My Assignments" breadcrumb
    const myAssignmentsLink = breadcrumbs.locator('a:has-text("My Assignments"), a:has-text("Assignments")');
    if (await myAssignmentsLink.isVisible()) {
      await myAssignmentsLink.click();
      await expect(page).toHaveURL(/\/assignments$/);
    }
  });

  test('standalone assignment accessible via direct URL', async ({ page }) => {
    // Navigate directly to standalone assignment URL
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Verify page loaded successfully
    await expect(page).toHaveURL(/\/assignments\/test-standalone-assignment-001/);

    // Verify key sections visible
    await expect(page.locator('[data-testid="assignment-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-countdown"]')).toBeVisible();

    // Verify no engagement context
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');
    await expect(contextBanner).not.toBeVisible();
  });

  test('workflow stage not visible for standalone assignment', async ({ page }) => {
    // Navigate to standalone assignment
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Workflow stage should not be displayed (only for engagement-linked tasks)
    const workflowStage = page.locator('[data-testid="workflow-stage"]');
    await expect(workflowStage).not.toBeVisible();

    // Alternative: workflow stage might be in metadata but not prominent
    const metadata = page.locator('[data-testid="assignment-metadata"]');
    const metadataText = await metadata.textContent();

    // Should not mention "To Do", "In Progress", etc. (kanban stages)
    expect(metadataText?.toLowerCase()).not.toMatch(/to do|in progress|review/);
  });

  test('real-time updates work for standalone assignment', async ({ page, context }) => {
    // Open assignment in first window
    await page.goto('/assignments/test-standalone-assignment-001');
    await page.waitForLoadState('networkidle');

    // Open assignment in second window
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'supervisor@example.com');
    await page2.fill('input[name="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.goto('/assignments/test-standalone-assignment-001');
    await page2.waitForLoadState('networkidle');

    // Add comment in first window
    const commentInput = page.locator('textarea[name="comment"]');
    await commentInput.fill('Real-time test comment');
    await page.click('button:has-text("Post Comment")');

    // Wait for real-time update
    await page2.waitForTimeout(1500);

    // Verify comment appears in second window
    await expect(page2.locator('text=Real-time test comment')).toBeVisible();

    await page2.close();
  });
});
