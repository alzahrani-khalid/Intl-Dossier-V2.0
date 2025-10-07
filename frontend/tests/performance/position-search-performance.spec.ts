import { test, expect } from '@playwright/test';

test.describe('Position Search Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');
  });

  test('should return search results within 500ms (p95)', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="positions-search"]');

    const responseTimes: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const searchTerms = ['policy', 'economic', 'climate', 'trade', 'security'];
      const term = searchTerms[i % searchTerms.length];

      const startTime = Date.now();

      // Type search term
      await page.fill('[data-testid="positions-search"]', term);

      // Wait for API response
      await page.waitForResponse(
        (response) => response.url().includes('/positions') && response.status() === 200,
        { timeout: 2000 }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      responseTimes.push(responseTime);

      // Clear search for next iteration
      await page.fill('[data-testid="positions-search"]', '');
      await page.waitForTimeout(200);
    }

    // Calculate p95
    responseTimes.sort((a, b) => a - b);
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p95Time = responseTimes[p95Index];

    console.log('Response times:', responseTimes);
    console.log('P95 response time:', p95Time, 'ms');

    // Verify p95 < 500ms
    expect(p95Time).toBeLessThan(500);

    // Verify average < 300ms
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    console.log('Average response time:', avgTime, 'ms');
    expect(avgTime).toBeLessThan(300);
  });

  test('should debounce search input to prevent excessive requests', async ({ page }) => {
    await page.goto('/positions');

    let requestCount = 0;

    // Intercept search requests
    await page.route('**/positions*', (route) => {
      if (route.request().url().includes('search=')) {
        requestCount++;
      }
      route.continue();
    });

    const searchInput = page.locator('[data-testid="positions-search"]');

    // Type rapidly (one character at a time)
    const searchTerm = 'economic';
    for (const char of searchTerm) {
      await searchInput.type(char, { delay: 50 }); // 50ms between chars
    }

    // Wait for debounce period
    await page.waitForTimeout(500);

    // Should have made only 1-2 requests (debounced)
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test('should handle large result sets efficiently', async ({ page }) => {
    // Mock large result set
    await page.route('**/positions*', (route) => {
      const positions = Array(500)
        .fill(null)
        .map((_, i) => ({
          id: `pos-${i}`,
          title: `Position ${i}`,
          type: 'policy_brief',
          status: 'published',
          created_at: new Date().toISOString(),
        }));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(positions),
      });
    });

    await page.goto('/positions');

    // Measure rendering time
    const startTime = Date.now();

    await page.waitForSelector('[data-testid="position-card"]', { timeout: 3000 });

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log('Render time for 500 positions:', renderTime, 'ms');

    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test('should implement virtual scrolling for performance', async ({ page }) => {
    await page.goto('/positions');
    await page.waitForSelector('[data-testid="position-card"]');

    // Check if virtual scrolling is implemented
    const virtualContainer = page.locator('[data-testid="virtual-scroll-container"]');

    if (await virtualContainer.isVisible()) {
      // Get initial DOM node count
      const initialCount = await page.locator('[data-testid="position-card"]').count();

      // Scroll down
      await virtualContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2;
      });

      await page.waitForTimeout(500);

      // Get new DOM node count
      const afterScrollCount = await page.locator('[data-testid="position-card"]').count();

      // Virtual scrolling should maintain similar node count (not accumulating)
      expect(Math.abs(afterScrollCount - initialCount)).toBeLessThan(50);
    }
  });

  test('should cache search results', async ({ page }) => {
    await page.goto('/positions');

    const searchInput = page.locator('[data-testid="positions-search"]');

    // First search
    const startTime1 = Date.now();
    await searchInput.fill('economic');
    await page.waitForResponse((response) => response.url().includes('search=economic'));
    const firstSearchTime = Date.now() - startTime1;

    // Clear and search again for same term
    await searchInput.fill('');
    await page.waitForTimeout(500);

    const startTime2 = Date.now();
    await searchInput.fill('economic');

    try {
      // Should use cache, so response should be instant or very fast
      await page.waitForResponse((response) => response.url().includes('search=economic'), {
        timeout: 1000,
      });
      const secondSearchTime = Date.now() - startTime2;

      // Second search should be faster (cached)
      expect(secondSearchTime).toBeLessThanOrEqual(firstSearchTime);
    } catch (error) {
      // No network request = cache hit (even better!)
      const secondSearchTime = Date.now() - startTime2;
      expect(secondSearchTime).toBeLessThan(200);
    }
  });

  test('should optimize filter application', async ({ page }) => {
    await page.goto('/positions');

    // Apply multiple filters
    const startTime = Date.now();

    // Type filter
    await page.click('[data-testid="filter-type"]');
    await page.click('[data-value="policy_brief"]');

    // Status filter
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-value="published"]');

    // Wait for final results
    await page.waitForResponse((response) => response.url().includes('type=') && response.url().includes('status='));

    const endTime = Date.now();
    const filterTime = endTime - startTime;

    console.log('Filter application time:', filterTime, 'ms');

    // Should apply filters within 1 second
    expect(filterTime).toBeLessThan(1000);
  });

  test('should handle concurrent searches efficiently', async ({ page, context }) => {
    // Open multiple pages
    const page2 = await context.newPage();

    await page.goto('/positions');
    await page2.goto('/positions');

    // Perform searches simultaneously
    const search1 = page.fill('[data-testid="positions-search"]', 'economic');
    const search2 = page2.fill('[data-testid="positions-search"]', 'policy');

    await Promise.all([search1, search2]);

    // Both should complete successfully without blocking
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('search=economic')),
      page2.waitForResponse((response) => response.url().includes('search=policy')),
    ]);

    // Verify both got results
    expect(await page.locator('[data-testid="position-card"]').count()).toBeGreaterThan(0);
    expect(await page2.locator('[data-testid="position-card"]').count()).toBeGreaterThan(0);

    await page2.close();
  });

  test('should measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/positions');

    // Wait for page to be fully interactive
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="positions-search"]');
    await page.waitForSelector('[data-testid="position-card"]');

    const ttiTime = Date.now() - startTime;

    console.log('Time to Interactive:', ttiTime, 'ms');

    // TTI should be < 3 seconds
    expect(ttiTime).toBeLessThan(3000);
  });

  test('should measure First Contentful Paint (FCP)', async ({ page }) => {
    await page.goto('/positions');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint').find((entry) => entry.name === 'first-contentful-paint');

      return {
        fcp: paint ? paint.startTime : null,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };
    });

    console.log('First Contentful Paint:', metrics.fcp, 'ms');
    console.log('DOM Content Loaded:', metrics.domContentLoaded, 'ms');

    if (metrics.fcp) {
      // FCP should be < 1.8 seconds (good)
      expect(metrics.fcp).toBeLessThan(1800);
    }
  });
});
