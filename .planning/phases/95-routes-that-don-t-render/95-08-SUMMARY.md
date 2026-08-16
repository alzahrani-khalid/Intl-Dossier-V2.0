---
phase: 95-routes-that-don-t-render
plan: 08
subsystem: ui
tags: [tanstack-query, envelope-validation, data-retention, vitest, playwright]

requires:
  - phase: 93-trust-the-render
    provides: the per-region QueryErrorState gating on /admin/data-retention (93-09) and the shipped REAL oracle tests/e2e/93-admin-surfaces-error.spec.ts
provides:
  - six validate-or-throw envelope unwraps replacing the six false `as Promise<T[]>` casts in useRetentionPolicies.ts
  - a shared unwrapListEnvelope<T> guard — one guard, six call sites, so the lie cannot return one hook at a time
  - a 17-case unit oracle that a coerce-to-[] implementation cannot pass (the behavioural ban on the forbidden shape)
  - deletion of the asRows consumption-point workaround in data-retention.tsx
affects: [96-analytics, 100-rls-residuals, any future consumer of domains/audit retention hooks]

tech-stack:
  added: []
  patterns:
    - 'validate-or-throw envelope unwrap at the hook (never Array.isArray(x) ? x : [])'
    - 'unit-test a queryFn by mocking useQuery to return its own options — no renderHook plumbing'

key-files:
  created:
    - frontend/src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts
  modified:
    - frontend/src/domains/audit/hooks/useRetentionPolicies.ts
    - frontend/src/routes/_protected/admin/data-retention.tsx

key-decisions:
  - 'One shared unwrapListEnvelope<T> helper rather than six inline copies of the guard — the plan permitted either; one guard means a future edit cannot half-restore the lie.'
  - 'RED and GREEN landed in ONE commit instead of the TDD test→feat split: eight executors share this working tree, and a deliberately-failing test committed on the shared branch would poison a sibling lane running the suite. The RED observation is pasted below in full instead.'
  - 'The six page-level consumption lines keep an explicit row-type annotation (`const policies: RetentionPolicy[] = policiesData ?? []`) rather than dropping to inference. It keeps the five row-type imports live (no orphan-import churn in a file other lanes may touch) and compile-asserts the hook return type at the consumption point.'

patterns-established:
  - 'Envelope unwrap: `const data = (body as { data?: unknown } | null | undefined)?.data; if (!Array.isArray(data)) throw new Error(...)` — a malformed SUCCESS body renders the error state, never an empty state.'
  - 'Pending-state defaults (`?? []` over `data === undefined`) are NOT the banned coerce and stay.'

requirements-completed: [RETENTION-CAST-01]

duration: 25 min
completed: 2026-08-16
---

# Phase 95 Plan 08: Retention envelope unwrap (RETENTION-CAST-01) Summary

**The six `as Promise<T[]>` casts in `useRetentionPolicies.ts` are now one shared validate-or-throw
`unwrapListEnvelope<T>` guard, the `asRows` consumption-point workaround is deleted from
`data-retention.tsx`, and the shipped REAL oracle re-runs 4/4 with 16 policy rows and the
legal-holds region still truthfully red.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-16T19:36:00Z (approx — first gate observation 19:54Z)
- **Completed:** 2026-08-16T20:01:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments

- All six retention list `queryFn`s unwrap and VALIDATE the `{ data: [...] }` envelope; a
  successful-but-malformed body now throws and renders the region's error state instead of an
  empty state. `"No policies"` can only render over a truthful `[]`.
- A 17-case unit oracle pins the behaviour for **all six** hooks (not a two-hook sample): N-row
  envelope → exactly those rows, `{data:[]}` → `[]`, bare array / non-array `data` / `undefined` →
  THROW `malformed retention envelope`. A `Array.isArray(x) ? x : []` implementation fails 8 of
  the 17 — the forbidden shape is banned behaviourally, not by a prose-trippable grep.
