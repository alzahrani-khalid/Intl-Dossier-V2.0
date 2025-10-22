import { test, expect } from '@playwright/test';

/**
 * E2E Test: Manual Linking Workflow (User Story 1)
 *
 * Task: T053 [US1]
 * Success Criteria: SC-001 - Manual linking <30s end-to-end
 *
 * Test Flow:
 * 1. Navigate to intake ticket detail page
 * 2. Open entity search dialog
 * 3. Search for entity (e.g., "Saudi Arabia")
 * 4. Select entity and set link type
 * 5. Verify link appears in intake detail view
 * 6. Verify link appears in entity's related intakes list
 *
 * Performance Target: Complete workflow in <30 seconds
 */

test.describe('Manual Entity Linking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/\/(dashboard|intake-queue)/);
  });

  test('should complete manual linking workflow in <30 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Navigate to intake queue and select a ticket
    await page.goto('/intake-queue');
    await expect(page.locator('h1')).toContainText(/intake|تصنيف/i);

    // Click on first intake ticket
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();

    // Wait for intake detail page to load
    await page.waitForURL(/\/intake\/\d+/);
    await expect(page.locator('h2, h3')).toContainText(/ticket|تذكرة/i);

    // Step 2: Open entity link manager section
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    await expect(linkManagerSection).toBeVisible({ timeout: 5000 });

    // Step 3: Click "Add Link" button to open search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    // Step 4: Wait for entity search dialog to appear
    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible({ timeout: 3000 });

    // Step 5: Search for "Saudi Arabia" entity
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await searchInput.fill('Saudi Arabia');

    // Wait for search results to appear
    await page.waitForTimeout(500); // Debounce delay
    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    await expect(searchResults.first()).toBeVisible({ timeout: 3000 });

    // Step 6: Select first search result
    await searchResults.first().click();

    // Step 7: Select "Primary" link type
    const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
    await linkTypeSelect.click();
    const primaryOption = page.locator('[data-testid="link-type-option-primary"]');
    await primaryOption.click();

    // Step 8: Click "Create Link" button
    const createLinkButton = searchDialog.locator('button:has-text("Create Link"), button:has-text("إنشاء رابط")');
    await createLinkButton.click();

    // Step 9: Verify dialog closes
    await expect(searchDialog).not.toBeVisible({ timeout: 2000 });

    // Step 10: Verify link appears in link list with optimistic update (<50ms perceived latency)
    const linkCard = linkManagerSection.locator('[data-testid="link-card"]').first();
    await expect(linkCard).toBeVisible({ timeout: 1000 });

    // Verify link details
    await expect(linkCard).toContainText(/Saudi Arabia|السعودية/i);
    await expect(linkCard.locator('[data-testid="link-type-badge"]')).toContainText(/Primary|أساسي/i);

    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;

    // Assert performance target: <30 seconds
    expect(elapsedTime).toBeLessThan(30000);

    console.log(`✓ Manual linking workflow completed in ${elapsedTime}ms (target: <30000ms)`);
  });

  test('should display validation error for invalid link type', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    // Search for a non-anchor entity (e.g., MOU)
    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await searchInput.fill('MOU');
    await page.waitForTimeout(500);

    // Select MOU entity
    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    await searchResults.first().click();

    // Try to select "Primary" link type (should be disabled or show error)
    const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
    await linkTypeSelect.click();

    // Verify "Primary" option is disabled for non-anchor entities
    const primaryOption = page.locator('[data-testid="link-type-option-primary"]');
    if (await primaryOption.isVisible()) {
      await expect(primaryOption).toBeDisabled();
    }

    // Verify validation error message
    const errorMessage = searchDialog.locator('[role="alert"], .error-message, .text-destructive');
    await expect(errorMessage).toContainText(/primary.*anchor|أساسي.*رئيسي/i);
  });

  test('should support RTL layout for Arabic language', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Switch to Arabic if not already
    const languageToggle = page.locator('[data-testid="language-toggle"]');
    if (await languageToggle.isVisible()) {
      const currentLang = await languageToggle.textContent();
      if (!currentLang?.includes('العربية')) {
        await languageToggle.click();
      }
    }

    // Open entity search dialog
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    const addLinkButton = linkManagerSection.locator('button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Verify RTL direction
    const dialogDir = await searchDialog.getAttribute('dir');
    expect(dialogDir).toBe('rtl');

    // Verify text alignment (should be text-end for RTL)
    const searchInput = searchDialog.locator('input');
    const textAlign = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).textAlign;
    });
    expect(textAlign).toMatch(/right|end/);

    // Verify icons are flipped for RTL
    const chevronIcon = searchDialog.locator('svg.rotate-180');
    if (await chevronIcon.count() > 0) {
      await expect(chevronIcon).toBeVisible();
    }
  });

  test('should handle entity search with multiple results', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Open entity search dialog
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');

    // Search for common term to get multiple results
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await searchInput.fill('policy');
    await page.waitForTimeout(500);

    // Verify multiple search results appear
    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    const resultCount = await searchResults.count();
    expect(resultCount).toBeGreaterThan(1);

    // Verify results are ranked (AI confidence + recency + alphabetical per FR-001a)
    // First result should have highest ranking score
    const firstResult = searchResults.first();
    const firstResultRank = await firstResult.getAttribute('data-rank-score');

    if (resultCount > 1) {
      const secondResult = searchResults.nth(1);
      const secondResultRank = await secondResult.getAttribute('data-rank-score');

      if (firstResultRank && secondResultRank) {
        expect(parseFloat(firstResultRank)).toBeGreaterThanOrEqual(parseFloat(secondResultRank));
      }
    }
  });

  test('should show link in both intake and entity views (bidirectional)', async ({ page }) => {
    // Navigate to intake detail page
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Create a link
    const addLinkButton = page.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await searchInput.fill('Saudi Arabia');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    const firstResult = searchResults.first();

    // Get entity name and ID for later verification
    const entityName = await firstResult.textContent();
    const entityId = await firstResult.getAttribute('data-entity-id');

    await firstResult.click();

    // Select link type
    const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
    await linkTypeSelect.click();
    const relatedOption = page.locator('[data-testid="link-type-option-related"]');
    await relatedOption.click();

    const createLinkButton = searchDialog.locator('button:has-text("Create Link"), button:has-text("إنشاء رابط")');
    await createLinkButton.click();

    // Verify link in intake view
    const linkCard = page.locator('[data-testid="link-card"]').first();
    await expect(linkCard).toContainText(entityName || '');

    // Navigate to entity view (dossier detail page)
    if (entityId) {
      await page.goto(`/dossiers/${entityId}`);

      // Look for "Related Intakes" tab or section
      const relatedIntakesTab = page.locator('button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")');
      if (await relatedIntakesTab.isVisible()) {
        await relatedIntakesTab.click();

        // Verify intake appears in entity's related intakes list
        const intakeCard = page.locator('[data-testid="related-intake-card"]').first();
        await expect(intakeCard).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
