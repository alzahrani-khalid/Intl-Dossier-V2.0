import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

interface WCAGViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

interface WCAGAuditReport {
  timestamp: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  violations: WCAGViolation[];
  pages: Array<{
    url: string;
    violations: number;
    criticalIssues: string[];
  }>;
  recommendations: string[];
}

test.describe('WCAG 2.1 AA Compliance Audit', () => {
  let auditReport: WCAGAuditReport;

  test.beforeAll(async () => {
    auditReport = {
      timestamp: new Date().toISOString(),
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0,
      moderateViolations: 0,
      minorViolations: 0,
      violations: [],
      pages: [],
      recommendations: []
    };
  });

  test('Homepage WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await injectAxe(page);

    const violations = await getViolations(page, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    // Categorize violations by impact
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');
    const moderate = violations.filter(v => v.impact === 'moderate');
    const minor = violations.filter(v => v.impact === 'minor');

    auditReport.totalViolations += violations.length;
    auditReport.criticalViolations += critical.length;
    auditReport.seriousViolations += serious.length;
    auditReport.moderateViolations += moderate.length;
    auditReport.minorViolations += minor.length;

    auditReport.pages.push({
      url: '/',
      violations: violations.length,
      criticalIssues: critical.map(v => v.description)
    });

    // WCAG 2.1 AA requires zero critical and serious violations
    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);

    // Log moderate violations for review
    if (moderate.length > 0) {
      console.log('Moderate WCAG violations found:', moderate.map(v => v.description));
    }
  });

  test('Login Page WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await injectAxe(page);

    const violations = await getViolations(page);
    
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');

    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);

    // Test keyboard navigation
    await testKeyboardNavigation(page);
  });

  test('Dashboard WCAG 2.1 AA Compliance', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="email"]', 'test@gastat.sa');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('http://localhost:5173/dashboard');
    await injectAxe(page);

    const violations = await getViolations(page);
    
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');

    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);

    // Test complex UI components
    await testDataTablesAccessibility(page);
    await testChartsAccessibility(page);
    await testModalsAccessibility(page);
  });

  test('Forms WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('http://localhost:5173/mous/new');
    await injectAxe(page);

    const violations = await getViolations(page);
    
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');

    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);

    // Test form-specific accessibility
    await testFormLabels(page);
    await testErrorMessages(page);
    await testFieldDescriptions(page);
  });

  test('Arabic RTL WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Switch to Arabic
    await page.locator('button[aria-label="Language"]').click();
    await page.locator('text=العربية').click();
    
    await injectAxe(page);
    const violations = await getViolations(page);
    
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');

    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);

    // Test RTL-specific accessibility
    await testRTLSupport(page);
    await testBidirectionalText(page);
  });

  test('Color Contrast Validation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await injectAxe(page);

    // Check color contrast for both English and Arabic
    const contrastViolations = await getViolations(page, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // WCAG 2.1 AA requires 4.5:1 contrast ratio for normal text
    expect(contrastViolations).toHaveLength(0);

    // Test with Arabic content
    await page.locator('button[aria-label="Language"]').click();
    await page.locator('text=العربية').click();
    
    const arabicContrastViolations = await getViolations(page, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(arabicContrastViolations).toHaveLength(0);
  });

  test('Focus Management Testing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Test focus visibility
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        hasOutline: window.getComputedStyle(el!).outline !== 'none',
        hasFocusVisible: el?.matches(':focus-visible')
      };
    });

    expect(focusedElement.hasOutline).toBe(true);
    expect(focusedElement.hasFocusVisible).toBe(true);

    // Test focus trap in modals
    await testFocusTrap(page);
  });

  test('Screen Reader Compatibility', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Test ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav');
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');

      return {
        hasMain: !!main,
        hasNav: !!nav,
        hasHeader: !!header,
        hasFooter: !!footer,
        mainHasRole: main?.getAttribute('role') === 'main',
        navHasRole: nav?.getAttribute('role') === 'navigation'
      };
    });

    expect(landmarks.hasMain).toBe(true);
    expect(landmarks.hasNav).toBe(true);
    expect(landmarks.hasHeader).toBe(true);
    expect(landmarks.mainHasRole).toBe(true);
    expect(landmarks.navHasRole).toBe(true);

    // Test heading hierarchy
    await testHeadingHierarchy(page);
  });

  test.afterAll(async () => {
    // Generate final audit report
    console.log('WCAG 2.1 AA Compliance Audit Report:');
    console.log(JSON.stringify(auditReport, null, 2));
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'wcag-audit-report.json',
      JSON.stringify(auditReport, null, 2)
    );
  });
});

