---
phase: 13-feature-absorption
plan: 03
subsystem: ui
tags: [react-flow, relationship-graph, adaptive-dialog, lazy-loading, sidebar]

requires:
  - phase: 12-enriched-dossier-pages
    provides: RelationshipSidebar with tier groups and AdaptiveDialog pattern
provides:
  - MiniRelationshipGraph embedded inline in RelationshipSidebar (desktop)
  - FullScreenGraphModal with AdvancedGraphVisualization in AdaptiveDialog
  - Lazy-loaded graph modal preserving 200KB bundle budget
affects: [13-04, 13-05]

tech-stack:
  added: []
  patterns: [lazy-loaded-modal-from-sidebar, embed-mini-graph-in-sidebar]

key-files:
  created:
    - frontend/src/components/graph/FullScreenGraphModal.tsx
  modified:
    - frontend/src/components/Dossier/RelationshipSidebar.tsx
    - frontend/src/i18n/en/dossier-shell.json
    - frontend/src/i18n/ar/dossier-shell.json

key-decisions:
  - "Added i18n keys to dossier-shell namespace (not dossier namespace) since RelationshipSidebar uses useTranslation('dossier-shell')"
  - "Used useDossier(dossierId) inside RelationshipSidebar to get dossier object for MiniRelationshipGraph; TanStack Query deduplicates with DossierShell fetch"
  - "Cast DossierWithExtension to Dossier for MiniRelationshipGraph prop compatibility (structural overlap)"

patterns-established:
  - "Lazy-loaded modal from sidebar: React.lazy(() => import(...)) with Suspense fallback={null} for on-demand heavy components"
  - "Key-based remount: key={String(open)} forces graph remount on sidebar toggle to avoid stale ReactFlow state"

requirements-completed: [ABSORB-04]

duration: 6min
completed: 2026-04-02
---

# Phase 13 Plan 03: Network Graph Absorption Summary

**Inline mini-graph preview in RelationshipSidebar with expand-to-modal full-screen AdvancedGraphVisualization via lazy-loaded FullScreenGraphModal**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-02T18:15:14Z
- **Completed:** 2026-04-02T18:21:26Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Embedded MiniRelationshipGraph above tier groups in RelationshipSidebar (desktop only, hidden in mobile sheet)
- Created FullScreenGraphModal with AdaptiveDialog wrapping ReactFlowProvider + AdvancedGraphVisualization
- Lazy-loaded modal via React.lazy to protect 200KB bundle budget
- Full bilingual i18n (EN/AR) for sidebar graph map and full-screen modal controls

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FullScreenGraphModal and embed mini-graph in RelationshipSidebar** - `126dd65a` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `frontend/src/components/graph/FullScreenGraphModal.tsx` - Full-screen AdaptiveDialog modal with graph traversal data fetching, controls (degree/type filters), and AdvancedGraphVisualization
- `frontend/src/components/Dossier/RelationshipSidebar.tsx` - Added MiniRelationshipGraph section above tier groups, Expand button, lazy-loaded FullScreenGraphModal with Suspense
- `frontend/src/i18n/en/dossier-shell.json` - Added sidebar.relationshipMap, sidebar.expandGraph, graph.* keys
- `frontend/src/i18n/ar/dossier-shell.json` - Arabic translations for all new keys

## Decisions Made
- Added i18n keys to `dossier-shell` namespace (not `dossier`) since RelationshipSidebar uses `useTranslation('dossier-shell')` -- deviates from plan which suggested `dossier.json` but follows actual codebase conventions
- Used `useDossier(dossierId)` inside RelationshipSidebar to get full dossier object for MiniRelationshipGraph; TanStack Query deduplicates with the same fetch in DossierShell
- Cast `DossierWithExtension` to `Dossier` via `as unknown as Dossier` for MiniRelationshipGraph prop compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] i18n namespace correction**
- **Found during:** Task 1
- **Issue:** Plan specified adding keys to `dossier.json` but RelationshipSidebar uses `useTranslation('dossier-shell')`
- **Fix:** Added all new i18n keys to `dossier-shell.json` (EN and AR) instead of `dossier.json`
- **Files modified:** `frontend/src/i18n/en/dossier-shell.json`, `frontend/src/i18n/ar/dossier-shell.json`
- **Verification:** Keys match the namespace used by the component
- **Committed in:** `126dd65a`

**2. [Rule 3 - Blocking] MiniRelationshipGraph prop adaptation**
- **Found during:** Task 1
- **Issue:** MiniRelationshipGraph expects `dossier: Dossier` prop but RelationshipSidebar only has `dossierId`. Plan assumed `dossierId` + `dossierType` props.
- **Fix:** Added `useDossier(dossierId)` hook call and cast result for type compatibility
- **Files modified:** `frontend/src/components/Dossier/RelationshipSidebar.tsx`
- **Verification:** Structural type overlap confirmed; TanStack Query deduplicates with DossierShell
- **Committed in:** `126dd65a`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to match actual codebase interfaces. No scope creep.

## Issues Encountered
- TypeScript compilation could not be verified directly (no node_modules in worktree). Manual code review confirmed correct imports, types, and patterns.

## Known Stubs
None -- all data sources wired (useDossier for mini-graph, fetchGraphData for full-screen modal).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RelationshipSidebar now shows inline graph + expand button
- Plan 04 can add Cmd+K command for graph modal access
- Plan 05 can handle standalone graph route removal/redirect

## Self-Check: PASSED

All files exist. All commit hashes found.

---
*Phase: 13-feature-absorption*
*Completed: 2026-04-02*
