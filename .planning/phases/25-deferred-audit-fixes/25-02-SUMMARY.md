---
phase: 25-deferred-audit-fixes
plan: 02
subsystem: ui
tags: [tanstack-query, react-context, query-keys, zustand]

# Dependency graph
requires: []
provides:
  - Typed query key factories for dossier, work-item, engagement domains
  - Split dossier context into 3 focused sub-contexts (navigation, collection, inheritance)
  - Backward-compatible facade hook for useDossierContext
affects: [any plan consuming dossier/work-item/engagement query keys or dossier context]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Query key factory pattern: domain/keys.ts with hierarchical as-const tuples'
    - 'Context split pattern: monolithic context -> sub-contexts + facade hook'

key-files:
  created:
    - frontend/src/domains/dossiers/keys.ts
    - frontend/src/domains/work-items/keys.ts
    - frontend/src/domains/engagements/keys.ts
    - frontend/src/contexts/dossier-context/DossierNavigationContext.tsx
    - frontend/src/contexts/dossier-context/DossierCollectionContext.tsx
    - frontend/src/contexts/dossier-context/DossierInheritanceContext.tsx
    - frontend/src/contexts/dossier-context/index.tsx
  modified:
    - frontend/src/domains/dossiers/index.ts
    - frontend/src/domains/work-items/index.ts
    - frontend/src/domains/engagements/index.ts
    - frontend/src/contexts/dossier-context.tsx

key-decisions:
  - 'Created canonical keys.ts files alongside existing inline keys in hooks for gradual migration'
  - 'Used ReactNode return type instead of JSX.Element for React 19 compatibility'
  - 'Old dossier-context.tsx becomes re-export shim rather than deletion for import path safety'

patterns-established:
  - 'Query key factory: each domain has a keys.ts file with hierarchical as-const tuple factory'
  - 'Context split: sub-contexts under directory with combined provider and facade hook'

requirements-completed: [D-10, D-11, C-20]

# Metrics
duration: 9min
completed: 2026-04-12
---

# Phase 25 Plan 02: Query Key Factories + Dossier Context Split Summary

**Typed query key factories for 3 domains plus dossier context split into navigation/collection/inheritance sub-contexts with backward-compatible facade**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-12T19:12:53Z
- **Completed:** 2026-04-12T19:21:41Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created canonical query key factory files for dossier, work-item, and engagement domains with hierarchical `as const` tuple pattern
- Split monolithic 465-LOC dossier context into 3 focused sub-contexts (DossierNavigationContext, DossierCollectionContext, DossierInheritanceContext)
- Maintained full backward compatibility via combined DossierProvider and useDossierContextInternal facade hook
- Re-exported factories from domain barrel files for clean imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create query key factories** - `b9f1e966` (feat)
2. **Task 2: Split dossier context into focused sub-contexts** - `2564b1b2` (refactor)

## Files Created/Modified

- `frontend/src/domains/dossiers/keys.ts` - Canonical dossierKeys factory with all/lists/list/details/detail/byType/timeline/briefs/related/counts
- `frontend/src/domains/work-items/keys.ts` - workItemKeys factory with all/lists/list/details/detail/byDossier/dossierLinks
- `frontend/src/domains/engagements/keys.ts` - engagementKeys factory with all/lists/list/details/detail/participants/agenda/afterActions
- `frontend/src/contexts/dossier-context/DossierNavigationContext.tsx` - Active dossier, selection state, reducer
- `frontend/src/contexts/dossier-context/DossierCollectionContext.tsx` - Recent/pinned dossiers from Zustand store
- `frontend/src/contexts/dossier-context/DossierInheritanceContext.tsx` - URL resolution, inheritance logic, auto-resolve
- `frontend/src/contexts/dossier-context/index.tsx` - Combined provider + facade hook + re-exports
- `frontend/src/contexts/dossier-context.tsx` - Backward-compat re-export shim
- `frontend/src/domains/dossiers/index.ts` - Added keys.ts re-export
- `frontend/src/domains/work-items/index.ts` - Added keys.ts re-export
- `frontend/src/domains/engagements/index.ts` - Added keys.ts re-export

## Decisions Made

- Created canonical `keys.ts` files alongside existing inline keys in hooks rather than replacing them, enabling gradual migration without breaking existing imports
- Used `ReactNode` return type instead of `JSX.Element` for React 19 compatibility (JSX namespace not available without explicit import)
- Kept old `dossier-context.tsx` as re-export shim rather than deleting it, since `__root.tsx` and `MainLayout.tsx` import from that path

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX.Element return type for React 19**

- **Found during:** Task 2 (context split)
- **Issue:** `JSX.Element` return type causes TS2503 error in React 19 strict mode without explicit React import
- **Fix:** Changed all provider return types to `ReactNode`
- **Files modified:** DossierNavigationContext.tsx, DossierCollectionContext.tsx, DossierInheritanceContext.tsx, index.tsx
- **Verification:** Frontend typecheck passes with 0 new errors
- **Committed in:** 2564b1b2 (Task 2 commit)

**2. [Rule 1 - Bug] Removed unused type imports in facade index**

- **Found during:** Task 2 (context split)
- **Issue:** ResolvedDossierContext, DossierReference, InheritanceSource imported but unused in index.tsx
- **Fix:** Removed unused imports
- **Files modified:** frontend/src/contexts/dossier-context/index.tsx
- **Committed in:** 2564b1b2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered

- Pre-existing TS6133 (unused variables) errors in many frontend files -- these are NOT from this plan's changes. Out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Query key factories ready for gradual migration of existing hooks to use canonical keys
- Sub-contexts ready for consumers to adopt granular hooks (useDossierNavigation, useDossierCollection, useDossierInheritance) for reduced re-renders
- Existing consumers continue working unchanged via facade

---

_Phase: 25-deferred-audit-fixes_
_Completed: 2026-04-12_
