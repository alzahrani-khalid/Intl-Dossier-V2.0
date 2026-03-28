---
phase: 06-architecture-consolidation
plan: 01
subsystem: api, frontend
tags: [api-client, domain-driven, repository-pattern, tanstack-query, dossiers]

requires:
  - phase: 05-responsive-mobile
    provides: NavigationShell replacement for MainLayout, useResponsive hook

provides:
  - Shared apiClient with apiGet/apiPost/apiPut/apiPatch/apiDelete functions
  - Dossiers domain reference implementation (repository + hooks + types + barrel)
  - Backward-compatible re-exports for all 7 dossier hooks

affects: [06-02, 06-03, 06-04, 06-05]

tech-stack:
  added: []
  patterns:
    - 'apiClient pattern: all API calls through apiGet/apiPost/apiPut/apiPatch/apiDelete from @/lib/api-client'
    - 'Domain repository pattern: domains/{name}/repositories/{name}.repository.ts with plain functions'
    - 'Domain barrel pattern: domains/{name}/index.ts re-exports hooks, repo, and types'
    - 'Backward-compat re-export pattern: old hook paths re-export from @/domains/{name}'

key-files:
  created:
    - frontend/src/lib/api-client.ts
    - frontend/src/lib/__tests__/api-client.test.ts
    - frontend/src/domains/dossiers/repositories/dossiers.repository.ts
    - frontend/src/domains/dossiers/hooks/useDossiers.ts
    - frontend/src/domains/dossiers/hooks/useDossier.ts
    - frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts
    - frontend/src/domains/dossiers/hooks/useDossierRecommendations.ts
    - frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts
    - frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts
    - frontend/src/domains/dossiers/hooks/useNoResultsSuggestions.ts
    - frontend/src/domains/dossiers/types/index.ts
    - frontend/src/domains/dossiers/index.ts
  modified:
    - frontend/src/hooks/useDossiers.ts
    - frontend/src/hooks/useDossier.ts
    - frontend/src/hooks/useDossierActivityTimeline.ts
    - frontend/src/hooks/useDossierRecommendations.ts
    - frontend/src/hooks/useDossierFirstSearch.ts
    - frontend/src/hooks/useQuickSwitcherSearch.ts
    - frontend/src/hooks/useNoResultsSuggestions.ts
    - frontend/src/components/ui/sidebar.tsx
    - frontend/src/components/Layout/AppSidebar.tsx
    - frontend/src/routes/_protected.tsx

key-decisions:
  - 'apiClient reads import.meta.env at call time (not module load) for testability'
  - 'useDossier.ts kept existing @/services/dossier-api import (already abstracted, not raw fetch)'
  - 'useDossierActivityTimeline.ts kept supabase.functions.invoke pattern (SDK abstraction)'
  - 'QuickSwitcherSearchResponse uses DossierType enum (not string) to fix downstream type errors'

patterns-established:
  - 'Domain repository: plain async functions using apiGet/apiPost, no class, exported individually'
  - 'Domain hooks: import * as dossiersRepo from repositories, no raw fetch or auth header logic'
  - 'Backward-compat: old @/hooks/ files become thin re-exports from @/domains/{name}'
  - 'Types barrel: re-export from @/types/ canonical locations, not duplicate definitions'

requirements-completed: [ARCH-02, ARCH-04]

duration: 14min
completed: 2026-03-26
---

# Phase 06 Plan 01: API Client & Dossiers Domain Migration Summary

**Shared apiClient centralizing auth/URL/errors for all API calls, plus complete dossiers domain (repository + 7 hooks + types + barrel) as the reference implementation for domain-driven migration**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-26T08:46:01Z
- **Completed:** 2026-03-26T09:00:38Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments

