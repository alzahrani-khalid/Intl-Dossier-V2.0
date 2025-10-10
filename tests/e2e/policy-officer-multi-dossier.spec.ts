// T079: E2E test - Policy officer multi-dossier positions
import { test, expect } from '@playwright/test';

test.describe('Policy Officer Multi-Dossier Positions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should create multi-dossier position journey', async ({ page }) => {
    // Step 1: Navigate to Positions page
    await page.click('text=Positions');
    await expect(page).toHaveURL(/positions/);

    // Step 2: Create new position
    await page.click('[data-testid="create-position-button"]');

    // Fill position form
    await page.fill('[name="title_en"]', 'G20 Statistical Framework Position');
    await page.fill('[name="title_ar"]', 'موقف إطار إحصائي لمجموعة العشرين');
    await page.fill('[name="content_en"]', 'This position applies to multiple countries in G20.');
    await page.fill('[name="content_ar"]', 'هذا الموقف ينطبق على عدة دول في مجموعة العشرين.');

    // Step 3: Link to multiple dossiers
    await page.click('[data-testid="link-dossiers-button"]');

    // Search and select dossiers
    await page.fill('[data-testid="dossier-search"]', 'Saudi Arabia');
    await page.click('[data-testid="dossier-option"] >> text=Saudi Arabia');

    await page.fill('[data-testid="dossier-search"]', 'USA');
    await page.click('[data-testid="dossier-option"] >> text=USA');

    await page.fill('[data-testid="dossier-search"]', 'UK');
    await page.click('[data-testid="dossier-option"] >> text=UK');

    // Verify 3 dossiers selected
    await expect(page.locator('[data-testid="selected-dossier"]')).toHaveCount(3);

    // Save position
    await page.click('[data-testid="save-position-button"]');

    // Step 4: Verify position created
    await expect(page.locator('text=Position created successfully')).toBeVisible();

    // Step 5: Navigate to Saudi Arabia dossier
    await page.click('text=Dossiers');
    await page.click('text=Countries');
    await page.click('text=Saudi Arabia');

    // Step 6: Check Positions tab
    await page.click('text=Positions');

    // Verify position appears
    await expect(page.locator('text=G20 Statistical Framework Position')).toBeVisible();

    // Verify multi-dossier indicator
    await expect(page.locator('[data-testid="multi-dossier-badge"]')).toBeVisible();
    await expect(page.locator('text=3 dossiers')).toBeVisible();

    console.log('✓ Multi-dossier position journey completed successfully');
  });

  test('should show position in all linked dossiers', async ({ page }) => {
    // Navigate to Saudi Arabia dossier Positions tab
    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');
    await page.click('text=Positions');

    const saudiPositions = await page.locator('[data-testid="position-card"]').count();

    // Navigate to USA dossier Positions tab
    await page.goto('http://localhost:5173/dossiers/countries/usa');
    await page.click('text=Positions');

    const usaPositions = await page.locator('[data-testid="position-card"]').count();

    // Navigate to UK dossier Positions tab
    await page.goto('http://localhost:5173/dossiers/countries/uk');
    await page.click('text=Positions');

    const ukPositions = await page.locator('[data-testid="position-card"]').count();

    // All should have at least the multi-dossier position
    expect(saudiPositions).toBeGreaterThanOrEqual(1);
    expect(usaPositions).toBeGreaterThanOrEqual(1);
    expect(ukPositions).toBeGreaterThanOrEqual(1);

    console.log('✓ Position visible in all linked dossiers');
  });
});
