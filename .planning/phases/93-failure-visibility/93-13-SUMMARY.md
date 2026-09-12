---
phase: 93-failure-visibility
plan: 13
subsystem: ui
tags: [tanstack-router, loader, notFound, supabase, rls, playwright, trust-03]

requires:
  - phase: 93-01
    provides: the shared QueryErrorState component + common:errors.* i18n keys
provides:
  - a loader on /reports/$reportId that gates the route on report existence
  - a route-level errorComponent rendering QueryErrorState (variant page)
  - tests/e2e/93-report-notfound.spec.ts — the honest-disjunction not-found oracle
  - live measurement that the custom_reports by-id read returns 42P17 today (WRITE-06)
affects: [94-write-06, 102-delegations]

tech-stack:
  added: []
  patterns:
    - 'fetch-in-loader (first in this tree): queryClient singleton + ensureQueryData + throw notFound()'
    - 'route-level errorComponent preempts the router default so no internal string reaches the DOM'

key-files:
  created:
    - tests/e2e/93-report-notfound.spec.ts
  modified:
    - frontend/src/routes/_protected/reports/$reportId.tsx

key-decisions:
  - 'The loader gates existence ONLY; it does not feed the stub builder hook. useReportBuilderState stays untouched.'
  - 'No retry override on the existence query — the tree default ladder is kept, and the spec budgets 15s for it.'
  - 'Arm A (404) was positively controlled with a scratch page.route() spec rather than by mutating source or DB policy.'

patterns-established:
  - 'Honest-disjunction oracle: the unconditional conjunct is asserted alone; the arm actually taken is printed and annotated, never inferred.'

requirements-completed: [TRUST-03]

duration: 46 min
completed: 2026-08-15
---

# Phase 93 Plan 13: Report-Builder Not-Found Summary

**The report-builder route got the fetch it never had — a loader that runs a `custom_reports`
by-id read, throws `notFound()` on an absent row and routes a rejection to its own
`QueryErrorState` — so `/reports/<absent-id>` can no longer render a fresh empty builder that
looks like the report.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-08-15T22:15:00Z (approx.)
- **Completed:** 2026-08-15T23:01:05Z
- **Tasks:** 2
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments

- `/reports/<well-formed absent id>` renders a page-level honest state instead of a builder.
- The `42P17` hazard is named in the route file, the spec header, and this summary, with Phase 94
  (`WRITE-06`) recorded as its owner.
- The hazard is no longer an assumption: **the live by-id read was measured** and returns
  `500 {"code":"42P17","message":"infinite recursion detected in policy for relation
\"custom_reports\""}` for the authenticated test user (assumption **A4** is now an observation).
- **Both arms of the disjunction were observed**, arm A via a scratch positive control, so the
  spec is not resting on an untested branch.
- Found and fixed a phase-wide evidence hazard: the shared dev server was serving **stale route
  modules** to every lane (see below).

## Task Commits

1. **Task 1: Loader + errorComponent on `$reportId.tsx`** — `572e6861` (feat)
2. **Task 2: Not-found spec with the honest disjunction** — `1d51571c` (test)

## GATE EVIDENCE — RED before, GREEN after

Every gate below was observed in both directions, with the commands and their actual output.

| gate                                                                                                                                                                                                                                                                                                 | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | GREEN after (command + output)                                                                                                                                                                                              | notes                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-13_g1** (Task 1 source gate + type-check)<br>`cd frontend && F='src/routes/_protected/reports/$reportId.tsx' && test -f "$F" && grep -q 'loader' "$F" && grep -q 'notFound' "$F" && grep -q 'errorComponent' "$F" && grep -q 'QueryErrorState' "$F" && grep -q '42P17' "$F" && pnpm type-check` | `GATE1_EXIT=1`. Per-token attribution run in the same tree: `ABSENT : loader` / `ABSENT : notFound` / `ABSENT : errorComponent` / `ABSENT : QueryErrorState` / `ABSENT : 42P17` — all five absent, so the chain short-circuits at its **subject** and never reaches `pnpm type-check`. C2-valid.                                                                                                                                                                                                                                                                                                                                     | `GATE1_FINAL_EXIT=0`, run on the committed tree. Per-token: `PRESENT: loader`, `PRESENT: notFound`, `PRESENT: errorComponent`, `PRESENT: QueryErrorState`, `PRESENT: 42P17`. `grep -cE "error TS" /tmp/tc-final.log` → `0`. | C3 checked: `type-check` **does** exist in `frontend/package.json` (`tsc --noEmit`), so the `cd frontend` prefix resolves. See **GATE CONCERN 1** — this gate transiently went red for a foreign reason mid-execution.                                  |
| **93-13_g2** (Task 2 spec gate)<br>`OUT=$(pnpm exec playwright test tests/e2e/93-report-notfound.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b1 passed'`                                                                                                              | **Two reds, and the second is the load-bearing one.**<br>(i) _subject-absent red_: `GATE2_EXIT=1`, stdout `Error: No tests found.`<br>(ii) **true negative control at the assertion of record**: the finished spec, byte-unchanged, run against a server serving the **pre-loader** route module → `1 failed`, `Error: neither the 404 page nor the query-error state rendered for an absent report id` / `Expected: > 0  Received: 0`, and the captured page snapshot shows the **builder** (`button "Table"`, `button "Bar Chart"`, … from `VisualizationSelector`). This is the lie the plan exists to kill, caught by this spec. | `GATE2_FINAL_EXIT=0`, run on the committed tree, verbatim, no env override:<br>`[93-13] observed arm -> B: query-error-state (read rejected — 42P17/WRITE-06, Phase 94)`<br>`1 passed (11.3s)`                              | C6 satisfied: `--no-deps` is present on every invocation including the red ones. Red (ii) arrived by accident (stale dev server) and is kept because it is exactly the control C1 asks for and could not otherwise be built without reverting the work. |

