// T080: E2E test - Staff member assignments with context
import { test, expect } from '@playwright/test';

test.describe('Staff Member Assignments with Context', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should view assignments with dossier context', async ({ page }) => {
    // Step 1: Navigate to My Assignments
    await page.click('text=My Assignments');
    await expect(page).toHaveURL(/assignments/);

    // Step 2: Verify kanban board displayed
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();

    // Step 3: Check assignment cards show dossier context
    const assignmentCards = page.locator('[data-testid="assignment-card"]');
    await expect(assignmentCards).toHaveCount(3, { timeout: 2000 });

    // Verify dossier badges
    await expect(page.locator('[data-testid="dossier-badge"]')).toHaveCount(3, { timeout: 2000 });

    // Step 4: Click on assignment to view details
    await assignmentCards.first().click();

    // Verify dossier context banner
    await expect(page.locator('[data-testid="dossier-context-banner"]')).toBeVisible();

    // Step 5: Navigate to related dossier
    await page.click('[data-testid="view-dossier-button"]');
    await expect(page).toHaveURL(/dossiers/);

    // Step 6: Return via breadcrumb
    await page.click('[data-testid="breadcrumb"] >> text=My Assignments');
    await expect(page).toHaveURL(/assignments/);

    console.log('✓ Staff assignments with context journey completed successfully');
  });

  test('should show SLA countdown badges', async ({ page }) => {
    // Navigate to My Assignments
    await page.goto('http://localhost:5173/assignments');

    // Check for SLA countdown badges
    const slaUrgentBadges = page.locator('[data-testid="sla-badge"][data-urgency="high"]');
    const slaMediumBadges = page.locator('[data-testid="sla-badge"][data-urgency="medium"]');

    // At least one urgent assignment should exist
    await expect(slaUrgentBadges).toHaveCount(1, { timeout: 2000 });

    // Verify color coding
    await expect(slaUrgentBadges.first()).toHaveCSS('background-color', /cc0000|rgb\(204, 0, 0\)/);

    console.log('✓ SLA countdown badges working correctly');
  });
});
