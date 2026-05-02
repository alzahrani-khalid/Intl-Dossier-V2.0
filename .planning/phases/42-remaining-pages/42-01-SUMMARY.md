---
phase: 42-remaining-pages
plan: 01
subsystem: api
tags:
  - phase-42
  - edge-function
  - tanstack-query
  - after-actions
  - rls
  - wave-0

requires:
  - phase: 42-remaining-pages
    provides: "Phase 42 plan + research + UI spec (locked decisions D-01..D-04, R-04)"
provides:
  - "Supabase Edge Function `after-actions-list-all` (RLS-gated, cross-dossier list with engagement + dossier joins)"
  - "TanStack Query hook `useAfterActionsAll(options?)` with cache key `['after-actions','all',options]`"
  - "Vitest contract suite pinning hook invoke target, cache key, joined record shape, and error surfacing"
affects:
  - "42-06 (After-actions page reskin) — consumes useAfterActionsAll"
  - "42-11 (Wave 2 visual + a11y gates) — exercises the new function via the rendered page"

tech-stack:
  added: []
  patterns:
    - "Edge Function: !inner joins with select to satisfy cross-dossier list shape without exposing dossier_id query param"
    - "Hook: distinct cache namespace ['after-actions','all', ...] separate from per-dossier ['after-actions', dossierId, ...]"
    - "Hook test: shared QueryClient with staleTime: Infinity to isolate cache-key contract from refetch-on-mount"

key-files:
  created:
    - supabase/functions/after-actions-list-all/index.ts
    - frontend/src/hooks/__tests__/useAfterActionsAll.test.ts
  modified:
    - frontend/src/hooks/useAfterAction.ts

key-decisions:
  - "Edge Function rejects any caller-supplied dossier_id filter — RLS pass-through is the only access control (T-AA-1 / T-T-1 mitigations)"
  - "Default publication_status='published'; status allowlist ['draft','published','edit_requested','edit_approved'] (R-04 / D-02)"
  - "Hook cache key ['after-actions','all', options] kept distinct from per-dossier list cache to avoid invalidation collisions (CONTEXT §specifics)"
  - "AfterActionRecordWithJoins introduced as an extension of AfterActionRecord rather than mutating the existing interface — avoids regressing per-dossier hook callers"

patterns-established:
  - "Cross-dossier RLS-gated list pattern: Deno serve + supabase-js@2 client with Authorization pass-through + `!inner` joins; no dossier filter accepted"
  - "Vitest dedup proof: shared QueryClient + staleTime: Infinity verifies cache-key contract without coupling to default refetch policy"

requirements-completed:
  - PAGE-02

duration: ~30min
completed: 2026-05-02
---

# Phase 42 Plan 01: After-actions cross-dossier infra Summary

**RLS-gated `after-actions-list-all` Edge Function + `useAfterActionsAll` TanStack Query hook with engagement + dossier joins, ready for Wave 1 PAGE-02 reskin.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-02T02:00Z (plan-start)
- **Completed:** 2026-05-02T02:28Z
- **Tasks:** 2 of 3 executed; Task 3 deferred (rationale below)
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Authored `supabase/functions/after-actions-list-all/index.ts` (105 LOC) — mirrors per-dossier analog minus the `dossier_id` requirement, adds `engagement:engagements!inner (...)` and `dossier:dossiers!inner (...)` joins, defaults `publication_status='published'`, validates allowlist and limit, passes the caller's JWT through to the Supabase client so RLS gates rows automatically.
- Appended `useAfterActionsAll(options?)` to `frontend/src/hooks/useAfterAction.ts` — invokes `after-actions-list-all`, returns `{ data: AfterActionRecordWithJoins[]; total: number }`, keyed `['after-actions','all',options]`. Introduced `AfterActionRecordWithJoins` interface so consumers see the engagement + dossier shape without the per-dossier hook losing its narrower type.
- Vitest suite `useAfterActionsAll.test.ts` (5/5 PASS) pins: invoke target, joined record shape, options pass-through, error surfacing, cache-key dedup.

