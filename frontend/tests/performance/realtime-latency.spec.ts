import { test, expect } from '@playwright/test';

/**
 * Performance Test: T096 - Real-time Latency
 * Measures latency for real-time updates < 1 second target.
 */

test.describe('Real-time Latency Performance', () => {
  test('comment update latency < 1 second', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.fill('input[name="email"]', 'staff@example.com');
    await page1.fill('input[name="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.goto('/assignments/test-001');

    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'supervisor@example.com');
    await page2.fill('input[name="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.goto('/assignments/test-001');

    const startTime = Date.now();
    await page1.fill('textarea[name="comment"]', `Performance test ${Date.now()}`);
    await page1.click('button:has-text("Post Comment")');

    await page2.waitForSelector(`text=Performance test`, { timeout: 2000 });
    const endTime = Date.now();
    const latency = endTime - startTime;

    expect(latency).toBeLessThan(1000);
    console.log(`Comment latency: ${latency}ms`);

    await page1.close();
    await page2.close();
  });

  test('checklist update latency < 1 second', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.fill('input[name="email"]', 'staff@example.com');
    await page1.fill('input[name="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.goto('/assignments/test-001');

    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'supervisor@example.com');
    await page2.fill('input[name="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.goto('/assignments/test-001');

    await page1.click('button:has-text("Import Checklist")');
    await page1.click('text=Dossier Review');
    await page1.waitForTimeout(1000);

    const checkbox = page1.locator('input[type="checkbox"]').first();
    const startTime = Date.now();
    await checkbox.check();

    await page2.waitForSelector('input[type="checkbox"]:checked', { timeout: 2000 });
    const endTime = Date.now();
    const latency = endTime - startTime;

    expect(latency).toBeLessThan(1000);
    console.log(`Checklist latency: ${latency}ms`);

    await page1.close();
    await page2.close();
  });
});
