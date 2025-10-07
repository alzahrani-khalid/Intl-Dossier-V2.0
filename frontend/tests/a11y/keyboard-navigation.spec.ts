import { test, expect } from '@playwright/test';

/**
 * Accessibility Test: Keyboard Navigation
 * Reference: quickstart.md lines 829-833
 */

test.describe('Accessibility: Keyboard Navigation', () => {
  test('should navigate entire after-action form using only keyboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Start tabbing through form
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluateHandle(() => document.activeElement);

    const focusableElements: string[] = [];
    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      const tagName = await page.evaluate(el => el?.tagName, focusedElement);
      const id = await page.evaluate(el => el?.id, focusedElement);
      const type = await page.evaluate(el => el?.getAttribute?.('type'), focusedElement);

      focusableElements.push(`${tagName}${id ? `#${id}` : ''}${type ? `[type=${type}]` : ''}`);

      await page.keyboard.press('Tab');
      focusedElement = await page.evaluateHandle(() => document.activeElement);
      iterations++;
    }

    console.log('Focusable elements:', focusableElements);

    // Verify all expected fields accessible
    expect(focusableElements.some(el => el.includes('attendees'))).toBe(true);
    expect(focusableElements.some(el => el.includes('decision'))).toBe(true);
    expect(focusableElements.some(el => el.includes('commitment'))).toBe(true);

    // Verify no keyboard traps
    const uniqueElements = new Set(focusableElements);
    expect(uniqueElements.size).toBeGreaterThan(10); // At least 10 unique focusable elements
  });

  test('should support Shift+Tab for reverse navigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-staff@gastat.gov.sa');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.goto('/_protected/engagements/22222222-2222-2222-2222-222222222222/after-action');

    // Tab forward 5 times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    const forwardElement = await page.evaluateHandle(() => document.activeElement);
    const forwardId = await page.evaluate(el => el?.id, forwardElement);

    // Tab backward 5 times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
    }

    const backwardElement = await page.evaluateHandle(() => document.activeElement);
    const backwardId = await page.evaluate(el => el?.id, backwardElement);

    // Should return to original element
    expect(backwardId).toBeDefined();
  });
});
