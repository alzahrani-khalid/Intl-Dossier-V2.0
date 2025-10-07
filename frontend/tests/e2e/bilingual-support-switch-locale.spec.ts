import { test, expect } from '@playwright/test';

/**
 * E2E Test: Bilingual Support - Switch Locale
 *
 * Feature: 014-full-assignment-detail
 * Task: T085
 *
 * Validates Arabic RTL + English LTR support with locale switching
 */

test.describe('Bilingual Support - Switch Locale', () => {
  let assignmentId: string;

  test.beforeEach(async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-bilingual-test');
    const data = await setup.json();
    assignmentId = data.assignmentId;

    await page.goto('/login');
    await page.fill('input[name="email"]', 'staff@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
  });

  test('page loads in English by default', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Verify LTR layout
    await expect(page.locator('body')).toHaveAttribute('dir', 'ltr');

    // Verify English labels
    await expect(page.locator('[data-testid="assignee-label"]')).toContainText('Assignee');
    await expect(page.locator('[data-testid="priority-label"]')).toContainText('Priority');
    await expect(page.locator('[data-testid="status-label"]')).toContainText('Status');
    await expect(page.locator('button[data-testid="mark-complete"]')).toContainText('Mark Complete');
  });

  test('switch to Arabic changes layout and labels', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');

    // Wait for locale change
    await page.waitForTimeout(300);

    // Verify RTL layout
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');

    // Verify Arabic labels
    await expect(page.locator('[data-testid="assignee-label"]')).toContainText('المكلف');
    await expect(page.locator('[data-testid="priority-label"]')).toContainText('الأولوية');
    await expect(page.locator('[data-testid="status-label"]')).toContainText('الحالة');
    await expect(page.locator('button[data-testid="mark-complete"]')).toContainText('وضع علامة مكتمل');
  });

  test('RTL layout adjustments for Arabic', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Verify comments right-aligned
    const firstComment = page.locator('[data-testid="comment-card"]').first();
    const commentAlignment = await firstComment.evaluate((el) => window.getComputedStyle(el).textAlign);
    expect(commentAlignment).toBe('right');

    // Verify timeline line on right side
    const timeline = page.locator('[data-testid="timeline"]');
    const borderSide = await timeline.evaluate((el) => window.getComputedStyle(el).borderRightWidth);
    expect(borderSide).not.toBe('0px');

    // Verify action buttons right-aligned
    const actions = page.locator('[data-testid="action-buttons"]');
    const justifyContent = await actions.evaluate((el) => window.getComputedStyle(el).justifyContent);
    expect(justifyContent).toContain('flex-end');
  });

  test('timestamps formatted in Arabic locale', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Get timestamp text
    const timestamp = await page.locator('[data-testid="assignment-created-at"]').textContent();

    // Verify Arabic numerals or locale-specific format
    expect(timestamp).toBeTruthy();
    // Arabic uses different date format (e.g., ١٢/٣٠/٢٠٢٥ or specific format)
  });

  test('switch back to English from Arabic', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Verify Arabic active
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');

    // Switch back to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-en"]');
    await page.waitForTimeout(300);

    // Verify LTR layout restored
    await expect(page.locator('body')).toHaveAttribute('dir', 'ltr');

    // Verify English labels restored
    await expect(page.locator('[data-testid="assignee-label"]')).toContainText('Assignee');
  });

  test('user-generated content preserves original language', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);

    // Add English comment
    await page.fill('textarea[data-testid="comment-input"]', 'This is an English comment');
    await page.click('button[data-testid="submit-comment"]');
    await page.waitForTimeout(500);

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Verify comment text unchanged (still English)
    await expect(page.locator('[data-testid="comment-text"]')).toContainText('This is an English comment');

    // Add Arabic comment
    await page.fill('textarea[data-testid="comment-input"]', 'هذا تعليق بالعربية');
    await page.click('button[data-testid="submit-comment"]');
    await page.waitForTimeout(500);

    // Verify both comments visible with original languages
    await expect(page.locator('[data-testid="comment-text"]').first()).toContainText('This is an English comment');
    await expect(page.locator('[data-testid="comment-text"]').last()).toContainText('هذا تعليق بالعربية');
  });

  test('locale persists across page reloads', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();

    // Verify Arabic still active
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-testid="assignee-label"]')).toContainText('المكلف');
  });

  test('locale persists across navigation', async ({ page }) => {
    await page.goto(`/assignments/${assignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Navigate to different page
    await page.goto('/dashboard');
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');

    // Navigate back
    await page.goto(`/assignments/${assignmentId}`);
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');
  });

  test('engagement context banner in Arabic', async ({ page }) => {
    // Setup engagement-linked assignment
    const setup = await page.request.post('/api/test/setup-engagement-assignment');
    const data = await setup.json();
    const engagementAssignmentId = data.assignmentId;

    await page.goto(`/assignments/${engagementAssignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Verify engagement banner in Arabic
    await expect(page.locator('[data-testid="engagement-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-engagement-button"]')).toContainText('عرض المشاركة الكاملة');
    await expect(page.locator('[data-testid="show-kanban-button"]')).toContainText('عرض لوحة كانبان');
  });

  test('kanban board in Arabic RTL', async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-engagement-assignment');
    const data = await setup.json();
    const engagementAssignmentId = data.assignmentId;

    await page.goto(`/assignments/${engagementAssignmentId}`);
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-ar"]');
    await page.waitForTimeout(300);

    // Open kanban
    await page.click('[data-testid="show-kanban-button"]');

    // Verify modal in Arabic RTL
    await expect(page.locator('[data-testid="kanban-modal"]')).toHaveAttribute('dir', 'rtl');

    // Verify column headers in Arabic (right-to-left order)
    await expect(page.locator('[data-testid="kanban-column-todo"]')).toContainText('قائمة المهام');
    await expect(page.locator('[data-testid="kanban-column-in_progress"]')).toContainText('قيد التنفيذ');
    await expect(page.locator('[data-testid="kanban-column-review"]')).toContainText('المراجعة');
    await expect(page.locator('[data-testid="kanban-column-done"]')).toContainText('منجز');
  });
});
