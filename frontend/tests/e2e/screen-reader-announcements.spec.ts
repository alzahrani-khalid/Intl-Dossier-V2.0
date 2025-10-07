import { test, expect } from '@playwright/test';

/**
 * E2E Test: T087 - Screen Reader Announcements
 *
 * Verifies that the assignment detail page provides proper ARIA live regions
 * and screen reader announcements for dynamic content updates.
 *
 * Tests:
 * - Timeline announced as feed with aria-live
 * - New comments announced via aria-live="polite"
 * - SLA countdown updates announced
 * - Checklist progress announced when items completed
 *
 * Related: FR-021c (WCAG 2.1 AA Compliance)
 */

test.describe('Screen Reader Announcements', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test staff user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/assignments');
  });

  test('timeline announced as feed with proper ARIA attributes', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Verify timeline has feed role
    const timeline = page.locator('[role="feed"]');
    await expect(timeline).toBeVisible();
    await expect(timeline).toHaveAttribute('aria-label');

    // Verify timeline has aria-live region
    const ariaLive = await timeline.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');

    // Verify timeline items have proper feed article structure
    const timelineItems = timeline.locator('article');
    const count = await timelineItems.count();
    expect(count).toBeGreaterThan(0);

    // Check first timeline item has proper attributes
    const firstItem = timelineItems.first();
    await expect(firstItem).toHaveAttribute('aria-posinset', '1');
    await expect(firstItem).toHaveAttribute('aria-setsize', count.toString());
    await expect(firstItem).toHaveAttribute('tabindex', '0');
  });

  test('new comments announced via aria-live region', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Find the comments live region
    const commentsSection = page.locator('[data-testid="comments-section"]');
    await expect(commentsSection).toBeVisible();

    // Verify live region exists
    const liveRegion = commentsSection.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();

    // Add a new comment
    const commentInput = page.locator('textarea[name="comment"]');
    await commentInput.fill('Test comment for screen reader announcement');
    await page.click('button:has-text("Post Comment")');

    // Wait for comment to appear
    await expect(page.locator('text=Test comment for screen reader announcement')).toBeVisible();

    // Verify the live region updated (screen readers will announce this)
    const comments = liveRegion.locator('[data-testid="comment-item"]');
    const commentCount = await comments.count();
    expect(commentCount).toBeGreaterThan(0);
  });

  test('SLA countdown has accessible status announcements', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Find SLA countdown component
    const slaCountdown = page.locator('[data-testid="sla-countdown"]');
    await expect(slaCountdown).toBeVisible();

    // Verify ARIA live region for SLA updates
    const slaStatus = slaCountdown.locator('[aria-live="polite"]');
    await expect(slaStatus).toBeVisible();

    // Verify accessible label
    await expect(slaCountdown).toHaveAttribute('aria-label');
    const ariaLabel = await slaCountdown.getAttribute('aria-label');
    expect(ariaLabel).toContain('SLA');

    // Verify role for status
    const statusRole = await slaStatus.getAttribute('role');
    expect(statusRole).toBe('status');
  });

  test('checklist progress announced when items completed', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Find checklist section
    const checklistSection = page.locator('[data-testid="checklist-section"]');
    await expect(checklistSection).toBeVisible();

    // Verify progress indicator has live region
    const progressIndicator = checklistSection.locator('[data-testid="checklist-progress"]');
    await expect(progressIndicator).toBeVisible();
    await expect(progressIndicator).toHaveAttribute('aria-live', 'polite');
    await expect(progressIndicator).toHaveAttribute('role', 'status');

    // Get initial progress
    const initialProgress = await progressIndicator.textContent();

    // Import a checklist template first
    await page.click('button:has-text("Import Checklist")');
    await page.click('text=Dossier Review');
    await page.waitForTimeout(1000);

    // Complete first checklist item
    const firstCheckbox = checklistSection.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await page.waitForTimeout(500);

    // Verify progress updated
    const updatedProgress = await progressIndicator.textContent();
    expect(updatedProgress).not.toBe(initialProgress);
    expect(updatedProgress).toContain('%');
  });

  test('form fields have proper labels and descriptions', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Verify comment textarea has label
    const commentTextarea = page.locator('textarea[name="comment"]');
    const textareaId = await commentTextarea.getAttribute('id');
    if (textareaId) {
      const label = page.locator(`label[for="${textareaId}"]`);
      await expect(label).toBeVisible();
    }

    // Verify comment textarea has aria-describedby for character count
    await expect(commentTextarea).toHaveAttribute('aria-describedby');

    // Verify escalate button has accessible name
    const escalateButton = page.locator('button:has-text("Escalate")');
    if (await escalateButton.isVisible()) {
      await expect(escalateButton).toHaveAttribute('aria-label');
    }

    // Verify complete button has accessible name
    const completeButton = page.locator('button:has-text("Mark Complete")');
    if (await completeButton.isVisible()) {
      await expect(completeButton).toHaveAttribute('aria-label');
    }
  });

  test('engagement context banner announced to screen readers', async ({ page }) => {
    // Navigate to engagement-linked assignment
    await page.goto('/assignments/test-engagement-assignment-001');
    await page.waitForLoadState('networkidle');

    // Find engagement context banner
    const contextBanner = page.locator('[data-testid="engagement-context-banner"]');

    // Only test if engagement context exists
    if (await contextBanner.isVisible()) {
      // Verify banner has region role
      await expect(contextBanner).toHaveAttribute('role', 'region');

      // Verify banner has aria-label
      await expect(contextBanner).toHaveAttribute('aria-label');

      // Verify progress bar has accessible label
      const progressBar = contextBanner.locator('[role="progressbar"]');
      if (await progressBar.isVisible()) {
        await expect(progressBar).toHaveAttribute('aria-label');
        await expect(progressBar).toHaveAttribute('aria-valuenow');
        await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      }
    }
  });

  test('observer actions announced when performed', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Escalate to create observer
    const escalateButton = page.locator('button:has-text("Escalate")');
    if (await escalateButton.isVisible()) {
      await escalateButton.click();

      // Fill escalation reason
      await page.fill('textarea[name="reason"]', 'Need supervisor review');
      await page.click('button:has-text("Confirm")');

      // Wait for escalation to complete
      await page.waitForTimeout(1000);

      // Verify observers section has accessible structure
      const observersSection = page.locator('[data-testid="observers-list"]');
      if (await observersSection.isVisible()) {
        await expect(observersSection).toHaveAttribute('role', 'list');

        // Verify observer items have list item role
        const observerItems = observersSection.locator('[role="listitem"]');
        const count = await observerItems.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('keyboard navigation focus indicators visible', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluateHandle(() => document.activeElement);

    // Verify focus indicator is visible (check computed styles)
    const hasFocusIndicator = await page.evaluate((el) => {
      const element = el as Element;
      const styles = window.getComputedStyle(element);
      const outlineWidth = styles.getPropertyValue('outline-width');
      const boxShadow = styles.getPropertyValue('box-shadow');
      return outlineWidth !== '0px' || boxShadow !== 'none';
    }, firstFocusedElement);

    expect(hasFocusIndicator).toBe(true);
  });

  test('modals have proper focus trap and announcements', async ({ page }) => {
    // Navigate to assignment detail
    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    // Open escalate modal
    const escalateButton = page.locator('button:has-text("Escalate")');
    if (await escalateButton.isVisible()) {
      await escalateButton.click();

      // Verify modal has dialog role
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Verify modal has aria-labelledby or aria-label
      const hasLabel = await dialog.evaluate((el) => {
        return el.hasAttribute('aria-labelledby') || el.hasAttribute('aria-label');
      });
      expect(hasLabel).toBe(true);

      // Verify modal has aria-modal
      await expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Test focus trap: first interactive element should be focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });
});
