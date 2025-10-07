import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Edge Case Test: Attachment Limit Enforcement
 * Reference: quickstart.md lines 727-731
 */

test.describe('Edge Case: Attachment Limit', () => {
  const testFilesDir = path.join(__dirname, '../fixtures/attachments');
  const testFiles: string[] = [];

  test.beforeAll(() => {
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create 11 test files
    for (let i = 1; i <= 11; i++) {
      const filePath = path.join(testFilesDir, `test-file-${i}.pdf`);
      fs.writeFileSync(filePath, `Test PDF Content ${i}`);
      testFiles.push(filePath);
    }
  });

  test.afterAll(() => {
    testFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(testFilesDir)) fs.rmdirSync(testFilesDir);
  });

  test('should allow uploading 10 attachments', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Upload 10 files
    for (let i = 0; i < 10; i++) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFiles[i]);
      await expect(page.locator(`text=test-file-${i + 1}.pdf`)).toBeVisible({ timeout: 5000 });
    }

    await expect(page.locator('.attachment-item')).toHaveCount(10);
  });

  test('should block 11th attachment with error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Upload 10 files first
    for (let i = 0; i < 10; i++) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFiles[i]);
      await page.waitForTimeout(500);
    }

    // Try to upload 11th file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles[10]);

    // Verify error message
    await expect(page.locator('text=Maximum 10 attachments per after-action record')).toBeVisible();
    await expect(page.locator('.attachment-item')).toHaveCount(10); // Still only 10
  });
});
