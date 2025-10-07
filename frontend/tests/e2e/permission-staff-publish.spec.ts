import { test, expect } from '@playwright/test';

/**
 * Edge Case Test: Staff Tries to Publish (Role Check)
 * Reference: quickstart.md lines 770-775
 */

test.describe('Edge Case: Permission - Staff Publish Attempt', () => {
  test('should not show publish button for staff role', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions');
    await page.click('[data-status="draft"]');

    // Verify Publish button not visible
    const publishButton = page.locator('button:has-text("Publish")');
    await expect(publishButton).not.toBeVisible();
  });

  test('should block direct API publish attempt by staff', async ({ page, request }) => {
    // Login as staff
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Get auth token from cookies
    const cookies = await page.context().cookies();
    const authToken = cookies.find(c => c.name === 'sb-access-token')?.value;

    // Try to publish via API directly
    const response = await request.post('/api/after-actions/33333333-3333-3333-3333-333333333333/publish', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Verify 403 Forbidden
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('Insufficient permissions');
  });
});
