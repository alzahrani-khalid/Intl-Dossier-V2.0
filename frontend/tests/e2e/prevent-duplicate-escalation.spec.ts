import { test, expect } from '@playwright/test';

/**
 * E2E Test: Prevent Duplicate Escalation (T081b)
 * Tests that assignments can only be escalated once
 *
 * Validates:
 * - Escalate button disabled after first escalation (UI)
 * - Second escalation attempt via API returns 400 error
 * - Error message indicates "already escalated"
 * - Rate limiting enforced (1 escalation/hour per assignment)
 *
 * Reference: spec.md FR-009 and edge case line 122
 */

test.describe('Prevent Duplicate Escalation', () => {
  let testAssignmentId: string;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Login as staff user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login and capture auth token
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Get auth token from storage/cookie
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'sb-access-token');
    authToken = authCookie?.value || '';

    // Create test assignment via API
    const response = await page.request.post('/functions/v1/assignments-auto-assign', {
      data: {
        work_item_type: 'dossier',
        work_item_id: 'test-dossier-duplicate-escalation',
        priority: 'high',
        required_skills: ['document_review']
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    testAssignmentId = data.id;

    // Navigate to assignment detail
    await page.goto(`/assignments/${testAssignmentId}`);
    await expect(page).toHaveURL(`/assignments/${testAssignmentId}`);
  });

  test('should disable escalate button after first escalation', async ({ page }) => {
    // Verify button is initially enabled
    const escalateButton = page.locator('[data-testid="escalate-button"]');
    await expect(escalateButton).toBeEnabled();

    // Perform first escalation
    await escalateButton.click();
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'First escalation - SLA approaching');
    await page.click('[data-testid="modal-confirm-button"]');

    // Wait for escalation to complete
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="toast-message"]')).toContainText(/escalated.*success/i);

    // Verify button is now disabled
    await expect(escalateButton).toBeDisabled();
  });

  test('should show tooltip explaining why escalate is disabled', async ({ page }) => {
    // Escalate first time
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Initial escalation');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Hover over disabled button
    const escalateButton = page.locator('[data-testid="escalate-button"]');
    await escalateButton.hover();

    // Verify tooltip appears
    const tooltip = page.locator('[data-testid="escalate-disabled-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/already escalated|escalation pending/i);
  });

  test('should return 400 error when attempting second escalation via API', async ({ page }) => {
    // Escalate first time via UI
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'First escalation');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for first escalation to complete
    await page.waitForTimeout(1500);

    // Attempt second escalation via API
    const secondEscalationResponse = await page.request.post(`/functions/v1/assignments-escalate`, {
      data: {
        assignment_id: testAssignmentId,
        reason: 'Second escalation attempt - should fail'
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Verify 400 Bad Request
    expect(secondEscalationResponse.status()).toBe(400);

    // Verify error message
    const errorData = await secondEscalationResponse.json();
    expect(errorData.error).toMatch(/already escalated|duplicate escalation|escalation exists/i);
  });

  test('should enforce rate limiting (1 escalation per hour)', async ({ page }) => {
    // Escalate first time
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Escalation within rate limit');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for escalation to complete
    await page.waitForTimeout(1500);

    // Attempt immediate second escalation via API
    const immediateRetry = await page.request.post(`/functions/v1/assignments-escalate`, {
      data: {
        assignment_id: testAssignmentId,
        reason: 'Immediate retry - should be rate limited'
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Verify rate limit error (429 or 400)
    expect([400, 429]).toContain(immediateRetry.status());

    const errorData = await immediateRetry.json();
    expect(errorData.error).toMatch(/rate limit|too many requests|already escalated/i);
  });

  test('should not create duplicate observer entries', async ({ page }) => {
    // Escalate first time
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'First escalation');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait and verify one observer added
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="observer-card"]')).toHaveCount(1);

    // Attempt second escalation via API (will fail, but check observers anyway)
    await page.request.post(`/functions/v1/assignments-escalate`, {
      data: {
        assignment_id: testAssignmentId,
        reason: 'Second attempt'
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Reload page to ensure fresh data
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify still only one observer (no duplicate)
    await expect(page.locator('[data-testid="observer-card"]')).toHaveCount(1);
  });

  test('should not create duplicate timeline events', async ({ page }) => {
    // Get initial timeline event count
    const initialEvents = await page.locator('[data-testid="timeline-event"]').count();

    // Escalate first time
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Initial escalation');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for timeline to update
    await page.waitForTimeout(1500);

    // Count escalation events (should be 1)
    const escalationEvents = page.locator('[data-testid="timeline-event"]').filter({ hasText: /escalat/i });
    await expect(escalationEvents).toHaveCount(1);

    // Attempt second escalation via API
    await page.request.post(`/functions/v1/assignments-escalate`, {
      data: {
        assignment_id: testAssignmentId,
        reason: 'Second attempt'
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify still only one escalation event
    const finalEscalationEvents = page.locator('[data-testid="timeline-event"]').filter({ hasText: /escalat/i });
    await expect(finalEscalationEvents).toHaveCount(1);
  });

  test('should show clear error message in UI when escalation already exists', async ({ page }) => {
    // Escalate first time
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'First escalation');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for escalation to complete
    await page.waitForTimeout(1500);

    // Verify button is disabled
    const escalateButton = page.locator('[data-testid="escalate-button"]');
    await expect(escalateButton).toBeDisabled();

    // Verify visual indicator
    await expect(escalateButton).toHaveClass(/disabled|opacity-50/);

    // Check for explanatory text near button
    const buttonSection = page.locator('[data-testid="escalate-button-section"]');
    await expect(buttonSection).toContainText(/escalated|pending/i);
  });

  test('should handle concurrent escalation attempts gracefully', async ({ page, context }) => {
    // Open second page in same context
    const page2 = await context.newPage();
    await page2.goto(`/assignments/${testAssignmentId}`);
    await expect(page2).toHaveURL(`/assignments/${testAssignmentId}`);

    // Attempt simultaneous escalation from both pages
    const escalation1 = page.click('[data-testid="escalate-button"]').then(async () => {
      await page.fill('[data-testid="escalation-reason"]', 'Concurrent escalation 1');
      await page.click('[data-testid="modal-confirm-button"]');
    });

    const escalation2 = page2.click('[data-testid="escalate-button"]').then(async () => {
      await page2.fill('[data-testid="escalation-reason"]', 'Concurrent escalation 2');
      await page2.click('[data-testid="modal-confirm-button"]');
    });

    // Wait for both to complete
    await Promise.allSettled([escalation1, escalation2]);

    // Wait for modals to close
    await page.waitForTimeout(2000);

    // Verify only one escalation succeeded
    // Check via API how many observers exist
    const assignmentResponse = await page.request.get(`/functions/v1/assignments-get/${testAssignmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(assignmentResponse.ok()).toBeTruthy();
    const assignmentData = await assignmentResponse.json();

    // Should have exactly 1 observer (no duplicates)
    expect(assignmentData.observers.length).toBe(1);

    await page2.close();
  });

  test('should preserve escalation state across page refreshes', async ({ page }) => {
    // Escalate assignment
    await page.click('[data-testid="escalate-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).toBeVisible();
    await page.fill('[data-testid="escalation-reason"]', 'Escalation for testing');
    await page.click('[data-testid="modal-confirm-button"]');
    await expect(page.locator('[data-testid="escalate-modal"]')).not.toBeVisible();

    // Wait for escalation to complete
    await page.waitForTimeout(1500);

    // Verify button disabled
    await expect(page.locator('[data-testid="escalate-button"]')).toBeDisabled();

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify button still disabled after reload
    await expect(page.locator('[data-testid="escalate-button"]')).toBeDisabled();

    // Verify observer still present
    await expect(page.locator('[data-testid="observer-card"]')).toHaveCount(1);
  });
});
