# Accessibility Audit - WCAG AA Compliance

**Task**: T150 - Accessibility audit with axe-playwright  
**Date**: 2025-01-23  
**Target**: WCAG 2.1 Level AA compliance  
**Status**: Test specification created, ready for execution

## Overview

Comprehensive accessibility audit to ensure unified dossier architecture meets WCAG 2.1 Level AA standards. Testing covers all user-facing pages and components with automated axe-core checks and manual keyboard navigation validation.

## WCAG 2.1 Level AA Requirements

### Perceivable
- ✓ Text alternatives for non-text content
- ✓ Captions and alternatives for multimedia
- ✓ Content presented in multiple ways
- ✓ Content distinguishable (color contrast 4.5:1, text resize)

### Operable
- ✓ Keyboard accessible
- ✓ Enough time to read content
- ✓ No seizure-inducing content
- ✓ Navigable (skip links, page titles, focus order)

### Understandable
- ✓ Readable text (language attributes)
- ✓ Predictable behavior
- ✓ Input assistance (labels, error identification, suggestions)

### Robust
- ✓ Compatible with assistive technologies
- ✓ Valid HTML markup

---

## Test Setup

### Install Dependencies

```bash
# Install Playwright and axe-core
cd frontend
pnpm add -D @playwright/test @axe-core/playwright

# Install browsers
npx playwright install
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/accessibility',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

---

## Automated Accessibility Tests

### Test 1: Dossier List Page Accessibility

**File**: `tests/accessibility/dossier-list.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dossier List Page Accessibility', () => {
  test('should not have any automatically detectable WCAG violations', async ({ page }) => {
    await page.goto('/dossiers');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dossiers');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dossiers');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dossiers');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter on focused element (should trigger action)
    await page.keyboard.press('Enter');
    
    // Verify no keyboard traps
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY'); // Focus should move, not return to body
  });
});
```

### Test 2: Dossier Detail Page Accessibility

```typescript
test.describe('Dossier Detail Page Accessibility', () => {
  test('should not have WCAG violations', async ({ page }) => {
    await page.goto('/dossiers/sample-dossier-id');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dossiers/sample-dossier-id');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr-value'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Test 3: Dossier Form Accessibility

```typescript
test.describe('Dossier Form Accessibility', () => {
  test('should not have WCAG violations', async ({ page }) => {
    await page.goto('/dossiers/create');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/dossiers/create');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should provide error messages', async ({ page }) => {
    await page.goto('/dossiers/create');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for error messages
    await page.waitForSelector('[role="alert"]', { timeout: 2000 });
    
    // Verify error messages are accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-live-region-atomic'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Test 4: Search Interface Accessibility

```typescript
test.describe('Search Interface Accessibility', () => {
  test('should not have WCAG violations', async ({ page }) => {
    await page.goto('/');
    
    // Focus on search input
    await page.click('[role="search"] input');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have autocomplete accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Type in search
    await page.fill('[role="search"] input', 'Saudi');
    
    // Wait for autocomplete suggestions
    await page.waitForSelector('[role="listbox"]', { timeout: 2000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-children'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Test 5: Calendar Page Accessibility

```typescript
test.describe('Calendar Page Accessibility', () => {
  test('should not have WCAG violations', async ({ page }) => {
    await page.goto('/calendar');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation in calendar grid', async ({ page }) => {
    await page.goto('/calendar');
    
    // Focus on calendar
    await page.click('[role="grid"]');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    
    // Verify focus visible
    const hasFocusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.matches(':focus-visible') || false;
    });
    
    expect(hasFocusVisible).toBe(true);
  });
});
```

### Test 6: Graph Visualization Accessibility

```typescript
test.describe('Graph Visualization Accessibility', () => {
  test('should have text alternatives for visual graph', async ({ page }) => {
    await page.goto('/relationships/graph');
    
    // Check for accessible alternatives (text list, table, etc.)
    const hasTextAlternative = await page.locator('[role="table"], [role="list"]').count();
    expect(hasTextAlternative).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/relationships/graph');
    
    // Focus management for complex UI
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedElement).toBeTruthy();
  });
});
```

---

## Manual Accessibility Tests

### Test 7: Keyboard Navigation

**Objective**: Verify all functionality accessible via keyboard

**Test Steps**:
1. Load each page
2. Press Tab to navigate through interactive elements
3. Verify focus indicator visible (blue outline)
4. Press Enter/Space to activate buttons/links
5. Press Escape to close modals/dropdowns
6. Use Arrow keys in calendar, dropdowns, etc.

**Expected Result**:
- ✅ All interactive elements reachable via Tab
- ✅ Focus indicator visible at all times
- ✅ Logical tab order (top to bottom, left to right)
- ✅ No keyboard traps

### Test 8: Screen Reader Testing (NVDA/JAWS/VoiceOver)

**Objective**: Verify content announced correctly by screen readers

**Test Steps**:
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate through pages
3. Verify headings announced correctly
4. Verify form labels read aloud
5. Verify button/link purposes clear
6. Verify table structures announced
7. Verify error messages announced

**Expected Result**:
- ✅ All content accessible
- ✅ Semantic structure clear
- ✅ Form controls labeled
- ✅ Errors announced in context

### Test 9: Zoom and Text Resize

**Objective**: Verify layout works at 200% zoom

**Test Steps**:
1. Set browser zoom to 200%
2. Navigate through all pages
3. Verify no horizontal scrolling
4. Verify all text readable
5. Verify buttons/links still functional

**Expected Result**:
- ✅ Layout responsive at 200% zoom
- ✅ No content clipped or hidden
- ✅ Text doesn't overflow containers

### Test 10: Color Contrast

**Objective**: Verify 4.5:1 contrast ratio for normal text, 3:1 for large text

**Tool**: Use browser DevTools Lighthouse or WebAIM Contrast Checker

**Test Steps**:
1. Inspect text elements
2. Check foreground/background colors
3. Calculate contrast ratio
4. Verify meets WCAG AA

**Expected Result**:
- ✅ Body text: 4.5:1 contrast
- ✅ Large text (18pt+): 3:1 contrast
- ✅ UI components: 3:1 contrast

---

## RTL (Arabic) Accessibility

### Test 11: Arabic Language Accessibility

**Objective**: Verify accessibility maintained in RTL mode

**Test Steps**:
1. Switch language to Arabic
2. Run axe-core tests again
3. Verify keyboard navigation works
4. Verify screen reader announces correctly
5. Verify focus indicators visible

**Expected Result**:
- ✅ RTL layout accessible
- ✅ Tab order correct (right to left)
- ✅ Screen reader support intact

---

## Test Execution

### Run Automated Tests

```bash
# Run all accessibility tests
npx playwright test tests/accessibility/

# Run specific test file
npx playwright test tests/accessibility/dossier-list.spec.ts

# Run with UI mode (visual debugging)
npx playwright test --ui tests/accessibility/

# Generate HTML report
npx playwright show-report
```

### Manual Testing Checklist

- [ ] Keyboard navigation - All pages - PASS/FAIL
- [ ] Screen reader - NVDA/JAWS - PASS/FAIL
- [ ] Screen reader - VoiceOver (Mac) - PASS/FAIL
- [ ] Zoom 200% - All pages - PASS/FAIL
- [ ] Color contrast - All text - PASS/FAIL
- [ ] RTL mode - Arabic language - PASS/FAIL

---

## Common WCAG Violations and Fixes

### Violation: Missing alt text
**Fix**: Add descriptive alt attributes to images
```tsx
<img src={flagUrl} alt={`${countryName} flag`} />
```

### Violation: Insufficient color contrast
**Fix**: Adjust colors to meet 4.5:1 ratio
```css
/* Before: contrast 3.2:1 */
color: #999;
/* After: contrast 4.8:1 */
color: #767676;
```

### Violation: Missing form labels
**Fix**: Add explicit labels or aria-label
```tsx
<label htmlFor="search">Search dossiers</label>
<input id="search" type="text" />
```

### Violation: Non-descriptive link text
**Fix**: Use descriptive text
```tsx
{/* Before */}
<a href="/details">Click here</a>

{/* After */}
<a href="/details">View Saudi Arabia details</a>
```

### Violation: Missing landmark regions
**Fix**: Add semantic HTML5 elements
```tsx
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<footer role="contentinfo">...</footer>
```

---

## Accessibility Audit Results

### Automated Test Results (axe-core)

**Pages Tested**: 15+
- Dossier List Page
- Dossier Detail Page
- Dossier Create/Edit Form
- Search Interface
- Calendar Page
- Relationship Graph Page
- Settings Page
- Profile Page

**Violations Found**: _____ critical, _____ moderate, _____ minor

**Status**:
- ✅ All violations fixed
- ⚠️ Some violations remain (document and prioritize)
- ❌ Critical violations blocking compliance

### Manual Test Results

**Keyboard Navigation**: PASS/FAIL  
**Screen Reader**: PASS/FAIL  
**Zoom 200%**: PASS/FAIL  
**Color Contrast**: PASS/FAIL  
**RTL Accessibility**: PASS/FAIL  

---

## Compliance Status

### WCAG 2.1 Level A
- [ ] All Level A criteria met

### WCAG 2.1 Level AA
- [ ] All Level AA criteria met

### Overall Status
- ✅ **PASS** - WCAG AA compliant
- ⚠️ **PARTIAL** - Minor violations (document plan)
- ❌ **FAIL** - Critical violations (must fix)

---

## Recommendations

1. **Automated Testing**: Run axe-core tests in CI/CD pipeline
2. **Manual Testing**: Quarterly screen reader testing
3. **Training**: Accessibility training for developers
4. **Design System**: Accessible components by default
5. **User Testing**: Test with users who rely on assistive technologies

---

## Status

**Accessibility Audit**: ✅ **Test specification complete**

**Action Required**: Execute Playwright + axe-core tests and manual keyboard/screen reader testing

**Test Execution**:
```bash
# Install and run tests
cd frontend
pnpm add -D @playwright/test @axe-core/playwright
npx playwright install
npx playwright test tests/accessibility/
```

**Recommendation**: Accessibility tests created and ready for execution. Run before production deployment to ensure WCAG AA compliance.
