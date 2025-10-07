import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Test: User Story 2 - AI-Assisted Extraction
 *
 * As a staff member
 * I want to upload meeting minutes and extract structured data
 * So that I don't have to manually transcribe decisions and action items
 *
 * Reference: quickstart.md lines 155-261
 */

const TEST_ENGAGEMENT_ID = '22222222-2222-2222-2222-222222222222';
const TEST_STAFF_EMAIL = 'test-staff@gastat.gov.sa';
const TEST_STAFF_PASSWORD = 'Test123!@#';

// Create test files
const TEST_FILES_DIR = path.join(__dirname, '../fixtures/ai-extraction');
const SMALL_NOTES_PATH = path.join(TEST_FILES_DIR, 'small-meeting-notes.txt');
const LARGE_PDF_PATH = path.join(TEST_FILES_DIR, 'large-meeting-transcript.pdf');

// Test meeting notes content
const MEETING_NOTES_CONTENT = `Q1 Kickoff Meeting - 2025-09-29
Attendees: John Smith, Sarah Lee, Ahmed Al-Rashid

Decisions:
- Approved budget increase for Phase 2 (Sarah Lee)
- Deferred hiring decision until Q2 budget review (Team)

Action Items:
- John to submit revised budget proposal by Oct 6
- Ahmed to coordinate with external auditors by Oct 13

Risks:
- Delayed approval could impact Q2 deliverables (High/Possible)
`;

