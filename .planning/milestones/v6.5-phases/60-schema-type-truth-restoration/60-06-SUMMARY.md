---
phase: 60-schema-type-truth-restoration
plan: 06
subsystem: testing
tags: [ci, static-analysis, edge-functions, supabase, database-types, smoke-test]

requires:
  - phase: 60-schema-type-truth-restoration (plan 05)
    provides: regenerated frontend/src/types/database.types.ts (byte-identical with backend), source-of-truth Tables/Views/Functions keys the smoke test asserts against
provides:
  - Dependency-free Node smoke test asserting every edge-fn .from('X')/.rpc('Y') literal resolves to a Tables/Views/Functions key in the generated types
  - Documented allowlist (24 tables/views + 42 functions) of cross-schema + genuinely-absent edge-fn references, each with a reason + backlog ref
  - Planted-failure fixture (isolated, outside supabase/functions) + bash-negation CI proof
  - CI wiring inside the existing lint job (no new required status context on protected main)
affects: [edge-functions, schema-drift, CI, escalated-backlog]

tech-stack:
  added: []
  patterns:
    - 'Static-analysis smoke test (Node ESM, node: builtins only) mirroring frontend/scripts/assert-size-limit-matches.mjs: fs-walk + regex + fail-collect + process.exit(1)'
    - 'Block-slice membership: brace-depth walk of public.Tables/Views/Functions blocks, collect 6-space-indented first-level keys'
    - 'Positive-failure CI idiom: isolated bad fixture + bash `! node ...` negation (mirrors design-token-check / i18next-factory-check)'

key-files:
  created:
    - scripts/check-edge-fn-schema-refs.mjs
    - scripts/edge-fn-schema-refs-allowlist.json
    - tools/edge-fn-fixtures/bad-schema-ref/index.ts
  modified:
    - package.json
    - .github/workflows/ci.yml

key-decisions:
  - 'Allowlisted 66 names (not 0) because live-DB verification proved all are genuinely absent from the public schema — cross-schema (auth.refresh_tokens, events.* RPCs) or pre-existing dead/aspirational/backlog edge-fn references — NOT type-file drift 60-05 should have fixed'
  - "Excluded supabase.storage.from('bucket') calls in-code (whitespace-normalized .storage lookback) rather than allowlisting bucket names — they are bucket handles, not table queries"
  - "Folded the check into the existing lint job's steps (no new top-level CI job) so it rides the existing required Lint context without adding a branch-protection context"

patterns-established:
  - 'Edge-fn schema-reference guard: any new .from/.rpc literal must resolve to the generated types or carry a documented allowlist entry'

requirements-completed: [P1]

duration: 38 min
completed: 2026-06-10
---

# Phase 60 Plan 06: Edge-fn schema-reference CI smoke test Summary

**Dependency-free Node smoke test that asserts every edge-function `.from('X')` / `.rpc('Y')` literal resolves to a Tables/Views/Functions key in the generated `database.types.ts`, with a live-DB-verified allowlist of 66 cross-schema/absent references, wired into the existing CI lint job and proven against a planted bad fixture.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-06-10
- **Completed:** 2026-06-10
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- Built `scripts/check-edge-fn-schema-refs.mjs` (Node ESM, `node:` builtins only): walks `supabase/functions/**/*.ts`, regex-extracts `.from`/`.rpc` literals, asserts membership in the generated types via brace-depth block-slice, excludes Storage `.from()` bucket handles, counts (never fails on) dynamic references.
- Verified all 66 flagged references against the live staging DB (`zkrcjzdemdmwhearhfgg`, 2026-06-10): none exist in the public schema. Documented each in `scripts/edge-fn-schema-refs-allowlist.json` with a reason + backlog ref, distinguishing cross-schema permanent exempts (`auth.refresh_tokens`, `events.*` event-sourcing RPCs, `check_circular_delegation` signature mismatch) from genuinely-absent backlog references.
- Proved the guard: planted fixture exits 1 naming both planted refs; real tree exits 0 (317 files scanned, 2099 literals checked, 69 dynamic skipped).
- Wired into CI as two steps inside the existing `lint` job — no new top-level job, no new branch-protection required context.

## Task Commits

1. **Task 1: Smoke-test script + allowlist** - `bfdd1820` (feat)
2. **Task 2: Planted-failure fixture** - `d86c3f58` (test)
3. **Task 3: Wire into lint job** - `e77d4a67` (ci)

## Files Created/Modified

- `scripts/check-edge-fn-schema-refs.mjs` - Edge-fn schema-reference smoke test (regex parse + types-membership assertion + Storage-bucket exclusion).
- `scripts/edge-fn-schema-refs-allowlist.json` - 24 tables/views + 42 functions, each with a documented reason + backlog ref.
- `tools/edge-fn-fixtures/bad-schema-ref/index.ts` - Isolated positive-failure fixture (`.rpc('nonexistent_fn_xyz')` + `.from('nonexistent_table_xyz')`).
- `package.json` - Added `"check:edge-fn-schema": "node scripts/check-edge-fn-schema-refs.mjs"`.
- `.github/workflows/ci.yml` - Two steps inside the `lint` job: run the check, plus a bash-negation positive-failure assertion against the fixture.

