import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Edge Case Test: Virus Detection
 * Reference: quickstart.md lines 754-763
 */

test.describe('Edge Case: Virus Detection', () => {
  const eicarFilePath = path.join(__dirname, '../fixtures/eicar.txt');

  // EICAR test signature - standard for testing antivirus
  const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

  test.beforeAll(() => {
    const dir = path.dirname(eicarFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(eicarFilePath, EICAR_SIGNATURE);
  });

  test.afterAll(() => {
    if (fs.existsSync(eicarFilePath)) fs.unlinkSync(eicarFilePath);
  });

  test('should detect infected file via ClamAV', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(eicarFilePath);

    // Upload succeeds initially
    await expect(page.locator('text=eicar.txt')).toBeVisible();

    // Scan status shows pending
    await expect(page.locator('[data-scan-status="pending"]')).toBeVisible();

    // Wait for scan (up to 10 seconds)
    await expect(page.locator('[data-scan-status="infected"]')).toBeVisible({ timeout: 15000 });

    // Verify warning displayed
    await expect(page.locator('text=This file failed virus scan')).toBeVisible();

    // Try to download - should be blocked
    const downloadLink = page.locator('a[href*="eicar.txt"]');
    await expect(downloadLink).toBeDisabled();
  });
});
