// T077: E2E test - Country analyst managing relationships
import { test, expect } from '@playwright/test';

test.describe('Country Analyst Managing Relationships', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should complete full relationship management journey', async ({ page }) => {
    // Step 1: Navigate to Saudi Arabia dossier
    await page.click('text=Dossiers');
    await page.click('text=Countries');
    await page.click('text=Saudi Arabia');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Saudi Arabia');
    await expect(page).toHaveURL(/dossiers.*\/[0-9a-f-]+$/);

    // Step 2: View Relationships tab
    await page.click('text=Relationships');

    // Wait for network graph to render
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });

    // Verify nodes are visible
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(6, { timeout: 3000 }); // Saudi Arabia + 5 related

    // Step 3: Click on World Bank node to navigate
    await page.click('text=World Bank');

    // Verify navigation
    await expect(page.locator('h1')).toContainText('World Bank');
    await expect(page).toHaveURL(/dossiers.*\/[0-9a-f-]+$/);

    // Step 4: View shared engagements
    await page.click('text=Engagements');

    // Verify engagements tab loaded
    await expect(page.locator('[data-testid="engagements-list"]')).toBeVisible();

    // Look for multi-dossier indicator
    const multiDossierBadges = page.locator('[data-testid="dossier-badge"]');
    await expect(multiDossierBadges).toHaveCount(2, { timeout: 2000 }); // At least 2 shared

    // Step 5: Navigate back via breadcrumb
    await page.click('[data-testid="breadcrumb"] >> text=Saudi Arabia');

    // Verify return to Saudi Arabia dossier
    await expect(page.locator('h1')).toContainText('Saudi Arabia');

    // Step 6: View timeline with relationship events
    await page.click('text=Timeline');

    // Verify timeline loaded
    await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount(5, { timeout: 2000 });

    // Verify relationship creation event exists
    await expect(page.locator('text=Relationship created')).toBeVisible();

    console.log('✓ Country analyst journey completed successfully');
  });

  test('should meet performance targets', async ({ page }) => {
    // Navigate to Saudi Arabia dossier
    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');

    // Measure page load time
    const pageLoadStart = Date.now();
    await expect(page.locator('h1')).toContainText('Saudi Arabia', { timeout: 5000 });
    const pageLoadTime = Date.now() - pageLoadStart;

    expect(pageLoadTime).toBeLessThan(2000); // <2s target

    // Measure network graph render time
    await page.click('text=Relationships');
    const graphRenderStart = Date.now();
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
    const graphRenderTime = Date.now() - graphRenderStart;

    expect(graphRenderTime).toBeLessThan(3000); // <3s target

    console.log(`Page load: ${pageLoadTime}ms, Graph render: ${graphRenderTime}ms`);
  });
});
