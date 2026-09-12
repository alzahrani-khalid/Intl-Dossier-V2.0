---
phase: 93-failure-visibility
plan: 12
subsystem: engagement-detail
tags: [TRUST-03, TRUST-04, D-05, D-06, D-06a, D-07, D-19, D-20]
requires:
  - 93-01 (QueryErrorState + common:errors.incompleteRecord.{title,description} in en AND ar)
provides:
  - 'engagement-dossiers degraded-200 contract: { engagement: null, dossier: {identity} }'
  - 'WorkspaceShell three-state render (degraded / not-found / error)'
  - 'tests/e2e/93-degraded-engagement.spec.ts — the three-way discrimination, live'
  - 'the notFound({ routeId: rootRouteId }) recipe: a component-thrown notFound() that actually
    reaches the root 404 page in @tanstack/react-router 1.170.8'
affects:
  - frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts (C9b LATE FIND — see below; NOT repaired)
tech-stack:
  added: []
  patterns:
    - 'server owns the absent/degraded distinction; the client never double-fetches to derive it'
    - 'notFound() thrown from a COMPONENT must pre-stamp routeId, or it lands in the error boundary'
key-files:
  created:
    - tests/e2e/93-degraded-engagement.spec.ts
  modified:
    - supabase/functions/engagement-dossiers/index.ts
    - frontend/src/components/workspace/WorkspaceShell.tsx
key-decisions:
  - 'D-06a honored structurally: the producer (server) landed and DEPLOYED before the consumer
    (WorkspaceShell) was written — no cross-plan C9a exposure for this contract'
  - 'The degraded body carries identity fields ONLY (id, name_en, name_ar, type, status)'
  - 'notFound({ routeId: rootRouteId }) — measured necessity, not style (see GATE table row g3-t2)'
requirements-completed: [TRUST-03, TRUST-04]
duration: ~55 min
completed: 2026-08-16
---

# Phase 93 Plan 12: Degraded Engagement Detail Summary

`engagement-dossiers` now answers a missing `engagement_dossiers` extension row with **200 + the
base dossier's identity** instead of the same 404 an absent id gets, and `WorkspaceShell` renders
the three states that distinction finally makes expressible — degraded (named, warn, `role="status"`),
not-found (root 404 page), and failed (`QueryErrorState`) — proven end-to-end against staging with a
constructed fixture.

- **Duration:** ~55 min (2026-08-16 01:47 → 02:14 +03, including 6 gate-3 measurement rounds)
- **Tasks:** 3/3 · **Files:** 2 modified, 1 created · **Commits:** 4

## Commits

| commit     | task                 | what                                                   |
| ---------- | -------------------- | ------------------------------------------------------ |
| `c21f09db` | 1                    | server: degraded-200 contract in the GET-single branch |
| `327ed703` | 2                    | WorkspaceShell: three distinct states                  |
| `a4c555b3` | 2 (amended during 3) | `notFound({ routeId: rootRouteId })`                   |
| `4b19d00c` | 3                    | `tests/e2e/93-degraded-engagement.spec.ts`             |

Every commit used an explicit pathspec; each was verified with `git show --stat HEAD` and, for
Tasks 1–2, `git show HEAD:<file>` content reads. No other lane's file was staged. Concurrent lanes
had uncommitted work in this tree throughout (`DossierShell.tsx`, `AttachmentUploader.tsx`,
`useTagHierarchy.ts`, `reports/$reportId.tsx`, `error-boundary/ErrorBoundary.tsx`,
`93-15-PLAN.md`, `tests/e2e/93-report-notfound.spec.ts`) — none of it entered my commits.

---

## GATE OBSERVATIONS — every gate RED before, GREEN after

