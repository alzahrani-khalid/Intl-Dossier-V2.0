import { test, expect } from '@playwright/test';

/**
 * Performance Test: Position Editor Time-to-Interactive - T093
 * Validates editor loads and becomes interactive in <3s
 *
 * Measures:
 * - Page load time
 * - First Contentful Paint (FCP)
 * - Time to Interactive (TTI)
 * - Total Blocking Time (TBT)
 */

test.describe('Position Editor Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/positions');
  });

  test('should load editor in <3s and be interactive', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();

    // Navigate to editor
    await page.goto('/positions?action=new');

    // Wait for critical elements to be interactive
    await page.waitForSelector('[data-testid="position-type-select"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="title-en-input"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="content-en-editor"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="save-draft-button"]', { state: 'visible' });

    // Verify editor is actually interactive (can type)
    const titleInput = page.locator('[data-testid="title-en-input"]');
    await titleInput.fill('Performance Test');
    await expect(titleInput).toHaveValue('Performance Test');

    const loadTime = Date.now() - startTime;

    console.log(`Editor TTI: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);
  });

  test('should measure First Contentful Paint (FCP)', async ({ page }) => {
    await page.goto('/positions?action=new');

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcp = perfEntries.find(entry => entry.name === 'first-contentful-paint');
      return {
        fcp: fcp?.startTime || 0,
      };
    });

    console.log(`FCP: ${performanceMetrics.fcp.toFixed(2)}ms`);

    // FCP should be under 1.8s (good threshold)
    expect(performanceMetrics.fcp).toBeLessThan(1800);
  });

  test('should measure Total Blocking Time (TBT)', async ({ page }) => {
    await page.goto('/positions?action=new');

    // Measure long tasks
    const tbtData = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalBlockingTime = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            // Long task > 50ms
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });

        // Wait 3 seconds to collect long tasks
        setTimeout(() => {
          observer.disconnect();
          resolve(totalBlockingTime);
        }, 3000);
      });
    });

    console.log(`TBT: ${tbtData.toFixed(2)}ms`);

    // TBT should be under 300ms (good threshold)
    expect(tbtData).toBeLessThan(300);
  });

  test('should load bilingual editor panels efficiently', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/positions?action=new');

    // Wait for both EN and AR editors
    await page.waitForSelector('[data-testid="content-en-editor"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="content-ar-editor"]', { state: 'visible' });

    // Verify both are interactive
    await page.locator('[data-testid="content-en-editor"]').fill('English content');
    await page.locator('[data-testid="content-ar-editor"]').fill('محتوى عربي');

    await expect(page.locator('[data-testid="content-en-editor"]')).toHaveValue('English content');
    await expect(page.locator('[data-testid="content-ar-editor"]')).toHaveValue('محتوى عربي');

    const loadTime = Date.now() - startTime;

    console.log(`Bilingual editor TTI: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid typing without lag', async ({ page }) => {
    await page.goto('/positions?action=new');

    const editor = page.locator('[data-testid="content-en-editor"]');
    await editor.waitFor({ state: 'visible' });

    // Type rapidly
    const testText = 'The quick brown fox jumps over the lazy dog. '.repeat(20);
    const startTime = Date.now();

    await editor.fill(testText);

    const typingTime = Date.now() - startTime;

    // Verify text was entered correctly
    await expect(editor).toHaveValue(testText);

    console.log(`Typing ${testText.length} characters took: ${typingTime}ms`);

    // Typing should feel responsive (< 1s for bulk input)
    expect(typingTime).toBeLessThan(1000);
  });

  test('should render consistency panel without blocking', async ({ page }) => {
    await page.goto('/positions?action=new');

    // Fill form
    await page.fill('[data-testid="title-en-input"]', 'Consistency Test');
    await page.fill('[data-testid="content-en-editor"]', 'Test content for consistency check');

    // Measure time to show consistency panel
    const startTime = Date.now();

    await page.click('[data-testid="check-consistency-button"]');
    await page.waitForSelector('[data-testid="consistency-panel"]', { state: 'visible' });

    const renderTime = Date.now() - startTime;

    console.log(`Consistency panel render: ${renderTime}ms`);

    // Should render UI immediately (even if analysis takes longer)
    expect(renderTime).toBeLessThan(500);
  });

  test('should lazy load version history efficiently', async ({ page }) => {
    // Create a position with versions first
    await page.goto('/positions?action=new');
    await page.fill('[data-testid="title-en-input"]', 'Version Test');
    await page.click('[data-testid="save-draft-button"]');
    await page.waitForTimeout(1000);

    // Navigate to version history
    const startTime = Date.now();

    await page.click('[data-testid="view-versions-button"]');
    await page.waitForSelector('[data-testid="version-list"]', { state: 'visible' });

    const loadTime = Date.now() - startTime;

    console.log(`Version history load: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(2000);
  });

  test('should measure JavaScript bundle parse time', async ({ page }) => {
    // Clear cache to get accurate parse time
    await page.context().clearCookies();

    await page.goto('/positions?action=new');

    const parseTime = await page.evaluate(() => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart;
    });

    console.log(`JS parse time: ${parseTime.toFixed(2)}ms`);

    // Parse time should be under 500ms
    expect(parseTime).toBeLessThan(500);
  });
});
