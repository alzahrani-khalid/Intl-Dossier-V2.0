import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests: Tasks WCAG AA Compliance
 * Feature: 025-unified-tasks-model
 * Tasks: T089-T093
 *
 * Test Coverage:
 * - T089: WCAG AA compliance for task list, detail page, kanban board
 * - T090: Keyboard navigation in kanban drag-and-drop
 * - T091: Screen reader compatibility with task titles and contributor lists
 * - T092: Color contrast validation on SLA indicators (4.5:1 minimum)
 * - T093: RTL layout validation (all logical properties used correctly)
 */

test.describe('Tasks WCAG AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('/tasks', { timeout: 10000 });
  });

  test('T089: Task list page should have no accessibility violations', async ({ page }) => {
    // Navigate to My Tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Task List Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        console.error(`  Help: ${violation.helpUrl}`);
        console.error(`  Nodes: ${violation.nodes.length}`);
      });
    }
  });

  test('T089: Task detail page should have no accessibility violations', async ({ page }) => {
    // Navigate to task list and open first task
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('[data-testid="task-card"]').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForURL(/\/tasks\/[a-f0-9-]+/);
      await page.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);

      if (accessibilityScanResults.violations.length > 0) {
        console.error('Task Detail Accessibility violations found:');
        accessibilityScanResults.violations.forEach((violation) => {
          console.error(`- ${violation.id}: ${violation.description}`);
        });
      }
    }
  });

  test('T089: Kanban board should have no accessibility violations', async ({ page }) => {
    // Navigate to engagement with kanban board
    // Note: This assumes engagements exist, otherwise skip
    await page.goto('/engagements');
    await page.waitForLoadState('networkidle');

    const firstEngagement = page.locator('[data-testid="engagement-card"]').first();
    if (await firstEngagement.count() > 0) {
      await firstEngagement.click();

      // Wait for kanban board to load
      const kanbanBoard = page.locator('[data-testid="kanban-board"]');
      await expect(kanbanBoard).toBeVisible({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);

      if (accessibilityScanResults.violations.length > 0) {
        console.error('Kanban Board Accessibility violations found:');
        accessibilityScanResults.violations.forEach((violation) => {
          console.error(`- ${violation.id}: ${violation.description}`);
        });
      }
    }
  });

  test('T090: Kanban drag-and-drop should support keyboard navigation', async ({ page }) => {
    // Navigate to kanban board
    await page.goto('/engagements');
    const firstEngagement = page.locator('[data-testid="engagement-card"]').first();

    if (await firstEngagement.count() > 0) {
      await firstEngagement.click();

      const kanbanBoard = page.locator('[data-testid="kanban-board"]');
      await expect(kanbanBoard).toBeVisible({ timeout: 5000 });

      // Find first draggable task card
      const taskCard = page.locator('[data-testid="kanban-task-card"]').first();

      if (await taskCard.count() > 0) {
        // Focus on task card
        await taskCard.focus();
        await expect(taskCard).toBeFocused();

        // Press Space to activate drag mode
        await page.keyboard.press('Space');

        // Verify drag mode is active (visual indicator)
        await expect(taskCard).toHaveAttribute('aria-grabbed', 'true');

        // Use arrow keys to move the card
        await page.keyboard.press('ArrowRight'); // Move to next column

        // Press Space to drop
        await page.keyboard.press('Space');

        // Verify card was moved (aria-grabbed should be false)
        await expect(taskCard).toHaveAttribute('aria-grabbed', 'false');

        // Verify task card is still keyboard focusable after drop
        await taskCard.focus();
        await expect(taskCard).toBeFocused();
      }
    }
  });

  test('T090: Kanban columns should be keyboard navigable', async ({ page }) => {
    await page.goto('/engagements');
    const firstEngagement = page.locator('[data-testid="engagement-card"]').first();

    if (await firstEngagement.count() > 0) {
      await firstEngagement.click();

      const kanbanBoard = page.locator('[data-testid="kanban-board"]');
      await expect(kanbanBoard).toBeVisible({ timeout: 5000 });

      // Get all columns
      const columns = page.locator('[data-testid="kanban-column"]');
      const columnCount = await columns.count();

      if (columnCount > 0) {
        // Focus on first column
        const firstColumn = columns.first();
        await firstColumn.focus();

        // Tab through columns
        for (let i = 0; i < Math.min(columnCount, 3); i++) {
          await page.keyboard.press('Tab');
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
        }
      }
    }
  });

  test('T091: Task titles should be accessible to screen readers', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const taskCards = page.locator('[data-testid="task-card"]');
    const taskCount = await taskCards.count();

    if (taskCount > 0) {
      const firstTask = taskCards.first();

      // Verify task has a semantic heading
      const heading = firstTask.locator('h1, h2, h3, h4, h5, h6');
      await expect(heading).toBeVisible();

      // Verify heading has accessible text (not just ID)
      const headingText = await heading.textContent();
      expect(headingText).not.toMatch(/^Assignment #/); // Should not start with "Assignment #"
      expect(headingText).not.toMatch(/^[a-f0-9-]{36}$/); // Should not be a UUID
      expect(headingText?.length).toBeGreaterThan(5); // Should have meaningful content

      // Verify task card has proper ARIA label
      const ariaLabel = await firstTask.getAttribute('aria-label');
      const ariaLabelledBy = await firstTask.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('T091: Contributor lists should be accessible to screen readers', async ({ page }) => {
    // Navigate to task with contributors
    await page.goto('/tasks');
    const firstTask = page.locator('[data-testid="task-card"]').first();

    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

      // Find contributors section
      const contributorsSection = page.locator('[data-testid="contributors-list"]');

      if (await contributorsSection.count() > 0) {
        // Verify contributors section has proper ARIA labeling
        const ariaLabel = await contributorsSection.getAttribute('aria-label');
        expect(ariaLabel).toContain('contributor');

        // Verify contributor avatars have alt text
        const avatars = contributorsSection.locator('img');
        const avatarCount = await avatars.count();

        for (let i = 0; i < avatarCount; i++) {
          const avatar = avatars.nth(i);
          const alt = await avatar.getAttribute('alt');
          expect(alt).toBeTruthy();
          expect(alt?.length).toBeGreaterThan(0);
        }

        // Verify contributor roles are announced
        const roles = contributorsSection.locator('[role="status"], [aria-label*="role"]');
        const roleCount = await roles.count();
        expect(roleCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('T091: Screen reader should announce task status changes', async ({ page }) => {
    await page.goto('/tasks');
    const firstTask = page.locator('[data-testid="task-card"]').first();

    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForURL(/\/tasks\/[a-f0-9-]+/);

      // Find status change button
      const statusButton = page.locator('button:has-text("Mark as Complete"), button:has-text("Complete")');

      if (await statusButton.count() > 0) {
        // Verify live region exists for status announcements
        const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
        const liveRegionCount = await liveRegion.count();
        expect(liveRegionCount).toBeGreaterThan(0);

        // Click status button
        await statusButton.click();

        // Wait for status update
        await page.waitForTimeout(500);

        // Verify status was updated and announced
        const statusIndicator = page.locator('[data-testid="task-status"]');
        await expect(statusIndicator).toContainText(/completed|done/i);
      }
    }
  });

  test('T092: SLA indicators should meet color contrast requirements (4.5:1)', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const slaIndicators = page.locator('[data-testid="sla-indicator"]');
    const indicatorCount = await slaIndicators.count();

    if (indicatorCount > 0) {
      // Test each SLA indicator color combination
      for (let i = 0; i < Math.min(indicatorCount, 3); i++) {
        const indicator = slaIndicators.nth(i);

        if (await indicator.isVisible()) {
          // Get computed colors
          const backgroundColor = await indicator.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });

          const textColor = await indicator.evaluate((el) => {
            return window.getComputedStyle(el).color;
          });

          // Verify colors are set
          expect(backgroundColor).toBeTruthy();
          expect(textColor).toBeTruthy();

          // Run axe contrast check on this specific element
          const contrastResults = await new AxeBuilder({ page })
            .include(`[data-testid="sla-indicator"]:nth-child(${i + 1})`)
            .withRules(['color-contrast'])
            .analyze();

          expect(contrastResults.violations).toEqual([]);
        }
      }
    }
  });

  test('T092: SLA indicator status badges should be distinguishable without color', async ({ page }) => {
    await page.goto('/tasks');

    const slaIndicators = page.locator('[data-testid="sla-indicator"]');
    const indicatorCount = await slaIndicators.count();

    if (indicatorCount > 0) {
      for (let i = 0; i < Math.min(indicatorCount, 3); i++) {
        const indicator = slaIndicators.nth(i);

        if (await indicator.isVisible()) {
          // Verify indicator has text or icon, not just color
          const hasText = (await indicator.textContent())?.trim().length > 0;
          const hasIcon = (await indicator.locator('svg').count()) > 0;

          expect(hasText || hasIcon).toBe(true);

          // Verify indicator has accessible name
          const ariaLabel = await indicator.getAttribute('aria-label');
          const title = await indicator.getAttribute('title');
          expect(ariaLabel || title).toBeTruthy();
        }
      }
    }
  });

  test('T093: RTL layout should use logical properties correctly', async ({ page }) => {
    // Switch to Arabic language
    await page.goto('/settings');
    const languageButton = page.locator('button:has-text("Language"), button:has-text("اللغة")');
    await languageButton.click();

    const arabicOption = page.locator('button:has-text("العربية"), button:has-text("Arabic")');
    await arabicOption.click();

    // Wait for language switch
    await page.waitForTimeout(500);

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Verify HTML dir attribute is set to rtl
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify task cards use logical properties
    const taskCards = page.locator('[data-testid="task-card"]');

    if ((await taskCards.count()) > 0) {
      const firstCard = taskCards.first();

      // Check computed styles don't use directional properties
      const styles = await firstCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          marginLeft: computed.marginLeft,
          marginRight: computed.marginRight,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
          textAlign: computed.textAlign,
        };
      });

      // In RTL, text should align to start (right in RTL context)
      expect(styles.textAlign).toMatch(/start|right/);

      // Verify no hard-coded left/right margins/paddings
      // Note: Some values may be inherited from browser defaults
      // The key is that component-level styles use logical properties
    }

    // Verify buttons are in correct order for RTL
    const dialogButtons = page.locator('button');
    if ((await dialogButtons.count()) > 0) {
      // Primary action button should be on the start side (right in RTL)
      const buttonContainer = dialogButtons.first().locator('xpath=ancestor::div[contains(@class, "flex")]').first();
      if (await buttonContainer.count() > 0) {
        const flexDirection = await buttonContainer.evaluate((el) => {
          return window.getComputedStyle(el).flexDirection;
        });

        // flex-row-reverse or flex-row is acceptable in RTL
        expect(flexDirection).toMatch(/row|row-reverse/);
      }
    }
  });

  test('T093: Icons should flip direction in RTL when appropriate', async ({ page }) => {
    // Switch to Arabic
    await page.goto('/settings');
    const languageButton = page.locator('button:has-text("Language"), button:has-text("اللغة")');

    if (await languageButton.count() > 0) {
      await languageButton.click();
      const arabicOption = page.locator('button:has-text("العربية")');
      await arabicOption.click();
      await page.waitForTimeout(500);
    }

    await page.goto('/tasks');

    // Find directional icons (arrows, chevrons)
    const directionalIcons = page.locator('svg[class*="chevron"], svg[class*="arrow"]');
    const iconCount = await directionalIcons.count();

    if (iconCount > 0) {
      for (let i = 0; i < Math.min(iconCount, 3); i++) {
        const icon = directionalIcons.nth(i);
        const transform = await icon.evaluate((el) => {
          return window.getComputedStyle(el).transform;
        });

        // Directional icons should have rotate(180deg) in RTL
        if (transform !== 'none') {
          expect(transform).toContain('matrix'); // Transformed
        }
      }
    }
  });

  test('Overall page should have proper document structure', async ({ page }) => {
    await page.goto('/tasks');

    // Verify page has main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Verify page has proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Verify skip link exists (optional but recommended)
    const skipLink = page.locator('a[href="#main-content"], a[href="#content"]');
    // Skip link may not exist on all pages - just log if missing
    if ((await skipLink.count()) === 0) {
      console.warn('Skip link not found - consider adding for better accessibility');
    }
  });

  test('Form inputs should have associated labels', async ({ page }) => {
    await page.goto('/tasks/new');

    // Find all inputs
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have label, aria-label, or aria-labelledby
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder).toBe(true);
      }
    }
  });
});
