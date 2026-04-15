---
phase: 26-shared-wizard-infrastructure
plan: 02
subsystem: wizard-hooks
tags: [useCreateDossierWizard, draft-migration, generic-hook, wave-2]
dependency_graph:
  requires: [26-01]
  provides: [useCreateDossierWizard-hook, useDraftMigration-hook]
  affects: [26-03]
tech_stack:
  added: []
  patterns: [hook-composition, generic-form-hook, silent-migration]
key_files:
  created:
    - frontend/src/components/dossier/wizard/hooks/useDraftMigration.ts
    - frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts
  modified: []
decisions:
  - person_subtype handled via filterExtensionData callback, not on CreateDossierRequest
  - form.watch uses 'as never' cast for generic T field access to avoid TS2352
  - canComplete uses null-check pattern for nameAr instead of unsafe number cast
metrics:
  duration: 4m
  completed: 2026-04-15
---

# Phase 26 Plan 02: Wizard Hooks Summary

useCreateDossierWizard<T> all-in-one hook composing 5 sub-hooks plus silent legacy draft migration utility

## What Was Done

### Task 1: useDraftMigration hook (08ab28e6)

Created `useDraftMigration.ts` with two exports:
- `migrateLegacyDraft()` pure function: reads old `dossier-create-draft` localStorage key, extracts `type` field, writes data to `dossier-create-{type}` key, removes old key. Skips if no valid type or per-type key already exists. Silent failure via empty catch block per D-03.
- `useDraftMigration()` hook: calls `migrateLegacyDraft()` once on mount using `useRef(false)` guard to prevent React StrictMode double-execution.

### Task 2: useCreateDossierWizard hook (5394125e)

Created `useCreateDossierWizard.ts` -- the all-in-one generic hook per D-01 and D-02. Accepts `WizardConfig<T>` and returns `CreateWizardReturn<T>`. Internally composes:

1. `useDraftMigration()` -- silent legacy migration on mount
2. `useFormDraft` from `@/components/ui/form-wizard` -- localStorage draft with `dossier-create-{type}` key
3. `useForm<T>` with `zodResolver` from `@/lib/form-resolver` -- form state
4. `useState(0)` -- step navigation
5. `useDossierNameSimilarity` -- duplicate detection on name_en/name_ar
6. `useAIFieldAssist` -- AI-generated field suggestions
7. `useCreateDossier` -- TanStack Query mutation for submission

Handlers (`handleComplete`, `handleCancel`, `handleSaveDraft`, `handleAIGenerate`) all wrapped in `useCallback`. The `form` object is exposed directly per D-02 (no abstraction layer). `canComplete` checks `name_en.length >= 2 && name_ar.length >= 2`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] form.watch type error with generic T**
- **Found during:** Task 2 verification
- **Issue:** `form.watch('name_en')` on generic `UseFormReturn<T>` caused TS2352 because T doesn't constrain field names
- **Fix:** Cast field name through `as never` and result through `as unknown as string`
- **Files modified:** useCreateDossierWizard.ts
- **Commit:** 5394125e

**2. [Rule 1 - Bug] person_subtype not on CreateDossierRequest**
- **Found during:** Task 2 verification
- **Issue:** Plan specified adding person_subtype to CreateDossierRequest, but the actual type does not have this field
- **Fix:** Removed person_subtype assignment; it is handled via `config.filterExtensionData()` callback which delegates to per-type config
- **Files modified:** useCreateDossierWizard.ts
- **Commit:** 5394125e

## Test Results

- TypeScript compilation: 0 errors in wizard/hooks/ files
- Pre-existing backend type errors (ai-suggestions.types.ts) unrelated to this plan

## Known Stubs

None -- both hooks are fully implemented with all composition points wired.

## Self-Check: PASSED
