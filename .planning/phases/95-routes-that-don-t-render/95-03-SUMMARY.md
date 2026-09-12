---
phase: 95-routes-that-don-t-render
plan: 03
subsystem: ui
tags: [react, tanstack-query, playwright, cdp, error-states, i18n]

requires:
  - phase: 93-trust-the-render
    provides: QueryErrorState (the one shared query-error state) + the CDP forced-error oracle pattern
provides:
  - /scenario-sandbox backend failures render QueryErrorState variant A (role="alert", bilingual, retry)
  - bounded retry on the scenarios query (0 on 4xx, max 2 otherwise) — the spinner window is capped
  - tests/e2e/95-sandbox-error.spec.ts — forced (CDP) + natural behavioural oracle for criterion 3
affects: [95-09 acceptance, any future scenario-sandbox work, the 500's server-side diagnosis]

tech-stack:
  added: []
  patterns:
    - 'CDP block patterns must be narrowed past the SPA route/module URL, not just the API name'
    - 'A forced-error spec instrument-tests its own force via requestfailed, not just the DOM'

key-files:
  created:
    - tests/e2e/95-sandbox-error.spec.ts
  modified:
    - frontend/src/routes/_protected/scenario-sandbox.tsx
    - frontend/src/domains/misc/hooks/useScenarioSandbox.ts

key-decisions:
  - 'Comparison panel gets NO variant B branch: it has its own query but that query is a stub that cannot reject'
  - 'CDP block narrowed to */functions/v1/scenario-sandbox* — the plan-literal *scenario-sandbox* blanks the app'
  - 'Test 2 accepts both truthful outcomes so a later fix to the 500 cannot red the spec'
  - 'public.scenarios EXISTS on staging — the 500 is not a missing relation; recorded, not fixed'

patterns-established:
  - 'Instrument check inside a forced-error spec: assert the block actually fired (requestfailed), keep the verdict in the DOM'

requirements-completed: [DEAD-03]

duration: ~24 min
completed: 2026-08-16
---

# Phase 95 Plan 03: /scenario-sandbox Error Truthfulness Summary

**The bespoke error branch with its hardcoded English "Retry" is gone — a backend 500 now renders the shared `QueryErrorState` (role="alert", bilingual, retry) inside a bounded retry window, proven DOM-distinct from the loading spinner by a CDP forced-error oracle.**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-08-16T19:45Z (approximate — earliest pinned artifact is `/tmp/9503-drillA.log` at 19:55:45Z)
- **Completed:** 2026-08-16T20:09:11Z
- **Tasks:** 2
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments

- `scenario-sandbox.tsx:312-323` — the inline `Alert`, the hardcoded English `Retry` JSX literal, and the legacy `text-primary`/`text-muted-foreground` classes are deleted and replaced by `QueryErrorState variant="page"` wired to `refetch()` with `isRetrying={isFetching}` (the `AssignmentQueue.tsx:48` analog). Orphaned imports (`AlertCircle`, `RefreshCw`) removed.
- `useScenarioSandbox.ts` — the `useScenarios` query carries a bounded `retry`: `false` on a 4xx `ApiError`, otherwise `failureCount < 2`. Measured effect below.
- `tests/e2e/95-sandbox-error.spec.ts` — 2 tests, forced (CDP) + natural, DOM-only verdicts, plus an instrument check that the force actually fired.

**The bounded retry is measured, not asserted.** The same spec against the same page:

| Tree                          | Test 1 (forced) | Test 2 (natural) |
| ----------------------------- | --------------- | ---------------- |
| pre-retrofit (3-retry ladder) | 18.0s (failed)  | 13.3s            |
| post-retrofit (max 2)         | 6.2s            | 8.2s             |

That collapsed window IS criterion 3: the ~7s during which a failing page was pixel-identical to a loading one.

## Task Commits

1. **Task 1: QueryErrorState retrofit + bounded retry** — `87964f17811e92a8219d878a0540e7bcfd75c623` (fix) — 2026-08-16T23:04:15+03:00
2. **Task 2: CDP forced-error oracle** — `4e40cbd46bbe4003a3ec589aa6c9c1b4ebad9b20` (test) — 2026-08-16T23:06:03+03:00

Content pinned at those shas (not at a moving HEAD):

```
git show 87964f178:frontend/src/routes/_protected/scenario-sandbox.tsx | grep -c QueryErrorState   → 2
git show 87964f178:frontend/src/domains/misc/hooks/useScenarioSandbox.ts | grep -c retry           → 3
git show 4e40cbd46:tests/e2e/95-sandbox-error.spec.ts | wc -l                                      → 163
```

## Gate observations (exit codes captured with `$?` immediately, never through a pipe)

### Task 1 gate — run verbatim, unedited

```
TASK1_GATE_EXIT=0                      # pre-commit, full gate incl. pnpm type-check
TASK1_GREP_POST_PRETTIER_EXIT=0        # post-commit, grep pins survive prettier's line wrap
TASK1_GATE_AT_HEAD_FINAL_EXIT=0        # final, full gate at HEAD
```

**Instrument test of the `Retry`-literal zero.** A count of 0 is only believable if the same
pattern returns non-zero against a tree that should have it:

```
git show HEAD:frontend/src/routes/_protected/scenario-sandbox.tsx | grep -cE '^\s*Retry\s*$'   → 1   (pre-edit blob)
grep -cE '^\s*Retry\s*$' frontend/src/routes/_protected/scenario-sandbox.tsx                   → 0   (after)
```

The zero is real, not a broken pattern.

### Task 2 gate — labelled `UNPROVEN — needs Task 1 landed`. Both directions drilled.

**RED, observed BEFORE the retrofit** (`/tmp/9503-drillB-red-final.log`, exact final spec text):

```
RED_FINAL_EXIT=1
  ✓  1 … unblocked scenarios request settles to content or error … (13.5s)
  ✘  2 … blocked scenarios request renders query-error-state … (18.2s)
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('tabpanel').getByTestId('query-error-state')
    Error: element(s) not found
  1 failed / 1 passed
```

Red for the RIGHT reason: the bespoke branch carries no `query-error-state` testid.

**GREEN, observed AFTER the retrofit** (`/tmp/9503-task2-green2.log`):

```
TASK2_GATE_EXIT=0
  ✓  2 … blocked scenarios request renders query-error-state with no spinner and no internal string (6.2s)
  ✓  1 … unblocked scenarios request settles to content or error, never a spinner past the budget (8.2s)
  2 passed (8.7s)
```

Note that only Test 1 discriminates. Test 2 passes in both worlds **by design** — it is the
natural-state check, written to accept either truthful outcome so a later fix to the 500 cannot
red it. Recorded explicitly so nobody later mistakes its green for evidence of the retrofit.

## Required records (plan `<output>`)

### 1. `to_regclass` diagnosis — recorded, NOT fixed

Read-only, via Supabase MCP against staging `zkrcjzdemdmwhearhfgg`:

```sql
SELECT to_regclass('public.scenarios');   -- → "scenarios"  (non-NULL)
```

**The table EXISTS.** This narrows — and partially refutes — research hypothesis A3 ("the 500 is
a DB-side cause: table missing on staging **or** RLS"). The missing-table half is dead; RLS or
something else in `listScenarios` remains. Criterion 3 does not require fixing it ("loads OR
shows an error"), and no fix was attempted. **The 500's root cause is still UNDIAGNOSED and
unowned** — see Issues Encountered.

### 2. Comparison-panel variant decision — NO variant B branch, and why

The plan's conditional was: own query → variant B; shares the primary query → skip. The panel
matched **neither** — a third case the plan did not anticipate. It has its own query
(`useCompareScenarios`), but that query is a stub whose `queryFn` cannot reject:

```ts
// frontend/src/domains/misc/hooks/useScenarioSandbox.ts:102
queryFn: () => Promise.resolve<ScenarioComparisonData>({ scenarios: [], total_scenarios: 0 }),
```

`isError` is therefore unreachable, and `ScenarioComparison` accepts only `data` and `isLoading`
— it has no error surface to wire. Adding a variant B branch would have added JSX that no oracle
can ever exercise. **Decision: skip, and record.** When the comparison query becomes real, it
gets variant B in that same change.

### 3. C9b triage — `frontend/tests/scenario-sandbox-verification.spec.ts`

**Colour: 5 passed / 4 failed (exit 1), identical serialized and parallel.** All four failures
attributed, none to this retrofit:

| Failing test        | Failure                                                                           | Attribution                                                                                |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| stats cards         | `locator('[class*="CardContent"]')` → element(s) not found                        | Bogus locator — no element emits a class containing `CardContent`. Fails in every version. |
| create-form dialog  | `beforeEach` `waitForSelector('input[type="email"]')` timeout on /login           | Dies during login, never reaches the page under test.                                      |
| filter controls     | strict-mode violation: `/search/i` placeholder matched **2** elements             | Second match is the AppShell topbar (`#topbar-search`, "Search dossiers, tasks, people…"). |
| switch between tabs | `locator.click` blocked — `.id-dialog-overlay` (z-9998) intercepts pointer events | A modal overlay open on load; the diff adds no dialog.                                     |

The two assertions research predicted would survive — the `h1` and the tabs — **both pass**.

**The decisive structural fact: no assertion anywhere in that spec discriminates the old error
markup from the new one.** Its only near-miss (`should display empty state`) ends in
`expect(hasEmptyState || hasScenarios || true).toBeTruthy()`, which is vacuously true. The spec
cannot go red on this retrofit even in principle.

**Separate finding, surfaced by having to run it (see Issues Encountered): the spec is
discovered by NO Playwright config.**

## Files Created/Modified

- `frontend/src/routes/_protected/scenario-sandbox.tsx` — bespoke error branch → `QueryErrorState variant="page"`; `isFetching` destructured; `AlertCircle`/`RefreshCw` imports removed
- `frontend/src/domains/misc/hooks/useScenarioSandbox.ts` — bounded `retry` on `useScenarios`; `ApiError` imported from `@/lib/api-client`
- `tests/e2e/95-sandbox-error.spec.ts` — NEW, 163 lines, `// @covers DEAD-03` on line 1, population definition in the header

## Decisions Made

- **No `console.error` diagnostic added**, unlike the `AssignmentQueue.tsx:44` analog. That analog logs from an early-return branch; here the error state lives inside a JSX ternary, so logging would have required restructuring the render or adding a `useEffect`. No criterion asks for it and the pre-existing branch logged nothing either — more code than value. Named here so the omission is a decision, not an oversight.
- **No new i18n keys.** `QueryErrorState` defaults to `common:errors.queryFailed.*` + `common:errors.retry`, which exist in both locales. Nothing was added to either locale file, so the both-locales-same-commit rule had nothing to bind. The now-unused `scenario-sandbox:errors.loadFailed` key was left in place — deleting locale keys is outside this plan's write set.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] The plan's CDP block pattern `['*scenario-sandbox*']` blanks the entire app**

- **Found during:** Task 2 (drill A, before any retrofit work)
- **Issue:** The SPA route, its Vite dev-server module URL, and the edge function all carry the
  string `scenario-sandbox`. The broad pattern also blocks
  `http://localhost:5173/src/routes/_protected/scenario-sandbox.tsx`, which `routeTree.gen.ts`
  imports eagerly — so the whole app fails to mount.
- **Observed, not reasoned:** run with the literal pattern, the failure screenshot is an **empty
  white viewport with no AppShell at all** (`/tmp/9503-drillA.log`,
  `test-results/…-chromium-en/test-failed-1.png`). A blank page is not the error state, and a
  spec that "passed" against one would be measuring its own block rather than the app.
- **Fix:** narrowed to `*/functions/v1/scenario-sandbox*` — the edge-function URL only
  (`api-client.ts:80-81` resolves edge calls to `${VITE_SUPABASE_URL}/functions/v1${path}`). The
  reasoning is written into the spec header so the next reader cannot "simplify" it back.
- **Verification:** post-fix the page renders and the error state appears (Test 1 green, 6.2s).
- **Committed in:** `4e40cbd46`

**2. [Rule 2 — Missing critical] The spec could have passed without the force ever firing**

- **Found during:** Task 2
- **Issue:** The deployed function 500s today, so the error state renders whether or not the
  block pattern matches anything. A silently-non-matching pattern would look green now and go red
  for the wrong reason the day someone fixes the 500 — a false-green with a delayed fuse.
- **Fix:** a `requestfailed` listener records network-layer deaths of the scenarios request and
  the test asserts at least one. This discriminates cleanly: a 500 is a **completed** response and
  fires `requestfinished`, never `requestfailed`. The verdict stays in the DOM; this only guards
  the instrument.
- **Drill C:** the first expected error text was wrong — asserted `'BLOCKED'`, Chrome actually
  reports a DevTools-initiated block as **`inspector`** (`TASK2_GATE_EXIT=1`,
  `Received string: "inspector"`). Every DOM assertion passed in that same run; only the
  instrument's expectation was wrong. Relaxed to `/inspector|blocked/i` so a Chrome rename cannot
  red a correct implementation. **This failure is also the proof the narrowed pattern matches the
  real edge-function URL** — the listener fired.
- **Committed in:** `4e40cbd46`

**3. [Rule 1 — Bug] Stale index entry after the Task 1 commit**

- **Found during:** post-commit verification
- **Issue:** `git status` showed `MM` on `scenario-sandbox.tsx`. The worktree matched HEAD exactly
  (`git diff HEAD` empty — both blob `271353192`); the **index** held the pre-prettier single-line
  blob, left by lint-staged. Harmless alone, but on this shared tree any sibling lane committing
  without a pathspec would have silently reverted prettier's formatting.
- **Fix:** `git reset -q HEAD -- <that one path>` — index only, worktree untouched, no other
  lane's paths involved.
- **Verification:** all three of my files report clean at HEAD.

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing-critical)
**Impact on plan:** All three were necessary for the oracle to measure what it claims to measure.
No scope creep — the write set is exactly the plan's three files.

## Issues Encountered

**1. Transient exogenous gate red — resolved on its own, recorded because it was observed.**

At 2026-08-16T20:07Z the Task 1 gate returned `TASK1_GATE_AT_HEAD_EXIT=2` on four `TS18048`
errors, **all four in `frontend/src/pages/DossierSearchPage.tsx`** — an **uncommitted** (` M`)
file owned by plans 95-01 and 95-05, not in this plan's `files_modified`. Zero errors named any
95-03 file (`grep -c` over the tsc log for `scenario-sandbox|useScenarioSandbox` → 0, while the
log carried 4 `error TS` lines, so the instrument was working and the zero was real). The gate was
**not edited and not worked around**. Re-run at 20:09Z: `RECHECK_EXIT=0`, then the full gate
`TASK1_GATE_AT_HEAD_FINAL_EXIT=0` — the sibling lane had finished its file. Final state green.

**2. The C9b consumer spec is dead — discovered by NO Playwright config. NOT FIXED, needs an owner.**

`frontend/tests/scenario-sandbox-verification.spec.ts` sits at `frontend/tests/*.spec.ts`, but
`frontend/playwright.config.ts:35` sets `testMatch: ['e2e/**/*.spec.ts','accessibility/**/*.spec.ts']`,
and the root config's `testDir` is `./tests/e2e`. Neither discovers it:

```
pnpm exec playwright test tests/scenario-sandbox-verification.spec.ts --project=chromium --list
  → Error: No tests found.  Total: 0 tests in 0 files   (exit 1)
```

Instrument-tested — the same command against `tests/e2e/activity-page.spec.ts` lists 2 tests, so
the zero is the config excluding this file, not a broken invocation. To get its colour at all I
had to run it under a scratch config (`frontend/playwright.c9b-9503.config.ts`), which was
**deleted immediately after** and never committed (`git status` confirms it is absent).

**Ship/no-ship decision, made here rather than left implicit:** this is a real defect — 9 tests
that everyone assumes are running and that have not run since `testMatch` was set — but the fix
(moving the spec under `tests/e2e/` or widening `testMatch`) touches files outside this plan's
write set, and 4 of its 9 tests are red on pre-existing defects, so a naive re-admission would
red CI. **Deliberately not fixed here; filed for an owner.** The condition that closes it: someone
owning the frontend Playwright config repairs the four locators and re-admits the spec. This
paragraph is the filing — it names the fix and the owner-shaped gap, so it does not become a thing
everyone assumed someone else had shipped.

**3. The `/scenario-sandbox` 500 remains undiagnosed and unowned.** Criterion 3 explicitly does
not require fixing it, and this plan did not. What is now known: `public.scenarios` exists, so it
is not a missing relation. What is not known: why `listScenarios` fails. No plan in Phase 95 owns
this.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Criterion 3 holds behaviourally and is guarded by a spec that drills both directions.
- 95-09 acceptance can re-run `pnpm exec playwright test tests/e2e/95-sandbox-error.spec.ts --project=chromium-en --no-deps` (needs the dev server up and `TEST_USER_*` in `.env.test`; the population is the dev-server surface because of `devModeGuard`).
- Carried forward, unowned: the 500's server-side root cause, and the dead C9b spec.

## Self-Check: PASSED

- `[ -f tests/e2e/95-sandbox-error.spec.ts ]` → true; 163 lines at `4e40cbd46`, not a stub.
- `git log --oneline | grep 95-03` → 2 commits, both present after sibling lanes committed over them.
- Both tasks' `<acceptance_criteria>` re-run at HEAD: Task 1 gate exit 0, Task 2 gate exit 0.
- Plan-level `<verification>`: retrofit gate green; e2e spec 2 tests `--no-deps` green post-retrofit; C9b colour recorded and attributed.

## BLOCKED

None. Both gates ran verbatim, unedited, and both were observed green at HEAD
(`TASK1_GATE_AT_HEAD_FINAL_EXIT=0`, `TASK2_GATE_EXIT=0`). The one red observed during the leg was
exogenous, attributed to a sibling lane's uncommitted file, and cleared without intervention —
recorded under Issues Encountered rather than here because it never blocked this plan's work.

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
