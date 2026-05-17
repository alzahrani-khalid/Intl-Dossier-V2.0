---
phase: 54
plan: 02
status: complete
wave: 2
type: execute
gap_closure: false
completed_at: 2026-05-16
requirements: [INTEL-01, INTEL-02, INTEL-04]
deviations:
  - id: D-54-02-INLINE
    summary: 'Executed inline on the main working tree for the same MCP-availability reason as plan 54-01 (see D-54-01-INLINE). Migration applied to staging via Supabase MCP from the orchestrator; remaining test-authoring work landed directly on the working tree.'
    impact: 'None — no parallelism benefit lost (Wave 2 has a single plan with strict serial dep on 54-01).'
  - id: D-54-02-DUAL-CLIENT-TEST
    summary: 'Plan 54-02 Task 2 envisaged the integration test exercising INSERT/CHECK assertions through the signed-in anon-key client alone. Live behavior on staging: the seeded test user has role=viewer in public.users (intentional fixture for SELECT-side testing), so the verbatim Phase-45 INSERT policy correctly rejects all anon inserts via the auth_has_any_role(ARRAY[admin,editor]) clause. To still cover the table-level CHECK + enum constraints, the test now uses two Supabase clients — anon-key for RLS reads + INSERT-denial assertion (Test 2), and service-role for SELECT seeding + CHECK / enum probes (Tests 3/4/5). The plan acceptance allowed ≤1 skip; deviation chooses dual-client coverage instead so zero tests are skipped and all 6 pass cleanly.'
    impact: 'Strengthens coverage. All 6 behaviors verified end-to-end. RLS is still proven via anon-key Test 2 (rejection) and Tests 1/6 (filtered SELECT).'
  - id: D-54-02-DOSSIER-LOOKUP
    summary: 'Plan 54-02 Task 2 (a) called for `.from(dossiers).select(id,type).eq(organization_id, orgIdA)` to discover a dossier in the test users org. The dossiers table has no organization_id column (tenancy is via sensitivity_level/clearance, not direct FK to organization), so the test now picks any visible dossier whose type is one of the 7 canonical values (country|organization|forum|engagement|topic|working_group|person).'
    impact: 'None — the goal of "valid (dossier_type, dossier_id) FK target" is met. INTEL-02 period CHECK probe still exercises the period_end > period_start constraint correctly.'
key_files:
  created:
    - supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql
    - tests/integration/intelligence-event-rls.test.ts
    - .planning/phases/54-intelligence-engine-schema-groundwork/54-02-SUMMARY.md
  modified: []
  deleted: []
commits:
  - f9a32bcb feat(54-02) intelligence_event + intelligence_digest + signal_source_type
  - 40eccc53 test(54-02) integration coverage for both tables
self_check: PASSED
---

# 54-02 — intelligence_event + new intelligence_digest + signal_source_type

## What was built

1. **Atomic v7.0 ingest-layer migration.** Single migration
   `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql`
   applied to staging (`zkrcjzdemdmwhearhfgg`) via Supabase MCP `apply_migration`
   per D-15. It creates, in this order:
   - The `public.signal_source_type` PG enum with exactly 4 values:
     `publication`, `feed`, `human_entered`, `ai_generated` (D-09, D-10).
   - The `public.intelligence_event` raw-ingest table (INTEL-01) — UUID PK,
     `organization_id` FK to `public.organizations(id) ON DELETE CASCADE`
     (D-08, NOT `tenant_id`), `source_type` typed against the new enum,
     `source_ref`, `content`, `occurred_at`, `ingested_at`, a `severity TEXT
CHECK ('low','medium','high','urgent') DEFAULT 'medium'` (D-11, reusing
     work-item Priority vocab), `created_by` FK to `auth.users` with
     `ON DELETE SET NULL`, `created_at`. Plus 4 indexes:
     `idx_intelligence_event_org_occurred_at` (org, occurred_at DESC),
     `idx_intelligence_event_org_severity` (org, severity) partial on
     `severity IN ('high','urgent')`, `idx_intelligence_event_source_type`,
     and `idx_intelligence_event_created_by` partial on
     `created_by IS NOT NULL`.
   - The new spec-shape `public.intelligence_digest` table (INTEL-02) —
     UUID PK, `organization_id` (D-08), `dossier_type TEXT CHECK` over the
     7 canonical types `(country|organization|forum|engagement|topic|
working_group|person)` exactly (no `elected_official`), `dossier_id`
     FK to `public.dossiers(id) ON DELETE CASCADE`, `period_start`,
     `period_end CHECK (period_end > period_start)`, `summary`,
     `generated_by` FK to `auth.users` with `ON DELETE SET NULL`,
     `generated_at`. Plus 2 indexes:
     `idx_intelligence_digest_org_dossier_period`
     (organization_id, dossier_id, period_end DESC) and
     `idx_intelligence_digest_dossier_type`.
   - Verbatim Phase-45 four-policy RLS on both tables (D-12):
     SELECT via `tenant_isolation.rls_select_policy(organization_id)`,
     INSERT/UPDATE via
     `tenant_isolation.rls_*_policy(organization_id) AND
 public.auth_has_any_role(ARRAY['admin','editor'])`,
     DELETE via `tenant_isolation.rls_delete_policy(organization_id)` —
     helper-only, no extra `AND auth_has_any_role` clause (Pitfall 6).
   - `GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated` on both tables.
   - `COMMENT ON TABLE` documenting the v7.0 rationale and the rename trail
     from the Phase-45 table (now `dashboard_digest`, per plan 54-01).

