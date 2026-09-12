---
phase: 93-failure-visibility
plan: 08
subsystem: ui
tags: [react, tanstack-query, supabase-js, postgrest, playwright, error-states]

requires:
  - phase: 93-failure-visibility
    provides: "93-01's QueryErrorState (variant inline, data-testid query-error-inline) and the seven bilingual common:errors.* keys"
  - phase: 77-linear-activation
    provides: 'the Linear token utilities (text-ink) the failed-region label uses'
provides:
  - 'fetchStatsSummary rejects on any sub-query .error instead of returning a zero-filled object (D-02 site 6, D-21 class 1)'
  - 'useWidgetDashboard.widgetStates — per-widget { isError, isRefetching }, the state the widgetData aggregation discards (D-21 class 2)'
  - 'CustomDashboardPage renders one query-error-inline region per failed widget, labelled and independently retryable'
  - 'tests/e2e/93-custom-dashboard-error.spec.ts — the forced-rejection rendering oracle, drilled in both directions'
affects: [93-15, criterion-1-closing-derivation]

tech-stack:
  added: []
  patterns:
    - 'PostgREST results are checked and thrown BEFORE any catch is deleted — supabase-js resolves, it never rejects'
    - 'useQueries state read on every render, never inside useMemo: tracked proxies only subscribe to properties a render actually reads'
    - 'a widget whose query rejected leaves the grid and renders its own labelled inline error, so siblings are untouched'

key-files:
  created:
    - tests/e2e/93-custom-dashboard-error.spec.ts
  modified:
    - frontend/src/hooks/useWidgetDashboard.ts
    - frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx

key-decisions:
  - 'the stats failure renders as query-error-inline, NOT as em-dash figures — no stats-figure chrome exists to put an em-dash into (WidgetGrid has no stats-summary case); the plan named both and the inline variant is the reachable one'
  - 'failed widgets render in a labelled region ABOVE the grid rather than inside their grid tile, because WidgetGrid.tsx is outside files_modified; onReorder re-appends them so the persisted layout is never truncated'
  - 'the isolation control is quick-actions, not upcoming-events: fetchEvents queries calendar_entries.start_datetime, a column that does not exist'
  - 'widgetStates is computed per render, not memoised — a useMemo that never re-runs never reads isError, so it would stay false forever'

patterns-established:
  - 'Every falsification drill states which single variable it mutated and re-runs the unmutated tree to prove attribution'
  - 'A dev-server freshness probe must target a CODE token: Vite strips comments, so a comment-based probe reads stale on a fresh server'

requirements-completed: [TRUST-01]

duration: ~40 min
completed: 2026-08-16
---

# Phase 93 Plan 08: Custom Dashboard Stats Seam Summary

**`fetchStatsSummary` now throws each PostgREST sub-query's `.error` before its zero-filled catch was deleted, `useWidgetDashboard` stops laundering per-widget `isError` out of its aggregation, and `CustomDashboardPage` renders one retryable `query-error-inline` region per failed widget — proven by a forced-rejection oracle drilled RED on the restored swallow and GREEN on the fix.**

## Performance

- **Duration:** ~40 min (entry not stamped; derived from first commit `1ae0e2d0` at
  `2026-08-16T00:48:32+03:00` through close, plus ~18 min of pre-commit baseline and gate work)
- **Completed:** 2026-08-15T22:07:50Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## THE GATE DRILL — every gate observed RED before and GREEN after

`ACCEPTANCE-P93-EXEC.md` condition 1. Commands are the plan's `<automated>` text run **verbatim**;
output is pasted, not paraphrased. **No gate text was edited.**

| gate                            | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                                                 | GREEN after (command + output)                                                                                                                                             | notes                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-08_g1** (site-6 fix shape) | `cd frontend && F=src/hooks/useWidgetDashboard.ts && test -f "$F" && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -c 'Failed to fetch stats summary')" -eq 0 && test "$(awk '/async function fetchStatsSummary/,/^  }$/' "$F" \| grep -c 'throw')" -ge 1 && pnpm type-check` → `EXIT=1`. Attribution diagnostic (separate command, gate untouched): `catch-string count: 1`, `throw count in awk range: 0` — **both subject conjuncts red, on the subject** | same command → `EXIT=0`. Diagnostic: `catch-string count: 0`, `throw count in awk range: 1`                                                                                | **C2 satisfied:** the red came from the two subject conjuncts, not from tooling. **C3 pre-checked:** `type-check` exists in `frontend/package.json` (`"tsc --noEmit"`) and its **baseline on the untouched tree was `EXIT=0`** (`/tmp/93-08-tc-baseline.txt`), so the last conjunct was reachable and not pre-red. Re-run at close: `EXIT=0`. |
| **93-08_g2** (page + oracle)    | Conjunct 1 on the untouched tree: `grep -q 'query-error-inline\|QueryErrorState' src/pages/custom-dashboard/CustomDashboardPage.tsx` → `EXIT=1`; spec file `No such file or directory`. **That is subject-absent, so the real red is the drill below.**                                                                                                                                                                                                       | gate verbatim → `GATE-93-08_g2 EXIT=0`; `✓ 1 [chromium-en] › …blocked stats sub-queries render the inline error, never zeros, sibling intact (10.4s)` / `1 passed (10.7s)` | The subject-absent red is the C1-clause-2 case the standard says only a constructed done state resolves. Done state constructed; the discriminating red is the single-variable drill below.                                                                                                                                                   |

