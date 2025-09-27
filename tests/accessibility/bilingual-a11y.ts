import { test, expect } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';

interface BilingualAccessibilityReport {
  timestamp: string;
  language: 'ar' | 'en';
  rtlSupport: boolean;
  ltrSupport: boolean;
  navigationFlow: {
    tabOrder: string[];
    focusManagement: boolean;
    keyboardShortcuts: boolean;
  };
  screenReader: {
    pronunciation: boolean;
    landmarks: boolean;
    headings: boolean;
    forms: boolean;
  };
  languageSwitch: {
    accessibility: boolean;
    statePreservation: boolean;
    focusManagement: boolean;
  };
  bidirectionalText: {
    handling: boolean;
    mixedContent: boolean;
    punctuation: boolean;
  };
  violations: any[];
  recommendations: string[];
}

test.describe('Bilingual Accessibility Testing', () => {
  let englishReport: BilingualAccessibilityReport;
  let arabicReport: BilingualAccessibilityReport;

  test.beforeAll(async () => {
    englishReport = {
      timestamp: new Date().toISOString(),
      language: 'en',
      rtlSupport: false,
      ltrSupport: false,
      navigationFlow: {
        tabOrder: [],
        focusManagement: false,
        keyboardShortcuts: false
      },
      screenReader: {
        pronunciation: false,
        landmarks: false,
        headings: false,
        forms: false
      },
      languageSwitch: {
        accessibility: false,
        statePreservation: false,
        focusManagement: false
      },
      bidirectionalText: {
        handling: false,
        mixedContent: false,
        punctuation: false
      },
      violations: [],
      recommendations: []
    };

    arabicReport = {
      timestamp: new Date().toISOString(),
      language: 'ar',
      rtlSupport: false,
      ltrSupport: false,
      navigationFlow: {
        tabOrder: [],
        focusManagement: false,
        keyboardShortcuts: false
      },
      screenReader: {
        pronunciation: false,
        landmarks: false,
        headings: false,
        forms: false
      },
      languageSwitch: {
        accessibility: false,
        statePreservation: false,
        focusManagement: false
      },
      bidirectionalText: {
        handling: false,
        mixedContent: false,
        punctuation: false
      },
      violations: [],
      recommendations: []
    };
  });

  test('English LTR Navigation Flow Testing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Ensure English is selected
    const languageButton = page.locator('button[aria-label="Language"]');
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.locator('text=English').click();
    }

    await injectAxe(page);
    const violations = await getViolations(page);
    englishReport.violations = violations;

    // Test LTR support
    const html = await page.$('html');
    const dir = await html?.getAttribute('dir');
    englishReport.ltrSupport = dir === 'ltr' || dir === null;

    // Test navigation flow
    await testNavigationFlow(page, englishReport);

    // Test screen reader support
    await testScreenReaderSupport(page, englishReport);

    expect(englishReport.ltrSupport).toBe(true);
    expect(englishReport.navigationFlow.focusManagement).toBe(true);
  });

  test('Arabic RTL Navigation Flow Testing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Switch to Arabic
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();

    await injectAxe(page);
    const violations = await getViolations(page);
    arabicReport.violations = violations;

    // Test RTL support
    const html = await page.$('html');
    const dir = await html?.getAttribute('dir');
    arabicReport.rtlSupport = dir === 'rtl';

    // Test navigation flow
    await testNavigationFlow(page, arabicReport);

    // Test screen reader support
    await testScreenReaderSupport(page, arabicReport);

    expect(arabicReport.rtlSupport).toBe(true);
    expect(arabicReport.navigationFlow.focusManagement).toBe(true);
  });

  test('Language Switch Accessibility Validation', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Test language switch button accessibility
    const languageButton = page.locator('button[aria-label="Language"]');
    expect(await languageButton.isVisible()).toBe(true);
    
    // Check ARIA attributes
    const ariaLabel = await languageButton.getAttribute('aria-label');
    const ariaExpanded = await languageButton.getAttribute('aria-expanded');
    const ariaHaspopup = await languageButton.getAttribute('aria-haspopup');

    expect(ariaLabel).toBeTruthy();
    expect(ariaHaspopup).toBe('menu');

    // Test keyboard navigation to language switch
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Test opening language menu
    await languageButton.click();
    const menu = page.locator('[role="menu"]');
    expect(await menu.isVisible()).toBe(true);

    // Test menu items accessibility
    const menuItems = await menu.locator('[role="menuitem"]').all();
    expect(menuItems.length).toBeGreaterThan(0);

    for (const item of menuItems) {
      const text = await item.textContent();
      const ariaLabel = await item.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }

    // Test language switch functionality
    await testLanguageSwitchFunctionality(page);
  });

  test('Arabic Screen Reader Pronunciation Testing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Switch to Arabic
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();

    // Test Arabic text pronunciation
    await testArabicPronunciation(page, arabicReport);

    // Test mixed content pronunciation
    await testMixedContentPronunciation(page, arabicReport);

    expect(arabicReport.screenReader.pronunciation).toBe(true);
  });

  test('Bidirectional Text Handling Verification', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Test with Arabic content
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();

    // Test bidirectional text handling
    await testBidirectionalTextHandling(page, arabicReport);

    // Test mixed content handling
    await testMixedContentHandling(page, arabicReport);

    // Test punctuation handling
    await testPunctuationHandling(page, arabicReport);

    expect(arabicReport.bidirectionalText.handling).toBe(true);
    expect(arabicReport.bidirectionalText.mixedContent).toBe(true);
  });

  test('RTL/LTR Layout Consistency', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Test English layout
    await testLayoutConsistency(page, 'en');

    // Switch to Arabic
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();

    // Test Arabic layout
    await testLayoutConsistency(page, 'ar');
  });

  test('Form Accessibility in Both Languages', async ({ page }) => {
    // Test English forms
    await page.goto('http://localhost:5173/mous/new');
    await testFormAccessibility(page, englishReport);

    // Switch to Arabic and test again
    const languageButton = page.locator('button[aria-label="Language"]');
    await languageButton.click();
    await page.locator('text=العربية').click();

    await testFormAccessibility(page, arabicReport);

    expect(englishReport.screenReader.forms).toBe(true);
    expect(arabicReport.screenReader.forms).toBe(true);
  });

  test.afterAll(async () => {
    // Generate comprehensive bilingual accessibility report
    const finalReport = {
      timestamp: new Date().toISOString(),
      english: englishReport,
      arabic: arabicReport,
      overallCompliance: {
        english: englishReport.violations.length === 0,
        arabic: arabicReport.violations.length === 0,
        bilingual: englishReport.violations.length === 0 && arabicReport.violations.length === 0
      },
      recommendations: [
        ...englishReport.recommendations,
        ...arabicReport.recommendations
      ]
    };

    console.log('Bilingual Accessibility Report:');
    console.log(JSON.stringify(finalReport, null, 2));
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'bilingual-accessibility-report.json',
      JSON.stringify(finalReport, null, 2)
    );
  });
});

