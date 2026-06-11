---
phase: 60-schema-type-truth-restoration
verified: 2026-06-10T00:00:00Z
status: passed
score: 14/14
overrides_applied: 0
---

# Phase 60: Schema & Type Truth Restoration — Verification Report

**Phase Goal:** The repo's generated types, committed migrations, and edge-function SQL all agree with the live staging database — every RPC/table an edge function references exists in generated types (or a documented allowlist), and the missing canonical SQL is committed as forward migrations.
**Verified:** 2026-06-10
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                            | Status   | Evidence                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Unified work stack (view + matview + 3 RPCs) captured as a committed forward migration                                                           | VERIFIED | `20260610000001_capture_unified_work_stack.sql` exists, 383 lines; grep returns 5 CREATE OR REPLACE VIEW/FUNCTION/MATERIALIZED VIEW hits        |
| 2   | SLA migration corrected — no `staff_profiles.full_name`, resolves names via `users.full_name`                                                    | VERIFIED | `sp.full_name` count = 0; `LEFT JOIN users u ON u.id = sp.user_id` count = 3 in `20260610000002_enhanced_sla_monitoring_corrected.sql`          |
| 3   | `event_details` view committed and `009_data_library.sql` marked SUPERSEDED                                                                      | VERIFIED | `20260610000003_create_event_details_view.sql` exists; `009_data_library.sql` opens with a 5-line SUPERSEDED comment block                      |
| 4   | `pending_role_approvals` migration omits auth.users trigger and user_sessions reference                                                          | VERIFIED | grep `apply_admin_role_approval\|user_sessions\|UPDATE auth\.users` in `000004` = 0; `"current_role"` is quoted (line 38)                       |
| 5   | `position_delegations` and `word_assistant_logs` tables committed                                                                                | VERIFIED | `20260610000005_create_delegation_and_word_assistant_tables.sql` exists; both table names present                                               |
| 6   | `escalations-report` edge function references only live columns                                                                                  | VERIFIED | `organizational_unit_id` = 0; `select('id, name')` = 0; `name_en` = 3; `full_name` = 4 (users.full_name)                                        |
| 7   | `frontend/src/types/database.types.ts` and `backend/src/types/database.types.ts` are byte-identical                                              | VERIFIED | `cmp -s` exits 0: BYTE_IDENTICAL                                                                                                                |
| 8   | Regenerated types contain `get_sla_dashboard_overview`, `event_details`, `pending_role_approvals`, `position_delegations`, `word_assistant_logs` | VERIFIED | grep counts: `get_sla_dashboard_overview`=1, `event_details`=154, `pending_role_approvals`=1, `position_delegations`=2, `word_assistant_logs`=1 |
| 9   | Dead doubled-path `backend/backend/src/types/database.types.ts` removed                                                                          | VERIFIED | `test ! -f` exits 0: DEAD_PATH_GONE                                                                                                             |
| 10  | Smoke test script exists, is substantive (references `database.types.ts`, exits non-zero on bad ref)                                             | VERIFIED | `scripts/check-edge-fn-schema-refs.mjs` is 211 lines; references `database.types.ts` 3 times; `process.exit` called twice                       |
| 11  | Smoke test exits 0 on real tree                                                                                                                  | VERIFIED | Live run: `edge-fn schema-ref check OK: 317 file(s) scanned, 2099 from/rpc literal(s) checked, 69 dynamic reference(s) skipped.`                |
| 12  | Smoke test exits non-zero on planted bad fixture                                                                                                 | VERIFIED | `tools/edge-fn-fixtures/bad-schema-ref/index.ts` causes exit code 1 naming both planted refs                                                    |
| 13  | CI wiring: check runs inside the existing `lint` job, no new top-level job                                                                       | VERIFIED | ci.yml line 44 defines `lint:` job; check-edge-fn steps are at lines 67 and 73 (inside lint)                                                    |
| 14  | Frontend build green after all commits                                                                                                           | VERIFIED | `pnpm --filter intake-frontend build` → `✓ built in 10.48s`                                                                                     |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact                                                                             | Expected                                                                           | Status   | Details                                                                |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `supabase/migrations/20260610000001_capture_unified_work_stack.sql`                  | Capture unified work stack (view + matview + 3 RPCs)                               | VERIFIED | 383 lines; 5 CREATE statements confirmed                               |
| `supabase/migrations/20260610000002_enhanced_sla_monitoring_corrected.sql`           | Corrected SLA migration with users-join name resolution                            | VERIFIED | 0 sp.full_name refs; 3 LEFT JOIN users occurrences                     |
| `supabase/migrations/20260610000003_create_event_details_view.sql`                   | event_details view migration                                                       | VERIFIED | File exists; `CREATE OR REPLACE VIEW public.event_details` present     |
| `supabase/migrations/009_data_library.sql`                                           | SUPERSEDED header marker                                                           | VERIFIED | Opens with 5-line SUPERSEDED comment; body unchanged                   |
| `supabase/migrations/20260610000004_create_pending_role_approvals.sql`               | pending_role_approvals table, no auth.users trigger, "current_role" quoted         | VERIFIED | Forbidden patterns = 0; `"current_role"` quoted at line 38             |
| `supabase/migrations/20260610000005_create_delegation_and_word_assistant_tables.sql` | position_delegations + word_assistant_logs                                         | VERIFIED | File exists; both CREATE TABLE names present                           |
| `supabase/functions/escalations-report/index.ts`                                     | References only live columns (name_en, users.full_name, no organizational_unit_id) | VERIFIED | organizational_unit_id=0; select('id, name')=0; name_en=3; full_name=4 |
| `frontend/src/types/database.types.ts`                                               | Regenerated, contains all newly-live objects                                       | VERIFIED | 40898 lines; all 5 new object names present                            |
| `backend/src/types/database.types.ts`                                                | Byte-identical to frontend copy                                                    | VERIFIED | cmp -s silent                                                          |
| `scripts/check-edge-fn-schema-refs.mjs`                                              | Substantive smoke test script                                                      | VERIFIED | 211 lines; references database.types.ts; exits non-zero on bad ref     |
| `scripts/edge-fn-schema-refs-allowlist.json`                                         | All 66 entries have reason fields                                                  | VERIFIED | Python parse: 66 entries, 0 missing reason                             |
| `tools/edge-fn-fixtures/bad-schema-ref/index.ts`                                     | Planted failure fixture                                                            | VERIFIED | File exists; script produces exit 1 naming both refs                   |
| `package.json`                                                                       | `check:edge-fn-schema` script present                                              | VERIFIED | grep count = 1                                                         |
| `.github/workflows/ci.yml`                                                           | check-edge-fn-schema step inside lint job                                          | VERIFIED | Step at lines 67/73 inside the `lint:` job defined at line 44          |

