import { test, expect } from '@playwright/test';

/**
 * E2E Test: Mark Assignment Complete
 *
 * Feature: 014-full-assignment-detail
 * Task: T083
 *
 * Test Flow:
 * 1. Create test assignment in "in_progress" status
 * 2. Navigate to assignment detail page
 * 3. Click "Mark Complete" button
 * 4. Enter completion notes in modal
 * 5. Confirm completion
 * 6. Verify status changed to "completed"
 * 7. Verify SLA tracking stopped
 * 8. Verify completion timestamp and user recorded
 * 9. Verify timeline event created
 * 10. Verify assignment removed from "My Assignments" list
 * 11. Verify detail page still accessible via direct URL
 * 12. Verify actions disabled after completion
 */

test.describe('Mark Assignment Complete', () => {
  let assignmentId: string;
  let userId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Create test assignment in in_progress status
    const setupResponse = await page.request.post('/api/test/setup-completion-test', {
      data: {
        userEmail: 'staff@test.com',
        assignmentData: {
          title: 'Test Assignment for Completion',
          priority: 'medium',
          status: 'in_progress',
          work_item_type: 'dossier',
          work_item_id: 'DSR-2025-COMPLETE-001',
          sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
        }
      }
    });

    const setup = await setupResponse.json();
    assignmentId = setup.assignmentId;
    userId = setup.userId;

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
  });

  test('mark complete button visible for in-progress assignment', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Verify "Mark Complete" button is visible
    await expect(page.locator('button[data-testid="mark-complete"]')).toBeVisible();
    await expect(page.locator('button[data-testid="mark-complete"]')).toBeEnabled();

    // Verify button text
    await expect(page.locator('button[data-testid="mark-complete"]')).toContainText('Mark Complete');
  });

  test('complete assignment with notes', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Click "Mark Complete"
    await page.click('button[data-testid="mark-complete"]');

    // Verify completion modal appears
    await expect(page.locator('[data-testid="complete-assignment-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Mark Assignment Complete');

    // Verify notes textarea present
    await expect(page.locator('textarea[data-testid="completion-notes"]')).toBeVisible();

    // Enter completion notes
    const notes = 'All documents reviewed and approved. Verified compliance with regulations. Prepared final brief for management.';
    await page.fill('textarea[data-testid="completion-notes"]', notes);

    // Verify character counter
    await expect(page.locator('[data-testid="character-count"]')).toContainText(`${notes.length}/1000`);

    // Confirm completion
    await page.click('button[data-testid="confirm-complete"]');

    // Wait for mutation to complete
    await page.waitForTimeout(500);

    // Verify status changed to "completed"
    await expect(page.locator('[data-testid="assignment-status"]')).toContainText('Completed');
    await expect(page.locator('[data-testid="status-badge"]')).toHaveClass(/bg-green/);

    // Verify completion timestamp shown
    await expect(page.locator('[data-testid="completed-at"]')).toBeVisible();
    const completedAt = await page.locator('[data-testid="completed-at"]').textContent();
    expect(completedAt).toContain('seconds ago');

    // Verify completed by user shown
    await expect(page.locator('[data-testid="completed-by"]')).toContainText('Test Staff');

    // Verify timeline event created
    const timeline = page.locator('[data-testid="timeline"]');
    await expect(timeline).toContainText('Assignment Completed');
    await expect(timeline).toContainText(notes); // Completion notes in timeline

    // Verify SLA countdown stopped
    const slaCountdown = page.locator('[data-testid="sla-countdown"]');
    await expect(slaCountdown).toContainText('Stopped');
    await expect(slaCountdown).not.toContainText('seconds remaining');
  });

  test('completion notes are optional', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    await page.click('button[data-testid="mark-complete"]');

    // Leave notes empty
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Verify completion succeeded without notes
    await expect(page.locator('[data-testid="assignment-status"]')).toContainText('Completed');
  });

  test('completion notes have character limit', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    await page.click('button[data-testid="mark-complete"]');

    // Try to enter more than 1000 characters
    const longNotes = 'A'.repeat(1500);
    await page.fill('textarea[data-testid="completion-notes"]', longNotes);

    // Verify textarea truncates or prevents input
    const actualValue = await page.locator('textarea[data-testid="completion-notes"]').inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(1000);

    // Verify warning shown
    await expect(page.locator('[data-testid="character-limit-warning"]')).toBeVisible();
  });

  test('actions disabled after completion', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Complete assignment
    await page.click('button[data-testid="mark-complete"]');
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Verify "Mark Complete" button disabled or hidden
    await expect(page.locator('button[data-testid="mark-complete"]')).not.toBeVisible();

    // Verify "Escalate" button disabled or hidden
    await expect(page.locator('button[data-testid="escalate-assignment"]')).not.toBeVisible();

    // Verify checklist items disabled
    const checkboxes = page.locator('input[type="checkbox"][data-testid^="checklist-item-"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await expect(checkboxes.first()).toBeDisabled();
    }

    // Verify comment form disabled or hidden
    await expect(page.locator('textarea[data-testid="comment-input"]')).toBeDisabled();
  });

  test('assignment removed from "My Assignments" list', async ({ page }) => {
    // Navigate to "My Assignments" before completion
    await page.goto('/assignments');
    await expect(page.locator(`[data-testid="assignment-card-${assignmentId}"]`)).toBeVisible();

    // Navigate to detail and complete
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('button[data-testid="mark-complete"]');
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Navigate back to "My Assignments"
    await page.goto('/assignments');

    // Verify assignment removed from list
    await expect(page.locator(`[data-testid="assignment-card-${assignmentId}"]`)).not.toBeVisible();

    // Verify completion message or filter indicator
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="filter-completed"]');

    // Now should see completed assignment
    await expect(page.locator(`[data-testid="assignment-card-${assignmentId}"]`)).toBeVisible();
  });

  test('detail page still accessible via direct URL after completion', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Complete assignment
    await page.click('button[data-testid="mark-complete"]');
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Navigate away
    await page.goto('/dashboard');

    // Navigate back via direct URL
    await page.goto(`/assignments/${assignmentId}`);

    // Verify page loads successfully
    await expect(page.locator('h1')).toContainText('Assignment');
    await expect(page.locator('[data-testid="assignment-id"]')).toContainText(assignmentId);
    await expect(page.locator('[data-testid="assignment-status"]')).toContainText('Completed');

    // Verify all sections still visible (read-only)
    await expect(page.locator('[data-testid="metadata-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="checklist-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-section"]')).toBeVisible();
  });

  test('prevent duplicate completion', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Complete assignment
    await page.click('button[data-testid="mark-complete"]');
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Try to complete again via API (edge case)
    const response = await page.request.post(`/functions/v1/assignments-complete`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('supabase.auth.token'))}`
      },
      data: {
        assignment_id: assignmentId,
        notes: 'Trying to complete again'
      }
    });

    // Verify request fails
    expect(response.status()).toBe(409); // Conflict

    const error = await response.json();
    expect(error.message).toContain('already completed');

    // Verify no duplicate timeline event
    const timelineEvents = page.locator('[data-testid="timeline-event"]');
    const completionEvents = await timelineEvents.filter({ hasText: 'Assignment Completed' }).count();
    expect(completionEvents).toBe(1); // Only one completion event
  });

  test('optimistic locking prevents stale completion', async ({ page, context }) => {
    // Open assignment in two windows
    const context1 = await context.browser()?.newContext();
    if (!context1) throw new Error('Failed to create context');

    const page2 = await context1.newPage();

    try {
      // Login both windows
      await page.goto('/login');
      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'staff@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      // Navigate both to assignment
      await page.goto(`/assignments/${assignmentId}`);
      await page2.goto(`/assignments/${assignmentId}`);

      // Modify assignment in window 1 (change status to trigger version bump)
      await page.click('button[data-testid="add-comment"]');
      await page.fill('textarea[data-testid="comment-input"]', 'Test comment');
      await page.click('button[data-testid="submit-comment"]');
      await page.waitForTimeout(500);

      // Try to complete in window 2 (stale version)
      await page2.click('button[data-testid="mark-complete"]');
      await page2.click('button[data-testid="confirm-complete"]');
      await page2.waitForTimeout(500);

      // Verify optimistic locking warning shown
      await expect(page2.locator('[data-testid="conflict-warning"]')).toBeVisible();
      await expect(page2.locator('[data-testid="conflict-message"]')).toContainText('has been modified');
      await expect(page2.locator('[data-testid="reload-button"]')).toBeVisible();
    } finally {
      await page2.close();
      await context1.close();
    }
  });

  test('real-time completion update in multiple windows', async ({ page, context }) => {
    const context1 = await context.browser()?.newContext();
    if (!context1) throw new Error('Failed to create context');

    const page2 = await context1.newPage();

    try {
      // Login both windows
      await page.goto('/login');
      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'staff@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      // Navigate both to assignment
      await page.goto(`/assignments/${assignmentId}`);
      await page2.goto(`/assignments/${assignmentId}`);

      // Complete in window 1
      await page.click('button[data-testid="mark-complete"]');
      await page.fill('textarea[data-testid="completion-notes"]', 'Completed from window 1');
      await page.click('button[data-testid="confirm-complete"]');

      // Verify update appears in window 2 < 1 second
      await page2.waitForSelector('[data-testid="assignment-status"]:has-text("Completed")', { timeout: 1000 });

      // Verify SLA stopped in window 2
      await expect(page2.locator('[data-testid="sla-countdown"]')).toContainText('Stopped');

      // Verify timeline updated in window 2
      await expect(page2.locator('[data-testid="timeline"]')).toContainText('Assignment Completed');
      await expect(page2.locator('[data-testid="timeline"]')).toContainText('Completed from window 1');
    } finally {
      await page2.close();
      await context1.close();
    }
  });

  test('completion works in Arabic locale', async ({ page }) => {
    // Switch to Arabic
    await page.goto('/');
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Verify RTL layout
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');

    // Verify Arabic button text
    await expect(page.locator('button[data-testid="mark-complete"]')).toContainText('وضع علامة مكتمل');

    // Complete assignment
    await page.click('button[data-testid="mark-complete"]');
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('وضع علامة مكتمل للمهمة');
    await page.fill('textarea[data-testid="completion-notes"]', 'تم الانتهاء من جميع الوثائق');
    await page.click('button[data-testid="confirm-complete"]');
    await page.waitForTimeout(500);

    // Verify Arabic status
    await expect(page.locator('[data-testid="assignment-status"]')).toContainText('مكتمل');

    // Verify Arabic timeline event
    await expect(page.locator('[data-testid="timeline"]')).toContainText('تم إكمال المهمة');
  });

  test('completion notification for observers', async ({ page, context }) => {
    // First escalate to add observer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);
    await page.click('button[data-testid="escalate-assignment"]');
    await page.fill('textarea[data-testid="escalation-reason"]', 'Need supervisor awareness');
    await page.click('button[data-testid="confirm-escalate"]');
    await page.waitForTimeout(500);

    // Login as supervisor in new window
    const supervisorContext = await context.browser()?.newContext();
    if (!supervisorContext) throw new Error('Failed to create context');

    const supervisorPage = await supervisorContext.newPage();

    try {
      await supervisorPage.goto('/login');
      await supervisorPage.fill('input[name="email"]', 'supervisor@test.com');
      await supervisorPage.fill('input[name="password"]', 'testpassword');
      await supervisorPage.click('button[type="submit"]');
      await supervisorPage.goto(`/assignments/${assignmentId}`);

      // Complete in staff window
      await page.click('button[data-testid="mark-complete"]');
      await page.click('button[data-testid="confirm-complete"]');

      // Verify notification appears for supervisor < 1 second
      await supervisorPage.waitForSelector('[data-testid="notification-toast"]', { timeout: 1000 });
      await expect(supervisorPage.locator('[data-testid="notification-message"]')).toContainText('Assignment completed');

      // Verify supervisor sees completion
      await expect(supervisorPage.locator('[data-testid="assignment-status"]')).toContainText('Completed');
    } finally {
      await supervisorPage.close();
      await supervisorContext.close();
    }
  });
});