test.describe('User Story 2: AI-Assisted Extraction', () => {
  let page: Page;

  test.beforeAll(() => {
    // Create test fixtures directory
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }

    // Create small text file (10KB equivalent - pad with spaces)
    const paddedContent = MEETING_NOTES_CONTENT + '\n'.repeat(200);
    fs.writeFileSync(SMALL_NOTES_PATH, paddedContent);

    // Create large PDF placeholder (2MB mock)
    // In real scenario, this would be an actual PDF
    const largePdfContent = Buffer.alloc(2 * 1024 * 1024, 'PDF_CONTENT');
    fs.writeFileSync(LARGE_PDF_PATH, largePdfContent);
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login as staff member
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_STAFF_EMAIL);
    await page.fill('input[name="password"]', TEST_STAFF_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/_protected/**');

    // Navigate to after-action form
    await page.goto(`/_protected/engagements/${TEST_ENGAGEMENT_ID}/after-action`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(() => {
    // Clean up test files
    if (fs.existsSync(SMALL_NOTES_PATH)) {
      fs.unlinkSync(SMALL_NOTES_PATH);
    }
    if (fs.existsSync(LARGE_PDF_PATH)) {
      fs.unlinkSync(LARGE_PDF_PATH);
    }
    if (fs.existsSync(TEST_FILES_DIR)) {
      fs.rmdirSync(TEST_FILES_DIR);
    }
  });

  test('should upload and extract from small file (sync mode)', async () => {
    // Step 2: Upload meeting minutes (sync mode)
    const extractButton = page.locator('button:has-text("Extract from Minutes")');
    await expect(extractButton).toBeVisible();
    await extractButton.click();

    // Select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SMALL_NOTES_PATH);

    // Click Upload
    await page.click('button:has-text("Upload")');

    // Verify loading indicator (2-4 seconds)
    await expect(page.locator('text=Extracting...')).toBeVisible();

    // Wait for extraction completion
    await expect(page.locator('text=Extraction complete')).toBeVisible({ timeout: 10000 });
  });

  test('should display extracted data with confidence scores', async () => {
    // Step 3: Review extracted data
    await uploadAndExtractSync();

    // Verify decisions populated
    const decision1 = page.locator('text=Approved budget increase for Phase 2');
    await expect(decision1).toBeVisible();

    const decision1Confidence = page.locator('text=confidence: 0.9').or(page.locator('[data-confidence="0.9"]'));
    await expect(decision1Confidence.first()).toBeVisible();

    const decision2 = page.locator('text=Deferred hiring decision until Q2 budget review');
    await expect(decision2).toBeVisible();

    // Verify commitments populated
    const commitment1 = page.locator('text=Submit revised budget proposal');
    await expect(commitment1).toBeVisible();

    const commitment1Owner = page.locator('text=John Smith').first();
    await expect(commitment1Owner).toBeVisible();

    const commitment2 = page.locator('text=Coordinate with external auditors');
    await expect(commitment2).toBeVisible();

    // Verify risks populated
    const risk = page.locator('text=Delayed approval could impact Q2 deliverables');
    await expect(risk).toBeVisible();

    const riskSeverity = page.locator('select[name*="severity"]').first();
    await expect(riskSeverity).toHaveValue('high');

    const riskLikelihood = page.locator('select[name*="likelihood"]').first();
    await expect(riskLikelihood).toHaveValue('possible');
  });

  test('should allow editing AI-suggested data', async () => {
    // Step 4: Edit low-confidence item
    await uploadAndExtractSync();

    // Find low-confidence decision (0.85)
    const lowConfidenceDecision = page.locator('input[name*="decisions"][value*="Deferred hiring"]').first();
    await lowConfidenceDecision.click();

    // Edit description
    const newDescription = 'Deferred hiring decision until Q2 budget review - pending finance approval';
    await lowConfidenceDecision.fill(newDescription);

    // Verify edits saved
    await expect(lowConfidenceDecision).toHaveValue(newDescription);

    // Confidence indicator should remain
    await expect(page.locator('text=0.85').or(page.locator('[data-confidence="0.85"]')).first()).toBeVisible();
  });

  test('should handle large file upload (async mode)', async () => {
    // Step 5: Upload large PDF (async mode)
    const extractButton = page.locator('button:has-text("Extract from Minutes")');
    await extractButton.click();

    // Select large file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(LARGE_PDF_PATH);

    // Upload
    await page.click('button:has-text("Upload")');

    // Verify async notification
    await expect(page.locator('text=Processing in background')).toBeVisible({ timeout: 5000 });

    // Verify estimated time displayed
    await expect(page.locator('text=Estimated time: 15-20 seconds')).toBeVisible();

    // Verify job ID displayed
    const jobIdText = page.locator('text=Job ID:').or(page.locator('[data-testid="job-id"]'));
    await expect(jobIdText.first()).toBeVisible();

    // Verify user can continue editing form
    const attendeesInput = page.locator('input[name="attendees"]');
    await attendeesInput.fill('Test User');
    await expect(attendeesInput).toBeEnabled();
  });

  test('should receive async completion notification', async () => {
    // Step 6: Receive async completion notification
    await uploadLargeFileAsync();

    // Wait for completion (max 30 sec)
    const notification = page.locator('text=AI extraction complete').or(page.locator('[role="alert"]:has-text("extraction complete")'));
    await expect(notification.first()).toBeVisible({ timeout: 35000 });

    // Verify notification bell badge (red dot)
    const notificationBadge = page.locator('[data-testid="notification-badge"]').or(page.locator('.notification-indicator'));
    await expect(notificationBadge.first()).toBeVisible();

    // Verify merge modal
    const mergeModal = page.locator('text=Extracted data ready to review').or(page.locator('[role="dialog"]:has-text("Merge")'));
    await expect(mergeModal.first()).toBeVisible();
  });

  test('should merge async results with existing form data', async () => {
    // Step 7: Merge async results
    // First, add some manual data
    await page.fill('input[name="attendees"]', 'Manually Added User');

    await page.click('button:has-text("Add Decision")');
    await page.fill('input[name="decisions.0.description"]', 'Manual decision');
    await page.fill('input[name="decisions.0.decision_maker"]', 'Manual User');
    await page.fill('input[name="decisions.0.decision_date"]', '2025-09-29');

    // Upload and extract async
    await uploadLargeFileAsync();

    // Wait for completion and modal
    await expect(page.locator('text=Review & Merge')).toBeVisible({ timeout: 35000 });
    await page.click('button:has-text("Review & Merge")');

    // Verify side-by-side view
    await expect(page.locator('text=Current Form').or(page.locator('text=Current Data'))).toBeVisible();
    await expect(page.locator('text=Extracted Data')).toBeVisible();

    // Verify action buttons for each item
    const skipButtons = page.locator('button:has-text("Skip")');
    await expect(skipButtons.first()).toBeVisible();

    const addButtons = page.locator('button:has-text("Add")');
    await expect(addButtons.first()).toBeVisible();

    const replaceButtons = page.locator('button:has-text("Replace")');
    await expect(replaceButtons.first()).toBeVisible();

    // Add new item (extracted commitment)
    await addButtons.first().click();

    // Verify manual data preserved
    await page.click('button:has-text("Done")').or(page.locator('button:has-text("Close")'));
    await expect(page.locator('text=Manually Added User')).toBeVisible();
    await expect(page.locator('text=Manual decision')).toBeVisible();
  });

  test('should handle AI service unavailable gracefully', async () => {
    // Step 8: Handle AI unavailable fallback
    // Mock AI service down by intercepting the request
    await page.route('**/ai/extract', route => {
      route.abort('failed');
    });

    // Try to extract from file
    const extractButton = page.locator('button:has-text("Extract from Minutes")');
    await extractButton.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SMALL_NOTES_PATH);

    await page.click('button:has-text("Upload")');

    // Verify error message
    const errorMessage = page.locator('text=AI extraction unavailable. Fill form manually.').or(
      page.locator('[role="alert"]:has-text("unavailable")')
    );
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    // Verify form remains functional
    const attendeesInput = page.locator('input[name="attendees"]');
    await expect(attendeesInput).toBeEnabled();

    await page.fill('input[name="attendees"]', 'Test User');
    await expect(attendeesInput).toHaveValue('Test User');

    // Verify can proceed with manual entry
    await page.click('button:has-text("Add Decision")');
    await expect(page.locator('input[name="decisions.0.description"]')).toBeVisible();
  });

  test('should not populate low-confidence items (< 0.5)', async () => {
    // Mock response with low confidence item
    await page.route('**/ai/extract', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          decisions: [
            {
              description: 'High confidence decision',
              decision_maker: 'Test',
              confidence: 0.9
            },
            {
              description: 'Low confidence decision',
              decision_maker: 'Unknown',
              confidence: 0.45
            }
          ],
          commitments: [],
          risks: []
        })
      });
    });

    await uploadAndExtractSync();

    // High confidence item should be populated
    await expect(page.locator('text=High confidence decision')).toBeVisible();

    // Low confidence item should NOT be populated
    await expect(page.locator('text=Low confidence decision')).not.toBeVisible();

    // But notice should be shown
    const notice = page.locator('text=Low confidence item not populated').or(
      page.locator('text=low confidence').first()
    );
    await expect(notice.first()).toBeVisible();
  });

  // Helper functions
  async function uploadAndExtractSync() {
    const extractButton = page.locator('button:has-text("Extract from Minutes")');
    await extractButton.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SMALL_NOTES_PATH);

    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=Extraction complete').or(page.locator('[role="alert"]:has-text("complete")')).first()).toBeVisible({
      timeout: 10000
    });
  }

  async function uploadLargeFileAsync() {
    const extractButton = page.locator('button:has-text("Extract from Minutes")');
    await extractButton.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(LARGE_PDF_PATH);

    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=Processing in background')).toBeVisible({ timeout: 5000 });
  }
});
