---
phase: 12-enriched-dossier-pages
plan: 02
subsystem: ui
tags: [tanstack-router, nested-routes, dossier, tabs, lazy-loading, code-splitting]

requires:
  - phase: 12-enriched-dossier-pages
    plan: 01
    provides: DossierShell, DossierTabNav, RelationshipSidebar, dossier-shell i18n
provides:
  - 52 nested tab route files across 7 dossier types
  - URL-driven tab navigation for all dossier detail pages
  - Index redirects from bare $id to $id/overview
  - Lazy-loaded overview tabs wrapping existing page components
affects: [12-03, 12-04, 12-05]

tech-stack:
  added: []
  patterns:
    - "DossierShell layout route with Outlet for nested tabs"
    - "Index redirect to overview via TanStack Router beforeLoad"
    - "Overview tab lazy-loads existing page component with useDossier hook"
    - "Shared stub tabs with i18n placeholders for future content"

key-files:
  created:
    - frontend/src/routes/_protected/dossiers/countries/$id/index.tsx
    - frontend/src/routes/_protected/dossiers/countries/$id/overview.tsx
    - frontend/src/routes/_protected/dossiers/countries/$id/positions.tsx
    - frontend/src/routes/_protected/dossiers/organizations/$id/mous.tsx
    - frontend/src/routes/_protected/dossiers/forums/$id/index.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/$id/index.tsx
    - frontend/src/routes/_protected/dossiers/persons/$id/index.tsx
  modified:
    - frontend/src/routes/_protected/dossiers/countries/$id.tsx
    - frontend/src/routes/_protected/dossiers/organizations/$id.tsx
    - frontend/src/routes/_protected/dossiers/topics/$id.tsx
    - frontend/src/routes/_protected/dossiers/forums/$id.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/$id.tsx
    - frontend/src/routes/_protected/dossiers/persons/$id.tsx
    - frontend/src/routeTree.gen.ts

key-decisions:
  - "Overview tabs use useDossier hook (TanStack Query deduplicates with DossierShell fetch)"
  - "Cast dossier through unknown for Forum/WorkingGroup pages due to type mismatch with DossierWithExtension"
  - "Shared tab stubs use dossier-shell i18n namespace with defaultValue fallback"

patterns-established:
  - "Layout route pattern: $id.tsx renders DossierShell + Outlet, no page content"
  - "Tab route pattern: each tab is a separate lazy-loaded route file under $id/"
  - "Extra tabs passed via tabConfig prop to DossierShell"

requirements-completed: [DOSS-01, DOSS-10]

duration: 15min
completed: 2026-03-31
---

# Phase 12 Plan 02: Nested Tab Routes Summary

**All 7 dossier types converted from single-file routes to DossierShell layout with 52 nested URL-driven tab routes**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-31T21:13:31Z
- **Completed:** 2026-03-31T21:28:31Z
- **Tasks:** 2
- **Files modified:** 53

## Accomplishments
- Converted all 7 dossier types from monolithic single-file $id.tsx routes to nested route trees
- Each type now has DossierShell layout, index redirect to overview, and 6 shared tab routes
- Country and Topic get extra Positions tab, Organization gets extra MoUs tab
- All tabs are lazy-loaded with TabSkeleton fallbacks; routeTree.gen.ts regenerated

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert Country, Organization, Topic routes** - `668d6c2e` (feat)
2. **Task 2: Convert Forum, Working Group, Person routes** - `7146b781` (feat)

## Files Created/Modified

### Layout routes (rewritten)
- `frontend/src/routes/_protected/dossiers/countries/$id.tsx` - DossierShell + Outlet layout
- `frontend/src/routes/_protected/dossiers/organizations/$id.tsx` - DossierShell + Outlet layout
- `frontend/src/routes/_protected/dossiers/topics/$id.tsx` - DossierShell + Outlet layout
- `frontend/src/routes/_protected/dossiers/forums/$id.tsx` - DossierShell + Outlet layout
- `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx` - DossierShell + Outlet layout
- `frontend/src/routes/_protected/dossiers/persons/$id.tsx` - DossierShell + Outlet layout

### Tab routes (created, 45 files across 7 types)
- `$id/index.tsx` - Redirect to overview (7 files)
- `$id/overview.tsx` - Lazy-loads existing page component (7 files)
- `$id/engagements.tsx` - Stub tab (7 files)
- `$id/docs.tsx` - Stub tab (7 files)
- `$id/tasks.tsx` - Stub tab (7 files)
- `$id/timeline.tsx` - Stub tab (7 files)
- `$id/audit.tsx` - Stub tab (7 files)

### Extra tabs (3 files)
- `countries/$id/positions.tsx` - Lazy-loads DossierPositionsTab
- `organizations/$id/mous.tsx` - Lazy-loads DossierMoUsTab
- `topics/$id/positions.tsx` - Lazy-loads DossierPositionsTab

### Generated
- `frontend/src/routeTree.gen.ts` - Regenerated with all nested routes

## Decisions Made

- **useDossier in overview tabs:** Overview tabs call useDossier(id) to get the dossier object for existing page components. TanStack Query deduplicates this with the DossierShell fetch, so no double network request.
- **unknown cast for Forum/WorkingGroup:** These page components have narrow type props (ForumDossier, WorkingGroupDossier) that don't overlap with DossierWithExtension. Used `as unknown as` intermediate cast since the runtime type is correct.
- **Stub tabs with i18n:** Shared tabs (engagements, docs, tasks, timeline, audit) render placeholder text using dossier-shell i18n namespace with defaultValue fallback. These will be wired to real content in Plan 04/05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS2352 type cast errors in Forum and WorkingGroup overview tabs**
- **Found during:** Task 2
- **Issue:** Direct cast from DossierWithExtension to ForumDossier/WorkingGroupDossier fails because types don't overlap
- **Fix:** Added `unknown` intermediate cast: `dossier as unknown as ForumDossier`
- **Files modified:** forums/$id/overview.tsx, working_groups/$id/overview.tsx
- **Committed in:** 7146b781

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep.

## Known Stubs

The following stub tabs render placeholder text and will be wired to real content in Plans 04/05:
- `$id/engagements.tsx` (all 7 types) - "Content coming soon"
- `$id/docs.tsx` (all 7 types) - "Content coming soon"
- `$id/tasks.tsx` (all 7 types) - "Content coming soon"
- `$id/timeline.tsx` (all 7 types) - "Content coming soon"
- `$id/audit.tsx` (all 7 types) - "Content coming soon"

These stubs are intentional per the plan. Plan 04 (Shared Tab Content) and Plan 05 (Integration Testing) will replace them with real components.

## Issues Encountered

- **Worktree branch divergence:** The worktree was on a separate branch behind main. Required `git merge main` to pull in Plan 01 components (DossierShell, DossierTabNav, RelationshipSidebar). Resolved without conflicts.
- **Case-sensitive directory conflict:** macOS has `components/Dossier/` (capital D) while imports use `components/dossier/` (lowercase). This is a pre-existing TS1261 casing issue, not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 7 dossier types use consistent DossierShell layout with URL-driven tabs
- Plan 03 (Elected Officials) can add the 8th type using the same pattern
- Plans 04/05 can wire real content into the stub tab routes

## Self-Check: PASSED

- All key files verified present (10/10)
- All commits verified in git history (2/2)

---
*Phase: 12-enriched-dossier-pages*
*Completed: 2026-03-31*
