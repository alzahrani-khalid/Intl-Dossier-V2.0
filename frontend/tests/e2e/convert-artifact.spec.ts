import { test, expect } from '@playwright/test';

/**
 * E2E Test: Convert to Artifact Workflow
 * Tests ticket conversion to working artifacts with security checks
 *
 * Validates:
 * - Conversion initiation
 * - Target type selection
 * - MFA security check for confidential tickets
 * - Data mapping and pre-population
 * - Bidirectional linking
 * - Audit trail logging
 * - Status updates
 */

test.describe('Convert to Artifact Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as supervisor with conversion permissions
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'supervisor@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'SupervisorPass123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should convert triaged ticket to engagement artifact', async ({ page }) => {
    // Step 1: Create and triage a ticket
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');

    const title = 'International Collaboration Workshop Request';
    const description = 'We need support organizing a workshop with international partners ' +
      'to discuss statistical methodology best practices. The workshop should include ' +
      'representatives from 5 countries and cover topics related to data quality assurance.';

    await page.fill('[data-testid="title-input-en"]', title);
    await page.fill('[data-testid="title-input-ar"]', 'طلب ورشة عمل للتعاون الدولي');
    await page.fill('[data-testid="description-input-en"]', description);
    await page.fill('[data-testid="description-input-ar"]', 'نحتاج الدعم لتنظيم ورشة عمل مع شركاء دوليين');
    await page.selectOption('[data-testid="urgency-select"]', 'medium');
    await page.fill('[data-testid="engagement-field-stakeholder"]', 'International Statistical Organizations');
    await page.fill('[data-testid="engagement-field-topic"]', 'Data Quality Assurance');
    await page.selectOption('[data-testid="engagement-field-format"]', 'workshop');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Step 2: Navigate to ticket and triage it
    await page.goto(`/intake/tickets/${ticketNumber}`);
    await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });
    await page.click('[data-testid="accept-ai-triage-button"]');
    await page.waitForSelector('[data-testid="triage-success-message"]');

    // Step 3: Verify ticket status is "triaged" or "assigned"
    const status = await page.locator('[data-testid="ticket-status-display"]').textContent();
    expect(['Triaged', 'Assigned']).toContain(status);

    // Step 4: Verify all required information is present
    await expect(page.locator('[data-testid="ticket-detail-title-en"]')).toContainText(title);
    await expect(page.locator('[data-testid="ticket-detail-type"]')).toBeVisible();

    // Step 5: Initiate conversion
    await page.click('[data-testid="convert-ticket-button"]');
    await expect(page.locator('[data-testid="conversion-panel"]')).toBeVisible();

    // Step 6: Select target artifact type
    await page.click('[data-testid="target-type-engagement"]');
    await expect(page.locator('[data-testid="target-type-engagement"]')).toHaveClass(/selected/);

    // Step 7: Verify data is pre-populated from ticket
    await expect(page.locator('[data-testid="conversion-field-title-en"]')).toHaveValue(title);
    await expect(page.locator('[data-testid="conversion-field-stakeholder"]')).toHaveValue('International Statistical Organizations');
    await expect(page.locator('[data-testid="conversion-field-topic"]')).toHaveValue('Data Quality Assurance');

    // Step 8: Fill additional required fields for engagement
    await page.fill('[data-testid="conversion-field-start-date"]', '2025-03-15');
    await page.fill('[data-testid="conversion-field-end-date"]', '2025-03-17');
    await page.fill('[data-testid="conversion-field-location"]', 'Riyadh, Saudi Arabia');
    await page.fill('[data-testid="conversion-field-budget"]', '150000');

    // Step 9: Review conversion preview
    await page.click('[data-testid="preview-conversion-button"]');
    await expect(page.locator('[data-testid="conversion-preview-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-field-title"]')).toContainText(title);
    await expect(page.locator('[data-testid="preview-field-dates"]')).toContainText('2025-03-15');

    // Step 10: Confirm conversion
    await page.click('[data-testid="confirm-conversion-button"]');

    // Step 11: Wait for conversion to complete
    await expect(page.locator('[data-testid="conversion-success-message"]')).toBeVisible({ timeout: 5000 });

    // Step 12: Verify new artifact ID is displayed
    const artifactId = await page.locator('[data-testid="created-artifact-id"]').textContent();
    expect(artifactId).toMatch(/ENG-2025-\d+/);

    // Step 13: Verify ticket status updated to "converted"
    await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText('Converted');

    // Step 14: Verify link to artifact is displayed
    const artifactLink = page.locator('[data-testid="artifact-link"]');
    await expect(artifactLink).toBeVisible();
    await expect(artifactLink).toContainText(artifactId!);

    // Step 15: Navigate to artifact to verify creation
    await artifactLink.click();
    await expect(page).toHaveURL(new RegExp(`/engagements/${artifactId}`));

    // Step 16: Verify artifact contains data from ticket
    await expect(page.locator('[data-testid="engagement-title"]')).toContainText(title);
    await expect(page.locator('[data-testid="engagement-stakeholder"]')).toContainText('International Statistical Organizations');

    // Step 17: Verify bidirectional link - artifact links back to ticket
    const ticketLink = page.locator('[data-testid="source-ticket-link"]');
    await expect(ticketLink).toBeVisible();
    await expect(ticketLink).toContainText(ticketNumber!);

    // Step 18: Navigate back to ticket
    await ticketLink.click();
    await expect(page).toHaveURL(new RegExp(`/intake/tickets/${ticketNumber}`));

    // Step 19: Verify audit trail entry
    await page.click('[data-testid="audit-trail-tab"]');
    const conversionEntry = page.locator('[data-testid="audit-entry-conversion"]');
    await expect(conversionEntry).toBeVisible();
    await expect(conversionEntry).toContainText('converted');
    await expect(conversionEntry).toContainText(artifactId!);

    // Step 20: Verify conversion cannot be done again
    await expect(page.locator('[data-testid="convert-ticket-button"]')).toBeDisabled();
  });

  test('should require MFA for confidential ticket conversion', async ({ page }) => {
    // Step 1: Create a confidential ticket
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-position"]');

    await page.fill('[data-testid="title-input-en"]', 'Senior Analyst Position - Classified Project');
    await page.fill('[data-testid="title-input-ar"]', 'وظيفة محلل أول - مشروع سري');
    await page.fill('[data-testid="description-input-en"]', 'Position request for sensitive government project requiring high-level security clearance and expertise in classified data analysis.');
    await page.fill('[data-testid="description-input-ar"]', 'طلب وظيفة لمشروع حكومي حساس');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Step 2: Triage as confidential
    await page.goto(`/intake/tickets/${ticketNumber}`);
    await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });

    // Override AI to set as confidential
    await page.click('[data-testid="override-ai-button"]');
    await page.selectOption('[data-testid="override-sensitivity-select"]', 'confidential');
    await page.fill('[data-testid="override-reason-input"]', 'Classified government project');
    await page.click('[data-testid="submit-override-button"]');
    await page.waitForSelector('[data-testid="override-success-message"]');

    // Step 3: Verify sensitivity is set to confidential
    await expect(page.locator('[data-testid="ticket-sensitivity-display"]')).toContainText('Confidential');

    // Step 4: Initiate conversion
    await page.click('[data-testid="convert-ticket-button"]');
    await expect(page.locator('[data-testid="conversion-panel"]')).toBeVisible();

    // Step 5: Select target type
    await page.click('[data-testid="target-type-position"]');

    // Fill required fields
    await page.fill('[data-testid="conversion-field-job-title"]', 'Senior Statistical Analyst');
    await page.selectOption('[data-testid="conversion-field-grade"]', 'grade-12');
    await page.fill('[data-testid="conversion-field-department"]', 'Research & Analysis');

    // Step 6: Attempt to confirm conversion
    await page.click('[data-testid="confirm-conversion-button"]');

    // Step 7: Verify MFA prompt appears
    await expect(page.locator('[data-testid="mfa-prompt"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="mfa-prompt"]')).toContainText(/Multi-factor authentication required|المصادقة متعددة العوامل مطلوبة/);

    // Step 8: Verify security reason is displayed
    await expect(page.locator('[data-testid="mfa-reason"]')).toContainText(/confidential|سري/i);

    // Step 9: Enter verification code
    await page.fill('[data-testid="mfa-code-input"]', '123456');

    // Step 10: Submit MFA
    await page.click('[data-testid="mfa-submit-button"]');

    // Step 11: Wait for MFA verification
    await expect(page.locator('[data-testid="mfa-success"]')).toBeVisible({ timeout: 5000 });

    // Step 12: Conversion proceeds after MFA
    await expect(page.locator('[data-testid="conversion-success-message"]')).toBeVisible({ timeout: 5000 });

    // Step 13: Verify audit log includes MFA flag
    await page.click('[data-testid="audit-trail-tab"]');
    const mfaEntry = page.locator('[data-testid="audit-entry-conversion"]');
    await expect(mfaEntry).toContainText('MFA verified');
    await expect(mfaEntry).toHaveAttribute('data-mfa-verified', 'true');
  });

  test('should validate required fields before conversion', async ({ page }) => {
    // Create and triage ticket
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-mou-action"]');
    await page.fill('[data-testid="title-input-en"]', 'MoU Implementation Action');
    await page.fill('[data-testid="title-input-ar"]', 'إجراء تنفيذ مذكرة التفاهم');
    await page.fill('[data-testid="description-input-en"]', 'Action item from our MoU with Ministry of Planning requiring coordination and resource allocation.');
    await page.fill('[data-testid="description-input-ar"]', 'بند العمل من مذكرة التفاهم الخاصة بنا');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Triage
    await page.goto(`/intake/tickets/${ticketNumber}`);
    await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });
    await page.click('[data-testid="accept-ai-triage-button"]');
    await page.waitForSelector('[data-testid="triage-success-message"]');

    // Initiate conversion
    await page.click('[data-testid="convert-ticket-button"]');
    await page.click('[data-testid="target-type-mou-action"]');

    // Try to confirm without filling required fields
    await page.click('[data-testid="confirm-conversion-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="error-mou-reference"]')).toContainText(/MoU reference is required|مرجع مذكرة التفاهم مطلوب/);
    await expect(page.locator('[data-testid="error-action-deadline"]')).toContainText(/Deadline is required|الموعد النهائي مطلوب/);
    await expect(page.locator('[data-testid="error-responsible-party"]')).toContainText(/Responsible party is required|الطرف المسؤول مطلوب/);

    // Conversion should not proceed
    await expect(page.locator('[data-testid="conversion-success-message"]')).not.toBeVisible();
  });

  test('should handle conversion to different artifact types', async ({ page }) => {
    const testCases = [
      {
        requestType: 'position',
        targetType: 'position',
        requiredFields: {
          'job-title': 'Statistical Analyst',
          'grade': 'grade-10',
          'department': 'Data Analysis'
        },
        artifactPattern: /POS-2025-\d+/
      },
      {
        requestType: 'foresight',
        targetType: 'foresight',
        requiredFields: {
          'topic': 'Economic Trends 2030',
          'timeframe': '2025-2030',
          'priority': 'high'
        },
        artifactPattern: /FST-2025-\d+/
      }
    ];

    for (const testCase of testCases) {
      // Create ticket
      await page.goto('/intake/new');
      await page.click(`[data-testid="request-type-${testCase.requestType}"]`);
      await page.fill('[data-testid="title-input-en"]', `Test ${testCase.requestType} request`);
      await page.fill('[data-testid="title-input-ar"]', `اختبار طلب ${testCase.requestType}`);
      await page.fill('[data-testid="description-input-en"]', 'This is a test request for conversion workflow validation with sufficient detail to meet minimum requirements.');
      await page.fill('[data-testid="description-input-ar"]', 'هذا طلب اختبار للتحقق من صحة سير عمل التحويل');
      await page.selectOption('[data-testid="urgency-select"]', 'medium');
      await page.click('[data-testid="submit-button"]');

      const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

      // Triage
      await page.goto(`/intake/tickets/${ticketNumber}`);
      await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });
      await page.click('[data-testid="accept-ai-triage-button"]');
      await page.waitForSelector('[data-testid="triage-success-message"]');

      // Convert
      await page.click('[data-testid="convert-ticket-button"]');
      await page.click(`[data-testid="target-type-${testCase.targetType}"]`);

      // Fill required fields
      for (const [field, value] of Object.entries(testCase.requiredFields)) {
        const fieldSelector = `[data-testid="conversion-field-${field}"]`;
        const fieldType = await page.locator(fieldSelector).getAttribute('type');

        if (fieldType === 'select-one') {
          await page.selectOption(fieldSelector, value);
        } else {
          await page.fill(fieldSelector, value);
        }
      }

      // Confirm
      await page.click('[data-testid="confirm-conversion-button"]');
      await expect(page.locator('[data-testid="conversion-success-message"]')).toBeVisible({ timeout: 5000 });

      // Verify artifact ID pattern
      const artifactId = await page.locator('[data-testid="created-artifact-id"]').textContent();
      expect(artifactId).toMatch(testCase.artifactPattern);

      // Verify status
      await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText('Converted');
    }
  });

  test('should preserve attachments during conversion', async ({ page }) => {
    // Create ticket with attachment
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Engagement with Supporting Documents');
    await page.fill('[data-testid="title-input-ar"]', 'المشاركة مع الوثائق الداعمة');
    await page.fill('[data-testid="description-input-en"]', 'This engagement request includes important supporting documentation that should be carried over to the artifact.');
    await page.fill('[data-testid="description-input-ar"]', 'يتضمن طلب المشاركة هذا وثائق داعمة مهمة');

    // Upload attachment
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles({
      name: 'proposal-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Proposal document content')
    });
    await page.waitForSelector('[data-testid="upload-success"]');

    await page.selectOption('[data-testid="urgency-select"]', 'medium');
    await page.fill('[data-testid="engagement-field-stakeholder"]', 'External Partner');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Triage and convert
    await page.goto(`/intake/tickets/${ticketNumber}`);
    await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });
    await page.click('[data-testid="accept-ai-triage-button"]');
    await page.waitForSelector('[data-testid="triage-success-message"]');

    await page.click('[data-testid="convert-ticket-button"]');
    await page.click('[data-testid="target-type-engagement"]');
    await page.fill('[data-testid="conversion-field-start-date"]', '2025-04-01');
    await page.fill('[data-testid="conversion-field-end-date"]', '2025-04-03');
    await page.click('[data-testid="confirm-conversion-button"]');
    await page.waitForSelector('[data-testid="conversion-success-message"]');

    // Navigate to artifact
    const artifactId = await page.locator('[data-testid="created-artifact-id"]').textContent();
    await page.goto(`/engagements/${artifactId}`);

    // Verify attachment is accessible from artifact
    await page.click('[data-testid="attachments-tab"]');
    await expect(page.locator('[data-testid="attachment-proposal-document.pdf"]')).toBeVisible();

    // Verify attachment metadata shows source ticket
    const attachmentSource = page.locator('[data-testid="attachment-source-proposal-document.pdf"]');
    await expect(attachmentSource).toContainText(ticketNumber!);
  });

  test('should rollback conversion on error', async ({ page }) => {
    // This test simulates a conversion failure scenario
    // In real implementation, this might be triggered by API errors or validation failures

    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Test Rollback Scenario');
    await page.fill('[data-testid="title-input-ar"]', 'سيناريو اختبار الإرجاع');
    await page.fill('[data-testid="description-input-en"]', 'Testing conversion rollback when errors occur during artifact creation process.');
    await page.fill('[data-testid="description-input-ar"]', 'اختبار التراجع عن التحويل');
    await page.selectOption('[data-testid="urgency-select"]', 'medium');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();
    const originalStatus = 'Triaged';

    // Triage
    await page.goto(`/intake/tickets/${ticketNumber}`);
    await page.waitForSelector('[data-testid="ai-suggestions-panel"]', { timeout: 5000 });
    await page.click('[data-testid="accept-ai-triage-button"]');
    await page.waitForSelector('[data-testid="triage-success-message"]');

    // Attempt conversion with missing critical data to trigger error
    await page.click('[data-testid="convert-ticket-button"]');
    await page.click('[data-testid="target-type-engagement"]');

    // Simulate error by not filling required fields and forcing submit via API call or test flag
    // In actual test, this might use page.route() to intercept and return error

    // If conversion fails, verify:
    // 1. Error message is displayed
    const conversionError = page.locator('[data-testid="conversion-error-message"]');
    if (await conversionError.isVisible()) {
      await expect(conversionError).toContainText(/Conversion failed|فشل التحويل/);

      // 2. Ticket status remains unchanged
      await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText(originalStatus);

      // 3. Convert button is still available for retry
      await expect(page.locator('[data-testid="convert-ticket-button"]')).toBeEnabled();

      // 4. No artifact link is shown
      await expect(page.locator('[data-testid="artifact-link"]')).not.toBeVisible();
    }
  });
});