- Created shared apiClient with 5 exported functions (apiGet, apiPost, apiPut, apiPatch, apiDelete) and 6 unit tests
- Migrated all 7 dossier hooks to domains/dossiers/ with repository pattern eliminating raw fetch() calls
- Deleted deprecated MainLayout.tsx and use-mobile.tsx, fixed all straggler imports
- All 7 original hook paths work via backward-compat re-exports (zero breaking changes for 43+ route files)

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Failing tests** - `0ebd4b0f` (test)
2. **Task 1 (TDD GREEN): apiClient + deprecated file cleanup** - `d7f9bb94` (feat)
3. **Task 2: Dossiers domain migration** - `f9de4853` (feat)

## Files Created/Modified

- `frontend/src/lib/api-client.ts` - Shared API client with auth, base URL, error handling
- `frontend/src/lib/__tests__/api-client.test.ts` - 6 unit tests for apiClient
- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` - Repository with 8 API functions
- `frontend/src/domains/dossiers/hooks/*.ts` - 7 migrated hooks using repository pattern
- `frontend/src/domains/dossiers/types/index.ts` - Types barrel re-exporting from @/types/
- `frontend/src/domains/dossiers/index.ts` - Domain barrel re-exporting all hooks, repo, types
- `frontend/src/hooks/useDossier*.ts` (7 files) - Replaced with backward-compat re-exports
- `frontend/src/components/ui/sidebar.tsx` - Migrated from useIsMobile to useResponsive
- `frontend/src/components/Layout/AppSidebar.tsx` - Migrated from useIsTablet to useResponsive
- `frontend/src/routes/_protected.tsx` - Migrated from MainLayout to NavigationShell
- `frontend/src/components/Layout/MainLayout.tsx` - Deleted (deprecated Phase 5)
- `frontend/src/hooks/use-mobile.tsx` - Deleted (deprecated Phase 5)

## Decisions Made

- **apiClient env resolution at call time:** `import.meta.env` values read in `resolveUrl()` function body (not module-level constants) so vitest `vi.stubEnv` and `vi.resetModules()` work correctly for testing
- **Kept existing service abstractions:** `useDossier.ts` already uses `@/services/dossier-api` and `useDossierActivityTimeline.ts` uses `supabase.functions.invoke()` -- both are proper abstractions, not raw fetch, so they were moved as-is
- **DossierType in repo return types:** `QuickSwitcherSearchResponse` uses `DossierType` enum instead of `string` to fix downstream type errors in CommandPalette

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed straggler imports of deleted files**

- **Found during:** Task 1 (deprecated file deletion)
- **Issue:** sidebar.tsx, AppSidebar.tsx imported from deleted use-mobile.tsx; \_protected.tsx imported deleted MainLayout
- **Fix:** Migrated sidebar.tsx/AppSidebar.tsx to useResponsive(); \_protected.tsx to NavigationShell
- **Files modified:** frontend/src/components/ui/sidebar.tsx, frontend/src/components/Layout/AppSidebar.tsx, frontend/src/routes/\_protected.tsx
- **Verification:** `grep -r "use-mobile\|MainLayout" frontend/src/` returns zero straggler results
- **Committed in:** d7f9bb94 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed CommandPalette type errors from string vs DossierType**

- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** Repository inline return type used `string` for dossier/work-item type fields, causing type assignment errors in CommandPalette
- **Fix:** Created `QuickSwitcherSearchResponse` interface with proper `DossierType` and `QuickSwitcherWorkItemType` union types
- **Files modified:** frontend/src/domains/dossiers/repositories/dossiers.repository.ts
- **Verification:** `tsc --noEmit` passes with zero errors
- **Committed in:** f9de4853 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- vitest `vi.stubEnv` does not override `import.meta.env` values already loaded from `.env` files -- resolved by making env reads happen at function call time and using env-agnostic test assertions
- Plan referenced `useMobile.tsx` but file was renamed to `use-mobile.tsx` in Phase 2 kebab-case migration -- found via filesystem search

## Known Stubs

None - all domain hooks are fully wired to repository functions with real API endpoints.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- apiClient pattern established and tested, ready for 06-02 through 06-05 domain migrations
- Dossiers domain serves as the canonical reference implementation
- All existing import paths preserved via re-exports

---

_Phase: 06-architecture-consolidation_
_Completed: 2026-03-26_