---

### Key Link Verification

| From                                                   | To                                                                   | Via                                                                                   | Status | Details                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `20260610000001_capture_unified_work_stack.sql`        | live staging catalog                                                 | `pg_get_viewdef`/`pg_get_functiondef` verbatim dump; `get_unified_work_items` present | WIRED  | Migration captures live definitions; applied idempotently; probe confirmed 3 RPCs + 2 views + 1 matview |
| `20260610000002_enhanced_sla_monitoring_corrected.sql` | `public.users (full_name, name_ar)`                                  | `LEFT JOIN users u ON u.id = sp.user_id` replacing `sp.full_name`                     | WIRED  | Pattern present 3 times; `u.full_name` pattern confirmed                                                |
| `supabase/functions/escalations-report/index.ts`       | `public.organizational_units / public.users / public.staff_profiles` | corrected column lists; `name_en` replacing `name`; `users.full_name`                 | WIRED  | `name_en`=3, `full_name`=4 in edge fn; forbidden columns = 0                                            |
| `frontend/src/types/database.types.ts`                 | live staging catalog                                                 | MCP `generate_typescript_types` (project zkrcjzdemdmwhearhfgg)                        | WIRED  | Deterministic two-run MD5 match; byte-identical to backend copy; all 11 newly-live objects present      |
| `.github/workflows/ci.yml`                             | `scripts/check-edge-fn-schema-refs.mjs`                              | step inside existing lint job                                                         | WIRED  | ci.yml references script at line 67 inside `lint:` job                                                  |
| `scripts/check-edge-fn-schema-refs.mjs`                | `frontend/src/types/database.types.ts`                               | brace-depth block-slice membership check                                              | WIRED  | Script references database.types.ts 3 times; live exit 0, bad-fixture exit 1 confirmed                  |

