import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: T037 - SLA Countdown Display
 *
 * Validates:
 * - SLA countdown updates every second (client-side calculation)
 * - Status indicator: green (<75%), yellow (75-100%), red (>100%)
 * - Supabase Realtime subscription for server-pushed updates
 *
 * Reference: tasks.md T037, quickstart.md Scenario 3
 */

const TEST_STAFF_EMAIL = 'translator1@gastat.gov.sa';
const TEST_STAFF_PASSWORD = 'Test123!@#';
const TEST_STAFF_ID = 'staff-translator-1';

test.describe('E2E: SLA Countdown Display', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Setup: Create test assignment with known SLA
    await setupTestAssignment(page);
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestAssignment(page);
    await page.close();
  });

  test('should display SLA countdown with correct time remaining', async () => {
    // Login as staff member
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);

    // Navigate to "My Assignments" page
    await page.goto('/assignments/my-assignments');
    await page.waitForSelector('[data-testid="my-assignments-list"]');

    // Find assignment with SLA countdown
    const assignment = page.locator('[data-testid="assignment-card"]').first();
    const countdown = assignment.locator('[data-testid="sla-countdown"]');

    // Verify countdown is visible
    await expect(countdown).toBeVisible();

    // Get initial time remaining
    const initialTime = await countdown.textContent();
    expect(initialTime).toMatch(/\d+:\d+:\d+/); // Format: HH:MM:SS

    // Wait 2 seconds and verify countdown updated
    await page.waitForTimeout(2000);
    const updatedTime = await countdown.textContent();

    // Time should have decreased by ~2 seconds
    expect(updatedTime).not.toBe(initialTime);
  });

  test('should show green status indicator when SLA < 75%', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    // Find assignment with 50% SLA elapsed (green zone)
    const assignment = page.locator('[data-testid="assignment-card-green"]');
    const statusIndicator = assignment.locator('[data-testid="sla-status-indicator"]');

    await expect(statusIndicator).toHaveClass(/bg-green/);
    await expect(statusIndicator).toHaveAttribute('aria-label', /ok|safe/i);
  });

  test('should show yellow status indicator when SLA 75-100%', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    // Create assignment with 80% SLA elapsed (warning zone)
    await createAssignmentWithSLA(page, 0.80); // 80% elapsed

    await page.reload();
    const assignment = page.locator('[data-testid="assignment-card-warning"]');
    const statusIndicator = assignment.locator('[data-testid="sla-status-indicator"]');

    await expect(statusIndicator).toHaveClass(/bg-yellow|bg-amber/);
    await expect(statusIndicator).toHaveAttribute('aria-label', /warning|at risk/i);
  });

  test('should show red status indicator when SLA > 100% (breached)', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    // Create assignment with breached SLA (105% elapsed)
    await createAssignmentWithSLA(page, 1.05); // 105% elapsed

    await page.reload();
    const assignment = page.locator('[data-testid="assignment-card-breached"]');
    const statusIndicator = assignment.locator('[data-testid="sla-status-indicator"]');

    await expect(statusIndicator).toHaveClass(/bg-red/);
    await expect(statusIndicator).toHaveAttribute('aria-label', /breached|exceeded/i);
  });

  test('should update countdown via Supabase Realtime when assignment changes', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    const assignment = page.locator('[data-testid="assignment-card"]').first();
    const countdown = assignment.locator('[data-testid="sla-countdown"]');

    // Get initial countdown
    const initialCountdown = await countdown.textContent();

    // Simulate server-side SLA update (trigger Realtime event)
    await updateAssignmentSLAViaAPI(page, 'test-assignment-001', 24); // Update deadline to 24h

    // Wait for Realtime subscription to receive update
    await page.waitForTimeout(2000);

    // Verify countdown updated to reflect new deadline
    const updatedCountdown = await countdown.textContent();
    expect(updatedCountdown).not.toBe(initialCountdown);

    // Verify new countdown shows approximately 24 hours
    expect(updatedCountdown).toMatch(/23:[0-5]\d:[0-5]\d|24:00:00/);
  });

  test('should continue countdown when WebSocket temporarily disconnects', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    const countdown = page.locator('[data-testid="sla-countdown"]').first();
    const initialTime = await countdown.textContent();

    // Simulate WebSocket disconnect (block Realtime connections)
    await page.route('**/realtime/v1/**', (route) => route.abort());

    // Wait 3 seconds
    await page.waitForTimeout(3000);

    // Verify countdown still updating (client-side calculation continues)
    const timeAfterDisconnect = await countdown.textContent();
    expect(timeAfterDisconnect).not.toBe(initialTime);

    // Re-enable WebSocket
    await page.unroute('**/realtime/v1/**');
  });

  test('should display accessible ARIA live region for countdown updates', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);
    await page.goto('/assignments/my-assignments');

    const countdown = page.locator('[data-testid="sla-countdown"]').first();

    // Verify ARIA live region attributes
    await expect(countdown).toHaveAttribute('aria-live', 'polite');
    await expect(countdown).toHaveAttribute('role', 'timer');

    // Verify screen reader text
    const srText = countdown.locator('.sr-only');
    await expect(srText).toContainText(/time remaining|hours|minutes/i);
  });
});

// Helper Functions

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/assignments/my-assignments');
}

async function setupTestAssignment(page: Page) {
  // Call Supabase API to create test assignment with known SLA
  await page.evaluate(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const assignedAt = new Date();
    const slaDeadline = new Date(assignedAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    await supabase.from('assignments').insert({
      id: 'test-assignment-001',
      work_item_id: 'test-dossier-001',
      work_item_type: 'dossier',
      assignee_id: 'staff-translator-1',
      assigned_at: assignedAt.toISOString(),
      sla_deadline: slaDeadline.toISOString(),
      priority: 'normal',
      status: 'assigned',
    });
  });
}

async function cleanupTestAssignment(page: Page) {
  await page.evaluate(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    await supabase.from('assignments').delete().like('id', 'test-assignment-%');
  });
}

async function createAssignmentWithSLA(page: Page, elapsedPercent: number) {
  await page.evaluate(async (percent: number) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const now = new Date();
    const totalSLAHours = 48;
    const elapsedHours = totalSLAHours * percent;

    const assignedAt = new Date(now.getTime() - elapsedHours * 60 * 60 * 1000);
    const slaDeadline = new Date(assignedAt.getTime() + totalSLAHours * 60 * 60 * 1000);

    const statusSuffix = percent < 0.75 ? 'green' : percent <= 1.0 ? 'warning' : 'breached';

    await supabase.from('assignments').insert({
      id: `test-assignment-${statusSuffix}`,
      work_item_id: `test-dossier-${statusSuffix}`,
      work_item_type: 'dossier',
      assignee_id: 'staff-translator-1',
      assigned_at: assignedAt.toISOString(),
      sla_deadline: slaDeadline.toISOString(),
      priority: 'normal',
      status: 'assigned',
    });
  }, elapsedPercent);
}

async function updateAssignmentSLAViaAPI(
  page: Page,
  assignmentId: string,
  newDeadlineHours: number
) {
  await page.evaluate(
    async (args: { id: string; hours: number }) => {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      const now = new Date();
      const newDeadline = new Date(now.getTime() + args.hours * 60 * 60 * 1000);

      await supabase
        .from('assignments')
        .update({ sla_deadline: newDeadline.toISOString() })
        .eq('id', args.id);
    },
    { id: assignmentId, hours: newDeadlineHours }
  );
}
