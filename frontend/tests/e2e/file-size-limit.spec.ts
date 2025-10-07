import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Edge Case Test: File Size Limit
 * Reference: quickstart.md lines 742-746
 */

test.describe('Edge Case: File Size Limit', () => {
  const largeFilePath = path.join(__dirname, '../fixtures/large-file.pdf');

  test.beforeAll(() => {
    const dir = path.dirname(largeFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Create 150MB file
    const buffer = Buffer.alloc(150 * 1024 * 1024, 'X');
    fs.writeFileSync(largeFilePath, buffer);
  });

  test.afterAll(() => {
    if (fs.existsSync(largeFilePath)) {
      fs.unlinkSync(largeFilePath);
    }
  });

  test('should reject file exceeding 100MB limit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeFilePath);

    await expect(page.locator('text=File size exceeds 100MB limit')).toBeVisible();
  });
});
