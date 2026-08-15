---
phase: 93-failure-visibility
plan: 06
subsystem: ui
tags: [tanstack-query, error-states, playwright, cdp, analytics, i18n]

# Dependency graph
requires:
  - phase: 93-01
    provides: QueryErrorState shared component + the seven bilingual common:errors.* keys
provides:
  - analytics.repository.ts as thin apiGet wrappers — rejections propagate (TRUST-01 sites 1-3)
  - AnalyticsDashboardPage isError branch renders QueryErrorState, not error?.message
  - tests/e2e/93-analytics-error.spec.ts — the rendering oracle for criterion 1's exemplar
affects: [93-07, 93-08, 96-dead-05, 102-deleg]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Repository = bare apiGet call; the transport throws and TanStack Query owns the failure'
    - 'Forced-error oracle: CDP Network.setBlockedURLs + DOM-only assertions + inline auth --no-deps'

key-files:
  created:
    - tests/e2e/93-analytics-error.spec.ts
  modified:
    - frontend/src/domains/analytics/repositories/analytics.repository.ts
    - frontend/src/pages/analytics/AnalyticsDashboardPage.tsx

key-decisions:
  - 'D-01 applied literally: the three swallows were DELETED, not converted to a result union'
  - 'D-21 pairing held: swallow deletion and the consumer error-branch repair landed in ONE commit'
  - 'The spec forces the error via CDP rather than keying on the natural 404, so it survives Phase 96'

patterns-established:
  - 'Browser oracles must verify the SERVED module matches disk before trusting a green (see GATE CONCERN)'

requirements-completed: [TRUST-01]
# PARTIAL — this plan closes sites 1-3 of the six-site TRUST-01 population (D-02). Sites 4-6
# (useDossier.ts:683, useDossier.ts:738, useWidgetDashboard.ts:726) belong to 93-07/93-08. Do not
# read this field as "TRUST-01 done".

# Metrics
duration: ~80 min
completed: 2026-08-15
---

# Phase 93 Plan 06: Analytics Swallow Deletion + Honest Error State Summary

**The three `catch → return { data: null }` wrappers in `analytics.repository.ts` are gone and
`AnalyticsDashboardPage`'s `isError` branch renders the shared `QueryErrorState` instead of
`error?.message` — proven by a CDP-forced Playwright oracle that was drilled in both directions.**

## Performance

- **Duration:** ~80 min (first commit 2026-08-16T00:45:52+03:00, last 00:54:28+03:00; the bulk of
  the elapsed time is the two-direction gate drilling described below, not the edits)
- **Completed:** 2026-08-15T21:55:26Z
- **Tasks:** 2
- **Files modified:** 3 (2 modified, 1 created)

## THE GATE TABLE — every gate observed RED before and GREEN after

| gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | RED before (command + actual output)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | GREEN after (command + actual output)                                                                                                                                                                                                                                                               | notes                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **93-06 T1 `<automated>`** — `cd frontend && F=src/domains/analytics/repositories/analytics.repository.ts && test -f "$F" && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -c 'data: null')" -eq 0 && grep -q 'query-error-state\|QueryErrorState' src/pages/analytics/AnalyticsDashboardPage.tsx && test "$(grep -v '^[[:space:]]*//' src/pages/…Page.tsx \| grep -vE 'console\.\|throw \|new Error' \| grep -cE 'error\?\.message\|error\.message')" -eq 0 && pnpm type-check` | Run at the pre-task tree → **`GATE1_EXIT=1`**. Attribution (C2), each sub-assertion measured separately: `file-exists: yes`, `data-null-count(non-comment): 3`, `QueryErrorState-present: 0`, `error.message-render-lines: 1` → `<AlertDescription>{error?.message \|\| t('errors.networkError')}</AlertDescription>`. The red is the SUBJECT (3 swallows, 0 shared component, 1 leak), not tooling.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Same command post-edit → `> tsc --noEmit` then **`GATE1_EXIT=0`**. Re-run at final HEAD after other lanes committed: source half still green.                                                                                                                                                       | Sound. C3: `pnpm type-check` resolves — `frontend/package.json:19 "type-check": "tsc --noEmit"`. C5: `test -f "$F"` precedes the count in the same `&&` chain, so a missing file cannot pass vacuously. C4: thresholds are `-eq 0`, max reachable (observed).      |
| **93-06 T2 `<automated>`** — `OUT=$(pnpm exec playwright test tests/e2e/93-analytics-error.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b1 passed'`                                                                                                                                                                                                                                                                                                 | **Two reds recorded, because the trivial one is not informative.** (a) _Subject-absent red_ — `git show phase-93-base:tests/e2e/93-analytics-error.spec.ts` → `fatal: path … exists on disk, but not in 'phase-93-base'`. Per C2 that is a weak red (the gate dies before reaching its subject). (b) **Constructed red (C1 clause 2, the real one)** — the swallow at site 1 was temporarily re-introduced in `analytics.repository.ts`, a FRESH vite server started on :5199 (served module verified by `curl` to contain the restored `catch`), then `E2E_BASE_URL=http://localhost:5199 pnpm exec playwright test … --no-deps` → **`GATE2_RED_DRILL_EXIT=1`**, `✘ 1 … (20.2s)`, `Error: expect(locator).toBeVisible() failed / element(s) not found` at spec line 65 (`await expect(errorState).toBeVisible(...)`). Red at the assertion of record. | Same command, tree restored, fresh server on :5199 (served module verified by `curl` to be the bare `apiGet` call) → **`GATE2_GREEN_SAME_INSTRUMENT_EXIT=0`**, `✓ 1 … (12.2s)`, `1 passed`. Then the exact plan command with the default baseURL → **`GATE2_EXIT=0`**, `✓ 1 … (10.0s)`, `1 passed`. | Sound. C6: `--no-deps` is passed on the run **and** on the count derivation. C4 threshold derivation: `pnpm exec playwright test … --no-deps --list` → `Total: 1 test in 1 file`, so the literal `1 passed` equals the spec's own test count and max == threshold. |

