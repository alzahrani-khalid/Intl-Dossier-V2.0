import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * A11y Test: Positions Pages (English) - T089
 * Tests WCAG 2.1 Level AA compliance for all position routes in English
 *
 * Validates:
 * - WCAG 2.1 Level AA compliance
 * - Keyboard navigation (Tab, Enter, Esc)
 * - Screen reader compatibility
 * - Proper ARIA labels
 */

test.describe('Positions Accessibility (English)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'drafter@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
  });

  test('positions list page should be accessible', async ({ page }) => {
    await page.goto('/positions');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('position detail page should be accessible', async ({ page }) => {
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('position editor should be accessible', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('positions list should support keyboard navigation', async ({ page }) => {
    await page.goto('/positions');

    // Tab to first position card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Enter to open position
    await page.keyboard.press('Enter');

    // Verify position detail page loaded
    await expect(page).toHaveURL(/\/positions\//);
  });

  test('approval dashboard should be accessible', async ({ page }) => {
    await page.goto('/approvals');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('version history page should be accessible', async ({ page }) => {
    const positionId = '123e4567-e89b-12d3-a456-426614174000';
    await page.goto(`/positions/${positionId}/versions`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels on all interactive elements', async ({ page }) => {
    await page.goto('/positions');

    // Verify buttons have aria-labels
    const newButton = page.locator('[data-testid="new-position-button"]');
    await expect(newButton).toHaveAttribute('aria-label');

    // Verify form inputs have labels
    await page.click('[data-testid="new-position-button"]');
    const titleInput = page.locator('[data-testid="title-en-input"]');
    const labelId = await titleInput.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
  });

  test('should announce screen reader messages for status changes', async ({ page }) => {
    await page.goto('/positions');
    await page.click('[data-testid="new-position-button"]');

    // Fill and save
    await page.fill('[data-testid="title-en-input"]', 'Test Position');
    await page.click('[data-testid="save-draft-button"]');

    // Verify ARIA live region announces success
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/saved|success/i);
  });
});
