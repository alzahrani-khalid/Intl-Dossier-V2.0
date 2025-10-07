import { test, expect, Page } from '@playwright/test';

/**
 * Integration Test: User Story 1 - Log After-Action Record
 *
 * As a staff member
 * I want to log outcomes from a completed engagement
 * So that decisions and commitments are documented
 *
 * Reference: quickstart.md lines 46-153
 */

// Test data
const TEST_DOSSIER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_ENGAGEMENT_ID = '22222222-2222-2222-2222-222222222222';
const TEST_STAFF_EMAIL = 'test-staff@gastat.gov.sa';
const TEST_STAFF_PASSWORD = 'Test123!@#';

test.describe('User Story 1: Log After-Action Record', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login as staff member
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_STAFF_EMAIL);
    await page.fill('input[name="password"]', TEST_STAFF_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/_protected/**');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should navigate to engagement and display Log After-Action button', async () => {
    // Step 1: Navigate to engagement
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/engagements/${TEST_ENGAGEMENT_ID}`);

    // Verify engagement details page loaded
    await expect(page.locator('h1')).toContainText('Q1 Kickoff Meeting');

    // Verify Log After-Action button exists
    const logButton = page.locator('button:has-text("Log After-Action")');
    await expect(logButton).toBeVisible();
  });

  test('should display after-action form with all required sections', async () => {
    // Step 2: Click Log After-Action button
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}/engagements/${TEST_ENGAGEMENT_ID}`);
    await page.click('button:has-text("Log After-Action")');

    // Verify form sections are present
    await expect(page.locator('label:has-text("Attendees")')).toBeVisible();
    await expect(page.locator('section:has-text("Decisions")')).toBeVisible();
    await expect(page.locator('section:has-text("Commitments")')).toBeVisible();
    await expect(page.locator('section:has-text("Risks")')).toBeVisible();
    await expect(page.locator('section:has-text("Follow-up Actions")')).toBeVisible();
    await expect(page.locator('section:has-text("Attachments")')).toBeVisible();
    await expect(page.locator('label:has-text("Notes")')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]:near(:text("Confidential"))')).toBeVisible();
  });

  test('should fill attendees field', async () => {
    // Step 3: Fill attendees
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    const attendeesInput = page.locator('input[name="attendees"]');
    await attendeesInput.fill('John Smith, Sarah Lee, Ahmed Al-Rashid');

    // Verify 3 attendees captured (could be shown as chips/tags)
    await expect(attendeesInput).toHaveValue('John Smith, Sarah Lee, Ahmed Al-Rashid');
  });

  test('should add a decision', async () => {
    // Step 4: Add a decision
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Click Add Decision button
    await page.click('button:has-text("Add Decision")');

    // Fill decision fields
    await page.fill('input[name="decisions.0.description"]', 'Approved budget increase for Phase 2');
    await page.fill('textarea[name="decisions.0.rationale"]', 'Additional resources needed for expanded scope');
    await page.fill('input[name="decisions.0.decision_maker"]', 'Sarah Lee (Director)');
    await page.fill('input[name="decisions.0.decision_date"]', '2025-09-29');

    // Verify decision appears in list
    await expect(page.locator('text=Approved budget increase for Phase 2')).toBeVisible();
  });

  test('should add an internal commitment', async () => {
    // Step 5: Add a commitment
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Click Add Commitment button
    await page.click('button:has-text("Add Commitment")');

    // Fill commitment fields
    await page.fill('input[name="commitments.0.description"]', 'Submit revised budget proposal to finance');

    // Select owner type: Internal
    await page.click('input[value="internal"]');

    // Select owner from dropdown
    await page.selectOption('select[name="commitments.0.owner_user_id"]', { label: 'John Smith' });

    // Set due date (7 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dueDateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="commitments.0.due_date"]', dueDateStr);

    // Select priority
    await page.selectOption('select[name="commitments.0.priority"]', 'high');

    // Verify commitment appears in list
    await expect(page.locator('text=Submit revised budget proposal to finance')).toBeVisible();
  });

  test('should add an external commitment', async () => {
    // Step 6: Add an external commitment
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Click Add Commitment button
    await page.click('button:has-text("Add Commitment")');

    // Fill commitment description
    await page.fill('input[name="commitments.0.description"]', 'Review legal framework updates');

    // Select owner type: External
    await page.click('input[value="external"]');

    // Fill external contact details
    await page.fill('input[name="commitments.0.external_email"]', 'legal.advisor@partner.gov.sa');
    await page.fill('input[name="commitments.0.external_name"]', 'Dr. Fatima Al-Mansour');
    await page.fill('input[name="commitments.0.external_organization"]', 'Ministry of Justice');

    // Set due date (14 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dueDateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="commitments.0.due_date"]', dueDateStr);

    // Select priority
    await page.selectOption('select[name="commitments.0.priority"]', 'medium');

    // Verify external commitment appears
    await expect(page.locator('text=Review legal framework updates')).toBeVisible();
    await expect(page.locator('text=legal.advisor@partner.gov.sa')).toBeVisible();
  });

  test('should add a risk', async () => {
    // Step 7: Add a risk
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Click Add Risk button
    await page.click('button:has-text("Add Risk")');

    // Fill risk fields
    await page.fill('input[name="risks.0.description"]', 'Delayed approval could impact Q2 deliverables');
    await page.selectOption('select[name="risks.0.severity"]', 'high');
    await page.selectOption('select[name="risks.0.likelihood"]', 'possible');
    await page.fill('textarea[name="risks.0.mitigation_strategy"]', 'Prepare contingency plan by EOW');
    await page.fill('input[name="risks.0.owner"]', 'John Smith');

    // Verify risk appears in list
    await expect(page.locator('text=Delayed approval could impact Q2 deliverables')).toBeVisible();
  });

  test('should save as draft and appear in timeline', async () => {
    // Step 8 & 9: Save as draft
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Fill minimal required fields
    await page.fill('input[name="attendees"]', 'John Smith, Sarah Lee');

    // Add one decision
    await page.click('button:has-text("Add Decision")');
    await page.fill('input[name="decisions.0.description"]', 'Test decision');
    await page.fill('input[name="decisions.0.decision_maker"]', 'Test User');
    await page.fill('input[name="decisions.0.decision_date"]', '2025-09-29');

    // Click Save Draft
    await page.click('button:has-text("Save Draft")');

    // Verify success message
    await expect(page.locator('text=After-action saved as draft')).toBeVisible({ timeout: 5000 });

    // Verify redirect to detail page
    await expect(page).toHaveURL(/\/_protected\/after-actions\/[a-f0-9-]+$/);

    // Navigate to dossier timeline
    await page.goto(`/_protected/dossiers/${TEST_DOSSIER_ID}`);
    await page.click('button:has-text("Timeline")');

    // Verify after-action appears with Draft badge
    await expect(page.locator('text=Draft').first()).toBeVisible();
  });

  test('should complete full workflow - fill all sections and save draft', async () => {
    // Complete workflow test
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);

    // Fill attendees
    await page.fill('input[name="attendees"]', 'John Smith, Sarah Lee, Ahmed Al-Rashid');

    // Add decision
    await page.click('button:has-text("Add Decision")');
    await page.fill('input[name="decisions.0.description"]', 'Approved budget increase for Phase 2');
    await page.fill('textarea[name="decisions.0.rationale"]', 'Additional resources needed');
    await page.fill('input[name="decisions.0.decision_maker"]', 'Sarah Lee');
    await page.fill('input[name="decisions.0.decision_date"]', '2025-09-29');

    // Add internal commitment
    await page.click('button:has-text("Add Commitment")');
    await page.fill('input[name="commitments.0.description"]', 'Submit revised budget proposal');
    await page.click('input[value="internal"]');
    await page.selectOption('select[name="commitments.0.owner_user_id"]', { label: 'John Smith' });
    const internalDueDate = new Date();
    internalDueDate.setDate(internalDueDate.getDate() + 7);
    await page.fill('input[name="commitments.0.due_date"]', internalDueDate.toISOString().split('T')[0]);
    await page.selectOption('select[name="commitments.0.priority"]', 'high');

    // Add risk
    await page.click('button:has-text("Add Risk")');
    await page.fill('input[name="risks.0.description"]', 'Delayed approval could impact Q2 deliverables');
    await page.selectOption('select[name="risks.0.severity"]', 'high');
    await page.selectOption('select[name="risks.0.likelihood"]', 'possible');

    // Add notes
    await page.fill('textarea[name="notes"]', 'Meeting went well. All attendees engaged.');

    // Save draft
    await page.click('button:has-text("Save Draft")');

    // Verify success
    await expect(page.locator('text=After-action saved as draft')).toBeVisible({ timeout: 5000 });

    // Verify all data persisted
    await page.reload();
    await expect(page.locator('text=John Smith, Sarah Lee, Ahmed Al-Rashid')).toBeVisible();
    await expect(page.locator('text=Approved budget increase for Phase 2')).toBeVisible();
    await expect(page.locator('text=Submit revised budget proposal')).toBeVisible();
    await expect(page.locator('text=Delayed approval could impact Q2 deliverables')).toBeVisible();
  });
});
