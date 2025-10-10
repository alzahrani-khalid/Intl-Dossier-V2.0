// T078: E2E test - Intake officer processing requests
import { test, expect } from '@playwright/test';

test.describe('Intake Officer Processing Requests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should process intake request with dossier context', async ({ page }) => {
    // Step 1: Navigate to Intake Queue
    await page.click('text=Intake Queue');
    await expect(page).toHaveURL(/intake/);

    // Step 2: Select first request
    await page.click('[data-testid="intake-request-card"]');

    // Verify request details loaded
    await expect(page.locator('[data-testid="request-details"]')).toBeVisible();

    // Step 3: Check dossier context banner
    await expect(page.locator('[data-testid="dossier-context-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="dossier-context-banner"]')).toContainText(/🇸🇦|Saudi Arabia/);

    // Step 4: View related dossier
    await page.click('[data-testid="view-dossier-button"]');

    // Verify navigation to dossier
    await expect(page).toHaveURL(/dossiers/);
    await expect(page.locator('h1')).toContainText(/Saudi Arabia|World Bank|IMF/);

    // Step 5: Return to intake queue
    await page.click('[data-testid="back-to-intake"]');
    await expect(page).toHaveURL(/intake/);

    // Step 6: Process request
    await page.click('[data-testid="process-request-button"]');
    await page.selectOption('[name="action"]', 'approve');
    await page.fill('[name="notes"]', 'Approved after reviewing dossier context');
    await page.click('[data-testid="submit-action-button"]');

    // Verify success
    await expect(page.locator('text=Request processed successfully')).toBeVisible();

    console.log('✓ Intake officer journey completed successfully');
  });
});
