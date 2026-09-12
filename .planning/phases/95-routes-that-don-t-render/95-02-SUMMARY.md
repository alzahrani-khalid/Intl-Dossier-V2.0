---
phase: 95-routes-that-don-t-render
plan: 02
subsystem: api
tags: [supabase-edge, tanstack-query, playwright, deploy, assignments-queue]

requires:
  - phase: 93-error-states
    provides: QueryErrorState surface on pages/AssignmentQueue.tsx (variant="page", testid query-error-state)
provides:
  - apiGet query-string transport for the assignment queue (filters can reach the function)
  - assignments-queue redeployed to staging (version 11 -> 12)
  - gateway-vs-function 404 disambiguation in scripts/probe-edge-auth.sh
  - tests/e2e/95-queue-renders.spec.ts — natural-state oracle for criterion 2
affects: [95-09 closing register, DEAD-09 deploy evidence, future edge-probe consumers]

tech-stack:
  added: []
  patterns:
    - 'Edge fns with query params are called via apiGet(`/fn?${params}`), never functions.invoke'
    - '404 probes classify gateway vs function from the response body, never from the status alone'

key-files:
  created:
    - tests/e2e/95-queue-renders.spec.ts
  modified:
    - frontend/src/hooks/useAssignmentQueue.ts
    - scripts/probe-edge-auth.sh

key-decisions:
  - 'The deployment oracle is the version comparison (11 -> 12), not manifest inclusion and not the probe status — both were already green over the stale deployment'
  - 'The probe never classifies a 404 silently: an unrecognised body prints 404-kind: unknown with the raw bytes'
  - 'No rows were inserted to force a populated queue state; the observed error state is recorded as a named bound instead'

patterns-established:
  - 'Named-bound closure: a criterion whose happy-path render was not exercised closes with bound text, never an unqualified pass'
  - 'A conditional oracle branch that cannot run says so out loud (QUEUE-FILTER-EXERCISED: no) rather than passing quietly'

requirements-completed: [DEAD-02]

duration: 18 min
completed: 2026-08-16
---

# Phase 95 Plan 02: /tasks/queue against a deployed assignments-queue — Summary

**`assignments-queue` redeployed to staging (v11 → v12), its client transport swapped from the
never-serializing `functions.invoke(GET+body)` to `apiGet` with a real query string, and a
natural-state e2e oracle added that pins `/tasks/queue` to exactly one truthful render — observed
as the truthful error state, closed with a named bound.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-08-16T19:45:00Z (approx — first read)
- **Completed:** 2026-08-16T20:02:55Z
- **Tasks:** 3
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments

- Killed the transport defect: queue filters now ride a query string the function can read from
  `url.searchParams`; the browser `GET`-with-body `TypeError` path is gone.
- Redeployed the audited-sound in-tree function source; the version-increment oracle moved 11 → 12.
- Shipped the 404-kind disambiguation into the shared probe — the instrument gap that let
  "assignments-queue is not deployed" survive research is now closed for every future probe.
- Added `95-queue-renders.spec.ts`, which fails on the two renders that lie (perpetual spinner,
  internal strings) and on contradictory simultaneous states.

## Task Commits

1. **Task 1: Replace the invoke transport with apiGet** — `85ea74cf3` (fix)
2. **Task 2: Deploy assignments-queue with probe evidence** — `e84da60ac` (fix)
3. **Task 3: Natural-state oracle 95-queue-renders.spec.ts** — `d3b8ad9ad` (test)

## Files Created/Modified

- `frontend/src/hooks/useAssignmentQueue.ts` — `apiGet<QueueListResponse>('/assignments-queue?'+params)`;
  `createClient`/`supabase` import orphaned by the change and removed. Query key, `refetchInterval`,
  and the hook's public signature unchanged.
- `scripts/probe-edge-auth.sh` — on a 404, one extra indented `404-kind:` line classified from the
  response body. The `<fn> -> <status>` line format is unchanged (C9a).
- `tests/e2e/95-queue-renders.spec.ts` — NEW. 2 tests, `// @covers DEAD-02` on line 1, inline auth,
  `--no-deps`, 15s retry budget, DOM-only assertions.

---

## INSTRUMENTS FIRST — probe controls (exec acceptance condition 7)

Shipped BEFORE any probe output below was consumed as evidence. Both controls passed:

