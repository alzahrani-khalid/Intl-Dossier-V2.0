import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Edge Case Test: Invalid File Type
 * Reference: quickstart.md lines 748-752
 */

test.describe('Edge Case: Invalid File Type', () => {
  const exeFilePath = path.join(__dirname, '../fixtures/test.exe');

  test.beforeAll(() => {
    const dir = path.dirname(exeFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(exeFilePath, 'MZ'); // Mock executable signature
  });

  test.afterAll(() => {
    if (fs.existsSync(exeFilePath)) fs.unlinkSync(exeFilePath);
  });

  test('should reject non-allowed file types', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exeFilePath);

    const errorMessage = 'File type not allowed. Allowed types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV';
    await expect(page.locator(`text=${errorMessage}`)).toBeVisible();
  });
});
