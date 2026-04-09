---
phase: 17-seed-data-first-run
plan: 02
subsystem: database
tags: [postgres, supabase, rpc, security-definer, seed, fixtures, gastat, bilingual]

requires:
  - phase: 17-01
    provides: is_seed_data tagging columns + partial indexes
provides:
  - populate_diplomatic_seed() SECURITY DEFINER RPC with full GASTAT scenario
  - regenerated frontend/src/types/database.types.ts exposing both Phase 17 RPCs
affects: [17-04-first-run-modal, 17-05-dashboard-wiring]

tech-stack:
  added: []
  patterns:
    - 'Typed-dossier 1:1 PK inheritance for bilingual seed inserts (dossier carries name_en/ar, typed child carries type-specific metadata)'
    - 'Deterministic UUID fixtures via uuid_generate_v5 with a fixed namespace'
    - 'Enum-coverage generation via array modulo cycling inside PL/pgSQL FOR loop'
    - 'Hardcoded default-tenant constant pattern for operational tables lacking users.tenant_id'

key-files:
  created:
    - supabase/migrations/20260407000002_populate_diplomatic_seed.sql
  modified:
    - frontend/src/types/database.types.ts
    - .planning/phases/17-seed-data-first-run/17-SCHEMA-RECONCILIATION.md (added §10)
    - .planning/phases/17-seed-data-first-run/17-02-PLAN.md (second-pass amendment pointer)

key-decisions:
  - 'Schema deviation from plan: countries/organizations/forums/engagements/topics/persons/working_groups do NOT carry name_en/ar. Bilingual name lives in dossiers. RPC inserts dossiers first, then typed child using the same deterministic UUID.'
  - "No users.tenant_id column exists. Hardcoded default tenant '00000000-0000-0000-0000-000000000001' matches all 30 existing tasks on staging."
  - 'Strict admin gate matches check_first_run exactly: role IN (admin, super_admin) AND is_active AND not expired.'
  - 'Staging coexistence policy: install but do not invoke — calling on staging (which already holds 250 real countries, 7 orgs, etc.) would create duplicates.'
  - "8-dossier-type requirement satisfied by 7 existing dossiers.type values plus persons.person_subtype='elected_official' discriminator (no new dossier.type value added)."

patterns-established:
  - 'Phase 17 seed fixtures use jsonb array literals as inline VALUES source for two-pass inserts (dossier parent + typed child)'
  - 'Task generation via FOR 1..50 loop cycling all enum values through modulo arithmetic — guarantees full status/priority/type/workflow_stage coverage with ≥10 of each source kind'

requirements-completed: [SEED-01, SEED-02, SEED-03]

duration: ~90min
completed: 2026-04-07
---

# Phase 17 Plan 02: populate_diplomatic_seed RPC Summary

**Installed the GASTAT diplomatic seed RPC on staging — deterministic, idempotent, admin-gated, bilingual across all native columns, covering every task enum value and five inheritance_source variants. Function is available but intentionally uninvoked on staging to avoid colliding with existing real data.**

## Performance

- **Completed:** 2026-04-07
- **Tasks:** 3 (design + migration authoring + apply/verify)
- **Files modified:** 4

## Accomplishments

- Authored `supabase/migrations/20260407000002_populate_diplomatic_seed.sql` — `CREATE OR REPLACE FUNCTION public.populate_diplomatic_seed() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER` implementing the full Phase 17 scenario
- Live-probed staging schema before authoring; identified three material plan deviations and captured them in §10 of 17-SCHEMA-RECONCILIATION.md:
  - (a) typed-dossier 1:1 PK inheritance — bilingual name lives in `dossiers`
  - (b) no `users.tenant_id` column — hardcoded default tenant
  - (c) staging coexistence policy — install, do not invoke
- Applied migration to staging `zkrcjzdemdmwhearhfgg` via Supabase MCP
- Regenerated `frontend/src/types/database.types.ts` — both `populate_diplomatic_seed` and `check_first_run` now visible under `Database['public']['Functions']`
- Hardened grants: REVOKE EXECUTE FROM PUBLIC, GRANT EXECUTE TO authenticated
- Verified: function exists, SECURITY DEFINER=true, authenticated can execute

## Task Commits

1. **Design + migration + apply + types + plan amendments (bundled)** — `d1b98293` (feat(17-02): populate_diplomatic_seed RPC with GASTAT fixtures)

## Files Created/Modified

- `supabase/migrations/20260407000002_populate_diplomatic_seed.sql` — 437-line RPC with jsonb fixture arrays and enum-cycling task loop
- `frontend/src/types/database.types.ts` — regenerated (39,121 lines) via Supabase MCP `generate_typescript_types`
- `.planning/phases/17-seed-data-first-run/17-SCHEMA-RECONCILIATION.md` — added §10 "Live Schema Probe" addendum
- `.planning/phases/17-seed-data-first-run/17-02-PLAN.md` — added second-pass amendment pointer at top of `<objective>`

## Fixture Inventory

| Entity             | Count | Key notes                                                                   |
| ------------------ | ----- | --------------------------------------------------------------------------- |
| dossiers           | 62    | 10 country + 10 org + 10 forum + 6 topic + 4 wg + 12 person + 10 engagement |
| countries          | 10    | SA, AE, BH, KW, QA, OM, EG, JO, ID, PK                                      |
| organizations      | 10    | UNSD, GCC-Stat, OECD, IMF, WB, ESCWA, AITRS, ISI, Eurostat, FAO Stat        |
| forums             | 10    | UNSC, WDF, IAOS, GCC AM, OECD WF, ESCWA SC, ISI WSC, ASF, IMF SF, G20 DGI   |
| engagements        | 10    | Bilateral, MoU, workshops, joint committees, consultations                  |
| topics             | 6     | SDG, Census 2030, National Accounts, Big Data, Gender, Climate              |
| working_groups     | 4     | SDG, Census 2030, Data Quality, Innovation                                  |
| persons            | 12    | 9 standard + 3 elected_official (person_subtype)                            |
| tasks              | 50    | Full enum coverage (5 status × 5 type × 5 stage × 4 priority, cycling)      |
| work_item_dossiers | ~67   | 50 primary (country) + ~17 secondary (org) with 5 inheritance_source values |

## Verification

- Function installed: `SELECT proname, prosecdef FROM pg_proc WHERE proname='populate_diplomatic_seed'` returns `{populate_diplomatic_seed, true}` ✓
- Grants: `has_function_privilege('authenticated', …, 'EXECUTE')` = true ✓
- TypeScript: regenerated file includes `populate_diplomatic_seed` in `Database['public']['Functions']` ✓
- **Not invoked on staging** — per §10.3 policy. Functional correctness will be validated on the first fresh deploy that calls the RPC through the FirstRunModal wired in 17-05.

## Notes

- This SUMMARY documents parent-session authorship because Phase 17 Wave 2 subagents do not have Supabase MCP access. The backfill of 17-01/17-03 SUMMARY.md files (commit `96900dbf`) and this live migration (commit `d1b98293`) were authored inline after the original subagent dispatch stalled.
- The migration is safe to re-apply — `CREATE OR REPLACE FUNCTION` + `ON CONFLICT DO NOTHING` on every INSERT make it idempotent at both DDL and DML levels.
- Open risk: the GASTAT seed has not been smoke-tested on an actually empty database. The first real invocation will occur on the first fresh deploy via FirstRunModal. A dedicated test environment seed run is a recommended UAT gate before v4.0 production cutover.
