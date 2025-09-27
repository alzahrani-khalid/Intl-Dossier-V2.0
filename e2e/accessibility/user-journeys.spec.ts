import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

interface AccessibilityJourneyReport {
  journey: string;
  timestamp: string;
  language: 'ar' | 'en';
  steps: Array<{
    step: string;
    violations: any[];
    passed: boolean;
    recommendations: string[];
  }>;
  overallPassed: boolean;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
}

test.describe('Accessibility User Journeys', () => {
  let journeyReports: AccessibilityJourneyReport[] = [];

  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test('Complete User Registration Journey with Assistive Technology', async ({ page }) => {
    const report: AccessibilityJourneyReport = {
      journey: 'User Registration',
      timestamp: new Date().toISOString(),
      language: 'en',
      steps: [],
      overallPassed: true,
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0
    };

    // Step 1: Navigate to registration page
    await page.goto('http://localhost:5175/register');
    await injectAxe(page);
    
    let violations = await getViolations(page);
    report.steps.push({
      step: 'Navigate to registration page',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 2: Fill registration form with keyboard navigation
    await testKeyboardFormFilling(page, 'registration');
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Fill registration form with keyboard',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 3: Submit form and handle validation errors
    await page.click('[data-testid="register-button"]');
    await page.waitForTimeout(1000);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Submit form and handle validation',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Calculate overall results
    report.totalViolations = report.steps.reduce((sum, step) => sum + step.violations.length, 0);
    report.criticalViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'critical').length, 0);
    report.seriousViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'serious').length, 0);
    report.overallPassed = report.criticalViolations === 0 && report.seriousViolations === 0;

    journeyReports.push(report);
    expect(report.overallPassed).toBe(true);
  });

  test('Login Journey with Screen Reader Simulation', async ({ page }) => {
    const report: AccessibilityJourneyReport = {
      journey: 'User Login',
      timestamp: new Date().toISOString(),
      language: 'en',
      steps: [],
      overallPassed: true,
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0
    };

    // Step 1: Navigate to login page
    await page.goto('http://localhost:5175/login');
    await injectAxe(page);
    
    let violations = await getViolations(page);
    report.steps.push({
      step: 'Navigate to login page',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 2: Test screen reader navigation
    await testScreenReaderNavigation(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Screen reader navigation',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 3: Fill login form with assistive technology
    await testAssistiveTechnologyFormFilling(page, 'login');
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Fill login form with assistive technology',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 4: Complete login and navigate to dashboard
    await page.fill('[data-testid="email"]', 'test@gastat.sa');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:5175/dashboard');
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Complete login and navigate to dashboard',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Calculate overall results
    report.totalViolations = report.steps.reduce((sum, step) => sum + step.violations.length, 0);
    report.criticalViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'critical').length, 0);
    report.seriousViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'serious').length, 0);
    report.overallPassed = report.criticalViolations === 0 && report.seriousViolations === 0;

    journeyReports.push(report);
    expect(report.overallPassed).toBe(true);
  });

  test('Dashboard Navigation with Complex UI Interactions', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5175/login');
    await page.fill('[data-testid="email"]', 'test@gastat.sa');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:5175/dashboard');

    const report: AccessibilityJourneyReport = {
      journey: 'Dashboard Navigation',
      timestamp: new Date().toISOString(),
      language: 'en',
      steps: [],
      overallPassed: true,
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0
    };

    // Step 1: Test calendar accessibility
    await testCalendarAccessibility(page);
    
    let violations = await getViolations(page);
    report.steps.push({
      step: 'Calendar accessibility',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 2: Test data tables accessibility
    await testDataTablesAccessibility(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Data tables accessibility',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 3: Test modals accessibility
    await testModalsAccessibility(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Modals accessibility',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 4: Test navigation menu accessibility
    await testNavigationMenuAccessibility(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Navigation menu accessibility',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Calculate overall results
    report.totalViolations = report.steps.reduce((sum, step) => sum + step.violations.length, 0);
    report.criticalViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'critical').length, 0);
    report.seriousViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'serious').length, 0);
    report.overallPassed = report.criticalViolations === 0 && report.seriousViolations === 0;

    journeyReports.push(report);
    expect(report.overallPassed).toBe(true);
  });

  test('Mobile Accessibility Testing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const report: AccessibilityJourneyReport = {
      journey: 'Mobile Accessibility',
      timestamp: new Date().toISOString(),
      language: 'en',
      steps: [],
      overallPassed: true,
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0
    };

    // Step 1: Test mobile navigation
    await page.goto('http://localhost:5175');
    await injectAxe(page);
    
    let violations = await getViolations(page);
    report.steps.push({
      step: 'Mobile navigation',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 2: Test mobile forms
    await page.goto('http://localhost:5175/login');
    await testMobileFormAccessibility(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Mobile forms',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 3: Test mobile touch interactions
    await testMobileTouchInteractions(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Mobile touch interactions',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Calculate overall results
    report.totalViolations = report.steps.reduce((sum, step) => sum + step.violations.length, 0);
    report.criticalViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'critical').length, 0);
    report.seriousViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'serious').length, 0);
    report.overallPassed = report.criticalViolations === 0 && report.seriousViolations === 0;

    journeyReports.push(report);
    expect(report.overallPassed).toBe(true);
  });

  test('Arabic RTL User Journey', async ({ page }) => {
    const report: AccessibilityJourneyReport = {
      journey: 'Arabic RTL User Journey',
      timestamp: new Date().toISOString(),
      language: 'ar',
      steps: [],
      overallPassed: true,
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0
    };

    // Step 1: Switch to Arabic
    await page.goto('http://localhost:5175');
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();
    
    await injectAxe(page);
    let violations = await getViolations(page);
    report.steps.push({
      step: 'Switch to Arabic language',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 2: Test RTL navigation
    await testRTLNavigation(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'RTL navigation',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 3: Test Arabic form filling
    await testArabicFormFilling(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Arabic form filling',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Step 4: Test bidirectional text handling
    await testBidirectionalTextHandling(page);
    
    violations = await getViolations(page);
    report.steps.push({
      step: 'Bidirectional text handling',
      violations,
      passed: violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0,
      recommendations: generateRecommendations(violations)
    });

    // Calculate overall results
    report.totalViolations = report.steps.reduce((sum, step) => sum + step.violations.length, 0);
    report.criticalViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'critical').length, 0);
    report.seriousViolations = report.steps.reduce((sum, step) => 
      sum + step.violations.filter(v => v.impact === 'serious').length, 0);
    report.overallPassed = report.criticalViolations === 0 && report.seriousViolations === 0;

    journeyReports.push(report);
    expect(report.overallPassed).toBe(true);
  });

  test.afterAll(async () => {
    // Generate comprehensive accessibility journey report
    const finalReport = {
      timestamp: new Date().toISOString(),
      totalJourneys: journeyReports.length,
      passedJourneys: journeyReports.filter(r => r.overallPassed).length,
      failedJourneys: journeyReports.filter(r => !r.overallPassed).length,
      totalViolations: journeyReports.reduce((sum, r) => sum + r.totalViolations, 0),
      criticalViolations: journeyReports.reduce((sum, r) => sum + r.criticalViolations, 0),
      seriousViolations: journeyReports.reduce((sum, r) => sum + r.seriousViolations, 0),
      journeys: journeyReports,
      recommendations: generateOverallRecommendations(journeyReports)
    };

    console.log('Accessibility User Journeys Report:');
    console.log(JSON.stringify(finalReport, null, 2));
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'accessibility-journeys-report.json',
      JSON.stringify(finalReport, null, 2)
    );
  });
});

