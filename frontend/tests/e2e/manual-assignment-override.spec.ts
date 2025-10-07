import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: T039 - Manual Assignment Override
 *
 * Validates:
 * - Supervisor can override auto-assignment
 * - Manual selection of assignee
 * - Override reason is required and captured
 * - Assignment created with assigned_by field
 * - Audit trail recorded
 * - WIP limit bypass (with warning logged)
 *
 * Reference: tasks.md T039, research.md Section 3
 */

const TEST_SUPERVISOR_EMAIL = 'supervisor@gastat.gov.sa';
const TEST_SUPERVISOR_PASSWORD = 'Test123!@#';
const TEST_STAFF_EMAIL = 'translator1@gastat.gov.sa';
const TEST_STAFF_PASSWORD = 'Test123!@#';
const TEST_SUPERVISOR_ID = 'staff-supervisor';
const TEST_STAFF_ID = 'staff-translator-1';

test.describe('E2E: Manual Assignment Override', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await cleanupTestAssignments(page);
    await page.close();
  });

  test('supervisor can access manual override dialog', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Navigate to a work item detail page
    await createTestWorkItem(page, 'test-dossier-override-1');
    await page.goto('/dossiers/test-dossier-override-1');

    // Click "Assign Manually" button
    await page.click('[data-testid="assign-manually-button"]');

    // Verify override dialog opens
    const dialog = page.locator('[data-testid="manual-override-dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title
    await expect(dialog.locator('h2')).toContainText(/Manual Assignment Override/i);
  });

  test('staff member cannot access manual override (permission denied)', async () => {
    await login(page, TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-staff-1');
    await page.goto('/dossiers/test-dossier-staff-1');

    // Verify "Assign Manually" button is not visible (or disabled)
    const assignButton = page.locator('[data-testid="assign-manually-button"]');
    await expect(assignButton).not.toBeVisible();
  });

  test('supervisor can select assignee from staff list', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-2');
    await page.goto('/dossiers/test-dossier-override-2');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Open assignee selector dropdown
    await dialog.locator('[data-testid="assignee-selector"]').click();

    // Verify staff list shows available staff with skills
    const staffList = page.locator('[data-testid="staff-option"]');
    const count = await staffList.count();
    expect(count).toBeGreaterThan(0);

    // Verify staff details displayed (name, skills, current WIP)
    const firstStaff = staffList.nth(0);
    await expect(firstStaff).toContainText(/translator|analyst/i); // Staff name
    await expect(firstStaff).toContainText(/\d+\/\d+/); // Current assignments (e.g., 2/5)

    // Select staff member
    await firstStaff.click();

    // Verify selection
    const selectedValue = await dialog
      .locator('[data-testid="assignee-selector"]')
      .textContent();
    expect(selectedValue).toBeTruthy();
  });

  test('override reason is required (min 10 characters)', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-3');
    await page.goto('/dossiers/test-dossier-override-3');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Select assignee
    await dialog.locator('[data-testid="assignee-selector"]').click();
    await page.locator('[data-testid="staff-option"]').first().click();

    // Attempt to submit without reason
    await dialog.locator('[data-testid="submit-override"]').click();

    // Verify validation error
    const errorMessage = dialog.locator('[data-testid="reason-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/required|cannot be empty/i);

    // Enter too short reason (< 10 chars)
    await dialog.locator('[data-testid="override-reason"]').fill('Too short');
    await dialog.locator('[data-testid="submit-override"]').click();

    // Verify validation error for length
    await expect(errorMessage).toContainText(/at least 10 characters/i);

    // Enter valid reason
    await dialog
      .locator('[data-testid="override-reason"]')
      .fill('Urgent deadline requires specific expertise from this staff member');

    // Error should disappear
    await expect(errorMessage).not.toBeVisible();
  });

  test('successful override creates assignment with assigned_by field', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-4');
    await page.goto('/dossiers/test-dossier-override-4');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Select assignee
    await dialog.locator('[data-testid="assignee-selector"]').click();
    const targetStaff = page.locator('[data-staff-id="staff-translator-1"]');
    await targetStaff.click();

    // Enter override reason
    const reason = 'Staff member has domain expertise in statistical methodology';
    await dialog.locator('[data-testid="override-reason"]').fill(reason);

    // Submit override
    await dialog.locator('[data-testid="submit-override"]').click();

    // Wait for success notification
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      /assigned successfully|assignment created/i
    );

    // Verify dialog closed
    await expect(dialog).not.toBeVisible();

    // Verify assignment in database
    const assignment = await getAssignmentFromDB(page, 'test-dossier-override-4');
    expect(assignment).toBeTruthy();
    expect(assignment.assignee_id).toBe('staff-translator-1');
    expect(assignment.assigned_by).toBe(TEST_SUPERVISOR_ID);
    expect(assignment.override_reason).toBe(reason);
  });

  test('audit trail records override with reason and timestamp', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-5');
    await page.goto('/dossiers/test-dossier-override-5');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Perform override
    await dialog.locator('[data-testid="assignee-selector"]').click();
    await page.locator('[data-testid="staff-option"]').first().click();
    await dialog
      .locator('[data-testid="override-reason"]')
      .fill('Testing audit trail for manual override');
    await dialog.locator('[data-testid="submit-override"]').click();

    // Navigate to audit log page (as supervisor)
    await page.goto('/audit/assignments/test-dossier-override-5');

    // Verify audit entry exists
    const auditLog = page.locator('[data-testid="audit-log-entry"]').first();
    await expect(auditLog).toBeVisible();

    // Verify audit details
    await expect(auditLog).toContainText(/Manual Override/i);
    await expect(auditLog).toContainText(/supervisor@gastat.gov.sa/i); // Who performed override
    await expect(auditLog).toContainText(/Testing audit trail/i); // Override reason
    await expect(auditLog).toContainText(/\d{4}-\d{2}-\d{2}/); // Timestamp
  });

  test('override bypasses WIP limit with warning displayed', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    // Setup: Set staff to WIP limit (5/5)
    await setStaffAtWIPLimit(page, 'staff-translator-1', 5);

    await createTestWorkItem(page, 'test-dossier-override-wip');
    await page.goto('/dossiers/test-dossier-override-wip');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Select staff at WIP limit
    await dialog.locator('[data-testid="assignee-selector"]').click();
    const staffOption = page.locator('[data-staff-id="staff-translator-1"]');

    // Verify WIP warning badge shown
    const wipWarning = staffOption.locator('[data-testid="wip-warning"]');
    await expect(wipWarning).toBeVisible();
    await expect(wipWarning).toContainText(/5\/5|at limit|over capacity/i);

    // Select staff despite warning
    await staffOption.click();

    // Verify warning message in dialog
    const capacityWarning = dialog.locator('[data-testid="capacity-warning"]');
    await expect(capacityWarning).toBeVisible();
    await expect(capacityWarning).toContainText(
      /assignee is at WIP limit|will exceed capacity/i
    );

    // Enter reason and submit
    await dialog
      .locator('[data-testid="override-reason"]')
      .fill('Critical deadline - override WIP limit approved by supervisor');
    await dialog.locator('[data-testid="submit-override"]').click();

    // Verify assignment created despite WIP limit
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      /assigned successfully/i
    );

    const assignment = await getAssignmentFromDB(page, 'test-dossier-override-wip');
    expect(assignment).toBeTruthy();
    expect(assignment.assignee_id).toBe('staff-translator-1');

    // Verify audit log records WIP limit bypass
    await page.goto('/audit/assignments/test-dossier-override-wip');
    const auditLog = page.locator('[data-testid="audit-log-entry"]').first();
    await expect(auditLog).toContainText(/WIP limit bypassed|over capacity/i);
  });

  test('supervisor can only override within their unit (unit boundary enforcement)', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-unit');
    await page.goto('/dossiers/test-dossier-override-unit');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Open assignee selector
    await dialog.locator('[data-testid="assignee-selector"]').click();

    // Verify only staff from supervisor's unit shown
    const staffOptions = page.locator('[data-testid="staff-option"]');
    const count = await staffOptions.count();

    for (let i = 0; i < count; i++) {
      const option = staffOptions.nth(i);
      const unitBadge = option.locator('[data-testid="staff-unit"]');
      await expect(unitBadge).toContainText(/Translation Department/i);
    }

    // Verify staff from other units not shown
    await expect(page.locator('[data-staff-id="staff-lawyer"]')).not.toBeVisible(); // Legal Department
    await expect(page.locator('[data-staff-id="staff-analyst"]')).not.toBeVisible(); // Analysis Department
  });

  test('canceling override dialog does not create assignment', async () => {
    await login(page, TEST_SUPERVISOR_EMAIL, TEST_SUPERVISOR_PASSWORD);

    await createTestWorkItem(page, 'test-dossier-override-cancel');
    await page.goto('/dossiers/test-dossier-override-cancel');
    await page.click('[data-testid="assign-manually-button"]');

    const dialog = page.locator('[data-testid="manual-override-dialog"]');

    // Fill form partially
    await dialog.locator('[data-testid="assignee-selector"]').click();
    await page.locator('[data-testid="staff-option"]').first().click();
    await dialog.locator('[data-testid="override-reason"]').fill('Partially filled form');

    // Click cancel button
    await dialog.locator('[data-testid="cancel-override"]').click();

    // Verify dialog closed
    await expect(dialog).not.toBeVisible();

    // Verify no assignment created
    const assignment = await getAssignmentFromDB(page, 'test-dossier-override-cancel');
    expect(assignment).toBeNull();
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

async function createTestWorkItem(page: Page, workItemId: string) {
  await page.evaluate(async (id: string) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    await supabase.from('dossiers').insert({
      id: id,
      title_ar: 'ملف اختبار للتعيين اليدوي',
      title_en: 'Test Dossier for Manual Override',
      priority: 'normal',
      status: 'draft',
    });
  }, workItemId);
}

async function getAssignmentFromDB(page: Page, workItemId: string) {
  return await page.evaluate(async (id: string) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('work_item_id', id)
      .single();

    return data;
  }, workItemId);
}

async function setStaffAtWIPLimit(page: Page, staffId: string, limit: number) {
  await page.evaluate(
    async (args: { staffId: string; limit: number }) => {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      // Update staff WIP count to limit
      await supabase
        .from('staff_profiles')
        .update({
          current_assignment_count: args.limit,
          individual_wip_limit: args.limit,
        })
        .eq('id', args.staffId);

      // Create assignments to fill capacity
      for (let i = 0; i < args.limit; i++) {
        await supabase.from('assignments').insert({
          work_item_id: `fill-capacity-${args.staffId}-${i}`,
          work_item_type: 'ticket',
          assignee_id: args.staffId,
          priority: 'normal',
          status: 'assigned',
        });
      }
    },
    { staffId, limit }
  );
}

async function cleanupTestAssignments(page: Page) {
  await page.evaluate(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    await supabase.from('assignments').delete().like('work_item_id', 'test-dossier-override-%');
    await supabase
      .from('assignments')
      .delete()
      .like('work_item_id', 'fill-capacity-%');
    await supabase.from('dossiers').delete().like('id', 'test-dossier-override-%');

    // Reset staff WIP counts
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 0 })
      .eq('id', 'staff-translator-1');
  });
}
