import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: T038 - Assignment Queue Management
 *
 * Validates:
 * - Queue items sorted by priority and creation time
 * - Filter by priority, work_item_type, unit_id
 * - Real-time updates (queue count decreases as items assigned)
 * - Supervisor permissions for viewing queue
 *
 * Reference: tasks.md T038, quickstart.md Scenario 4-5
 */

const TEST_SUPERVISOR_EMAIL = 'supervisor@gastat.gov.sa';
const TEST_SUPERVISOR_PASSWORD = 'Test123!@#';
const TEST_STAFF_EMAIL = 'translator1@gastat.gov.sa';
const TEST_STAFF_PASSWORD = 'Test123!@#';
const TEST_UNIT_ID = 'unit-translation';

test.describe('E2E: Assignment Queue Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await cleanupTestQueue(page);
    await page.close();
  });

  test('supervisor can navigate to Assignment Queue page', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Navigate to Assignment Queue page
    await page.goto('/assignments/queue');
    await page.waitForSelector('[data-testid="assignment-queue-page"]');

    // Verify page title
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/Assignment Queue|Queue Management/i);

    // Verify queue table is visible
    const queueTable = page.locator('[data-testid="queue-table"]');
    await expect(queueTable).toBeVisible();
  });

  test('staff member cannot access queue page (403 forbidden)', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);

    // Attempt to navigate to Assignment Queue page
    await page.goto('/assignments/queue');

    // Verify redirect to unauthorized or 403 error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /unauthorized|forbidden|permission denied/i
    );
  });

  test('queue items are sorted by priority DESC, created_at ASC', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Setup: Create queue items with different priorities and timestamps
    await createQueueItems(page, [
      { id: 'queue-normal-1', priority: 'normal', createdMinutesAgo: 10 },
      { id: 'queue-urgent-1', priority: 'urgent', createdMinutesAgo: 5 },
      { id: 'queue-high-1', priority: 'high', createdMinutesAgo: 8 },
      { id: 'queue-normal-2', priority: 'normal', createdMinutesAgo: 15 },
      { id: 'queue-high-2', priority: 'high', createdMinutesAgo: 3 },
    ]);

    await page.goto('/assignments/queue');
    await page.waitForSelector('[data-testid="queue-table"]');

    // Get queue items in displayed order
    const queueItems = page.locator('[data-testid="queue-item"]');
    const count = await queueItems.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Verify order: urgent → high → high → normal → normal
    const firstItem = queueItems.nth(0);
    await expect(firstItem).toContainText(/urgent/i);
    await expect(firstItem).toHaveAttribute('data-queue-id', 'queue-urgent-1');

    const secondItem = queueItems.nth(1);
    await expect(secondItem).toContainText(/high/i);
    await expect(secondItem).toHaveAttribute('data-queue-id', 'queue-high-2'); // Created more recently (3 min ago)

    const thirdItem = queueItems.nth(2);
    await expect(thirdItem).toContainText(/high/i);
    await expect(thirdItem).toHaveAttribute('data-queue-id', 'queue-high-1'); // Created earlier (8 min ago)

    // Within normal priority, oldest first (FIFO)
    const fourthItem = queueItems.nth(3);
    await expect(fourthItem).toContainText(/normal/i);
    await expect(fourthItem).toHaveAttribute('data-queue-id', 'queue-normal-2'); // 15 min ago

    const fifthItem = queueItems.nth(4);
    await expect(fifthItem).toContainText(/normal/i);
    await expect(fifthItem).toHaveAttribute('data-queue-id', 'queue-normal-1'); // 10 min ago
  });

  test('filter queue by priority', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);
    await page.goto('/assignments/queue');

    // Open priority filter dropdown
    await page.click('[data-testid="filter-priority"]');

    // Select "urgent" priority
    await page.click('[data-testid="priority-option-urgent"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify only urgent items shown
    const queueItems = page.locator('[data-testid="queue-item"]');
    const count = await queueItems.count();

    for (let i = 0; i < count; i++) {
      const item = queueItems.nth(i);
      await expect(item).toContainText(/urgent/i);
    }

    // Clear filter
    await page.click('[data-testid="clear-filters"]');
    await page.waitForTimeout(500);

    // Verify all items shown again
    const allItems = page.locator('[data-testid="queue-item"]');
    const allCount = await allItems.count();
    expect(allCount).toBeGreaterThan(count);
  });

  test('filter queue by work_item_type', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Create queue items with different work item types
    await createQueueItems(page, [
      { id: 'queue-ticket-1', workItemType: 'ticket', priority: 'normal' },
      { id: 'queue-dossier-1', workItemType: 'dossier', priority: 'normal' },
      { id: 'queue-position-1', workItemType: 'position', priority: 'normal' },
    ]);

    await page.goto('/assignments/queue');

    // Filter by "ticket" type
    await page.click('[data-testid="filter-work-item-type"]');
    await page.click('[data-testid="type-option-ticket"]');
    await page.waitForTimeout(500);

    // Verify only tickets shown
    const ticketItems = page.locator('[data-testid="queue-item"]');
    const ticketCount = await ticketItems.count();

    for (let i = 0; i < ticketCount; i++) {
      const item = ticketItems.nth(i);
      const typeCell = item.locator('[data-testid="work-item-type"]');
      await expect(typeCell).toContainText(/ticket/i);
    }
  });

  test('filter queue by unit_id (supervisor sees own unit by default)', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);
    await page.goto('/assignments/queue');

    // Verify default filter shows supervisor's unit only
    const unitFilter = page.locator('[data-testid="filter-unit"]');
    await expect(unitFilter).toHaveValue(TEST_UNIT_ID);

    // Verify all items belong to supervisor's unit
    const queueItems = page.locator('[data-testid="queue-item"]');
    const count = await queueItems.count();

    for (let i = 0; i < count; i++) {
      const item = queueItems.nth(i);
      const unitCell = item.locator('[data-testid="target-unit"]');
      await expect(unitCell).toContainText(/Translation Department/i);
    }
  });

  test('real-time queue updates when item assigned', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Create queue item
    await createQueueItems(page, [
      { id: 'queue-realtime-test', priority: 'urgent', createdMinutesAgo: 1 },
    ]);

    await page.goto('/assignments/queue');
    await page.waitForSelector('[data-testid="queue-table"]');

    // Get initial queue count
    const initialCount = await page
      .locator('[data-testid="queue-count"]')
      .textContent();
    const initialCountNum = parseInt(initialCount!.match(/\d+/)?.[0] || '0');

    // Verify item exists in queue
    await expect(
      page.locator('[data-queue-id="queue-realtime-test"]')
    ).toBeVisible();

    // Simulate assignment from queue (trigger via API)
    await assignItemFromQueue(page, 'queue-realtime-test');

    // Wait for Realtime subscription to receive update (max 3 seconds)
    await page.waitForTimeout(3000);

    // Verify queue count decreased
    const updatedCount = await page
      .locator('[data-testid="queue-count"]')
      .textContent();
    const updatedCountNum = parseInt(updatedCount!.match(/\d+/)?.[0] || '0');
    expect(updatedCountNum).toBe(initialCountNum - 1);

    // Verify item removed from queue table
    await expect(
      page.locator('[data-queue-id="queue-realtime-test"]')
    ).not.toBeVisible();
  });

  test('queue position updates in real-time', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Create 3 queue items with same priority
    await createQueueItems(page, [
      { id: 'queue-pos-1', priority: 'normal', createdMinutesAgo: 15 },
      { id: 'queue-pos-2', priority: 'normal', createdMinutesAgo: 10 },
      { id: 'queue-pos-3', priority: 'normal', createdMinutesAgo: 5 },
    ]);

    await page.goto('/assignments/queue');

    // Verify initial positions (oldest first)
    const item2 = page.locator('[data-queue-id="queue-pos-2"]');
    const position2Cell = item2.locator('[data-testid="queue-position"]');
    await expect(position2Cell).toContainText('2'); // Position 2 (after queue-pos-1)

    // Assign first item from queue
    await assignItemFromQueue(page, 'queue-pos-1');
    await page.waitForTimeout(2000);

    // Verify position updated (item 2 moved to position 1)
    await expect(position2Cell).toContainText('1');
  });

  test('pagination controls work correctly', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Create 25 queue items (more than default page size of 10)
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `queue-page-${i}`,
      priority: 'normal',
      createdMinutesAgo: 25 - i,
    }));
    await createQueueItems(page, items);

    await page.goto('/assignments/queue');

    // Verify page 1 shows first 10 items
    const page1Items = page.locator('[data-testid="queue-item"]');
    expect(await page1Items.count()).toBe(10);

    // Verify pagination info
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    await expect(paginationInfo).toContainText(/1-10 of 25/i);

    // Click "Next" button
    await page.click('[data-testid="pagination-next"]');
    await page.waitForTimeout(500);

    // Verify page 2 shows next 10 items
    const page2Items = page.locator('[data-testid="queue-item"]');
    expect(await page2Items.count()).toBe(10);

    await expect(paginationInfo).toContainText(/11-20 of 25/i);
  });
});

