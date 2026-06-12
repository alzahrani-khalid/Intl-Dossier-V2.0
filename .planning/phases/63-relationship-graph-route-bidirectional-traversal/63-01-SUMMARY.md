---
phase: 63-relationship-graph-route-bidirectional-traversal
plan: 01
subsystem: database
tags: [supabase, postgres, rpc, relationship-graph, recursive-cte]

requires:
  - phase: 60-schema-type-truth-and-forward-migrations
    provides: live staging schema and migration discipline
provides:
  - Bidirectional in-place traverse_relationship_graph RPC
  - direction_path metadata for each traversal hop
  - Live staging proof for incoming and outgoing traversal anchors
affects: [relationship-graph, graph-traversal, stakeholder-influence, cqrs-queries]

tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER SQL RPC with pinned search_path
    - Bidirectional recursive traversal with per-hop direction metadata

key-files:
  created:
    - supabase/migrations/20260612100000_bidirectional_traverse_in_place.sql
  modified: []

key-decisions:
  - 'Used DROP + CREATE because PostgreSQL cannot change RETURNS TABLE columns with CREATE OR REPLACE.'
  - 'Kept traverse_relationship_graph_bidirectional untouched because existing consumers still depend on it.'
  - 'Used an equivalent CASE-based bidirectional recursive CTE after PostgreSQL rejected separate recursive terms.'

patterns-established:
  - 'direction_path stores outgoing/incoming per hop for downstream edge orientation.'
  - 'Live RPC probes use a real user JWT so auth.uid() resolves inside the clearance predicate.'

requirements-completed: [GRAPH-02]

duration: 27 min
completed: 2026-06-12
---

# Phase 63 Plan 01: Bidirectional traversal RPC summary

**Bidirectional `traverse_relationship_graph` RPC with live staging proof for incoming and outgoing relationship hops**

## Performance

- **Duration:** 27 min
- **Started:** 2026-06-12T07:34:00Z
- **Completed:** 2026-06-12T08:00:57Z
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments

- Added `supabase/migrations/20260612100000_bidirectional_traverse_in_place.sql`.
- Applied the migration to staging project `zkrcjzdemdmwhearhfgg` via Supabase MCP.
- Verified the recreated RPC is `SECURITY DEFINER`, has `search_path=public`, includes `direction_path`, and preserves the clearance predicate.
- Proved the live incoming-only anchor now returns the working-group row with `direction_path: ["incoming"]`.
- Proved the outgoing anchor still returns the Indonesia row with `direction_path: ["outgoing"]`.
- Verified `traverse_relationship_graph_bidirectional` remains present (`COUNT(*) = 1`).

## Task Commits

1. **Task 1: Write the bidirectional in-place migration** - `d2c0b44a` (feat)
2. **Task 2: Apply migration and probe staging** - live operation, evidence recorded here

## Files Created/Modified

- `supabase/migrations/20260612100000_bidirectional_traverse_in_place.sql` - Drops and recreates the legacy RPC with bidirectional traversal and a ninth `direction_path TEXT[]` return column.

## Decisions Made

- Kept the legacy input signature exactly: `start_dossier_id UUID`, `max_degrees INTEGER DEFAULT 2`, `relationship_type_filter TEXT DEFAULT NULL`.
- Kept `traverse_relationship_graph_bidirectional` untouched.
- Skipped `database.types.ts` regeneration for this plan because no typed direct frontend caller uses the RPC return type yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworked the recursive CTE after staging rejected the four-branch SQL**

- **Found during:** Task 2 (Apply migration to staging)
- **Issue:** Supabase/PostgreSQL rejected the initial four-term CTE with `recursive reference to query "relationship_graph" must not appear within its non-recursive term`.
- **Fix:** Rewrote the body as one non-recursive bidirectional anchor plus one recursive bidirectional branch using CASE expressions for node and direction selection.
- **Files modified:** `supabase/migrations/20260612100000_bidirectional_traverse_in_place.sql`
- **Verification:** Supabase MCP `apply_migration` returned success; authenticated incoming and outgoing probes returned the expected rows.
- **Committed in:** `d2c0b44a`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The delivered behavior and security contract match the plan. The internal CTE shape differs from the four-branch sketch because the sketch was not accepted by PostgreSQL in this migration context.

## Issues Encountered

- Initial migration apply failed with PostgreSQL recursive CTE parsing error. Resolved before any successful staging DDL landed.

## Live Evidence

- `apply_migration`: success for `bidirectional_traverse_in_place`.
- `pg_proc`: `prosecdef = true`, `proconfig = ["search_path=public"]`.
- `pg_get_functiondef`: includes `direction_path` and `sensitivity_level <=`.
- Active anchor row: `a0000000-0000-0000-0000-000000000404` `cooperates_with` `b0000001-0000-0000-0000-000000000001`.
- Incoming probe from `b0000001-0000-0000-0000-000000000001`: HTTP 200, 1 row, `dossier_id = a0000000-0000-0000-0000-000000000404`, `dossier_type = working_group`, `direction_path = ["incoming"]`.
- Outgoing probe from `a0000000-0000-0000-0000-000000000404`: HTTP 200, 1 row, `dossier_id = b0000001-0000-0000-0000-000000000001`, `dossier_type = country`, `direction_path = ["outgoing"]`.
- Sibling function check: `COUNT(*) WHERE proname = 'traverse_relationship_graph_bidirectional'` returned `1`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The data layer for GRAPH-02 is live. Plan 63-04 can now safely port the direction-aware edge orientation into the deployed `graph-traversal` function.

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Completed: 2026-06-12_
