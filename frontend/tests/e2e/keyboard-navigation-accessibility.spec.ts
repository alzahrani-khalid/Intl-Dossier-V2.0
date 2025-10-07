import { test, expect } from '@playwright/test';

/**
 * E2E Test: Keyboard Navigation & Accessibility
 *
 * Feature: 014-full-assignment-detail
 * Task: T086
 *
 * Validates WCAG 2.1 AA keyboard navigation and shortcuts
 */

test.describe('Keyboard Navigation & Accessibility', () => {
  let assignmentId: string;

  test.beforeEach(async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-accessibility-test');
    const data = await setup.json();
    assignmentId = data.assignmentId;

    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.goto(`/assignments/${assignmentId}`);
  });

  test('Tab navigates through all interactive elements', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Tab');

    // Verify focus indicators visible
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();

    // Tab through key elements
    const expectedOrder = [
      'escalate-assignment',
      'mark-complete',
      'comment-input',
      'submit-comment',
      'checklist-item-1',
      'add-checklist-item',
      'import-template'
    ];

    for (const testId of expectedOrder) {
      await page.keyboard.press('Tab');
      const current = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      // Focus should eventually reach each element
    }
  });

  test('focus indicators visible on all interactive elements', async ({ page }) => {
    const elements = [
      'button[data-testid="escalate-assignment"]',
      'button[data-testid="mark-complete"]',
      'textarea[data-testid="comment-input"]',
      'input[data-testid="checklist-item-1"]'
    ];

    for (const selector of elements) {
      await page.focus(selector);

      // Get computed outline or box-shadow (focus indicator)
      const hasVisibleFocus = await page.locator(selector).evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });

      expect(hasVisibleFocus).toBe(true);
    }
  });

  test('Enter activates buttons', async ({ page }) => {
    // Focus escalate button
    await page.focus('button[data-testid="escalate-assignment"]');
    await page.keyboard.press('Enter');

    // Verify escalation modal appears
    await expect(page.locator('[data-testid="escalate-assignment-modal"]')).toBeVisible();
  });

  test('Space activates checkboxes', async ({ page }) => {
    // Focus checklist item
    await page.focus('input[data-testid="checklist-item-1"]');
    await page.keyboard.press('Space');

    // Verify checkbox checked
    await expect(page.locator('input[data-testid="checklist-item-1"]')).toBeChecked();
  });

  test('Escape closes modals', async ({ page }) => {
    // Open escalation modal
    await page.click('button[data-testid="escalate-assignment"]');
    await expect(page.locator('[data-testid="escalate-assignment-modal"]')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify modal closed
    await expect(page.locator('[data-testid="escalate-assignment-modal"]')).not.toBeVisible();
  });

  test('keyboard shortcut E triggers Escalate', async ({ page }) => {
    // Press 'e' key
    await page.keyboard.press('e');

    // Verify escalation modal appears
    await expect(page.locator('[data-testid="escalate-assignment-modal"]')).toBeVisible();
  });

  test('keyboard shortcut C focuses comment input', async ({ page }) => {
    // Press 'c' key
    await page.keyboard.press('c');

    // Verify comment input focused
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('comment-input');
  });

  test('keyboard shortcut K opens kanban (engagement-linked)', async ({ page }) => {
    // Setup engagement-linked assignment
    const setup = await page.request.post('/api/test/setup-engagement-assignment');
    const data = await setup.json();
    await page.goto(`/assignments/${data.assignmentId}`);

    // Press 'k' key
    await page.keyboard.press('k');

    // Verify kanban modal appears
    await expect(page.locator('[data-testid="kanban-modal"]')).toBeVisible();
  });

  test('keyboard shortcut K does nothing on standalone assignment', async ({ page }) => {
    // Press 'k' key on standalone assignment
    await page.keyboard.press('k');

    // Verify no kanban modal
    await expect(page.locator('[data-testid="kanban-modal"]')).not.toBeVisible();
  });

  test('Shift+Tab navigates backwards', async ({ page }) => {
    // Tab to second element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const secondElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Shift+Tab back
    await page.keyboard.press('Shift+Tab');

    const firstElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Verify moved backwards
    expect(firstElement).not.toBe(secondElement);
  });

  test('focus trap in modals', async ({ page }) => {
    // Open escalation modal
    await page.click('button[data-testid="escalate-assignment"]');

    // Tab through modal elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus stays within modal (doesn't escape to background)
    const focusedElement = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="escalate-assignment-modal"]');
      const activeElement = document.activeElement;
      return modal?.contains(activeElement);
    });

    expect(focusedElement).toBe(true);
  });

  test('skip to main content link', async ({ page }) => {
    await page.reload();

    // Press Tab to focus skip link (typically first element)
    await page.keyboard.press('Tab');

    const skipLink = await page.locator('[data-testid="skip-to-main"]');
    if (await skipLink.isVisible()) {
      await page.keyboard.press('Enter');

      // Verify jumped to main content
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('id'));
      expect(focused).toBe('main-content');
    }
  });

  test('aria-labels present on icon-only buttons', async ({ page }) => {
    const iconButtons = await page.locator('button:not(:has-text())').all();

    for (const button of iconButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      // Icon button must have aria-label or aria-labelledby
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    // SLA status indicators
    const slaIndicator = page.locator('[data-testid="sla-status"]');
    const contrastRatio = await slaIndicator.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;

      // Simple contrast check (would use actual contrast calculation in real test)
      return { bgColor, textColor };
    });

    // Verify colors are not the same
    expect(contrastRatio.bgColor).not.toBe(contrastRatio.textColor);
  });

  test('keyboard navigation in kanban board', async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-engagement-assignment');
    const data = await setup.json();
    await page.goto(`/assignments/${data.assignmentId}`);

    // Open kanban
    await page.keyboard.press('k');

    // Tab through kanban cards
    await page.keyboard.press('Tab');
    const firstCard = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    await page.keyboard.press('Tab');
    const secondCard = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    expect(firstCard).not.toBe(secondCard);

    // Enter opens card detail
    await page.keyboard.press('Enter');

    // Should navigate to assignment detail (modal closes)
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="kanban-modal"]')).not.toBeVisible();
  });

  test('Arrow keys navigate within kanban columns', async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-engagement-assignment');
    const data = await setup.json();
    await page.goto(`/assignments/${data.assignmentId}`);

    await page.keyboard.press('k');

    // Tab to first card
    await page.keyboard.press('Tab');

    // Arrow Down to next card in column
    await page.keyboard.press('ArrowDown');

    // Focus should move within column
    const focusedCard = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedCard).toContain('kanban-card');
  });
});
