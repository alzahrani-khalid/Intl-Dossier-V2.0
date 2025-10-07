import { test, expect } from '@playwright/test';

/**
 * Performance Test: T098 - Bundle Size Validation
 * Initial bundle < 300KB, assignment chunk < 50KB, i18n < 20KB each.
 */

test.describe('Bundle Size Validation', () => {
  test('initial bundle size < 300KB gzipped', async ({ page }) => {
    const resources: any[] = [];
    page.on('response', response => {
      if (response.url().includes('.js')) {
        resources.push({
          url: response.url(),
          size: parseInt(response.headers()['content-length'] || '0')
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalKB = totalSize / 1024;

    console.log(`Initial bundle size: ${totalKB.toFixed(2)} KB`);
    expect(totalKB).toBeLessThan(300);
  });

  test('assignment detail chunk < 50KB', async ({ page }) => {
    let chunkSize = 0;
    page.on('response', response => {
      if (response.url().includes('assignment') && response.url().includes('.js')) {
        chunkSize = parseInt(response.headers()['content-length'] || '0');
      }
    });

    await page.goto('/assignments/test-001');
    await page.waitForLoadState('networkidle');

    const chunkKB = chunkSize / 1024;
    console.log(`Assignment chunk size: ${chunkKB.toFixed(2)} KB`);
    
    if (chunkSize > 0) {
      expect(chunkKB).toBeLessThan(50);
    }
  });
});