### The g2 falsification drill — one variable, on an otherwise-GREEN tree

The gate is only worth its green if it can go red **for the defect it guards**. Drilled by restoring
the pre-fix swallow (the outer `try { … } catch { return zeros }`) in `fetchStatsSummary` and
changing nothing else, against a dev server proven byte-equivalent to the mutated disk:

| state                              | result                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| swallow RESTORED (single mutation) | `✘ 1 failed` — `Locator: getByTestId('widget-error-region').filter({ hasText: 'Stats summary probe' })`, `Expected: visible`, `Error: element(s) not found` |
| swallow removed (shipped state)    | `✓ 1 passed`                                                                                                                                                |

So the oracle measures **the plan's actual subject**: with the catch back, the four denied counts
resolve to zeros, the query SUCCEEDS, and no error is rendered — exactly the lie D-21 describes.

### Three instrument failures on the way there, recorded because each produced a confident wrong reading

**1. My first "RED" was not attributable, and I only found that by reverting it.** I mutated the
page's `hasFailed` to `false`, saw the spec fail, and would have banked that as the RED. Reverting
the mutation produced the **identical** failure — the tree was already broken for an unrelated
reason. Per C2, a red that survives the removal of its supposed cause is not a red for that cause.
Rule: every drill re-runs the unmutated tree before the red is recorded.

**2. The unrelated reason was a real bug in my own Task 1 work** — see Deviations, Rule 1. It was
invisible to `g1`, `type-check`, ESLint and Prettier, and visible only to the render oracle. This is
the plan's own thesis landing on its author: a source-shaped gate cannot close a render-state claim.

**3. My dev-server freshness probe was itself broken, and it lied in both directions.** I probed
`curl <vite>/src/hooks/useWidgetDashboard.ts | grep -c 'DRILL MUTATION'` — but **Vite strips
comments from served modules**, so a comment-based probe reads `0` on a perfectly fresh server. That
produced (a) a false "server is stale" verdict, and then (b) a drill run that **passed with the
swallow restored**, which I nearly recorded as "the oracle is vacuous". Re-probed with a _code_
token and the picture inverted:

```
== valid probe: the drill's zero-fallback literal (code, not comment) ==
5199 served: 1   5173 served: 0   disk: 1        <- :5173 genuinely stale, :5199 fresh
== are comments stripped in the served module? ==
0                                                <- the comment probe was the broken instrument
```

`:5173` (a long-running shared dev server) **was** serving stale modules for a period. Rather than
kill a server sibling lanes may be mid-run against, I stood up a dedicated one on `:5199`, took the
RED there via `E2E_BASE_URL`, then killed it. Before the verbatim GREEN I proved `:5173` had caught
up, on four code tokens across both modules:

```
--- port 5173 vs disk (code tokens, comments are stripped server-side) ---
  openWorkItems: 0                           served=0 disk=0
  if (result.error) throw result.error       served=1 disk=1
  widgetStates                               served=2 disk=2
  const widgetStates = widgets.reduce        served=1 disk=1
  widget-error-region (page module)          served=1 disk=1
```

Only then was the gate run verbatim. **The verbatim GREEN above is from `:5173` with that
precondition established, not from the dedicated server.**

## C9b — cross-phase consumer sweep

Ran the GATE-STANDARD C9b derivation anchored to `phase-93-base`, plus the widened rendered-identity
pass the clause requires:

| identifier                                                                     | consumers in `tests/` |
| ------------------------------------------------------------------------------ | --------------------- |
| `useWidgetDashboard`, `CustomDashboardPage`, `fetchStatsSummary`, `widgetData` | **NONE**              |
| widened: `custom-dashboard`, `dashboard-widget-layout`, `stats-summary`        | **NONE**              |

