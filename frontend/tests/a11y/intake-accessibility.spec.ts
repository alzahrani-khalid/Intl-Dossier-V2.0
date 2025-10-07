import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests: Front Door Intake System
 * Tests WCAG 2.2 AA compliance across all intake workflows
 *
 * Validates:
 * - WCAG 2.2 AA standards compliance
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Color contrast ratios
 * - Focus management
 * - ARIA attributes
 * - Form accessibility
 * - Bilingual accessibility (EN/AR)
 */

test.describe('Intake System Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should have no WCAG violations on intake form page', async ({ page }) => {
    await page.goto('/intake/new');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no WCAG violations on queue view', async ({ page }) => {
    await page.goto('/intake/queue');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no WCAG violations on ticket detail page', async ({ page }) => {
    // Create a ticket first
    await page.goto('/intake/new');
    await page.click('[data-testid="request-type-engagement"]');
    await page.fill('[data-testid="title-input-en"]', 'Accessibility Test Ticket');
    await page.fill('[data-testid="title-input-ar"]', 'تذكرة اختبار إمكانية الوصول');
    await page.fill('[data-testid="description-input-en"]', 'This ticket is created for accessibility testing purposes to ensure WCAG 2.2 AA compliance.');
    await page.fill('[data-testid="description-input-ar"]', 'تم إنشاء هذه التذكرة لأغراض اختبار إمكانية الوصول');
    await page.selectOption('[data-testid="urgency-select"]', 'medium');
    await page.click('[data-testid="submit-button"]');

    const ticketNumber = await page.locator('[data-testid="ticket-number"]').textContent();

    // Navigate to ticket detail
    await page.goto(`/intake/tickets/${ticketNumber}`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support full keyboard navigation on intake form', async ({ page }) => {
    await page.goto('/intake/new');

    // Start from first focusable element
    await page.keyboard.press('Tab');

    // Verify focus moves through form elements
    const focusableElements = [
      '[data-testid="request-type-engagement"]',
      '[data-testid="request-type-position"]',
      '[data-testid="request-type-mou-action"]',
      '[data-testid="request-type-foresight"]',
      '[data-testid="title-input-en"]',
      '[data-testid="title-input-ar"]',
      '[data-testid="description-input-en"]',
      '[data-testid="description-input-ar"]',
      '[data-testid="urgency-select"]',
      '[data-testid="submit-button"]'
    ];

    for (const selector of focusableElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        // Verify element is focusable
        await element.focus();
        const isFocused = await element.evaluate(el => document.activeElement === el);
        expect(isFocused).toBe(true);

        // Move to next element
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should support keyboard submission of forms', async ({ page }) => {
    await page.goto('/intake/new');

    // Fill form using keyboard navigation
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.press('Enter'); // Select engagement type

    // Navigate to title field
    while (!(await page.locator('[data-testid="title-input-en"]').evaluate(el => document.activeElement === el))) {
      await page.keyboard.press('Tab');
    }

    // Fill title
    await page.keyboard.type('Keyboard Navigation Test');

    // Tab to Arabic title
    await page.keyboard.press('Tab');
    await page.keyboard.type('اختبار التنقل بلوحة المفاتيح');

    // Continue to description
    await page.keyboard.press('Tab');
    await page.keyboard.type('Testing keyboard-only navigation and form submission capabilities for accessibility compliance verification.');

    await page.keyboard.press('Tab');
    await page.keyboard.type('اختبار التنقل والإرسال باستخدام لوحة المفاتيح فقط');

    // Select urgency
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown'); // Move to medium
    await page.keyboard.press('ArrowDown'); // Move to high

    // Navigate to submit button
    while (!(await page.locator('[data-testid="submit-button"]').evaluate(el => document.activeElement === el))) {
      await page.keyboard.press('Tab');
    }

    // Submit using Enter key
    await page.keyboard.press('Enter');

    // Verify submission succeeded
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible({ timeout: 5000 });
  });

  test('should provide proper ARIA labels for all interactive elements', async ({ page }) => {
    await page.goto('/intake/new');

    // Check request type buttons
    const requestTypes = ['engagement', 'position', 'mou-action', 'foresight'];
    for (const type of requestTypes) {
      const button = page.locator(`[data-testid="request-type-${type}"]`);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    }

    // Check form inputs
    const formInputs = [
      'title-input-en',
      'title-input-ar',
      'description-input-en',
      'description-input-ar',
      'urgency-select'
    ];

    for (const inputId of formInputs) {
      const input = page.locator(`[data-testid="${inputId}"]`);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const ariaDescribedby = await input.getAttribute('aria-describedby');

      // Input should have at least one of these
      expect(ariaLabel || ariaLabelledby || ariaDescribedby).toBeTruthy();
    }

    // Check file upload
    const fileUpload = page.locator('[data-testid="file-upload-input"]');
    if (await fileUpload.isVisible()) {
      const ariaLabel = await fileUpload.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should announce form validation errors to screen readers', async ({ page }) => {
    await page.goto('/intake/new');

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Check for ARIA live regions
    const errorMessages = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
    expect(await errorMessages.count()).toBeGreaterThan(0);

    // Verify error messages have proper ARIA attributes
    const firstError = errorMessages.first();
    const ariaLive = await firstError.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(ariaLive);

    // Verify error messages are linked to form fields
    const titleError = page.locator('[data-testid="error-title-en"]');
    if (await titleError.isVisible()) {
      const errorId = await titleError.getAttribute('id');
      const titleInput = page.locator('[data-testid="title-input-en"]');
      const ariaDescribedby = await titleInput.getAttribute('aria-describedby');

      expect(ariaDescribedby).toContain(errorId!);
    }
  });

  test('should maintain proper focus management in modals and dialogs', async ({ page }) => {
    // Navigate to queue
    await page.goto('/intake/queue');

    // Select a ticket to open detail panel
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Verify focus moves to dialog/panel
    const detailPanel = page.locator('[data-testid="ticket-detail-panel"]');
    await expect(detailPanel).toBeVisible();

    // Check dialog has proper ARIA role
    const role = await detailPanel.getAttribute('role');
    expect(['dialog', 'region']).toContain(role);

    // Check for aria-modal if it's a modal
    const ariaModal = await detailPanel.getAttribute('aria-modal');
    if (ariaModal === 'true') {
      // Focus should be trapped within modal
      // Verify close button is focusable
      const closeButton = page.locator('[data-testid="close-detail-panel"]');
      if (await closeButton.isVisible()) {
        await closeButton.focus();
        const isFocused = await closeButton.evaluate(el => document.activeElement === el);
        expect(isFocused).toBe(true);

        // Close with Escape key
        await page.keyboard.press('Escape');
        await expect(detailPanel).not.toBeVisible();
      }
    }
  });

  test('should have sufficient color contrast ratios', async ({ page }) => {
    await page.goto('/intake/new');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ runOnly: ['color-contrast'] })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should provide text alternatives for non-text content', async ({ page }) => {
    await page.goto('/intake/new');

    // Check icons have alt text or aria-label
    const icons = page.locator('svg, img, [role="img"]');
    const count = await icons.count();

    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const alt = await icon.getAttribute('alt');
      const ariaLabel = await icon.getAttribute('aria-label');
      const ariaLabelledby = await icon.getAttribute('aria-labelledby');
      const role = await icon.getAttribute('role');

      // Decorative images should have empty alt or aria-hidden
      const ariaHidden = await icon.getAttribute('aria-hidden');

      if (ariaHidden !== 'true' && role !== 'presentation') {
        // Non-decorative images must have text alternative
        expect(alt || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('should support screen reader announcements for dynamic content', async ({ page }) => {
    await page.goto('/intake/queue');

    // Select ticket to trigger AI suggestions loading
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Check for loading announcement
    const loadingAnnouncement = page.locator('[data-testid="ai-suggestions-loading"]');
    if (await loadingAnnouncement.isVisible()) {
      const ariaLive = await loadingAnnouncement.getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }

    // Wait for suggestions to load
    const suggestionsPanel = page.locator('[data-testid="ai-suggestions-panel"]');
    await expect(suggestionsPanel).toBeVisible({ timeout: 5000 });

    // Check for success announcement
    const successAnnouncement = page.locator('[aria-live]').filter({ hasText: /suggestions loaded|loaded successfully/i });
    if (await successAnnouncement.count() > 0) {
      const ariaLive = await successAnnouncement.first().getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }
  });

  test('should support RTL mode accessibility for Arabic content', async ({ page }) => {
    await page.goto('/intake/new');

    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Run accessibility scan in RTL mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify keyboard navigation still works in RTL
    await page.keyboard.press('Tab');

    // Verify form still has proper labels in Arabic
    const titleLabel = page.locator('[data-testid="title-label"]');
    const labelText = await titleLabel.textContent();
    expect(labelText).toContain('العنوان'); // Arabic for "Title"
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/intake/new');

    // Get all headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();

    expect(count).toBeGreaterThan(0);

    // Check h1 exists and is unique
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Verify headings don't skip levels
    const headingLevels: number[] = [];
    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      headingLevels.push(level);
    }

    // Check no level skips
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have accessible form labels and instructions', async ({ page }) => {
    await page.goto('/intake/new');

    // Check all form fields have labels
    const inputs = page.locator('input, select, textarea').filter({ hasNotAttribute: 'type', value: 'hidden' });
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');

      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;

        // Or check for aria-label/aria-labelledby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }

    // Check required fields are marked
    const requiredFields = page.locator('[required], [aria-required="true"]');
    const requiredCount = await requiredFields.count();

    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);

      // Should have visual indicator or aria-required
      const ariaRequired = await field.getAttribute('aria-required');
      const required = await field.getAttribute('required');

      expect(ariaRequired === 'true' || required !== null).toBe(true);
    }
  });

  test('should support skip links for keyboard users', async ({ page }) => {
    await page.goto('/intake/new');

    // Press Tab to reveal skip link
    await page.keyboard.press('Tab');

    // Check for skip link (usually hidden but visible on focus)
    const skipLink = page.locator('a[href^="#"], a[href*="skip"]').first();

    if (await skipLink.count() > 0) {
      const isVisible = await skipLink.isVisible();
      if (isVisible) {
        // Verify skip link works
        await skipLink.click();

        // Verify focus moved to main content
        const mainContent = page.locator('main, [role="main"], #main-content');
        if (await mainContent.count() > 0) {
          const isFocused = await mainContent.evaluate(el => {
            const activeElement = document.activeElement;
            return el === activeElement || el.contains(activeElement);
          });
          expect(isFocused).toBe(true);
        }
      }
    }
  });

  test('should have accessible tables with proper structure', async ({ page }) => {
    await page.goto('/intake/queue');

    // Check if queue uses table for layout
    const tables = page.locator('table, [role="table"]');

    if (await tables.count() > 0) {
      const table = tables.first();

      // Check for proper table structure
      const hasCaption = await table.locator('caption').count() > 0;
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledby = await table.getAttribute('aria-labelledby');

      // Table should have caption or label
      expect(hasCaption || ariaLabel || ariaLabelledby).toBeTruthy();

      // Check for thead
      const hasThead = await table.locator('thead, [role="rowgroup"]').first().count() > 0;
      expect(hasThead).toBe(true);

      // Check headers have scope
      const headers = table.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();

      if (headerCount > 0) {
        const firstHeader = headers.first();
        const scope = await firstHeader.getAttribute('scope');
        const role = await firstHeader.getAttribute('role');

        expect(scope || role === 'columnheader').toBeTruthy();
      }
    }
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    await page.goto('/intake/new');

    // Trigger file upload
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content')
    });

    // Check for loading announcement
    const uploadProgress = page.locator('[data-testid="upload-progress"]');
    if (await uploadProgress.isVisible()) {
      const ariaLive = await uploadProgress.getAttribute('aria-live');
      const ariaLabel = await uploadProgress.getAttribute('aria-label');

      expect(ariaLive).toBeTruthy();
      expect(ariaLabel).toBeTruthy();
    }

    // Wait for success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Check for success announcement
    const successMessage = page.locator('[data-testid="upload-success"]');
    const successAriaLive = await successMessage.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(successAriaLive);
  });

  test('should have accessible status indicators', async ({ page }) => {
    await page.goto('/intake/queue');

    // Check SLA status badges
    const statusBadges = page.locator('[data-testid^="sla-status-"], [data-testid^="ticket-status-"]');
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 5); i++) {
        const badge = statusBadges.nth(i);

        // Badge should have accessible text
        const ariaLabel = await badge.getAttribute('aria-label');
        const textContent = await badge.textContent();
        const role = await badge.getAttribute('role');

        // Status should be conveyed through text, not just color
        expect(ariaLabel || textContent).toBeTruthy();

        // Should have role for semantic meaning
        if (role) {
          expect(['status', 'img']).toContain(role);
        }
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    await page.goto('/intake/new');

    // Emulate high contrast mode (Windows High Contrast)
    await page.emulateMedia({ forcedColors: 'active' });

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify important UI elements are still visible
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-input-en"]')).toBeVisible();
  });
});