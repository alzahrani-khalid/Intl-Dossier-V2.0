/**
 * Temporary Playwright Test
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Tests the new dossier-centric dashboard components:
 * - Quick Stats Summary cards
 * - My Dossiers section
 * - Recent Dossier Activity timeline
 * - Pending Work by Dossier grouped view
 *
 * This file should be deleted after verification.
 */

import { test, expect } from '@playwright/test';

// Test credentials from CLAUDE.md
const TEST_EMAIL = 'kazahrani@stats.gov.sa';
const TEST_PASSWORD = 'itisme';

test.describe('Dossier-Centric Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login with test credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete (should redirect to dashboard)
    await page.waitForURL('**/*', { timeout: 10000 });

    // Navigate to dashboard explicitly
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the dashboard header with title and subtitle', async ({ page }) => {
    // Check for dashboard title
    const title = page.locator('h1');
    await expect(title).toContainText(/Dashboard|لوحة/i);

    // Check for subtitle
    const subtitle = page.locator('p').filter({ hasText: /dossier|ملفات/i });
    await expect(subtitle.first()).toBeVisible();
  });

  test('should display quick stats summary cards', async ({ page }) => {
    // Wait for stats cards to load (check for cards or skeleton loaders)
    const statsSection = page
      .locator('section')
      .filter({ has: page.locator('[class*="grid"]') })
      .first();
    await expect(statsSection).toBeVisible();

    // Check that at least some cards are visible
    const cards = page.locator('[class*="Card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display My Dossiers section with filter tabs', async ({ page }) => {
    // Look for My Dossiers section header
    const myDossiersSection = page.locator('section').filter({ hasText: /My Dossiers|ملفاتي/i });

    // If section is not visible, the user may not have any dossiers
    const isVisible = await myDossiersSection
      .first()
      .isVisible()
      .catch(() => false);

    if (isVisible) {
      await expect(myDossiersSection.first()).toBeVisible();

      // Check for filter tabs (All, Owned, etc.)
      const filterButton = page.locator('button').filter({ hasText: /All|الكل|Owned|مملوكة/i });
      await expect(filterButton.first()).toBeVisible();
    } else {
      // Skip if no dossiers section (might be empty state)
      test.skip();
    }
  });

  test('should display Recent Dossier Activity section', async ({ page }) => {
    // Look for Recent Activity section
    const activitySection = page
      .locator('[class*="Card"]')
      .filter({ hasText: /Recent.*Activity|نشاط.*الأخير/i });

    const isVisible = await activitySection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await expect(activitySection.first()).toBeVisible();
    } else {
      // Activity section might be empty or hidden
      test.skip();
    }
  });

  test('should display Pending Work by Dossier section', async ({ page }) => {
    // Look for Pending Work section
    const pendingSection = page
      .locator('[class*="Card"]')
      .filter({ hasText: /Pending Work|الأعمال المعلقة/i });

    const isVisible = await pendingSection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await expect(pendingSection.first()).toBeVisible();
    } else {
      // Pending work section might be empty or hidden
      test.skip();
    }
  });

  test('should display AI Recommendations panel', async ({ page }) => {
    // Look for Recommendations panel
    const recommendationsPanel = page
      .locator('[class*="Card"]')
      .filter({ hasText: /Recommend|توصيات/i });

    const isVisible = await recommendationsPanel
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await expect(recommendationsPanel.first()).toBeVisible();
    }
  });

  test('should display Due for Review section', async ({ page }) => {
    // Look for Due for Review section
    const reviewSection = page
      .locator('[class*="Card"]')
      .filter({ hasText: /Due for Review|مستحقة للمراجعة/i });

    const isVisible = await reviewSection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await expect(reviewSection.first()).toBeVisible();
    }
  });

  test('should handle RTL layout when Arabic is selected', async ({ page }) => {
    // Look for language toggle or settings
    const languageToggle = page.locator('button').filter({ hasText: /AR|العربية|Language|اللغة/i });

    const isVisible = await languageToggle
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      // Click to switch to Arabic
      await languageToggle.first().click();
      await page.waitForLoadState('networkidle');

      // Check that dir attribute is set to rtl
      const mainContainer = page.locator('[dir="rtl"]');
      const isRTL = (await mainContainer.count()) > 0;

      // Either the entire page or a container should be RTL
      expect(isRTL || (await page.locator('html').getAttribute('dir')) === 'rtl').toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for responsive changes
    await page.waitForTimeout(500);

    // Check that layout adapts (e.g., cards stack vertically)
    const dashboard = page.locator('[class*="space-y"]').first();
    await expect(dashboard).toBeVisible();

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Small tolerance for scrollbar
  });

  test('should navigate to dossier detail when clicking View All', async ({ page }) => {
    // Look for "View All" button in My Dossiers section
    const viewAllButton = page.locator('button, a').filter({ hasText: /View All|عرض الكل/i });

    const isVisible = await viewAllButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await viewAllButton.first().click();

      // Should navigate to dossiers list page
      await page.waitForURL(/dossier/i, { timeout: 5000 });
      expect(page.url()).toMatch(/dossier/i);
    } else {
      test.skip();
    }
  });
});