## Verification Results

### Planted-failure proof (fixture, exit 1)

```
edge-fn schema-ref check FAILED: 2 unknown reference(s) not present in frontend/src/types/database.types.ts (and not allowlisted):
  tools/edge-fn-fixtures/bad-schema-ref/index.ts: .rpc('nonexistent_fn_xyz') — unknown function
  tools/edge-fn-fixtures/bad-schema-ref/index.ts: .from('nonexistent_table_xyz') — unknown table/view
fixture exit=1
```

### Real-tree proof (exit 0)

```
edge-fn schema-ref check OK: 317 file(s) scanned, 2099 from/rpc literal(s) checked, 69 dynamic reference(s) skipped.
real-tree exit=0
```

### CI nesting / guardrails

- `pnpm run check:edge-fn-schema` exits 0 locally.
- Two new steps nested at the step level inside the `lint` job; top-level job list unchanged (no new required context).
- `pnpm --filter intake-frontend build` green after every commit.
- `frontend/src/routeTree.gen.ts` left untouched (pre-existing drift); STATE.md / ROADMAP.md not modified.

## Final Allowlist Contents (66 entries, all with reasons)

**Tables/Views (24)** — `refresh_tokens` is cross-schema (`auth.*`, permanent exempt); the other 23 are absent-from-all-schemas backlog references: `access_certifications`, `access_review_summary`, `access_reviews`, `activity_log`, `ai_extraction_jobs`, `assignment_history`, `audit_statistics`, `biometric_credentials`, `cd_contact_relationships`, `cd_contacts`, `cd_document_sources`, `cd_interaction_notes`, `cd_organizations`, `cd_tags`, `delegations`, `device_tokens`, `dossier_collaborators`, `dossier_timeline`, `entity_tags`, `external_calendar_events`, `ticket_attachments`, `user_profiles`, `user_sessions`.

**Functions (42)** — 7 cross-schema `events.*` (permanent exempt): `append_event`, `create_snapshot`, `get_aggregate_events`, `get_aggregate_history`, `get_correlated_events`, `get_state_at_time`, `rebuild_aggregate_state`; `check_circular_delegation` (exists in public but signature mismatch); the remaining 34 are absent-from-all-schemas backlog references: `approve_classification_change`, `array_append_unique`, `calculate_event_priority`, `change_document_classification`, `check_pgvector_health`, `cron_schedule`, `cron_unschedule`, `execute_advanced_search`, `extend_content_expiration`, `find_available_slots`, `find_similar_tickets_vector`, `get_accessible_documents`, `get_column`, `get_delegation_chain`, `get_document_with_redaction`, `get_expiring_content`, `get_model_performance_metrics`, `get_or_create_onboarding_progress`, `get_unified_calendar_events`, `increment`, `increment_attempts`, `increment_edit_count`, `increment_webhook_failure`, `mark_content_reviewed`, `match_intelligence_reports`, `queue_email_notification`, `queue_workflow_execution`, `record_prediction_feedback`, `refresh_tag_analytics`, `register_device_token`, `set_content_expiration`, `trigger_matching_workflows`, `update_content_freshness_statuses`, `update_workflow_execution_statuses`.

## Decisions Made

- **66-entry allowlist instead of empty:** The wave context anticipated "a few" absent names. Live-DB verification (`information_schema.tables` + `pg_proc`) revealed 66. Critically, _zero_ are public-schema objects missing from the regenerated types (which would be real drift) — they are cross-schema objects or edge functions referencing never-shipped/dead/aspirational objects. Allowlisting with reasons is the plan-sanctioned disposition; escalating-as-drift would have been wrong.
- **Storage buckets excluded in-code, not allowlisted:** `supabase.storage.from('private')` is a bucket handle. A whitespace-normalized `.storage` lookback skips these so `private` is never flagged.

## Deviations from Plan

None - plan executed exactly as written. (The allowlist ended with 66 documented entries rather than empty; the plan explicitly provides for this path — "if it is a dynamic/alias/known-out-of-scope name → add it to the allowlist WITH a documented reason.")

## Issues Encountered

- **148 raw flagged references on first run** (66 distinct names). Resolved by (1) fixing a parser false-positive — `storage.from()` bucket handles were being schema-checked; (2) live-DB-verifying every remaining name to confirm none are public-schema drift before documenting them in the allowlist. The `.storage` accessor frequently sits on the line above `.from()`, so the lookback window normalizes whitespace.

## Next Phase Readiness

- The drift class (edge fn references an object absent from generated types) is now gated in CI on every PR via the existing required Lint context.
- Follow-up for the backlog (not this phase): the 66 allowlisted references represent edge functions calling never-shipped or signature-mismatched objects — candidates for dead-code removal or table/RPC creation. Tracked in `reports/escalated-backlog-master-2026-06-10.md`.

---

_Phase: 60-schema-type-truth-restoration_
_Completed: 2026-06-10_
