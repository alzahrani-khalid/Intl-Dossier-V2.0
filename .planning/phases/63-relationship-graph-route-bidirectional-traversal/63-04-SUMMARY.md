---
phase: 63-relationship-graph-route-bidirectional-traversal
plan: 04
subsystem: supabase-edge-function
tags: [relationship-graph, graph-traversal, supabase-edge-functions, deploy, live-probe]

requires:
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 01
    provides: live bidirectional RPC with direction_path
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 03
    provides: unit-tested edge orientation contract
provides:
  - Direction-aware graph-traversal edge function
  - Staging deploy of graph-traversal version 12
  - Live incoming and outgoing edge-function probes proving semantic edge orientation
affects: [relationship-graph, graph-traversal, supabase-edge-functions]

tech-stack:
  added: []
  patterns:
    - Supabase Edge Function deploy via MCP
    - Authenticated REST/RPC pre-deploy gate
    - Direction-aware path edge transform mirrored from frontend/src/lib/graph-edge-orientation.ts

key-files:
  created: []
  modified:
    - supabase/functions/graph-traversal/index.ts

key-decisions:
  - 'Preserved verify_jwt=true on the deployed edge function.'
  - 'Preserved auth.getUser(token), supabase-js@2, the maxDegrees 1-5 clamp, CORS, and the named-arg RPC contract.'
  - 'Used direction_path?.[i] so missing direction metadata degrades to previous all-outgoing behavior instead of crashing.'

patterns-established:
  - 'Edge function edge construction now stays in lockstep with frontend/src/lib/graph-edge-orientation.ts.'
  - 'Live probes record ids, counts, and timing only; no JWT or key values are written to evidence.'

requirements-completed: [GRAPH-02]

duration: 4 min
completed: 2026-06-12
---

# Phase 63 Plan 04: Graph traversal edge function summary

**Redeployed `graph-traversal` with direction-aware edge construction and live staging proof**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-12T08:18:42Z
- **Completed:** 2026-06-12T08:22:50Z
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments

- Added local `GraphTraversalRow` and `GraphEdge` typing to `supabase/functions/graph-traversal/index.ts`.
- Replaced path-order edge construction with direction-aware orientation:
  - `direction_path?.[i] === 'incoming'` swaps source and target.
  - missing `direction_path` stays all-outgoing for deploy-window compatibility.
- Preserved existing dedup over `(source_id, target_id, relationship_type)`.
- Added a lockstep comment referencing `frontend/src/lib/graph-edge-orientation.ts`.
- Deployed `graph-traversal` to staging project `zkrcjzdemdmwhearhfgg` as version 12.
- Proved incoming and outgoing anchors both return the same semantic edge orientation.

## Task Commits

1. **Task 1: Direction-aware edge building** - `8b443242`
2. **Task 2: Staging deploy and probes** - live operation, evidence recorded here

## Files Created/Modified

- `supabase/functions/graph-traversal/index.ts` - Direction-aware edge building, local row/edge typing, and lockstep comment.

## Decisions Made

- Kept the deployed function's existing `verify_jwt=true` setting.
- Used the same test-user JWT acquisition flow as the 63-01 staging probes, but never printed token/key/password values.
- Recorded the second call for each edge-function probe to avoid cold-start noise.

## Deviations from Plan

None.

## Issues Encountered

- Initial pre-deploy probe script hit Node's CommonJS/top-level-await ambiguity before any network call; reran it inside an async wrapper.

## Live Evidence

- Pre-deploy RPC gate:
  - `traverse_relationship_graph` from `b0000001-0000-0000-0000-000000000001`
  - HTTP 200
  - row count: 1
  - returned row: `a0000000-0000-0000-0000-000000000404`, type `working_group`, `relationship_path=["cooperates_with"]`, `direction_path=["incoming"]`
- Deploy:
  - project: `zkrcjzdemdmwhearhfgg`
  - function: `graph-traversal`
  - version: 12
  - status: `ACTIVE`
  - verify_jwt: `true`
  - deploy hash: `22f18c0856148527db4333992b16b288895d9dc88ab1e54eb04eeef560ef4eea`
- Incoming anchor probe:
  - start dossier: `b0000001-0000-0000-0000-000000000001`
  - HTTP 200
  - nodes: 2
  - edges: 1
  - second-call query time: 1988 ms
  - edge: `a0000000-0000-0000-0000-000000000404` -> `b0000001-0000-0000-0000-000000000001`, type `cooperates_with`
- Outgoing anchor probe:
  - start dossier: `a0000000-0000-0000-0000-000000000404`
  - HTTP 200
  - nodes: 2
  - edges: 1
  - second-call query time: 942 ms
  - edge: `a0000000-0000-0000-0000-000000000404` -> `b0000001-0000-0000-0000-000000000001`, type `cooperates_with`

## Verification

- Structural guard: `EDGE_FN_OK`.
- Lockstep unit test: `pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts` passed 5/5.
- Pre-commit build passed with existing backend `PDFDocument` warning, Vite circular chunk warning, Sentry dynamic-import warning, and existing `knip` report output.
- Live staging probes passed for both incoming and outgoing anchors.

## User Setup Required

None.

## Next Phase Readiness

GRAPH-02 is now proven through the full stack. Plan 63-05 can seed/verify the broader staging relationship matrix, run browser click-through for the per-type routes, and complete AR/RTL plus gate verification.

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Completed: 2026-06-12_
