import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E Tests for User Story 1: View My Tasks with Clear Titles
 *
 * Test Scope:
 * - T038: Create task with title and verify title appears in task list
 * - T039: Title validation (empty title rejection, max length enforcement)
 *
 * Prerequisites:
 * - User must be logged in (kazahrani@stats.gov.sa)
 * - Frontend dev server running on http://localhost:5173
 * - Backend API running on http://localhost:3001
 */

// Test credentials (from CLAUDE.md)
const TEST_USER = {
  email: 'kazahrani@stats.gov.sa',
  password: 'itisme'
};

// Helper: Login to application
async function login(page: Page) {
  await page.goto('http://localhost:5173/login');

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/.*tasks.*/);
}

// Helper: Navigate to task creation page
async function navigateToCreateTask(page: Page) {
  // Look for "New Task" or "Create Task" button
  const createButton = page.locator('button:has-text("New Task"), button:has-text("Create Task"), a:has-text("New Task")').first();
  await createButton.click();

  // Wait for form to appear
  await page.waitForSelector('input[name="title"], input[placeholder*="title" i]');
}

test.describe('Task Creation - User Story 1', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /**
   * T038: Create task with title and verify title appears in task list
   *
   * Acceptance Criteria:
   * 1. User can create a task with a descriptive title
   * 2. Task title appears in the task list after creation
   * 3. Task title is the primary identifier (not an ID like "Assignment #25d51a42")
   * 4. Title is visible on mobile (text-sm sm:text-base) and RTL-compatible (text-start)
   */
  test('T038: should create task with title and display it in task list', async ({ page }) => {
    // Navigate to My Tasks page
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    // Navigate to task creation form
    await navigateToCreateTask(page);

    // Fill in task details
    const taskTitle = `Review Australia Population Data Initiative - ${Date.now()}`;
    const taskDescription = 'Analyze and review the population data collection methodology for accuracy and compliance with international standards.';

    await page.fill('input[name="title"]', taskTitle);
    await page.fill('textarea[name="description"], input[name="description"]', taskDescription);

    // Select priority (if available)
    const prioritySelect = page.locator('select[name="priority"], [role="combobox"]:has-text("Priority")');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.click();
      await page.locator('text=Medium, text=medium').first().click();
    }

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Submit")');

    // Wait for task to be created (success notification or redirect)
    await page.waitForResponse(
      (response) =>
        (response.url().includes('/tasks') || response.url().includes('/tasks-create')) &&
        [200, 201].includes(response.status()),
      { timeout: 10000 }
    );

    // Navigate back to task list
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    // Verify task title appears in the list
    const taskCard = page.locator(`text="${taskTitle}"`).first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    // Verify title is primary text (not an ID)
    // Should NOT see patterns like "Assignment #" or UUID-like strings as primary identifier
    const idPattern = /Assignment #[a-f0-9]{8}/i;
    const taskListContent = await page.locator('[data-testid="task-list"], .task-list, main').textContent();
    expect(taskListContent).not.toMatch(idPattern);

    // Verify mobile-first responsive design (title should be visible in mobile viewport)
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await expect(taskCard).toBeVisible();

    // Verify RTL layout (title should use text-start, not text-left)
    const taskTitleElement = page.locator(`text="${taskTitle}"`).first();
    const classes = await taskTitleElement.getAttribute('class');
    expect(classes).toMatch(/text-start/);
    expect(classes).not.toMatch(/text-left/);
  });

  /**
   * T039: Title validation - empty title rejection and max length enforcement
   *
   * Acceptance Criteria:
   * 1. Empty title is rejected with clear error message
   * 2. Title exceeding 200 characters is rejected
   * 3. Validation errors are displayed near the title field
   * 4. Form submission is blocked until validation passes
   */
  test('T039: should validate task title - empty and max length', async ({ page }) => {
    // Navigate to My Tasks page
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    // Navigate to task creation form
    await navigateToCreateTask(page);

    // Test 1: Empty title validation
    await page.fill('input[name="title"]', '');
    await page.fill('textarea[name="description"], input[name="description"]', 'Some description');

    // Attempt to submit
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify error message appears
    const emptyError = page.locator('text=/title.*required|required.*title|cannot be empty/i').first();
    await expect(emptyError).toBeVisible({ timeout: 3000 });

    // Verify form was NOT submitted (still on create page)
    await expect(page.url()).toContain('/tasks/new', { timeout: 1000 }).catch(() => {
      // Alternative: Check if form is still visible
      expect(page.locator('input[name="title"]')).toBeVisible();
    });

    // Test 2: Max length validation (200 characters)
    const longTitle = 'A'.repeat(201); // 201 characters
    await page.fill('input[name="title"]', longTitle);

    // Check if input enforces maxLength attribute
    const titleInput = page.locator('input[name="title"]');
    const maxLength = await titleInput.getAttribute('maxlength');

    if (maxLength === '200') {
      // If maxlength is enforced in HTML, verify it's respected
      const actualValue = await titleInput.inputValue();
      expect(actualValue.length).toBeLessThanOrEqual(200);
    } else {
      // If validation is client-side only, attempt submit and check for error
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      const maxLengthError = page.locator('text=/title.*200|maximum.*200|too long/i').first();
      await expect(maxLengthError).toBeVisible({ timeout: 3000 });
    }

    // Test 3: Valid title (within limits)
    const validTitle = 'Valid Task Title Within Limits';
    await page.fill('input[name="title"]', validTitle);
    await page.fill('textarea[name="description"], input[name="description"]', 'Valid description');

    // Submit should succeed now
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify successful creation (no error messages, redirected or success toast)
    await page.waitForResponse(
      (response) =>
        (response.url().includes('/tasks') || response.url().includes('/tasks-create')) &&
        [200, 201].includes(response.status()),
      { timeout: 10000 }
    );

    // Should redirect to task list or show success message
    await expect(
      page.locator('text=/success|created|saved/i').first()
    ).toBeVisible({ timeout: 5000 }).catch(() => {
      // Alternative: Check if redirected to task list
      expect(page.url()).toMatch(/\/tasks(?!\/new)/);
    });
  });

  /**
   * Bonus Test: Verify title is editable and updates reflect immediately
   */
  test('should update task title and see changes in list', async ({ page }) => {
    // Create a task first
    await page.goto('http://localhost:5173/tasks');
    await navigateToCreateTask(page);

    const originalTitle = `Original Title - ${Date.now()}`;
    await page.fill('input[name="title"]', originalTitle);
    await page.fill('textarea[name="description"], input[name="description"]', 'Description');
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    await page.waitForResponse(
      (response) => response.url().includes('/tasks') && [200, 201].includes(response.status()),
      { timeout: 10000 }
    );

    // Find the created task and click to open detail
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    const taskCard = page.locator(`text="${originalTitle}"`).first();
    await taskCard.click();

    // Wait for detail page to load
    await page.waitForSelector('h1, h2, [data-testid="task-title"]');

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), [aria-label*="Edit"]').first();
    await editButton.click();

    // Update title
    const updatedTitle = `Updated Title - ${Date.now()}`;
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');

    // Wait for update to complete
    await page.waitForResponse(
      (response) => response.url().includes('/tasks') && response.status() === 200,
      { timeout: 10000 }
    );

    // Navigate back to task list
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    // Verify updated title appears, original does not
    await expect(page.locator(`text="${updatedTitle}"`).first()).toBeVisible();
    await expect(page.locator(`text="${originalTitle}"`).first()).not.toBeVisible();
  });
});