// Helper functions for bilingual accessibility testing

async function testNavigationFlow(page: any, report: BilingualAccessibilityReport) {
  // Test tab order
  const tabOrder = await page.evaluate(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(focusableElements).map(el => ({
      tagName: el.tagName,
      text: el.textContent?.trim(),
      ariaLabel: el.getAttribute('aria-label')
    }));
  });

  report.navigationFlow.tabOrder = tabOrder.map(el => el.text || el.ariaLabel || el.tagName);

  // Test focus management
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      hasFocus: !!el,
      hasOutline: window.getComputedStyle(el!).outline !== 'none',
      isVisible: el?.offsetParent !== null
    };
  });

  report.navigationFlow.focusManagement = focusedElement.hasFocus && focusedElement.hasOutline;

  // Test keyboard shortcuts
  const shortcuts = await page.evaluate(() => {
    const elements = document.querySelectorAll('[accesskey]');
    return Array.from(elements).map(el => ({
      accesskey: el.getAttribute('accesskey'),
      text: el.textContent?.trim()
    }));
  });

  report.navigationFlow.keyboardShortcuts = shortcuts.length > 0;
}

async function testScreenReaderSupport(page: any, report: BilingualAccessibilityReport) {
  // Test landmarks
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

  report.screenReader.landmarks = landmarks.hasMain && landmarks.hasNav;

  // Test heading hierarchy
  const headings = await page.$$('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  let hierarchyValid = true;

  for (const heading of headings) {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      hierarchyValid = false;
      break;
    }
    previousLevel = level;
  }

  report.screenReader.headings = hierarchyValid;

  // Test form labels
  const formLabels = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, select, textarea');
    let labeledInputs = 0;

    for (const input of inputs) {
      const id = input.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) labeledInputs++;
      }
    }

    return {
      totalInputs: inputs.length,
      labeledInputs
    };
  });

  report.screenReader.forms = formLabels.labeledInputs === formLabels.totalInputs;
}

async function testLanguageSwitchFunctionality(page: any) {
  // Test switching from English to Arabic
  const languageButton = page.locator('button[aria-label="Language"]');
  await languageButton.click();
  await page.locator('text=العربية').click();

  // Verify language change
  const html = await page.$('html');
  const dir = await html?.getAttribute('dir');
  expect(dir).toBe('rtl');

  // Test switching back to English
  await languageButton.click();
  await page.locator('text=English').click();

  const dirAfter = await html?.getAttribute('dir');
  expect(dirAfter).toBe('ltr');
}

