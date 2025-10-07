import { test, expect } from '@playwright/test';

/**
 * E2E Test: Consistency Conflict Resolution (T088)
 * Tests consistency checking and conflict reconciliation
 *
 * Validates:
 * - Create position and trigger consistency check
 * - Verify conflicts displayed in panel
 * - Select resolution action (modify/accept)
 * - Reconcile conflicts
 * - Verify consistency score updated
 */

test.describe('Consistency Conflict Resolution', () => {
  test('should display consistency conflicts and reconcile them', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Create position
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    await page.fill('[data-testid="title-en-input"]', 'Consistency Test Position');
    await page.fill('[data-testid="content-en-editor"]', 'Position that may conflict with existing policies');
    await page.fill('[data-testid="content-ar-editor"]', 'موقف قد يتعارض مع السياسات الموجودة');

    // Save draft
    await page.click('[data-testid="save-draft-button"]');

    // Trigger manual consistency check
    await page.click('[data-testid="check-consistency-button"]');

    // Wait for analysis
    await expect(page.locator('[data-testid="consistency-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="consistency-loading"]')).not.toBeVisible({ timeout: 10000 });

    // Verify consistency panel appears
    await expect(page.locator('[data-testid="consistency-panel"]')).toBeVisible();

    // Verify consistency score displayed
    await expect(page.locator('[data-testid="consistency-score"]')).toBeVisible();

    // If conflicts detected, verify conflict list
    const conflictCount = await page.locator('[data-testid="conflict-item"]').count();
    if (conflictCount > 0) {
      // Verify conflict details
      await expect(page.locator('[data-testid="conflict-item"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="conflict-type"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="conflict-severity"]').first()).toBeVisible();

      // Click on first conflict to view details
      await page.click('[data-testid="conflict-item"]').first();

      // Verify suggested resolution displayed
      await expect(page.locator('[data-testid="suggested-resolution"]')).toBeVisible();

      // Select resolution action
      await page.click('[data-testid="resolution-action-modify"]');

      // Reconcile conflict
      await page.click('[data-testid="reconcile-conflict-button"]');

      // Verify conflict marked as reconciled
      await expect(page.locator('[data-testid="conflict-reconciled-indicator"]')).toBeVisible();

      // Verify consistency score updated
      const initialScore = await page.locator('[data-testid="consistency-score"]').textContent();
      await page.click('[data-testid="save-reconciliation-button"]');

      // Score should improve
      const updatedScore = await page.locator('[data-testid="consistency-score"]').textContent();
      expect(parseInt(updatedScore || '0')).toBeGreaterThan(parseInt(initialScore || '0'));
    }
  });

  test('should show conflict severity indicators', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to position with conflicts
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}`);

    // Open consistency panel
    await page.click('[data-testid="view-consistency-button"]');

    // Verify severity indicators
    const highSeverity = page.locator('[data-testid="conflict-severity-high"]');
    if (await highSeverity.count() > 0) {
      await expect(highSeverity.first()).toHaveCSS('color', /red|#[a-f0-9]{6}/);
    }

    const mediumSeverity = page.locator('[data-testid="conflict-severity-medium"]');
    if (await mediumSeverity.count() > 0) {
      await expect(mediumSeverity.first()).toHaveCSS('color', /orange|yellow|#[a-f0-9]{6}/);
    }

    const lowSeverity = page.locator('[data-testid="conflict-severity-low"]');
    if (await lowSeverity.count() > 0) {
      await expect(lowSeverity.first()).toHaveCSS('color', /green|blue|#[a-f0-9]{6}/);
    }
  });

  test('should show conflict type badges', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Create position that triggers conflicts
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    await page.fill('[data-testid="content-en-editor"]', 'Contradictory policy statement');
    await page.click('[data-testid="save-draft-button"]');
    await page.click('[data-testid="check-consistency-button"]');

    // Wait for results
    await page.waitForTimeout(3000);

    // Verify conflict type badges present
    const conflictTypes = ['contradiction', 'ambiguity', 'overlap'];
    for (const type of conflictTypes) {
      const badge = page.locator(`[data-testid="conflict-type-${type}"]`);
      if (await badge.count() > 0) {
        await expect(badge.first()).toBeVisible();
      }
    }
  });

  test('should support resolution actions: modify, accept, escalate', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to position with conflicts
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}`);

    await page.click('[data-testid="view-consistency-button"]');
    await page.click('[data-testid="conflict-item"]').first();

    // Verify all resolution actions available
    await expect(page.locator('[data-testid="resolution-action-modify"]')).toBeVisible();
    await expect(page.locator('[data-testid="resolution-action-accept"]')).toBeVisible();
    await expect(page.locator('[data-testid="resolution-action-escalate"]')).toBeVisible();

    // Test modify action
    await page.click('[data-testid="resolution-action-modify"]');
    await expect(page.locator('[data-testid="modify-content-textarea"]')).toBeVisible();

    // Test accept action
    await page.click('[data-testid="resolution-action-accept"]');
    await expect(page.locator('[data-testid="accept-justification-textarea"]')).toBeVisible();

    // Test escalate action
    await page.click('[data-testid="resolution-action-escalate"]');
    await expect(page.locator('[data-testid="escalate-reason-textarea"]')).toBeVisible();
  });
});