```
=== CONTROL A: known-deployed (reports) ===
reports -> 200
CONTROL_A_EXIT=0
=== CONTROL B: known-absent slug (no-such-fn-95) ===
no-such-fn-95 -> 404
    404-kind: gateway  body: {"code":"NOT_FOUND","message":"Requested function was not found"}
CONTROL_B_EXIT=0
```

Control A prints no 404 line (deployed → 200). Control B prints `404-kind: gateway`. The two
body shapes are empirically distinct, not assumed: the platform's not-deployed body is
`{"code":"NOT_FOUND","message":"Requested function was not found"}`; the function's own 404 body
is its house error envelope. An unrecognised body prints `404-kind: unknown` with the raw bytes —
the script never classifies silently.

**What the new instrument immediately proved (pre-deploy, before any change to staging):**

```
=== PRE-DEPLOY TARGET ===
assignments-queue -> 404
    404-kind: function  body: {"error":"User profile not found"}
```

`404-kind: function` — the corrected premise (RULING of the 2026-08-16 planning-leg drill) is
confirmed by measurement, not by inference. The stale v11 WAS deployed and was answering its own 404. The old bare `-> 404` line could not have shown this.

## Deployment oracle — version derivation (D-19)

**Pre-deploy baseline, re-derived at execution start** (`supabase functions list --project-ref
zkrcjzdemdmwhearhfgg`, CLI 2.106.0):

```json
{
  "slug": "assignments-queue",
  "status": "ACTIVE",
  "version": 11,
  "updated_at": 1783945373782,
  "id": "45d878b5-1fa1-4304-8b82-9be3550cb9ac",
  "verify_jwt": true
}
```

Matches the orchestrator's staging premise exactly (ACTIVE v11, updated 2026-07-13). No drift.

