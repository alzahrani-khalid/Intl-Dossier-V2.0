---
phase: 69-signals
plan: 02
subsystem: frontend-data-hooks
tags:
  [
    tanstack-query,
    supabase,
    rls,
    clearance,
    rpc,
    edge-function,
    escalation,
    typescript,
    intelligence-signals,
  ]

# Dependency graph
requires:
  - phase: 69-signals (plan 01)
    provides: intelligence_event extension + clearance RLS (LIVE) + read_signals INVOKER RPC + signal.types.ts (Signal, SignalFilters, CreateSignalInput, UpdateSignalStatusInput, EscalateSignalInput, signalKeys)
  - phase: 54-intelligence-engine-groundwork
    provides: intelligence_event_dossiers polymorphic junction (parent-derived tenancy, NO organization_id column)
  - phase: shared-infra
    provides: tasks-create edge fn (caller JWT, assignee_id required), work-item-dossiers edge fn, tenant_isolation.rls_insert_policy
provides:
  - 'useSignals — TanStack Query wrapper over read_signals SECURITY INVOKER RPC (all 4 params; 60s staleTime; Signal[])'
  - 'useCreateSignal — intelligence_event INSERT + intelligence_event_dossiers junction under caller JWT; source_type human_entered default + ai_generated/aiConfidence D-13 path on the same insert/RLS'
  - 'useUpdateSignalStatus — direct status patch (acknowledge/dismiss/restore/escalated) under caller JWT'
  - 'useSignalEscalate — 3-step orchestrator (tasks-create → work-item-dossiers → intelligence_event UPDATE)'
  - 'domains/signals barrel re-exports all three hooks + types'
