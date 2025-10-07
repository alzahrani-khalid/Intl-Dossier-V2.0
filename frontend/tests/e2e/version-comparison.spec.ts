import { test, expect } from '@playwright/test';

/**
 * E2E Test: Version Comparison and Diff Rendering (T086)
 * Tests version history and side-by-side diff display
 *
 * Validates:
 * - Create position and edit (version 2)
 * - Navigate to versions page
 * - Select v1 vs v2 for comparison
 * - Verify diff display (green additions, red deletions)
 * - Verify RTL diff for Arabic content
 */

test.describe('Version Comparison', () => {
  test('should display version history and compare versions with diff', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Create position
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    await page.fill('[data-testid="title-en-input"]', 'Version Test Position');
    await page.fill('[data-testid="content-en-editor"]', 'Original content version 1');
    await page.fill('[data-testid="content-ar-editor"]', 'المحتوى الأصلي الإصدار 1');
    await page.click('[data-testid="save-draft-button"]');

    // Get position ID
    const positionUrl = page.url();
    const positionId = positionUrl.match(/\/positions\/([^\/]+)/)?.[1];

    // Edit position (create version 2)
    await page.click('[data-testid="edit-button"]');
    await page.fill('[data-testid="content-en-editor"]', 'Modified content version 2 with additions');
    await page.fill('[data-testid="content-ar-editor"]', 'المحتوى المعدل الإصدار 2 مع إضافات');
    await page.click('[data-testid="save-button"]');

    // Navigate to versions page
    await page.goto(`/positions/${positionId}/versions`);

    // Verify version list shows v1 and v2
    await expect(page.locator('[data-testid="version-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-2"]')).toBeVisible();

    // Select versions for comparison
    await page.click('[data-testid="compare-versions-button"]');
    await page.selectOption('[data-testid="version-from-select"]', '1');
    await page.selectOption('[data-testid="version-to-select"]', '2');
    await page.click('[data-testid="show-comparison-button"]');

    // Verify diff display for English
    await expect(page.locator('[data-testid="diff-en-container"]')).toBeVisible();

    // Verify additions highlighted in green
    await expect(page.locator('[data-testid="diff-addition"]').first()).toHaveCSS('background-color', /green|#[a-f0-9]{6}/);

    // Verify deletions highlighted in red/strikethrough
    await expect(page.locator('[data-testid="diff-deletion"]').first()).toHaveCSS('text-decoration', /line-through/);

    // Verify diff display for Arabic (RTL)
    await expect(page.locator('[data-testid="diff-ar-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-ar-container"]')).toHaveAttribute('dir', 'rtl');

    // Verify metadata changes table
    await expect(page.locator('[data-testid="metadata-changes-table"]')).toBeVisible();
  });

  test('should show version superseded status', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to existing position with multiple versions
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}/versions`);

    // Verify version 1 marked as superseded
    await expect(page.locator('[data-testid="version-1-status"]')).toContainText('Superseded');

    // Verify version 2 marked as current
    await expect(page.locator('[data-testid="version-2-status"]')).toContainText('Current');
  });
});