**RED (gate's first clause at the derived baseline):** `test 11 -gt 11` → exit `1`.

**Deploy:** `supabase functions deploy assignments-queue --project-ref zkrcjzdemdmwhearhfgg`
→ `Bundling Function: assignments-queue` / `Deploying Function (script size: 82.7kB)` /
`Deployed Functions on project zkrcjzdemdmwhearhfgg: assignments-queue`.

**GREEN (post-deploy derivation):**

```json
{
  "slug": "assignments-queue",
  "status": "ACTIVE",
  "version": 12,
  "updated_at": 1786910084740,
  "updated_iso": "2026-08-16T19:54:44.740Z"
}
```

`12 -gt 11` → the red-capable deployment oracle is green. Manifest inclusion was green before the
work and is not cited as evidence anywhere in this summary.

**Post-deploy probe line (D-19 evidence):**

```
assignments-queue -> 404
    404-kind: function  body: {"error":"User profile not found"}
reports -> 200
```

A function-kind 404 carrying a profile body is "deployed" per the plan's own status rule.

**No source edit to the function.** `git status --porcelain -- supabase/functions/` was empty
immediately before the deploy and remains empty.

## Natural-state derivation (research Open Question 1, via Supabase MCP `execute_sql`, read-only)

```sql
SELECT sp.role, sp.unit_id FROM staff_profiles sp
  JOIN auth.users u ON u.id = sp.user_id WHERE u.email = '<TEST_USER_EMAIL>';
-- []  (NO ROW)

SELECT count(*) FROM assignment_queue;
-- 0
```

**Both zeros instrument-tested before being believed** (a correct query over the wrong set returns
a correct-looking empty):

```
staff_profiles_total = 4      -- the table is populated; the empty is not "table is empty"
test_user_exists     = 1      -- the user does exist in auth.users
staff_profiles_joinable = 4   -- all 4 rows join on user_id; the join column is right
public_users_row     = 1
```

So the test user genuinely has **no `staff_profiles` row** → the function's truthful 404
("User profile not found") → the page renders the shared error state. And even with a profile, the
queue holds **0 rows**, so the populated render was unreachable on this data either way. No rows
were inserted to force a populated state (plan: read-only evidence).

## Observed state and NAMED BOUND

**`QUEUE-STATE: error`** (both tests, reproduced across three runs)

Second recorded line: `QUEUE-FILTER-EXERCISED: no — page settled to the error state, whose branch
renders no filter controls`.

**NAMED BOUND for the 95-09 closing register — verbatim:**

> criterion 2 verified as renders-against-a-deployed-function; the populated-rows render was not
> exercised (observed state: error), explained by the Task 2 staff_profiles/queue-count derivation

An unbounded "criterion 2 PASS" over this observation is a REJECT.

## Gate observations (all exits captured directly, never through a pipe)

| Gate                                                            | Exit | Note                                                                                              |
| --------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| Task 1 — apiGet in / `functions.invoke` out / `pnpm type-check` | 0    | pre-change RED: `apiGet` clause exit 1, non-comment `functions.invoke` count = 1                  |
| Task 2 — version `-gt 11` / `404-kind` pinned / probe line      | 0    | pre-deploy RED: `test 11 -gt 11` exit 1 at the derived baseline                                   |
| Task 3 — spec exists / lists exactly 2 / runs `--no-deps`       | 0    | pre-work RED: `git cat-file -e HEAD:tests/e2e/95-queue-renders.spec.ts` exit 128 (absent at HEAD) |

All three re-run once more after the final commit: `TASK1_GATE_EXIT=0`, `TASK2_GATE_EXIT=0`,
`TASK3_GATE_EXIT=0`.

Named non-consumer `tests/e2e/93-tasks-queue-error.spec.ts` — **byte-identical**
(`HEAD` blob `a3d5c0336327ca20c1d2c9872b8eb7a6eeb7dd52` == disk `git hash-object`, working tree
clean for that path) and **still green post-deploy**: `1 passed (10.5s)`, exit 0.

Extra checks (this path is outside the lint-staged patterns, so CI Lint is the first consumer):
`eslint tests/e2e/95-queue-renders.spec.ts --max-warnings 0` → exit 0; `prettier --check` → clean.

## Decisions Made

- **The e2e green alone does not prove the deploy — and this summary does not claim it does.** For
  this user the stale v11 and the fresh v12 return the same profile-404, so the spec would have
  passed pre-deploy too. The deployment oracle is the version comparison (11 → 12) and nothing
  else; the spec's job is the orthogonal half — that the page renders TRUTHFULLY against a
  function that answers, with no spinner and no leaked internals.
- **`apiGet` is called from the hook, not from a repository.** `frontend/CLAUDE.md` §Domains says
  hooks should call a repository rather than `apiGet` directly. The plan mandates the direct call
  (its `must_haves` artifact pins `apiGet` inside `useAssignmentQueue.ts`) and its `files_modified`
  set contains no repository file, so introducing one would be out-of-set work. Flagged here as a
  known divergence from the house layering rule, not a silent one.
- **`console.warn`, not `console.log`, for the QUEUE-STATE line** — the repo lints with
  `--max-warnings 0` and permits only `warn`/`error`; the runner forwards it either way.

## Deviations from Plan

None — plan executed exactly as written. (Task 3's commit needed an explicit `git add` first
because the file was untracked; `git commit -- <path>` cannot stage a new file. Same single-path
pathspec, no `git add -A`.)

## Issues Encountered

- **Shared-index contention** with the seven parallel lanes: two `git` invocations failed on
  `.git/index.lock` and succeeded on the scripted retry (5-15s sleep), as the protocol anticipates.
- **The filter half of test 2 is unexercised at runtime** on current staging data, because the
  error branch of `AssignmentQueue.tsx` returns before the filter row. The test asserts that
  filters may be absent ONLY in the error state (in a rows/empty state their absence fails the
  test) and prints `QUEUE-FILTER-EXERCISED: no`. The transport fix itself is pinned statically by
  the Task 1 gate; the runtime `priority=` query-string assertion goes red pre-fix but only in a
  branch this data cannot reach.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Criterion 2's evidence is complete and bounded; 95-09's closing register must cite the NAMED
  BOUND text above verbatim on the criterion-2 row.
- The `404-kind` disambiguation is available to every later probe consumer (95-06's `reports`
  deploy included) at no change to the `<fn> -> <status>` line consumers grep.
- Follow-on (NOT this plan's scope, filed for whoever owns staging data): the test user has no
  `staff_profiles` row, so every supervisor/admin-gated edge function will answer 404 for it. Any
  future criterion that needs a populated queue render needs that row and queue rows to exist first.

## BLOCKED

(none — every task's gate ran and its exit was observed)

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