affects:
  [69-03, 69-04, signals-queue, signal-capture-form, signal-escalate-dialog, dossier-signals-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'TanStack Query useQuery over a SECURITY INVOKER RPC via supabase.rpc() (untyped client → cast data as Signal[])'
    - 'Caller-JWT direct supabase.from() mutations (no service-role client) — RLS is the authorization layer'
    - 'organization_id for tenant-scoped INSERT resolved from users.default_organization_id (the tenant_isolation membership)'
    - 'Parent-derived junction insert: intelligence_event_dossiers rows carry NO organization_id (D-13)'
    - "Multi-step edge-fn escalation: work_item_type = 'task' as const (compile-time RLS-pitfall guard); Step 2 warn-only, Step 3 throws"

key-files:
  created:
    - frontend/src/domains/signals/hooks/useSignals.ts
    - frontend/src/domains/signals/hooks/useSignalMutations.ts
    - frontend/src/domains/signals/hooks/useSignalEscalate.ts
  modified:
    - frontend/src/domains/signals/index.ts

key-decisions:
  - 'D-04: dismiss is reversible — useUpdateSignalStatus restores status (dismissed→acknowledged); nothing hard-deleted'
  - 'D-11: escalation creates a task (workflow_stage=todo) with bidirectional signal↔task link + dossier-link copy via work-item-dossiers'
  - 'D-12: signal status→escalated after escalation (Step 3 of useSignalEscalate; throws on failure — the link is the contract)'
  - 'D-13: ai_generated write path is the SAME insert path + SAME clearance RLS (sourceType param toggles source_type + ai_confidence; no separate branch)'
  - 'D-14: useSignals wraps read_signals SECURITY INVOKER RPC (clearance gate at DB; indistinguishable-empty on denial)'
  - 'Exec-time: organization_id resolved from users.default_organization_id (plan/RESEARCH said userOrgId without naming the source; intelligence_event.organization_id is NOT NULL + INSERT RLS requires tenant membership)'

patterns-established:
  - "work_item_type = 'task' as const before any work-item-dossiers call — never a variable (silent INSERT-RLS failure pitfall)"
  - 'Resolve {userId, organizationId} once per create via supabase.auth.getUser() + users.default_organization_id lookup'

requirements-completed: [SIGNAL-01, SIGNAL-02, SIGNAL-05, SIGNAL-06]

# Metrics
duration: 5min
completed: 2026-06-14
---

# Phase 69 Plan 02: Data Hooks — read, create, triage, escalate Summary

**Four TanStack Query hooks complete the signals data API: useSignals (read_signals INVOKER RPC), useCreateSignal + useUpdateSignalStatus (intelligence_event CRUD under caller JWT, incl. the D-13 ai_generated write path on the same insert/RLS), and useSignalEscalate (3-step tasks-create → work-item-dossiers → intelligence_event escalate orchestrator). All under the caller's JWT — no service-role client.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-14T15:53:14Z
- **Completed:** 2026-06-14T15:58:58Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- **`useSignals.ts`** — `useQuery` over `supabase.rpc('read_signals', { p_dossier_id, p_status, p_since, p_limit })`; `dossierId` omitted → `p_dossier_id: null` (global queue mode); `staleTime: 60_000`; casts `data as Signal[]` (the client is untyped); throws on RPC error. Clearance gating is inherited from the INVOKER RPC at the DB layer.
- **`useSignalMutations.ts`** — `useCreateSignal` inserts `intelligence_event` (resolving `created_by` via `auth.getUser()` and `organization_id` via the user's `default_organization_id`), then inserts `intelligence_event_dossiers` junction rows (one per `dossierId`, `dossier_type` from the caller's `dossierTypes` map, no `organization_id` — parent-derived). `source_type` defaults `'human_entered'` (`ai_confidence: null`); passing `sourceType='ai_generated'` + `aiConfidence` is the **D-13 AI write path on the identical insert + identical clearance-gated INSERT RLS** — no separate branch. `useUpdateSignalStatus` patches `status` directly (`.update().eq('id')`), covering acknowledge / dismiss / **restore (D-04, no hard delete)** / escalated.
- **`useSignalEscalate.ts`** — the RF-4 3-step sequence under caller JWT: (1) `tasks-create` edge fn (`assignee_id`, `workflow_stage: 'todo'`, `priority` from `severity`); (2) `work-item-dossiers` edge fn with `work_item_type = 'task' as const` (runs right after the task create so the junction INSERT RLS `tasks.created_by = auth.uid()` passes) — **warn-only on failure** (task already exists); (3) direct `intelligence_event` UPDATE `status='escalated'` + `escalated_task_id` — **throws on failure** (the bidirectional link is the contract). Returns `{ taskId }`.
- **`index.ts`** — barrel now re-exports all three hooks plus the types.

## Task Commits

Each task committed atomically:

1. **Task 1: useSignals — read_signals RPC wrapper** — `cd676770` (feat)
2. **Task 2: useSignalMutations — create + status-update** — `87b488e3` (feat)
3. **Task 3: useSignalEscalate — 3-step orchestrator + barrel** — `0ca86bcb` (feat) (also folds a 2-line `useSignals.ts` JSDoc reword so the phase-level `supabaseAdmin` grep stays at 0)

**Plan metadata:** (this commit) `docs(69-02)`

## Files Created/Modified

- `frontend/src/domains/signals/hooks/useSignals.ts` (39 lines) — `useSignals(filters): UseQueryResult<Signal[]>` over the INVOKER RPC
- `frontend/src/domains/signals/hooks/useSignalMutations.ts` (135 lines) — `useCreateSignal`, `useUpdateSignalStatus`, and a private `resolveAuthContext()` helper (userId + organizationId)
- `frontend/src/domains/signals/hooks/useSignalEscalate.ts` (83 lines) — `useSignalEscalate(): UseMutationResult<{ taskId: string }, Error, EscalateSignalInput>`
- `frontend/src/domains/signals/index.ts` (12 lines) — barrel: types + 3 hook re-exports

## Decisions Made

The plan's locked decisions (D-04, D-11, D-12, D-13, D-14) were implemented as specified. One execution-time resolution worth recording:

- **`organization_id` source for the create INSERT.** The plan's `<action>` and RESEARCH Pattern 2 use a `userOrgId` placeholder without naming where it comes from. Verified against the migrations: `intelligence_event.organization_id` is **NOT NULL with no default**, and the INSERT RLS calls `tenant_isolation.rls_insert_policy(organization_id)` which requires the caller to be a **member of that org** (`is_tenant_member`). The `users` profile already carries `default_organization_id` (it's in `COLUMNS.USERS.PROFILE` and is the org used for Sentry tenant context), so `resolveAuthContext()` reads it via a `users` lookup keyed on `auth.getUser().id`. This mirrors the canonical `await supabase.auth.getUser()` → `created_by` pattern in `useForums.ts`. If a user has no `default_organization_id`, the hook throws `No organization for current user` (fail-fast, not a silent bad insert).

## Deviations from Plan