**Tree integrity after the drill (C1):** `git status --porcelain -- <the two source files>` run **from the
repo root** is empty and `git diff HEAD --stat -- <same>` is empty — the drill left the tree
byte-identical to the commit.

## GATE CONCERN

No gate text is wrong and nothing was edited. Two findings about the _instruments_, both of which
produced or nearly produced a false reading in this plan:

**1. The vite dev server on :5173 serves STALE modules — a browser oracle can go green against code
that is not on disk.** During the first RED drill the spec **passed** with the swallow restored.
The discriminating command (`curl http://localhost:5173/src/domains/analytics/repositories/analytics.repository.ts`)
showed the server was still serving the pre-drill module; a `touch` of the file did not invalidate
it either, and a second, freshly started server went stale in the same way after its first request.
The file watcher is not firing in this environment. **Consequence for the phase: any browser oracle
run against a long-lived dev server may be measuring code from before the edit.** This is the
false-green class the phase exists to kill, arriving through the environment instead of through gate
text. Mitigation used here, recommended for every remaining browser oracle in 93: before trusting a
green, `curl` the served module and confirm it matches disk; after a code change, RESTART the server
rather than relying on HMR. Every measurement in the table above was taken this way.

**2. A `git status --porcelain -- <path>` run from a drifted cwd returns empty for the wrong reason.**
After an earlier `cd frontend`, the cleanliness check resolved `frontend/frontend/src/…`, printed
`warning: could not open directory` to stderr, and printed nothing to stdout — indistinguishable
from "clean". Re-run from the repo root to confirm. This is GATE-STANDARD instance-2 (vacuous search
root) reappearing in a hand-run verification rather than in a gate.

## Accomplishments

- `analytics.repository.ts` is three bare `apiGet` calls: `data: null` count 3 → **0**. The transport
  already throws (`lib/api-client.ts` `apiGet` → `handleResponse` → `toApiError`), so the deletion
  alone reconnects repository → TanStack Query → the page's `isError` branch (D-01).
- `AnalyticsDashboardPage`'s `isError` branch renders `<QueryErrorState variant="page" onRetry={refetch} />`.
  The `error` object is no longer destructured, so no `error?.message` operand survives anywhere in
  the file — the D-21 pairing held inside one commit, so the lie was never traded for a leak.
- `tests/e2e/93-analytics-error.spec.ts` asserts the rendered state, not a status code: testid
  visible inside the 15s retry-backoff budget, `role="alert"`, a retry button **inside** the alert
  region, **zero** `tablist` (the fabricated success body is gone), and the page body text matching
  none of `/(42501|42703|42P01|permission denied|supabase|networkError|stack)/i`.

## Task Commits

1. **Task 1: delete the three swallows AND repair the page branch** — `692fe39a` (fix)
2. **Task 2: forced-error spec for /analytics** — `30abc14f` (test)

## Files Created/Modified

- `frontend/src/domains/analytics/repositories/analytics.repository.ts` — three try/catch wrappers
  deleted whole; each function is now the bare `apiGet` call. Module comment records _why_ the
  wrappers are thin, so the next author does not "helpfully" re-add a catch.
