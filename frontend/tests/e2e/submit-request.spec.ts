import { test, expect } from '@playwright/test';

/**
 * E2E Test: Submit Support Request Workflow
 * Tests the complete flow of submitting a support request through the Front Door
 *
 * Validates:
 * - Navigation to intake form
 * - Request type selection
 * - Bilingual form completion (EN/AR)
 * - File attachment upload
 * - SLA preview display
 * - Ticket submission and confirmation
 * - SLA countdown activation
 */

test.describe('Submit Support Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should complete full support request submission', async ({ page }) => {
    // Step 1: Navigate to Front Door page
    await page.goto('/intake/new');
    await expect(page).toHaveURL('/intake/new');
    await expect(page.locator('h1')).toContainText('Submit Support Request');

    // Step 2: Select "Engagement Support" request type
    await page.click('[data-testid="request-type-engagement"]');
    await expect(page.locator('[data-testid="request-type-engagement"]')).toHaveClass(/selected/);

    // Step 3: Fill title in English
    const titleEn = 'Statistical Data Analysis for Q4 Report';
    await page.fill('[data-testid="title-input-en"]', titleEn);
    await expect(page.locator('[data-testid="title-input-en"]')).toHaveValue(titleEn);

    // Step 4: Fill title in Arabic
    const titleAr = 'تحليل البيانات الإحصائية لتقرير الربع الرابع';
    await page.fill('[data-testid="title-input-ar"]', titleAr);
    await expect(page.locator('[data-testid="title-input-ar"]')).toHaveValue(titleAr);

    // Step 5: Fill description in English (>100 characters)
    const descriptionEn = 'We need assistance analyzing statistical data for our Q4 report. ' +
      'The data includes survey responses from 5000 participants across 13 regions. ' +
      'We require support with data validation, trend analysis, and visualization recommendations.';
    await page.fill('[data-testid="description-input-en"]', descriptionEn);
    await expect(page.locator('[data-testid="description-input-en"]')).toHaveValue(descriptionEn);

    // Step 6: Fill description in Arabic (>100 characters)
    const descriptionAr = 'نحتاج المساعدة في تحليل البيانات الإحصائية لتقرير الربع الرابع. ' +
      'تشمل البيانات استجابات المسح من 5000 مشارك عبر 13 منطقة. ' +
      'نحتاج الدعم في التحقق من صحة البيانات وتحليل الاتجاهات وتوصيات التصور.';
    await page.fill('[data-testid="description-input-ar"]', descriptionAr);

    // Step 7: Select urgency level
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await expect(page.locator('[data-testid="urgency-select"]')).toHaveValue('high');

    // Step 8: Link to existing dossier
    await page.click('[data-testid="dossier-link-existing"]');
    await page.fill('[data-testid="dossier-search"]', 'DSR-2025-001');
    await page.click('[data-testid="dossier-result-0"]');
    await expect(page.locator('[data-testid="selected-dossier"]')).toContainText('DSR-2025-001');

    // Step 9: Fill type-specific fields for Engagement
    await page.fill('[data-testid="engagement-field-stakeholder"]', 'Ministry of Planning');
    await page.fill('[data-testid="engagement-field-topic"]', 'Economic Indicators');
    await page.selectOption('[data-testid="engagement-field-format"]', 'workshop');

    // Step 10: Upload a test PDF attachment (simulated)
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content for testing purposes')
    });

    // Wait for upload progress and completion
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('test-document.pdf');

    // Step 11: Verify SLA preview is displayed
    await expect(page.locator('[data-testid="sla-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="sla-acknowledgment-target"]')).toContainText('30 min');
    await expect(page.locator('[data-testid="sla-resolution-target"]')).toContainText('8 hours');

    // Step 12: Review all entered data before submission
    await page.click('[data-testid="review-button"]');
    await expect(page.locator('[data-testid="review-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-title-en"]')).toContainText(titleEn);
    await expect(page.locator('[data-testid="review-title-ar"]')).toContainText(titleAr);

    // Step 13: Submit the request
    await page.click('[data-testid="submit-button"]');

    // Step 14: Wait for submission confirmation
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible({ timeout: 5000 });

    // Step 15: Verify ticket number is received
    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();
    expect(ticketNumber).toMatch(/TKT-2025-\d{6}/);

    // Step 16: Navigate to "My Requests"
    await page.click('[data-testid="view-my-requests-button"]');
    await expect(page).toHaveURL(/\/intake\/my-requests/);

    // Step 17: Verify ticket appears in the list
    await expect(page.locator(`[data-testid="ticket-${ticketNumber}"]`)).toBeVisible();

    // Step 18: Verify SLA countdown is active
    const slaCountdown = page.locator(`[data-testid="sla-countdown-${ticketNumber}"]`);
    await expect(slaCountdown).toBeVisible();
    await expect(slaCountdown).toContainText(/\d+:\d+/); // Format: HH:MM

    // Step 19: Verify ticket status
    const ticketStatus = page.locator(`[data-testid="ticket-status-${ticketNumber}"]`);
    await expect(ticketStatus).toContainText('Submitted');

    // Step 20: Open ticket to verify all data persisted
    await page.click(`[data-testid="ticket-${ticketNumber}"]`);
    await expect(page.locator('[data-testid="ticket-detail-title-en"]')).toContainText(titleEn);
    await expect(page.locator('[data-testid="ticket-detail-title-ar"]')).toContainText(titleAr);
    await expect(page.locator('[data-testid="ticket-detail-urgency"]')).toContainText('High');
    await expect(page.locator('[data-testid="ticket-detail-attachment"]')).toContainText('test-document.pdf');
  });

  test('should validate required fields before submission', async ({ page }) => {
    await page.goto('/intake/new');

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-button"]');

    // Verify validation errors appear
    await expect(page.locator('[data-testid="error-request-type"]')).toContainText('Request type is required');
    await expect(page.locator('[data-testid="error-title-en"]')).toContainText('English title is required');
    await expect(page.locator('[data-testid="error-title-ar"]')).toContainText('Arabic title is required');
    await expect(page.locator('[data-testid="error-description-en"]')).toContainText('Description must be at least 100 characters');
  });

  test('should enforce file size limits', async ({ page }) => {
    await page.goto('/intake/new');

    // Select request type to enable file upload
    await page.click('[data-testid="request-type-engagement"]');

    // Try to upload a file larger than 25MB (simulated)
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles({
      name: 'large-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(26 * 1024 * 1024) // 26MB
    });

    // Verify error message
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('File size exceeds 25MB limit');
    await expect(page.locator('[data-testid="uploaded-file-name"]')).not.toBeVisible();
  });

  test('should calculate SLA targets dynamically', async ({ page }) => {
    await page.goto('/intake/new');

    // Select request type
    await page.click('[data-testid="request-type-position"]');

    // Test with low urgency
    await page.selectOption('[data-testid="urgency-select"]', 'low');
    await expect(page.locator('[data-testid="sla-acknowledgment-target"]')).toContainText('4 hours');
    await expect(page.locator('[data-testid="sla-resolution-target"]')).toContainText('5 days');

    // Change to high urgency
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await expect(page.locator('[data-testid="sla-acknowledgment-target"]')).toContainText('30 min');
    await expect(page.locator('[data-testid="sla-resolution-target"]')).toContainText('8 hours');

    // Change to critical urgency
    await page.selectOption('[data-testid="urgency-select"]', 'critical');
    await expect(page.locator('[data-testid="sla-acknowledgment-target"]')).toContainText('15 min');
    await expect(page.locator('[data-testid="sla-resolution-target"]')).toContainText('4 hours');
  });

  test('should support RTL layout for Arabic content', async ({ page }) => {
    await page.goto('/intake/new');

    // Switch to Arabic language
    await page.click('[data-testid="language-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Verify form labels are in Arabic
    await expect(page.locator('[data-testid="title-label"]')).toContainText('العنوان');
    await expect(page.locator('[data-testid="description-label"]')).toContainText('الوصف');

    // Fill Arabic-first workflow
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-ar"]', 'طلب دعم فني');
    await page.fill('[data-testid="title-input-en"]', 'Technical Support Request');

    // Verify RTL text alignment
    const titleInput = page.locator('[data-testid="title-input-ar"]');
    await expect(titleInput).toHaveCSS('text-align', 'right');
  });
});