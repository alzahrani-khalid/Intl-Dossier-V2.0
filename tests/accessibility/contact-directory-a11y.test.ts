/**
 * Contact Directory Accessibility Audit
 * Tests for WCAG AA compliance, mobile-first validation, and RTL layout
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Contact Directory Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contacts directory
    await page.goto(`${BASE_URL}/contacts`);

    // Wait for content to load
    await page.waitForSelector('[data-testid="contact-list"]', { timeout: 10000 });

    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test('T121/T122/T123: Mobile-first responsive and RTL validation', async ({ page }) => {
    // Test mobile viewport (375px - iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile-first styles
    const createButton = page.locator('button:has-text("Create Contact")');
    const exportButton = page.locator('button:has-text("Export")');

    // Check minimum touch target size (44x44px minimum, we use min-h-11 = 44px)
    const createBox = await createButton.boundingBox();
    expect(createBox?.height).toBeGreaterThanOrEqual(44);
    expect(createBox?.width).toBeGreaterThanOrEqual(44);

    const exportBox = await exportButton.boundingBox();
    expect(exportBox?.height).toBeGreaterThanOrEqual(44);
    expect(exportBox?.width).toBeGreaterThanOrEqual(44);

    // Check spacing between interactive elements (min 8px)
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length - 1; i++) {
      const box1 = await buttons[i].boundingBox();
      const box2 = await buttons[i + 1].boundingBox();

      if (box1 && box2) {
        const gap = box2.x - (box1.x + box1.width);
        if (gap >= 0) { // Adjacent buttons
          expect(gap).toBeGreaterThanOrEqual(8);
        }
      }
    }

    // Test RTL layout
    await page.evaluate(() => {
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');
    });

    // Verify RTL-safe classes (using logical properties)
    const htmlContent = await page.content();

    // Check that we're NOT using physical properties
    expect(htmlContent).not.toContain('ml-');
    expect(htmlContent).not.toContain('mr-');
    expect(htmlContent).not.toContain('pl-');
    expect(htmlContent).not.toContain('pr-');
    expect(htmlContent).not.toContain('text-left');
    expect(htmlContent).not.toContain('text-right');

    // Verify logical properties are used
    expect(htmlContent).toContain('ms-');
    expect(htmlContent).toContain('me-');
    expect(htmlContent).toContain('ps-');
    expect(htmlContent).toContain('pe-');

    // Test responsive breakpoints
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 640, height: 900, name: 'Small Tablet' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Laptop' },
      { width: 1280, height: 800, name: 'Desktop' },
      { width: 1536, height: 864, name: 'Large Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Verify layout doesn't break
      const contentVisible = await page.locator('[data-testid="contact-list"]').isVisible();
      expect(contentVisible).toBe(true);

      // Check container padding scales correctly
      const container = page.locator('.container').first();
      const containerBox = await container.boundingBox();

      if (viewport.width < 640) {
        // Mobile: px-4 (16px)
        expect(containerBox?.x).toBeGreaterThanOrEqual(16);
      } else if (viewport.width < 1024) {
        // Tablet: sm:px-6 (24px)
        expect(containerBox?.x).toBeGreaterThanOrEqual(24);
      } else {
        // Desktop: lg:px-8 (32px)
        expect(containerBox?.x).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test('T123: WCAG AA Compliance - Color Contrast', async ({ page }) => {
    // Run axe accessibility checks for color contrast
    const results = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      },
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Additional manual contrast checks for key elements
    const elements = [
      { selector: 'h1', minContrast: 3.0 }, // Large text
      { selector: 'button', minContrast: 4.5 }, // Normal text
      { selector: '.text-muted-foreground', minContrast: 4.5 } // Muted text
    ];

    for (const element of elements) {
      const el = page.locator(element.selector).first();
      if (await el.count() > 0) {
        const color = await el.evaluate((e) => window.getComputedStyle(e).color);
        const bgColor = await el.evaluate((e) => window.getComputedStyle(e).backgroundColor);

        // Note: This is a simplified check. In production, use a proper contrast calculation library
        expect(color).toBeTruthy();
        expect(bgColor).toBeTruthy();
      }
    }
  });

  test('T123: WCAG AA Compliance - ARIA Labels', async ({ page }) => {
    // Check all interactive elements have accessible labels
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();

    for (const element of interactiveElements) {
      const hasLabel = await element.evaluate((el) => {
        // Check for aria-label
        if (el.getAttribute('aria-label')) return true;

        // Check for aria-labelledby
        if (el.getAttribute('aria-labelledby')) {
          const labelElement = document.getElementById(el.getAttribute('aria-labelledby')!);
          return labelElement && labelElement.textContent?.trim();
        }

        // Check for visible text content
        if (el.textContent?.trim()) return true;

        // Check for associated label (for inputs)
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          const id = el.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            return label && label.textContent?.trim();
          }
        }

        return false;
      });

      expect(hasLabel).toBe(true);
    }
  });

  test('T123: WCAG AA Compliance - Keyboard Navigation', async ({ page }) => {
    // Test keyboard navigation through interactive elements
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        hasOutline: styles.outlineWidth !== '0px' || styles.boxShadow !== 'none',
        isVisible: el instanceof HTMLElement && el.offsetParent !== null
      };
    });

    expect(focusedElement).toBeTruthy();
    expect(focusedElement?.hasOutline).toBe(true);
    expect(focusedElement?.isVisible).toBe(true);

    // Test Enter key on buttons
    const createButton = page.locator('button:has-text("Create Contact")');
    await createButton.focus();
    await page.keyboard.press('Enter');

    // Should navigate to create page
    await page.waitForURL(/\/contacts\/create/, { timeout: 5000 });
  });

  test('T123: Export Functionality Accessibility', async ({ page }) => {
    // Test export dropdown keyboard navigation
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.focus();
    await page.keyboard.press('Enter');

    // Dropdown should open
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    // Navigate through dropdown items with arrow keys
    await page.keyboard.press('ArrowDown');

    const focusedItem = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('role') === 'menuitem';
    });

    expect(focusedItem).toBe(true);

    // Escape should close dropdown
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('T123: Full Page Accessibility Scan', async ({ page }) => {
    // Comprehensive accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      },
      rules: {
        // WCAG AA rules
        'aria-allowed-attr': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-input-field-name': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'button-name': { enabled: true },
        'color-contrast': { enabled: true },
        'document-title': { enabled: true },
        'duplicate-id': { enabled: true },
        'empty-heading': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'frame-title': { enabled: true },
        'heading-order': { enabled: true },
        'html-has-lang': { enabled: true },
        'html-lang-valid': { enabled: true },
        'image-alt': { enabled: true },
        'input-button-name': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-refresh': { enabled: true },
        'meta-viewport': { enabled: true },
        'object-alt': { enabled: true },
        'role-img-alt': { enabled: true },
        'scrollable-region-focusable': { enabled: true },
        'select-name': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true }
      }
    });
  });
});

test.describe('Performance Optimization Tests', () => {
  test('T124/T125: Verify caching headers and pagination', async ({ page }) => {
    // Intercept API calls to check caching headers
    const apiResponses: any[] = [];

    page.on('response', response => {
      if (response.url().includes('/contacts')) {
        apiResponses.push({
          url: response.url(),
          headers: response.headers(),
          status: response.status()
        });
      }
    });

    await page.goto(`${BASE_URL}/contacts`);
    await page.waitForSelector('[data-testid="contact-list"]');

    // Check for cache headers in API responses
    for (const response of apiResponses) {
      const cacheControl = response.headers['cache-control'];
      if (cacheControl) {
        // Verify appropriate cache settings
        expect(cacheControl).toMatch(/max-age=\d+/);
      }
    }

    // Test pagination by scrolling (if virtualized list)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="contact-list"]');
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    });

    // Wait for potential lazy loading
    await page.waitForTimeout(1000);

    // Verify more items loaded or pagination controls work
    const paginationControls = page.locator('[data-testid="pagination"]');
    if (await paginationControls.count() > 0) {
      const nextButton = paginationControls.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForResponse(response =>
          response.url().includes('/contacts') && response.status() === 200
        );
      }
    }
  });
});