Also swept `frontend/tests` and `frontend/src/**` test files: no hits outside the source files
themselves (the `frontend/src/.understand-anything/*.json` matches are a git-ignored local
knowledge-graph cache, not tests). **No shipped spec asserts the DOM or response shape of either
file I modified**, so there is no consumer to update and no named non-consumer to declare.

## Task Commits

1. **Task 1: Site-6 fix shape + aggregation surfaces isError** — `1ae0e2d0` (fix)
2. **Task 2: CustomDashboardPage renders per-widget honesty + spec** — `17e1eadb` (feat)

Both used explicit pathspecs (`git commit -- <paths>`); sibling lanes held staged (`MM`) and
unstaged work in this shared tree throughout, and none of it was swept in. Each commit was verified
with `git show --stat <sha>` and a **pinned-sha** content read (`git show <sha>:<path>`), never
against `HEAD` — HEAD moved between my two commits (`339791b3` 93-04, `dca31b88` 93-07, `79b189ba`
93-14 all landed in the window). Post-commit deletion check on both: empty.

`1ae0e2d0` carried the initial `widgetStates` memo; `17e1eadb` carries its repair. The hook is
therefore correct only as of `17e1eadb` — stated so nobody cherry-picks the first commit alone.

## Files Created/Modified

- `frontend/src/hooks/useWidgetDashboard.ts` — `fetchStatsSummary` loses its outer `try/catch` and
  its zero-filled fallback; the four `Promise.all` results are checked in a loop and the first
  `.error` is thrown, matching the in-file convention at `:597,628,656,685`. Success-path counts
  read `?? 0`. New exported `WidgetQueryState` and a `widgetStates` record keyed exactly like
  `widgetData`, carrying `{ isError, isRefetching }` per widget.
- `frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx` — splits widgets on `isError`;
  failed ones render a `data-testid="widget-error-region"` tile carrying the widget title and
  `QueryErrorState variant="inline"` wired to that widget's `refreshWidget`; healthy ones go to
  `WidgetGrid`; `handleReorder` re-appends the failed set so a drag cannot truncate the layout.
- `tests/e2e/93-custom-dashboard-error.spec.ts` — one test, 92-template clone (inline auth,
  `--no-deps`, 15s retry-backoff budget). Aborts only `/rest/v1/dossiers` and
  `/rest/v1/unified_work_items` via a `page.route` **predicate** (not a URL glob), seeds the widget
  layout into `localStorage`, and asserts on the DOM: the labelled stats region is visible, contains
  `query-error-inline` and a "Try again" inside that region, contains **no** digit-0 chrome, the
  control widget renders its normal card and is NOT in an error region, and the page shell survives.

## Closing derivation — POPULATION DEFINITION (D-18)

**What this plan closed:** D-02 **site 6 of 6** (`hooks/useWidgetDashboard.ts:726`), plus D-21
**class 1** (unchecked supabase-js `.error`) and **class 2** (aggregation discarding `isError`), both
at this one seam.

**Measured, inside the population:** the four `fetchStatsSummary` sub-queries (1× `dossiers`, 3×
`unified_work_items`) and the `widgetData` → `CustomDashboardPage` aggregation.

**Explicitly OUTSIDE, and not swept:**

- **D-21 class 3** — the 26 `data: x = []` masks. Untouched here; fixed only at criterion-named
  surfaces by other plans. This plan's numbers say nothing about them.
- **Class 1 elsewhere.** The scan that produced "6 sites" is a `catch`-scan. `fetchStatsSummary` was
  the one class-1 instance _research named_; no repo-wide re-derivation of unchecked `.error` was
  run by this plan, so **1 is what was fixed, not what exists**.
- **The other widget fetchers.** `fetchKpiData` / `fetchChartData` / `fetchEvents` / `fetchTasks` /
  `fetchNotifications` / `fetchActivityFeed` already threw before this plan; this plan changed none
  of them. What changed is that their rejections now **render** instead of vanishing.
- **`WidgetGrid.tsx` / `WidgetContainer.tsx`** — outside `files_modified` and untouched.
  `WidgetGrid` still hardcodes `loadingState={{ isLoading, isError: false }}` and still derives
  `isLoading` from `!data`. That is precisely why the failed regions render outside the grid.

## Decisions Made

1. **Inline error, not em-dash figures.** The plan's Task 2 named "em-dash figures **or**
   query-error-inline". There is no stats-figure chrome to put an em-dash into: `stats-summary` has
   no case in `WidgetGrid.renderWidget`, so its success body is literally
   `Unknown widget type: stats-summary`. Building a stats renderer is a feature, not failure
   visibility. The must-have ("never four confident zeros") is met by the inline error.
