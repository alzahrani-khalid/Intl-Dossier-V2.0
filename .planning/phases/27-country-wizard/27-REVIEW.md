---
phase: 27-country-wizard
reviewed: 2026-04-15T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - frontend/src/components/dossier/wizard/config/country.config.ts
  - frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
  - frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx
  - frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx
  - frontend/src/routes/_protected/dossiers/countries/create.tsx
  - frontend/src/components/ui/form-wizard.tsx
  - frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx
  - frontend/src/i18n/en/form-wizard.json
  - frontend/src/i18n/ar/form-wizard.json
  - frontend/src/i18n/en/dossier.json
  - frontend/src/i18n/ar/dossier.json
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-04-15
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase introduced the Country Wizard — a 3-step form wizard (Basic Info, Country Details, Review) with an auto-fill hook that fetches reference data from the REST Countries API. The code is generally well-structured and follows project conventions. No critical security vulnerabilities or data-loss bugs were found.

Four warnings were identified: a silent dead code block in the auto-fill hook, a sensitivity level display bug in the review step, an unchecked `data[0]` access that assumes non-empty arrays, and a missing validation trigger on direct step navigation. Four info-level items cover code quality improvements.

---

## Warnings

### WR-01: Dead code block silently skips Arabic capital auto-fill

**File:** `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:70-72`

**Issue:** The `capital_ar` branch enters the `if` body and does nothing — an empty comment block. If this was intentionally deferred, the field is still checked (`current.capital_ar === ''`) but never populated, which is fine. However the `if` guard at line 70 performs a non-trivial nullability check, making it look like work is being done. Worse, a future developer may think this path already handles Arabic auto-fill and skip implementing it.

```ts
// Current (misleading)
if (current.capital_ar === '' && match.translations?.ara != null) {
  // REST Countries doesn't provide capital in Arabic, but we can leave it for user
}
```

**Fix:** Remove the entire dead `if` block. The comment belongs at the function level, not inside a guard that implies it would do something:

```ts
// Arabic capital is not available from REST Countries API — left for manual entry
```

---

### WR-02: Sensitivity level display renders raw number instead of translated label

**File:** `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx:129`

**Issue:** `String(values.sensitivity_level)` renders the raw integer (e.g., `"1"`) instead of the translated sensitivity label. The `dossier:sensitivityLevel` namespace keys are `"0"` through `"5"`, so a translation lookup would work. As written, a user reviewing their form sees `"1"` rather than `"Internal"` / `"داخلي"`.

```tsx
// Current — renders "1", "2", etc.
value={String(values.sensitivity_level)}
```

**Fix:**

```tsx
value={t(`dossier:sensitivityLevel.${values.sensitivity_level}`, String(values.sensitivity_level))}
```

---

### WR-03: `fetchCountryReference` accesses `data[0]` without guarding against empty array after the length check

**File:** `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:32`

**Issue:** The function guards with `data.length > 0` before returning `data[0]`, which is correct. However the cast `(await res.json()) as RestCountryResult[]` trusts the API contract fully — if the API returns a non-array (e.g., `{ status: 404, message: "..." }` on some error responses from restcountries.com), the runtime cast will not throw but `data.length` will be `undefined` and `data[0]` will be `undefined`, leaking into downstream auto-fill logic as `undefined.cca2` access.

The REST Countries v3.1 API does return a `404` JSON object (not an array) for not-found names even when `res.ok` is `false` — but if the HTTP status is 404 the `!res.ok` guard on line 29 already returns `undefined`, so the most common case is handled. The residual risk is for unexpected 2xx responses with a non-array body.

**Fix:** Add an `Array.isArray` guard before the length check:

```ts
const raw = await res.json()
if (!Array.isArray(raw)) return undefined
const data = raw as RestCountryResult[]
return data.length > 0 ? data[0] : undefined
```

---