- `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` — `isError` branch renders the shared
  `QueryErrorState`; dropped the now-unused `error` destructure and the orphaned `AlertTitle` import.
- `tests/e2e/93-analytics-error.spec.ts` — the CDP forced-error oracle (80 lines).

## Decisions Made

- **The spec forces the error rather than asserting the natural one.** `GET /analytics-dashboard`
  returns **404** today (measured: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/analytics-dashboard?time_range=30d`
  → `404`; direct to the express backend on :5001 → `404`), so `/analytics` errors on a natural
  visit. Keying the oracle on that would turn it red the moment Phase 96 (DEAD-05) lands real
  endpoints — for a correct change. Blocking at the network layer keeps the spec measuring the
  propagation path.
- **`organization-benchmarks` is blocked too.** The page's benchmark queries hit the same absent
  backend; blocking both keeps the forced state unambiguous.
- **No `requirements.mark-complete` was run.** TRUST-01 spans six sites and this plan closes three;
  the orchestrator owns REQUIREMENTS.md and the plans that close sites 4-6 (93-07/93-08).

## Deviations from Plan

**None** — plan executed as written. Two things the plan did not specify, both inside its stated
action ("no `error?.message` operand survives anywhere in the file"):

- The `error` field was removed from the page's destructuring (it had no other reader; leaving it
  would be an ESLint `no-unused-vars` error). The adapter hook still returns `error` in its declared
  shape — untouched, minimal diff.
- `AlertTitle` was dropped from the `@/components/ui/alert` import, orphaned by the deletion.
  `Alert` / `AlertDescription` remain — they are still used by the page's alerts list.

Both are covered by the executor's own-mess cleanup rule, not by a deviation rule. `pnpm exec eslint`
on both files: exit 0, no warnings.

## Intended-broken register — untouched

`/delegations`, `/admin/data-retention` legal-holds, `/admin/field-permissions` filters, and
`AUDIT-DROP-01` / `AUDIT-ZERO-01` were not touched, read, or "opportunistically" repaired.

## Issues Encountered

The stale-dev-server false green (see GATE CONCERN 1). It was caught by running the discriminating
command instead of accepting the pass — the first drill run reported `1 passed` with the defect
deliberately re-introduced, which is precisely a gate that cannot fail when the work is undone.

## C9b sweep — consumers across every shipped phase

Derivation run over `AnalyticsDashboardPage`, `analytics.repository`, `getAnalyticsDashboard`,
`getOrganizationBenchmarks`, `getCurrentStats`, `useAnalyticsDashboard`, and the rendered identity
`/analytics`. Candidates triaged:

| candidate                                                                            | verdict                                                                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `frontend/tests/unit/analytics.cluster.test.tsx`                                     | **non-consumer** — tests `ClusterVisualization`, never mounts the page                                             |
| `frontend/tests/a11y/wcag-aa-comprehensive-audit.spec.ts`                            | **non-consumer of the changed output** — `/analytics` appears only as a path in a route list it audits generically |
| `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` | **non-consumer** — `/analytics` is a navigation target string                                                      |
| `frontend/src/pages/Dashboard/components/AnalyticsWidget.tsx`                        | **non-consumer** — already renders `t('analytics.error')`; untouched, as the plan's `<interfaces>` states          |
| **`frontend/tests/e2e/analytics-dashboard.spec.ts`**                                 | **LIVE CONSUMER — see BLOCKED**                                                                                    |

## BLOCKED

**1. `frontend/tests/e2e/analytics-dashboard.spec.ts` — 3 prior-phase tests now fail for a CORRECT
change, and the file is outside this plan's `files_modified`, so I did not touch it.**

This is a GATE-STANDARD **C9b** instance: a shipped spec from an earlier phase, coupled to the
`/analytics` happy-path DOM, invisible to the planning sweep because it names the route rather than
the component or the repository. Measured, not inferred — both runs against a freshly started server
whose served module was `curl`-verified:

| tree state                                            | result                 |
| ----------------------------------------------------- | ---------------------- |
| swallow present (pre-change behaviour, reconstructed) | **8 passed, 1 failed** |
| swallow deleted (HEAD)                                | **5 passed, 4 failed** |

So this plan turns exactly **3** tests red:

- `:33 should display analytics dashboard with summary cards`
- `:56 should allow time range selection`
- `:86 should navigate between dashboard tabs`

They assert the `h1`, the `[role="combobox"]` time-range selector and the `[role="tablist"]` — all of
which are correctly replaced by `QueryErrorState` now that a 404 propagates instead of being
swallowed. The 4th failure, `:153 should have refresh button that triggers data reload`, **failed in
both runs** — pre-existing, not caused here.

**Decision needed from the orchestrator (I am not authorized to make it):** C9b says such a consumer
is either updated in the SAME task or recorded as a named non-consumer; it is a consumer, and its
file is not in my scope. The options, in the order I would rank them:

1. **Rewrite it as an honest-error spec now** (mirrors what 93-02 did to `92-delegations-error.spec.ts`:
   invert the assertions, and carry a comment naming Phase 96 / DEAD-05 as the flip-back point).
2. **Assign it to Phase 96 (DEAD-05)** — the phase that makes `/analytics` data real is the phase
   whose landing makes the happy-path assertions true again. Until then the spec is red in CI.

Option 2 leaves a knowingly-red spec in the tree for several phases, which is the condition that
makes reds unreadable. I recommend option 1, in a plan that owns the file.

**Nothing else is blocked.**

## Next Phase Readiness

- TRUST-01 sites **1-3 of 6** are closed. Sites 4-6 (`useDossier.ts:683`, `useDossier.ts:738`,
  `useWidgetDashboard.ts:726`) belong to 93-07/93-08 — and per D-21 site 6 needs the supabase-js
  `.error` destructure first, since deleting its catch alone changes nothing.
- `/analytics` renders the honest error state until Phase 96 (DEAD-05) lands real endpoints. Said
  out loud, as the plan's `<verification>` requires: **this is the intended post-phase state, not a
  regression.**
- Every remaining browser oracle in this phase should adopt the served-module check in GATE CONCERN 1.

## Self-Check

```
$ [ -f tests/e2e/93-analytics-error.spec.ts ]                      → FOUND
$ git log --oneline --all | grep -q 692fe39a                       → FOUND (Task 1)
$ git log --oneline --all | grep -q 30abc14f                       → FOUND (Task 2)
$ git show HEAD:tests/e2e/93-analytics-error.spec.ts | head        → content confirmed at HEAD
$ git show 692fe39a:frontend/src/domains/…/analytics.repository.ts → bare apiGet calls confirmed
$ git status --porcelain -- <both source files>   (from repo root) → empty
```

## Self-Check: PASSED

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_

---

## ADDENDUM — RULING-P93-04 Decision 1

**Scope widened by ruling to `frontend/tests/e2e/analytics-dashboard.spec.ts` only.** The three
tests that this plan's change correctly invalidated now assert the state the page actually renders.
Commit **`3d0ddc73`** (`test(93-06): invert the analytics happy-path oracle to the honest error state`).

### BEFORE — stated, then measured

Expected before running: **5 passed, 4 failed**, matching the BLOCKED table above. Command, verbatim
from the ruling, at the unmodified spec:

```
$ cd frontend && pnpm exec playwright test tests/e2e/analytics-dashboard.spec.ts --no-deps --reporter=line

  2 failed
    [chromium] › tests/e2e/analytics-dashboard.spec.ts:86:3 › Analytics Dashboard › should navigate between dashboard tabs
    [chromium] › tests/e2e/analytics-dashboard.spec.ts:153:3 › Analytics Dashboard › should have refresh button that triggers data reload
  7 passed (33.0s)
```

Second run, same tree: `2 failed / 7 passed (32.7s)`. **This is not the number I predicted, so it is
reported as the finding rather than tuned away.**

### FINDING — two of the three were not red, they were VACUOUS

`:33` and `:56` pass at HEAD. They do not pass because the page is correct; they pass because each
asserted a **disjunction with the loading skeleton** — `title-visible OR skeleton-visible`, and
`combobox-visible OR skeleton-visible` — inside a `.toPass` poll. The skeleton alone satisfies both.

Discriminating measurement (throwaway Playwright probe against the same server, sampling the DOM as
`/analytics` settles):

```
t=domcontentloaded h1= 0 skeleton= 0  combobox= 0 tablist= 0 errorState= 0
t=+300             h1= 0 skeleton= 64 combobox= 0 tablist= 0 errorState= 0
t=+700             h1= 0 skeleton= 0  combobox= 0 tablist= 0 errorState= 1
t=+1000            h1= 0 skeleton= 0  combobox= 0 tablist= 0 errorState= 1
t=+3000            h1= 0 skeleton= 0  combobox= 0 tablist= 0 errorState= 1
t=+8000            h1= 0 skeleton= 0  combobox= 0 tablist= 0 errorState= 1
```

The settled state carries **zero** h1, combobox and tablist and **one** error state. The skeleton
exists for a ~300–700ms window. Whether `:33`/`:56` go green is decided by which side of that window
the first poll lands on — which is why my earlier reading (cold server, fresh port) recorded them red
and today's (warm server) records them green. Both readings are real; the tests are races.

So the corrected characterisation of what this plan did to the file:

| test                                         | earlier claim | actual state at HEAD                                    |
| -------------------------------------------- | ------------- | ------------------------------------------------------- |
| `:33` should display … with summary cards    | red           | **vacuously green** — satisfied by the loading skeleton |
| `:56` should allow time range selection      | red           | **vacuously green** — same disjunction                  |
| `:86` should navigate between dashboard tabs | red           | **red** — `[role="tablist"]` never appears; correct     |

Only `:86` was deterministically red. That does not change the disposition: by the ruling's own
standard an assertion that passes whether or not the page is correct is worse than a red one, so all
three needed the same inversion, and the skeleton disjunct is gone from all three.

### The three tests changed

Each now waits for the **settled** error state and asserts it **positively**, then asserts its own
original subject **negatively**. No `.or()`, no removed expectation, no `test.skip`.

1. `should render the shared error state instead of summary cards` (was `should display analytics
dashboard with summary cards`) — `query-error-state` visible, `role="alert"`, retry button inside
   the alert region, and `heading level 1` count **0**.
2. `should not offer time range selection while the query is failing` (was `should allow time range
selection`) — error state visible, then `[role="combobox"]` count **0**.
3. `should not render dashboard tabs while the query is failing` (was `should navigate between
dashboard tabs`) — error state visible, then `[role="tablist"]` count **0**.

Titles were renamed as well as inverted, per the 93-02 precedent: a test titled "should allow time
range selection" that asserts the selector is absent is the same class of lie this phase exists to
kill.

A 27-line block comment above the three records **why** they inverted — TRUST-01, plan 93-06, the
propagating 404, and the vacuity finding above — and names **Phase 96 (DEAD-05)** as the flip-back
point with the exact assertions to restore. It also points at `tests/e2e/93-analytics-error.spec.ts`
as the CDP-forced oracle that survives Phase 96.

### AFTER — stated, then measured

Expected after the fix: **8 passed, 1 failed**, the 1 being the refresh test.

```
$ cd frontend && pnpm exec playwright test tests/e2e/analytics-dashboard.spec.ts --no-deps --reporter=line

  1 failed
    [chromium] › tests/e2e/analytics-dashboard.spec.ts:151:3 › Analytics Dashboard › should have refresh button that triggers data reload
  8 passed (32.8s)
```

Re-run **after** the commit, because the pre-commit hook runs `eslint --fix` + `prettier --write` and
a green measured before that hook is a green on a different file. Content pinned:
`git show 3d0ddc73:frontend/tests/e2e/analytics-dashboard.spec.ts | shasum -a 256` ==
`shasum -a 256` of the worktree file == `1b20c56c91804de1295444d7099121cd8b9b78a7…`; re-run at that
sha → **`1 failed / 8 passed (32.7s)`**. `pnpm exec eslint tests/e2e/analytics-dashboard.spec.ts` →
exit 0.

**Determinism check** — given that I had just proved two of these tests were races, "it passed once"
is not evidence. `--repeat-each=3` (27 tests): **`24 passed (47.0s)`**, and the failure summary lists
`:151` three times and nothing else. The three inverted tests are 3/3, on the settled state.

### `:153` was left exactly as it is

`should have refresh button that triggers data reload` is **unchanged, byte-identical, and still
failing.** `git diff -- tests/e2e/analytics-dashboard.spec.ts` filtered for that test's lines returns
nothing; its line number moved `153 → 151` only because the header comment above it is shorter than
the block it replaced.

Why it was left: it **failed in both directions** of the original measurement — with the swallow
present and with it deleted — so it is not caused by this plan and repairing it here would fold an
unrelated fix into a scoped ruling. It is filed as **`E2ESTALE-01`, owner Phase 101**, with this
plan's measurement as its evidence. Its failure is unrelated to the error state: it clicks
`button:has(svg)` `.first()`, which resolves to the AppShell's `aria-label="Open navigation menu"`
button — hidden at desktop widths (`lg:hidden`) — and times out waiting for it to become visible.
That is a selector that was always fragile, not an analytics regression.

### Files changed by this addendum's work

- `frontend/tests/e2e/analytics-dashboard.spec.ts` — three tests inverted and renamed, the
  file-header "Validates" block corrected, an `ERROR_STATE_TIMEOUT` constant with its timing
  rationale added, and the flip-back comment. Nothing else in the file touched.

No source file was modified. No `<automated>` gate text was edited. `.planning/STATE.md` and
`ROADMAP.md` were not touched.

## BLOCKED

**None.**

---

_Addendum: RULING-P93-04 Decision 1_
_Completed: 2026-08-16_
