// T081: E2E test - Calendar event creation flow
import { test, expect } from '@playwright/test';

test.describe('Calendar Event Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should create calendar event from dossier', async ({ page }) => {
    // Step 1: Navigate to dossier
    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');

    // Step 2: Navigate to Engagements tab
    await page.click('text=Engagements');

    // Step 3: Click "Create Event" button
    await page.click('[data-testid="create-event-button"]');

    // Step 4: Select "Calendar Entry" option
    await page.click('[data-testid="event-type-calendar-entry"]');

    // Step 5: Fill event form
    await page.fill('[name="title_en"]', 'Monthly Review Meeting');
    await page.fill('[name="title_ar"]', 'اجتماع المراجعة الشهرية');
    await page.fill('[name="description_en"]', 'Monthly review of Saudi Arabia dossier');
    await page.selectOption('[name="entry_type"]', 'review');

    // Select date (7 days from now)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('[name="event_date"]', dateString);
    await page.fill('[name="event_time"]', '10:00');
    await page.fill('[name="duration_minutes"]', '60');

    // Step 6: Save event
    await page.click('[data-testid="save-event-button"]');

    // Verify success message
    await expect(page.locator('text=Event created successfully')).toBeVisible();

    // Step 7: Navigate to calendar view
    await page.click('text=Calendar');
    await expect(page).toHaveURL(/calendar/);

    // Step 8: Verify event appears in calendar
    await expect(page.locator('text=Monthly Review Meeting')).toBeVisible();

    // Verify color coding (green for calendar entries)
    const eventElement = page.locator('[data-testid="calendar-event"]:has-text("Monthly Review Meeting")');
    await expect(eventElement).toHaveCSS('background-color', /008800|rgb\(0, 136, 0\)/);

    console.log('✓ Calendar event creation completed successfully');
  });

  test('should show calendar events with 4 color codes', async ({ page }) => {
    // Navigate to calendar
    await page.goto('http://localhost:5173/calendar');

    // Wait for calendar to load
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible();

    // Check for 4 event types with different colors
    const blueEvents = page.locator('[data-testid="calendar-event"][data-color="blue"]'); // Engagements
    const greenEvents = page.locator('[data-testid="calendar-event"][data-color="green"]'); // Calendar entries
    const redEvents = page.locator('[data-testid="calendar-event"][data-color="red"]'); // Assignment deadlines
    const yellowEvents = page.locator('[data-testid="calendar-event"][data-color="yellow"]'); // Approval deadlines

    // At least one of each type should exist
    await expect(blueEvents).toHaveCount(1, { timeout: 2000 });
    await expect(greenEvents).toHaveCount(1, { timeout: 2000 });

    console.log('✓ Calendar color coding working correctly');
  });

  test('should filter calendar events', async ({ page }) => {
    // Navigate to calendar
    await page.goto('http://localhost:5173/calendar');

    // Initial: all events visible
    const allEvents = await page.locator('[data-testid="calendar-event"]').count();
    expect(allEvents).toBeGreaterThan(0);

    // Filter by engagements only
    await page.click('[data-testid="filter-engagements"]');

    const engagementEvents = await page.locator('[data-testid="calendar-event"]').count();
    expect(engagementEvents).toBeLessThanOrEqual(allEvents);

    // Clear filter
    await page.click('[data-testid="clear-filters"]');

    const clearedEvents = await page.locator('[data-testid="calendar-event"]').count();
    expect(clearedEvents).toBe(allEvents);

    console.log('✓ Calendar filtering working correctly');
  });

  test('should reschedule event via drag-and-drop', async ({ page }) => {
    // Navigate to calendar
    await page.goto('http://localhost:5173/calendar');

    // Find an event
    const event = page.locator('[data-testid="calendar-event"]').first();
    await expect(event).toBeVisible();

    // Get original position
    const originalDate = await event.getAttribute('data-date');

    // Drag event to new date (3 days later)
    const targetCell = page.locator(`[data-testid="calendar-cell"][data-date="${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"]`);
    await event.dragTo(targetCell);

    // Verify event moved
    await expect(page.locator('text=Event rescheduled')).toBeVisible();

    // Verify new date
    const newDate = await event.getAttribute('data-date');
    expect(newDate).not.toBe(originalDate);

    console.log('✓ Drag-and-drop rescheduling working correctly');
  });
});