## Task Commits

1. **Task 1: Edge Function** — `29ebec22` (feat) — `supabase/functions/after-actions-list-all/index.ts`
2. **Task 2 (RED): Failing hook tests** — `b607d68f` (test)
3. **Task 2 (GREEN): Hook implementation** — `6612ab04` (feat)
4. **Task 3: Staging deployment** — DEFERRED (see below)

## Files Created/Modified

- `supabase/functions/after-actions-list-all/index.ts` — NEW. Deno `serve` handler. Returns `{ data, total, limit, offset }` with HTTP 200 on success; 400 on validation errors; 500 on supabase client errors.
- `frontend/src/hooks/useAfterAction.ts` — extended. Added `import type { UseQueryResult }`, the `AfterActionRecordWithJoins` interface, and the `useAfterActionsAll` exported function. Existing `useAfterAction`, `useAfterActions`, `useCreateAfterAction`, `useUpdateAfterAction`, and `useAfterActionVersions` are untouched.
- `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts` — NEW. 5-test contract suite using `@testing-library/react` + a vi-mocked `@/lib/supabase`.

## Decisions Made

- **No `dossier_id` filter on the new Edge Function** — even an optional one. Accepting a caller-supplied dossier id would let an attacker probe RLS by crafting IDs (T-AA-1 / T-T-1). RLS on `after_action_records` plus the `!inner` joins to `engagements`/`dossiers` already gates rows by `dossier_acl`, so no client filter is needed.
- **Extension type, not type mutation** — `AfterActionRecordWithJoins extends AfterActionRecord` so the per-dossier hook keeps its narrower contract and the new joined fields are only exposed on the cross-dossier path.
- **Test refactor to staleTime: Infinity** — the dedup test originally inherited the project's `gcTime: 0, staleTime: 0` defaults and saw a refetch on the second observer mounting. Switching the shared client to `staleTime: Infinity` isolates the cache-key contract from the default refetch policy without changing the production hook.

## Deviations from Plan

### Deferred (not auto-fixed)

**1. Task 3 — staging deployment via Supabase MCP**

- **Reason for deferral:** The Supabase MCP `deploy_edge_function` tool is not exposed in this executor session's tool surface (only `heroui-react`, `pencil`, and `context7` MCP servers are mounted). The plan explicitly authorizes deferral in this case: "If the MCP deploy tool is not available in the current session, document the deferral in the SUMMARY: 'Deployment deferred to manual `supabase functions deploy after-actions-list-all` step — function source committed; ops task to deploy.'"
- **Mitigation:** Edge Function source is committed (29ebec22). Wave 1 plan 06 (After-actions page reskin) cannot exercise `useAfterActionsAll` end-to-end against staging until the function is deployed; either the orchestrator or a follow-up ops task should run `supabase functions deploy after-actions-list-all --project-ref zkrcjzdemdmwhearhfgg`, or invoke the Supabase MCP `deploy_edge_function` from a session that has it mounted.
- **Files modified:** none.

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Installed monorepo dependencies**

- **Found during:** Task 2 RED (vitest invocation)
- **Issue:** Worktree had no `node_modules`; `pnpm test` exited with `vitest: command not found`.
- **Fix:** Ran `pnpm install` at the repo root to populate the workspace.
- **Files modified:** none (installed under `node_modules/`, gitignored).
- **Verification:** `frontend/node_modules/.bin/vitest` present after install; tests subsequently ran.
- **Committed in:** n/a (no source files touched).

**2. [Rule 1 — Bug in test] Replaced `--reporter=basic` with vitest default reporter**

