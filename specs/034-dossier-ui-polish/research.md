# Research: Dossier UI Polish - Mobile, RTL & Accessibility

**Feature**: 034-dossier-ui-polish
**Date**: 2025-01-04
**Status**: Complete

## Executive Summary

Research reveals the codebase is already in excellent shape for RTL support (307 logical properties vs 3 physical), with existing test infrastructure for accessibility and responsive design. Primary work involves:

1. Expanding test coverage to all 6 dossier types specifically
2. Fixing 3 remaining physical property usages
3. Adding performance optimization (useMemo)
4. Completing JSDoc documentation

## Research Areas

### 1. Existing RTL Implementation Analysis

**Decision**: Leverage existing RTL patterns; fix 3 remaining violations

**Findings**:

- **307** uses of RTL-safe logical properties (`ms-*`, `me-*`, `text-start`, `text-end`, etc.)
- **Only 3** uses of physical properties that need attention:
  1. `CountryMapImage.tsx:119` - `right-2` for label positioning
  2. `CountryDossierDetail.tsx:109` - Conditional RTL/LTR (already RTL-aware)
  3. `IntelligenceSection.tsx:48` - Conditional RTL/LTR margin (already RTL-aware)

**Current Pattern** (Good):

```tsx
// RTL detection pattern used throughout codebase
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

// Container setup
<div dir={isRTL ? 'rtl' : 'ltr'}>

// Logical properties in Tailwind
className="ms-4 me-2 ps-3 pe-3 text-start"

// Icon flipping for directional icons
<ChevronRight className={isRTL ? 'rotate-180' : ''} />
```

**Rationale**: The codebase already follows best practices. Only minor fixes needed.

**Alternatives Considered**:

- CSS `direction: rtl` at root level - Already implemented via i18next
- RTL-specific stylesheets - Rejected (Tailwind logical properties are cleaner)

---

### 2. Mobile Responsiveness Patterns

**Decision**: Use Playwright viewport testing at 320px, 375px, 414px

**Findings**:

- Existing test: `frontend/tests/e2e/responsive-breakpoints.spec.ts` tests generic breakpoints
- Components use mobile-first Tailwind patterns: `flex-col sm:flex-row`, `gap-2 sm:gap-4`
- Touch targets generally use `min-h-11 min-w-11` (44px)

**Testing Strategy**:

```typescript
// Playwright viewport configurations
const mobileViewports = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12', width: 375, height: 812 },
  { name: 'iPhone 14 Pro Max', width: 414, height: 896 },
];

test.describe('Dossier Mobile Tests', () => {
  for (const viewport of mobileViewports) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      // Test each dossier type
      test('Country dossier displays correctly', async ({ page }) => {
        await page.goto('/dossiers/countries/test-id');
        await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
      });
    });
  }
});
```

**Touch Target Verification**:

```typescript
// Verify all interactive elements meet 44x44px minimum
const interactiveElements = await page.locator('button, a, [role="button"]').all();
for (const el of interactiveElements) {
  const box = await el.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}
```

**Rationale**: Specific viewport testing ensures real device compatibility.

---

### 3. Accessibility Testing with axe-core

**Decision**: Use @axe-core/playwright for automated WCAG AA testing

**Findings**:

- Existing dependency: `@axe-core/react: ^4.9.0` in devDependencies
- Existing tests in `frontend/tests/a11y/` directory
- `CollapsibleSection.tsx` already has ARIA attributes documented

**Test Pattern**:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('Country dossier has no critical accessibility violations', async ({ page }) => {
  await page.goto('/dossiers/countries/test-id');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  // Filter to critical and serious only
  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  expect(violations).toHaveLength(0);
});
```

**Keyboard Navigation Test**:

```typescript
test('Can navigate through all sections with keyboard', async ({ page }) => {
  await page.goto('/dossiers/countries/test-id');

  // Tab through page
  let focusedElements = [];
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    focusedElements.push(focused);
  }

  // Verify collapsible sections are reachable
  expect(focusedElements).toContain('BUTTON'); // Section headers
});
```

**Rationale**: Automated testing catches regression and ensures CI/CD integration.

---

### 4. Performance Optimization with useMemo

**Decision**: Add useMemo to section components for expensive calculations

**Findings**:

- Section components render lists that may recalculate on each parent render
- React 19 has improved memo behavior but explicit useMemo still beneficial for:
  - Filtered/sorted arrays
  - Computed statistics
  - Formatted date ranges

**Pattern**:

```typescript
// Before (recalculates every render)
const sortedItems = items.sort((a, b) => b.date - a.date);