| gate          | RED before (command + output)                                                                                                                                                                                                                                                                  | GREEN after (command + output)                                                                                                                                                                      | notes                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **g1** Task 1 | `F=supabase/functions/engagement-dossiers/index.ts && test -f "$F" && grep -q 'engagement: null' "$F" && grep -qE "type.{0,20}engagement" "$F"` → **`exit=1`**. Per-conjunct: `test -f`→0, `grep 'engagement: null'`→**1**, `grep -E "type.{0,20}engagement"`→0 (**12** pre-existing matches). | Same command → **`exit=0`**. Re-verified in the final pass: `g1 exit=0`.                                                                                                                            | **GATE CONCERN (weak conjunct)** — see below. The gate's whole discriminating power is `engagement: null`; the `type…engagement` conjunct was already satisfied by 12 pre-existing matches (`type: 'engagement'` in `createEngagement`, the `.eq('type','engagement')` filters) and could never have gone red. It is not vacuous _as a gate_ (the gate did go red), but that conjunct contributes nothing. |
| **g2** Task 2 | `cd frontend && F=src/components/workspace/WorkspaceShell.tsx && test -f "$F" && grep -q 'notFound' … && grep -q 'incompleteRecord' … && grep -q 'role="status"' … && grep -q 'QueryErrorState' … && pnpm type-check` → **`exit=1`**. Per-conjunct: all four greps → **1**.                    | Same command → **`exit=0`** (`tsc --noEmit` clean). Re-run verbatim after the `a4c555b3` amendment → **`exit=0`**; final pass → `g2 exit=0`. Plus `pnpm exec eslint <file> --max-warnings 0` → `0`. | **C2/C3 discharged.** `pnpm type-check` resolves in `frontend/package.json` (`"type-check": "tsc --noEmit"`) — the P92 instance-4 trap does not apply. Because `&&` short-circuits, the RED never reached `type-check`; I therefore measured the **type-check baseline separately** on the pre-change tree → **exit 0**, so the GREEN is attributable to my edit and not to a pre-existing red clearing.   |
| **g3** Task 3 | `OUT=$(pnpm exec playwright test tests/e2e/93-degraded-engagement.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b3 passed'` → **`exit=1`**, output `Error: No tests found.` (the spec did not exist — RED for its subject).                                       | Same command → **`exit=0`**, output `3 passed (19.0s)`; final pass re-run → `3 passed (18.6s)`, `g3 exit=0`.                                                                                        | **C6 discharged** — `--no-deps` is passed, so the `setup` project's tests are excluded from the count; the threshold 3 = the three states, one test each. **The GREEN took six measurement rounds; four intermediate reds were harness artifacts, one was a real defect.** Full account below.                                                                                                             |

### g3's six rounds — what each red actually was (C2: a red is only evidence if it reached the subject)