2. **Wave-0 RLS integration test.** New file
   `tests/integration/intelligence-event-rls.test.ts` mirrors the structure
   of `tests/integration/polymorphic-document-rls.test.ts` and exercises
   6 distinct behaviors. The test uses two Supabase clients (see D-54-02-DUAL-CLIENT-TEST):
   - `anon` (anon key + signed-in test user) exercises real RLS for reads
     and for INSERT denial.
   - `admin` (service-role key) seeds rows for SELECT-side assertions and
     probes table-level CHECK / enum constraints in isolation from RLS.

## Verification

### Migration side (Supabase MCP probes)

| Check                                   | Probe                                                                                                                                                                                                                  | Result                                                                                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both tables exist                       | `list_tables` + `information_schema.tables WHERE table_name IN (…)`                                                                                                                                                    | `intelligence_event`, `intelligence_digest`, `dashboard_digest` all present in public                                                                            |
| Enum has 4 values                       | `SELECT enum_range(NULL::public.signal_source_type)::TEXT[]`                                                                                                                                                           | `{publication,feed,human_entered,ai_generated}`                                                                                                                  |
| Enum is wired                           | `SELECT … FROM information_schema.columns WHERE table_name='intelligence_event' AND column_name='source_type'`                                                                                                         | `udt_name = 'signal_source_type'`, `data_type = 'USER-DEFINED'`                                                                                                  |
| 8 policies, named correctly             | `SELECT polname FROM pg_policy WHERE polrelid IN ('public.intelligence_event'::regclass, 'public.intelligence_digest'::regclass) ORDER BY polname`                                                                     | 8 rows: `intelligence_digest_{delete_admin,insert_editor,select_org,update_editor}` + `intelligence_event_{delete_admin,insert_editor,select_org,update_editor}` |
| RLS enabled on both                     | `SELECT relrowsecurity FROM pg_class WHERE oid IN (…)`                                                                                                                                                                 | `t`, `t`                                                                                                                                                         |
| All intelligence_digest columns present | `information_schema.columns` ordered                                                                                                                                                                                   | 9 rows matching the migration definition (id, organization_id, dossier_type, dossier_id, period_start, period_end, summary, generated_by, generated_at)          |
| Local migration file disciplined        | `grep -c CREATE TYPE public.signal_source_type` / `CREATE TABLE IF NOT EXISTS public.intelligence_event` / `…intelligence_digest` / `CHECK (period_end > period_start)` / `CREATE POLICY` / `grep -c elected_official` | 1 / 1 / 1 / 1 / 8 / 0                                                                                                                                            |
| DELETE policy helper-only               | `grep -B1 -A2 delete_admin … \| grep -c auth_has_any_role`                                                                                                                                                             | 0 (Pitfall 6)                                                                                                                                                    |

### Integration-test side

| Run    | Command                                                                 | Result                                       |
| ------ | ----------------------------------------------------------------------- | -------------------------------------------- |
| Vitest | `pnpm exec vitest run tests/integration/intelligence-event-rls.test.ts` | **6 passed / 0 failed / 0 skipped** in 2.78s |

## Self-Check: PASSED

All `must_haves` from plan 02 frontmatter satisfied:

- ✅ `signal_source_type` enum exists with exactly 4 values
- ✅ `intelligence_event` created with full column set, `severity` CHECK over `low|medium|high|urgent`, `organization_id` FK (not `tenant_id`), and required indexes
- ✅ New `intelligence_digest` exists with `organization_id` (not `tenant_id`), 9-column shape, `CHECK (period_end > period_start)`, required indexes
- ✅ Both tables get the verbatim Phase-45 four-policy RLS template; DELETE policy helper-only per Pitfall 6
- ✅ User from org A SELECT returns own rows and is filtered for cross-tenant SELECT — proven via integration test
- ✅ `tests/integration/intelligence-event-rls.test.ts` exists and exits 0 (6/6)
- ✅ D-15: applied via Supabase MCP `apply_migration`

## Hand-off to plan 54-03

The `intelligence_event` table exists at the canonical name with `id UUID
PRIMARY KEY`. Plan 54-03 can now create the polymorphic
`intelligence_event_dossiers` junction with `event_id UUID NOT NULL
REFERENCES public.intelligence_event(id) ON DELETE CASCADE` and the EXISTS-via-parent
RLS pattern that defers tenancy to `intelligence_event.organization_id`.
