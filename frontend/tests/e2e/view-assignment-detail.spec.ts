import { test, expect } from '@playwright/test';

/**
 * E2E Test: View Assignment Detail (T076)
 * Tests navigation to assignment detail page and verification of all sections
 *
 * Validates:
 * - Navigation to assignment detail
 * - All sections visible (metadata, SLA, work item, comments, checklist, timeline, observers)
 * - Metadata fields are correct
 * - SLA countdown is active
 */

test.describe('View Assignment Detail', () => {
  let testAssignmentId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
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
        work_item_id: 'test-dossier-001',
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
  });

  test('should display all assignment detail sections', async ({ page }) => {
    // Navigate to assignment detail page
    await page.goto(`/assignments/${testAssignmentId}`);
    await expect(page).toHaveURL(`/assignments/${testAssignmentId}`);

    // Verify page title
    await expect(page.locator('h1')).toContainText(/assignment/i);

    // Section 1: Metadata Card
    await expect(page.locator('[data-testid="assignment-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="assignment-id"]')).toContainText(testAssignmentId);
    await expect(page.locator('[data-testid="assignment-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="assignment-assignee"]')).toBeVisible();
    await expect(page.locator('[data-testid="assignment-priority"]')).toContainText(/high/i);
    await expect(page.locator('[data-testid="assignment-status"]')).toContainText(/assigned/i);

    // Section 2: SLA Countdown
    await expect(page.locator('[data-testid="sla-countdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-percentage"]')).toBeVisible();

    // Verify SLA countdown is active (text should change after 2 seconds)
    const initialTime = await page.locator('[data-testid="sla-timer"]').textContent();
    await page.waitForTimeout(2000);
    const updatedTime = await page.locator('[data-testid="sla-timer"]').textContent();
    expect(initialTime).not.toBe(updatedTime);

    // Section 3: Work Item Preview
    await expect(page.locator('[data-testid="work-item-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="work-item-type"]')).toContainText(/dossier/i);
    await expect(page.locator('[data-testid="work-item-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="work-item-id"]')).toContainText('test-dossier-001');
    await expect(page.locator('[data-testid="work-item-preview-text"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-full-button"]')).toBeVisible();

    // Section 4: Comments Section
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-form"]')).toBeVisible();

    // Section 5: Checklist Section
    await expect(page.locator('[data-testid="checklist-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="checklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-template-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-checklist-item-button"]')).toBeVisible();

    // Section 6: Timeline
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-event"]').first()).toBeVisible();

    // Verify "Assignment Created" event exists
    await expect(page.locator('[data-testid="timeline-event"]').first()).toContainText(/created/i);

    // Section 7: Observers Section (should be empty initially)
    await expect(page.locator('[data-testid="observers-section"]')).toBeVisible();
  });

  test('should display correct metadata values', async ({ page }) => {
    await page.goto(`/assignments/${testAssignmentId}`);

    // Verify assignment ID matches
    const displayedId = await page.locator('[data-testid="assignment-id"]').textContent();
    expect(displayedId).toContain(testAssignmentId);

    // Verify assignee is current user
    await expect(page.locator('[data-testid="assignment-assignee"]')).toContainText(/test\.staff/i);

    // Verify priority badge has correct color
    const priorityBadge = page.locator('[data-testid="assignment-priority"]');
    await expect(priorityBadge).toHaveClass(/high|priority-high/);

    // Verify status indicator
    const statusBadge = page.locator('[data-testid="assignment-status"]');
    await expect(statusBadge).toContainText(/assigned/i);
  });

  test('should display SLA countdown with health status', async ({ page }) => {
    await page.goto(`/assignments/${testAssignmentId}`);

    // Verify SLA components
    const slaSection = page.locator('[data-testid="sla-countdown"]');
    await expect(slaSection).toBeVisible();

    // Verify countdown timer format (should be like "23h 45m" or "1d 5h")
    const timerText = await page.locator('[data-testid="sla-timer"]').textContent();
    expect(timerText).toMatch(/\d+[dhm]/);

    // Verify percentage is displayed and within valid range
    const percentageText = await page.locator('[data-testid="sla-percentage"]').textContent();
    const percentage = parseInt(percentageText?.replace('%', '') || '0');
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);

    // Verify health status color (should be safe/green for new assignment)
    const healthIndicator = page.locator('[data-testid="sla-health-indicator"]');
    await expect(healthIndicator).toHaveClass(/safe|green/);
  });

  test('should handle non-existent assignment with 404', async ({ page }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await page.goto(`/assignments/${nonExistentId}`);

    // Verify error page is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/not found/i);

    // Verify redirect to /assignments after 3 seconds
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL(/\/assignments$/);
  });

  test('should handle unauthorized access with 403', async ({ page }) => {
    // Logout and login as different user
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'other.staff@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Try to access assignment assigned to test.staff@gastat.gov.sa
    await page.goto(`/assignments/${testAssignmentId}`);

    // Verify access denied error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/permission|access denied/i);

    // Verify redirect
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL(/\/assignments$/);
  });
});
