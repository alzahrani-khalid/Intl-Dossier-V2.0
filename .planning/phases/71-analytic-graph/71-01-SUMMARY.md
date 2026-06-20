---
phase: 71-analytic-graph
plan: 01
subsystem: testing
tags: [vitest, supabase, rls, clearance, query_graph, react, i18n, tdd-red]

# Dependency graph
requires:
  - phase: 70-digests-alerts
    provides: generate-digest.integration.test.ts harness + generate_digest INVOKER+JSONB+inline-clearance RPC pattern
  - phase: 69-signals
    provides: read_signals INVOKER RPC precedent + profiles.user_id clearance rule
provides:
  - Wave 0 test scaffolding for Phase 71 — all 6 RED test files from 71-VALIDATION.md
  - RF-7 high-sensitivity seed/restore fixture (sensitivity-3 forum-membership edge + sensitivity-4 engagement + WG members) shared by clearance/invoker tests and the live UAT (71-05)
  - GRAPH-01 RPC row-shape contract (forum_membership/shared_committees/engagement_chain/shortest_path)
  - GRAPH-03 strictly-increasing-count + indistinguishable-empty contract
  - GRAPH-04 direct-invocation caller-JWT clearance gate contract
  - AnalyticQueryPicker / AnalyticResultView / Cmd+K analyze-command contracts