- The 93-09 `asRows` workaround and its 19-line comment block are gone; the page consumes the
  hooks' validated arrays directly and its per-region `QueryErrorState` gating is byte-unchanged
  (8 occurrences before and after).

## Pre-edit cast-population derivation (D-10 — REQUIRED PASTE)

Run before any edit, at the pre-work tree:

```
$ command grep -n "as Promise<" frontend/src/domains/audit/hooks/useRetentionPolicies.ts
71:    queryFn: () => getRetentionPoliciesApi(searchParams) as Promise<RetentionPolicy[]>,
129:    queryFn: () => getLegalHoldsApi(searchParams) as Promise<LegalHold[]>,
190:    queryFn: () => getRetentionStatistics() as Promise<RetentionStatistics[]>,
205:    queryFn: () => getPendingActionsApi(searchParams) as Promise<PendingRetentionAction[]>,
220:    queryFn: () => getExpiringRecordsApi(searchParams) as Promise<ExpiringEntity[]>,
228:    queryFn: () => getExecutionLog() as Promise<RetentionExecutionLog[]>,
$ command grep -c "as Promise<" frontend/src/domains/audit/hooks/useRetentionPolicies.ts
6
```

**Count = 6, at exactly the six lines the plan named (:71, :129, :190, :205, :220, :228).** No
reconciliation against the register was needed. Post-edit count = **0**, verified at the commit
sha, with the positive instrument pin in the same read (`useQuery` = 19 hits, `unwrapListEnvelope`
= 7 hits = 1 definition + 6 call sites) so the zero is a real zero and not a failed read.

## Gate observations (both gates red BEFORE, green AFTER — verbatim commands)

### Task 1 gate

```
cd frontend && pnpm exec vitest run src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts \
  && test "$(command grep -c 'as Promise<' src/domains/audit/hooks/useRetentionPolicies.ts)" -eq 0 \
  && command grep -q 'useQuery' src/domains/audit/hooks/useRetentionPolicies.ts && pnpm type-check
```

- **BEFORE (red):** `No test files found, exiting with code 1` → `TASK1_GATE_PREWORK_EXIT=1`
- **RED of the oracle against the casts** (test written, hook not yet fixed):
  `Test Files 1 failed (1) | Tests 17 failed (17)` — e.g. the malformed case received the raw
  body `{ "rows": [ { "id": "row-1" } ] }` where a rejected promise was expected. The casts pass
  every body through untouched; that is the lie, reproduced.
- **AFTER (green):** `Test Files 1 passed (1) | Tests 17 passed (17)`, `tsc --noEmit` clean →
  `TASK1_GATE_EXIT=0` (re-run verbatim from the repo root: `TASK1_GATE_FROM_ROOT_EXIT=0`).

### Task 2 gate (its e2e half was labelled UNPROVEN — needs the running app)

```
cd frontend && test "$(command grep -c 'asRows' src/routes/_protected/admin/data-retention.tsx)" -eq 0 \
  && command grep -q 'QueryErrorState' src/routes/_protected/admin/data-retention.tsx && pnpm type-check \
  && cd .. && test -f tests/e2e/93-admin-surfaces-error.spec.ts \
  && test "$(pnpm exec playwright test tests/e2e/93-admin-surfaces-error.spec.ts --project=chromium-en --no-deps --list | command grep -c '›')" -eq 4 \
  && pnpm exec playwright test tests/e2e/93-admin-surfaces-error.spec.ts --project=chromium-en --no-deps
```

- **BEFORE (red):** stops at its first test — `asRows` count was **8** (1 definition + 1 comment
  mention + 6 call sites), so `-eq 0` fails → `TASK2_GATE_PREWORK_EXIT=1`.
- **AFTER (green):** `TASK2_GATE_EXIT=0`. Full chain, including the previously-UNPROVEN e2e half:

