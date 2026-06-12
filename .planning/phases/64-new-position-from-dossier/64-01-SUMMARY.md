---
phase: 64-new-position-from-dossier
plan: 01
subsystem: database
tags: [supabase, rls, postgres, positions, security]

requires:
  - phase: 63-relationship-graph-route-bidirectional-traversal
    provides: verified dossier detail routes the positions tab hangs off
provides:
  - Restored positions INSERT RLS policy (drafters_insert_positions) on staging
  - Idempotent restore migration with forensic header in repo
  - Live probe evidence that positions-create returns 201 and over-grant probes still 403
affects: [64-04, 64-05, 64-06, positions-create, engagement-positions]

tech-stack:
  added: []
  patterns: [forensic dated RLS restore migration (DROP IF EXISTS + CREATE, minimal predicate)]

key-files:
  created:
    - supabase/migrations/20260612120000_restore_positions_insert_policy.sql
  modified: []

key-decisions:
  - 'Live diagnostic showed NO INSERT policy at all on positions (deny-all), so the migration is the simple canonical restore — no drift-name drop needed'
  - "Predicate restored exactly as repo source of truth: auth.uid() = author_id AND status = 'draft' (never blanket-true)"

patterns-established:
  - 'RLS drift restore: capture pg_policy before-state via MCP, author idempotent migration, apply via MCP, prove with 201-positive + 403-negative probes, clean probe rows'

requirements-completed: [POSNEW-01]

duration: 12min
completed: 2026-06-12
---

# Phase 64 Plan 01: Restore positions INSERT RLS policy Summary

**Closed the P0 blocker: staging positions table had NO INSERT policy (deny-all under RLS); restored drafters_insert_positions via MCP-applied migration, live-proven 201-create with negative probes still denied.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-06-12
- **Tasks:** 2/2
- **Files modified:** 1 (new migration)

## Accomplishments

1. **Before-state captured (Task 1):** pg_policy diagnostic on staging `positions` returned exactly one row:
   - `positions_authenticated_read` — polcmd `r` (SELECT), permissive, USING `true`, no check expr
   - **No polcmd='a' (INSERT) row existed.** `relrowsecurity = true`, `relforcerowsecurity = false` → INSERT deny-all. Plan branch 1 applied (policy simply missing — canonical restore only, no drift-name drop, no restrictive/lockdown policy found, STOP rule not triggered).
2. **Migration authored + committed:** `supabase/migrations/20260612120000_restore_positions_insert_policy.sql` — forensic dated header, `DROP POLICY IF EXISTS "drafters_insert_positions"` + `CREATE POLICY ... FOR INSERT WITH CHECK (auth.uid() = author_id AND status = 'draft')`. Scope: exactly one INSERT policy on exactly one table.
3. **Applied via `mcp__supabase__apply_migration`** (project zkrcjzdemdmwhearhfgg, name `restore_positions_insert_policy`) — success. After-state diagnostic now shows:
   - `drafters_insert_positions` — polcmd `a`, permissive, check `((auth.uid() = author_id) AND (status = 'draft'::text))`
   - `positions_authenticated_read` — unchanged

## Probe matrix (Task 2)

| Probe                                                        | Path                                | Expected  | Actual                                       |
| ------------------------------------------------------------ | ----------------------------------- | --------- | -------------------------------------------- |
| Valid create (user JWT, edge fn)                             | POST /functions/v1/positions-create | 201       | **201** (status `draft`, author = test user) |
| Spoofed author_id (direct PostgREST INSERT, other user's id) | POST /rest/v1/positions             | 403/42501 | **403, code 42501**                          |
| Non-draft status (direct PostgREST INSERT, status published) | POST /rest/v1/positions             | 403/42501 | **403, code 42501**                          |

Lookup ids resolved by name (`position_types.name_en = 'Standard Position'`, `audience_groups.name_en = 'All Staff'`) — no hardcoded UUIDs.

## Cleanup confirmation

Probe position deleted in dependency order (position_audience_groups → position_versions → positions). Post-delete verification: `probe_rows_left = 0`, `negative_probe_rows = 0` (negative probes created zero rows, as expected for denied inserts). Local probe temp files removed. No secrets recorded anywhere in this summary.

## Deviations

- The Task 2 standalone verify command (which would create a second probe row titled "RLS probe 64-01 verify") was satisfied by the equivalent inline positive probe above — same endpoint, same payload shape, observed 201. Avoided creating a redundant probe row.
- Migration header wording adjusted ("never a blanket-true check") so the Task 1 negative grep on the literal over-grant SQL doesn't false-positive on the comment.

## Self-Check: PASSED

- Migration file exists with required content: VERIFIED (automated grep gate passed)
- Live 201 + double 403: VERIFIED (probe matrix above)
- Cleanup count = 0: VERIFIED
