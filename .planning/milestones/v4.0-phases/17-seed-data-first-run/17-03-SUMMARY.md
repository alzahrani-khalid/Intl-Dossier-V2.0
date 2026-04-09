---
phase: 17-seed-data-first-run
plan: 03
subsystem: database
tags: [postgres, supabase, rpc, security-definer, first-run, types]

requires:
  - phase: 17-01
    provides: canonical seeded-tables list
provides:
  - check_first_run() SECURITY DEFINER RPC for first-run detection
  - regenerated frontend/src/types/database.types.ts including check_first_run
affects: [17-04-first-run-modal, 17-05-dashboard-wiring]

tech-stack:
  added: []
  patterns:
    - 'SECURITY DEFINER RPC with strict admin gate (role + is_active + not-expired)'
    - 'EXISTS + LIMIT 1 short-circuit emptiness probe over canonical tables'

key-files:
  created:
    - supabase/migrations/20260407000003_check_first_run.sql
  modified:
    - frontend/src/types/database.types.ts

key-decisions:
  - 'Probes 9 canonical tables: dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, tasks (excludes work_items and elected_officials per 17-SCHEMA-RECONCILIATION.md §7)'
  - "Admin gate stricter than plan baseline: role IN ('admin','super_admin') AND is_active AND not expired"
  - 'Function marked STABLE so PG can cache within a single statement'
  - 'GRANT EXECUTE TO authenticated only — anon role cannot probe DB shape'

patterns-established:
  - 'First-run detection RPC: returns {is_empty, can_seed} JSON shape consumed by frontend useFirstRunCheck hook'

requirements-completed: [SEED-03]

duration: ~30min
completed: 2026-04-07
---

# Phase 17 Plan 03: check_first_run RPC Summary

**Lightweight first-run detection RPC and regenerated database types — frontend can now type-safely query whether the database is empty and whether the caller is allowed to seed it.**

## Performance

- **Completed:** 2026-04-07
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- check_first_run() SECURITY DEFINER function probes the 9 canonical tables with EXISTS + LIMIT 1 short-circuit
- Strict admin gate enforces role IN (admin, super_admin), is_active = true, and not expired
- Migration applied to staging zkrcjzdemdmwhearhfgg; verified via SELECT check_first_run() (returned {is_empty: false, can_seed: false} since staging has existing data)
- Regenerated frontend/src/types/database.types.ts now exposes check_first_run under Database['public']['Functions']

## Task Commits

1. **Tasks 1 + 2 bundled** — `d06ebdab` (feat(17-03): check_first_run RPC and regenerated database types)

## Files Created/Modified

- `supabase/migrations/20260407000003_check_first_run.sql` — RPC, grant, comment
- `frontend/src/types/database.types.ts` — regenerated to expose new RPC

## Verification

- `SELECT check_first_run()` returns `{is_empty, can_seed}` JSON on staging (correct shape, correct values)
- TypeScript types include check_first_run in Database['public']['Functions']
- Authenticated role can execute; anon cannot

## Notes

- Implementation strengthened the admin gate beyond the plan baseline (added is_active + not-expired checks) to align with project security conventions.
- populate_diplomatic_seed RPC is NOT yet visible in the regenerated types because Plan 17-02 has not shipped yet — regeneration will happen again after 17-02.
- SUMMARY.md backfilled 2026-04-07 — original execution shipped without it during a parent-session interruption.