```
Running 4 tests using 4 workers
[93-09] field-permissions rows=19 stat="19" (19 expected)
  ✓  4 …:89:7  › /admin/field-permissions › natural visit renders the rules the database actually holds (5.8s)
[93-09] data-retention policy rows=16
  ✓  2 …:140:7 › /admin/data-retention › natural visit is honest PER REGION — policies load, legal-holds errors by design (6.7s)
  ✓  3 …:114:7 › /admin/field-permissions › a blocked field-permissions request renders the error state, never "0 Permissions" (11.7s)
  ✓  1 …:200:7 › /admin/data-retention › a blocked data-retention request collapses to the error state, never six empty regions (11.8s)

  4 passed (12.1s)
```

**The deliberately-red region STAYED red.** Test 2 (`:140`) is the one whose header says a green
legal-holds region is a REJECT; it passed, which means it observed `query-error-inline` VISIBLE on
the Legal Holds tab and zero `no legal holds` copy. Nothing in this leg touched the P100 server
parse or `public.legal_holds` RLS. The natural visit rendered **16 real policy rows** with
`query-error-state` count 0, the blocked half held all five em-dash stat values, and both
crash-freedom assertions (`Route error` / `is not a function` / `Cannot read`) stayed empty.

Run conditions: root `playwright.config.ts`, `--no-deps` (the `setup` project is unusable —
E2ECRED-01), inline auth from `.env.test`, against the running dev server on
`http://localhost:5173` (`E2E_BASE_URL` unset → `reuseExistingServer`). Credentials never echoed.

## Task Commits

1. **Task 1: re-derive the six, write the oracle, replace the casts** — `89020143f` (fix) —
   `frontend/src/domains/audit/hooks/useRetentionPolicies.ts`,
   `frontend/src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts` (+136 / −6)
2. **Task 2: reconcile the consumer — delete asRows, keep the region gating** — `488462c35`
   (refactor) — `frontend/src/routes/_protected/admin/data-retention.tsx` (+10 / −36)

Both commits used explicit pathspecs. Task 1's staging needed `git add` on the new (untracked)
test file — `git commit -- <path>` cannot stage an untracked file — and hit the shared
`index.lock` once; it succeeded on retry 2, per the protocol's sleep-and-retry rule.

Content verified at the commit shas, not at a moving HEAD (a sibling lane committed 95-05 between
my two commits):

```
git show 89020143f:…/useRetentionPolicies.ts | grep -c 'as Promise<'   → 0   (unwrapListEnvelope → 7, useQuery → 19)
git show 488462c35:…/data-retention.tsx      | grep -c 'asRows'        → 0   (QueryErrorState → 8)
git show 89020143f:…/__tests__/useRetentionPolicies.test.ts | wc -l    → 113
```

## Files Created/Modified

- `frontend/src/domains/audit/hooks/useRetentionPolicies.ts` — added
  `unwrapListEnvelope<T>(body): T[]` (validate-or-throw); the six list `queryFn`s are now
  `async () => unwrapListEnvelope<T>(await <repoFn>(…))`. Query keys, `staleTime`, and every hook
  signature are unchanged; the single-item hooks and all mutations are untouched.
- `frontend/src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts` — NEW, 113 lines,
  17 cases. Mocks `@tanstack/react-query` so `useQuery` returns its own options object (the hook's
  real `queryFn` is reachable without `renderHook`/`QueryClientProvider`) and mocks
  `@/lib/api-client` (the repository layer stays REAL, so the endpoint URLs are exercised too).
- `frontend/src/routes/_protected/admin/data-retention.tsx` — `asRows` + its 19-line comment block
  deleted; six call sites replaced by direct consumption with `?? []` pending-state defaults.

## Decisions Made

See `key-decisions` in the frontmatter. The one worth repeating: **RED and GREEN shipped in one
commit** because this tree is shared by eight parallel executors and a committed failing test is a
live hazard to their gates. The RED is preserved as an observation (17/17 failing against the
casts), not as a commit.

