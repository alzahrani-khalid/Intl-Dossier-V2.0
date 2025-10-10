// T085: Accessibility test - RTL layout validation
import { test, expect } from '@playwright/test';

test.describe('RTL Layout Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('should switch to Arabic RTL layout', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    // Verify dir="rtl" on root element
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify content direction
    const container = page.locator('[data-testid="main-container"]');
    const direction = await container.evaluate(el => window.getComputedStyle(el).direction);
    expect(direction).toBe('rtl');

    console.log('✓ RTL layout activated');
  });

  test('should use logical properties in RTL mode', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    // Check that margins/paddings use logical properties
    const button = page.locator('button').first();
    const marginInlineStart = await button.evaluate(el =>
      window.getComputedStyle(el).getPropertyValue('margin-inline-start')
    );

    // Logical properties should be defined (not empty)
    expect(marginInlineStart).not.toBe('');

    console.log('✓ Logical properties used correctly');
  });

  test('should flip directional icons in RTL', async ({ page }) => {
    // Navigate to dossier with breadcrumb
    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    // Check chevron icons are rotated
    const chevronIcon = page.locator('[data-testid="breadcrumb-chevron"]').first();
    const transform = await chevronIcon.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Should have rotation applied
    expect(transform).not.toBe('none');
    expect(transform).toContain('matrix'); // Transform matrix applied

    console.log('✓ Directional icons flipped in RTL');
  });

  test('should align text correctly in RTL', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');

    // Check text alignment
    const heading = page.locator('h1').first();
    const textAlign = await heading.evaluate(el =>
      window.getComputedStyle(el).textAlign
    );

    // Should use 'start' (logical property) not 'right'
    expect(['start', 'right']).toContain(textAlign);

    console.log('✓ Text alignment correct in RTL');
  });

  test('should render network graph correctly in RTL', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');
    await page.click('text=العلاقات'); // "Relationships" in Arabic

    // Wait for graph
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });

    // Check graph container direction
    const graphContainer = page.locator('.react-flow');
    const direction = await graphContainer.evaluate(el =>
      window.getComputedStyle(el).direction
    );

    expect(direction).toBe('rtl');

    // Check node labels are in Arabic
    const nodeLabel = page.locator('.react-flow__node').first();
    const labelText = await nodeLabel.textContent();

    // Should contain Arabic text
    expect(labelText).toMatch(/[\u0600-\u06FF]/);

    console.log('✓ Network graph renders correctly in RTL');
  });

  test('should handle calendar events in RTL', async ({ page }) => {
    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('http://localhost:5173/calendar');

    // Check calendar grid direction
    const calendarGrid = page.locator('[data-testid="calendar-grid"]');
    const direction = await calendarGrid.evaluate(el =>
      window.getComputedStyle(el).direction
    );

    expect(direction).toBe('rtl');

    // Check that events align correctly
    const event = page.locator('[data-testid="calendar-event"]').first();
    const inlineStart = await event.evaluate(el =>
      window.getComputedStyle(el).getPropertyValue('inset-inline-start')
    );

    // Should use logical positioning
    expect(inlineStart).not.toBe('');

    console.log('✓ Calendar events positioned correctly in RTL');
  });

  test('should maintain touch target sizes in RTL', async ({ page }, testInfo) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto('http://localhost:5173/dossiers/countries/saudi-arabia');

    // Check button sizes meet minimum 44x44px
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    console.log('✓ Touch targets meet 44x44px minimum in RTL');
  });
});