// Helper functions for accessibility testing

async function testKeyboardFormFilling(page: any, formType: string) {
  // Test keyboard navigation through form
  const form = page.locator(`[data-testid="${formType}-form"]`);
  
  // Tab through all form elements
  const focusableElements = await form.locator('input, select, textarea, button').all();
  
  for (const element of focusableElements) {
    await element.focus();
    const isFocused = await element.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
    
    // Test keyboard input
    if (await element.getAttribute('type') === 'text' || await element.getAttribute('type') === 'email') {
      await element.fill('test input');
    }
  }
}

async function testScreenReaderNavigation(page: any) {
  // Test screen reader landmarks
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
      mainRole: main?.getAttribute('role'),
      navRole: nav?.getAttribute('role')
    };
  });

  expect(landmarks.hasMain).toBe(true);
  expect(landmarks.hasNav).toBe(true);
  expect(landmarks.mainHasRole).toBe(true);
  expect(landmarks.navHasRole).toBe(true);

  // Test heading hierarchy
  const headings = await page.$$('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  for (const heading of headings) {
    const level = parseInt(heading.tagName.charAt(1));
    expect(level).toBeLessThanOrEqual(previousLevel + 1);
    previousLevel = level;
  }
}

async function testAssistiveTechnologyFormFilling(page: any, formType: string) {
  // Test form with assistive technology simulation
  const form = page.locator(`[data-testid="${formType}-form"]`);
  
  // Test form labels
  const inputs = await form.locator('input, select, textarea').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    if (id) {
      const label = await form.locator(`label[for="${id}"]`);
      expect(await label.isVisible()).toBe(true);
    }
  }

  // Test error messages
  const errorMessages = await form.locator('[role="alert"]').all();
  for (const error of errorMessages) {
    const ariaLive = await error.getAttribute('aria-live');
    expect(ariaLive).toBeTruthy();
  }
}

