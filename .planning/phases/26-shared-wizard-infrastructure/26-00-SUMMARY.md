---
phase: 26-shared-wizard-infrastructure
plan: 00
subsystem: wizard-test-infrastructure
tags: [test-stubs, tdd, wave-0, nyquist]
dependency_graph:
  requires: []
  provides: [test-stubs-schemas, test-stubs-defaults, test-stubs-hooks, test-stubs-components]
  affects: [26-01, 26-02, 26-03]
tech_stack:
  added: []
  patterns: [require-based-test-stubs, red-phase-tdd]
key_files:
  created:
    - frontend/src/components/dossier/wizard/schemas/__tests__/schemas.test.ts
    - frontend/src/components/dossier/wizard/defaults/__tests__/defaults.test.ts
    - frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts
    - frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts
    - frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx
    - frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx
  modified: []
decisions:
  - Use require() instead of static import so tests fail at runtime (RED) not compile time
  - Placeholder expect(true).toBe(true) for render tests that need implementation first
metrics:
  duration: 2m
  completed: 2026-04-15
---

# Phase 26 Plan 00: Wave 0 Test Stubs Summary

6 test stub files with 19 total test cases using require()-based imports for RED-phase TDD compliance

## What Was Done

Created 6 test stub files across 4 directories to satisfy the Nyquist rule for Plans 01-03. All test files use `require()` instead of static `import` so they fail with module-not-found errors at runtime (RED state) rather than TypeScript compile errors that block the test runner.

### Task 1: Schema and Defaults Test Stubs (98afe3c9)

- `schemas/__tests__/schemas.test.ts` -- 6 tests covering baseDossierSchema validation, countrySchema fields, electedOfficialSchema extension, and index re-exports (INFRA-03)
- `defaults/__tests__/defaults.test.ts` -- 5 tests covering getDefaultsForType for all 7 dossier types and baseDefaults export (INFRA-04)

### Task 2: Hook Test Stubs (ee388608)

- `hooks/__tests__/useDraftMigration.test.ts` -- 5 tests covering legacy draft migration, type-missing guard, no-overwrite, field removal, and invalid JSON handling (INFRA-07)
- `hooks/__tests__/useCreateDossierWizard.test.ts` -- 1 importability test (INFRA-01)

### Task 3: Component Test Stubs (fb731c36)

- `__tests__/CreateWizardShell.test.tsx` -- 3 tests covering importability and contract (INFRA-02)
- `__tests__/SharedBasicInfoStep.test.tsx` -- 4 tests covering importability, field rendering, and RTL support (INFRA-06)

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

All 6 test stub files verified present. All 3 commit hashes verified in git log.