// Helper Functions

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();
}

interface QueueItemConfig {
  id: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  workItemType?: 'ticket' | 'dossier' | 'position' | 'task';
  createdMinutesAgo?: number;
}

async function createQueueItems(page: Page, items: QueueItemConfig[]) {
  await page.evaluate(async (itemsConfig: QueueItemConfig[]) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const insertData = itemsConfig.map((item) => {
      const createdAt = new Date();
      createdAt.setMinutes(createdAt.getMinutes() - (item.createdMinutesAgo || 0));

      return {
        id: item.id,
        work_item_id: `work-${item.id}`,
        work_item_type: item.workItemType || 'ticket',
        required_skills: ['skill-arabic'],
        target_unit_id: 'unit-translation',
        priority: item.priority,
        created_at: createdAt.toISOString(),
        attempts: 0,
        notes: 'E2E test queue item',
      };
    });

    await supabase.from('assignment_queue').insert(insertData);
  }, items);
}

async function cleanupTestQueue(page: Page) {
  await page.evaluate(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    await supabase.from('assignment_queue').delete().like('id', 'queue-%');
    await supabase.from('assignments').delete().like('work_item_id', 'work-queue-%');
  });
}

async function assignItemFromQueue(page: Page, queueId: string) {
  await page.evaluate(async (id: string) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Get queue item details
    const { data: queueItem } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (queueItem) {
      // Create assignment
      await supabase.from('assignments').insert({
        work_item_id: queueItem.work_item_id,
        work_item_type: queueItem.work_item_type,
        assignee_id: 'staff-translator-1',
        priority: queueItem.priority,
        status: 'assigned',
      });

      // Delete from queue
      await supabase.from('assignment_queue').delete().eq('id', id);
    }
  }, queueId);
}
