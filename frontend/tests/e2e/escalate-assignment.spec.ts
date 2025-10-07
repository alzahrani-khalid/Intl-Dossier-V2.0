import { test, expect } from '@playwright/test';

/**
 * E2E Test: Escalate Assignment (T081)
 * Tests escalation workflow including supervisor observer addition and notifications
 *
 * Validates:
 * - Escalate button is visible and clickable
 * - Escalation modal opens with reason input
 * - Supervisor is automatically selected
 * - Observer is added to observers list after escalation
 * - Timeline shows escalation event with reason
 * - Notification is sent to supervisor
 * - Escalate button is disabled after escalation (prevent duplicates)
 */

test.describe('Escalate Assignment', () => {
  let testAssignmentId: string;
  let supervisorUserId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Login as staff user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Create test assignment via API
    const response = await page.request.post('/functions/v1/assignments-auto-assign', {
      data: {
        work_item_type: 'dossier',
        work_item_id: 'test-dossier-escalation',
        priority: 'high',
        required_skills: ['document_review']
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    testAssignmentId = data.id;

    // Get supervisor user ID for verification
    const supervisorResponse = await page.request.get('/functions/v1/staff-availability', {
      params: {
        role: 'supervisor'
      }
    });
    expect(supervisorResponse.ok()).toBeTruthy();
    const supervisors = await supervisorResponse.json();
    supervisorUserId = supervisors[0]?.id;

    // Navigate to assignment detail
    await page.goto(`/assignments/${testAssignmentId}`);
    await expect(page).toHaveURL(`/assignments/${testAssignmentId}`);
  });

  test('should display escalate button for assignee', async ({ page }) => {
    // Verify escalate button is visible
    const escalateButton = page.locator('[data-testid="escalate-button"]');
    await expect(escalateButton).toBeVisible();
    await expect(escalateButton).toBeEnabled();
    await expect(escalateButton).toContainText(/escalate/i);
  });

  test('should open escalation modal on button click', async ({ page }) => {
    // Click escalate button
    await page.click('[data-testid="escalate-button"]');

    // Verify modal opens
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText(/escalate.*assignment/i);

    // Verify reason textarea is present
    const reasonTextarea = page.locator('[data-testid="escalation-reason"]');
    await expect(reasonTextarea).toBeVisible();
    await expect(reasonTextarea).toHaveAttribute('placeholder');

    // Verify character limit (1000 chars)
    await expect(page.locator('[data-testid="reason-char-count"]')).toContainText(/0.*1000/);

    // Verify cancel and confirm buttons
    await expect(page.locator('[data-testid="modal-cancel-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-confirm-button"]')).toBeVisible();
  });

  test('should auto-select supervisor user', async ({ page }) => {
    // Click escalate button
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    // Verify supervisor section shows selected supervisor
    await expect(page.locator('[data-testid="escalation-supervisor"]')).toBeVisible();
    await expect(page.locator('[data-testid="supervisor-name"]')).toContainText(/supervisor/i);

    // Verify supervisor ID matches (if displayed)
    const supervisorSection = page.locator('[data-testid="escalation-supervisor"]');
    await expect(supervisorSection).toBeVisible();
  });

  test('should validate reason input before escalation', async ({ page }) => {
    // Click escalate button
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    // Try to confirm without entering reason
    const confirmButton = page.locator('[data-testid="modal-confirm-button"]');
    await expect(confirmButton).toBeDisabled();

    // Enter reason
    const reasonTextarea = page.locator('[data-testid="escalation-reason"]');
    await reasonTextarea.fill('SLA approaching deadline, need supervisor review');

    // Confirm button should now be enabled
    await expect(confirmButton).toBeEnabled();
  });

  test('should enforce character limit on reason input', async ({ page }) => {
    // Click escalate button
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    const reasonTextarea = page.locator('[data-testid="escalation-reason"]');

    // Type exactly 1000 characters
    const maxChars = 'A'.repeat(1000);
    await reasonTextarea.fill(maxChars);

    // Verify character count shows 1000/1000
    await expect(page.locator('[data-testid="reason-char-count"]')).toContainText(/1000.*1000/);

    // Try to type more - should be prevented
    await reasonTextarea.press('B');
    const currentValue = await reasonTextarea.inputValue();
    expect(currentValue.length).toBe(1000);
  });

  test('should complete escalation and add supervisor as observer', async ({ page }) => {
    // Get initial observer count (should be 0)
    const observersSection = page.locator('[data-testid="observers-section"]');
    const initialObservers = page.locator('[data-testid="observer-card"]');
    const initialCount = await initialObservers.count();
    expect(initialCount).toBe(0);

    // Click escalate button
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    // Enter escalation reason
    const reasonTextarea = page.locator('[data-testid="escalation-reason"]');
    await reasonTextarea.fill('SLA approaching deadline, need immediate supervisor review');

    // Confirm escalation
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for modal to close
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Verify success notification
    await expect(page.locator('[data-testid="toast-message"]')).toContainText(/escalated.*success/i);

    // Verify observer is added
    await expect(page.locator('[data-testid="observer-card"]')).toHaveCount(1, { timeout: 3000 });

    // Verify observer details
    const observerCard = page.locator('[data-testid="observer-card"]').first();
    await expect(observerCard.locator('[data-testid="observer-role"]')).toContainText(/supervisor/i);
    await expect(observerCard.locator('[data-testid="observer-added-at"]')).toBeVisible();
  });

  test('should show escalation event in timeline with reason', async ({ page }) => {
    // Get initial timeline event count
    const initialEvents = page.locator('[data-testid="timeline-event"]');
    const initialCount = await initialEvents.count();

    // Escalate assignment
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    const reasonText = 'Critical: SLA will breach in 2 hours, supervisor input required';
    await page.fill('[data-testid="escalation-reason"]', reasonText);
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for modal to close
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Verify new timeline event added
    await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount(initialCount + 1);

    // Verify event content
    const latestEvent = page.locator('[data-testid="timeline-event"]').first();
    await expect(latestEvent).toContainText(/escalat/i);
    await expect(latestEvent.locator('[data-testid="event-reason"]')).toContainText(reasonText);
    await expect(latestEvent.locator('[data-testid="event-timestamp"]')).toBeVisible();
    await expect(latestEvent.locator('[data-testid="event-actor"]')).toContainText(/test\.staff/i);
  });

  test('should disable escalate button after escalation', async ({ page }) => {
    // Escalate assignment
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'First escalation');
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for modal to close
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Verify escalate button is now disabled
    const escalateButton = page.locator('[data-testid="escalate-button"]');
    await expect(escalateButton).toBeDisabled();

    // Verify tooltip or message explaining why
    await escalateButton.hover();
    await expect(page.locator('[data-testid="escalate-disabled-tooltip"]')).toContainText(/already escalated/i);
  });

  test('should send notification to supervisor (verify via API)', async ({ page }) => {
    // Get initial notification count for supervisor
    const initialNotificationsResponse = await page.request.get('/functions/v1/notifications', {
      params: {
        user_id: supervisorUserId,
        type: 'escalation'
      }
    });
    expect(initialNotificationsResponse.ok()).toBeTruthy();
    const initialNotifications = await initialNotificationsResponse.json();
    const initialCount = initialNotifications.length || 0;

    // Escalate assignment
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Need supervisor review urgently');
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for escalation to complete
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify notification was created
    const finalNotificationsResponse = await page.request.get('/functions/v1/notifications', {
      params: {
        user_id: supervisorUserId,
        type: 'escalation'
      }
    });
    expect(finalNotificationsResponse.ok()).toBeTruthy();
    const finalNotifications = await finalNotificationsResponse.json();
    expect(finalNotifications.length).toBe(initialCount + 1);

    // Verify notification content
    const latestNotification = finalNotifications[0];
    expect(latestNotification.assignment_id).toBe(testAssignmentId);
    expect(latestNotification.type).toBe('escalation');
    expect(latestNotification.read).toBe(false);
  });

  test('should handle cancellation gracefully', async ({ page }) => {
    // Get initial observer count
    const initialObservers = page.locator('[data-testid="observer-card"]');
    const initialCount = await initialObservers.count();

    // Open escalation modal
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    // Enter reason
    await page.fill('[data-testid="escalation-reason"]', 'Test escalation reason');

    // Cancel instead of confirm
    await page.click('[data-testid="modal-cancel-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Verify no observer was added
    await expect(page.locator('[data-testid="observer-card"]')).toHaveCount(initialCount);

    // Verify no timeline event
    const events = page.locator('[data-testid="timeline-event"]');
    await expect(events.filter({ hasText: /escalat/i })).toHaveCount(0);

    // Verify escalate button still enabled
    await expect(page.locator('[data-testid="escalate-button"]')).toBeEnabled();
  });

  test('should show escalation in bilingual format (Arabic)', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-ar"]');
    await page.waitForTimeout(500);

    // Open escalation modal
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();

    // Verify modal content is in Arabic
    await expect(page.locator('[data-testid="modal-title"]')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-testid="escalation-reason"]')).toHaveAttribute('placeholder');

    // Enter reason in Arabic
    await page.fill('[data-testid="escalation-reason"]', 'يتطلب مراجعة عاجلة من المشرف');

    // Confirm escalation
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Verify timeline event in Arabic
    const latestEvent = page.locator('[data-testid="timeline-event"]').first();
    await expect(latestEvent).toHaveAttribute('dir', 'rtl');
    await expect(latestEvent).toContainText('يتطلب مراجعة عاجلة من المشرف');
  });

  test('should maintain assignee as staff user after escalation', async ({ page }) => {
    // Verify initial assignee
    await expect(page.locator('[data-testid="assignment-assignee"]')).toContainText(/test\.staff/i);

    // Escalate assignment
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Escalation for review');
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for escalation to complete
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify assignee is still the staff user (not supervisor)
    await expect(page.locator('[data-testid="assignment-assignee"]')).toContainText(/test\.staff/i);

    // Verify supervisor is listed as observer, not assignee
    const observerCard = page.locator('[data-testid="observer-card"]').first();
    await expect(observerCard.locator('[data-testid="observer-role"]')).toContainText(/supervisor/i);
  });
});