---

### Behavioral Spot-Checks

| Behavior                        | Command                                                                            | Result                                                                 | Status |
| ------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| Smoke test passes on real tree  | `node scripts/check-edge-fn-schema-refs.mjs`                                       | `OK: 317 file(s) scanned, 2099 literal(s) checked, 69 dynamic skipped` | PASS   |
| Smoke test fails on bad fixture | `node scripts/check-edge-fn-schema-refs.mjs tools/edge-fn-fixtures/bad-schema-ref` | exit 1, names both planted refs                                        | PASS   |
| Frontend build green            | `pnpm --filter intake-frontend build`                                              | `✓ built in 10.48s`                                                    | PASS   |

---

### Requirements Coverage

| Requirement                 | Source Plan | Description                                                                     | Status    | Evidence                                                                   |
| --------------------------- | ----------- | ------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| P1 (type regeneration)      | 60-05       | Generated types match live staging byte-identically across frontend+backend     | SATISFIED | byte-identical confirmed; all newly-live objects present in types          |
| P1 (unified work stack)     | 60-01       | `unified_work_items` + RPCs captured as forward migration                       | SATISFIED | migration 000001 committed and applied                                     |
| P1 (SLA RPCs + column fix)  | 60-02       | 4 SLA dashboard RPCs live; `staff_profiles.full_name` absent-column fixed       | SATISFIED | migration 000002 committed; `sp.full_name`=0                               |
| P1 (escalations-report fix) | 60-02       | Edge fn references only live columns                                            | SATISFIED | `organizational_unit_id`=0; `name_en`=3                                    |
| P1 (event_details view)     | 60-03       | `event_details` view committed and applied                                      | SATISFIED | migration 000003 committed                                                 |
| P1 (data-library #1)        | 60-03       | Dead `009_data_library.sql` superseded                                          | SATISFIED | SUPERSEDED header present                                                  |
| P1 (missing tables)         | 60-04       | `pending_role_approvals`, `position_delegations`, `word_assistant_logs` created | SATISFIED | migrations 000004/000005 committed; `current_role` quoted; no auth trigger |
| P1 (CI smoke test)          | 60-06       | Every edge-fn `.from`/`.rpc` reference resolves to generated types or allowlist | SATISFIED | script exits 0 real-tree / exits 1 bad-fixture; wired into lint job        |

---

### Anti-Patterns Found

| File       | Pattern | Severity | Impact |
| ---------- | ------- | -------- | ------ |
| None found | —       | —        | —      |

Debt-marker scan on phase-modified files found no `TBD`, `FIXME`, or `XXX` markers in migration files, edge function, or scripts. (The `SUPERSEDED` marker in `009_data_library.sql` is an intentional documentation comment, not a debt marker.)

---

### Commit History

All 6 plans have atomic per-task commits in git log:

- `60-01`: `d645c767` (capture unified work stack migration)
- `60-02`: `11bd0de8`, `1cd7bb82`, `997eb76f` (SLA migration + RPC fixes + escalations-report)
- `60-03`: `ee9c87db`, `6e1afedd` (event_details view + 009 supersede)
- `60-04`: `61a6b706`, `39d319c9` (pending_role_approvals, position_delegations + word_assistant_logs)
- `60-05`: `c4440b67`, `4440d118` (types regen + dead doubled-path removal; pre-existing type error fix)
- `60-06`: `bfdd1820`, `d86c3f58`, `e77d4a67` (smoke test + fixture + CI wiring)

---

### Human Verification Required

None. All acceptance criteria are verifiable from the codebase and live tool execution. The live-DB probes (MCP apply, function smoke-calls) are documented verbatim in each plan's SUMMARY.md and are treated as recorded evidence.

---

### Gaps Summary

No gaps. All 14 truths verified, all required artifacts exist and are substantive, all key links are wired, build is green, smoke test passes real tree and fails bad fixture, CI wiring confirmed inside the existing lint job.

---

_Verified: 2026-06-10_
_Verifier: Claude (gsd-verifier)_