- **Found during:** Task 2 RED (vitest startup)
- **Issue:** Vitest 4.x rejects `basic` as an invalid custom reporter module ID; the plan's verify command `pnpm --filter frontend test --run --reporter=verbose useAfterActionsAll` would have hit the same wall on `verbose` if the registered reporters changed across versions.
- **Fix:** Drop the `--reporter=*` flag; rely on vitest's default reporter for both RED and GREEN runs. Test names are still echoed clearly.
- **Files modified:** none (command-line only).
- **Verification:** RED produced 5 failures with clear `useAfterActionsAll is not a function` messages; GREEN produced 5 passes.
- **Committed in:** n/a (CLI flag).

**3. [Rule 1 — Bug in test fixture] Bumped shared QueryClient `staleTime` for the dedup test**

- **Found during:** Task 2 GREEN (5th test failed with "called 2 times, expected 1")
- **Issue:** The dedup-by-cache-key assertion was being defeated by the project-default `staleTime: 0`: when the second `useAfterActionsAll(...)` observer mounted, react-query treated the cached entry as stale and triggered a background refetch, calling `supabase.functions.invoke` twice.
- **Fix:** In the dedup test only, override `defaultOptions: { queries: { retry: false, staleTime: Infinity } }` on the shared client. This isolates the cache-key contract from the default refetch policy without changing the production hook.
- **Files modified:** `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts`
- **Verification:** 5/5 vitest pass.
- **Committed in:** `6612ab04` (GREEN commit).

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 test-bug) + 1 formal deferral (Task 3 deployment).
**Impact on plan:** All auto-fixes were necessary to surface the contract — none changed the production hook. Task 3 deferral is plan-authorized; Wave 1 plan 06 informed.

## Issues Encountered

- **TS6133 on `useAfterActions` (line 201)** — pre-existing dead-code warning. The original `useAfterActions` was declared without `export` and never used internally; my insertions shifted its line number from 181 to 201 but did not introduce the warning. Verified by `git stash` + tsc on the parent commit. Out of scope per Karpathy §3 (surgical changes — clean up only your own mess).

## User Setup Required

**Edge Function deployment to staging is a one-time ops step.** Either:

1. Run from a session with the Supabase MCP mounted: `mcp__supabase__deploy_edge_function` with `project_id: zkrcjzdemdmwhearhfgg`, `name: after-actions-list-all`, files `[index.ts, _shared/cors.ts]`.
2. Or run the CLI manually: `supabase functions deploy after-actions-list-all --project-ref zkrcjzdemdmwhearhfgg`.

Verify via `supabase functions list --project-ref zkrcjzdemdmwhearhfgg` that the function appears with status ACTIVE.

## Next Phase Readiness

- **Wave 1 plan 06 (After-actions page reskin)** can `import { useAfterActionsAll, AfterActionRecordWithJoins } from '@/hooks/useAfterAction'` immediately. End-to-end behavior against staging requires the deployment step above.
- **Wave 2 (gates)** — visual baselines and Playwright E2E will exercise the new function once Wave 1 page renders against deployed staging.

## TDD Gate Compliance

This plan ran Task 2 under TDD (`tdd="true"`):

- RED gate: `b607d68f` — `test(42-01): add failing tests for useAfterActionsAll hook (RED)` — 5/5 fail with `useAfterActionsAll is not a function`.
- GREEN gate: `6612ab04` — `feat(42-01): implement useAfterActionsAll cross-dossier hook (GREEN)` — 5/5 pass.
- REFACTOR gate: not exercised; implementation is minimal and matches the contract directly.

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `supabase/functions/after-actions-list-all/index.ts` — FOUND
- `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts` — FOUND
- `frontend/src/hooks/useAfterAction.ts` — present, contains `useAfterActionsAll` export
- Commit `29ebec22` (Task 1) — FOUND
- Commit `b607d68f` (Task 2 RED) — FOUND
- Commit `6612ab04` (Task 2 GREEN) — FOUND

---

*Phase: 42-remaining-pages*
*Plan: 01*
*Completed: 2026-05-02*
