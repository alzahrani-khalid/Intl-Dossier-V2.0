---
phase: 24-browser-inspection-fixes
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - frontend/src/routes/_protected/calendar.tsx
  - frontend/src/i18n/en/calendar.json
  - frontend/src/i18n/ar/calendar.json
  - frontend/src/pages/settings/SettingsPage.tsx
  - frontend/src/domains/analytics/repositories/analytics.repository.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 24 targeted three runtime issues: calendar i18n namespace mismatch, settings 406 PostgREST errors, and analytics Edge Function DNS failures. All three fixes are directionally correct and the core bugs are resolved. No critical security issues were found.

Three warnings require attention before the next phase: a floating promise in the settings save handler, silent swallowing of all errors (not just network errors) in the analytics repository, and missing explicit return types that violate the project's ESLint configuration. Three informational items are noted for maintainability.

---

## Warnings

### WR-01: Floating Promise in `handleSave` — Save Errors Silently Dropped

**File:** `frontend/src/pages/settings/SettingsPage.tsx:268-272`
**Issue:** `form.handleSubmit(...)()` returns a Promise, but `handleSave` neither awaits it nor returns it. The outer `useCallback` wrapper has a `void` implicit return, so any rejection after the submit handler fires is an unhandled floating promise. The project ESLint config enforces `@typescript-eslint/no-floating-promises: error` — this will fail `pnpm typecheck`.

```tsx
// Current (line 268-272)
const handleSave = useCallback(() => {
  form.handleSubmit((values) => {
    saveMutation.mutate(values)
  })()
}, [form, saveMutation])

// Fix: mark return type void and suppress the known-safe fire-and-forget,
// or convert to async and await
const handleSave = useCallback((): void => {
  void form.handleSubmit((values) => {
    saveMutation.mutate(values)
  })()
}, [form, saveMutation])
```

### WR-02: Analytics Repository Swallows All Errors, Not Just Network Failures

**File:** `frontend/src/domains/analytics/repositories/analytics.repository.ts:13-16, 22-25, 31-34`
**Issue:** Each `catch` block silently returns `{ data: null }` for every thrown error — including programming errors (e.g., a malformed URL, a wrong import, a type error thrown inside `apiGet`). This makes real bugs invisible in production. The intent is to handle "endpoint does not exist yet," but a bare catch with no error type check hides all other failure modes.

**Fix:** Narrow the catch to network/HTTP errors only, or at minimum re-throw non-network errors:

```ts
// Example for getAnalyticsDashboard
export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  try {
    return await apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
  } catch (err) {
    // Only suppress expected "endpoint not available" failures (404/network)
    const isExpectedAbsence =
      err instanceof Error && (err.message.includes('404') || err.message.includes('Network'))
    if (!isExpectedAbsence) {
      console.error('Analytics dashboard unexpected error:', err)
    } else {
      console.warn('Analytics dashboard endpoint not available')
    }
    return { data: null }
  }
}
```

Apply the same pattern to `getOrganizationBenchmarks` and `getCurrentStats`.

### WR-03: Missing Explicit Return Types on All Exported Functions

**File:** `frontend/src/domains/analytics/repositories/analytics.repository.ts:10, 19, 28`
**Issue:** All three exported functions declare `Promise<unknown>` as return type, which technically satisfies the signature requirement but provides no type safety for callers — `unknown` forces every consumer to type-narrow before use. More critically, the project convention (`@typescript-eslint/explicit-function-return-type: error`) is satisfied at the syntax level, but the `Promise<unknown>` return type defeats the purpose. This should use a typed response shape.

Additionally, `SettingsPage.tsx` line 251 declares `applyAccessibilitySettings` without an explicit return type annotation:

**File:** `frontend/src/pages/settings/SettingsPage.tsx:251`

```tsx
// Missing return type
const applyAccessibilitySettings = useCallback((values: SettingsFormValues) => {

// Fix
const applyAccessibilitySettings = useCallback((values: SettingsFormValues): void => {
```

---

## Info

### IN-01: `calendar.tsx` — Duplicate `import` Statements for `lazy` and `Suspense`

**File:** `frontend/src/routes/_protected/calendar.tsx:1,4`
**Issue:** `lazy` and `Suspense` are imported from React on line 4, while `useState` is imported on line 1. Both are separate `import` statements from `'react'`. This works but is inconsistent style and wastes an import line.

**Fix:**

```tsx
// Replace lines 1 and 4 with a single import
import { useState, lazy, Suspense } from 'react'
```

### IN-02: AR i18n — Day Abbreviations Missing Leading Article

**File:** `frontend/src/i18n/ar/calendar.json:3-9`
**Issue:** Arabic day abbreviations (`أحد`, `إثنين`, etc.) omit the definite article `ال`. Standard Arabic calendar usage is `الأحد`, `الاثنين`, etc. The English file correctly uses abbreviations (`Sun`, `Mon`), so this is a localization quality issue — not a functional bug — but it will appear incorrect to Arabic speakers in the UI.

**Fix:** Update `days.*` values to include the definite article: `"sun": "الأحد"`, `"mon": "الاثنين"`, `"tue": "الثلاثاء"`, `"wed": "الأربعاء"`, `"thu": "الخميس"`, `"fri": "الجمعة"`, `"sat": "السبت"`. (Note: same fix applies to `recurrence.daysOfWeek.*` keys at lines 218-225.)

### IN-03: Settings — `onSuccess` Async Callback Has Untyped `switchLanguage` Await

**File:** `frontend/src/pages/settings/SettingsPage.tsx:218-241`
**Issue:** `onSuccess` is declared `async` and awaits `switchLanguage`. If `switchLanguage` rejects, TanStack Query's `onSuccess` does not catch async rejections from the callback itself — the error would be an unhandled promise rejection at the framework boundary. This is a latent risk if `switchLanguage` ever throws.

**Fix:** Wrap the `switchLanguage` call in its own try/catch inside `onSuccess`:

```tsx
onSuccess: async (values) => {
  if (values.language_preference !== settings?.language_preference) {
    try {
      await switchLanguage(values.language_preference)
    } catch (err) {
      console.error('Language switch failed:', err)
    }
  }
  // ... rest of onSuccess
}
```

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
