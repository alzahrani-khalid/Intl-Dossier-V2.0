import { test, expect } from '@playwright/test';

test.describe('Theme Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Theme switching performance < 100ms', async ({ page }) => {
    const measurements: number[] = [];

    // Measure theme switching performance 10 times
    for (let i = 0; i < 10; i++) {
      // Measure GASTAT to Blue Sky
      const startTime = Date.now();
      
      await page.click('[aria-label*="Select theme"]');
      await page.click('text=Blue Sky');
      
      // Wait for theme to be applied
      await page.waitForFunction(() => {
        const root = document.documentElement;
        return root.getAttribute('data-theme') === 'blue-sky';
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      measurements.push(duration);
      
      // Switch back to GASTAT
      await page.click('[aria-label*="Select theme"]');
      await page.click('text=GASTAT');
      await page.waitForFunction(() => {
        const root = document.documentElement;
        return root.getAttribute('data-theme') === 'gastat';
      });
    }

    // Calculate statistics
    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const max = Math.max(...measurements);
    const min = Math.min(...measurements);

    console.log('Theme Switching Performance:');
    console.log(`  Average: ${average.toFixed(2)}ms`);
    console.log(`  Max: ${max}ms`);
    console.log(`  Min: ${min}ms`);

    // Assert performance requirement
    expect(average).toBeLessThan(100);
    expect(max).toBeLessThan(150); // Allow some variance
  });

  test('Color mode switching performance < 100ms', async ({ page }) => {
    const measurements: number[] = [];

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      // Click color mode toggle
      await page.click('[aria-label*="Switch to"]');
      
      // Wait for color mode to be applied
      const expectedMode = i % 2 === 0 ? 'dark' : 'light';
      await page.waitForFunction((mode) => {
        const root = document.documentElement;
        return root.getAttribute('data-color-mode') === mode;
      }, expectedMode);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      measurements.push(duration);
    }

    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    
    console.log('Color Mode Switching Performance:');
    console.log(`  Average: ${average.toFixed(2)}ms`);

    expect(average).toBeLessThan(100);
  });

  test('Language switching performance < 200ms', async ({ page }) => {
    const measurements: number[] = [];

    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      // Switch to Arabic
      await page.click('[aria-label*="Select language"]');
      await page.click('text=العربية');
      
      // Wait for RTL to be applied
      await page.waitForFunction(() => {
        const root = document.documentElement;
        return root.getAttribute('dir') === 'rtl';
      });
      
      let endTime = Date.now();
      measurements.push(endTime - startTime);
      
      // Switch back to English
      const startTime2 = Date.now();
      await page.click('[aria-label*="Select language"]');
      await page.click('text=English');
      
      // Wait for LTR to be applied
      await page.waitForFunction(() => {
        const root = document.documentElement;
        return root.getAttribute('dir') === 'ltr';
      });
      
      endTime = Date.now();
      measurements.push(endTime - startTime2);
    }

    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    
    console.log('Language Switching Performance:');
    console.log(`  Average: ${average.toFixed(2)}ms`);

    // Language switching can be slower due to i18n loading
    expect(average).toBeLessThan(200);
  });

  test('Initial page load with preferences', async ({ page, context }) => {
    // Set preferences in localStorage
    await context.addInitScript(() => {
      localStorage.setItem('user-preferences', JSON.stringify({
        theme: 'blue-sky',
        colorMode: 'dark',
        language: 'ar',
        updatedAt: new Date().toISOString()
      }));
    });

    // Measure page load with preferences
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify preferences are applied
    await page.waitForFunction(() => {
      const root = document.documentElement;
      return root.getAttribute('data-theme') === 'blue-sky' &&
             root.getAttribute('data-color-mode') === 'dark' &&
             root.getAttribute('dir') === 'rtl';
    });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`Initial load with preferences: ${loadTime}ms`);
    
    // Initial load can be slower
    expect(loadTime).toBeLessThan(3000);
  });

  test('Memory leak test - theme switching', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Switch themes 100 times
    for (let i = 0; i < 100; i++) {
      const theme = i % 2 === 0 ? 'GASTAT' : 'Blue Sky';
      await page.click('[aria-label*="Select theme"]');
      await page.click(`text=${theme}`);
      
      // Small delay to allow garbage collection
      if (i % 10 === 0) {
        await page.waitForTimeout(100);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(1000);

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const increaseInMB = memoryIncrease / (1024 * 1024);
    
    console.log(`Memory increase after 100 theme switches: ${increaseInMB.toFixed(2)}MB`);
    
    // Memory increase should be minimal (< 10MB)
    expect(increaseInMB).toBeLessThan(10);
  });

  test('CSS reflow/repaint performance', async ({ page }) => {
    // Enable performance observer
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        reflows: 0,
        repaints: 0
      };

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            window.performanceMetrics.reflows++;
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Reset metrics
    await page.evaluate(() => {
      window.performanceMetrics = { reflows: 0, repaints: 0 };
    });

    // Switch theme
    await page.click('[aria-label*="Select theme"]');
    await page.click('text=Blue Sky');
    await page.waitForTimeout(500);

    // Get metrics
    const metrics = await page.evaluate(() => window.performanceMetrics);
    
    console.log('CSS Performance Metrics:');
    console.log(`  Layout shifts: ${metrics.reflows}`);
    
    // Should have minimal layout shifts
    expect(metrics.reflows).toBeLessThan(5);
  });

  test('Concurrent theme operations', async ({ page }) => {
    // Test multiple simultaneous theme operations
    const operations = [
      page.click('[aria-label*="Select theme"]').then(() => page.click('text=Blue Sky')),
      page.click('[aria-label*="Switch to"]'),
      page.click('[aria-label*="Select language"]').then(() => page.click('text=العربية'))
    ];

    const startTime = Date.now();
    await Promise.all(operations);
    await page.waitForTimeout(500);
    const endTime = Date.now();

    const duration = endTime - startTime;
    console.log(`Concurrent operations completed in: ${duration}ms`);

    // Should handle concurrent operations gracefully
    expect(duration).toBeLessThan(1000);

    // Verify final state is consistent
    const theme = await page.getAttribute('html', 'data-theme');
    const colorMode = await page.getAttribute('html', 'data-color-mode');
    const dir = await page.getAttribute('html', 'dir');
    
    expect(theme).toBeTruthy();
    expect(colorMode).toBeTruthy();
    expect(dir).toBeTruthy();
  });
});

// Extend Window interface for TypeScript
declare global {
  interface Window {
    performanceMetrics: {
      reflows: number;
      repaints: number;
    };
  }
}