async function testCalendarAccessibility(page: any) {
  // Test calendar component accessibility
  const calendar = page.locator('[data-testid="calendar"]');
  if (await calendar.isVisible()) {
    // Test calendar navigation
    const prevButton = calendar.locator('[aria-label="Previous month"]');
    const nextButton = calendar.locator('[aria-label="Next month"]');
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
    }
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Test date selection
    const dateButtons = await calendar.locator('[role="gridcell"]').all();
    if (dateButtons.length > 0) {
      await dateButtons[0].click();
    }
  }
}

async function testDataTablesAccessibility(page: any) {
  // Test data table accessibility
  const tables = await page.locator('table').all();
  
  for (const table of tables) {
    // Check for table headers
    const headers = await table.locator('th').all();
    expect(headers.length).toBeGreaterThan(0);
    
    // Check for scope attributes
    const scopedHeaders = await table.locator('th[scope]').all();
    expect(scopedHeaders.length).toBeGreaterThan(0);
    
    // Check for caption
    const caption = await table.locator('caption');
    if (await caption.isVisible()) {
      expect(await caption.textContent()).toBeTruthy();
    }
  }
}

async function testModalsAccessibility(page: any) {
  // Test modal accessibility
  const modalTrigger = page.locator('[data-testid="open-modal"]');
  if (await modalTrigger.isVisible()) {
    await modalTrigger.click();
    
    const modal = page.locator('[role="dialog"]');
    expect(await modal.isVisible()).toBe(true);
    
    // Test focus trap
    const firstFocusable = modal.locator('button, input, select, textarea').first();
    const lastFocusable = modal.locator('button, input, select, textarea').last();
    
    if (await firstFocusable.isVisible()) {
      await firstFocusable.focus();
    }
    
    // Test escape key
    await page.keyboard.press('Escape');
    expect(await modal.isVisible()).toBe(false);
  }
}

async function testNavigationMenuAccessibility(page: any) {
  // Test navigation menu accessibility
  const nav = page.locator('nav');
  expect(await nav.isVisible()).toBe(true);
  
  // Test menu items
  const menuItems = await nav.locator('a, button').all();
  for (const item of menuItems) {
    const text = await item.textContent();
    const ariaLabel = await item.getAttribute('aria-label');
    expect(text || ariaLabel).toBeTruthy();
  }
}

async function testMobileFormAccessibility(page: any) {
  // Test mobile form accessibility
  const form = page.locator('form');
  
  // Test input types for mobile
  const inputs = await form.locator('input').all();
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    if (type === 'email') {
      expect(await input.getAttribute('inputmode')).toBe('email');
    } else if (type === 'tel') {
      expect(await input.getAttribute('inputmode')).toBe('tel');
    }
  }
}

async function testMobileTouchInteractions(page: any) {
  // Test mobile touch interactions
  const touchTargets = await page.locator('button, a, input, select').all();
  
  for (const target of touchTargets) {
    const box = await target.boundingBox();
    if (box) {
      // Touch targets should be at least 44x44 pixels
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
}

async function testRTLNavigation(page: any) {
  // Test RTL navigation
  const html = await page.$('html');
  const dir = await html?.getAttribute('dir');
  expect(dir).toBe('rtl');
  
  // Test tab order in RTL
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();
}

async function testArabicFormFilling(page: any) {
  // Test Arabic form filling
  const form = page.locator('form');
  
  // Test Arabic text input
  const textInputs = await form.locator('input[type="text"]').all();
  for (const input of textInputs) {
    await input.fill('نص تجريبي');
    const value = await input.inputValue();
    expect(value).toBe('نص تجريبي');
  }
}

async function testBidirectionalTextHandling(page: any) {
  // Test bidirectional text handling
  const textElements = await page.$$('p, span, div');
  for (const element of textElements) {
    const text = await element.textContent();
    if (text && /[\u0600-\u06FF]/.test(text)) {
      const dir = await element.getAttribute('dir');
      expect(dir).toBe('rtl');
    }
  }
}

function generateRecommendations(violations: any[]): string[] {
  const recommendations: string[] = [];
  
  for (const violation of violations) {
    if (violation.impact === 'critical' || violation.impact === 'serious') {
      recommendations.push(`${violation.description}: ${violation.help}`);
    }
  }
  
  return recommendations;
}

function generateOverallRecommendations(reports: AccessibilityJourneyReport[]): string[] {
  const allRecommendations: string[] = [];
  
  for (const report of reports) {
    for (const step of report.steps) {
      allRecommendations.push(...step.recommendations);
    }
  }
  
  // Remove duplicates
  return [...new Set(allRecommendations)];
}