2. **Failed regions render above the grid, labelled with the widget title.** `WidgetGrid.tsx` is not
   in `files_modified`, and the region a failed widget occupies is owned by that file. The page
   therefore renders its own labelled region so a user can still tell _which_ widget failed and
   retry _that_ widget. `handleReorder` re-appends the failed set — without it, dragging in edit mode
   would have called `setWidgets(healthyOnly)` and **permanently deleted the failed widgets from
   localStorage**. That was a data-loss bug I introduced and closed in the same edit.
3. **`quick-actions` is the isolation control, not `upcoming-events`** — forced by a measured
   defect, see Findings.
4. **`widgetStates` is not memoised.** See Deviations, Rule 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `widgetStates` inside `useMemo` made `isError` permanently false**

- **Found during:** Task 2 (the oracle would not go green, and the first drill's red proved
  unattributable)
- **Issue:** I first wrote the new aggregation as
  `useMemo(() => …widgetQueries[index]?.isError…, [widgets, widgetQueries])`. TanStack Query v5
  `useQueries` returns **tracked proxies**: a result property is only subscribed to once a render
  actually READS it. A memo that does not re-run never reads `isError`, so the observer never
  notifies on the pending→error transition, so the memo never re-runs. Self-sustaining: `isError`
  stayed `false` forever while the query sat in `error`. **The plan's own defect class, reproduced
  one layer up** — the fix moved the lie rather than removing it, which is exactly what D-21's
  closing rule warns about.
- **Evidence (temporary in-hook instrument, since removed):**
  `{"queries":[{"status":"error","isError":true,…}]}` was true in the hook while the page rendered
  `{"regions": [], "inline": 0}`.
- **Fix:** compute `widgetStates` on every render (a reduce over a handful of widgets). Reading the
  property each render is what subscribes to it. The reason is written into the code comment so the
  next author does not "optimise" it back.
- **Verification:** `inline: 2` in the DOM on the instrumented run; `1 passed` on the clean run.
- **Committed in:** `17e1eadb`

**2. [Rule 3 - Blocking] The planned isolation control widget is itself broken**

- **Found during:** Task 2 (the control widget entered `error` state before the spec blocked
  anything, making the isolation assertion unsatisfiable for an unrelated reason)
- **Issue:** `fetchEvents` selects/filters/orders `calendar_entries.start_datetime`. That column
  does not exist.
- **Fix:** switched the spec's control to `quick-actions` (zero network, always resolves). The
  reason is written into the spec header, not just here.
- **Committed in:** `17e1eadb`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** both were necessary for the plan's own must-haves to actually hold. No scope
creep — neither widened the file set beyond `files_modified`.

## Findings — filed, NOT fixed

**1. `fetchEvents` queries a column that does not exist, so the `upcoming-events` widget 400s on
every load — including on the DEFAULT dashboard.**

`useWidgetDashboard.ts:589-594` selects `start_datetime` from `calendar_entries` and both filters
and orders on it. Verified against staging `zkrcjzdemdmwhearhfgg` via Supabase MCP:

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='calendar_entries'
   and column_name in ('id','title_en','title_ar','entry_type','start_datetime',
                       'description_en','description_ar');
