import { test, expect } from '@playwright/test';

/**
 * E2E Test: Bilingual Content Editing (T085)
 * Tests side-by-side EN/AR editing with RTL support
 *
 * Validates:
 * - Type English content (LTR)
 * - Type Arabic content (RTL)
 * - Synchronized scroll between panels
 * - Both languages saved correctly
 * - Auto-save functionality
 * - Keyboard navigation
 */

test.describe('Bilingual Position Editor', () => {
  test('should support side-by-side EN/AR editing with RTL', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Create new position
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    // Verify side-by-side editor visible
    await expect(page.locator('[data-testid="content-en-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-ar-editor"]')).toBeVisible();

    // Type English content (LTR)
    const englishContent = 'This is English content for testing. It should flow left-to-right.';
    await page.fill('[data-testid="content-en-editor"]', englishContent);

    // Verify LTR direction
    const enEditor = page.locator('[data-testid="content-en-editor"]');
    await expect(enEditor).toHaveAttribute('dir', 'ltr');

    // Type Arabic content (RTL)
    const arabicContent = 'هذا محتوى عربي للاختبار. يجب أن يتدفق من اليمين إلى اليسار.';
    await page.fill('[data-testid="content-ar-editor"]', arabicContent);

    // Verify RTL direction
    const arEditor = page.locator('[data-testid="content-ar-editor"]');
    await expect(arEditor).toHaveAttribute('dir', 'rtl');

    // Save draft
    await page.click('[data-testid="save-draft-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Draft saved');

    // Refresh page and verify both contents persisted
    await page.reload();
    await expect(enEditor).toHaveValue(englishContent);
    await expect(arEditor).toHaveValue(arabicContent);
  });

  test('should enforce synchronized scroll between EN and AR panels', async ({ page }) => {
    // Login and navigate to position editor
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    // Fill with long content to enable scrolling
    const longEnglishContent = Array(50).fill('English paragraph line.').join('\n');
    const longArabicContent = Array(50).fill('سطر فقرة عربية.').join('\n');

    await page.fill('[data-testid="content-en-editor"]', longEnglishContent);
    await page.fill('[data-testid="content-ar-editor"]', longArabicContent);

    // Scroll EN editor
    await page.locator('[data-testid="content-en-editor"]').evaluate((el) => {
      el.scrollTop = 200;
    });

    // Wait for synchronized scroll
    await page.waitForTimeout(300);

    // Verify AR editor scrolled to same position
    const arScrollTop = await page.locator('[data-testid="content-ar-editor"]').evaluate((el) => el.scrollTop);
    expect(arScrollTop).toBeGreaterThan(150); // Close to 200, accounting for sync delay
  });

  test('should support keyboard navigation in bilingual editor', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    // Tab through form fields
    await page.keyboard.press('Tab'); // Position type
    await page.keyboard.press('Tab'); // Title EN
    await page.keyboard.type('Keyboard Test Position');

    await page.keyboard.press('Tab'); // Title AR
    await page.keyboard.type('موقف اختبار لوحة المفاتيح');

    await page.keyboard.press('Tab'); // Content EN editor
    await expect(page.locator('[data-testid="content-en-editor"]')).toBeFocused();

    // Type in EN editor
    await page.keyboard.type('English content via keyboard');

    await page.keyboard.press('Tab'); // Content AR editor
    await expect(page.locator('[data-testid="content-ar-editor"]')).toBeFocused();

    // Verify Ctrl+S saves
    await page.keyboard.press('Control+S');
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('saved', { timeout: 2000 });
  });

  test('should auto-save draft at regular intervals', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    // Type content without manual save
    await page.fill('[data-testid="title-en-input"]', 'Auto-Save Test');
    await page.fill('[data-testid="content-en-editor"]', 'Content for auto-save test');

    // Wait for auto-save (typically 30 seconds, but we'll check for indicator)
    await page.waitForTimeout(35000);

    // Verify auto-save indicator appeared
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toHaveText(/saved|تم الحفظ/);
  });
});
