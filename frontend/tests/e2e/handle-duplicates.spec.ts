import { test, expect } from '@playwright/test';

/**
 * E2E Test: Handle Duplicates Workflow
 * Tests duplicate detection, comparison, and merge workflows
 *
 * Validates:
 * - Duplicate alert display
 * - Similarity score presentation
 * - Side-by-side comparison view
 * - Merge ticket functionality
 * - History preservation
 * - Not-duplicate dismissal
 * - AI feedback learning
 */

test.describe('Handle Duplicates Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as supervisor
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'supervisor@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'SupervisorPass123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should detect and merge high-confidence duplicate tickets', async ({ page }) => {
    // Step 1: Create first ticket
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');

    const title1 = 'Statistical Analysis Support for Regional Survey';
    const description1 = 'We need assistance analyzing survey data collected from 13 regions. ' +
      'The survey includes responses from approximately 5000 participants regarding economic indicators. ' +
      'Specific support needed includes data validation, trend analysis, and visualization recommendations.';

    await page.fill('[data-testid="title-input-en"]', title1);
    await page.fill('[data-testid="title-input-ar"]', 'دعم التحليل الإحصائي للمسح الإقليمي');
    await page.fill('[data-testid="description-input-en"]', description1);
    await page.fill('[data-testid="description-input-ar"]', 'نحتاج المساعدة في تحليل بيانات المسح من 13 منطقة');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    const ticket1Number = await page.locator('[data-testid="ticket-number"]').textContent();

    // Step 2: Create nearly identical second ticket (duplicate)
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');

    const title2 = 'Regional Survey Statistical Analysis Assistance';
    const description2 = 'Assistance required for analyzing regional survey data from 13 areas. ' +
      'Survey contains about 5000 participant responses on economic indicators. ' +
      'Need help with validation of data, trend analysis, and recommendations for visualizations.';

    await page.fill('[data-testid="title-input-en"]', title2);
    await page.fill('[data-testid="title-input-ar"]', 'المساعدة في التحليل الإحصائي للمسح الإقليمي');
    await page.fill('[data-testid="description-input-en"]', description2);
    await page.fill('[data-testid="description-input-ar"]', 'مطلوب مساعدة لتحليل بيانات المسح الإقليمي من 13 منطقة');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    const ticket2Number = await page.locator('[data-testid="ticket-number"]').textContent();

    // Step 3: Open second ticket as supervisor
    await page.goto(`/intake/tickets/${ticket2Number}`);

    // Step 4: Verify duplicate alert is displayed
    await expect(page.locator('[data-testid="duplicate-alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="duplicate-alert"]')).toContainText(/Potential duplicates detected|تم اكتشاف تكرارات محتملة/);

    // Step 5: Verify duplicate count
    const duplicateCount = await page.locator('[data-testid="duplicate-count"]').textContent();
    expect(parseInt(duplicateCount!)).toBeGreaterThan(0);

    // Step 6: Check that high-confidence duplicate (≥ 0.80) is highlighted
    const highConfidenceDuplicate = page.locator('[data-testid="duplicate-high-confidence"]').first();
    await expect(highConfidenceDuplicate).toBeVisible();

    const overallScore = await highConfidenceDuplicate.getAttribute('data-score');
    expect(parseFloat(overallScore!)).toBeGreaterThanOrEqual(0.80);

    // Step 7: Verify similarity scores are displayed
    await expect(page.locator('[data-testid="duplicate-overall-score"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="duplicate-title-similarity"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="duplicate-content-similarity"]').first()).toBeVisible();

    // Step 8: Click to view comparison
    await page.click('[data-testid="view-comparison-button"]');
    await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();

    // Step 9: Verify side-by-side comparison displays both tickets
    await expect(page.locator('[data-testid="comparison-ticket-current"]')).toContainText(ticket2Number!);
    await expect(page.locator('[data-testid="comparison-ticket-candidate"]')).toContainText(ticket1Number!);

    // Step 10: Verify field-by-field comparison
    await expect(page.locator('[data-testid="comparison-title-current"]')).toContainText(title2);
    await expect(page.locator('[data-testid="comparison-title-candidate"]')).toContainText(title1);
    await expect(page.locator('[data-testid="comparison-description-current"]')).toContainText(description2);
    await expect(page.locator('[data-testid="comparison-description-candidate"]')).toContainText(description1);

    // Step 11: Verify differences are highlighted
    const highlightedDiffs = page.locator('[data-testid^="comparison-diff-"]');
    expect(await highlightedDiffs.count()).toBeGreaterThan(0);

    // Step 12: Click "Merge Tickets" button
    await page.click('[data-testid="merge-tickets-button"]');
    await expect(page.locator('[data-testid="merge-confirmation-dialog"]')).toBeVisible();

    // Step 13: Select primary ticket
    await page.click(`[data-testid="select-primary-${ticket1Number}"]`);
    await expect(page.locator(`[data-testid="select-primary-${ticket1Number}"]`)).toHaveClass(/selected/);

    // Step 14: Provide merge reason
    const mergeReason = 'Duplicate request - same survey data analysis needs';
    await page.fill('[data-testid="merge-reason-input"]', mergeReason);

    // Step 15: Confirm merge
    await page.click('[data-testid="confirm-merge-button"]');

    // Step 16: Wait for merge to complete
    await expect(page.locator('[data-testid="merge-success-message"]')).toBeVisible({ timeout: 5000 });

    // Step 17: Verify secondary ticket status changed to "merged"
    await page.goto(`/intake/tickets/${ticket2Number}`);
    await expect(page.locator('[data-testid="ticket-status-display"]')).toContainText('Merged');

    // Step 18: Verify merge target link is displayed
    const mergeTargetLink = page.locator('[data-testid="merge-target-link"]');
    await expect(mergeTargetLink).toBeVisible();
    await expect(mergeTargetLink).toContainText(ticket1Number!);

    // Step 19: Verify history is preserved in merged ticket
    await mergeTargetLink.click();
    await page.click('[data-testid="history-tab"]');

    const mergeHistoryEntry = page.locator('[data-testid="history-entry-merge"]');
    await expect(mergeHistoryEntry).toBeVisible();
    await expect(mergeHistoryEntry).toContainText(ticket2Number!);
    await expect(mergeHistoryEntry).toContainText(mergeReason);

    // Step 20: Verify audit trail entry created
    await page.click('[data-testid="audit-trail-tab"]');
    const auditEntry = page.locator('[data-testid="audit-entry-merge"]');
    await expect(auditEntry).toBeVisible();
    await expect(auditEntry).toContainText('merge');
  });

  test('should allow dismissing false positive duplicates', async ({ page }) => {
    // Create ticket with potential duplicates
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-position"]');
    await page.fill('[data-testid="title-input-en"]', 'Statistical Analyst Position Request');
    await page.fill('[data-testid="title-input-ar"]', 'طلب وظيفة محلل إحصائي');
    await page.fill('[data-testid="description-input-en"]', 'We need to create a new position for a statistical analyst in our department. ' +
      'The role will involve data analysis and reporting duties for our regional operations.');
    await page.fill('[data-testid="description-input-ar"]', 'نحتاج إلى إنشاء وظيفة جديدة لمحلل إحصائي في قسمنا');
    await page.selectOption('[data-testid="urgency-select"]', 'medium');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Open ticket and check for duplicates
    await page.goto(`/intake/tickets/${ticketNumber}`);

    // If duplicates are detected
    const duplicateAlert = page.locator('[data-testid="duplicate-alert"]');
    if (await duplicateAlert.isVisible()) {
      // View comparison
      await page.click('[data-testid="view-comparison-button"]');
      await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();

      // Determine it's not a duplicate
      await page.click('[data-testid="not-duplicate-button"]');
      await expect(page.locator('[data-testid="dismiss-confirmation-dialog"]')).toBeVisible();

      // Provide dismissal reason (optional)
      await page.fill('[data-testid="dismissal-reason-input"]', 'Different department and requirements');

      // Confirm dismissal
      await page.click('[data-testid="confirm-dismiss-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="dismiss-success-message"]')).toBeVisible();

      // Verify duplicate alert is no longer shown
      await page.reload();
      await expect(duplicateAlert).not.toBeVisible();

      // Verify audit trail records dismissal
      await page.click('[data-testid="audit-trail-tab"]');
      const dismissalEntry = page.locator('[data-testid="audit-entry-duplicate-dismiss"]');
      await expect(dismissalEntry).toBeVisible();
    }
  });

  test('should display different similarity scores accurately', async ({ page }) => {
    // Navigate to a ticket with duplicates
    await page.goto('/intake/queue');
    await page.click('[data-testid="filter-has-duplicates"]');

    const ticketWithDuplicates = page.locator('[data-testid^="queue-ticket-"][data-has-duplicates="true"]').first();
    if (await ticketWithDuplicates.count() > 0) {
      await ticketWithDuplicates.click();

      // Verify duplicate candidates are listed
      const candidates = page.locator('[data-testid^="duplicate-candidate-"]');
      const count = await candidates.count();
      expect(count).toBeGreaterThan(0);

      // Check each candidate's scores
      for (let i = 0; i < Math.min(count, 3); i++) {
        const candidate = candidates.nth(i);

        // Overall score
        const overallScore = await candidate.locator('[data-testid="duplicate-overall-score"]').textContent();
        const overallValue = parseFloat(overallScore!);
        expect(overallValue).toBeGreaterThanOrEqual(0);
        expect(overallValue).toBeLessThanOrEqual(1);

        // Title similarity
        const titleScore = await candidate.locator('[data-testid="duplicate-title-similarity"]').textContent();
        const titleValue = parseFloat(titleScore!);
        expect(titleValue).toBeGreaterThanOrEqual(0);
        expect(titleValue).toBeLessThanOrEqual(1);

        // Content similarity
        const contentScore = await candidate.locator('[data-testid="duplicate-content-similarity"]').textContent();
        const contentValue = parseFloat(contentScore!);
        expect(contentValue).toBeGreaterThanOrEqual(0);
        expect(contentValue).toBeLessThanOrEqual(1);

        // Verify high-confidence badge for scores ≥ 0.80
        if (overallValue >= 0.80) {
          await expect(candidate.locator('[data-testid="high-confidence-badge"]')).toBeVisible();
        }
      }
    }
  });

  test('should preserve all data when merging tickets', async ({ page }) => {
    // Create primary ticket with attachments
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Original Request with Attachments');
    await page.fill('[data-testid="title-input-ar"]', 'الطلب الأصلي مع المرفقات');
    await page.fill('[data-testid="description-input-en"]', 'This is the primary ticket with important context and attachments that should be preserved during merge operations.');
    await page.fill('[data-testid="description-input-ar"]', 'هذه هي التذكرة الأساسية');

    // Upload attachment
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles({
      name: 'primary-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Primary ticket document')
    });
    await page.waitForSelector('[data-testid="upload-success"]');

    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');
    const primaryTicket = await page.locator('[data-testid="ticket-number"]').textContent();

    // Create duplicate with different attachment
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Duplicate Request with Additional Files');
    await page.fill('[data-testid="title-input-ar"]', 'طلب مكرر مع ملفات إضافية');
    await page.fill('[data-testid="description-input-en"]', 'This is essentially the same request but includes additional supporting documentation.');
    await page.fill('[data-testid="description-input-ar"]', 'هذا هو نفس الطلب بشكل أساسي');

    await fileInput.setInputFiles({
      name: 'additional-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Additional document')
    });
    await page.waitForSelector('[data-testid="upload-success"]');

    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');
    const duplicateTicket = await page.locator('[data-testid="ticket-number"]').textContent();

    // Navigate to duplicate and merge
    await page.goto(`/intake/tickets/${duplicateTicket}`);
    await page.waitForSelector('[data-testid="duplicate-alert"]', { timeout: 10000 });
    await page.click('[data-testid="view-comparison-button"]');
    await page.click('[data-testid="merge-tickets-button"]');
    await page.click(`[data-testid="select-primary-${primaryTicket}"]`);
    await page.fill('[data-testid="merge-reason-input"]', 'Consolidating duplicate requests');
    await page.click('[data-testid="confirm-merge-button"]');
    await page.waitForSelector('[data-testid="merge-success-message"]');

    // Verify both attachments are preserved in primary ticket
    await page.goto(`/intake/tickets/${primaryTicket}`);
    await page.click('[data-testid="attachments-tab"]');

    const attachments = page.locator('[data-testid^="attachment-"]');
    expect(await attachments.count()).toBeGreaterThanOrEqual(2);

    await expect(page.locator('[data-testid="attachment-primary-document.pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="attachment-additional-document.pdf"]')).toBeVisible();

    // Verify merged ticket information is accessible
    await page.click('[data-testid="history-tab"]');
    const mergedFromEntry = page.locator('[data-testid^="history-merged-from-"]');
    await expect(mergedFromEntry).toContainText(duplicateTicket!);
  });

  test('should handle multiple duplicate candidates', async ({ page }) => {
    // Scenario where one ticket has multiple potential duplicates
    await page.goto('/intake/queue');

    // Find ticket with multiple duplicates
    const multiDuplicateTicket = page.locator('[data-testid^="queue-ticket-"][data-duplicate-count]').first();

    if (await multiDuplicateTicket.count() > 0) {
      const duplicateCount = await multiDuplicateTicket.getAttribute('data-duplicate-count');

      if (parseInt(duplicateCount!) > 1) {
        await multiDuplicateTicket.click();

        // Verify multiple candidates are shown
        await expect(page.locator('[data-testid="duplicate-alert"]')).toContainText(`${duplicateCount} potential duplicates`);

        // View all candidates
        const candidates = page.locator('[data-testid^="duplicate-candidate-"]');
        expect(await candidates.count()).toBe(parseInt(duplicateCount!));

        // Candidates should be sorted by similarity score (highest first)
        const scores: number[] = [];
        for (let i = 0; i < parseInt(duplicateCount!); i++) {
          const scoreText = await candidates.nth(i).locator('[data-testid="duplicate-overall-score"]').textContent();
          scores.push(parseFloat(scoreText!));
        }

        // Verify descending order
        for (let i = 0; i < scores.length - 1; i++) {
          expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
        }
      }
    }
  });

  test('should support bilingual comparison view', async ({ page }) => {
    // Create tickets with both English and Arabic content
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Regional Survey Analysis');
    await page.fill('[data-testid="title-input-ar"]', 'تحليل المسح الإقليمي');
    await page.fill('[data-testid="description-input-en"]', 'Analysis of regional survey data for economic indicators across multiple regions.');
    await page.fill('[data-testid="description-input-ar"]', 'تحليل بيانات المسح الإقليمي للمؤشرات الاقتصادية عبر مناطق متعددة.');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    // Create similar ticket
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Regional Data Analysis Request');
    await page.fill('[data-testid="title-input-ar"]', 'طلب تحليل البيانات الإقليمية');
    await page.fill('[data-testid="description-input-en"]', 'Need analysis for regional survey data covering economic indicators in various areas.');
    await page.fill('[data-testid="description-input-ar"]', 'نحتاج تحليل بيانات المسح الإقليمي للمؤشرات الاقتصادية في مناطق مختلفة.');
    await page.selectOption('[data-testid="urgency-select"]', 'high');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // View comparison
    await page.goto(`/intake/tickets/${ticketNumber}`);

    const duplicateAlert = page.locator('[data-testid="duplicate-alert"]');
    if (await duplicateAlert.isVisible()) {
      await page.click('[data-testid="view-comparison-button"]');

      // Switch to Arabic language
      await page.click('[data-testid="language-toggle"]');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

      // Verify Arabic content is displayed in comparison
      await expect(page.locator('[data-testid="comparison-title-current-ar"]')).toBeVisible();
      await expect(page.locator('[data-testid="comparison-description-current-ar"]')).toBeVisible();

      // Verify RTL layout
      const comparisonPanel = page.locator('[data-testid="comparison-view"]');
      await expect(comparisonPanel).toHaveCSS('direction', 'rtl');
    }
  });
});