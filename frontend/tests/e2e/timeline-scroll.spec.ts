import { test, expect } from '@playwright/test';

/**
 * E2E Test: Timeline Infinite Scroll (T051)
 * Tests infinite scroll pagination on timeline
 *
 * Validates:
 * - Navigate to dossier detail with 100+ timeline events
 * - Assert: First 50 events loaded
 * - Scroll to bottom
 * - Assert: Next 50 events loaded
 * - Assert: No duplicate events
 * - Loading indicator shown during fetch
 */

test.describe('Dossier Timeline Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test.user@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should load initial 50 timeline events', async ({ page }) => {
    // Navigate to dossier with many events
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    // Wait for page to load
    await expect(page.locator('[data-testid="dossier-header"]')).toBeVisible();

    // Assert timeline tab is active
    await expect(page.locator('[data-testid="tab-timeline"]')).toHaveAttribute('aria-selected', 'true');

    // Assert timeline container is visible
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Count initial events
    const initialEvents = await page.locator('[data-testid^="timeline-event-"]').count();
    expect(initialEvents).toBeLessThanOrEqual(50);
    expect(initialEvents).toBeGreaterThan(0);
  });

  test('should load next batch when scrolling to bottom', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Count initial events
    const initialEvents = await page.locator('[data-testid^="timeline-event-"]').all();
    const initialCount = initialEvents.length;

    // Get IDs of initial events
    const initialEventIds = await Promise.all(
      initialEvents.map((el) => el.getAttribute('data-event-id'))
    );

    // Scroll to bottom of timeline
    const timeline = page.locator('[data-testid="timeline-container"]');
    await timeline.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for loading indicator
    await expect(page.locator('[data-testid="timeline-loading"]')).toBeVisible();

    // Wait for new events to load
    await expect(page.locator('[data-testid="timeline-loading"]')).not.toBeVisible({ timeout: 5000 });

    // Wait a bit for events to render
    await page.waitForTimeout(500);

    // Count events after scroll
    const afterScrollEvents = await page.locator('[data-testid^="timeline-event-"]').all();
    const afterScrollCount = afterScrollEvents.length;

    // Assert more events loaded
    expect(afterScrollCount).toBeGreaterThan(initialCount);

    // Get IDs of all events after scroll
    const afterScrollEventIds = await Promise.all(
      afterScrollEvents.map((el) => el.getAttribute('data-event-id'))
    );

    // Assert no duplicates
    const uniqueIds = new Set(afterScrollEventIds);
    expect(uniqueIds.size).toBe(afterScrollCount); // All IDs should be unique

    // Assert initial events are still present
    initialEventIds.forEach((id) => {
      expect(afterScrollEventIds).toContain(id);
    });
  });

  test('should stop loading when no more events', async ({ page }) => {
    // Mock API to return limited events
    await page.route('**/api/dossiers/*/timeline*', (route) => {
      const url = new URL(route.request().url());
      const cursor = url.searchParams.get('cursor');

      if (!cursor) {
        // First page
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 20 }, (_, i) => ({
              event_type: 'engagement',
              source_id: `event-${i}`,
              event_date: new Date(Date.now() - i * 86400000).toISOString(),
              event_title_en: `Event ${i}`,
              event_title_ar: `حدث ${i}`,
              event_description_en: `Description ${i}`,
              event_description_ar: `وصف ${i}`,
              metadata: {},
            })),
            pagination: {
              next_cursor: null,
              has_more: false,
            },
          }),
        });
      } else {
        // Subsequent pages
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: {
              next_cursor: null,
              has_more: false,
            },
          }),
        });
      }
    });

    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Wait for events to load
    await expect(page.locator('[data-testid^="timeline-event-"]').first()).toBeVisible();

    // Count events
    const eventCount = await page.locator('[data-testid^="timeline-event-"]').count();
    expect(eventCount).toBe(20);

    // Scroll to bottom
    const timeline = page.locator('[data-testid="timeline-container"]');
    await timeline.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait a bit
    await page.waitForTimeout(1000);

    // Assert loading indicator does NOT appear
    await expect(page.locator('[data-testid="timeline-loading"]')).not.toBeVisible();

    // Assert "end of timeline" message is shown
    await expect(page.locator('[data-testid="timeline-end-message"]')).toBeVisible();
  });

  test('should maintain scroll position when switching tabs', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Scroll to middle of timeline
    const timeline = page.locator('[data-testid="timeline-container"]');
    await timeline.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2;
    });

    // Get scroll position
    const scrollPosition = await timeline.evaluate((el) => el.scrollTop);
    expect(scrollPosition).toBeGreaterThan(0);

    // Switch to positions tab
    await page.click('[data-testid="tab-positions"]');
    await expect(page.locator('[data-testid="tab-positions"]')).toHaveAttribute('aria-selected', 'true');

    // Switch back to timeline tab
    await page.click('[data-testid="tab-timeline"]');
    await expect(page.locator('[data-testid="tab-timeline"]')).toHaveAttribute('aria-selected', 'true');

    // Assert scroll position is restored
    await page.waitForTimeout(500);
    const restoredScrollPosition = await timeline.evaluate((el) => el.scrollTop);
    expect(restoredScrollPosition).toBe(scrollPosition);
  });

  test('should display events in chronological order (newest first)', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Get all event dates
    const eventElements = await page.locator('[data-testid^="timeline-event-"]').all();
    const eventDates: Date[] = [];

    for (const element of eventElements) {
      const dateText = await element.getAttribute('data-event-date');
      if (dateText) {
        eventDates.push(new Date(dateText));
      }
    }

    // Assert dates are in descending order
    for (let i = 0; i < eventDates.length - 1; i++) {
      expect(eventDates[i].getTime()).toBeGreaterThanOrEqual(eventDates[i + 1].getTime());
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';

    // Mock API to fail on second request
    let requestCount = 0;
    await page.route('**/api/dossiers/*/timeline*', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 10 }, (_, i) => ({
              event_type: 'engagement',
              source_id: `event-${i}`,
              event_date: new Date(Date.now() - i * 86400000).toISOString(),
              event_title_en: `Event ${i}`,
              event_title_ar: `حدث ${i}`,
              metadata: {},
            })),
            pagination: {
              next_cursor: 'cursor1',
              has_more: true,
            },
          }),
        });
      } else {
        // Subsequent requests fail
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'INTERNAL_ERROR',
              message_en: 'Failed to load timeline',
              message_ar: 'فشل تحميل الجدول الزمني',
            },
          }),
        });
      }
    });

    await page.goto(`/dossiers/${dossierId}`);
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Initial events loaded
    await expect(page.locator('[data-testid^="timeline-event-"]').first()).toBeVisible();

    // Scroll to trigger next page load
    const timeline = page.locator('[data-testid="timeline-container"]');
    await timeline.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for error state
    await expect(page.locator('[data-testid="timeline-error"]')).toBeVisible({ timeout: 5000 });

    // Assert retry button is shown
    await expect(page.locator('[data-testid="timeline-retry-button"]')).toBeVisible();

    // Assert previous events are still visible
    const eventCount = await page.locator('[data-testid^="timeline-event-"]').count();
    expect(eventCount).toBe(10); // Original 10 events
  });

  test('should filter timeline by event type', async ({ page }) => {
    const dossierId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/dossiers/${dossierId}`);

    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Click filter dropdown
    await page.click('[data-testid="timeline-filter-button"]');
    await expect(page.locator('[data-testid="timeline-filter-menu"]')).toBeVisible();

    // Select "Engagements" only
    await page.click('[data-testid="filter-event-type-engagement"]');

    // Close filter menu
    await page.click('[data-testid="timeline-filter-button"]');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Assert all visible events are engagements
    const eventTypes = await page.locator('[data-testid="timeline-event-type"]').allTextContents();
    eventTypes.forEach((type) => {
      expect(type.toLowerCase()).toContain('engagement');
    });
  });
});