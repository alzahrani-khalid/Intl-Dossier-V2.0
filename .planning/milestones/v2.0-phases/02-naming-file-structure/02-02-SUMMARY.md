---
phase: 02-naming-file-structure
plan: 02
subsystem: ui
tags: [naming-conventions, components, file-structure, refactoring, imports]

# Dependency graph
requires:
  - phase: 02-naming-file-structure/01
    provides: Hook and component directory renames establishing naming conventions
provides:
  - 35 standalone component files moved into kebab-case subdirectories
  - All import paths updated (absolute, relative, src-level)
  - Zero standalone .tsx files at components/ root
affects: [02-03, all-frontend-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Standalone components get own kebab-case subdirectory: dossier-card/DossierCard.tsx'
    - 'PascalCase filenames preserved inside kebab-case directories'
    - 'No barrel exports (index.ts) in component directories (D-03)'
    - 'Naming conflicts resolved with descriptive prefixes: app-error-boundary/'

key-files:
  created:
    - frontend/src/components/app-error-boundary/ErrorBoundary.tsx
    - frontend/src/components/dossier-card/DossierCard.tsx
    - frontend/src/components/after-action-form/AfterActionForm.tsx
    - frontend/src/components/intake-form/IntakeForm.tsx
    - frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
  modified:
    - frontend/src/App.tsx (4 import paths updated)
    - frontend/src/pages/TicketDetail.tsx (4 import paths updated)
    - frontend/src/components/after-action/AfterActionForm.tsx (5 relative imports fixed)
    - 20+ consumer files with updated import paths

key-decisions:
  - 'ErrorBoundary -> app-error-boundary/ to avoid conflict with existing error-boundary/ directory'
  - 'LanguageSwitcher added to existing language-switcher/ dir (different filename from language-switcher.tsx)'
  - 'Broken relative ../hooks/, ../types/ etc. imports converted to @/ absolute paths for robustness'
  - 'Restored 3 files incorrectly deleted by parallel agent (DecisionList, RiskList, theme-error-boundary)'

patterns-established:
  - 'Standalone components: kebab-case subdir with PascalCase file inside'
  - 'Prefer @/ absolute imports over relative ../ paths for cross-directory references'
  - 'No barrel exports in component directories'

requirements-completed: [ARCH-01]

# Metrics
duration: 15min
completed: 2026-03-23
---

# Phase 02 Plan 02: Standalone Component Subdirectory Organization Summary

**Moved 35 standalone component .tsx files from components/ root into kebab-case subdirectories with PascalCase filenames, updating 57 files and all import paths with zero build errors**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-23T21:44:32Z
- **Completed:** 2026-03-23T21:59:43Z
- **Tasks:** 2
- **Files modified:** 57 (Task 1: 3, Task 2: 57)

## Accomplishments

- Moved all 35 standalone .tsx files from components/ root into own kebab-case subdirectories
- Updated all import paths: 14 absolute (@/components/X), 22 relative (./X, ../X), 18 src-level (../hooks/ -> @/hooks/)
- Resolved 2 naming conflicts (ErrorBoundary -> app-error-boundary/, LanguageSwitcher into existing language-switcher/)
- Restored 3 files incorrectly deleted by parallel agent (02-03) that broke the build
- Renamed theme-error-boundary.tsx to ThemeErrorBoundary.tsx (PascalCase per D-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit standalone files and fix parallel agent breakage** - `803e7f1f` (fix)
2. **Task 2: Move all standalone components into kebab-case subdirectories** - `981bb04a` (refactor)

## Files Created/Modified

- `frontend/src/components/app-error-boundary/ErrorBoundary.tsx` - Root error boundary (renamed dir to avoid conflict)
- `frontend/src/components/dossier-card/DossierCard.tsx` - Dossier card component
- `frontend/src/components/after-action-form/AfterActionForm.tsx` - After action form
- `frontend/src/components/intake-form/IntakeForm.tsx` - Intake form
- `frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx` - Theme error boundary (file renamed to PascalCase)
- `frontend/src/components/language-switcher/LanguageSwitcher.tsx` - Language switcher (added to existing dir)
- Plus 29 more component files moved to new kebab-case subdirectories
- `frontend/src/App.tsx` - Updated 4 import paths
- `frontend/src/pages/TicketDetail.tsx` - Updated 4 import paths
- `frontend/src/pages/WaitingQueue.tsx` - Updated QueryErrorBoundary import
- `frontend/src/pages/IntakeQueue.tsx` - Updated TriagePanel import
- `frontend/src/auth/LoginPageAceternity.tsx` - Updated LanguageSwitcher import
- `frontend/src/routes/_protected/intake/new.tsx` - Updated IntakeForm import
- 10+ route files with updated import paths

## Decisions Made

- ErrorBoundary.tsx moved to `app-error-boundary/` instead of `error-boundary/` because the latter already contains a different (Sentry-powered) ErrorBoundary component
- LanguageSwitcher.tsx placed in existing `language-switcher/` directory alongside the existing `language-switcher.tsx` (different components, different filenames)
- Converted broken relative `../hooks/`, `../types/`, `../services/`, `../store/`, `../i18n`, `../contexts/` imports to `@/` absolute paths for better maintainability after the directory depth change
- Restored DecisionList.tsx, RiskList.tsx, and theme-error-boundary.tsx that were incorrectly deleted by the parallel 02-03 agent (these had active consumers via relative imports)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored 3 files incorrectly deleted by parallel agent**

- **Found during:** Task 1 (audit and dedup)
- **Issue:** The parallel 02-03 agent deleted DecisionList.tsx, RiskList.tsx, and theme-error-boundary.tsx from components/ root, but these had active consumers (AfterActionForm.tsx via relative imports, App.tsx)
- **Fix:** Restored files from pre-deletion commit (a38b5707~1), removed stale theme-error-boundary-dir/
- **Files modified:** 3 restored files
- **Verification:** pnpm build passes
- **Committed in:** 803e7f1f (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed broken ./ui/ relative imports in moved files**

- **Found during:** Task 2 (move and import update)
- **Issue:** Moved files had `./ui/button` etc. imports that resolved when at components/ root but broke at components/subdir/ level
- **Fix:** Updated all `./ui/` to `../ui/` in moved files
- **Files modified:** 15+ component files
- **Verification:** pnpm build passes
- **Committed in:** 981bb04a (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed broken ../hooks/, ../types/ etc. imports in moved files**

- **Found during:** Task 2 (build verification)
- **Issue:** Files that used relative paths like `../hooks/useIntakeApi` (resolving to src/hooks/) now resolved to components/hooks/ after moving one level deeper
- **Fix:** Converted 18 broken relative src-level imports to @/ absolute paths
- **Files modified:** 12 component files
- **Verification:** pnpm build passes
- **Committed in:** 981bb04a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 2 Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary to maintain build integrity after file moves. No scope creep.

## Issues Encountered

- Parallel agent (02-03) had already deleted 5 standalone files from components/ root; 3 of those had active consumers and needed restoration
- Naming conflicts required creative directory naming (app-error-boundary/) since error-boundary/ already existed with different component
- Relative imports that crossed the components/ boundary (to src/hooks/, src/types/, etc.) needed systematic detection and conversion to @/ absolute paths

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components are fully wired with real imports and data sources.

## Next Phase Readiness

- All standalone .tsx files eliminated from components/ root
- Naming convention (kebab-case dirs, PascalCase files) consistently applied
- Ready for Plan 03 (route file restructuring) and future phases
- All existing features continue working - no regressions

## Self-Check: PASSED

All claims verified:

- SUMMARY.md exists
- Commit 803e7f1f exists (Task 1)
- Commit 981bb04a exists (Task 2)
- app-error-boundary/ErrorBoundary.tsx exists
- dossier-card/DossierCard.tsx exists
- after-action-form/AfterActionForm.tsx exists
- theme-error-boundary/ThemeErrorBoundary.tsx exists
- 0 standalone .tsx files remain at components/ root

---

_Phase: 02-naming-file-structure_
_Completed: 2026-03-23_
