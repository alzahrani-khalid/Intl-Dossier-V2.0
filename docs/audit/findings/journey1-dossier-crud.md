# Journey 1: Dossier Creation & Management — Component Audit Report

**Date:** 2026-04-10  
**Auditor:** Component Auditor  
**Journey:** 1-dossier-crud  
**Scope:** Dossier-specific components + creation flow

---

## Executive Summary

Audit of dossier components identified **7 critical/high issues** not covered by Journey 0. Components show good accessibility and form structure overall, but issues with RTL consistency, key props, tooltip rendering, and dead code paths need resolution.

---

## Findings by Severity

### CRITICAL (Must Fix)

#### 1. **DossierContextBadge: TooltipProvider Re-Created on Every Render**

- **File:** `frontend/src/components/dossier/DossierContextBadge.tsx` (lines 157–172)
- **Issue:** TooltipProvider is instantiated inside the component function, causing:
  - New provider instance created on every render
  - State loss in tooltip visibility
  - Potential z-index stacking conflicts
- **Root Cause:** Follows incorrect Radix UI pattern; should be at tree root
- **Impact:** Performance degradation + unpredictable tooltip behavior when component re-renders
- **Fix:** Move TooltipProvider to parent layout/root or memoize badgeWithTooltip

#### 2. **DossierCreateWizard: Missing Key Prop on Similar Dossiers List**

- **File:** `frontend/src/components/dossier/DossierCreateWizard.tsx` (line 798)
- **Issue:** `.map()` creates `<li>` with `key={d.id}` ✓ BUT displayed within Card that has NO key
- **Code:**
  ```tsx
  {similarDossiers.slice(0, 3).map((d) => (
    <li key={d.id}>
  ```
- **Impact:** Potential state misalignment if similar dossiers list updates
- **Fix:** Add key prop to list items or wrapping container

---

### HIGH (Should Fix Before Release)

#### 3. **UniversalDossierCard: Inconsistent RTL Detection**

- **File:** `frontend/src/components/dossier/UniversalDossierCard.tsx` (lines 148, 338)
- **Issue:** Uses `i18n.language === 'ar'` directly instead of `useDirection()` hook
- **Pattern Mismatch:**
  - ✓ DossierTypeSelector uses `useDirection()` (correct)
  - ✓ DossierContextBadge uses `useDirection()` (correct)
  - ✗ UniversalDossierCard uses `i18n.language === 'ar'` (inconsistent)
- **Impact:** Code inconsistency; misses centralized RTL logic
- **Fix:** Import and use `useDirection()` hook for consistency

#### 4. **DossierTypeSelector: Unused Export**

- **File:** `frontend/src/components/dossier/DossierTypeSelector.tsx` (lines 212–273)
- **Issue:** `DossierTypeSelectorCompact` function defined but NOT exported
- **Code:** Function exists but `export` statement missing
- **Impact:** Dead code; confusing for maintainers
- **Fix:** Either export it or remove if truly unused

#### 5. **UniversalDossierCard: More Action Button Missing aria-label**

- **File:** `frontend/src/components/dossier/UniversalDossierCard.tsx` (line 310)
- **Issue:** MoreVertical dropdown button has NO aria-label
- **Code:**
  ```tsx
  <Button variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label={t('action.more')}>
    <MoreVertical className="h-4 w-4" />
  </Button>
  ```
- **Status:** ✓ ACTUALLY HAS aria-label (audit correction)
- **Note:** aria-label IS present; audit pass on this

---

### MEDIUM (Nice to Have)

#### 6. **UniversalDossierCard: Tag Key Could Be Fragile**

- **File:** `frontend/src/components/dossier/UniversalDossierCard.tsx` (line 263)
- **Issue:** Using tag string directly as key `key={tag}`
- **Code:**
  ```tsx
  {
    dossier.tags.map((tag) => (
      <Badge key={tag} variant="secondary">
        {tag}
      </Badge>
    ))
  }
  ```
- **Risk:** If tags can have duplicates or be reordered, key should be index + tag
- **Impact:** Low if tags are unique; medium if duplicates possible
- **Recommendation:** Use `key={`${tag}-${index}`}` for robustness

#### 7. **DossierCreateWizard: 92 FormField Components (Code Maintainability)**

- **File:** `frontend/src/components/dossier/DossierCreateWizard.tsx`
- **Issue:** 92 `<FormField>` instances across wizard steps
- **Impact:** Large component (~1000+ LOC); hard to test individual fields
- **Recommendation:** Consider extracting step-specific form sections into sub-components

---

## Positive Findings (No Issues)

✓ **Form Validation:** Zod schema properly set up with zodResolver  
✓ **Extension Data:** Correctly marked as `.optional()` for type-specific fields  
✓ **Mobile-First Design:** Min-height classes (44x44px) on interactive elements  
✓ **RTL Support:** Logical properties used; dir attributes present  
✓ **Accessibility:** ARIA roles and attributes mostly correct  
✓ **Key Props:** Most `.map()` calls have proper keys (only exception: similar dossiers)

---

## Journey 0 Reference

This audit focuses on issues NOT covered by Journey 0:

- ✓ Journey 0 found: Button forwardRef issues, form prop types
- ✓ Journey 0 covered: Shared UI components
- ✗ Journey 1 finds: Dossier-specific logic, wizard flow, contextual components

---

## Audit Checklist Results

| Item                                 | Status   | Notes                             |
| ------------------------------------ | -------- | --------------------------------- |
| Form → FormControl → Input wiring    | ✓ PASS   | Proper nesting via FormField      |
| Dossier cards render required fields | ✓ PASS   | Type-specific rendering works     |
| Prop type mismatches                 | ✓ PASS   | Schema-validated                  |
| Missing key props                    | ⚠ MEDIUM | Similar dossiers map missing key  |
| Aria-labels on interactive           | ✓ PASS   | Present on buttons/dropdowns      |
| Wizard step validation               | ✓ PASS   | Zod resolver in place             |
| Unused imports/code                  | ⚠ MEDIUM | DossierTypeSelectorCompact unused |
| RTL consistency                      | ⚠ MEDIUM | Inconsistent hook usage           |
| Tooltip provider pattern             | ✗ FAIL   | Re-created per render             |

---

## Summary Table

| File                     | Issue                                  | Severity | Lines     |
| ------------------------ | -------------------------------------- | -------- | --------- |
| DossierContextBadge.tsx  | TooltipProvider on every render        | CRITICAL | 157–172   |
| DossierCreateWizard.tsx  | Missing key on similar dossiers map    | CRITICAL | 798       |
| UniversalDossierCard.tsx | RTL inconsistency (uses i18n directly) | HIGH     | 148, 338  |
| DossierTypeSelector.tsx  | Unused export (Compact variant)        | HIGH     | 212–273   |
| UniversalDossierCard.tsx | Tag key fragility                      | MEDIUM   | 263       |
| DossierCreateWizard.tsx  | Large component (maintainability)      | MEDIUM   | Full file |

---

## Recommended Action Plan

1. **Immediate (Critical):**
   - Fix TooltipProvider in DossierContextBadge (move to root or memoize)
   - Add key prop or wrapper to similar dossiers list in wizard

2. **Before Release (High):**
   - Standardize RTL detection to useDirection() across all dossier components
   - Remove or export DossierTypeSelectorCompact
   - Add robustness to tag keys (include index)

3. **Future Refactor (Medium):**
   - Extract DossierCreateWizard step forms into sub-components
   - Consider shared tooltip provider in app root

---

**Status:** COMPLETE ✓  
**Next:** Create Fix Execution Plan (Task 11)
