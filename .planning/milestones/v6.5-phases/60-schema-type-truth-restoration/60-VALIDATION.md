---
phase: 60
slug: schema-type-truth-restoration
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-10
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **Framework**          | vitest (frontend unit), live staging SQL probes via Supabase MCP, node script for smoke test |
| **Config file**        | `frontend/vitest.config.ts`                                                                  |
| **Quick run command**  | `pnpm --filter intake-frontend build` (build = the canonical post-commit gate per handoff)   |
| **Full suite command** | `pnpm --filter intake-frontend exec tsc --noEmit && pnpm --filter intake-frontend build`     |
| **Estimated runtime**  | ~10-40 seconds                                                                               |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter intake-frontend build` (pre-commit hook does NOT block on failure — direct run is mandatory)
- **After every plan wave:** Run full suite command + staging SQL existence probes for objects touched in the wave
- **Before `/gsd:verify-work`:** Full suite green + every P1 object verified live + in repo + in types
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan  | Wave | Requirement                      | Threat Ref            | Secure Behavior                                                                 | Test Type             | Automated Command                                                                                                                                                             | File Exists | Status     |
| ------- | ----- | ---- | -------------------------------- | --------------------- | ------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 60-01-1 | 60-01 | 1    | Backlog P1 (my-work #3)          | T-60-01-T             | Live DDL captured verbatim — no hand-written definitions                        | file-grep             | `test -s ...0001_capture_unified_work_stack.sql && test "$(grep -vE '^\s*--' ... \| grep -cE 'CREATE OR REPLACE (VIEW\|FUNCTION) public\.\|CREATE MATERIALIZED VIEW')" -ge 6` | ✅          | ⬜ pending |
| 60-01-2 | 60-01 | 1    | Backlog P1 (my-work #3)          | T-60-01-E, T-60-01-SC | SECURITY DEFINER bodies keep `SET search_path`; authenticated-only grants       | file-grep + sql-probe | `grep -vE '^\s*--' ...0001_*.sql \| grep -cE 'CREATE OR REPLACE FUNCTION public\.get_(unified_work_items\|user_work_summary\|user_productivity_metrics)'` = 3                 | ✅          | ⬜ pending |
| 60-02-1 | 60-02 | 1    | Backlog P1 (sla #2, #4)          | T-60-02-T, T-60-02-E  | RPCs reference real `users` columns; no privilege widening                      | file-grep + sql-probe | `test "$(grep -c 'sp\.full_name' ...0002_*.sql)" -eq 0 && test "$(grep -c 'LEFT JOIN users u ON u.id = sp.user_id' ...0002_*.sql)" -eq 3 && echo PASS`                        | ✅          | ⬜ pending |
| 60-02-2 | 60-02 | 1    | Backlog P1 (tq #5)               | T-60-02-I             | Edge fn queries only real columns; redeployed                                   | file-grep             | `test "$(grep -c 'organizational_unit_id' supabase/functions/escalations-report/index.ts)" -eq 0 && test "$(grep -c "select('id, name')" ...)" -eq 0 && echo PASS`            | ✅          | ⬜ pending |
| 60-03-1 | 60-03 | 1    | Backlog P1 (events #4)           | T-60-03-I             | `event_details` granted authenticated-only (no anon)                            | file-grep + sql-probe | `grep -c "CREATE OR REPLACE VIEW public.event_details" ...0003_create_event_details_view.sql` = 1                                                                             | ✅          | ⬜ pending |
| 60-03-2 | 60-03 | 1    | Backlog P1 (data-library #1)     | T-60-03-R             | Dead 009 variant marked superseded, not deleted                                 | file-grep             | `grep -c "SUPERSEDED" supabase/migrations/009_data_library.sql` = 1                                                                                                           | ✅          | ⬜ pending |
| 60-04-1 | 60-04 | 1    | Backlog P1 (approvals #6)        | T-60-04-E             | NO `apply_admin_role_approval` trigger (auth.users mutation omitted → Phase 61) | file-grep             | `test "$(grep -c 'apply_admin_role_approval' ...0004_*.sql)" -eq 0 && echo PASS`                                                                                              | ✅          | ⬜ pending |
| 60-04-2 | 60-04 | 1    | Backlog P1 (approvals #6, wa #4) | T-60-04-I, T-60-04-SC | Owner-scoped RLS on both new tables                                             | file-grep + sql-probe | `grep -c "CREATE TABLE IF NOT EXISTS public.position_delegations" ...0005_*.sql` = 1                                                                                          | ✅          | ⬜ pending |
| 60-05-1 | 60-05 | 2    | Backlog P1 (all)                 | T-60-05-T, T-60-05-R  | Types regenerated AFTER all wave-1 mutations; byte-identical copies             | cmp + grep            | `cmp -s frontend/src/types/database.types.ts backend/src/types/database.types.ts && grep -c "get_sla_dashboard_overview" frontend/src/types/database.types.ts`                | ✅          | ⬜ pending |
| 60-05-2 | 60-05 | 2    | Backlog P1 (all)                 | T-60-05-I             | Type fallout fixed surgically; both workspaces compile                          | build                 | `pnpm --filter intake-frontend type-check && pnpm --filter intake-backend type-check`                                                                                         | ✅          | ⬜ pending |
| 60-06-1 | 60-06 | 3    | Backlog P1 (smoke test)          | T-60-06-S, T-60-06-SC | Dependency-free script; no secret exposure, no exec of untrusted input          | script                | `node scripts/check-edge-fn-schema-refs.mjs; echo "exit=$?"` = 0                                                                                                              | ✅          | ⬜ pending |
| 60-06-2 | 60-06 | 3    | Backlog P1 (smoke test)          | T-60-06-D             | Positive-failure proof: planted bad ref exits non-zero                          | script                | planted-bad-ref run exits 1, then `node scripts/check-edge-fn-schema-refs.mjs` real-tree exit 0                                                                               | ✅          | ⬜ pending |
| 60-06-3 | 60-06 | 3    | Backlog P1 (smoke test)          | T-60-06-T             | CI wiring in existing lint job; fails build on unknown name                     | script + CI           | `pnpm run check:edge-fn-schema; echo "exit=$?"` = 0                                                                                                                           | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (build + tsc + MCP SQL probes; smoke-test script is itself a phase deliverable).

---

## Manual-Only Verifications

| Behavior                                            | Requirement            | Why Manual                      | Test Instructions                                                               |
| --------------------------------------------------- | ---------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| EventsPage renders against new `event_details` view | Backlog P1 (events #4) | Needs running dev server + auth | Login on :5175, open /events, confirm list loads without 400/404 in network tab |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (13/13 — 60-01 Task 1 now writes the raw capture file and verifies it with a file-grep gate; no MISSING remains)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-10 (gsd-plan-checker round 1: 1 blocker + 2 warnings — all fixed in revision; re-verified round 2)
