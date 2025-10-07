import { test, expect } from '@playwright/test';

/**
 * E2E Test: Observer Accepts Assignment
 *
 * Feature: 014-full-assignment-detail
 * Task: T082
 *
 * Test Flow:
 * 1. Create test assignment and escalate to supervisor
 * 2. Login as supervisor (observer)
 * 3. Navigate to escalated assignment
 * 4. Verify observer can view assignment details
 * 5. Click "Accept Assignment" action
 * 6. Verify assignment is reassigned to supervisor
 * 7. Verify timeline event created
 * 8. Verify notification sent to original assignee
 * 9. Verify observer removed from observers list
 */

test.describe('Observer Accepts Assignment', () => {
  let assignmentId: string;
  let staffUserId: string;
  let supervisorUserId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Create test users and assignment
    const setupResponse = await page.request.post('/api/test/setup-observer-acceptance-test', {
      data: {
        staffEmail: 'staff@test.com',
        supervisorEmail: 'supervisor@test.com',
        assignmentData: {
          title: 'Test Assignment for Observer Acceptance',
          priority: 'high',
          work_item_type: 'dossier',
          work_item_id: 'DSR-2025-TEST-001'
        }
      }
    });

    const setup = await setupResponse.json();
    assignmentId = setup.assignmentId;
    staffUserId = setup.staffUserId;
    supervisorUserId = setup.supervisorUserId;

    // Escalate assignment to supervisor
    await page.request.post(`/functions/v1/assignments-escalate`, {
      headers: {
        'Authorization': `Bearer ${setup.staffToken}`
      },
      data: {
        assignment_id: assignmentId,
        reason: 'Need supervisor input for complex case'
      }
    });
  });

  test('supervisor can view escalated assignment', async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Navigate to assignment detail
    await page.goto(`/assignments/${assignmentId}`);

    // Verify assignment is visible (RLS grants access via observer)
    await expect(page.locator('h1')).toContainText('Assignment');
    await expect(page.locator('[data-testid="assignment-id"]')).toContainText(assignmentId);

    // Verify original assignee shown
    await expect(page.locator('[data-testid="assignee-name"]')).toContainText('Test Staff');

    // Verify supervisor listed in observers
    await expect(page.locator('[data-testid="observers-list"]')).toContainText('Test Supervisor');
    await expect(page.locator('[data-testid="observer-role"]')).toContainText('Supervisor');
  });

  test('supervisor sees observer action buttons', async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Verify observer action buttons visible
    await expect(page.locator('button[data-testid="accept-assignment"]')).toBeVisible();
    await expect(page.locator('button[data-testid="reassign-assignment"]')).toBeVisible();
    await expect(page.locator('button[data-testid="continue-observing"]')).toBeVisible();
  });

  test('supervisor accepts assignment successfully', async ({ page, context }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Click "Accept Assignment"
    await page.click('button[data-testid="accept-assignment"]');

    // Verify confirmation modal appears
    await expect(page.locator('[data-testid="accept-assignment-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Accept Assignment');
    await expect(page.locator('[data-testid="modal-description"]')).toContainText('You will become the new assignee');

    // Confirm acceptance
    await page.click('button[data-testid="confirm-accept"]');

    // Wait for mutation to complete
    await page.waitForTimeout(500);

    // Verify assignee changed to supervisor
    await expect(page.locator('[data-testid="assignee-name"]')).toContainText('Test Supervisor');

    // Verify observer removed from observers list
    const observersList = page.locator('[data-testid="observers-list"]');
    await expect(observersList).not.toContainText('Test Supervisor');

    // Verify timeline event created
    const timeline = page.locator('[data-testid="timeline"]');
    await expect(timeline).toContainText('Assignment Reassigned');
    await expect(timeline).toContainText('Test Supervisor accepted assignment');

    // Verify timestamp is recent (within last minute)
    const eventTimestamp = await timeline.locator('[data-testid="event-timestamp"]').first().textContent();
    expect(eventTimestamp).toContain('seconds ago');
  });

  test('acceptance removes observer action buttons', async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Accept assignment
    await page.click('button[data-testid="accept-assignment"]');
    await page.click('button[data-testid="confirm-accept"]');
    await page.waitForTimeout(500);

    // Verify observer action buttons hidden
    await expect(page.locator('button[data-testid="accept-assignment"]')).not.toBeVisible();
    await expect(page.locator('button[data-testid="reassign-assignment"]')).not.toBeVisible();
    await expect(page.locator('button[data-testid="continue-observing"]')).not.toBeVisible();

    // Verify regular assignee actions available
    await expect(page.locator('button[data-testid="escalate-assignment"]')).toBeVisible();
    await expect(page.locator('button[data-testid="mark-complete"]')).toBeVisible();
  });

  test('original assignee receives notification', async ({ page, context }) => {
    // Open two browser contexts: supervisor and staff
    const supervisorContext = await context.browser()?.newContext();
    const staffContext = await context.browser()?.newContext();

    if (!supervisorContext || !staffContext) {
      throw new Error('Failed to create browser contexts');
    }

    const supervisorPage = await supervisorContext.newPage();
    const staffPage = await staffContext.newPage();

    try {
      // Login as staff in second window
      await staffPage.goto('/login');
      await staffPage.fill('input[name="email"]', 'staff@test.com');
      await staffPage.fill('input[name="password"]', 'testpassword');
      await staffPage.click('button[type="submit"]');
      await staffPage.goto(`/assignments/${assignmentId}`);

      // Login as supervisor in first window
      await supervisorPage.goto('/login');
      await supervisorPage.fill('input[name="email"]', 'supervisor@test.com');
      await supervisorPage.fill('input[name="password"]', 'testpassword');
      await supervisorPage.click('button[type="submit"]');
      await supervisorPage.goto(`/assignments/${assignmentId}`);

      // Supervisor accepts assignment
      await supervisorPage.click('button[data-testid="accept-assignment"]');
      await supervisorPage.click('button[data-testid="confirm-accept"]');

      // Wait for real-time update
      await staffPage.waitForTimeout(1000);

      // Verify notification appears for staff user
      await expect(staffPage.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(staffPage.locator('[data-testid="notification-message"]')).toContainText('Assignment reassigned to Test Supervisor');

      // Verify staff user sees updated assignee
      await expect(staffPage.locator('[data-testid="assignee-name"]')).toContainText('Test Supervisor');

      // Verify staff user no longer has assignee permissions
      await expect(staffPage.locator('button[data-testid="mark-complete"]')).not.toBeVisible();
    } finally {
      await supervisorPage.close();
      await staffPage.close();
      await supervisorContext.close();
      await staffContext.close();
    }
  });

  test('acceptance updates real-time in multiple windows', async ({ page, context }) => {
    const context1 = await context.browser()?.newContext();
    const context2 = await context.browser()?.newContext();

    if (!context1 || !context2) {
      throw new Error('Failed to create browser contexts');
    }

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login both as supervisor
      await page1.goto('/login');
      await page1.fill('input[name="email"]', 'supervisor@test.com');
      await page1.fill('input[name="password"]', 'testpassword');
      await page1.click('button[type="submit"]');
      await page1.goto(`/assignments/${assignmentId}`);

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'supervisor@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');
      await page2.goto(`/assignments/${assignmentId}`);

      // Accept in window 1
      await page1.click('button[data-testid="accept-assignment"]');
      await page1.click('button[data-testid="confirm-accept"]');

      // Verify update appears in window 2 < 1 second
      await page2.waitForSelector('[data-testid="assignee-name"]:has-text("Test Supervisor")', { timeout: 1000 });

      // Verify timeline updated in window 2
      await expect(page2.locator('[data-testid="timeline"]')).toContainText('Assignment Reassigned');
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });

  test('acceptance cannot be undone', async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Accept assignment
    await page.click('button[data-testid="accept-assignment"]');
    await page.click('button[data-testid="confirm-accept"]');
    await page.waitForTimeout(500);

    // Verify no "Undo" button exists
    await expect(page.locator('button[data-testid="undo-acceptance"]')).not.toBeVisible();

    // Reload page
    await page.reload();

    // Verify assignment still shows supervisor as assignee
    await expect(page.locator('[data-testid="assignee-name"]')).toContainText('Test Supervisor');
  });

  test('non-observer cannot accept assignment', async ({ page }) => {
    // Login as different user (not observer)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'other@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Try to navigate to assignment
    await page.goto(`/assignments/${assignmentId}`);

    // Verify access denied
    await expect(page.locator('[data-testid="error-message"]')).toContainText("You don't have permission");

    // Verify redirect to /assignments after 3 seconds
    await page.waitForTimeout(3500);
    expect(page.url()).toContain('/assignments');
  });

  test('acceptance works in Arabic locale', async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'supervisor@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');

    await page.goto(`/assignments/${assignmentId}`);

    // Verify RTL layout
    const body = await page.locator('body');
    await expect(body).toHaveAttribute('dir', 'rtl');

    // Verify Arabic labels
    await expect(page.locator('button[data-testid="accept-assignment"]')).toContainText('قبول المهمة');

    // Accept assignment
    await page.click('button[data-testid="accept-assignment"]');
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('قبول المهمة');
    await page.click('button[data-testid="confirm-accept"]');
    await page.waitForTimeout(500);

    // Verify Arabic timeline event
    await expect(page.locator('[data-testid="timeline"]')).toContainText('تم إعادة تعيين المهمة');
  });
});
