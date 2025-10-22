/**
 * Visual Regression Tests for Waiting Queue Components
 * Tests mobile/desktop layouts and RTL/LTR rendering
 *
 * Task: T092 - Add visual regression tests for mobile/desktop layouts
 *
 * Coverage:
 * - Mobile (375px), Tablet (768px), Desktop (1280px) breakpoints
 * - RTL (Arabic) and LTR (English) layouts
 * - Light and Dark themes (if applicable)
 * - Component states (loading, error, empty, populated)
 */

import { test, expect, Page } from '@playwright/test';

// Test viewports
const viewports = {
  mobile: { width: 375, height: 667 },    // iPhone SE
  tablet: { width: 768, height: 1024 },   // iPad Mini
  desktop: { width: 1280, height: 720 },  // Standard desktop
  wide: { width: 1920, height: 1080 },    // Full HD
};

// Helper function to setup test user and navigate to waiting queue
async function setupAndNavigate(page: Page, locale: 'en' | 'ar' = 'en') {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
  await page.fill('[name="password"]', 'itisme');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForURL('**/after-actions', { timeout: 10000 });

  // Change language if needed
  if (locale === 'ar') {
    const languageToggle = page.locator('[aria-label*="language"], [aria-label*="اللغة"]');
    if (await languageToggle.isVisible()) {
      await languageToggle.click();
      await page.waitForTimeout(500); // Wait for language change
    }
  }

  // Navigate to waiting queue
  await page.goto('/waiting-queue');
  await page.waitForLoadState('networkidle');
}

test.describe('Visual Regression: Waiting Queue - Mobile Layouts (LTR)', () => {
  test.use({ viewport: viewports.mobile });

  test('T092-01: Waiting queue list view - mobile LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for content to load
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-ltr-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('T092-02: Assignment details modal - mobile LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list to load
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Click first "View" button
    const viewButton = page.locator('button:has-text("View")').first();
    await viewButton.click();

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-ltr-assignment-modal.png', {
      animations: 'disabled',
    });
  });

  test('T092-03: Filter panel (bottom sheet) - mobile LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Open filter panel (should be bottom sheet on mobile)
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")').first();
    await filterButton.click();

    // Wait for sheet to open
    await page.waitForSelector('[data-testid="filter-panel"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-ltr-filter-sheet.png', {
      animations: 'disabled',
    });
  });

  test('T092-04: Bulk action toolbar - mobile LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Select first 3 items
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < 3 && i < await checkboxes.count(); i++) {
      await checkboxes.nth(i).check();
    }

    // Wait for bulk toolbar to appear
    await page.waitForSelector('[data-testid="bulk-action-toolbar"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-ltr-bulk-toolbar.png', {
      animations: 'disabled',
    });
  });

  test('T092-05: Escalation dialog - mobile LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Click "Escalate" button (may be in dropdown menu)
    const escalateButton = page.locator('button:has-text("Escalate")').first();
    if (await escalateButton.isVisible()) {
      await escalateButton.click();
    } else {
      // Try opening action menu first
      const moreButton = page.locator('button[aria-label="More actions"]').first();
      await moreButton.click();
      await page.locator('button:has-text("Escalate")').click();
    }

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-ltr-escalation-dialog.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Waiting Queue - Mobile Layouts (RTL)', () => {
  test.use({ viewport: viewports.mobile });

  test('T092-06: Waiting queue list view - mobile RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for content to load
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Verify RTL direction
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-rtl-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('T092-07: Assignment details modal - mobile RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Click first view button
    const viewButton = page.locator('button').filter({ hasText: /عرض|View/ }).first();
    await viewButton.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-rtl-assignment-modal.png', {
      animations: 'disabled',
    });
  });

  test('T092-08: Filter panel (bottom sheet) - mobile RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Open filter panel
    const filterButton = page.locator('button').filter({ hasText: /فلتر|Filter/ }).first();
    await filterButton.click();

    // Wait for sheet
    await page.waitForSelector('[data-testid="filter-panel"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-rtl-filter-sheet.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Waiting Queue - Desktop Layouts (LTR)', () => {
  test.use({ viewport: viewports.desktop });

  test('T092-09: Waiting queue list view - desktop LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for content
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('T092-10: Filter sidebar - desktop LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // On desktop, filter panel should be sidebar (visible by default or togglable)
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    if (!(await filterPanel.isVisible())) {
      const filterButton = page.locator('button:has-text("Filter")').first();
      await filterButton.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-filter-sidebar.png', {
      animations: 'disabled',
    });
  });

  test('T092-11: Assignment details modal - desktop LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Click first view button
    const viewButton = page.locator('button:has-text("View")').first();
    await viewButton.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-assignment-modal.png', {
      animations: 'disabled',
    });
  });

  test('T092-12: Bulk actions with multiple selections - desktop LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Select first 5 items
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < 5 && i < await checkboxes.count(); i++) {
      await checkboxes.nth(i).check();
    }

    // Wait for bulk toolbar
    await page.waitForSelector('[data-testid="bulk-action-toolbar"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-bulk-selections.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Waiting Queue - Desktop Layouts (RTL)', () => {
  test.use({ viewport: viewports.desktop });

  test('T092-13: Waiting queue list view - desktop RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for content
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Verify RTL
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-rtl-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('T092-14: Filter sidebar - desktop RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for list
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Open filter panel if not visible
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    if (!(await filterPanel.isVisible())) {
      const filterButton = page.locator('button').filter({ hasText: /فلتر|Filter/ }).first();
      await filterButton.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-rtl-filter-sidebar.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Waiting Queue - Tablet Layouts', () => {
  test.use({ viewport: viewports.tablet });

  test('T092-15: Waiting queue list view - tablet LTR', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for content
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('tablet-ltr-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('T092-16: Waiting queue list view - tablet RTL', async ({ page }) => {
    await setupAndNavigate(page, 'ar');

    // Wait for content
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('tablet-rtl-queue-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Component States', () => {
  test.use({ viewport: viewports.desktop });

  test('T092-17: Loading state', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/waiting-queue-filters/assignments*', async route => {
      await page.waitForTimeout(3000);
      await route.continue();
    });

    await setupAndNavigate(page, 'en');

    // Take screenshot during loading
    await expect(page).toHaveScreenshot('desktop-ltr-loading-state.png', {
      animations: 'disabled',
    });
  });

  test('T092-18: Empty state', async ({ page }) => {
    // Mock empty response
    await page.route('**/waiting-queue-filters/assignments*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1 }),
      });
    });

    await setupAndNavigate(page, 'en');

    // Wait for empty state
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-empty-state.png', {
      animations: 'disabled',
    });
  });

  test('T092-19: Error state', async ({ page }) => {
    // Mock error response
    await page.route('**/waiting-queue-filters/assignments*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await setupAndNavigate(page, 'en');

    // Wait for error state
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('desktop-ltr-error-state.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression: Touch Targets (Mobile)', () => {
  test.use({ viewport: viewports.mobile });

  test('T092-20: Verify touch target sizes meet 44x44px minimum', async ({ page }) => {
    await setupAndNavigate(page, 'en');

    // Wait for content
    await page.waitForSelector('[data-testid="waiting-queue-list"]', { timeout: 10000 });

    // Get all buttons
    const buttons = page.locator('button');
    const count = await buttons.count();

    // Check first few buttons (sample)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Verify minimum dimensions (WCAG 2.1 requirement)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Take screenshot highlighting interactive elements
    await expect(page).toHaveScreenshot('mobile-ltr-touch-targets.png', {
      animations: 'disabled',
    });
  });
});
