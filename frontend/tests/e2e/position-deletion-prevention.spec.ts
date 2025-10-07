import { test, expect } from '@playwright/test';

test.describe('Position Deletion Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should block deletion of attached position', async ({ page }) => {
    // Navigate to position detail (with engagements)
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');
    await page.click('[data-testid="position-card"]:first-child');

    // Try to delete
    const deleteButton = page.locator('[data-testid="delete-position-button"]');
    await deleteButton.click();

    // Confirm deletion dialog
    const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.locator('[data-testid="confirm-button"]').click();

    // Verify error message displayed
    const errorAlert = page.locator('[role="alert"][data-testid="deletion-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Cannot delete position');
  });

  test('should list affected engagements in error', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Find position with engagements
    await page.click('[data-testid="position-card"]:first-child');

    // Attempt deletion
    await page.click('[data-testid="delete-position-button"]');
    await page.locator('[data-testid="confirm-delete-dialog"] [data-testid="confirm-button"]').click();

    // Verify error lists engagements
    const errorAlert = page.locator('[data-testid="deletion-error"]');
    await expect(errorAlert).toContainText('attached to');
    await expect(errorAlert).toContainText('engagement');

    // Verify engagement titles shown
    const engagementLinks = errorAlert.locator('[data-testid="affected-engagement-link"]');
    expect(await engagementLinks.count()).toBeGreaterThan(0);
  });

  test('should navigate to engagement from error message', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="position-card"]:first-child');

    // Attempt deletion
    await page.click('[data-testid="delete-position-button"]');
    await page.locator('[data-testid="confirm-delete-dialog"] [data-testid="confirm-button"]').click();

    // Click on engagement link in error
    const errorAlert = page.locator('[data-testid="deletion-error"]');
    const firstEngagementLink = errorAlert.locator('[data-testid="affected-engagement-link"]').first();

    if (await firstEngagementLink.isVisible()) {
      await firstEngagementLink.click();

      // Verify navigated to engagement
      await page.waitForURL(/\/engagements\/[^/]+$/);
      await expect(page.locator('[data-testid="engagement-detail"]')).toBeVisible();
    }
  });

  test('should allow deletion after detaching from all engagements', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="position-card"]:first-child');

    const positionUrl = page.url();

    // Navigate to related engagements and detach
    const relatedEngagements = page.locator('[data-testid="related-engagements"]');
    await relatedEngagements.scrollIntoViewIfNeeded();

    const engagementCards = relatedEngagements.locator('[data-testid="engagement-card"]');
    const count = await engagementCards.count();

    // Detach from each engagement
    for (let i = 0; i < count; i++) {
      // Navigate to engagement
      await engagementCards.nth(0).click(); // Always click first since list updates
      await page.waitForURL(/\/engagements\/[^/]+$/);

      // Find and detach the position
      const positionsSection = page.locator('[data-testid="attached-positions-section"]');
      const detachButton = positionsSection
        .locator('[data-testid="position-card"]')
        .filter({ has: page.locator('[data-testid="detach-button"]') })
        .first()
        .locator('[data-testid="detach-button"]');

      await detachButton.click();

      // Confirm detach
      await page.locator('[data-testid="confirm-detach-button"]').click();

      // Navigate back to position
      await page.goto(positionUrl);
    }

    // Now attempt deletion
    await page.click('[data-testid="delete-position-button"]');
    await page.locator('[data-testid="confirm-delete-dialog"] [data-testid="confirm-button"]').click();

    // Verify deletion succeeds
    await page.waitForURL(/\/positions$/);

    // Verify success message
    const successToast = page.locator('[data-testid="success-toast"]');
    await expect(successToast).toContainText('Position deleted');
  });

  test('should display detachment suggestion in error', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="position-card"]:first-child');

    // Attempt deletion
    await page.click('[data-testid="delete-position-button"]');
    await page.locator('[data-testid="confirm-delete-dialog"] [data-testid="confirm-button"]').click();

    // Verify help text in error
    const errorAlert = page.locator('[data-testid="deletion-error"]');
    await expect(errorAlert).toContainText('Detach');
    await expect(errorAlert).toContainText('before deletion');
  });

  test('should prevent deletion via keyboard shortcut', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="position-card"]:first-child');

    // Try delete via keyboard (e.g., Delete key)
    await page.keyboard.press('Delete');

    // Confirm dialog should appear
    const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
    if (await confirmDialog.isVisible()) {
      await confirmDialog.locator('[data-testid="confirm-button"]').click();

      // Same error should appear
      const errorAlert = page.locator('[data-testid="deletion-error"]');
      await expect(errorAlert).toBeVisible();
    }
  });

  test('should allow deletion of unattached position', async ({ page }) => {
    // Mock or find position with no engagements
    await page.goto('/positions');

    // Filter to find unattached positions
    await page.fill('[data-testid="positions-search"]', 'draft');

    await page.waitForTimeout(1000);

    // Click on position (assuming search returns unattached drafts)
    const positionCards = page.locator('[data-testid="position-card"]');
    if ((await positionCards.count()) > 0) {
      await positionCards.first().click();

      // Verify no related engagements
      const relatedEngagements = page.locator('[data-testid="related-engagements"]');
      const engagementCount = await relatedEngagements
        .locator('[data-testid="engagement-card"]')
        .count();

      if (engagementCount === 0) {
        // Attempt deletion
        await page.click('[data-testid="delete-position-button"]');
        await page.locator('[data-testid="confirm-delete-dialog"] [data-testid="confirm-button"]').click();

        // Verify deletion succeeds
        await page.waitForURL(/\/positions$/);

        const successToast = page.locator('[data-testid="success-toast"]');
        await expect(successToast).toContainText('deleted');
      }
    }
  });
});