No code deviations (Rules 1–4 not triggered). Two non-deviation execution facts:

1. **[Not a deviation — corrected invocation] Frontend verify commands.** The plan's `<verify>` blocks call `pnpm --filter frontend typecheck`. The actual workspace package is `intake-frontend` and the script is `type-check` (hyphenated). Ran `pnpm --filter intake-frontend type-check` and `pnpm --filter intake-frontend lint` — both exit 0. Command-name correction only (the orchestrator's tooling note and Wave 1 SUMMARY both flag this).
2. **[Not a deviation — gate hygiene] JSDoc wording.** The phase `<verification>` greps `frontend/src/domains/signals/hooks/*.ts` for `supabaseAdmin` and requires 0. Two hook files originally said "no supabaseAdmin" / "Never call this with supabaseAdmin" in JSDoc, which would have tripped the literal-token grep to a false-positive non-zero. Reworded both to "service-role client" — same intent, grep stays at 0. No behavior change.

---

**Total deviations:** 0 code deviations.
**Impact on plan:** None. All three tasks landed as specified.

## Issues Encountered

- The Supabase MCP execute-sql tool is not granted to this executor agent; live schema facts were confirmed by reading the committed migrations (`20260516000002`, `20260516000003`, `20260113500001`, `20260614_phase69_signals_extend.sql`) instead — these are the source of truth the orchestrator already applied LIVE.
- The supabase JS client (`@/lib/supabase`) is created **without** the `Database` generic, so `supabase.rpc('read_signals', …)` and `supabase.from('intelligence_event').insert(…)` are loosely typed — this is why `read_signals` results are cast `as Signal[]` and the insert object isn't strictly checked against generated table types. No type friction resulted.

## Known Stubs

None. All three hooks are fully wired to live tables/RPCs/edge functions; no placeholder data, no TODO/FIXME, no empty-value returns flowing to UI.

## Threat Flags

None new. All surface in this wave was specified in the plan's `<threat_model>` (T-69-06..09, T-69-SC) and implemented as the `mitigate` dispositions require:

- **T-69-06** — `useCreateSignal` `source_type` defaults `human_entered`; `ai_generated` is callable only by explicitly passing `sourceType`; both paths hit the same clearance-gated INSERT RLS (`sensitivity_level <= clearance_level`, `created_by = auth.uid()`).
- **T-69-07** — `useSignalEscalate` Step 1 runs `tasks-create` under caller JWT; the dossier-link copy (Step 2) runs immediately after create so `work_item_dossiers` INSERT RLS (`tasks.created_by = auth.uid()`) passes; `work_item_type = 'task' as const`.
- **T-69-08** — `useSignals` wraps the SECURITY INVOKER `read_signals` RPC; clearance gate at the DB; non-cleared callers get indistinguishable-empty.
- **T-69-09** — all inputs flow through the parameterized Supabase JS client; no raw SQL concatenation; DB CHECKs enforce category/status/sensitivity_level/dossier_type.

## Next Phase Readiness

- Wave 3 UI (signals queue, capture form, escalate dialog, per-dossier tab) can import the full data API from `@/domains/signals` now: `useSignals`, `useCreateSignal`, `useUpdateSignalStatus`, `useSignalEscalate` + all types.
- **Caller contract for Wave 3:** `useCreateSignal` requires a correct `dossierTypes` map (`dossier_id → dossiers.type`) for the junction CHECK; `useSignalEscalate` requires `assigneeId` to be pre-filled (the `tasks-create` edge fn rejects a missing `assignee_id` with a 400 — the escalate dialog must default it to self per D-10).
- All hooks are caller-JWT only; RLS clearance gating is automatic — no UI-side clearance checks needed (and per D-09, do not expose "filtered by clearance" in copy).

---

_Phase: 69-signals_
_Completed: 2026-06-14_

## Self-Check: PASSED

All 4 created/modified files present on disk (`useSignals.ts`, `useSignalMutations.ts`, `useSignalEscalate.ts`, `index.ts`) plus this SUMMARY; all 3 task commits (`cd676770`, `87b488e3`, `0ca86bcb`) present in git history. Frontend `type-check` and `lint` (incl. the i18n namespace guard) both exit 0; all 5 phase `<verification>` checks PASS (`supabaseAdmin`=0 across hooks; `as const` present in useSignalEscalate; barrel re-exports all hooks + types).
