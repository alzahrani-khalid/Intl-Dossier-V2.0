import { test, expect } from '@playwright/test';

/**
 * E2E Test: Import Checklist Template (T080)
 * Tests importing predefined checklist templates and verifying item creation
 *
 * Validates:
 * - Template selector modal opens
 * - Templates are displayed with preview
 * - Import creates all items with correct sequence
 * - Progress percentage updates correctly
 * - Timeline shows import event
 */

test.describe('Import Checklist Template', () => {
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
        work_item_id: 'test-dossier-checklist',
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

    // Navigate to assignment detail
    await page.goto(`/assignments/${testAssignmentId}`);
    await expect(page).toHaveURL(`/assignments/${testAssignmentId}`);
  });

  test('should open template selector modal on button click', async ({ page }) => {
    // Click "Import Template" button
    await page.click('[data-testid="import-template-button"]');

    // Verify modal opens
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText(/import.*template/i);

    // Verify close button exists
    await expect(page.locator('[data-testid="modal-close-button"]')).toBeVisible();

    // Close modal
    await page.click('[data-testid="modal-close-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();
  });

  test('should display available templates with bilingual names', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // Verify templates are listed
    const templateCards = page.locator('[data-testid="template-card"]');
    await expect(templateCards).toHaveCount(2, { timeout: 3000 }); // 2 seed templates

    // Verify "Dossier Review" template
    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await expect(dossierTemplate).toBeVisible();
    await expect(dossierTemplate.locator('[data-testid="template-name-en"]')).toContainText(/dossier.*review/i);
    await expect(dossierTemplate.locator('[data-testid="template-name-ar"]')).toBeVisible();
    await expect(dossierTemplate.locator('[data-testid="template-description"]')).toBeVisible();

    // Verify "Ticket Processing" template
    const ticketTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /ticket.*processing/i }).first();
    await expect(ticketTemplate).toBeVisible();
  });

  test('should show template preview with item count', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // Select "Dossier Review" template
    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();

    // Verify preview section appears
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-title"]')).toContainText(/preview/i);

    // Verify items are listed
    const previewItems = page.locator('[data-testid="preview-item"]');
    await expect(previewItems).toHaveCountGreaterThan(0);

    // Verify item count is displayed
    const itemCount = await previewItems.count();
    await expect(page.locator('[data-testid="template-item-count"]')).toContainText(`${itemCount} items`);

    // Verify each preview item shows sequence number
    const firstItem = previewItems.first();
    await expect(firstItem.locator('[data-testid="item-sequence"]')).toContainText(/1/);
  });

  test('should import template and create all checklist items with sequence', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // Select and preview "Dossier Review" template
    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Get preview item count before import
    const previewItems = page.locator('[data-testid="preview-item"]');
    const expectedItemCount = await previewItems.count();

    // Click "Import" button
    await page.click('[data-testid="confirm-import-button"]');

    // Verify modal closes
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();

    // Verify success toast/notification
    await expect(page.locator('[data-testid="toast-message"]')).toContainText(/imported.*success/i);

    // Verify checklist items are created
    const checklistItems = page.locator('[data-testid="checklist-item"]');
    await expect(checklistItems).toHaveCount(expectedItemCount, { timeout: 3000 });

    // Verify items have correct sequence (1, 2, 3, ...)
    for (let i = 0; i < expectedItemCount; i++) {
      const item = checklistItems.nth(i);
      await expect(item.locator('[data-testid="item-sequence"]')).toContainText(`${i + 1}`);
    }

    // Verify all items are initially unchecked
    for (let i = 0; i < expectedItemCount; i++) {
      const checkbox = checklistItems.nth(i).locator('[data-testid="checklist-checkbox"]');
      await expect(checkbox).not.toBeChecked();
    }
  });

  test('should update progress to 0% after template import', async ({ page }) => {
    // Verify initial progress is 0% (no items)
    await expect(page.locator('[data-testid="checklist-progress"]')).toContainText(/0%/);

    // Import template
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();
    await page.click('[data-testid="confirm-import-button"]');

    // Wait for import to complete
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();

    // Verify progress still shows 0% (items imported but not completed)
    await expect(page.locator('[data-testid="checklist-progress"]')).toContainText(/0%/);

    // Verify progress bar is visible with 0% width
    const progressBar = page.locator('[data-testid="progress-bar-fill"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveCSS('width', '0%');
  });

  test('should show timeline event for checklist import', async ({ page }) => {
    // Get initial timeline event count
    const initialEvents = page.locator('[data-testid="timeline-event"]');
    const initialCount = await initialEvents.count();

    // Import template
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();
    await page.click('[data-testid="confirm-import-button"]');

    // Wait for modal to close
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();

    // Verify new timeline event
    await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount(initialCount + 1);

    // Verify event content mentions template import
    const latestEvent = page.locator('[data-testid="timeline-event"]').first();
    await expect(latestEvent).toContainText(/imported.*checklist.*template/i);
    await expect(latestEvent).toContainText(/dossier.*review/i);
  });

  test('should preserve template item text in both English and Arabic', async ({ page }) => {
    // Import template
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();

    // Get first preview item text
    const firstPreviewItem = page.locator('[data-testid="preview-item"]').first();
    const previewTextEn = await firstPreviewItem.locator('[data-testid="item-text-en"]').textContent();

    // Import
    await page.click('[data-testid="confirm-import-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();

    // Verify first checklist item has same text (English by default)
    const firstChecklistItem = page.locator('[data-testid="checklist-item"]').first();
    const checklistText = await firstChecklistItem.locator('[data-testid="item-text"]').textContent();
    expect(checklistText?.trim()).toBe(previewTextEn?.trim());

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-ar"]');

    // Wait for language change
    await page.waitForTimeout(500);

    // Verify item text changed to Arabic
    const checklistTextAr = await firstChecklistItem.locator('[data-testid="item-text"]').textContent();
    expect(checklistTextAr).not.toBe(previewTextEn); // Should be different (Arabic)
  });

  test('should handle import cancellation gracefully', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // Select template
    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Cancel instead of import
    await page.click('[data-testid="modal-close-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).not.toBeVisible();

    // Verify no items were added
    const checklistItems = page.locator('[data-testid="checklist-item"]');
    await expect(checklistItems).toHaveCount(0);

    // Verify no timeline event
    const timelineEvents = page.locator('[data-testid="timeline-event"]');
    const finalCount = await timelineEvents.count();
    await expect(timelineEvents.filter({ hasText: /imported/i })).toHaveCount(0);
  });

  test('should filter templates by applicable work type', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // For dossier work type, only applicable templates should be shown
    const allTemplates = page.locator('[data-testid="template-card"]');
    const templateCount = await allTemplates.count();

    // Verify at least "Dossier Review" template is visible
    await expect(page.locator('[data-testid="template-card"]').filter({ hasText: /dossier/i })).toHaveCountGreaterThan(0);

    // Verify templates show "Applicable to: Dossier" badge
    const firstTemplate = allTemplates.first();
    await expect(firstTemplate.locator('[data-testid="applicable-types"]')).toContainText(/dossier/i);
  });

  test('should disable import button if no template selected', async ({ page }) => {
    // Open template selector
    await page.click('[data-testid="import-template-button"]');
    await expect(page.locator('[data-testid="template-selector-modal"]')).toBeVisible();

    // Initially, no template selected
    const importButton = page.locator('[data-testid="confirm-import-button"]');
    await expect(importButton).toBeDisabled();

    // Select template
    const dossierTemplate = page.locator('[data-testid="template-card"]').filter({ hasText: /dossier.*review/i }).first();
    await dossierTemplate.click();

    // Import button should now be enabled
    await expect(importButton).toBeEnabled();
  });
});