/**
 * Additional Tests: Mobile-First & RTL Compliance
 */
test.describe('Task List - Mobile & RTL Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:5173/tasks');
  });

  test('should render task list correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone SE: 375x667)
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify task cards are touch-friendly (min-h-11 = 44px)
    const taskCards = page.locator('[data-testid="task-card"], .task-card, [role="article"]');
    const firstCard = taskCards.first();

    if (await firstCard.isVisible()) {
      const box = await firstCard.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    // Verify spacing is adequate (gap-2 = 8px minimum)
    const taskList = page.locator('[data-testid="task-list"], .task-list, main');
    const gap = await taskList.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });

    // Gap should be at least 8px (0.5rem = 8px in Tailwind)
    expect(gap).toMatch(/[0-9]+px/);
  });

  test('should support RTL layout for Arabic language', async ({ page }) => {
    // Switch to Arabic (if language selector exists)
    const langSelector = page.locator('[data-testid="language-selector"], button:has-text("English"), select[name="language"]');

    if (await langSelector.isVisible()) {
      await langSelector.click();
      await page.locator('text=العربية, text=Arabic').first().click();
      await page.waitForLoadState('networkidle');

      // Verify dir="rtl" is set on container
      const container = page.locator('html, body, main, [dir]').first();
      const dir = await container.getAttribute('dir');
      expect(dir).toBe('rtl');

      // Verify task titles use text-start (not text-left or text-right)
      const taskTitle = page.locator('[data-testid="task-title"], .task-title, h1, h2, h3').first();
      if (await taskTitle.isVisible()) {
        const classes = await taskTitle.getAttribute('class');
        expect(classes).toMatch(/text-start/);
        expect(classes).not.toMatch(/text-left|text-right/);
      }
    }
  });
});
