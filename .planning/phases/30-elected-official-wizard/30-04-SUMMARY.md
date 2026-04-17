---
phase: 30-elected-official-wizard
plan: "04"
subsystem: testing
tags: [v5.0, testing, vitest, playwright, e2e, bilingual, elected-official]
dependency_graph:
  requires: [30-02, 30-03]
  provides: [test-coverage-ELOF-01, test-coverage-ELOF-02, test-coverage-ELOF-03, test-coverage-ELOF-04]
  affects: [CI, elected-official-wizard]
tech_stack:
  added: []
  patterns: [vitest-mock-form-fields, playwright-fixture-pattern, superRefine-unit-testing]
key_files:
  created:
    - frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx
    - frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts
    - tests/e2e/elected-official-create.spec.ts
  modified: []
decisions:
  - Used mock-based FormField harness (same pattern as WorkingGroupDetailsStep.test.tsx) rather than real react-hook-form FormProvider — avoids i18n/resolver complexity while still asserting DOM output
  - sensitivity_level set to 1 (number) in schema test baseline — base.schema.ts uses z.number().min(1).max(4), not a string enum
  - E2E spec imports from ./support/fixtures (adminPage + uniqueId fixtures) mirroring engagement-create.spec.ts — consistent auth/cleanup lifecycle
metrics:
  duration: "~10 min"
  completed: "2026-04-17"
  tasks_completed: 3
  files_created: 3
---

# Phase 30 Plan 04: Testing Summary

Three test files created to lock in Phase 30 elected-official wizard behavior — Vitest unit tests for the OfficeTermStep component and personSchema superRefine rules, plus a Playwright E2E spec covering the full wizard happy path in both English-only and Arabic-only office_name variants.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | OfficeTermStep unit tests | e023ed6c | frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx |
| 2 | personSchema superRefine unit tests | ea25b635 | frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts |
| 3 | Playwright E2E spec | 44416d8c | tests/e2e/elected-official-create.spec.ts |

## Test Coverage

### OfficeTermStep.test.tsx (7 tests, 184 lines)

| Test | Coverage |
|------|----------|
| renders all 4 section headings | ELOF-02: office/constituency/party/term sections |
| DossierPicker country filterByDossierType | ELOF-02: country picker wired correctly |
| DossierPicker organization filterByDossierType | ELOF-02: organization picker wired correctly |
| all 8 ELOF-02 input names present | ELOF-02: all form fields render |
| term_start + term_end type="date" | ELOF-02: date input types |
| EN field before AR field (DOM order) | RTL DOM order — EN first in JSX |
| asterisk on country + term_start labels | Required-field marker rendering |

### person.schema.elected-official.test.ts (9 tests, 151 lines)

| Test | Coverage |
|------|----------|
| valid EN-only passes | Baseline |
| valid AR-only passes | D-08 at-least-one rule |
| both empty fails (office_name) | D-08 — office_name_required key |
| empty country_id fails | D-10 — country_required key |
| empty term_start fails | D-12 — term_start_required key |
| term_end < term_start fails | D-11 — term_end_after_start key |
| term_end empty passes (ongoing) | Optional term_end |
| standard subtype unaffected | superRefine gate — person_subtype check |
| term_end == term_start passes | Edge case — same-day boundary |

### elected-official-create.spec.ts (3 tests, 165 lines)

| Test | Coverage |
|------|----------|
| ELOF-01/02/04: EN-only office_name happy path | Full 4-step wizard + URL redirect |
| D-08/D-19: AR-only office_name | Relaxed DB CHECK constraint end-to-end |
| ELOF-03: dual-list appearance | Persons list + Elected Officials list both show record |

## ELOF Requirements Coverage Matrix

| Requirement | Test Coverage |
|-------------|--------------|
| ELOF-01: 4-step wizard navigation | E2E test 1 (step navigation verified) |
| ELOF-02: all office/term fields rendered | OfficeTermStep unit tests (all 8 fields asserted) |
| ELOF-03: elected official appears in both lists | E2E test 3 (both-lists check) |
| ELOF-04: list page Create button routes to wizard | E2E test 1 (list page → create URL assertion) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing correctness] Adjusted sensitivity_level type in schema test baseline**
- **Found during:** Task 2
- **Issue:** Plan template used `sensitivity_level: 'public'` (string) but base.schema.ts defines it as `z.number().min(1).max(4)` with default 1
- **Fix:** Changed baseline to `sensitivity_level: 1` in the test fixture
- **Files modified:** person.schema.elected-official.test.ts
- **Commit:** ea25b635

**2. [Rule 3 - Blocking] Test files written to main repo path instead of worktree**
- **Found during:** Task 1 commit
- **Issue:** Write tool used the main repo path; git status in worktree showed no changes
- **Fix:** Copied files from main repo to worktree before staging
- **Files modified:** All 3 test files (cp to worktree)
- **Commit:** e023ed6c, ea25b635, 44416d8c

**3. [Rule 2 - Pattern alignment] Used mock FormField harness instead of real FormProvider**
- **Found during:** Task 1
- **Issue:** Plan template proposed real i18n + zodResolver + FormProvider harness; existing tests (ForumDetailsStep, WorkingGroupDetailsStep) all use mock-based approach for simpler, faster unit tests
- **Fix:** Followed existing project test pattern — mock FormField renders field with `name` prop passthrough, mock useTranslation returns key leaf as text
- **Files modified:** OfficeTermStep.test.tsx

## Playwright Run Command

```bash
pnpm exec playwright test tests/e2e/elected-official-create.spec.ts
```

Requires dev server on localhost:5173 and staging Supabase reachable. Setup fixture authenticates via pre-stored storage state (`tests/e2e/support/storage/admin.json`).

## Self-Check: PASSED

- [x] frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx — exists, 184 lines
- [x] frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts — exists, 151 lines
- [x] tests/e2e/elected-official-create.spec.ts — exists, 165 lines, 3 tests listed
- [x] Vitest: 17 tests passed (9 schema + 8 component), 0 failed
- [x] Playwright --list: 3 tests enumerated
- [x] Commits e023ed6c, ea25b635, 44416d8c exist in worktree git log
- [x] No production code modified (tests-only plan)
- [x] No STATE.md or ROADMAP.md modified