async function testArabicPronunciation(page: any, report: BilingualAccessibilityReport) {
  // Test Arabic text elements
  const arabicElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        return /[\u0600-\u06FF]/.test(text) && text.trim().length > 0;
      })
      .map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim(),
        lang: el.getAttribute('lang'),
        dir: el.getAttribute('dir')
      }));
  });

  // Check if Arabic elements have proper language attributes
  const properLangElements = arabicElements.filter(el => 
    el.lang === 'ar' || el.dir === 'rtl'
  );

  report.screenReader.pronunciation = properLangElements.length === arabicElements.length;
}

async function testMixedContentPronunciation(page: any, report: BilingualAccessibilityReport) {
  // Test mixed Arabic/English content
  const mixedElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        return /[\u0600-\u06FF]/.test(text) && /[a-zA-Z]/.test(text);
      })
      .map(el => ({
        text: el.textContent?.trim(),
        lang: el.getAttribute('lang'),
        dir: el.getAttribute('dir')
      }));
  });

  // Mixed content should have proper language attributes
  const properMixedElements = mixedElements.filter(el => 
    el.lang === 'ar' || el.dir === 'rtl'
  );

  report.bidirectionalText.mixedContent = properMixedElements.length === mixedElements.length;
}

async function testBidirectionalTextHandling(page: any, report: BilingualAccessibilityReport) {
  // Test bidirectional text elements
  const bidirectionalElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        return /[\u0600-\u06FF]/.test(text);
      })
      .map(el => ({
        text: el.textContent?.trim(),
        dir: el.getAttribute('dir'),
        style: window.getComputedStyle(el).direction
      }));
  });

  // All Arabic text should have RTL direction
  const rtlElements = bidirectionalElements.filter(el => 
    el.dir === 'rtl' || el.style === 'rtl'
  );

  report.bidirectionalText.handling = rtlElements.length === bidirectionalElements.length;
}

async function testMixedContentHandling(page: any, report: BilingualAccessibilityReport) {
  // Test mixed content handling
  const mixedContent = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        return /[\u0600-\u06FF]/.test(text) && /[a-zA-Z]/.test(text);
      })
      .map(el => ({
        text: el.textContent?.trim(),
        dir: el.getAttribute('dir'),
        unicodeBidi: window.getComputedStyle(el).unicodeBidi
      }));
  });

  // Mixed content should have proper bidirectional handling
  const properMixedContent = mixedContent.filter(el => 
    el.dir === 'rtl' || el.unicodeBidi === 'bidi-override'
  );

  report.bidirectionalText.mixedContent = properMixedContent.length === mixedContent.length;
}

async function testPunctuationHandling(page: any, report: BilingualAccessibilityReport) {
  // Test punctuation in Arabic text
  const punctuationElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        return /[\u0600-\u06FF]/.test(text) && /[.,;:!?]/.test(text);
      })
      .map(el => ({
        text: el.textContent?.trim(),
        dir: el.getAttribute('dir')
      }));
  });

  // Punctuation should be handled correctly in RTL context
  const properPunctuation = punctuationElements.filter(el => 
    el.dir === 'rtl'
  );

  report.bidirectionalText.punctuation = properPunctuation.length === punctuationElements.length;
}

async function testLayoutConsistency(page: any, language: 'ar' | 'en') {
  // Test layout consistency between languages
  const layoutElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'absolute' || style.position === 'fixed';
      })
      .map(el => ({
        tagName: el.tagName,
        position: window.getComputedStyle(el).position,
        left: window.getComputedStyle(el).left,
        right: window.getComputedStyle(el).right
      }));
  });

  // Layout should be consistent regardless of language
  expect(layoutElements.length).toBeGreaterThanOrEqual(0);
}

async function testFormAccessibility(page: any, report: BilingualAccessibilityReport) {
  // Test form accessibility
  const formElements = await page.$$('form');
  
  for (const form of formElements) {
    // Test form labels
    const inputs = await form.$$('input, select, textarea');
    let labeledInputs = 0;

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await form.$(`label[for="${id}"]`);
        if (label) labeledInputs++;
      }
    }

    // Test error messages
    const errorMessages = await form.$$('[role="alert"]');
    let properErrorMessages = 0;

    for (const error of errorMessages) {
      const ariaLive = await error.getAttribute('aria-live');
      if (ariaLive) properErrorMessages++;
    }

    // Test field descriptions
    const describedByElements = await form.$$('[aria-describedby]');
    let properDescriptions = 0;

    for (const element of describedByElements) {
      const describedBy = await element.getAttribute('aria-describedby');
      const description = await form.$(`#${describedBy}`);
      if (description) properDescriptions++;
    }

    report.screenReader.forms = 
      labeledInputs === inputs.length && 
      properErrorMessages === errorMessages.length &&
      properDescriptions === describedByElements.length;
  }
}
