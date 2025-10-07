import { test, expect } from '@playwright/test';

test.describe('100 Position Attachment Limit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should display current attachment count', async ({ page }) => {
    // Navigate to engagement
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify attachment counter
    const counter = page.locator('[data-testid="attachment-count"]');
    await counter.scrollIntoViewIfNeeded();
    await expect(counter).toBeVisible();

    const countText = await counter.textContent();
    expect(countText).toMatch(/\d+\s*\/\s*100/); // Format: "5 / 100"
  });

  test('should block attachment when limit reached', async ({ page }) => {
    // Mock engagement with 100 positions
    await page.route('**/engagement-positions*', (route) => {
      if (route.request().method() === 'GET') {
        const positions = Array(100)
          .fill(null)
          .map((_, i) => ({
            id: `pos-${i}`,
            position_id: `position-${i}`,
            title: `Position ${i}`,
          }));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(positions),
        });
      } else {
        route.continue();
      }
    });

    // Mock attachment failure
    await page.route('**/engagements/*/positions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'ATTACHMENT_LIMIT_EXCEEDED',
            message: 'Cannot attach more than 100 positions to an engagement',
            current_count: 100,
            max_limit: 100,
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Try to attach another position
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.waitFor({ state: 'visible' });

    await dialog.locator('[data-testid="dialog-position-card"]').first().locator('input[type="checkbox"]').check();
    await dialog.locator('[data-testid="attach-selected-button"]').click();

    // Verify error message
    const errorAlert = page.locator('[role="alert"][data-testid="attachment-limit-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('100 positions');
    await expect(errorAlert).toContainText('limit');
  });

  test('should disable attach button when at limit', async ({ page }) => {
    // Mock 100 positions
    await page.route('**/engagement-positions*', (route) => {
      const positions = Array(100)
        .fill(null)
        .map((_, i) => ({ id: `pos-${i}`, title: `Position ${i}` }));

      route.fulfill({
        status: 200,
        body: JSON.stringify(positions),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify add button disabled
    const addButton = page.locator('[data-testid="add-position-button"]');
    await expect(addButton).toBeDisabled();

    // Verify tooltip explains why
    await addButton.hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toContainText('100 positions');
    await expect(tooltip).toContainText('maximum');
  });

  test('should suggest detaching positions in error', async ({ page }) => {
    // Mock limit error
    await page.route('**/engagements/*/positions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: 'ATTACHMENT_LIMIT_EXCEEDED',
            message: 'Cannot attach more than 100 positions',
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Try to attach
    await page.click('[data-testid="add-position-button"]');
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.locator('[data-testid="dialog-position-card"]').first().locator('input[type="checkbox"]').check();
    await dialog.locator('[data-testid="attach-selected-button"]').click();

    // Verify error guidance
    const errorAlert = page.locator('[data-testid="attachment-limit-error"]');
    await expect(errorAlert).toContainText('Detach');
    await expect(errorAlert).toContainText('before adding');
  });

  test('should update counter when attaching/detaching', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Get initial count
    const counter = page.locator('[data-testid="attachment-count"]');
    const initialText = await counter.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Attach a position
    await page.click('[data-testid="add-position-button"]');
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.locator('[data-testid="dialog-position-card"]').first().locator('input[type="checkbox"]').check();
    await dialog.locator('[data-testid="attach-selected-button"]').click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify counter incremented
    const newText = await counter.textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBe(initialCount + 1);
  });

  test('should allow attachment after detaching below limit', async ({ page }) => {
    // Mock 99 positions
    await page.route('**/engagement-positions*', (route) => {
      if (route.request().method() === 'GET') {
        const positions = Array(99)
          .fill(null)
          .map((_, i) => ({ id: `pos-${i}`, title: `Position ${i}` }));

        route.fulfill({
          status: 200,
          body: JSON.stringify(positions),
        });
      } else {
        route.continue();
      }
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify can attach (99 < 100)
    const addButton = page.locator('[data-testid="add-position-button"]');
    await expect(addButton).toBeEnabled();
  });

  test('should validate limit before opening attach dialog', async ({ page }) => {
    // Mock 100 positions
    await page.route('**/engagement-positions*', (route) => {
      const positions = Array(100)
        .fill(null)
        .map((_, i) => ({ id: `pos-${i}` }));

      route.fulfill({
        status: 200,
        body: JSON.stringify(positions),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Click add button
    const addButton = page.locator('[data-testid="add-position-button"]');

    if (await addButton.isEnabled()) {
      await addButton.click();
    }

    // Dialog should either not open or show error
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    const isDialogVisible = await dialog.isVisible();

    if (!isDialogVisible) {
      // Verify error toast
      const toast = page.locator('[data-testid="limit-toast"]');
      await expect(toast).toContainText('100 positions');
    }
  });

  test('should display visual warning approaching limit', async ({ page }) => {
    // Mock 95 positions (close to limit)
    await page.route('**/engagement-positions*', (route) => {
      const positions = Array(95)
        .fill(null)
        .map((_, i) => ({ id: `pos-${i}` }));

      route.fulfill({
        status: 200,
        body: JSON.stringify(positions),
      });
    });

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Verify warning indicator
    const counter = page.locator('[data-testid="attachment-count"]');

    // Counter should have warning style (e.g., amber/orange color)
    const warningBadge = counter.locator('[data-warning="true"]');
    await expect(warningBadge).toBeVisible();
  });
});
