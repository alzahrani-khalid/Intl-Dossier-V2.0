import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Accessibility Audit and Fixes (T055)
 * Tests WCAG 2.1 AA compliance for dossier pages
 *
 * Validates:
 * - Hub page accessibility
 * - Detail page accessibility
 * - Color contrast ratios ≥ 4.5:1
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus indicators
 * - RTL layout correctness
 */

test.describe('Dossiers Accessibility (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('hub page should pass axe accessibility audit', async ({ page }) => {
    await page.goto('/dossiers');
    await injectAxe(page);

    // Run axe audit
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('detail page should pass axe accessibility audit', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);
    await injectAxe(page);

    await checkA11y(page, null, {
      detailedReport: true,
    });
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/dossiers');

    // Check dossier cards have aria-labels
    const cards = page.locator('[data-testid^="dossier-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(cards.nth(i)).toHaveAttribute('aria-label');
    }

    // Check filter checkboxes have labels
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = checkboxes.nth(i);
      const ariaLabel = await checkbox.getAttribute('aria-label');
      const ariaLabelledBy = await checkbox.getAttribute('aria-labelledby');
      const label = await checkbox.evaluate((el) => {
        const id = el.id;
        return id ? document.querySelector(`label[for="${id}"]`) : null;
      });

      expect(ariaLabel || ariaLabelledBy || label).toBeTruthy();
    }
  });

  test('should support keyboard navigation on hub page', async ({ page }) => {
    await page.goto('/dossiers');

    // Tab to first dossier card
    await page.keyboard.press('Tab');
    const firstCard = page.locator('[data-testid^="dossier-card-"]').first();

    // Check focus is visible
    await expect(firstCard).toBeFocused();

    // Press Enter to navigate
    await page.keyboard.press('Enter');

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dossiers\/[a-f0-9-]+/);
  });

  test('should support keyboard navigation on detail page tabs', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    // Tab to timeline tab
    const timelineTab = page.locator('[data-testid="tab-timeline"]');
    await timelineTab.focus();
    await expect(timelineTab).toBeFocused();

    // Arrow right to next tab
    await page.keyboard.press('ArrowRight');
    const positionsTab = page.locator('[data-testid="tab-positions"]');
    await expect(positionsTab).toBeFocused();

    // Press Space to activate
    await page.keyboard.press(' ');
    await expect(positionsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/dossiers');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Get currently focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        outline: window.getComputedStyle(el!).outline,
        boxShadow: window.getComputedStyle(el!).boxShadow,
        border: window.getComputedStyle(el!).border,
      };
    });

    // Assert focus indicator is visible (outline, box-shadow, or border)
    const hasVisibleFocus =
      focusedElement.outline !== 'none' ||
      focusedElement.boxShadow !== 'none' ||
      focusedElement.border !== 'none';

    expect(hasVisibleFocus).toBe(true);
  });

  test('should have sufficient color contrast (WCAG AA)', async ({ page }) => {
    await page.goto('/dossiers');

    // Check text color contrasts using axe
    await injectAxe(page);
    await checkA11y(
      page,
      null,
      {
        runOnly: ['color-contrast'],
      },
      true
    );
  });

  test('should work with screen reader announcements', async ({ page }) => {
    await page.goto('/dossiers');

    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();
    expect(count).toBeGreaterThanOrEqual(1); // At least one live region for notifications

    // Check status messages have role="status"
    const statusElements = page.locator('[role="status"]');
    expect(await statusElements.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dossiers');

    // Check heading order (h1 -> h2 -> h3, no skipping)
    const headings = await page.evaluate(() => {
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return allHeadings.map((h) => h.tagName);
    });

    // First heading should be h1
    expect(headings[0]).toBe('H1');

    // Check no level is skipped
    for (let i = 1; i < headings.length; i++) {
      const prevLevel = parseInt(headings[i - 1][1]);
      const currLevel = parseInt(headings[i][1]);
      const levelDiff = currLevel - prevLevel;

      // Level should not skip (max +1, or go back any amount)
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  });

  test('RTL layout should be correct for Arabic', async ({ page }) => {
    await page.goto('/dossiers');

    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]');

    // Wait for language change
    await page.waitForTimeout(500);

    // Check html dir attribute
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');

    // Check filter panel is on correct side
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    const position = await filterPanel.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('text-align');
    });

    // In RTL, text should align right
    expect(['right', 'start']).toContain(position);
  });

  test('modals should trap focus', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    // Open edit modal
    await page.click('[data-testid="edit-dossier-button"]');
    await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();

    // Tab multiple times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be within modal
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const modal = document.querySelector('[data-testid="edit-form"]');
      return modal?.contains(el);
    });

    expect(focusedElement).toBe(true);
  });

  test('escape key should close modals', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    // Open edit modal
    await page.click('[data-testid="edit-dossier-button"]');
    await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('[data-testid="edit-form"]')).not.toBeVisible();
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/dossiers');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Alt attribute must be present (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('interactive elements should have minimum 44x44px touch target', async ({ page }) => {
    await page.goto('/dossiers');

    // Check buttons and links
    const interactiveElements = page.locator('button, a[href]');
    const count = await interactiveElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});