## Boundary notes (named because the plan requires them)

- **DR-SUBPATH-01 is NOT fixed here and must not be.** `data-retention/index.ts:119-124` resolves
  its resource from the second-to-last path segment, so every `/data-retention/<sub>` route except
  `policies` is read as a policy id and 404s. Those queries reject → `ApiError(404)` → per-region
  error state, which is **truthful**. That parse is P100 property; the server was not touched, no
  migration ran, no RLS changed. Statistics, legal-holds, pending-actions, expiring and
  execution-log therefore still render their error states, as designed.
- **Only other consumer: the compat re-export** `frontend/src/hooks/useRetentionPolicies.ts` —
  read and confirmed **re-export-only** (a single `export { … } from '@/domains/audit'` block, 19
  names, zero logic). Named non-change; not touched, not staged.
- **No widened visibility.** Frontend-only unwrap of a body the server already returned under its
  own admin gate and RLS (threat T-95-19). Zero package installs (T-95-SC).

## Deviations from Plan

**1. [Rule 1 - Process] TDD RED and GREEN committed together instead of split**

- **Found during:** Task 1 (commit step)
- **Issue:** The GSD TDD flow prescribes a `test(...)` RED commit followed by a `feat/fix(...)`
  GREEN commit. On this shared working tree — eight executors, one branch — a committed red test
  is visible to every sibling lane's suite run between the two commits.
- **Fix:** One `fix(95-08)` commit containing both files, with the RED observation recorded in
  this SUMMARY (17/17 failing before the hook edit) rather than in git history.
- **Files modified:** none extra
- **Verification:** the oracle's RED was observed and pasted above; the GREEN gate exit is 0
- **Committed in:** `89020143f`

---

**Total deviations:** 1 auto-fixed (1 process).
**Impact on plan:** None on scope or behaviour — the plan's evidence requirement (observe red,
observe green, paste both) is satisfied in full.

## Issues Encountered

- **A now-dangling citation, deliberately left alone.**
  `tests/e2e/93-admin-surfaces-error.spec.ts:145` says _"See the envelope note in
  data-retention.tsx (`asRows`) for the instance that made this necessary."_ That note no longer
  exists — this plan deleted it. The spec file is **outside this plan's `files_modified`** and is
  the named acceptance oracle for this very task, so editing it here would be both an out-of-set
  write and a self-serving edit to my own grader. Left byte-unchanged and recorded instead. The
  repair is a one-line comment edit (repoint it at `useRetentionPolicies.ts`'s
  `unwrapListEnvelope` doc block) and belongs to whoever next owns that spec — a Phase 95
  consolidation touch, or Phase 100 when it flips test 2's legal-holds assertion to the healthy
  render. **The stale cite affects a comment only; no assertion reads it.**
- `git commit -- <path>` cannot stage an untracked file (Task 1's new test), and the shared
  `index.lock` blocked the first `git add`. Both handled as the protocol prescribes (explicit
  single-path `git add`, then sleep-and-retry).

## User Setup Required

None — no external service configuration, no deploy, no migration.

## Next Phase Readiness

- RETENTION-CAST-01 closes as a filed-finding: the casts are gone, the workaround is gone, and the
  page's only remaining `[]` values are pending-state defaults over `data === undefined`.
- Still open elsewhere, unchanged by this leg: DR-SUBPATH-01 (the edge-function sub-path parse,
  P100), the `legal_holds` `auth.users` SELECT policy (RLS-AUTHUSERS-01 residual, P100), and
  E2ECRED-01 (the `setup` Playwright project needs six `E2E_*` keys `.env.test` does not carry —
  every oracle here runs `--no-deps` because of it).

## BLOCKED

None. Both tasks completed, both gates observed red before and green after, both commits verified
at their shas.

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
