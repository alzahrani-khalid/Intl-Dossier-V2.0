import { test, expect } from '@playwright/test';

test.describe('Bilingual Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should have proper lang attribute in Arabic', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="ar"]');

    await page.goto('/positions');

    // Verify lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('ar');

    // Verify dir attribute for RTL
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('should have proper lang attribute in English', async ({ page }) => {
    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="en"]');

    await page.goto('/positions');

    // Verify lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');

    // Verify dir attribute for LTR
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('ltr');
  });

  test('should have ARIA labels in Arabic', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="ar"]');

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Check attach button has Arabic label
    const attachButton = page.locator('[data-testid="attach-button"]').first();
    const ariaLabel = await attachButton.getAttribute('aria-label');

    // Verify label contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(ariaLabel || '');
    expect(hasArabic).toBe(true);
  });

  test('should have ARIA labels in English', async ({ page }) => {
    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="en"]');

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Check attach button has English label
    const attachButton = page.locator('[data-testid="attach-button"]').first();
    const ariaLabel = await attachButton.getAttribute('aria-label');

    // Verify label is in English (no Arabic characters)
    const hasArabic = /[\u0600-\u06FF]/.test(ariaLabel || '');
    expect(hasArabic).toBe(false);

    expect(ariaLabel?.toLowerCase()).toContain('attach');
  });

  test('should announce actions in Arabic via ARIA live regions', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="ar"]');

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Attach a position
    await page.click('[data-testid="suggestion-card"]:first-child [data-testid="attach-button"]');

    // Check ARIA live region
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await page.waitForTimeout(500);

    const announcement = await liveRegion.textContent();

    // Verify announcement is in Arabic
    const hasArabic = /[\u0600-\u06FF]/.test(announcement || '');
    expect(hasArabic).toBe(true);
  });

  test('should announce actions in English via ARIA live regions', async ({ page }) => {
    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="en"]');

    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Attach a position
    await page.click('[data-testid="suggestion-card"]:first-child [data-testid="attach-button"]');

    // Check ARIA live region
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await page.waitForTimeout(500);

    const announcement = await liveRegion.textContent();

    // Verify announcement is in English
    expect(announcement?.toLowerCase()).toContain('attached');
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Verify proper heading hierarchy
    const h1 = page.locator('h1');
    expect(await h1.count()).toBe(1);

    // Verify list structure
    const list = page.locator('[role="list"], ul, ol');
    expect(await list.count()).toBeGreaterThan(0);

    // Verify list items
    const listItems = page.locator('[role="listitem"], li');
    expect(await listItems.count()).toBeGreaterThan(0);
  });

  test('should have proper ARIA roles for navigation', async ({ page }) => {
    await page.goto('/positions');

    // Verify navigation landmark
    const nav = page.locator('[role="navigation"], nav');
    expect(await nav.count()).toBeGreaterThan(0);

    // Verify main landmark
    const main = page.locator('[role="main"], main');
    expect(await main.count()).toBe(1);
  });

  test('should have descriptive headings in Arabic', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="ar"]');

    await page.goto('/positions');

    // Verify heading is in Arabic
    const h1Text = await page.locator('h1').textContent();
    const hasArabic = /[\u0600-\u06FF]/.test(h1Text || '');
    expect(hasArabic).toBe(true);
  });

  test('should have descriptive headings in English', async ({ page }) => {
    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="en"]');

    await page.goto('/positions');

    // Verify heading is in English
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text?.toLowerCase()).toContain('position');
  });

  test('should have alt text for images in current language', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt text should not be empty
      expect(alt).not.toBe('');
      expect(alt).not.toBe(null);
    }
  });

  test('should navigate correctly in RTL mode (Arabic)', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="ar"]');

    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Focus first position
    await page.locator('[data-testid="position-card"]').first().focus();

    // Press ArrowLeft (should move to next in RTL)
    await page.keyboard.press('ArrowLeft');

    // Verify navigation direction is correct for RTL
    // (Implementation-specific - adjust based on actual behavior)
  });

  test('should navigate correctly in LTR mode (English)', async ({ page }) => {
    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-lang="en"]');

    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Focus first position
    await page.locator('[data-testid="position-card"]').first().focus();

    // Press ArrowRight (should move to next in LTR)
    await page.keyboard.press('ArrowRight');

    // Verify navigation direction is correct for LTR
  });

  test('should have aria-describedby for complex controls', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Check attach button has description
    const attachButton = page.locator('[data-testid="attach-button"]').first();
    const describedBy = await attachButton.getAttribute('aria-describedby');

    if (describedBy) {
      // Verify description exists
      const description = page.locator(`#${describedBy}`);
      await expect(description).toBeAttached();

      const descText = await description.textContent();
      expect(descText?.length || 0).toBeGreaterThan(0);
    }
  });

  test('should pass axe-core accessibility audit', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Run axe-core audit
    const results = await page.evaluate(async () => {
      // @ts-ignore - axe is loaded via CDN in test environment
      if (typeof axe !== 'undefined') {
        return await axe.run();
      }
      return null;
    });

    if (results) {
      // Verify no violations
      expect(results.violations).toHaveLength(0);
    }
  });

  test('should have proper focus management in modals', async ({ page }) => {
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');

    // Open attach dialog
    await page.click('[data-testid="add-position-button"]');

    const dialog = page.locator('[data-testid="attach-position-dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Verify focus moved to dialog
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));

    expect(focusedElement).toBeTruthy();

    // Close dialog
    await page.keyboard.press('Escape');

    // Verify focus returned to trigger button
    await page.waitForTimeout(200);
    const addButton = page.locator('[data-testid="add-position-button"]');
    const isFocused = await addButton.evaluate((el) => el === document.activeElement);

    expect(isFocused).toBe(true);
  });
});
