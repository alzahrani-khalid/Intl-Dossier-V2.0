import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Inject axe-core
    await injectAxe(page);
  });

  test('should have no accessibility violations on login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on dashboard', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on countries page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to countries page
    await page.goto('http://localhost:5173/countries');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on organizations page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to organizations page
    await page.goto('http://localhost:5173/organizations');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on MoUs page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to MoUs page
    await page.goto('http://localhost:5173/mous');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on events page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to events page
    await page.goto('http://localhost:5173/events');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on intelligence page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to intelligence page
    await page.goto('http://localhost:5173/intelligence');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have no accessibility violations on data library page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to data library page
    await page.goto('http://localhost:5173/data-library');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for proper ARIA labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }
    
    // Check for proper roles
    const main = page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThan(0);
    
    const navigation = page.locator('nav, [role="navigation"]');
    expect(await navigation.count()).toBeGreaterThan(0);
  });

  test('should have proper color contrast', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for color contrast violations
    const violations = await getViolations(page, null, {
      rules: ['color-contrast']
    });
    
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check heading hierarchy
    const h1Elements = await page.locator('h1').all();
    const h2Elements = await page.locator('h2').all();
    const h3Elements = await page.locator('h3').all();
    
    // Should have at least one h1
    expect(h1Elements.length).toBeGreaterThan(0);
    
    // Check that headings are properly nested
    for (const h2 of h2Elements) {
      const h1Before = await h2.evaluate((el) => {
        const h1s = Array.from(document.querySelectorAll('h1'));
        return h1s.some(h1 => h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(h1Before).toBe(true);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Check that all form inputs have labels
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBe(true);
      }
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test focus management
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement);
    
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement);
    
    expect(firstFocused).not.toBe(secondFocused);
  });

  test('should have proper skip links', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for skip links
    const skipLinks = page.locator('a[href^="#"], [data-skip-link]');
    const skipLinkCount = await skipLinks.count();
    
    // Should have at least one skip link
    expect(skipLinkCount).toBeGreaterThan(0);
  });

  test('should have proper language attributes', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Check html lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBeTruthy();
    
    // Check dir attribute for RTL support
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(['ltr', 'rtl']).toContain(htmlDir);
  });

  test('should have proper alt text for images', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check that all images have alt text
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });

  test('should have proper table headers', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to countries page (which has tables)
    await page.goto('http://localhost:5173/countries');
    await page.waitForLoadState('networkidle');
    
    // Check that all tables have proper headers
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      const headers = await table.locator('th').all();
      const rows = await table.locator('tr').all();
      
      // Should have headers
      expect(headers.length).toBeGreaterThan(0);
      
      // First row should contain headers
      if (rows.length > 0) {
        const firstRowCells = await rows[0].locator('th, td').all();
        expect(firstRowCells.length).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper error handling for screen readers', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit form with invalid data
    await page.click('[data-testid="login-button"]');
    
    // Check that error messages are properly announced
    const errorMessages = page.locator('[role="alert"], .error, [aria-live]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      // Error messages should be visible and properly labeled
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        const text = await error.textContent();
        const ariaLive = await error.getAttribute('aria-live');
        
        expect(text).toBeTruthy();
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    }
  });

  test('should have proper mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on mobile
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have proper high contrast mode support', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check that elements have proper contrast
    const violations = await getViolations(page, null, {
      rules: ['color-contrast', 'color-contrast-enhanced']
    });
    
    expect(violations).toHaveLength(0);
  });

  test('should have accessible MFA enrollment flow', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to MFA settings (assuming this exists)
    await page.goto('http://localhost:5173/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on MFA page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Test MFA enrollment form accessibility
    const mfaForm = page.locator('[data-testid="mfa-enrollment-form"]');
    if (await mfaForm.count() > 0) {
      // Check that form has proper labels
      const inputs = await mfaForm.locator('input').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = mfaForm.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBe(true);
        }
      }
      
      // Check that QR code has proper alt text
      const qrCode = mfaForm.locator('img[alt*="QR"], img[alt*="qr"]');
      if (await qrCode.count() > 0) {
        const alt = await qrCode.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
  });

  test('should have accessible MFA verification flow', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for MFA verification page
    await page.waitForURL('**/mfa-verify');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on MFA verification page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Test MFA verification form accessibility
    const mfaForm = page.locator('[data-testid="mfa-verification-form"]');
    if (await mfaForm.count() > 0) {
      // Check that code input has proper labels
      const codeInput = mfaForm.locator('input[type="text"], input[type="number"]');
      if (await codeInput.count() > 0) {
        const id = await codeInput.getAttribute('id');
        const ariaLabel = await codeInput.getAttribute('aria-label');
        const ariaLabelledBy = await codeInput.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy || id).toBeTruthy();
      }
      
      // Check that error messages are properly announced
      const errorMessages = mfaForm.locator('[role="alert"], .error, [aria-live]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i);
          const text = await error.textContent();
          const ariaLive = await error.getAttribute('aria-live');
          
          expect(text).toBeTruthy();
          expect(['polite', 'assertive']).toContain(ariaLive);
        }
      }
    }
  });

  test('should have accessible monitoring dashboard', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to monitoring dashboard
    await page.goto('http://localhost:5173/monitoring');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on monitoring page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Test that charts and graphs have proper labels
    const charts = page.locator('canvas, svg, [role="img"]');
    const chartCount = await charts.count();
    
    for (let i = 0; i < chartCount; i++) {
      const chart = charts.nth(i);
      const ariaLabel = await chart.getAttribute('aria-label');
      const ariaLabelledBy = await chart.getAttribute('aria-labelledby');
      const title = await chart.getAttribute('title');
      
      expect(ariaLabel || ariaLabelledBy || title).toBeTruthy();
    }
  });

  test('should have accessible export functionality', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to export page
    await page.goto('http://localhost:5173/export');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on export page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Test export form accessibility
    const exportForm = page.locator('[data-testid="export-form"]');
    if (await exportForm.count() > 0) {
      // Check that all form controls have proper labels
      const inputs = await exportForm.locator('input, select, textarea').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = exportForm.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBe(true);
        }
      }
      
      // Check that progress indicators are accessible
      const progressBars = exportForm.locator('[role="progressbar"], .progress-bar');
      const progressCount = await progressBars.count();
      
      for (let i = 0; i < progressCount; i++) {
        const progress = progressBars.nth(i);
        const ariaValueNow = await progress.getAttribute('aria-valuenow');
        const ariaValueMin = await progress.getAttribute('aria-valuemin');
        const ariaValueMax = await progress.getAttribute('aria-valuemax');
        
        expect(ariaValueNow).toBeTruthy();
        expect(ariaValueMin).toBeTruthy();
        expect(ariaValueMax).toBeTruthy();
      }
    }
  });

  test('should have accessible accessibility settings', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to accessibility settings
    await page.goto('http://localhost:5173/settings/accessibility');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on accessibility settings page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Test accessibility preferences form
    const prefsForm = page.locator('[data-testid="accessibility-preferences-form"]');
    if (await prefsForm.count() > 0) {
      // Check that all toggles and checkboxes have proper labels
      const toggles = await prefsForm.locator('input[type="checkbox"], button[role="switch"]').all();
      for (const toggle of toggles) {
        const id = await toggle.getAttribute('id');
        const ariaLabel = await toggle.getAttribute('aria-label');
        const ariaLabelledBy = await toggle.getAttribute('aria-labelledby');
        
        if (id) {
          const label = prefsForm.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBe(true);
        }
      }
      
      // Check that settings are properly grouped
      const fieldset = prefsForm.locator('fieldset');
      const fieldsetCount = await fieldset.count();
      expect(fieldsetCount).toBeGreaterThan(0);
      
      for (let i = 0; i < fieldsetCount; i++) {
        const legend = fieldset.nth(i).locator('legend');
        const legendCount = await legend.count();
        expect(legendCount).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper RTL support for Arabic content', async ({ page }) => {
    // Set Arabic locale
    await page.goto('http://localhost:5173/login?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check that page has RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
    
    // Check that Arabic content is properly displayed
    const arabicText = page.locator('text=تسجيل الدخول, text=كلمة المرور, text=دخول');
    const arabicCount = await arabicText.count();
    expect(arabicCount).toBeGreaterThan(0);
    
    // Check for accessibility violations in RTL mode
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have accessible error pages', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('http://localhost:5173/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations on error page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // Check that error page has proper heading structure
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check that error messages are properly announced
    const errorMessages = page.locator('[role="alert"], .error, [aria-live]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        const text = await error.textContent();
        const ariaLive = await error.getAttribute('aria-live');
        
        expect(text).toBeTruthy();
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    }
  });

  test('should have proper focus management in modals and dialogs', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email-input"]', 'admin@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for modals or dialogs
    const modals = page.locator('[role="dialog"], .modal, [data-testid*="modal"], [data-testid*="dialog"]');
    const modalCount = await modals.count();
    
    if (modalCount > 0) {
      // Open first modal
      const openModalButton = page.locator('[data-testid*="open-modal"], [data-testid*="open-dialog"]').first();
      if (await openModalButton.count() > 0) {
        await openModalButton.click();
        await page.waitForLoadState('networkidle');
        
        // Check that modal is accessible
        await checkA11y(page, null, {
          detailedReport: true,
          detailedReportOptions: { html: true }
        });
        
        // Check that focus is trapped in modal
        const modal = modals.first();
        const focusableElements = await modal.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').all();
        expect(focusableElements.length).toBeGreaterThan(0);
        
        // Test that focus moves to first focusable element
        await page.keyboard.press('Tab');
        const firstFocused = await page.evaluate(() => document.activeElement);
        const isInModal = await modal.evaluate((modalEl, focusedEl) => 
          modalEl.contains(focusedEl), firstFocused
        );
        expect(isInModal).toBe(true);
      }
    }
  });
});
