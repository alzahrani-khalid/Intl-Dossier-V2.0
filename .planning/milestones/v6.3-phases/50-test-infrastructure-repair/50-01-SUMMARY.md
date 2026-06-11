---
phase: 50-test-infrastructure-repair
plan: 01
subsystem: testing
tags: [vitest, frontend, i18n, test-collection]
requires: []
provides:
  - 'Frontend Vitest collection narrowed to .test files'
  - 'react-i18next mock restored with vi.importActual spread'
  - 'Dead-import frontend test files removed from the default runner'
affects: [phase-50, frontend-test-runner]
tech-stack:
  added: []
  patterns:
    - 'Vitest default runner collects **/*.test.{ts,tsx} and excludes **/*.spec.* Playwright files.'
    - 'Shared module mocks preserve real SDK exports through vi.importActual plus spread, overriding only the local test surface.'
key-files:
  modified:
    - frontend/vitest.config.ts
    - frontend/tests/setup.ts
    - frontend/src/components/__tests__/ConsistencyPanel.test.tsx
    - frontend/tests/unit/hooks/responsive.test.ts
  deleted:
    - frontend/tests/a11y/theme-selector.test.tsx
    - frontend/tests/integration/language-switch.test.tsx
    - frontend/tests/integration/registry-validation.test.tsx
    - frontend/tests/integration/test_cross_tab_sync.test.tsx
    - frontend/tests/integration/test_language_switch.test.tsx
    - frontend/tests/integration/test_preference_persistence.test.tsx
    - frontend/tests/unit/LanguageToggle.test.tsx
    - frontend/tests/unit/components.test.tsx
key-decisions:
  - 'Playwright .spec files are out of the frontend Vitest default runner and remain owned by Playwright/visual validation.'
  - 'The global react-i18next mock spreads the actual package exports instead of hand-listing exports.'
  - 'Dead-import tests were deleted rather than moved because their target modules were already removed by earlier phases.'
requirements-completed: [TEST-01, TEST-02]
duration: retroactive
completed: 2026-05-14
---

# Phase 50 Plan 01: Frontend Test Collection Cascade Repair Summary

**The frontend test-runner cascades from Playwright miscollection, missing `initReactI18next`, and dead imports were closed in commit `93f56b2b`.**

## Accomplishments

- Added `include: ['**/*.test.{ts,tsx}']` and `exclude: ['**/*.spec.*']` to `frontend/vitest.config.ts`, so Vitest no longer collects Playwright `.spec.*` files.
- Reworked `frontend/tests/setup.ts` so the `react-i18next` mock uses `await vi.importActual<typeof import('react-i18next')>('react-i18next')` and spreads real exports before overriding `useTranslation` and `Trans`.
- Preserved the existing translation-map behavior while setting the factory up for later Phase 50 translation additions.
- Removed eight dead-import test files whose target modules had been deleted in earlier design-system phases.
- Made small companion test updates needed after the cascade repair exposed current component/hook behavior.

## Task Commit

- `93f56b2b fix(50-01): repair frontend test collection cascades`

## Per-File Disposition

| File                                                              | Verdict      | Commit     | Rationale                                                                                                                 |
| ----------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `frontend/vitest.config.ts`                                       | FIXED-GREEN  | `93f56b2b` | Narrows Vitest collection to `.test.{ts,tsx}` and defensively excludes `.spec.*` Playwright files.                        |
| `frontend/tests/setup.ts`                                         | FIXED-GREEN  | `93f56b2b` | Restores real `react-i18next` exports through `vi.importActual` spread so module evaluation can reach `initReactI18next`. |
| `frontend/tests/a11y/theme-selector.test.tsx`                     | DELETED-DEAD | `93f56b2b` | Imported deleted theme-selector infrastructure.                                                                           |
| `frontend/tests/integration/language-switch.test.tsx`             | DELETED-DEAD | `93f56b2b` | Imported removed i18n/theme infrastructure.                                                                               |
| `frontend/tests/integration/registry-validation.test.tsx`         | DELETED-DEAD | `93f56b2b` | Legacy integration test no longer matched the shipped registry surface.                                                   |
| `frontend/tests/integration/test_cross_tab_sync.test.tsx`         | DELETED-DEAD | `93f56b2b` | Imported removed preference/theme infrastructure.                                                                         |
| `frontend/tests/integration/test_language_switch.test.tsx`        | DELETED-DEAD | `93f56b2b` | Imported deleted `src/i18n/config` path.                                                                                  |
| `frontend/tests/integration/test_preference_persistence.test.tsx` | DELETED-DEAD | `93f56b2b` | Imported removed preference/theme implementation.                                                                         |
| `frontend/tests/unit/LanguageToggle.test.tsx`                     | DELETED-DEAD | `93f56b2b` | Target component was deleted by the earlier shell/theme migration.                                                        |
| `frontend/tests/unit/components.test.tsx`                         | DELETED-DEAD | `93f56b2b` | Imported deleted `DossierCard` and `LanguageToggle` modules.                                                              |

## Verification

- Historical Phase 50 discovery before this plan: frontend default runner reported `Test Files 218 failed | 121 passed | 4 skipped (343)`.
- The plan commit removed the `.spec.*` collection class and restored the `react-i18next` export surface needed by the wizard module graph.
- Current cumulative Phase 50 verification after downstream repairs: `pnpm --filter intake-frontend test --run` passes with `Test Files 154 passed | 4 skipped (158)`, `Tests 1219 passed | 25 todo (1244)`.

## Deviations from Plan

- The plan expected 11 dead-import deletions, while the actual committed cleanup deleted eight files and adjusted two surviving tests. Downstream Plans 50-09 through 50-13b completed the remaining frontend default-runner drift without moving files to integration.

## Issues Encountered

None open for Plan 50-01. Later failures were routed to bounded residual plans and are now closed.

## Known Stubs

None introduced beyond the shared test mock contract in `frontend/tests/setup.ts`.

## Threat Flags

None. The change narrows test collection and preserves real i18n SDK exports in the test mock.

## User Setup Required

None.

## Next Phase Readiness

Plan 50-03 and the post-split frontend residual plans have already completed on top of this baseline. This summary closes the missing GSD metadata for Plan 50-01.

## Self-Check: PASSED

- The 50-01 repair commit is reachable in git history.
- `frontend/vitest.config.ts` contains the narrowed include and `.spec.*` exclude.
- `frontend/tests/setup.ts` contains the `vi.importActual` spread pattern.
- No pending Plan 50-01 code changes are required.

---

_Phase: 50-test-infrastructure-repair_
_Completed: 2026-05-14_
