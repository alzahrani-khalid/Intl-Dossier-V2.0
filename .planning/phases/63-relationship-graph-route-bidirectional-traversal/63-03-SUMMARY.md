---
phase: 63-relationship-graph-route-bidirectional-traversal
plan: 03
subsystem: frontend
tags: [relationship-graph, edge-orientation, routing, i18n, react-flow, tdd]

requires:
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 01
    provides: direction_path metadata for downstream edge orientation
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 02
    provides: mounted relationship graph page and graph namespace contract
provides:
  - Pure buildGraphEdges executable spec for the edge-function transform
  - Wave 0 edge-orientation tests for outgoing, incoming, mixed, legacy missing-direction, and dedup cases
  - Per-type getDossierDetailPath regression coverage for all 8 dossier types plus fallbacks
  - Basic-mode React Flow arrow markers
  - Sentence-case EN graph page/mini-graph copy and browseDossiers keys in EN/AR
affects: [relationship-graph, graph-traversal, dossier-navigation, i18n]

tech-stack:
  added: []
  patterns:
    - Pure helper as executable backend parity spec
    - Table-driven route helper tests
    - React Flow MarkerType ArrowClosed markers

key-files:
  created:
    - frontend/src/lib/graph-edge-orientation.ts
    - frontend/src/pages/relationships/__tests__/edge-orientation.test.ts
    - frontend/src/lib/dossier-routes.test.ts
  modified:
    - frontend/src/components/relationships/GraphVisualization.tsx
    - frontend/src/i18n/en/graph.json
    - frontend/src/i18n/ar/graph.json

key-decisions:
  - 'Kept missing direction_path backwards-compatible by treating missing directions as outgoing.'
  - 'Deduplicated oriented edges by source_id, target_id, and relationship_type so opposite types with the same endpoints remain distinct.'
  - 'Scoped the graph JSON sweep to page-facing and mini-graph keys; deep optional visualization namespaces were left unchanged.'

patterns-established:
  - 'Plan 63-04 should port buildGraphEdges semantics into supabase/functions/graph-traversal/index.ts.'
  - 'Basic graph arrows use the same MarkerType.ArrowClosed shape as MiniRelationshipGraph.'

requirements-completed: [GRAPH-03]

duration: 9 min
completed: 2026-06-12
---

# Phase 63 Plan 03: Edge orientation and graph copy summary

**Pinned the frontend edge-orientation contract and closed the remaining Wave 0 graph route gaps**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-12T08:09:08Z
- **Completed:** 2026-06-12T08:18:42Z
- **Tasks:** 3 completed
- **Files modified:** 6

## Accomplishments

- Added a RED edge-orientation contract test covering five GRAPH-02/D-04 cases.
- Added `buildGraphEdges` as a pure executable spec for the backend graph-traversal edge transform.
- Added table-driven `getDossierDetailPath` tests for all eight dossier type segments plus undefined and unknown fallbacks.
- Added `MarkerType.ArrowClosed` markers to Basic-mode `GraphVisualization` edges.
- Added `browseDossiers` to EN and AR graph resource files.
- Converted page-facing EN graph copy to sentence case, including mini-graph `viewFullGraph`.

## Task Commits

1. **Task 1: Write the edge-orientation Wave 0 test** - `664e8dbb` (RED)
2. **Task 1: Implement the edge-orientation helper** - `bc940ab8` (GREEN)
3. **Task 2: Cover dossier detail path segments** - `c00947d0`
4. **Task 3: Add Basic-mode arrows and graph copy** - `bcc3ce76`

## Files Created/Modified

- `frontend/src/pages/relationships/__tests__/edge-orientation.test.ts` - Five-case orientation and dedup contract.
- `frontend/src/lib/graph-edge-orientation.ts` - Pure edge builder with lockstep comment for the Supabase edge function.
- `frontend/src/lib/dossier-routes.test.ts` - Full dossier segment map and fallback regression test.
- `frontend/src/components/relationships/GraphVisualization.tsx` - Basic-mode edge arrow marker.
- `frontend/src/i18n/en/graph.json` - Sentence-case page/mini-graph copy and `browseDossiers`.
- `frontend/src/i18n/ar/graph.json` - `browseDossiers`.

## Decisions Made

- Kept the helper independent from React so plan 63-04 can port the exact loop into the Deno edge function without UI dependencies.
- Used optional chaining on `direction_path?.[i]` so mixed deploy windows with old RPC rows do not crash.
- Left deep visualization copy under `layout`, `pathFinding`, and `timeAnimation` unchanged to limit diff surface.

## Deviations from Plan

None.

## Issues Encountered

- The final commit hook left a pre-format `GraphVisualization.tsx` version staged after the commit while the working file matched HEAD. Cleared the staged-only leftover with `git restore --staged`.

## Verification

- RED confirmed: `pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts` initially failed on the missing helper import.
- GREEN: `pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts` passed 5/5.
- Route helper: `pnpm vitest run src/lib/dossier-routes.test.ts` passed 10/10.
- JSON guard: `JSON_OK`.
- Graph marker guard: `GRAPH_VISUALIZATION_OK`.
- Relationship page suite: `pnpm vitest run src/pages/relationships` passed 8/8 across 2 files.
- Type check: `pnpm type-check` passed.
- Commit hook build ran successfully with existing backend `PDFDocument` warning, Vite circular chunk warning, Sentry dynamic-import warning, and existing `knip` report output.

## User Setup Required

None.

## Next Phase Readiness

The frontend orientation contract is now explicit and passing. Plan 63-04 can port `buildGraphEdges` semantics into `supabase/functions/graph-traversal/index.ts`, deploy the edge function, and run live incoming/outgoing probes.

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Completed: 2026-06-12_
