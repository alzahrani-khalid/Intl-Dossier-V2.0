import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { testDossierIds } from '../fixtures/dossier-fixtures';

/**
 * Accessibility Test: Screen Reader (Arabic)
 * Reference: quickstart.md lines 841-845
 */

test.describe('Accessibility: Screen Reader (Arabic)', () => {
  test('should pass axe accessibility scan in Arabic', async ({ page }) => {
    await page.goto(`/_protected/engagements/${testDossierIds.engagement}/after-action`);

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto(`/_protected/engagements/${testDossierIds.engagement}/after-action`);

    // Verify RTL layout
    const body = page.locator('body');
    const dir = await body.getAttribute('dir');
    expect(dir).toBe('rtl');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper Arabic labels', async ({ page }) => {
    await page.goto(`/_protected/engagements/${testDossierIds.engagement}/after-action`);

    // Switch to Arabic
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=العربية');

    await page.goto(`/_protected/engagements/${testDossierIds.engagement}/after-action`);

    // Verify Arabic text present
    await expect(page.locator('text=الحضور').or(page.locator('text=المشاركون'))).toBeVisible();
  });
});