-- returns 6 rows; start_datetime is ABSENT
-- the real columns are event_date (date) + event_time (time without time zone)
```

Live browser evidence from the instrumented run: that query's error was
`column calendar_entrie…` (truncated by the instrument's slice, resolved by the SQL above).

**Not fixed, deliberately.** The phase boundary is explicit: _"This phase makes failures visible. It
does not make failing features correct."_ Repointing the query onto `event_date`/`event_time` is a
correctness change with a date/time-composition question attached, and no Phase 93 criterion names
it.

**Consequence the orchestrator must know:** `upcoming-events` IS one of the eight default widgets.
Before this plan its rejection reached `CustomDashboardPage` as `undefined` and rendered as a
perpetually-loading empty tile. **After this plan, a default `/custom-dashboard` visit renders a
visible inline error for that widget.** That is the phase's intended direction (an erroring widget
beats a lying one) but it is a NEW visible error on a default surface, so it belongs in the
intended-broken register alongside `/delegations`, not in a bug report.

**2. `stats-summary` has no renderer.** `WidgetGrid.renderWidget` has no case for it, so on success
it renders the literal string `Unknown widget type: stats-summary`. It is also not one of the eight
default widgets, which is why the spec seeds the layout. Pre-existing; out of scope; named so no
reader infers coverage of the stats widget's happy path.

## GATE CONCERN

**Not my gate to change — reported, not edited.**

`93-08_g1`'s last conjunct is `pnpm type-check`, a **whole-repo** `tsc --noEmit`. On this shared
working tree that makes a per-plan gate depend on every other lane's in-flight edits. It fired
mid-plan: while my two files were clean, the gate went red with

```
src/pages/Countries.tsx(31,37): error TS6133: 'error' is declared but its value is never read.
src/pages/my-work/components/WorkItemList.tsx(37,3): error TS6133: …
src/pages/WorkingGroupsPage.tsx(129,37): error TS6133: …
src/routes/_protected/scenario-sandbox.tsx(79,5): error TS6133: …
```

— four files in a sibling lane's uncommitted mid-edit state (confirmed by
`git diff -- frontend/src/pages/Countries.tsx`). It returned to `EXIT=0` unprompted once that lane
finished. Nothing about my subject changed in either direction.

This is a **C2 exposure shared by every plan in this phase whose gate ends in `pnpm type-check`**: a
red that is not attributable to the gate's subject, arriving at random times, on a tree several
authors write concurrently. It did not cost me a wrong verdict only because I re-ran and inspected
the filenames. An executor who takes the first red at face value will "fix" another lane's file.

**Ruling needed from the orchestrator, not from me:** either the shared-tree lanes serialise around
`type-check`, or executors are told the standing rule — a `type-check` red whose error paths are all
outside your `files_modified` is UNABLE TO MEASURE, re-run it, never repair it.

## Issues Encountered

Beyond the three instrument failures documented in the drill section: none. The pre-commit hook ran
on both commits (no `--no-verify`, no `HUSKY=0` on code paths) and passed both times.

## Known Stubs

None. No hardcoded empty values, no placeholder copy, no unwired data source. The one thing that
_looks_ like a stub — the `Unknown widget type: stats-summary` body — is pre-existing and unrelated
to this plan's changes (Finding 2).

## Threat Flags

None beyond the plan's register.

- **T-93-15** (Repudiation, `fetchStatsSummary`) — mitigated as planned: per-result throw landed
  before the catch was deleted; an RLS denial now rejects instead of rendering 0. Proven by the
  drill's RED/GREEN pair.
- **T-93-16** (Repudiation, `widgetData` aggregation) — mitigated: `isError` is carried through and
  a failed widget renders the inline error. Note this mitigation was **initially defective** and
  only landed in `17e1eadb` (Deviations, Rule 1).
- **T-93-SC** (Tampering, package installs) — holds: **zero installs**, `package.json` and every
  lockfile untouched.

No new network endpoint, auth path, file access pattern, or schema change. No user-controlled string
reaches the DOM: the failed region renders the widget's own configured title plus
`QueryErrorState`'s i18n copy — no `error.message`, no PostgREST code, no `details`.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- 93-15's closing derivation can cite this plan for D-02 site 6 and D-21 classes 1–2, and must carry
  the "outside the population" list above verbatim rather than implying class-3 coverage.
- The intended-broken register should gain one line: **`/custom-dashboard`'s upcoming-events widget
  visibly errors after this phase** (missing `calendar_entries.start_datetime`), until someone
  repoints that query. Same shape as `/delegations`, same reason.
- `STATE.md` / `ROADMAP.md` were **not** touched — the orchestrator owns them per this execution's
  standing rules, so the executor contract's `state.advance-plan` / `roadmap.update-plan-progress`
  steps were deliberately skipped.

## BLOCKED

None.

## Self-Check: PASSED

- `tests/e2e/93-custom-dashboard-error.spec.ts` — FOUND
- `frontend/src/hooks/useWidgetDashboard.ts` — FOUND
- `frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx` — FOUND
- commit `1ae0e2d0` — FOUND (`git show --stat`, 1 file, 59 insertions / 35 deletions)
- commit `17e1eadb` — FOUND (`git show --stat`, 3 files, 214 insertions / 22 deletions)
- both gates re-run at close: `93-08_g1 EXIT=0`, `93-08_g2 EXIT=0`
- tree integrity: `git status --porcelain` shows **no** uncommitted residue and **no** untracked
  files from this plan; every drill mutation was reverted and the reverted state is what shipped
- `pnpm exec prettier --check` on all three files → clean; `pnpm exec eslint --max-warnings 0` on
  both frontend files → `EXIT=0`
- the dedicated `:5199` dev server started for the drill was killed (`5199 down`); the shared
  `:5173` server was left running and untouched

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-16_
