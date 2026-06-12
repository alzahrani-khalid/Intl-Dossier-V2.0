---
phase: 63-relationship-graph-route-bidirectional-traversal
plan: 02
subsystem: frontend
tags: [relationship-graph, routing, i18n, tanstack-router, tdd]

requires:
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 01
    provides: bidirectional traversal RPC contract for downstream graph function work
provides:
  - Mounted /relationships/graph route with typed dossierId search validation
  - Actionable no-dossier state with /dossiers link
  - RelationshipGraphPage graph namespace i18n contract
  - Canonical 18-value relationship type filter
affects: [relationship-graph, dossier-detail-sidebar, routing, i18n]

tech-stack:
  added: []
  patterns:
    - TanStack Router validateSearch wrapper route
    - Page-level namespace i18n with bare translation keys
    - Mock-before-import page contract test

key-files:
  created:
    - frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx
  modified:
    - frontend/src/routes/_protected/relationships/graph.tsx
    - frontend/src/pages/relationships/RelationshipGraphPage.tsx
    - frontend/src/components/dossier/MiniRelationshipGraph.tsx
    - frontend/src/routeTree.gen.ts

key-decisions:
  - 'Kept MiniRelationshipGraph as the only entry point and only removed the obsolete search cast.'
  - 'Used getRouteApi("/_protected/relationships/graph").useSearch() so the page reads the validated route search contract directly.'
  - 'Committed the generated route tree after repeated builds regenerated the tracked artifact.'

patterns-established:
  - 'Relationship graph page tests mock both useSearch and getRouteApi so future typed-router changes do not require test rewrites.'
  - 'Relationship type filter options now come from the DossierRelationshipType union values.'

requirements-completed: [GRAPH-01]

duration: 9 min
completed: 2026-06-12
---

# Phase 63 Plan 02: Relationship graph route summary

**Mounted the dormant full-page relationship graph route and repaired its page contract**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-12T08:00:00Z
- **Completed:** 2026-06-12T08:09:08Z
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments

- Added a Wave 0 page contract test for the no-dossier alert/link, graph chrome rendering, and graph namespace regression guard.
- Replaced the `/relationships/graph` redirect with a mounted `RelationshipGraphPage` route and `validateSearch` for optional `dossierId`.
- Removed the `as any` cast from the mini-graph `Link` search prop.
- Repaired `RelationshipGraphPage` to use `useTranslation('graph')` with bare keys.
- Replaced stale filter values with all 18 canonical `DossierRelationshipType` values.
- Added the D-02 `Browse dossiers` link in the no-dossier state.
- Regenerated and committed the tracked TanStack route tree after builds updated it.

## Task Commits

1. **Task 1: Write the Wave 0 page test** - `c8bf07b2` (RED)
2. **Task 2: Mount the route with validateSearch; type the mini-graph Link** - `b9c1dd8b`
3. **Task 3: Repair the page contract** - `df7230e9` (GREEN)
4. **Generated artifact: route tree** - `3f8f14c4`

## Files Created/Modified

- `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` - Page contract test for GRAPH-01, D-02, and D-07.
- `frontend/src/routes/_protected/relationships/graph.tsx` - Route mount with typed search validation.
- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` - Typed search, graph namespace, canonical filter, and no-dossier link.
- `frontend/src/components/dossier/MiniRelationshipGraph.tsx` - Removed the `search` prop `as any` cast only.
- `frontend/src/routeTree.gen.ts` - Generated route tree output from the frontend build.

## Decisions Made

- Preserved the existing `getDossierDetailPath` node navigation block; GRAPH-03 remains unchanged for plan 63-03 validation.
- Used inline fallback text for `browseDossiers` so this plan is green before the 63-03 JSON sweep adds the explicit translation key.
- Kept layout and graph mode behavior unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Quality] Committed routeTree.gen.ts as a generated artifact after build regeneration**

- **Found during:** Task 2/3 build hooks
- **Issue:** Repeated frontend builds regenerated the tracked TanStack route tree with broad ordering churn.
- **Fix:** Committed `frontend/src/routeTree.gen.ts` separately after route/page verification.
- **Verification:** Frontend page test and type-check passed before the generated artifact commit; build hooks also completed with existing warnings/noise.
- **Committed in:** `3f8f14c4`

---

**Total deviations:** 1 auto-fixed (1 quality/tooling).
**Impact on plan:** No behavioral scope change. The generated artifact is tracked and now matches the current build output.

## Issues Encountered

- `lint-staged` produced an empty generated-file commit attempt while leaving `routeTree.gen.ts` staged; the staged generated diff was amended into the commit after the build hook had already run.

## Verification

- RED confirmed: `pnpm vitest run src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` initially failed on the missing namespace/link contract, not on import setup.
- GREEN: `pnpm vitest run src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` passed 3/3.
- Plan verification: `pnpm vitest run src/pages/relationships && pnpm type-check` passed.
- Structural guard: `63-02_STRUCTURAL_OK` confirmed route mount, no redirect, no page `as any`, graph namespace, canonical filter values, and no stale `parent_org`/`signatory`.
- Hook build ran successfully with existing backend `PDFDocument` warning, Vite circular chunk warning, Sentry dynamic-import warning, and existing `knip` report output.

## User Setup Required

None.

## Next Phase Readiness

GRAPH-01 is satisfied in code. Plan 63-03 can now add the graph edge-orientation helper, per-type path tests, Basic-mode arrow rendering, and the graph JSON sentence-case sweep.

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Completed: 2026-06-12_
