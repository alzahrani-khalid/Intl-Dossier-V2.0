---
phase: 54
plan: 03
status: complete
wave: 3
type: execute
gap_closure: false
completed_at: 2026-05-16
requirements: [INTEL-03]
deviations:
  - id: D-54-03-INLINE
    summary: 'Executed inline on the main working tree for the same MCP-availability reason as plans 54-01 and 54-02 (see D-54-01-INLINE).'
    impact: 'None — Wave 3 has a single plan with strict serial dep on 54-02.'
  - id: D-54-03-DUAL-CLIENT-TEST
    summary: 'Integration test reuses the dual-client (anon + service-role) pattern established in plan 54-02 (see D-54-02-DUAL-CLIENT-TEST). The seeded test user is role=viewer, so both intelligence_event INSERT and intelligence_event_dossiers INSERT are gated by RLS. Service-role client seeds parent events + junction rows; anon-key client verifies the EXISTS-on-parent SELECT scoping works.'
    impact: 'Strengthens coverage. All 4 behaviors verified end-to-end.'
key_files:
  created:
    - supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql
    - tests/integration/intelligence-event-dossiers-rls.test.ts
    - .planning/phases/54-intelligence-engine-schema-groundwork/54-03-SUMMARY.md
  modified: []
  deleted: []
commits:
  - c7ec5d46 feat(54-03) add intelligence_event_dossiers polymorphic junction
  - ed379a27 test(54-03) integration coverage for the junction
self_check: PASSED
---

# 54-03 — intelligence_event_dossiers polymorphic junction

## What was built

1. **Junction table.** `public.intelligence_event_dossiers` created on staging
   via Supabase MCP `apply_migration` (D-15). 5 columns:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — surrogate key per
     `work_item_dossiers` precedent.
   - `event_id UUID NOT NULL REFERENCES public.intelligence_event(id) ON DELETE CASCADE`
   - `dossier_type TEXT NOT NULL CHECK` over exactly 7 canonical values
     `(country, organization, forum, engagement, topic, working_group, person)`
     — byte-identical to `dossiers_type_check` (D-06). No `elected_official`.
   - `dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - **Intentionally NO `organization_id` column (D-13).** Tenancy is
     single-source-of-truth on the parent `intelligence_event` row.

2. **Indexes.**
   - `UNIQUE INDEX idx_intelligence_event_dossiers_unique` on
     `(event_id, dossier_type, dossier_id)` — prevents duplicate links.
   - `INDEX idx_intelligence_event_dossiers_dossier` on
     `(dossier_type, dossier_id)` — reverse lookup for "all events linked
     to this dossier".

3. **EXISTS-via-parent RLS.** Four policies, each joining to
   `intelligence_event ie WHERE ie.id = event_id`:
   - SELECT: `tenant_isolation.rls_select_policy(ie.organization_id)`
   - INSERT WITH CHECK: `rls_insert_policy(ie.organization_id) AND
auth_has_any_role(ARRAY['admin','editor'])`
   - UPDATE USING + WITH CHECK: `rls_update_policy(ie.organization_id) AND
auth_has_any_role(ARRAY['admin','editor'])`
   - DELETE: `rls_delete_policy(ie.organization_id)` — helper-only per
     Pitfall 6 (no extra `auth_has_any_role` clause)

4. **Wave-0 integration test.**
   `tests/integration/intelligence-event-dossiers-rls.test.ts` — 4 tests,
   all pass against staging. Dual-client pattern (anon + service-role),
   same as plan 54-02.

## Verification

### MCP probes

| Check            | Probe                                                                                                                      | Result                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Junction exists  | `list_tables`                                                                                                              | `intelligence_event_dossiers` in public                                                            |
| Column set       | `information_schema.columns WHERE table_name='intelligence_event_dossiers'`                                                | 5 rows: `id, event_id, dossier_type, dossier_id, created_at` (NO `organization_id` — D-13 honored) |
| 4 policies       | `pg_policy WHERE polrelid=…`                                                                                               | `intelligence_event_dossiers_{select,insert,update,delete}`                                        |
| Both FKs CASCADE | `pg_constraint contype='f'`                                                                                                | 2 rows: `dossiers` and `intelligence_event`, both `confdeltype='c'`                                |
| RLS enabled      | (implicit via `ALTER TABLE … ENABLE ROW LEVEL SECURITY` in migration; also proven by Test 3 — anon-key SELECT is filtered) | enforced                                                                                           |

### Local file checks

| Check                                                                                                    | Result                                                    |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `CREATE TABLE IF NOT EXISTS public.intelligence_event_dossiers`                                          | 1 occurrence                                              |
| `REFERENCES public.intelligence_event(id) ON DELETE CASCADE`                                             | 1 occurrence                                              |
| `REFERENCES public.dossiers(id) ON DELETE CASCADE`                                                       | 1 occurrence                                              |
| 7-value CHECK literal `('country','organization','forum','engagement','topic','working_group','person')` | 1 occurrence (byte-identical to dossiers_type_check)      |
| `idx_intelligence_event_dossiers_unique` UNIQUE INDEX                                                    | present                                                   |
| `CREATE POLICY` lines                                                                                    | 4                                                         |
| `EXISTS (` blocks                                                                                        | 5 (one per policy + UPDATE has both USING and WITH CHECK) |
| `elected_official` literal in migration                                                                  | 0                                                         |
| `organization_id` column definition in migration                                                         | 0 (D-13 honored)                                          |
| DELETE policy free of `auth_has_any_role`                                                                | 0 occurrences in delete-policy block (Pitfall 6)          |

### Integration test

| Run    | Command                                                                          | Result                                       |
| ------ | -------------------------------------------------------------------------------- | -------------------------------------------- |
| Vitest | `pnpm exec vitest run tests/integration/intelligence-event-dossiers-rls.test.ts` | **4 passed / 0 failed / 0 skipped** in 3.13s |

## Self-Check: PASSED

All `must_haves` from plan 03 frontmatter satisfied:

- ✅ D-05: junction created with surrogate UUID PK and both FKs CASCADE
- ✅ D-06: 7-value CHECK constraint; `elected_official` rejected (Test 1)
- ✅ UNIQUE INDEX on `(event_id, dossier_type, dossier_id)` prevents duplicates
- ✅ D-13: tenancy via EXISTS-on-parent; junction has no `organization_id` column
- ✅ Test 1 proves `elected_official` rejected by CHECK; Test 4 proves CASCADE
- ✅ Wave-0 integration test exists and passes
- ✅ D-15: applied via Supabase MCP

## Hand-off to plan 54-04

All three new schema bodies (intelligence_event, new intelligence_digest,
intelligence_event_dossiers) plus the rename of Phase-45's intelligence_digest
to dashboard_digest are now live on staging. Plan 54-04 closes the loop by
patching REQUIREMENTS.md and ROADMAP.md to match the live names, then
regenerating Supabase TypeScript types so `pnpm type-check` exits 0 across
both workspaces.
