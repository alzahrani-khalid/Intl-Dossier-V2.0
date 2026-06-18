---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 07
subsystem: api
tags: [supabase, rls, jwt, ai-agents, security, clearance]

# Dependency graph
requires:
  - phase: 68-ai-foundations-remediation
    provides: createUserClient JWT-keystone idiom (chat-assistant.ts REMED-03), profiles.clearance_level canonical scale
provides:
  - brief-generator.ts user-triggered writes run under the caller's JWT (createUserClient), not service-role supabaseAdmin
  - intake-linker.ts all 6 Supabase ops run under the caller's JWT, not service-role
  - D-10 fully audited — the folded P68 supabaseAdmin-background-agents follow-up is closed
affects: [72-agent-platform, agent-runtime read tools, keystone coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'JWT keystone in background-adjacent agents: per-request createUserClient(authHeader) replaces service-role supabaseAdmin on every user-triggered path so RLS (sensitivity_level <= clearance_level) applies'
    - 'Call-graph triage over line-by-line assumption: classify each service-role site by its actual caller (HTTP-authenticated vs queue/cron) before swapping'

key-files:
  created:
    - backend/tests/unit/brief-generator-jwt.test.ts
    - backend/tests/unit/intake-linker-jwt.test.ts
  modified:
    - backend/src/ai/agents/brief-generator.ts
    - backend/src/ai/agents/intake-linker.ts
    - backend/src/api/ai/briefs.ts
    - backend/src/api/ai/intake-linking.ts

key-decisions:
  - 'All 9 supabaseAdmin sites across both agents are user-triggered — the plan/PATTERNS hypothesis that intake-linker L452 (ai_entity_link_proposals write) is a cron carve-out does NOT hold: the call-graph shows no queue/worker/cron caller, so it runs synchronously inside the authenticated proposeLinks request and is caller-scoped'
  - 'No service-role carve-out remains in either agent — both supabaseAdmin imports removed entirely'
  - "Tests placed under backend/tests/unit/ (a collected vitest dir), NOT the plan's named src/ai/agents/*.test.ts path which the default vitest include globs never collect"
  - 'D-10 citation truth: this plan implements D-10 (fold + audit the two background agents) closing the folded P68 supabaseAdmin follow-up'

patterns-established:
  - "Keystone retirement in an agent: add local createUserClient(authHeader) mirroring chat-assistant.ts:24, add authHeader to the agent's request interface, thread it through every private DB method, swap supabaseAdmin -> createUserClient, drop the import, forward req.headers.authorization at the HTTP caller"

requirements-completed: [AGENT-03]

# Metrics
duration: 7min
completed: 2026-06-18
---

# Phase 72 Plan 07: Retire supabaseAdmin from the two background agents (D-10) Summary

**brief-generator.ts (3 sites) and intake-linker.ts (6 sites) now run every user-triggered Supabase read/write under the caller's JWT via createUserClient(authHeader); service-role supabaseAdmin is removed from both agents — all 9 sites proven user-triggered by call-graph, so no cron carve-out remains.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-18T08:28:41Z
- **Completed:** 2026-06-18T08:35:58Z
- **Tasks:** 2
- **Files modified:** 6 (4 modified, 2 test files created)

## Accomplishments

- Retired `supabaseAdmin` (service-role, RLS-bypassing) from both interactive-adjacent background agents, completing the keystone coverage the copilot depends on (AGENT-03 reinforced).
- Threaded the caller's `Authorization` header end-to-end through both call chains (Express route -> agent -> every private DB method), so no read or write silently runs unscoped.
- Closed the folded P68 follow-up (`p68-followup-supabaseadmin-background-agents.md`) via D-10 — the JWT-scoped-client idiom was fresh from P68, lifted verbatim.
- Established (via call-graph) that intake-linker's `ai_entity_link_proposals` write is user-triggered, correcting the plan's "likely cron carve-out" hypothesis with evidence.

## Task Commits

Each task was committed atomically (TDD: RED test + GREEN impl folded into one feat commit per task, since both test files and source live together logically):

1. **Task 1: Retire supabaseAdmin from brief-generator.ts user-triggered paths** - `94a4fa7f` (feat)
2. **Task 2: Retire/document supabaseAdmin in intake-linker.ts** - `b6fdb447` (feat)

_Note: Both tasks were `tdd="true"` — RED was run and confirmed failing before GREEN for each (see Issues Encountered)._

## Files Created/Modified

- `backend/src/ai/agents/brief-generator.ts` - Added `createUserClient(authHeader)`; added `authHeader` to `BriefGenerationRequest`; threaded it through `generate`/`generateStream` into `createBriefRecord`/`updateBriefRecord`/`markBriefFailed`; swapped all 3 `ai_briefs` writes to the per-request client; removed the `supabaseAdmin` import.
- `backend/src/ai/agents/intake-linker.ts` - Added `createUserClient(authHeader)`; added `authHeader` to `IntakeLinkingRequest`; threaded it through `proposeLinks` into `getIntakeTicket`/`searchSimilarEntities`/`createRunRecord`/`updateRunStatus`/`saveProposals`; swapped all 6 sites (intake_tickets read, dossiers read, persons read, ai_runs insert, ai_runs update, ai_entity_link_proposals insert); removed the `supabaseAdmin` import.
- `backend/src/api/ai/briefs.ts` - `POST /generate` now reads `req.headers.authorization`, fails 401 if absent, and forwards it to both `generate` and `generateStream`.
- `backend/src/api/ai/intake-linking.ts` - `POST /intake/:ticketId/propose-links` now reads `req.headers.authorization`, fails 401 if absent, and forwards it to `proposeLinks`. (The other routes in this file retain their own `supabaseAdmin` usage — out of scope for this plan, which targets the agent retirement.)
- `backend/tests/unit/brief-generator-jwt.test.ts` - Asserts the user path builds a per-request anon-key client with the forwarded Authorization header, and that service-role `supabaseAdmin` is never used on the write path.
- `backend/tests/unit/intake-linker-jwt.test.ts` - Same assertions for all 6 intake-linker ops, explicitly including the `ai_entity_link_proposals` write.

## Per-call-site classification (all 9 sites)

| Agent           | Method                | Line (pre-edit) | Table / op                      | Classification                  | Disposition      |
| --------------- | --------------------- | --------------- | ------------------------------- | ------------------------------- | ---------------- |
| brief-generator | createBriefRecord     | L413            | ai_briefs INSERT                | user-triggered                  | createUserClient |
| brief-generator | updateBriefRecord     | L444            | ai_briefs UPDATE                | user-triggered                  | createUserClient |
| brief-generator | markBriefFailed       | L472            | ai_briefs UPDATE                | user-triggered                  | createUserClient |
| intake-linker   | getIntakeTicket       | L194            | intake_tickets SELECT           | user-triggered                  | createUserClient |
| intake-linker   | searchSimilarEntities | L243            | dossiers SELECT                 | user-triggered                  | createUserClient |
| intake-linker   | searchSimilarEntities | L264            | persons SELECT                  | user-triggered                  | createUserClient |
| intake-linker   | createRunRecord       | L392            | ai_runs INSERT                  | user-triggered                  | createUserClient |
| intake-linker   | updateRunStatus       | L422            | ai_runs UPDATE                  | user-triggered                  | createUserClient |
| intake-linker   | saveProposals         | L452            | ai_entity_link_proposals INSERT | user-triggered (no cron caller) | createUserClient |

**Cron carve-outs documented:** None. Both agents are invoked exclusively from authenticated Express endpoints (`POST /api/ai/briefs/generate`, `POST /api/ai/intake/:ticketId/propose-links`). No queue/worker/cron path calls `briefGeneratorAgent.*` or `intakeLinkerAgent.proposeLinks` (verified via repo-wide grep of `backend/src/{queues,jobs,workers}`). The keystone carve-out (service-role + documented app-layer authz) therefore does not apply to either agent — the correct disposition is full retirement, which is what shipped.

## Decisions Made

- **All 9 sites are user-triggered; no carve-out.** The plan and 72-PATTERNS flagged intake-linker L452 as "likely the cron carve-out." Call-graph analysis disproved this: `proposeLinks` has a single caller (the authenticated `propose-links` route) and runs the proposals INSERT synchronously in that request. Swapping it to `createUserClient` (rather than leaving a documented service-role carve-out) is the correct, stricter choice and is RLS-safe.
- **Both `supabaseAdmin` imports removed.** With zero remaining service-role sites in either agent, keeping the import would be dead code and a lint failure.
- **Param-order for `updateRunStatus`.** Reordered to `(runId, status, authHeader, errorMessage?)` so the required `authHeader` precedes the optional `errorMessage` (TypeScript optional-after-required rule).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test files relocated to a collected vitest directory**

- **Found during:** Task 1 (test infrastructure check before writing the RED test)
- **Issue:** The plan's `files_modified` names tests at `backend/src/ai/agents/brief-generator.test.ts` and `intake-linker.test.ts`. The backend default `vitest.config.ts` `include` globs only collect `tests/unit/**`, `tests/services/**`, `tests/security/**`, `tests/intelligence/**` — tests under `src/**` are NOT run by `pnpm test` (confirmed live: `src/ai/__tests__/security-enforcement.test.ts` returns "No test files found" under the default config). Tests at the planned path would silently never run, failing the acceptance criterion "the test passes."
- **Fix:** Placed the two test files under `backend/tests/unit/` (`brief-generator-jwt.test.ts`, `intake-linker-jwt.test.ts`), mirroring the `tests/unit/auth.service.test.ts` mock idiom (relative `../../src/...` imports, `vi.mock('@supabase/supabase-js')` to capture `createClient` calls).
- **Files modified:** backend/tests/unit/brief-generator-jwt.test.ts, backend/tests/unit/intake-linker-jwt.test.ts
- **Verification:** Both files collected and green under `pnpm exec vitest run --config ./vitest.config.ts` (4 tests pass).
- **Committed in:** 94a4fa7f (Task 1), b6fdb447 (Task 2)

**2. [Rule 3 - Blocking] HTTP callers updated to thread the caller JWT**

- **Found during:** Task 1 & Task 2 (the agent request interfaces gained a required `authHeader`)
- **Issue:** Adding `authHeader: string` to `BriefGenerationRequest`/`IntakeLinkingRequest` broke the call sites in `briefs.ts`/`intake-linking.ts` (type-check failure) and, more importantly, the acceptance criterion requires the caller Authorization to be threaded "through the call chain (no read silently runs unscoped)."
- **Fix:** `briefs.ts` and `intake-linking.ts` now read `req.headers.authorization`, fail 401 when absent, and forward it to the agent. (Only the agent-feeding routes were touched; other routes in `intake-linking.ts` keep their existing `supabaseAdmin` usage — out of this plan's scope.)
- **Files modified:** backend/src/api/ai/briefs.ts, backend/src/api/ai/intake-linking.ts
- **Verification:** `pnpm exec tsc --noEmit` exits 0.
- **Committed in:** 94a4fa7f (Task 1), b6fdb447 (Task 2)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking).
**Impact on plan:** Both deviations were necessary to make the acceptance criteria actually satisfiable (tests that run; a JWT that reaches the DB). No scope creep — only the two agents and their direct feeding routes were changed; unrelated `supabaseAdmin` usage elsewhere in `intake-linking.ts` was deliberately left untouched per the scope boundary.

## Issues Encountered

- **TDD RED/GREEN cycles ran cleanly for both tasks.** brief-generator RED failed at `createBriefRecord` (`supabaseAdmin.from` undefined) → GREEN passed after the swap. intake-linker RED failed at `getIntakeTicket` → after the source swap, the first GREEN run surfaced a **test-only mock bug** (the query-builder stub's `.insert()` returned a bare thenable lacking `.select()`, which `createRunRecord`'s `.insert(...).select('id').single()` chain needs). Fixed the stub to return the chainable builder from `insert`/`update`; GREEN then passed. This was a test-harness fix, not a source change.
- **No live DB / live UAT in this plan.** This is a pure code repoint to an existing idiom (threat T-72-SC: no package change). RLS enforcement under the JWT is exercised against the live clearance scale by the broader Phase 72 UAT; the unit tests here prove the client is correctly scoped (anon key + forwarded header) and service-role is never used.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both background agents now hold the keystone — no interactive-adjacent path reads/writes above the caller's clearance. This is the last service-role retirement among the interactive-adjacent agents (chat-assistant.ts was retired in P68; these two complete the set).
- The `createUserClient(authHeader)` idiom is now applied identically in three agents — the `agent-runtime` read tools (other Phase 72 plans) inherit the same proven pattern.
- No blockers.

## Self-Check: PASSED

- All created files verified present (SUMMARY, 2 test files, both modified agents).
- Both task commits verified in git log: `94a4fa7f`, `b6fdb447`.

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-18_
