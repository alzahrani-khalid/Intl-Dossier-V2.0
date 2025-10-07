import { test, expect } from '@playwright/test';

/**
 * E2E Test: Real-time Updates in Two Windows
 *
 * Feature: 014-full-assignment-detail
 * Task: T084
 *
 * Validates < 1 second latency for all real-time updates across multiple browser windows
 */

test.describe('Real-time Updates - Two Windows', () => {
  let assignmentId: string;

  test.beforeEach(async ({ page }) => {
    const setup = await page.request.post('/api/test/setup-realtime-test');
    const data = await setup.json();
    assignmentId = data.assignmentId;
  });

  test('comment appears in second window < 1 second', async ({ page, context }) => {
    const context2 = await context.browser()?.newContext();
    if (!context2) throw new Error('Failed to create context');
    const page2 = await context2.newPage();

    try {
      // Login both windows
      await Promise.all([
        page.goto('/login'),
        page2.goto('/login')
      ]);

      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.fill('input[name="email"]', 'staff@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      await Promise.all([
        page.goto(`/assignments/${assignmentId}`),
        page2.goto(`/assignments/${assignmentId}`)
      ]);

      // Add comment in window 1
      const startTime = Date.now();
      await page.fill('textarea[data-testid="comment-input"]', 'Real-time test comment');
      await page.click('button[data-testid="submit-comment"]');

      // Wait for comment in window 2
      await page2.waitForSelector('[data-testid="comment-text"]:has-text("Real-time test comment")', { timeout: 1000 });
      const latency = Date.now() - startTime;

      // Verify latency < 1 second
      expect(latency).toBeLessThan(1000);
    } finally {
      await page2.close();
      await context2.close();
    }
  });

  test('checklist completion updates in real-time', async ({ page, context }) => {
    const context2 = await context.browser()?.newContext();
    if (!context2) throw new Error('Failed to create context');
    const page2 = await context2.newPage();

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'staff@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      await page.goto(`/assignments/${assignmentId}`);
      await page2.goto(`/assignments/${assignmentId}`);

      // Complete checklist item in window 1
      const startTime = Date.now();
      await page.click('input[data-testid="checklist-item-1"]');

      // Wait for update in window 2
      await page2.waitForSelector('input[data-testid="checklist-item-1"]:checked', { timeout: 1000 });
      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(1000);

      // Verify progress updated
      await expect(page2.locator('[data-testid="checklist-progress"]')).not.toContainText('0%');
    } finally {
      await page2.close();
      await context2.close();
    }
  });

  test('reactions update in real-time', async ({ page, context }) => {
    const context2 = await context.browser()?.newContext();
    if (!context2) throw new Error('Failed to create context');
    const page2 = await context2.newPage();

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'supervisor@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      await page.goto(`/assignments/${assignmentId}`);
      await page2.goto(`/assignments/${assignmentId}`);

      // Add reaction in window 2
      const startTime = Date.now();
      await page2.hover('[data-testid="comment-1"]');
      await page2.click('button[data-testid="reaction-thumbs-up"]');

      // Wait for reaction in window 1
      await page.waitForSelector('[data-testid="reaction-count-thumbs-up"]:has-text("1")', { timeout: 1000 });
      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(1000);
    } finally {
      await page2.close();
      await context2.close();
    }
  });

  test('escalation updates in real-time', async ({ page, context }) => {
    const context2 = await context.browser()?.newContext();
    if (!context2) throw new Error('Failed to create context');
    const page2 = await context2.newPage();

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'staff@test.com');
      await page.fill('input[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'supervisor@test.com');
      await page2.fill('input[name="password"]', 'testpassword');
      await page2.click('button[type="submit"]');

      await page.goto(`/assignments/${assignmentId}`);
      await page2.goto(`/assignments/${assignmentId}`);

      // Escalate in window 1
      const startTime = Date.now();
      await page.click('button[data-testid="escalate-assignment"]');
      await page.fill('textarea[data-testid="escalation-reason"]', 'Urgent escalation');
      await page.click('button[data-testid="confirm-escalate"]');

      // Wait for update in window 2 (supervisor window)
      await page2.waitForSelector('[data-testid="notification-toast"]', { timeout: 1000 });
      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(1000);

      // Verify observer added
      await expect(page2.locator('[data-testid="observers-list"]')).toContainText('Test Supervisor');
    } finally {
      await page2.close();
      await context2.close();
    }
  });
});
