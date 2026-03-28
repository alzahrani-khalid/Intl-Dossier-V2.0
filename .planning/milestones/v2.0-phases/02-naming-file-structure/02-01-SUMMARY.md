---
phase: 02-naming-file-structure
plan: 01
subsystem: ui
tags: [naming-conventions, hooks, components, refactoring, imports]

# Dependency graph
requires:
  - phase: 01-dead-code-toolchain
    provides: Clean codebase with no unused files to conflict with renames
provides:
  - 18 hook files renamed from kebab-case to camelCase
  - 12 component directories renamed from PascalCase to kebab-case
  - All ~115 import paths updated to reference new names
affects: [02-02, 02-03, all-frontend-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Hook files use camelCase: useToast.ts, useTasks.ts'
    - 'Component directories use kebab-case: dossier/, forms/, layout/'
    - 'Component FILES inside directories stay PascalCase: DossierCreateWizard.tsx'

key-files:
  created: []
  modified:
    - frontend/src/hooks/ (18 files renamed)
    - frontend/src/components/ (12 directories renamed, 120+ files moved)
    - 55+ consumer files with updated import paths

key-decisions:
  - 'Used git mv for all renames to preserve git blame history'
  - 'Two-step rename (via -tmp) for case-only directory changes on macOS APFS'
  - 'Barrel imports without trailing slashes required separate sed pass'

patterns-established:
  - 'Hooks: camelCase filenames (useToast.ts, not use-toast.ts)'
  - 'Component dirs: kebab-case (dossier/, not Dossier/)'
  - 'Component files: PascalCase inside kebab-case dirs (dossier/DossierCreateWizard.tsx)'

requirements-completed: [ARCH-01]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 02 Plan 01: Naming Convention Enforcement Summary

**Renamed 18 kebab-case hooks to camelCase and 12 PascalCase component directories to kebab-case, updating all 115+ import references with zero build errors**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T21:36:59Z
- **Completed:** 2026-03-23T21:42:12Z
- **Tasks:** 2
- **Files modified:** 245 (72 in Task 1, 173 in Task 2)

## Accomplishments

- Renamed all 18 kebab-case hook files to camelCase (e.g., use-toast.ts -> useToast.ts)
- Renamed all 12 PascalCase component directories to kebab-case (e.g., Dossier/ -> dossier/)
- Updated ~115 import references across 55+ consumer files (absolute @/hooks/, relative ./, and barrel imports)
- Build verified: pnpm build passes with zero errors after all renames

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename 18 kebab-case hook files to camelCase** - `aa6eaff2` (refactor)
2. **Task 2: Rename 12 PascalCase component directories to kebab-case** - `16145512` (refactor)

## Files Created/Modified

- `frontend/src/hooks/useToast.ts` - Renamed from use-toast.ts (25 import refs)
- `frontend/src/hooks/useTasks.ts` - Renamed from use-tasks.ts (6 import refs)
- `frontend/src/hooks/useTheme.ts` - Renamed from use-theme.ts (6 import refs)
- `frontend/src/hooks/useResponsive.ts` - Renamed from use-responsive.ts (5 import refs)
- `frontend/src/components/dossier/` - Renamed from Dossier/ (58 files, 20+ import refs)
- `frontend/src/components/forms/` - Renamed from Forms/ (22 files, 11 import refs)
- `frontend/src/components/layout/` - Renamed from Layout/ (14 files)
- `frontend/src/components/calendar/` - Renamed from Calendar/
- `frontend/src/components/dashboard/` - Renamed from Dashboard/
- `frontend/src/components/keyboard-shortcuts/` - Renamed from KeyboardShortcuts/
- `frontend/src/components/notifications/` - Renamed from Notifications/
- `frontend/src/components/table/` - Renamed from Table/
- Plus 55+ consumer files with updated import paths

## Decisions Made

- Used `git mv` for all renames to preserve git blame history
- Two-step rename via `-tmp` suffix for case-only directory changes on macOS APFS (case-insensitive filesystem)
- Barrel imports (without trailing slash) required a separate sed pass since the initial pattern only matched paths with trailing slashes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed relative imports within hook files**

- **Found during:** Task 1 (hook rename build verification)
- **Issue:** Hook files importing other hooks via relative paths (e.g., `./use-toast` in useTheme.ts) were missed by the initial grep which only searched for `@/hooks/use-` patterns
- **Fix:** Ran additional sed pass targeting `./use-` patterns within frontend/src/hooks/ directory
- **Files modified:** useContributors.ts, useEntityLinks.ts, useOptimisticLocking.ts, useTasks.ts, useTheme.ts
- **Verification:** pnpm build passes
- **Committed in:** aa6eaff2 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed barrel imports without trailing slashes**

- **Found during:** Task 2 (component directory rename build verification)
- **Issue:** 14 imports used barrel pattern (`@/components/Dossier` without `/`) which the initial sed pattern (`components/Dossier/` with trailing slash) didn't match
- **Fix:** Ran additional sed pass matching patterns ending with single quote (barrel import syntax)
- **Files modified:** 12 files including \_\_root.tsx, Header.tsx, TaskDetail.tsx, DashboardPage.tsx
- **Verification:** pnpm build passes
- **Committed in:** 16145512 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both auto-fixes were necessary to complete the import path updates. No scope creep.

## Issues Encountered

- macOS APFS case-insensitive filesystem required two-step renames for single-word directories (Calendar -> calendar-tmp -> calendar) - handled as planned
- The `declare -A` bash associative array syntax failed in zsh, switched to direct git mv commands

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Naming conventions established for hooks (camelCase) and component directories (kebab-case)
- Ready for Plan 02 (barrel index consolidation) and Plan 03 (route file restructuring)
- All existing features continue working - no regressions

## Self-Check: PASSED

All claims verified:

- SUMMARY.md exists
- Commit aa6eaff2 exists (Task 1)
- Commit 16145512 exists (Task 2)
- useToast.ts exists
- dossier/ directory exists
- 0 kebab-case hook files remain
- 0 PascalCase component directories remain

---

_Phase: 02-naming-file-structure_
_Completed: 2026-03-23_