### WR-04: Direct step navigation from ReviewSection skips forward — `onEditStep(0)` and `onEditStep(1)` bypass step validation

**File:** `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx:104,135`

**Issue:** `onEditStep` is wired directly to `wizard.setCurrentStep` (see `create.tsx` line 41). Jumping backward from step 2 to step 0 or 1 via `setCurrentStep` circumvents any `validate` callback defined in the step config. This is intentional for backward navigation, but the current `country.config.ts` steps do not define `validate` functions, so there is no regression today. If validation is added to steps in the future, the Edit button in the review will silently bypass it going forward.

**Fix:** Document the intent explicitly in `CountryReviewStep.tsx` with a comment, or wire through `wizard.goToStep` (which has an `allowStepNavigation` guard) rather than `setCurrentStep`:

```tsx
// Edit buttons navigate backward only — step validation is not triggered intentionally
onEdit={() => onEditStep(0)}
```

Or expose a `goToStep` method on the wizard that enforces the forward-navigation guard but allows backward jumps freely.

---

## Info

### IN-01: `useCountryAutoFill` hook — `form` object in `useEffect` dependency array is unstable

**File:** `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:73`

**Issue:** `form` (a `UseFormReturn`) is included in the `useEffect` dependency array. React Hook Form's `form` object reference is stable across renders, so this is not a bug today, but including an object in deps without memoization is a code smell that may cause issues if the form object is ever recreated.

**Fix:** Replace `form` with the stable `form.setValue` and `form.getValues` references in the dep array:

```ts
}, [match, form.setValue, form.getValues])
```

---

### IN-02: `CountryDetailsStep` imports `useDirection` but only uses it for the `capital_ar` input — consider co-locating

**File:** `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx:22,34`

**Issue:** `direction` from `useDirection()` is used only on the Arabic capital input (line 141). The English capital, ISO codes, and region fields do not need it. This is correct behavior but worth noting — if a reviewer sees `direction` imported they may wonder why only one field uses it.

**Fix:** No code change required. Add a brief inline comment:

```tsx
dir = { direction } // Arabic text field — explicit dir for when page language is EN
```

---

### IN-03: `filterExtensionData` in `country.config.ts` — inconsistent null-guard style between ISO fields and capital fields

**File:** `frontend/src/components/dossier/wizard/config/country.config.ts:28-32`

**Issue:** ISO fields use `data.iso_code_2 != null && data.iso_code_2 !== ''` (double guard), while capital and region fields use only `data.capital_en !== ''` (no null check). If `capital_en` is `null` rather than `''`, the check passes and `null` is stored as the extension data value.

**Fix:** Apply the same double guard consistently:

```ts
capital_en: data.capital_en != null && data.capital_en !== '' ? data.capital_en : undefined,
capital_ar: data.capital_ar != null && data.capital_ar !== '' ? data.capital_ar : undefined,
region: data.region != null && data.region !== '' ? data.region : undefined,
```

---

### IN-04: Arabic i18n strings missing tashkeel and use informal transliterations

**File:** `frontend/src/i18n/ar/form-wizard.json:40-45`

**Issue:** Several Arabic strings lack diacritics and use informal transliterations: `"الاساسية"` (missing hamza → `"الأساسية"`), `"الايزو"` (informal → `"الآيزو"` or `"ISO"`), `"وتاكيد"` (missing hamza → `"وتأكيد"`). While functionally correct, this is inconsistent with the diplomatic/formal tone expected from the application.

**Fix:** Update the Arabic strings:

```json
"basicInfo": "المعلومات الأساسية",
"basicInfoDesc": "أدخل اسم الدولة والتفاصيل العامة",
"countryDetails": "تفاصيل الدولة",
"countryDetailsDesc": "رموز الـ ISO والمنطقة والعاصمة",
"reviewDesc": "مراجعة وتأكيد التفاصيل",
"basic_info": "المعلومات الأساسية"
```

---

_Reviewed: 2026-04-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