affects:
  [
    71-02 query_graph RPC,
    71-03 migration apply + live test run,
    71-04 FE Analyze surfaces,
    71-05 Cmd+K + live UAT,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Live-staging integration test via createClient from @supabase/supabase-js (NOT @/config/supabase, which tests/setup.ts globally mocks) — service-role for seed/observe/restore, anon-key sign-in for caller-JWT clearance assertions'
    - "Dual-account clearance test = one real test user, clearance_level flipped via service-role between runs and restored in afterAll (the plan's sanctioned path)"
    - 'RED-by-import FE tests: import the not-yet-existing component/helper so the suite fails on module resolution until the implementing plan lands'
    - 'react-i18next mock returning defaultValue/key (repo idiom) so component-test assertions key off EN copy'

key-files:
  created:
    - backend/tests/intelligence/fixtures/analytic-graph-seed.ts
    - backend/tests/intelligence/query-graph.integration.test.ts
    - backend/tests/intelligence/query-graph.clearance.integration.test.ts
    - backend/tests/intelligence/query-graph.invoker.integration.test.ts
    - frontend/src/components/relationships/__tests__/AnalyticQueryPicker.test.tsx
    - frontend/src/components/relationships/__tests__/AnalyticResultView.test.tsx
    - frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.analyze.test.tsx
  modified: []

key-decisions:
  - 'Backend tests connect to live staging via @supabase/supabase-js createClient (the contract-test pattern), since tests/setup.ts only mocks @/config/supabase — leaving createClient real so a downstream live run hits zkrcjzdemdmwhearhfgg'
  - "No describe.skipIf gate: the suite must be genuinely RED (createServiceRoleClient throws when env is absent locally; .rpc('query_graph') errors when staging is reachable) — never green before the RPC exists"
  - 'Cmd+K analyze contract pinned via a not-yet-existing getAnalyzeCommandActions helper rather than mounting the 1557-line CommandPalette — deterministic RED + a clean unit boundary for 71-05 to implement'
  - 'RF-7 fixture seeds its own forum-membership + engagement-chain + shared-committee data so all demo queries are non-empty regardless of thin live edge volume (closes RESEARCH Open Questions 2 + 3)'

patterns-established:
  - 'Live-staging integration harness: real createClient + env-sourced service-role/anon keys + seed→observe→restore in beforeAll/afterAll'
  - 'Indistinguishable-empty assertion: JSON.stringify(payload) (backend) / container.textContent (frontend) must not match /clearance|filtered|restricted(|permission)/i'

requirements-completed: [] # Wave 0 scaffolding only — GRAPH-01..04 turn GREEN in 71-02/03/04/05; not closed here.

# Metrics
duration: 15min
completed: 2026-06-17
---

# Phase 71 Plan 01: Wave 0 Test Scaffolding Summary

**Six RED test files + a shared RF-7 high-sensitivity seed/restore fixture that pin the `query_graph` RPC row-shape, the clearance strictly-increasing/indistinguishable-empty contract, the direct-invocation caller-JWT gate, and the Analyze picker / result / Cmd+K surfaces — every one failing now and turning GREEN as 71-02/03/04/05 land.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-17T09:02Z
- **Completed:** 2026-06-17T09:17Z
- **Tasks:** 3
- **Files created:** 7

## Accomplishments

- RF-7 fixture (`analytic-graph-seed.ts`): seeds a low-sensitivity country anchor + a sensitivity-3 forum (`member_of` edge) + a sensitivity-4 engagement (participant) + a sensitivity-3 working group with two org members; captures every id and restores in FK-safe order. Env-sourced credentials, no hardcoded secrets, no `console.log`, type-clean.
- Three backend integration tests (GRAPH-01 row shape, GRAPH-03 clearance reduction, GRAPH-04 INVOKER direct invocation) mirroring the live-staging harness and sharing the fixture — all RED pending `query_graph`.
- Three frontend tests (AnalyticQueryPicker, AnalyticResultView, Cmd+K analyze commands) encoding the picker/result/Cmd+K contracts incl. the LOCKED no-clearance-copy rule — all RED pending the components/entries.
- Nyquist sampling contract satisfied: every downstream implementation requirement (GRAPH-01..04) now has an automated verify created in Wave 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: RF-7 seed/restore fixture module** — `345f93f4` (test)
2. **Task 2: Backend integration tests — GRAPH-01/03/04 (RED)** — `a49597c8` (test)
3. **Task 3: Frontend component + Cmd+K tests (RED)** — `ec9e219e` (test)

_All RED — this plan ships no production code (per its objective)._

## Files Created/Modified

- `backend/tests/intelligence/fixtures/analytic-graph-seed.ts` — `seedAnalyticGraphFixture` / `restoreAnalyticGraphFixture` + `createServiceRoleClient`; the RF-7 high-sensitivity fixture
- `backend/tests/intelligence/query-graph.integration.test.ts` — GRAPH-01 JSONB row-shape assertions for all 4 query types under a service-role client
- `backend/tests/intelligence/query-graph.clearance.integration.test.ts` — GRAPH-03 dual-account `toBeGreaterThan` + indistinguishable-empty payload assertion
- `backend/tests/intelligence/query-graph.invoker.integration.test.ts` — GRAPH-04 direct `.rpc('query_graph')` under low- vs high-clearance caller JWT; asserts on `sensitivity_level` + above-clearance node presence/absence
- `frontend/src/components/relationships/__tests__/AnalyticQueryPicker.test.tsx` — 4 templates, window-N reveal, `onRun` typed params, `defaultEntityId` pre-fill
- `frontend/src/components/relationships/__tests__/AnalyticResultView.test.tsx` — list/table/timeline/hops + "No results" + zero clearance-revealing copy
- `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.analyze.test.tsx` — `getAnalyzeCommandActions` pathname→deep-link (`mode=analyze`) + entity pre-fill from `/dossiers/countries/<id>`

## Decisions Made

- **Real createClient over the global mock for backend tests.** `backend/tests/setup.ts` mocks `@/config/supabase` but NOT `@supabase/supabase-js`, so importing `createClient` directly yields a live-staging client (the established `tests/contract/*` pattern). This is what lets 71-03's live run actually exercise the RPC.
- **No `skipIf` env gate.** The acceptance contract requires the suite to be RED, not skipped. With no `backend/.env.test` present, `createServiceRoleClient()` throws in `beforeAll` (loud RED); with staging reachable, the missing-function error is the RED. Both satisfy "never green before `query_graph` exists."
- **Cmd+K contract pinned via a pure helper (`getAnalyzeCommandActions`)** instead of mounting the full CommandPalette — deterministic import-resolution RED and a clean seam for 71-05.
- **Fixture seeds its own membership/chain/committee data** so the GRAPH-01 demo queries are non-empty independent of live edge volume (closes RESEARCH Open Questions 2 & 3).

## Deviations from Plan

None — plan executed exactly as written. No production code, no package installs, no architectural changes; the three tasks map 1:1 to the committed test files.

## Issues Encountered

- **Env keys live in root `.env.test`, but the backend test runner loads `backend/.env.test` (absent).** Confirmed `SUPABASE_URL`/`SERVICE_ROLE_KEY`/`ANON_KEY` resolve only from root `.env.test`; `tests/setup.ts` loads root `.env` (no Supabase keys) then `backend/.env.test`. Consequence: locally the suites RED on the env-guard throw rather than on a missing-RPC error — both are valid RED. For 71-03's live run, the operator must provide `backend/.env.test` (or symlink the root `.env.test`) with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`. Flagged for the orchestrator (see Next Phase Readiness).
- **Pre-commit lint-staged swept already-staged planning docs** (`STATE.md`, `71-RESEARCH.md`, `71-VALIDATION.md` were `MM` at session start) into the Task 1 commit (`345f93f4`). These were prior-session staged edits, prettifier-normalized; no content destroyed, no deletions (verified via `git diff --diff-filter=D`). The fixture itself committed cleanly.

## User Setup Required

None for this plan. **For the downstream live run (71-03):** populate `backend/.env.test` with the staging `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` and `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` so the three backend suites connect to `zkrcjzdemdmwhearhfgg` (the values already exist in root `.env.test`).

## Next Phase Readiness

- **71-02 (query_graph RPC):** the row-shape, clearance, and invoker contracts are now executable specs. Implement `query_graph(p_query_type, p_entity_id, p_entity_id_2 DEFAULT NULL, p_window_days DEFAULT 90) RETURNS JSONB`, SECURITY INVOKER, inline `sensitivity_level <= v_clearance` via `profiles.user_id = auth.uid()` (NOT `id`). The fixture forum is sensitivity-3 and the engagement sensitivity-4 — those are the markers the clearance/invoker assertions key on.
- **71-03 (apply + run):** apply the migration to staging via Supabase MCP, provision `backend/.env.test`, then run the three backend suites — they must flip RED→GREEN.
- **71-04 (FE Analyze surfaces):** `AnalyticQueryPicker` must accept `defaultEntityId` + `onRun({queryType, entityId, ...})` and reveal a window-N input for `engagement_chain`; `AnalyticResultView` must render list/table/timeline/hops + the "No results" empty state with ZERO clearance copy.
- **71-05 (Cmd+K + live UAT):** implement `getAnalyzeCommandActions(pathname)` returning `{id: 'cmd-analyze-*', label: 'Analyze: …', queryType, deepLink}` deep-linking to `/relationships/graph?dossierId=<id>&mode=analyze&query=<type>`; the live UAT reuses this same RF-7 fixture.
- **Caller-JWT clearance landmine reminder (from RESEARCH/MEMORY):** the RPC's clearance subquery MUST use `profiles.user_id = auth.uid()` — `profiles` has no `id` column; `WHERE id = auth.uid()` silently binds NULL and the clearance test's strictly-increasing assertion would catch a deny-all regression.

## Self-Check: PASSED

All 7 created files verified on disk; all 3 task commits (`345f93f4`, `a49597c8`, `ec9e219e`) verified in git history.

---

_Phase: 71-analytic-graph_
_Completed: 2026-06-17_
