import { test, expect } from '@playwright/test';

/**
 * E2E Test: Triage and Assign Workflow
 * Tests supervisor workflow for triaging and assigning tickets
 *
 * Validates:
 * - Queue access and filtering
 * - AI-powered triage suggestions
 * - Manual override capabilities
 * - Assignment workflow
 * - Audit trail creation
 * - Real-time updates
 */

test.describe('Triage and Assign Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as supervisor with triage permissions
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'supervisor@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'SupervisorPass123!');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should complete AI-assisted triage and assignment', async ({ page }) => {
    // Step 1: Navigate to intake queue
    await page.goto('/intake/queue');
    await expect(page).toHaveURL('/intake/queue');
    await expect(page.locator('h1')).toContainText('Intake Queue');

    // Step 2: Apply filter to show submitted tickets
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="status-option-submitted"]');
    await expect(page.locator('[data-testid="filter-status-badge"]')).toContainText('Submitted');

    // Step 3: Sort by priority and creation date
    await page.selectOption('[data-testid="sort-select"]', 'priority-desc');
    await expect(page.locator('[data-testid="sort-select"]')).toHaveValue('priority-desc');

    // Step 4: Select first ticket from queue
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    const ticketNumber = await firstTicket.getAttribute('data-ticket-number');
    await firstTicket.click();

    // Step 5: Wait for ticket detail view to load
    await expect(page.locator('[data-testid="ticket-detail-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-number-display"]')).toContainText(ticketNumber!);

    // Step 6: Wait for AI suggestions to load (≤ 2 seconds)
    const startTime = Date.now();
    await expect(page.locator('[data-testid="ai-suggestions-panel"]')).toBeVisible({ timeout: 3000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2500); // Allow 500ms buffer for test environment

    // Step 7: Verify all AI suggestions are present
    await expect(page.locator('[data-testid="ai-suggestion-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-suggestion-sensitivity"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-suggestion-urgency"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-suggestion-assignee"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-suggestion-unit"]')).toBeVisible();

    // Step 8: Verify confidence scores are displayed
    const typeConfidence = await page.locator('[data-testid="ai-confidence-type"]').textContent();
    expect(parseFloat(typeConfidence!)).toBeGreaterThan(0);
    expect(parseFloat(typeConfidence!)).toBeLessThanOrEqual(1);

    // Step 9: Review suggested values
    const suggestedType = await page.locator('[data-testid="ai-suggestion-type-value"]').textContent();
    const suggestedSensitivity = await page.locator('[data-testid="ai-suggestion-sensitivity-value"]').textContent();
    const suggestedUrgency = await page.locator('[data-testid="ai-suggestion-urgency-value"]').textContent();

    expect(suggestedType).toMatch(/engagement|position|mou_action|foresight/);
    expect(suggestedSensitivity).toMatch(/public|internal|confidential|secret/);
    expect(suggestedUrgency).toMatch(/low|medium|high|critical/);

    // Step 10: Check for duplicate candidates (if score ≥ 0.80)
    const duplicateAlert = page.locator('[data-testid="duplicate-alert"]');
    if (await duplicateAlert.isVisible()) {
      const duplicateCount = await page.locator('[data-testid="duplicate-count"]').textContent();
      expect(parseInt(duplicateCount!)).toBeGreaterThan(0);

      // Verify high-confidence duplicates are highlighted
      const highConfidenceDupes = page.locator('[data-testid^="duplicate-high-confidence-"]');
      const count = await highConfidenceDupes.count();
      if (count > 0) {
        const score = await highConfidenceDupes.first().getAttribute('data-score');
        expect(parseFloat(score!)).toBeGreaterThanOrEqual(0.80);
      }
    }

    // Step 11: Accept AI triage suggestions
    await page.click('[data-testid="accept-ai-triage-button"]');

    // Step 12: Wait for suggestions to be applied
    await expect(page.locator('[data-testid="triage-success-message"]')).toBeVisible({ timeout: 3000 });

    // Step 13: Verify values were applied to ticket
    await expect(page.locator('[data-testid="ticket-type-display"]')).toContainText(suggestedType!);
    await expect(page.locator('[data-testid="ticket-sensitivity-display"]')).toContainText(suggestedSensitivity!);
    await expect(page.locator('[data-testid="ticket-urgency-display"]')).toContainText(suggestedUrgency!);

    // Step 14: Verify ticket status updated to "triaged"
    await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText('Triaged');

    // Step 15: Proceed to assignment
    await page.click('[data-testid="assign-ticket-button"]');
    await expect(page.locator('[data-testid="assignment-panel"]')).toBeVisible();

    // Step 16: Select assignee
    await page.fill('[data-testid="assignee-search"]', 'Ahmad');
    await page.click('[data-testid="assignee-result-0"]');
    await expect(page.locator('[data-testid="selected-assignee"]')).toContainText('Ahmad');

    // Step 17: Select unit/queue
    await page.selectOption('[data-testid="unit-select"]', 'data-analysis');
    await expect(page.locator('[data-testid="unit-select"]')).toHaveValue('data-analysis');

    // Step 18: Add assignment note (optional)
    await page.fill('[data-testid="assignment-note"]', 'High priority - requires immediate attention');

    // Step 19: Confirm assignment
    await page.click('[data-testid="confirm-assignment-button"]');

    // Step 20: Verify assignment success
    await expect(page.locator('[data-testid="assignment-success-message"]')).toBeVisible({ timeout: 3000 });

    // Step 21: Verify ticket status updated to "assigned"
    await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText('Assigned');

    // Step 22: Verify assignee notified (check notification indicator)
    await expect(page.locator('[data-testid="notification-sent-indicator"]')).toBeVisible();

    // Step 23: Check audit trail
    await page.click('[data-testid="audit-trail-tab"]');
    await expect(page.locator('[data-testid="audit-entry-triage"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-entry-assignment"]')).toBeVisible();
  });

  test('should allow manual override of AI suggestions', async ({ page }) => {
    // Navigate to queue and select ticket
    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Wait for AI suggestions
    await expect(page.locator('[data-testid="ai-suggestions-panel"]')).toBeVisible({ timeout: 3000 });

    // Click override button
    await page.click('[data-testid="override-ai-button"]');
    await expect(page.locator('[data-testid="override-panel"]')).toBeVisible();

    // Change suggested type
    await page.selectOption('[data-testid="override-type-select"]', 'position');

    // Change sensitivity
    await page.selectOption('[data-testid="override-sensitivity-select"]', 'confidential');

    // Change urgency
    await page.selectOption('[data-testid="override-urgency-select"]', 'critical');

    // Provide override reason (required)
    const overrideReason = 'Based on recent policy changes, this should be treated as confidential';
    await page.fill('[data-testid="override-reason-input"]', overrideReason);

    // Submit override
    await page.click('[data-testid="submit-override-button"]');

    // Verify override applied
    await expect(page.locator('[data-testid="override-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-type-display"]')).toContainText('Position');
    await expect(page.locator('[data-testid="ticket-sensitivity-display"]')).toContainText('Confidential');
    await expect(page.locator('[data-testid="ticket-urgency-display"]')).toContainText('Critical');

    // Verify override reason is recorded
    await page.click('[data-testid="audit-trail-tab"]');
    const overrideEntry = page.locator('[data-testid="audit-entry-override"]');
    await expect(overrideEntry).toContainText(overrideReason);
  });

  test('should handle queue filtering and sorting', async ({ page }) => {
    await page.goto('/intake/queue');

    // Test status filter
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="status-option-submitted"]');
    await page.click('[data-testid="status-option-triaged"]');

    // Verify filtered results
    const tickets = page.locator('[data-testid^="queue-ticket-"]');
    const count = await tickets.count();
    expect(count).toBeGreaterThan(0);

    // Verify all visible tickets match filter
    for (let i = 0; i < Math.min(count, 5); i++) {
      const status = await tickets.nth(i).getAttribute('data-status');
      expect(['submitted', 'triaged']).toContain(status);
    }

    // Test request type filter
    await page.click('[data-testid="filter-type"]');
    await page.click('[data-testid="type-option-engagement"]');

    const engagementTickets = page.locator('[data-testid^="queue-ticket-"][data-type="engagement"]');
    expect(await engagementTickets.count()).toBeGreaterThan(0);

    // Test sensitivity filter
    await page.click('[data-testid="filter-sensitivity"]');
    await page.click('[data-testid="sensitivity-option-internal"]');

    // Test sort by creation date
    await page.selectOption('[data-testid="sort-select"]', 'created-desc');

    // Verify sorting order
    const firstTicketDate = await tickets.first().getAttribute('data-created-at');
    const lastTicketDate = await tickets.last().getAttribute('data-created-at');
    expect(new Date(firstTicketDate!).getTime()).toBeGreaterThanOrEqual(new Date(lastTicketDate!).getTime());
  });

  test('should update queue in real-time when tickets are assigned', async ({ page, context }) => {
    // Open queue in first tab
    await page.goto('/intake/queue');
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="status-option-submitted"]');

    const initialCount = await page.locator('[data-testid^="queue-ticket-"]').count();

    // Open second tab as another supervisor
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', 'supervisor2@gastat.gov.sa');
    await page2.fill('[data-testid="password-input"]', 'SupervisorPass123!');
    await page2.click('[data-testid="login-button"]');
    await page2.waitForURL(/\/dashboard/);

    // Assign a ticket from second tab
    await page2.goto('/intake/queue');
    const firstTicket = page2.locator('[data-testid^="queue-ticket-"]').first();
    const ticketNumber = await firstTicket.getAttribute('data-ticket-number');
    await firstTicket.click();

    await page2.waitForSelector('[data-testid="assign-ticket-button"]');
    await page2.click('[data-testid="assign-ticket-button"]');
    await page2.click('[data-testid="assignee-result-0"]');
    await page2.selectOption('[data-testid="unit-select"]', 'data-analysis');
    await page2.click('[data-testid="confirm-assignment-button"]');
    await page2.waitForSelector('[data-testid="assignment-success-message"]');

    // Verify first tab's queue updates in real-time
    await page.waitForTimeout(2000); // Allow for real-time sync
    const updatedCount = await page.locator('[data-testid^="queue-ticket-"]').count();
    expect(updatedCount).toBe(initialCount - 1);

    // Verify the assigned ticket is no longer in submitted filter
    const assignedTicket = page.locator(`[data-testid="queue-ticket-${ticketNumber}"]`);
    await expect(assignedTicket).not.toBeVisible();

    await page2.close();
  });

  test('should display AI loading state and handle timeout gracefully', async ({ page }) => {
    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Verify loading state is shown
    await expect(page.locator('[data-testid="ai-suggestions-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-suggestions-loading"]')).toContainText(/Loading AI suggestions|جارٍ تحميل اقتراحات الذكاء الاصطناعي/);

    // Wait for suggestions or timeout
    await page.waitForSelector('[data-testid="ai-suggestions-panel"], [data-testid="ai-suggestions-error"]', {
      timeout: 10000
    });

    // If AI service is slow/unavailable, verify fallback options
    const errorPanel = page.locator('[data-testid="ai-suggestions-error"]');
    if (await errorPanel.isVisible()) {
      await expect(errorPanel).toContainText(/AI temporarily unavailable|الذكاء الاصطناعي غير متاح مؤقتًا/);

      // Verify manual triage option is available
      await expect(page.locator('[data-testid="manual-triage-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="manual-triage-button"]')).toBeEnabled();
    }
  });

  test('should validate required fields before assignment', async ({ page }) => {
    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Wait for ticket to load
    await expect(page.locator('[data-testid="ticket-detail-panel"]')).toBeVisible();

    // Try to assign without triaging
    await page.click('[data-testid="assign-ticket-button"]');

    // Verify validation error
    await expect(page.locator('[data-testid="assignment-validation-error"]')).toContainText(/Ticket must be triaged|يجب فرز التذكرة/);

    // Complete triage first
    await page.click('[data-testid="accept-ai-triage-button"]');
    await page.waitForSelector('[data-testid="triage-success-message"]');

    // Now try assignment
    await page.click('[data-testid="assign-ticket-button"]');
    await expect(page.locator('[data-testid="assignment-panel"]')).toBeVisible();

    // Try to confirm without selecting assignee
    await page.click('[data-testid="confirm-assignment-button"]');
    await expect(page.locator('[data-testid="assignee-required-error"]')).toContainText(/Assignee is required|المكلف مطلوب/);

    // Try to confirm without selecting unit
    await page.click('[data-testid="assignee-result-0"]');
    await page.click('[data-testid="confirm-assignment-button"]');
    await expect(page.locator('[data-testid="unit-required-error"]')).toContainText(/Unit is required|الوحدة مطلوبة/);
  });
});