| #   | result               | cause                                                                                                                                                                                                                                                                                                              | classification                                                                                                                                                           |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | test 1 red           | Vite's module graph on the shared `:5173` dev server was serving a **stale** `WorkspaceShell.tsx`; the DOM showed the old titleless chrome. Confirmed by `curl :5173/src/…/WorkspaceShell.tsx \| grep -c incompleteRecord` → later 2.                                                                              | **UNABLE TO MEASURE** — harness staleness, not the subject                                                                                                               |
| 2   | test 1 ✓, test 2 red | first honest measurement: `throw notFound()` rendered `errorBoundary.title` — the `_protected` React `ErrorBoundary` swallowed the router's control-flow throw                                                                                                                                                     | real defect (downstream of a concurrent lane, see below)                                                                                                                 |
| 3   | test 2 red           | a sibling lane's in-flight `isNotFound` re-throw in `components/error-boundary/ErrorBoundary.tsx` was on disk but **not yet served** by `:5173` (`grep -c isNotFound`: disk **3**, served **0**)                                                                                                                   | **UNABLE TO MEASURE** — harness staleness                                                                                                                                |
| 4   | test 1 red           | ran against a private dev server on `:5175` to dodge the staleness — **`:5175` is not in the `ALLOWED_ORIGINS` Supabase secret**. Verified: `OPTIONS … -H "Origin: http://localhost:5175"` → `access-control-allow-origin: null`; `:5173` → `http://localhost:5173`. The blocked fetch rendered `QueryErrorState`. | **UNABLE TO MEASURE** — CORS, not the subject. (Silver lining: it is an unplanned positive control for test 3's discrimination.) Server killed; `:5175` has 0 listeners. |
| 5   | test 2 red           | `:5173` had caught up and the boundary re-throw was live — the throw now reached the **router's** `defaultErrorComponent` (`Something went wrong!` / `Hide Error`). This is the real, isolated defect.                                                                                                             | real defect                                                                                                                                                              |
| 6   | **3 passed**         | after `a4c555b3` (`routeId: rootRouteId`)                                                                                                                                                                                                                                                                          | GREEN                                                                                                                                                                    |

**The real defect, and why the fix is load-bearing rather than decoration.** Read from the installed
source, not inferred: `@tanstack/react-router@1.170.8`, `dist/esm/Match.js:74` computes
`routeNotFoundComponent` for a **non-root** route as `route.options.notFoundComponent` **only** —
`router.options.defaultNotFoundComponent` is _not_ consulted there, even though this app sets one
(`frontend/src/router/index.tsx:95`). So no `CatchNotFound` is built for `/_protected/engagements/$engagementId`;
the nearest boundary is that match's `CatchBoundary`, whose `onCatch` runs
`error.routeId ??= matchState.routeId` and rethrows. The root's `CatchNotFound` fallback then
executes `if (… error.routeId && error.routeId !== matchState.routeId …) throw error` — it **refuses**
the not-found because it is stamped with the child route's id — and the throw lands in
`defaultErrorComponent`. Pre-stamping `rootRouteId` (`'__root__'`, exported from
`@tanstack/react-router`) makes the `??=` a no-op and the root boundary accept it.

**Consequence worth escalating:** any _other_ `notFound()` thrown from a **component** in this app
has the same problem. `frontend/src/components/dossier/DossierShell.tsx:136` throws a bare
`notFound()` (a concurrent lane's uncommitted work at the time I read it). Loader-thrown
`notFound()` is unaffected — `Match.js:153-158` handles `match.status === 'notFound'` via
`renderRouteNotFound`, which _does_ fall back to `defaultNotFoundComponent` — so
`routes/_protected/reports/$reportId.tsx` (93-13, loader-thrown) is fine. This is a **cross-plan
finding**, filed below rather than fixed, because those files are outside this plan's
`files_modified`.

---

## Behavioural evidence beyond the gates

**Live probe of the deployed function** (real JWT for `$TEST_USER_EMAIL`; no secret echoed):

```
DEGRADED (00000000-0000-0052-0000-000000000001) -> 200 :: engagement=null dossier={"id":"…0001","name_en":"Phase 52 Kanban Fixture Engagement","name_ar":"مشاركة الإطار التجريبي للمرحلة 52","type":"engagement","status":"active"}
DEGRADED (7c0d830b-5dc7-4419-a0ad-ce550031712d) -> 200 :: engagement=null dossier={"id":"7c0d830b…","name_en":"Bilateral engagement with ONS — census methodology exchange",…}
ABSENT   (random uuid)                          -> 404 :: error.code=NOT_FOUND
HEALTHY  (b0000002-…-0002)                      -> 200 :: keys=[engagement,participants,agenda,host_country,host_organization]  dossierKey=false
```

The healthy body is unchanged (no `dossier` key, `engagement` populated), so the happy path is
byte-identical and the degraded body is unambiguously discriminable.

**Deploy evidence (Task 1, no shared ledger per the plan):**

```
$ supabase functions deploy engagement-dossiers --project-ref zkrcjzdemdmwhearhfgg
Deployed Functions on project zkrcjzdemdmwhearhfgg: engagement-dossiers
DEPLOY_EXIT=0
$ supabase functions list … → engagement-dossiers
{"slug":"engagement-dossiers","version":9,"status":"ACTIVE","updated_at_iso":"2026-08-15T22:50:18.106Z"}
```

**Staging is count-identical after the run** (the spec's teardown asserts its own DELETE, and this
independent query confirms it):

```sql
SELECT count(*) engagement_dossiers_total,
       count(*) FILTER (WHERE ed.id IS NULL) degraded_rows,
       count(*) FILTER (WHERE d.name_en LIKE 'P93-12%') p93_12_fixture_leftovers
FROM dossiers d LEFT JOIN engagement_dossiers ed ON ed.id = d.id WHERE d.type='engagement';
→ [{"engagement_dossiers_total":5,"degraded_rows":2,"p93_12_fixture_leftovers":0}]
```

Same 5 engagement dossiers and same 2 degraded rows as before the run; zero fixture leftovers.

**Fixture schema was derived, not guessed** (`supabase-migration-safety` §Verify CHECK/enum
constraints, run against the live staging schema): `dossiers` NOT-NULL-without-default =
`type`, `name_en`, `name_ar`; `dossiers_type_check` ∈ {country, organization, forum, engagement,
topic, working*group, person}; `dossiers_status_check` ∈ {active, inactive, archived, deleted};
`dossiers_sensitivity_level_check` 1..4; `name*{en,ar}`non-empty.`id`is left to`gen_random_uuid()`and read back, so the fixture can never carry a non-RFC UUID. The`dossiers`
SELECT policies are clearance-only (`sensitivity_level <= get_user_clearance_level(auth.uid())`),
so `sensitivity_level = 1` is readable by the test user.

---

## C9b sweep — consumers across every shipped phase

Run against `phase-93-base` (`be92f40e`) with **derived** roots, not hardcoded:
`ROOTS = ./frontend/tests ./tests ./backend/tests ./e2e/tests`.

| identifier                                                              | derivation                                   | result                                                                                                                        |
| ----------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `engagement-dossiers` (edge fn — parent dir, since basename is `index`) | `grep -rlE "\bengagement-dossiers\b" $ROOTS` | **no hits**                                                                                                                   |
| `WorkspaceShell`                                                        | `grep -rlE "\bWorkspaceShell\b" $ROOTS`      | **no hits**                                                                                                                   |
| `engagements` (widened, common noun)                                    | same                                         | 106 files — the candidate flood the standard warns about; triaged to the 7 specs that `goto()` an engagement **detail** route |

> **Instrument note, not a finding about this plan.** The C9b script as written in
> `GATE-STANDARD.md` uses unquoted `$ROOTS` for word-splitting. **This machine's `Bash` tool shell is
> zsh, which does not word-split unquoted parameters**, so the loop passes all four roots as one
> path and `grep` searches nothing while exiting cleanly — an implausibly-empty result of exactly
> the kind the clause tells you to distrust. I re-ran the whole sweep under `bash -c` and the
> numbers above are from that run. Recording it because the next executor on this machine will hit
> it silently.

### C9b LATE FIND — `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts` (measured, NOT repaired)

The identifier sweep **cannot see this one**: the coupling is by _data_, not by filename or symbol.
That spec's `FIXTURE_ID` defaults to `00000000-0000-0052-0000-000000000001`, which is one of the two
live degraded rows. Its first test navigates to `/engagements/${FIXTURE_ID}` and clicks the Tasks
tab — a region the degraded state now suppresses by contract (UI-SPEC §3).

Measured both directions, on the same command:

```
$ cd frontend && pnpm exec playwright test tests/e2e/_phase52-mid-drag-capture.spec.ts --project=chromium --reporter=list
BEFORE (pre-Task-2 tree):  1 passed (TasksTab mid-drag, 33.4s) · 1 failed (EngagementKanbanDialog, pre-existing)
AFTER  (post-Task-2 tree): 1 failed (TasksTab mid-drag — locator.click timeout on the Tasks tab)
```

**This is correct behaviour, not a regression to undo.** The P52 fixture dossier is a _broken seed_
— an engagement row with no extension row — and the app now says so instead of painting a titleless
shell over it. The spec is self-labelled `NOT a regression spec` (a screenshot-capture harness), and
its second test was already red before I touched anything.

**Not repaired, deliberately:** the file is outside this plan's `files_modified`, and the durable fix
is a _data_ repair (seed the missing `engagement_dossiers` row for `…0052…0001`) rather than
weakening the degraded state to keep a capture harness green. Filed below.

**Residual class this sweep cannot cover, stated per the standard:** a test coupled to
`WorkspaceShell` by _shape alone_ (e.g. `getByRole('status')` + text, naming no identifier) matches
no grep. The defence is running the shipped suite before the phase closes — which is Phase 101's
`E2ESTALE-01` scope, not something I could discharge here.

---

## Deviations from Plan

### [Rule 3 — Blocking issue] `notFound()` needed `routeId: rootRouteId` to reach the 404 page

- **Found during:** Task 3 (gate rounds 2 and 5)
- **Issue:** the plan's Task 2 action says "throw `notFound()` → root 404 page". A bare
  `notFound()` thrown from a component does **not** produce the root 404 page in
  `@tanstack/react-router@1.170.8` — it reaches the router's `defaultErrorComponent`
  ("Something went wrong") via the mechanism traced above. Task 3's test 2 asserts the 404 page, so
  the plan could not close as literally written.
- **Fix:** `throw notFound({ routeId: rootRouteId })`, with the full mechanism recorded in a comment
  at the call site so the next reader cannot mistake it for cargo cult.
- **Files modified:** `frontend/src/components/workspace/WorkspaceShell.tsx` (in `files_modified`)
- **Verification:** g3 test 2 red before / green after; g2 re-run verbatim after the amendment → 0
- **Commit:** `a4c555b3`
- **Scope note:** three larger alternatives were rejected for staying inside `files_modified` —
  a route `loader` existence gate (mirrors 93-13's `$reportId`, but a 4th file plus a happy-path
  timing change), a per-route `notFoundComponent` (a 4th file plus a duplicated 404 component), and
  patching the shared `ErrorBoundary` (a 5th file, and a concurrent lane was already editing it).

### [Rule 2 — Missing critical] Closed the last titleless-`<h1>` path

- **Found during:** Task 2
- **Issue:** the acceptance criterion is "no code path renders an empty-title header". With the
  three branches added, one path still fell through: `useEngagement` is `enabled: !!id`, so a falsy
  id leaves the query pending-but-not-fetching — `isLoading` false, `data` undefined — and the
  header rendered `<h1>{''}</h1>`. Unreachable via the router today (the param is always non-empty),
  but the criterion is stated mechanically, not probabilistically.
- **Fix:** `const isIdentityPending = isLoading || profile == null`, used for both the header and
  lifecycle-bar skeleton conditions.
- **Commit:** `327ed703`

**Total deviations:** 2 auto-fixed (1 × Rule 3, 1 × Rule 2). **Impact:** both are inside
`files_modified`; neither changes the plan's contract, and the Rule 3 one is what makes the
contract actually observable.

---

## GATE CONCERN

**g1's second conjunct cannot go red.** `grep -qE "type.{0,20}engagement"` over
`supabase/functions/engagement-dossiers/index.ts` matched **12** times on the pre-work tree
(`type: 'engagement'` in `createEngagement`/`handlePromoteIntake`, the `.eq('type','engagement')`
filters in `listEngagements`/`updateEngagement`/`archiveEngagement`). It is satisfied by code that
predates this plan and would remain satisfied if Task 1 were reverted.

The gate **as a whole** did go red and green for the right reason — `grep -q 'engagement: null'`
carries all of the discrimination — so this is not a false green and I did **not** edit it. But the
conjunct is decorative: it reads as if it verifies the degraded branch filters on the base row's
type, and it does not. If it were meant to pin the follow-up query's `.eq('type', 'engagement')`,
the honest form would target that call site specifically. Recording per the standing rule that a
conjunct green before the work is either a named regression guard or a concern; this one is neither
named nor a guard.

**Note on the deploy half.** Task 1's acceptance criterion says "the degraded branch exists in
source **and is deployed**". The gate checks only the source. The deploy is evidenced above
(exit 0, version 9, `updated_at 2026-08-15T22:50:18.106Z`) and behaviourally by the live probe and
by g3 — which exercises the deployed function through a real browser — so the criterion is met;
the _gate_ just doesn't check that half. Not raised as a defect, only as C10 bookkeeping.

---

## Intended-broken register — untouched

Confirmed nothing in this plan repaired any of the four: `/delegations` still errors
(`tests/e2e/92-delegations-error.spec.ts` untouched), `/admin/data-retention`'s legal-holds region
still errors, `/admin/field-permissions`' filters are still never sent, and `AUDIT-DROP-01` /
`AUDIT-ZERO-01` remain filed to Phase 94. No `GRANT SELECT ON auth.users` was proposed, applied, or
considered.

---

## Known Stubs

None. The degraded body is a deliberate, complete contract (identity fields only, per T-93-24), not
a placeholder; `participants` / `agenda` are omitted rather than faked as `[]`, and the client's
degraded branch never reads them.

## Threat Flags

None beyond the plan's register. T-93-24 (identity-only body, bilingual envelope on the follow-up
query error), T-93-25 (titleless chrome unreachable; three named states each asserted present AND
absent), and T-93-26 (service-role key read from env, never echoed, never in argv; fixture deleted
in an asserting teardown) are all implemented as planned. T-93-SC holds: **zero package installs**.

---

## BLOCKED

**None.**

All three tasks completed, all three gates observed red-before and green-after, and the plan's
`<success_criteria>` is met live. Two items are **filed, not blocked** — neither prevents this plan
from closing:

1. **`NOTFOUND-COMPONENT-01` → orchestrator.** Every component-thrown bare `notFound()` in this app
   renders the router's error component instead of the 404 page (mechanism traced above).
   `frontend/src/components/dossier/DossierShell.tsx:136` was carrying a bare `notFound()` when I
   read it (a concurrent lane's uncommitted work). The one-token fix is
   `notFound({ routeId: rootRouteId })`; the systemic fix is a `notFoundComponent` on each throwing
   route. Whoever owns `DossierShell` should verify their 404 path with a live navigation, not by
   inspection — this one looks correct and is not.
2. **`P52FIXTURE-01` → whoever owns seed data.** `00000000-0000-0052-0000-000000000001` is an
   engagement dossier with no `engagement_dossiers` row. That broken seed now (correctly) renders
   the degraded state, which turns `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts` test 1
   from pass to fail. Repair the seed row; do not weaken the degraded state.

## Self-Check: PASSED

```
$ [ -f tests/e2e/93-degraded-engagement.spec.ts ] && echo FOUND       → FOUND
$ [ -f supabase/functions/engagement-dossiers/index.ts ] && echo FOUND → FOUND
$ [ -f frontend/src/components/workspace/WorkspaceShell.tsx ] && echo FOUND → FOUND
$ git log --oneline --all | grep -E 'c21f09db|327ed703|a4c555b3|4b19d00c'  → all 4 FOUND
$ final gate pass: g1 exit=0 · g2 exit=0 · g3 exit=0 (3 passed, 18.6s)
```