// After (memoized)
const sortedItems = useMemo(() => items.sort((a, b) => b.date - a.date), [items]);
```

**Components to optimize**:
| Component | Expensive Operation |
|-----------|-------------------|
| EventTimeline | Date sorting and grouping |
| KeyOfficials | Role filtering |
| Documents | Type filtering and sorting |
| Relationships | Graph computation |
| ActiveMoUs | Status filtering |

**Rationale**: Prevents unnecessary re-renders without breaking React patterns.

---

### 5. JSDoc Documentation Standards

**Decision**: Follow existing CollapsibleSection.tsx pattern as exemplar

**Findings**:

- `CollapsibleSection.tsx` has excellent JSDoc documentation
- Pattern includes: component description, prop documentation, feature attribution

**Standard Pattern**:

```typescript
/**
 * ComponentName - Brief description of component purpose
 * Features: Key features list
 * Feature: feature-branch-name
 */

interface ComponentNameProps {
  /**
   * Prop description
   * @default defaultValue (if applicable)
   */
  propName: PropType;
}
```

**Hook Documentation**:

```typescript
/**
 * useDossier - Fetches a single dossier by ID with type narrowing
 *
 * @param id - The dossier UUID
 * @param type - The expected dossier type for type narrowing
 * @returns Query result with typed dossier data
 *
 * @example
 * const { data: country } = useDossier(id, 'country');
 * if (isCountryDossier(country)) {
 *   // TypeScript knows this is a CountryDossier
 * }
 */
export function useDossier<T extends DossierType>(id: string, type: T) {
  // ...
}
```

**Type Guard Documentation**:

```typescript
/**
 * Type guard to narrow a generic Dossier to CountryDossier
 *
 * @param dossier - Any dossier object
 * @returns True if dossier is a CountryDossier
 *
 * @example
 * if (isCountryDossier(dossier)) {
 *   console.log(dossier.iso_code); // TypeScript knows this exists
 * }
 */
export function isCountryDossier(dossier: Dossier): dossier is CountryDossier {
  return dossier.type === 'country';
}
```

---

## Test Infrastructure Summary

### Existing Assets

| Asset             | Location                                   | Status    |
| ----------------- | ------------------------------------------ | --------- |
| Playwright config | `frontend/playwright.config.ts`            | Ready     |
| axe-core          | `@axe-core/react: ^4.9.0`                  | Installed |
| RTL test          | `tests/e2e/rtl-switching.spec.ts`          | Basic     |
| Responsive test   | `tests/e2e/responsive-breakpoints.spec.ts` | Generic   |
| A11y tests        | `tests/a11y/dossiers-a11y.spec.ts`         | Basic     |
| Auth bypass       | Pattern in existing tests                  | Ready     |

### New Tests to Create

| Test File                                       | Purpose                               |
| ----------------------------------------------- | ------------------------------------- |
| `tests/e2e/dossier-rtl-complete.spec.ts`        | Full RTL coverage for all 6 types     |
| `tests/e2e/dossier-mobile-complete.spec.ts`     | Mobile viewport tests for all 6 types |
| `tests/a11y/dossiers-rtl-a11y.spec.ts`          | Combined RTL + accessibility          |
| `tests/a11y/dossiers-mobile-a11y.spec.ts`       | Combined mobile + accessibility       |
| `tests/performance/dossier-performance.spec.ts` | Render time measurements              |

---

## Component Analysis

### Files Requiring Changes

**Priority 1: RTL Fixes (3 files)**
| File | Issue | Fix |
|------|-------|-----|
| `CountryMapImage.tsx:119` | `right-2` | Change to `end-2` |
| `CountryDossierDetail.tsx:109` | Conditional positioning | Simplify with logical properties |
| `IntelligenceSection.tsx:48` | Conditional margin | Use `me-2` instead |

**Priority 2: Performance (24 section components)**

- All section components in `components/Dossier/sections/` need useMemo audit
- Focus on sorting, filtering, and computed values

**Priority 3: Documentation (5 files)**
| File | JSDoc Status |
|------|--------------|
| `useDossier.ts` | Needs full documentation |
| `useDossiers.ts` | Needs full documentation |
| `useDossierStats.ts` | Needs full documentation |
| `useDossierPositionLinks.ts` | Needs full documentation |
| `dossier-type-guards.ts` | Needs full documentation |

---

## Recommendations

1. **RTL**: Only 3 fixes needed - codebase is in excellent shape
2. **Mobile**: Focus on viewport-specific testing rather than code changes
3. **A11y**: Expand existing tests to cover all 6 dossier types
4. **Performance**: Add useMemo strategically where profiler shows issues
5. **Docs**: Follow CollapsibleSection.tsx as the documentation exemplar

---

## References

- [Tailwind CSS Logical Properties](https://tailwindcss.com/docs/logical-properties)
- [axe-core Playwright Integration](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [WCAG 2.1 AA Checklist](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
- [React 19 useMemo Documentation](https://react.dev/reference/react/useMemo)
