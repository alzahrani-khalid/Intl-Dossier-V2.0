import { test, expect } from '@playwright/test';

/**
 * Edge Case Test: Low AI Confidence Handling
 * Reference: quickstart.md lines 777-783
 */

test.describe('Edge Case: Low AI Confidence', () => {
  test('should not populate items with confidence < 0.5', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Mock AI response with low confidence item
    await page.route('**/ai/extract', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          decisions: [
            {
              description: 'High confidence decision',
              decision_maker: 'John',
              decision_date: '2025-09-29',
              confidence: 0.9
            },
            {
              description: 'Low confidence decision',
              decision_maker: 'Unknown',
              decision_date: '2025-09-29',
              confidence: 0.45
            }
          ],
          commitments: [],
          risks: []
        })
      });
    });

    // Upload file to trigger extraction
    await page.click('button:has-text("Extract from Minutes")');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(Buffer.from('Test content'), { name: 'test.txt', mimeType: 'text/plain' });
    await page.click('button:has-text("Upload")');

    // Wait for extraction
    await page.waitForTimeout(2000);

    // High confidence item should be populated
    await expect(page.locator('text=High confidence decision')).toBeVisible();

    // Low confidence item should NOT be populated
    await expect(page.locator('text=Low confidence decision')).not.toBeVisible();

    // Notice should be displayed
    const notice = page.locator('text=Low confidence item not populated').or(
      page.locator('text=Review source and add manually if correct')
    );
    await expect(notice.first()).toBeVisible();
  });

  test('should display warning for items with 0.5-0.79 confidence', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Mock AI response with medium confidence
    await page.route('**/ai/extract', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          decisions: [{
            description: 'Medium confidence decision',
            decision_maker: 'Someone',
            decision_date: '2025-09-29',
            confidence: 0.65
          }],
          commitments: [],
          risks: []
        })
      });
    });

    await page.click('button:has-text("Extract from Minutes")');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(Buffer.from('Test content'), { name: 'test.txt', mimeType: 'text/plain' });
    await page.click('button:has-text("Upload")');

    await page.waitForTimeout(2000);

    // Medium confidence item should be populated
    await expect(page.locator('text=Medium confidence decision')).toBeVisible();

    // But should have warning icon/badge
    const warningIndicator = page.locator('[data-confidence="0.65"]').or(
      page.locator('.confidence-warning')
    );
    await expect(warningIndicator.first()).toBeVisible();
  });
});
