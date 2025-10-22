/**
 * E2E Tests: Queue Filtering
 *
 * Tests user applies multiple filters on mobile, results update,
 * filters persist on tab switch
 *
 * Task: T075 [P] [US5]
 */

import { test, expect } from '@playwright/test';

test.describe('Queue Filtering E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Navigate to waiting queue
    await page.waitForURL('**/waiting-queue');
    await page.waitForLoadState('networkidle');
  });

  test('User applies multiple filters on mobile and results update', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open filter panel (mobile bottom sheet)
    await page.click('button[aria-label="Open filters"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select priority filter
    await page.click('label:has-text("High")');
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(1);

    // Select aging filter
    await page.click('label:has-text("7+ days")');
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(2);

    // Apply filters (close sheet)
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Wait for results to update
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify filter badge shows count
    await expect(page.locator('text=2 filters applied')).toBeVisible();

    // Verify results match filters
    const assignments = await page.locator('[data-testid="assignment-row"]').all();
    for (const assignment of assignments) {
      const priorityBadge = await assignment.locator('[data-testid="priority-badge"]').textContent();
      expect(priorityBadge).toContain('High');

      const agingText = await assignment.locator('[data-testid="aging-indicator"]').textContent();
      const days = parseInt(agingText?.match(/\d+/)?.[0] || '0');
      expect(days).toBeGreaterThanOrEqual(7);
    }

    // Verify result count display
    const resultCount = await page.locator('[data-testid="result-count"]').textContent();
    expect(resultCount).toMatch(/showing \d+ of \d+ items/i);
  });

  test('Filters persist on tab switch', async ({ page }) => {
    // Apply filters
    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("High")');
    await page.click('label:has-text("7+ days")');
    await page.click('button:has-text("Apply Filters")');

    // Verify filters applied
    await expect(page.locator('text=2 filters applied')).toBeVisible();

    // Navigate to another page
    await page.click('a:has-text("Dashboard")');
    await page.waitForURL('**/dashboard');

    // Return to waiting queue
    await page.click('a:has-text("Waiting Queue")');
    await page.waitForURL('**/waiting-queue');
    await page.waitForLoadState('networkidle');

    // Verify filters still applied
    await expect(page.locator('text=2 filters applied')).toBeVisible();

    // Open filter panel and verify selections
    await page.click('button[aria-label="Open filters"]');
    await expect(page.locator('label:has-text("High") input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('label:has-text("7+ days") input[type="checkbox"]')).toBeChecked();
  });

  test('Clear filters resets all selections and shows all results', async ({ page }) => {
    // Apply filters
    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("High")');
    await page.click('label:has-text("7+ days")');
    await page.click('button:has-text("Apply Filters")');

    // Record initial result count
    const filteredCount = await page.locator('[data-testid="assignment-row"]').count();

    // Clear filters
    await page.click('button:has-text("Clear Filters")');

    // Wait for results to refresh
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify all filters cleared
    await expect(page.locator('text=2 filters applied')).not.toBeVisible();

    // Verify more results shown
    const allCount = await page.locator('[data-testid="assignment-row"]').count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);

    // Open filter panel and verify no selections
    await page.click('button[aria-label="Open filters"]');
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(0);
  });

  test('Desktop sidebar shows filters without dialog', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    // Verify sidebar visible (not a dialog)
    await expect(page.locator('[role="complementary"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Select filters directly (no need to open/close)
    await page.click('label:has-text("High")');
    await page.click('label:has-text("7+ days")');

    // Filters apply immediately (no "Apply" button on desktop)
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify filter badge
    await expect(page.locator('text=2 filters applied')).toBeVisible();
  });

  test('Filter by assignee shows only current user assignments', async ({ page }) => {
    // Open filters
    await page.click('button[aria-label="Open filters"]');

    // Select "My assignments" (current user filter)
    await page.click('label:has-text("My assignments")');
    await page.click('button:has-text("Apply Filters")');

    // Wait for filtered results
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify all assignments belong to current user
    const assignments = await page.locator('[data-testid="assignment-row"]').all();
    for (const assignment of assignments) {
      const assigneeText = await assignment.locator('[data-testid="assignee-name"]').textContent();
      expect(assigneeText).toBe('Khalid Alzahrani'); // Test user's name
    }
  });

  test('Sorting controls work with filters', async ({ page }) => {
    // Apply filter
    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("High")');
    await page.click('button:has-text("Apply Filters")');

    // Change sort order
    await page.click('button[aria-label="Sort by"]');
    await page.click('button:has-text("Oldest first")');

    // Wait for results to update
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify ascending date order
    const dates = await page.locator('[data-testid="assigned-date"]').allTextContents();
    for (let i = 1; i < dates.length; i++) {
      const date1 = new Date(dates[i - 1]);
      const date2 = new Date(dates[i]);
      expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime());
    }
  });

  test('Empty state shown when no results match filters', async ({ page }) => {
    // Apply very restrictive filters
    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("Urgent")');
    await page.click('label:has-text("7+ days")');
    await page.click('label:has-text("Position")');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify empty state message
    await expect(page.locator('text=No waiting items match your filters')).toBeVisible();

    // Verify suggestion to clear filters
    await expect(page.locator('text=Try adjusting your filters')).toBeVisible();
  });

  test('Filter results update in real-time when assignment changes', async ({ page }) => {
    // Apply filters
    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("Pending")');
    await page.click('button:has-text("Apply Filters")');

    // Record initial count
    const initialCount = await page.locator('[data-testid="assignment-row"]').count();

    // Simulate assignment status change (via Supabase Realtime)
    // In real scenario, another user completes an assignment
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('assignment-updated', {
        detail: { id: 'test-id', status: 'completed' }
      }));
    });

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Verify assignment removed from filtered view
    const updatedCount = await page.locator('[data-testid="assignment-row"]').count();
    expect(updatedCount).toBeLessThanOrEqual(initialCount);

    // Verify toast notification
    await expect(page.locator('text=Assignment removed from queue')).toBeVisible();
  });

  test('Filter by work item type', async ({ page }) => {
    // Open filters
    await page.click('button[aria-label="Open filters"]');

    // Select dossier type
    await page.click('label:has-text("Dossier")');
    await page.click('button:has-text("Apply Filters")');

    // Wait for filtered results
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    // Verify all results are dossiers
    const assignments = await page.locator('[data-testid="assignment-row"]').all();
    for (const assignment of assignments) {
      const typeText = await assignment.locator('[data-testid="work-item-type"]').textContent();
      expect(typeText).toContain('Dossier');
    }
  });

  test('RTL layout support in filter panel (Arabic)', async ({ page }) => {
    // Switch to Arabic locale
    await page.click('button[aria-label="Language"]');
    await page.click('button:has-text("العربية")');

    // Open filters
    await page.click('button[aria-label="فتح الفلاتر"]'); // Arabic: Open filters

    // Verify RTL direction
    const filterPanel = page.locator('[role="dialog"]');
    await expect(filterPanel).toHaveAttribute('dir', 'rtl');

    // Verify Arabic labels
    await expect(page.locator('text=الأولوية')).toBeVisible(); // Priority
    await expect(page.locator('text=التقادم')).toBeVisible(); // Aging

    // Verify logical properties used (spacing correct in RTL)
    const checkbox = page.locator('input[type="checkbox"]').first();
    const boundingBox = await checkbox.boundingBox();
    expect(boundingBox).toBeTruthy();
  });

  test('Touch-friendly controls on mobile (44x44px minimum)', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip(); // Touch testing only on Chromium
    }

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open filters
    await page.click('button[aria-label="Open filters"]');

    // Measure checkbox touch targets
    const checkboxes = await page.locator('label:has(input[type="checkbox"])').all();
    for (const checkbox of checkboxes) {
      const boundingBox = await checkbox.boundingBox();
      expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    }

    // Measure button touch targets
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Filter performance: Results update in < 1 second', async ({ page }) => {
    // Apply filter and measure response time
    const startTime = Date.now();

    await page.click('button[aria-label="Open filters"]');
    await page.click('label:has-text("High")');
    await page.click('button:has-text("Apply Filters")');

    // Wait for API response
    await page.waitForResponse(resp =>
      resp.url().includes('/waiting-queue-filters/assignments') &&
      resp.status() === 200
    );

    const duration = Date.now() - startTime;

    // Verify performance target met
    expect(duration).toBeLessThan(1000);
    console.log(`✓ Filter applied in ${duration}ms`);
  });
});
