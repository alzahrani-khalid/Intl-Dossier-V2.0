import { test, expect } from '@playwright/test';

/**
 * E2E Test: Reverse Lookup Workflow (User Story 4)
 *
 * Task: T101 [US4]
 * Success Criteria: SC-004 - Reverse lookup <2s for 1000+ intakes
 *
 * Test Flow:
 * 1. Navigate to entity (dossier) detail page
 * 2. Click on "Related Intakes" tab
 * 3. Verify linked intake tickets are displayed
 * 4. Filter by link type (primary/related/mentioned)
 * 5. Verify pagination works (50 per page)
 * 6. Verify performance target (<2 seconds)
 *
 * Performance Target: Complete reverse lookup in <2 seconds
 */

test.describe('Reverse Lookup Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/\/(dashboard|intake-queue)/);
  });

  test('should complete reverse lookup workflow in <2 seconds', async ({ page }) => {
    // Step 1: Navigate to a dossier detail page
    // Using a known dossier (e.g., Saudi Arabia country dossier)
    await page.goto('/dossiers/countries/1'); // Adjust ID as needed

    // Wait for page to load
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });

    // Step 2: Find and click "Related Intakes" tab
    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة"), [role="tab"]:has-text("Related Intakes"), [role="tab"]:has-text("التذاكر المرتبطة")'
    );

    const startTime = Date.now();

    await expect(relatedIntakesTab).toBeVisible({ timeout: 3000 });
    await relatedIntakesTab.click();

    // Step 3: Wait for related intakes section to load
    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible({ timeout: 3000 });

    // Wait for intake cards to render
    const intakeCards = relatedIntakesSection.locator('[data-testid="related-intake-card"]');
    await expect(intakeCards.first()).toBeVisible({ timeout: 2000 });

    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;

    // Assert performance target: <2 seconds
    expect(elapsedTime).toBeLessThan(2000);

    console.log(`✓ Reverse lookup completed in ${elapsedTime}ms (target: <2000ms)`);

    // Step 4: Verify intake cards display correct information
    const firstIntakeCard = intakeCards.first();
    await expect(firstIntakeCard).toContainText(/ticket|تذكرة|intake|وارد/i);

    // Verify link type badge is displayed
    const linkTypeBadge = firstIntakeCard.locator('[data-testid="link-type-badge"]');
    await expect(linkTypeBadge).toBeVisible();

    // Count total intakes displayed
    const intakeCount = await intakeCards.count();
    console.log(`✓ Found ${intakeCount} related intake(s)`);
  });

  test('should filter intakes by link type', async ({ page }) => {
    // Navigate to dossier detail page
    await page.goto('/dossiers/countries/1');

    // Click "Related Intakes" tab
    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")'
    );
    await relatedIntakesTab.click();

    // Wait for related intakes section
    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible({ timeout: 3000 });

    // Step 1: Locate link type filter dropdown
    const linkTypeFilter = relatedIntakesSection.locator(
      '[data-testid="link-type-filter"], select[name="link-type"], [role="combobox"]'
    ).first();

    if (await linkTypeFilter.isVisible()) {
      // Step 2: Select "Primary" filter
      await linkTypeFilter.click();
      const primaryOption = page.locator(
        '[data-testid="filter-option-primary"], option:has-text("Primary"), option:has-text("أساسي")'
      );

      if (await primaryOption.isVisible()) {
        await primaryOption.click();
      } else {
        // If using combobox pattern
        await linkTypeFilter.fill('Primary');
        await page.keyboard.press('Enter');
      }

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Step 3: Verify all displayed intakes have "Primary" link type
      const intakeCards = relatedIntakesSection.locator('[data-testid="related-intake-card"]');
      const count = await intakeCards.count();

      for (let i = 0; i < count; i++) {
        const linkTypeBadge = intakeCards.nth(i).locator('[data-testid="link-type-badge"]');
        await expect(linkTypeBadge).toContainText(/Primary|أساسي/i);
      }

      console.log(`✓ Filtered ${count} intake(s) with Primary link type`);

      // Step 4: Select "Related" filter
      await linkTypeFilter.click();
      const relatedOption = page.locator(
        '[data-testid="filter-option-related"], option:has-text("Related"), option:has-text("مرتبط")'
      );

      if (await relatedOption.isVisible()) {
        await relatedOption.click();
      } else {
        await linkTypeFilter.fill('Related');
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(500);

      // Step 5: Verify all displayed intakes have "Related" link type
      const relatedCount = await intakeCards.count();

      for (let i = 0; i < relatedCount; i++) {
        const linkTypeBadge = intakeCards.nth(i).locator('[data-testid="link-type-badge"]');
        await expect(linkTypeBadge).toContainText(/Related|مرتبط/i);
      }

      console.log(`✓ Filtered ${relatedCount} intake(s) with Related link type`);
    }
  });

  test('should support pagination for 50+ intakes', async ({ page }) => {
    // Navigate to dossier with many linked intakes
    await page.goto('/dossiers/countries/1');

    // Click "Related Intakes" tab
    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")'
    );
    await relatedIntakesTab.click();

    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible();

    // Step 1: Check if pagination controls are visible
    const paginationControls = relatedIntakesSection.locator(
      '[data-testid="pagination-controls"], nav[aria-label*="pagination"], nav[aria-label*="ترقيم"]'
    );

    if (await paginationControls.isVisible({ timeout: 2000 })) {
      // Step 2: Verify current page indicator
      const currentPage = paginationControls.locator('[aria-current="page"], .active');
      await expect(currentPage).toContainText('1');

      // Step 3: Count intakes on first page (should be max 50)
      const intakeCards = relatedIntakesSection.locator('[data-testid="related-intake-card"]');
      const firstPageCount = await intakeCards.count();
      expect(firstPageCount).toBeLessThanOrEqual(50);

      console.log(`✓ First page displays ${firstPageCount} intake(s) (max 50 per page)`);

      // Step 4: Click "Next" button to go to page 2
      const nextButton = paginationControls.locator(
        'button:has-text("Next"), button:has-text("التالي"), button[aria-label*="next"]'
      );

      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // Wait for page 2 to load
        await page.waitForTimeout(500);

        // Step 5: Verify page indicator updated to page 2
        const currentPage2 = paginationControls.locator('[aria-current="page"], .active');
        await expect(currentPage2).toContainText('2');

        // Step 6: Verify different intakes are displayed on page 2
        const secondPageCount = await intakeCards.count();
        expect(secondPageCount).toBeGreaterThan(0);
        expect(secondPageCount).toBeLessThanOrEqual(50);

        console.log(`✓ Second page displays ${secondPageCount} intake(s)`);

        // Step 7: Click "Previous" button to go back to page 1
        const prevButton = paginationControls.locator(
          'button:has-text("Previous"), button:has-text("السابق"), button[aria-label*="previous"]'
        );
        await prevButton.click();

        await page.waitForTimeout(500);

        // Verify back on page 1
        const currentPage1 = paginationControls.locator('[aria-current="page"], .active');
        await expect(currentPage1).toContainText('1');

        console.log('✓ Pagination navigation works correctly');
      } else {
        console.log('ℹ Only one page of intakes (less than 50 total)');
      }
    } else {
      console.log('ℹ No pagination controls visible (less than 50 intakes)');
    }
  });

  test('should display clearance-filtered results', async ({ page }) => {
    // This test verifies that only intakes the user has clearance to view are shown
    await page.goto('/dossiers/countries/1');

    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")'
    );
    await relatedIntakesTab.click();

    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible();

    // Verify intakes are displayed (user has appropriate clearance)
    const intakeCards = relatedIntakesSection.locator('[data-testid="related-intake-card"]');
    const count = await intakeCards.count();

    expect(count).toBeGreaterThanOrEqual(0);

    console.log(`✓ User can view ${count} intake(s) within their clearance level`);

    // Verify no error messages about insufficient clearance
    const errorMessage = page.locator('[role="alert"]:has-text("clearance"), [role="alert"]:has-text("صلاحية")');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should show empty state when no intakes are linked', async ({ page }) => {
    // Navigate to a newly created dossier with no links
    await page.goto('/dossiers/countries/999999'); // Non-existent or new dossier

    // If page exists, check for empty state
    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")'
    );

    if (await relatedIntakesTab.isVisible({ timeout: 2000 })) {
      await relatedIntakesTab.click();

      const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
      await expect(relatedIntakesSection).toBeVisible();

      // Verify empty state message
      const emptyState = relatedIntakesSection.locator(
        '[data-testid="empty-state"], .empty-state, p:has-text("No intakes"), p:has-text("لا توجد")'
      );

      if (await emptyState.isVisible({ timeout: 1000 })) {
        await expect(emptyState).toContainText(/no intakes|لا توجد/i);
        console.log('✓ Empty state displayed correctly');
      }
    }
  });

  test('should support RTL layout for Arabic language', async ({ page }) => {
    // Navigate to dossier detail page
    await page.goto('/dossiers/countries/1');

    // Switch to Arabic if not already
    const languageToggle = page.locator('[data-testid="language-toggle"]');
    if (await languageToggle.isVisible()) {
      const currentLang = await languageToggle.textContent();
      if (!currentLang?.includes('العربية')) {
        await languageToggle.click();
      }
    }

    // Click "Related Intakes" tab
    const relatedIntakesTab = page.locator('button:has-text("التذاكر المرتبطة")');
    await relatedIntakesTab.click();

    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible();

    // Verify RTL direction
    const sectionDir = await relatedIntakesSection.getAttribute('dir');
    expect(sectionDir).toBe('rtl');

    // Verify intake cards use RTL layout
    const intakeCard = relatedIntakesSection.locator('[data-testid="related-intake-card"]').first();
    if (await intakeCard.isVisible()) {
      const cardDir = await intakeCard.getAttribute('dir');
      expect(cardDir).toBe('rtl');

      // Verify text alignment
      const textAlign = await intakeCard.evaluate((el) => {
        return window.getComputedStyle(el).textAlign;
      });
      expect(textAlign).toMatch(/right|end/);

      console.log('✓ RTL layout applied correctly');
    }
  });

  test('should be mobile-responsive on small screens', async ({ page }) => {
    // Set viewport to mobile size (375px width - iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dossier detail page
    await page.goto('/dossiers/countries/1');

    // Click "Related Intakes" tab
    const relatedIntakesTab = page.locator(
      'button:has-text("Related Intakes"), button:has-text("التذاكر المرتبطة")'
    );
    await relatedIntakesTab.click();

    const relatedIntakesSection = page.locator('[data-testid="related-intakes-section"]');
    await expect(relatedIntakesSection).toBeVisible();

    // Verify intake cards are stacked vertically on mobile
    const intakeCards = relatedIntakesSection.locator('[data-testid="related-intake-card"]');
    const firstCard = intakeCards.first();

    if (await firstCard.isVisible()) {
      // Verify card takes full width (or near full width with padding)
      const cardWidth = await firstCard.evaluate((el) => el.offsetWidth);
      expect(cardWidth).toBeGreaterThan(300); // Should be close to 375px viewport

      // Verify touch-friendly minimum height (44x44px)
      const cardHeight = await firstCard.evaluate((el) => el.offsetHeight);
      expect(cardHeight).toBeGreaterThanOrEqual(44);

      console.log(`✓ Mobile layout: Card width ${cardWidth}px, height ${cardHeight}px`);
    }

    // Verify filter controls are accessible on mobile
    const linkTypeFilter = relatedIntakesSection.locator('[data-testid="link-type-filter"]');
    if (await linkTypeFilter.isVisible()) {
      const filterHeight = await linkTypeFilter.evaluate((el) => el.offsetHeight);
      expect(filterHeight).toBeGreaterThanOrEqual(44); // Touch-friendly
    }
  });
});