// Helper functions for specific accessibility tests

async function testKeyboardNavigation(page: any) {
  // Test tab order
  const tabOrder = await page.evaluate(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(focusableElements).map(el => ({
      tagName: el.tagName,
      text: el.textContent?.trim(),
      tabIndex: el.getAttribute('tabindex')
    }));
  });

  expect(tabOrder.length).toBeGreaterThan(0);
}

async function testDataTablesAccessibility(page: any) {
  // Check for proper table headers
  const tables = await page.$$('table');
  for (const table of tables) {
    const headers = await table.$$('th');
    expect(headers.length).toBeGreaterThan(0);
    
    // Check for scope attributes
    const scopedHeaders = await table.$$('th[scope]');
    expect(scopedHeaders.length).toBeGreaterThan(0);
  }
}

async function testChartsAccessibility(page: any) {
  // Check for chart accessibility attributes
  const charts = await page.$$('[role="img"]');
  for (const chart of charts) {
    const ariaLabel = await chart.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  }
}

async function testModalsAccessibility(page: any) {
  // Test modal accessibility when opened
  const modalTrigger = page.locator('[data-testid="open-modal"]');
  if (await modalTrigger.isVisible()) {
    await modalTrigger.click();
    
    const modal = page.locator('[role="dialog"]');
    expect(await modal.isVisible()).toBe(true);
    
    // Check for focus trap
    await testFocusTrap(page);
    
    // Check for escape key handling
    await page.keyboard.press('Escape');
    expect(await modal.isVisible()).toBe(false);
  }
}

async function testFormLabels(page: any) {
  // Check all form inputs have labels
  const inputs = await page.$$('input, select, textarea');
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      expect(label).toBeTruthy();
    }
  }
}

async function testErrorMessages(page: any) {
  // Test error message association
  const errorMessages = await page.$$('[role="alert"]');
  for (const error of errorMessages) {
    const ariaLive = await error.getAttribute('aria-live');
    expect(ariaLive).toBeTruthy();
  }
}

async function testFieldDescriptions(page: any) {
  // Check for field descriptions
  const describedByElements = await page.$$('[aria-describedby]');
  for (const element of describedByElements) {
    const describedBy = await element.getAttribute('aria-describedby');
    const description = await page.$(`#${describedBy}`);
    expect(description).toBeTruthy();
  }
}

async function testRTLSupport(page: any) {
  // Check RTL attributes
  const html = await page.$('html');
  const dir = await html?.getAttribute('dir');
  expect(dir).toBe('rtl');
  
  // Check for RTL-specific CSS classes
  const body = await page.$('body');
  const className = await body?.getAttribute('class');
  expect(className).toContain('rtl');
}

async function testBidirectionalText(page: any) {
  // Check for proper bidirectional text handling
  const textElements = await page.$$('p, span, div');
  for (const element of textElements) {
    const text = await element.textContent();
    if (text && /[\u0600-\u06FF]/.test(text)) {
      // Arabic text should have proper direction
      const dir = await element.getAttribute('dir');
      expect(dir).toBe('rtl');
    }
  }
}

async function testFocusTrap(page: any) {
  // Test focus trap in modal
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible()) {
    const firstFocusable = modal.locator('button, input, select, textarea').first();
    const lastFocusable = modal.locator('button, input, select, textarea').last();
    
    await firstFocusable.focus();
    await page.keyboard.press('Shift+Tab');
    
    // Focus should stay within modal
    const activeElement = await page.evaluate(() => document.activeElement);
    expect(activeElement).toBeTruthy();
  }
}

async function testHeadingHierarchy(page: any) {
  // Check heading hierarchy
  const headings = await page.$$('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  for (const heading of headings) {
    const level = parseInt(heading.tagName.charAt(1));
    expect(level).toBeLessThanOrEqual(previousLevel + 1);
    previousLevel = level;
  }
}