### Observed live behavior — which arm, and why

**Arm B.** Every run of the spec took the `query-error-state` arm, never the 404 arm. That is the
expected pre-Phase-94 render, and it is measured rather than inferred:

```
$ curl "$URL/rest/v1/custom_reports?select=id&id=eq.<random uuid>"  (authenticated test user)
{"code":"42P17","details":null,"hint":null,"message":"infinite recursion detected in policy for relation \"custom_reports\""}
HTTP_STATUS=500
```

The mechanism is visible in the live catalog — the two SELECT policies query each other:

| table            | policy (SELECT)                         | recursive clause                                                                                |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `custom_reports` | Users can view their own reports        | `EXISTS (SELECT 1 FROM report_shares WHERE report_shares.report_id = custom_reports.id AND …)`  |
| `report_shares`  | Users can view shares for their reports | `EXISTS (SELECT 1 FROM custom_reports WHERE custom_reports.id = report_shares.report_id AND …)` |

**Nothing was changed about these policies.** `WRITE-06` / Phase 94 owns them.

### Arm A positive control (C1 clause 2 — the constructed done state)

Arm A (`throw notFound()` → root 404) is **unreachable against the live DB today**, because the
read rejects for every id. Rather than record it as untested, it was constructed without mutating
source or database: a scratch spec used `page.route('**/rest/v1/custom_reports*')` to answer `[]`
(which `.maybeSingle()` resolves to `{ data: null, error: null }` — the exact "read succeeded, row
absent" condition), exercising the real loader.

```
✓  1 [chromium-en] › CONTROL arm A: read succeeds with no row -> root 404, not a builder (3.3s)
   1 passed
```

The control asserted the 404 numeral visible, `query-error-state` count 0, and builder heading
count 0. The scratch file was **deleted**; `git status --porcelain` for my two paths afterwards is
empty, and neither commit contains it.

## GATE CONCERN

**GATE CONCERN 1 — `93-13_g1`'s trailing `pnpm type-check` is repo-wide, so on a shared tree with
concurrent lanes it can go red for a subject it does not own.** Not edited; recorded as instructed.

Observed twice during this plan, at two different moments, from two different lanes' uncommitted
work-in-progress:

```
# before my edit (baseline):
src/components/dossier/DossierShell.tsx(15,16): error TS6133: 'notFound' is declared but its value is never read.
… 7 errors, all in DossierShell.tsx  → TYPECHECK_BASELINE_EXIT=2

# after my edit (those gone, a new lane's WIP arrived):
src/domains/tags/hooks/useTagHierarchy.ts(10,1): error TS6133: 'supabase' is declared but its value is never read.
→ GATE1_EXIT=2, with ZERO errors attributable to my file
   (`grep -c 'reports/\$reportId' /tmp/tc-after.log` → 0)
```

Both foreign error sets cleared as those lanes landed, and the gate's final verbatim run is
**exit 0 with zero type errors** — so this plan is not blocked by it. The concern is that a red
here is **not attributable to the gate's subject** (C2), and a later executor seeing it could
either chase a foreign error or, worse, treat the red as their own and "fix" another lane's
in-flight file. The orchestrator may want a scope-attribution step (`errors in $reportId.tsx == 0`)
rather than whole-repo `tsc` for per-plan source gates on a shared tree. **No gate text was
edited.**

## PHASE-WIDE FINDING — the shared dev server was serving stale route modules

This is not scoped to my plan and is the most consequential thing found. It is reported here
because it silently invalidates e2e evidence.

The dev server on `:5173` (pid 21862, started 2026-08-16 00:59:26 local) had **not picked up the
change to my route file**, while picking up other lanes' component edits normally. Vite served the
pre-edit transform:

```
$ curl 'http://localhost:5173/src/routes/_protected/reports/$reportId.tsx?import'
export const Route = createFileRoute("/_protected/reports/$reportId")({
  component: TSRSplitComponent          # <- no loader, no errorComponent
});
```

A `touch` and cache-busting query params did not clear it; a freshly started server on `:5199`
served the correct module immediately (`ensureQueryData` present, `errorComponent` split emitted).
Root cause is a stale TanStack-Router-plugin route-file transform, not my code — but note the
contrast: `TagAnalytics.tsx` (a plain component another lane had edited) **was** fresh on the same
server, so "the dev server is up and picking up changes" was true and misleading at the same time.

**Impact.** Any Playwright evidence produced against `:5173` during that window was measuring
stale route modules. Playwright's `reuseExistingServer: !CI` means every lane silently reused it.

**Action taken.** After confirming no Playwright or Vitest run was active, the stale server was
replaced with a fresh one on the same port, and the replacement verified to serve the loader
(`ensureQueryData` count = 1) before any gate was run. Every gate result recorded above is from
after that replacement, verbatim, with **no `E2E_BASE_URL` override**.

**Recommendation for the orchestrator:** lanes producing route-level e2e evidence in this phase
should confirm the served module matches disk before trusting a green — a one-line
`curl … | grep -c <new symbol>`. A green from a stale server is indistinguishable from a real one.

## C9b — cross-phase consumer sweep (candidates triaged, no action taken)

Derivation run against `phase-93-base` with **derived** test roots (four found: `./frontend/tests`,
`./tests`, `./backend/tests`, `./e2e/tests` — never hardcoded), identifier `reportId` after
stripping the `$` router marker.

Two instrument notes, since the standard says to treat a sweep's first run as an instrument test:
the published script's escape `sed` is **GNU-only** and dies on macOS BSD `sed` with `unbalanced
brackets`, silently emptying the identifier; and `$ROOTS` must be word-split, which **zsh does not
do by default** — under zsh it passes all four roots as a single path and `grep` reports "No such
file or directory". Both were run under `bash` with the escape skipped (`reportId` carries no
metacharacter after the `$` strip). Worth folding into the standard.

**Result: 10 candidates, all NAMED NON-CONSUMERS.**

| candidate                                                                                                                                                                                                                                                                                                | verdict                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/tests/contract/intelligence-reports-{embedding,get}.test.ts`, `backend/tests/contract/test_intelligence_reports_{embedding,get}.ts`, `backend/tests/integration/{vector-fallback,retention,auto-scaling}.test.ts`, `backend/tests/integration/test_{vector_fallback,retention,auto_scaling}.ts` | **NON-CONSUMER (all 10).** In every one, the match is the local variable `const reportId = createdReport.id;` in the `intelligence_reports` backend domain — a different table from `custom_reports`, asserted over HTTP responses, not DOM. A frontend router change cannot reach them. Not run. |

Widened by rendered identity, per the clause: `grep -rlE "goto\([^)]*/reports/"` over all four
roots → **NONE**; `grep -rlE "\b(ReportBuilder\|custom_reports)\b"` → **NONE**. So no shipped test
asserts this route's output, and the new spec is its first consumer.

**Population definition:** all `*.ts`/`*.tsx` under the four derived test roots. **Outside it:**
tests coupled by shape alone (role + visible text, naming no identifier) — the residual class C9b
itself says a sweep cannot see.

## Files Created/Modified

- `frontend/src/routes/_protected/reports/$reportId.tsx` — added `loader` (queryClient singleton →
  `ensureQueryData` a `custom_reports` by-id read → `throw notFound()` when the row is absent),
  added `errorComponent` rendering `QueryErrorState variant="page"` with retry wired to
  `router.invalidate()`, and the `42P17` hazard comment at statement position naming Phase 94 as
  owner. The component and its container markup are unchanged.
- `tests/e2e/93-report-notfound.spec.ts` — one test, inline auth, `--no-deps`, 15s retry-ladder
  budget, DOM-only. Unconditional conjunct: builder heading count 0. Disjunction over which honest
  state rendered, with the arm printed and pushed to `test.info().annotations`.

## Decisions Made

- **The loader gates existence only.** It does not feed `useReportBuilderState`, which remains the
  stub that ignores `initialReportId`. Rebuilding that hook is not this plan's scope, and the
  happy path for an id that exists is byte-unchanged.
- **No `retry: false` on the existence query.** The tree's default retry ladder is kept for
  consistency (one less bespoke config), at the cost of ~7s before the error arm renders. The spec
  budgets 15s for exactly this, matching the Phase 92 template. If the wait proves objectionable in
  use, `retry: false` on this one query is the one-line change.
- **The query key is `['custom_reports', 'exists', id]`,** deliberately distinct from the report
  builder's own query keys so the existence probe never satisfies or invalidates a builder query.
- **Arm A was controlled by network interception, not by touching source or DB policy.** Editing
  the route to fake a null row would have left a window where the tree was wrong for other lanes;
  relaxing the RLS policy would have been an out-of-scope DDL change on shared staging.

## Deviations from Plan

None — plan executed as written. The scratch arm-A control and the dev-server replacement are
execution-environment work, not changes to the plan's deliverables; both are documented above and
left no trace in the tree.

## Issues Encountered

1. **Stale dev-server route module** produced a false red on `93-13_g2` that looked exactly like
   "the loader does not work". Diagnosed by diffing the Vite-served transform against disk rather
   than by re-reading the source. Resolved by replacing the server. Fully documented above — and
   the false red was retained as the plan's best negative control.
2. **Foreign type errors from concurrent lanes** made `93-13_g1` red twice for subjects it does not
   own. Handled by attribution (`0` errors in my file) and by re-running verbatim once the tree
   settled. Filed as GATE CONCERN 1. No `git checkout`/`git restore` was used at any point; other
   lanes' uncommitted work was never touched.
3. **The C9b script is not portable to this machine as published** (BSD `sed`, zsh word-splitting).
   Worked around under `bash`; noted above so the next author does not lose the same time.

## Intended-broken register — confirmed untouched

- `/delegations` — not touched; still errors until Phase 102 (`DELEG-02` + `SEED-DELEG-01`).
- `/admin/data-retention` legal-holds — not touched; still errors (Phase 100 `RLS-AUTHUSERS-01`).
- `/admin/field-permissions` filters — not touched.
- `AUDIT-DROP-01` / `AUDIT-ZERO-01` — not touched; remain filed to Phase 94.
- `GRANT SELECT ON auth.users` — never proposed, never applied. The only SQL executed this plan was
  a read-only `pg_policies` catalog query and one authenticated PostgREST GET.

## Known Stubs

- `useReportBuilderState` (`frontend/src/domains/misc/hooks/useReportBuilder.ts`) remains a stub
  that ignores `initialReportId` and returns `EMPTY_CONFIGURATION` with no-op mutators. **This is
  intentional and out of scope**: TRUST-03 asks that an absent id not render as if the report
  exists, which the loader now guarantees. Making an _existing_ report's data load into the builder
  is a separate feature, not a failure-visibility repair. The route's own header comment records
  this so the next reader does not mistake the loader for a data path.

## Next Phase Readiness

- **Phase 94 (`WRITE-06`) has a ready-made verification:** once the `custom_reports` ↔
  `report_shares` SELECT recursion is fixed, this spec should flip from arm B to arm A on its own,
  with no code change. Phase 94 then deletes arm (b) from the disjunction and asserts the 404 arm
  only — the spec's header carries that instruction. Leaving the disjunction in place after
  Phase 94 would let a rejection pass as a pass.
- Nothing in this plan depends on `93-14` (the router `defaultErrorComponent` seam): rejections are
  caught by this route's own `errorComponent` and never reach the router default.

## BLOCKED

None.

## Self-Check: PASSED

- `frontend/src/routes/_protected/reports/$reportId.tsx` — FOUND on disk, present in `572e6861`.
- `tests/e2e/93-report-notfound.spec.ts` — FOUND on disk, present in `1d51571c`.
- Commits `572e6861` and `1d51571c` — both present in `git log`; both verified with
  `git show --stat HEAD` and a `git show HEAD:<file>` content read.
- Neither commit deletes a tracked file (`1 file changed, 65 insertions(+), 6 deletions(-)` and
  `1 file changed, 95 insertions(+)`; the 6 deletions are the replaced lines of the same file).
- Both gates re-run verbatim on the committed tree: `GATE1_FINAL_EXIT=0`, `GATE2_FINAL_EXIT=0`.
- No scratch artifact remains: `git status --porcelain` for both plan paths is empty.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_
