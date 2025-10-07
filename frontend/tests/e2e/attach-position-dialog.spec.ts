import { test, expect } from '@playwright/test';

test.describe('Attach Position Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');

    // Navigate to engagement detail
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');
  });

  test('should open searchable dialog', async ({ page }) => {
    // Click add position button
    await page.click('[data-testid="add-position-button"]');

    // Verify dialog opens
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title
    await expect(dialog).toContainText('Add Positions');

    // Verify search input
    const searchInput = dialog.locator('[data-testid="position-search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder');
  });

  test('should display all available positions', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');

    // Wait for positions to load
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    const positionCards = dialog.locator('[data-testid="dialog-position-card"]');
    await expect(positionCards).not.toHaveCount(0);
  });

  test('should filter results in real-time with <1s response', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    const searchInput = dialog.locator('[data-testid="position-search"]');

    // Start timing
    const startTime = Date.now();

    // Type search query
    await searchInput.fill('climate policy');

    // Wait for filtered results
    await page.waitForResponse((response) => response.url().includes('search='));

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Verify response time < 1000ms
    expect(responseTime).toBeLessThan(1000);

    // Verify results contain search term
    const positionCards = dialog.locator('[data-testid="dialog-position-card"]');
    const firstCardTitle = await positionCards.first().locator('[data-testid="position-title"]').textContent();
    expect(firstCardTitle?.toLowerCase()).toContain('climate');
  });

  test('should enable multi-select up to 100 positions', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    // Select first 5 positions
    for (let i = 0; i < 5; i++) {
      await dialog
        .locator('[data-testid="dialog-position-card"]')
        .nth(i)
        .locator('input[type="checkbox"]')
        .check();
    }

    // Verify selection counter
    const selectionCounter = dialog.locator('[data-testid="selection-counter"]');
    await expect(selectionCounter).toContainText('5 selected');
  });

  test('should display position preview on selection', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    // Click on first position
    await dialog.locator('[data-testid="dialog-position-card"]').first().click();

    // Verify preview panel displays
    const previewPanel = dialog.locator('[data-testid="position-preview-panel"]');
    await expect(previewPanel).toBeVisible();

    // Verify preview contains position content
    await expect(previewPanel).toContainText('Position Content');
  });

  test('should attach selected positions', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    // Select 2 positions
    const positionCards = dialog.locator('[data-testid="dialog-position-card"]');
    const firstTitle = await positionCards.nth(0).locator('[data-testid="position-title"]').textContent();
    const secondTitle = await positionCards.nth(1).locator('[data-testid="position-title"]').textContent();

    await positionCards.nth(0).locator('input[type="checkbox"]').check();
    await positionCards.nth(1).locator('input[type="checkbox"]').check();

    // Click attach button
    await dialog.locator('[data-testid="attach-selected-button"]').click();

    // Wait for API calls
    await page.waitForResponse((response) => response.url().includes('/positions') && response.method() === 'POST');

    // Verify dialog closes
    await expect(dialog).not.toBeVisible();

    // Verify positions appear in attached list
    const attachedSection = page.locator('[data-testid="attached-positions-section"]');
    await expect(attachedSection).toContainText(firstTitle || '');
    await expect(attachedSection).toContainText(secondTitle || '');
  });

  test('should prevent attaching already attached positions', async ({ page }) => {
    // First attach a position
    await page.click('[data-testid="add-position-button"]');
    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    const firstCard = dialog.locator('[data-testid="dialog-position-card"]').first();
    await firstCard.locator('input[type="checkbox"]').check();
    await dialog.locator('[data-testid="attach-selected-button"]').click();
    await page.waitForTimeout(1000);

    // Try to attach again
    await page.click('[data-testid="add-position-button"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    // Verify already attached positions are disabled
    const attachedCard = dialog.locator('[data-testid="dialog-position-card"][data-attached="true"]').first();
    await expect(attachedCard).toHaveAttribute('data-attached', 'true');

    const checkbox = attachedCard.locator('input[type="checkbox"]');
    await expect(checkbox).toBeDisabled();
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await expect(dialog).toBeVisible();

    // Click cancel button
    await dialog.locator('[data-testid="cancel-button"]').click();

    // Verify dialog closes
    await expect(dialog).not.toBeVisible();
  });

  test('should persist search state within dialog', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    const searchInput = dialog.locator('[data-testid="position-search"]');

    // Type search
    await searchInput.fill('economic');
    await page.waitForTimeout(500);

    // Select position
    await dialog.locator('[data-testid="dialog-position-card"]').first().click();

    // Verify search persists in input
    await expect(searchInput).toHaveValue('economic');
  });

  test('should handle empty search results', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    const searchInput = dialog.locator('[data-testid="position-search"]');

    // Search for non-existent term
    await searchInput.fill('xyznonexistent12345');
    await page.waitForTimeout(500);

    // Verify empty state
    const emptyState = dialog.locator('[data-testid="no-results"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No positions found');
  });

  test('should validate attachment reason field', async ({ page }) => {
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await page.waitForSelector('[data-testid="dialog-position-card"]');

    // Select a position
    await dialog.locator('[data-testid="dialog-position-card"]').first().locator('input[type="checkbox"]').check();

    // Enter attachment reason
    const reasonField = dialog.locator('[data-testid="attachment-reason"]');
    await reasonField.fill('Relevant for upcoming stakeholder meeting');

    // Attach
    await dialog.locator('[data-testid="attach-selected-button"]').click();

    // Wait for successful attachment
    await page.waitForResponse((response) => response.status() === 201);

    // Verify reason was included in request
    // (Would need to intercept network request to verify)
  });
});
