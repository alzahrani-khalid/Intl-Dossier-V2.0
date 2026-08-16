---
phase: 94-write-paths
plan: 03
subsystem: ui
tags: [kanban, commitments, react-query, i18n, rtl, supabase, drag-and-drop]

requires:
  - phase: 94-write-paths
    provides: 'RULING-P94-03 (the criterion invariant + the two-key rule), RULING-P94-07 (Arabic provenance), 94-UI-SPEC Copywriting Contract'
provides:
  - 'frontend/src/pages/WorkBoard/commitment-stage-guard.ts — the single source for the commitment stage→status mapping and drop decision, consumed by the mutation layer now and by 94-08 wave 2'
  - 'a commitment drag that refuses, before the write, exactly what the DB CHECK rejects or the BEFORE UPDATE trigger would coerce'
  - 'four bilingual reject keys under unified-kanban:errors.*'
  - 'the D-08 repair: no error.message reaches the kanban DOM'
affects: [94-08, 96-overdue-rendering, 98-toast-copy]

tech-stack:
  added: []
  patterns:
    - 'source-specific status mapper + explicit unknown-key branch, mirroring mapToValidIntakeStatus'
    - 'client guard MIRRORS a DB trigger condition verbatim; one condition, two enforcement points, no drift by construction (D-33)'
    - 'refusal decided before the mutation object exists, so no optimistic update and no global MutationCache onSuccess/onError fires'

key-files:
  created:
    - frontend/src/pages/WorkBoard/commitment-stage-guard.ts
    - frontend/src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts
  modified:
    - frontend/src/hooks/useUnifiedKanban.ts
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx
    - frontend/src/i18n/en/unified-kanban.json
    - frontend/src/i18n/ar/unified-kanban.json

key-decisions:
  - 'D-03 re-derived LIVE before the mapping was finalized: aa_commitments_status_check is five values (pending, in_progress, completed, cancelled, overdue) with no review — matching the plan; nothing was adapted silently'
  - 'The gesture layer (WorkBoard drag-end) refuses through the SAME shared module as the mutation layer, because the plan makes Task 3 the board-level oracle for "a refusal enqueues no mutation" at a mocked-mutate boundary'
  - 'The reject toast is rendered by one exported helper (showCommitmentRejectToast) so the copy exists once; it uses react-hot-toast ariaProps rather than the useToast wrapper, which does not forward them'

patterns-established:
  - 'Mirror-a-trigger: the SQL condition is quoted verbatim above the client predicate with a pointer to the function, so a future editor sees the mirror contract'
  - 'Absence oracles: a refusal is asserted as absence of a mutation AND absence of a toast, never as absence of an error'

requirements-completed: [WRITE-04]

duration: 78 min
completed: 2026-08-16
---

# Phase 94 Plan 03: Commitment Drag Honesty (WRITE-04 mutation half) Summary

**The commitment drag now persists exactly when the DB's own state machine permits it: `review` and
would-be-coerced past-due drops are refused before the write with two distinct bilingual
`role="alert"` reasons, own-column drops fire nothing at all, and no CHECK-constraint text can reach
the DOM.**

## Performance

- **Duration:** 78 min
- **Started:** 2026-08-16T13:05:00Z (approx — first gate baseline capture)
- **Completed:** 2026-08-16T14:23:37Z
- **Tasks:** 3 (Task 1 is TDD, so 4 commits)
- **Files modified:** 7 (2 created, 5 modified)

## THE GATE DRILL — every gate in this plan, both directions, real output

All three gates were in the never-observed-green debt. All three are now observed GREEN, and none of
them was green before the work — each red is attributed to its own subject below.

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-03_g1` (plan :136) | Full gate chain run verbatim at `d5c582e0f`. `EXIT=1`. First clause: `pnpm exec vitest run src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts` → `No test files found, exiting with code 1` / `filter: src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts` | Full gate chain re-run on the committed tree: `EXIT=0`, `Test Files 1 passed (1)` / `Tests 14 passed (14)`, then `no_review_counterpart` ✓, `past_due_coercion` ✓, `grep -cE "status: *'overdue'"` = `0`, `tsc --noEmit` clean | RED is C2-valid: the subject (the guard oracle) did not exist. TDD RED was observed separately at `1ee7ead9d` before the module existed: `EXIT=1`, vite transform failure resolving `../commitment-stage-guard`. |
| `94-03_g2` (plan :165) | Full gate chain: `EXIT=1`, no output (first clause is `grep -q`). Clause-by-clause attribution on the undone tree: `grep -q 'resolveCommitmentDropDecision'` → `1`; `grep -q 'errors.updateFailed'` → `1`; `grep -q 'ariaProps'` → `1`; `grep -qE "role: *'alert'"` → `1`. **D-08 clause instrument-tested in the CAN-FIRE direction**: `grep -cE 'description: .*error\.message'` = `1`, matching `useUnifiedKanban.ts:483: description: error instanceof Error ? error.message : 'Unknown error',` | Full gate chain: `EXIT=0`, ending in `tsc --noEmit` clean. D-08 clause now `0`; the i18n node assertion (key-set equality over `errors` in both locales **and** all four new keys present with differing EN/AR values) exited 0 | Not vacuous: every clause was observed failing for its own subject, and the repaired D-08 clause was proven able to fire on the undone tree before I relied on it (instrument trap 10). |
| `94-03_g3` (plan :189) | Full gate chain: `EXIT=1`. The vitest half **passed** on the undone tree (`Test Files 1 passed (1)` / `Tests 11 passed (11)`) — the red came from the next clause: `grep -c 'resolveBoardStage(item)'` = `0` and `grep -c 'targetStage === item\.workflow_stage'` = `1` | Full gate chain: `EXIT=0`, `Test Files 1 passed (1)` / `Tests 15 passed (15)`; `resolveBoardStage(item)` present; forbidden count `0`; `phase-94-base` verifies; `git diff --name-only phase-94-base -- frontend/src/lib/query-client.ts` empty; `tsc --noEmit` clean | B1 (the plan-check blocker) does NOT recur: the forbidden count is scoped to `targetStage === item.workflow_stage`, so `isCancelled()`'s `item.workflow_stage === 'cancelled'` at WorkBoard.tsx:89 does not match it. That line survives, and the count is still 0. |

### Negative control on the three NEW board assertions (they are not vacuous)

The gate can be green because the tests are weak. So the repair was temporarily reverted in place
(`targetStage === resolveBoardStage(item)` → `targetStage === item.workflow_stage`, commitment
refusal block removed) and the board suite re-run:

```
NEG-CONTROL EXIT=1
     × own-column commitment drop is a no-op — no mutation AND no toast (D-05) 2ms
     × commitment drop resolving Review is refused before any mutation 1ms
     × past-due commitment dropped on In progress is refused before any mutation 1ms
 Test Files  1 failed (1)
      Tests  3 failed | 12 passed (15)
```

Exactly the three new absence assertions fail, and the Done-still-writes positive control keeps
passing — so the oracle discriminates the repair, not the fixture. The file was then restored by
edit (never `git checkout`) and verified byte-identical: `git diff HEAD -- WorkBoard.tsx` empty.

## Commits

| sha         | type | what                                                                 |
| ----------- | ---- | -------------------------------------------------------------------- |
| `1ee7ead9d` | test | TDD RED — the guard oracle, failing because the module did not exist |
| `2147675e3` | feat | Task 1 — `commitment-stage-guard.ts` (GREEN)                         |
| `c5e74eaff` | fix  | Task 2 — mutation-layer refusal, four bilingual keys, D-08 repair    |
| `9b5ea0cc5` | fix  | Task 3 — no-op guard, dead-branch removal, board oracle              |

No `git add -A`, no `git commit -a`; every commit used explicit pathspecs and was verified with
`git show --stat`. `git show HEAD:frontend/src/pages/WorkBoard/commitment-stage-guard.ts` confirmed
the content landed.

## D-03 — the LIVE re-derivation, pasted

Run via Supabase MCP `execute_sql` (read-only) against staging `zkrcjzdemdmwhearhfgg` on
2026-08-16, **before** the mapping was finalized, and against the plan's own text as D-03 orders:

```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='public.aa_commitments'::regclass AND conname='aa_commitments_status_check';
```

```
CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'overdue'::text])))
```

**Five values. No `review`.** This matches the plan and `CLAUDE.md`'s corrected paragraph, so nothing
was adapted silently and no STOP was required. It is quoted in the guard module, in its test header,
and in the `1ee7ead9d` / `2147675e3` commit bodies.

Two further live derivations were needed and are recorded because the plan told me to derive rather
than assume the due-date field:

- `get_unified_work_kanban`'s live commitment branch selects `c.due_date::TIMESTAMPTZ as deadline`
  — so a commitment work item's `deadline` **is** `aa_commitments.due_date`. (The checked-in
  migration `20260206200004_kanban_search_support.sql` reads `c.deadline`, which is not a column on
  `aa_commitments`; the deployed function is the truth and differs from that file. Noted, not
  touched — out of scope.)
- `SHOW timezone` → `UTC`. `CURRENT_DATE` is therefore the UTC day, so the client predicate compares
  UTC day parts.

## Accomplishments

- **One module, two enforcement points, no drift.** `resolveCommitmentDropDecision` is the only
  place the condition exists. The mutation layer and the drag-end gesture both call it, and 94-08's
  droppable predicate will call the same function rather than re-implement it.
- **The refusal precedes the write.** On `{ ok: false }` neither `WorkBoard` nor the hook ever calls
  `mutation.mutate`, so no mutation object is created: no optimistic update, no
  `MutationCache.onSuccess` (which is the hardcoded `toast.success('Operation completed
successfully')` at `query-client.ts:69-71` — COPY-06, Phase 98, deliberately untouched), no
  `onError`, no snap-back.
- **The coercion case is closed, including the insidious TODO row.** A past-due commitment dragged
  to Todo would write `pending`, the trigger would rewrite it to `overdue`, and `overdue` renders in
  Todo anyway — the board would look right while the stored value was not what was written. Both the
  unit oracle and the board oracle carry a named past-due case, and Todo is asserted explicitly.
- **Done still works.** The guard is not a blanket refusal: a past-due commitment dragged to Done
  writes `completed`, which is the one drag the trigger permits. Asserted in both oracles as a
  positive control.
- **D-08 / T-94-04 closed.** The kanban failure toast now renders the existing
  `errors.updateFailed` + `errors.updateFailedDescription` (zero new keys), with the raw error going
  to `console.error` only — CHECK-constraint text, column names and SQL can no longer reach the DOM.
- **The dead branch is gone.** `resolveBoardStage`'s `case 'review'` for commitments could never fire
  (the constraint has no `review`); it was removed and the reverse mapping (D-31) is now documented
  where it actually lives.

## Reverse-mapping population (D-31, restated at close as the plan requires)

Where each of the five live commitment statuses renders on the board:

| stored status | renders in       | note                                                                                                                                              |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`     | Todo             | via `resolveBoardStage`'s default branch                                                                                                          |
| `in_progress` | In progress      | explicit case                                                                                                                                     |
| `completed`   | Done             | explicit case                                                                                                                                     |
| `cancelled`   | **not rendered** | filtered at `WorkBoard.tsx:203` (`isCancelled`) before bucketing — deliberate and correct                                                         |
| `overdue`     | Todo             | via the default branch, indistinguishable from never-started. **Undesigned, stated.** Handling it is Phase 96's `COUNT-04`, NOT this plan's work. |

## Arabic provenance (RULING-P94-07) — recorded, not vetted

The four AR strings were copied **verbatim** from `94-UI-SPEC.md:329-332`. They were authored by the
planning orchestrator, who is not a native speaker, under planning-round time pressure. They ship
**as authored**: grammatical, key-set-equal, and terminologically aligned with the shipped
`unified-kanban` `columns.*` glossary — which I verified rather than assumed
(`columns.todo` = `للتنفيذ`, `columns.in_progress` = `قيد التنفيذ`, `columns.done` = `مكتمل`, and the
reject bodies use exactly those three terms).

**Their naturalness is UNREVIEWED.** I did not reword them and no reviewer may read them as vetted.
They join the operator standing Arabic/RTL sign-off park alongside the Phase 93 error states.

Pixel RTL for the reject toast is likewise **not** claimed here — it is an operator park.

## Files Created/Modified

- `frontend/src/pages/WorkBoard/commitment-stage-guard.ts` — **created.** Exports
  `COMMITMENT_STAGE_TO_STATUS` (three cells: `todo`→`pending`, `in_progress`→`in_progress`,
  `done`→`completed`) and `resolveCommitmentDropDecision(item, targetStage)` returning
  `{ ok: true, status } | { ok: false, reason: 'no_review_counterpart' | 'past_due_coercion' }`.
  Never throws (core.md result-shape law); never returns or writes `'overdue'`. The trigger
  condition is quoted verbatim above the predicate with a pointer to `check_commitment_overdue()`.
- `frontend/src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts` — **created.** 14 tests:
  the three permitted cells, both reject reasons, the coercion case on Todo **and** In progress, the
  Done-permitted case, the due-exactly-today boundary, null/malformed deadlines, and the
  never-`overdue` / never-throws invariants. Time is pinned with `vi.setSystemTime`.
- `frontend/src/hooks/useUnifiedKanban.ts` — guarded `mutate` wrapper (refusal before enqueue);
  `mutationFn` commitment branch re-asserts and writes `decision.status`, never the raw stage;
  exported `showCommitmentRejectToast`; D-08 onError repair; `useToast` import removed (orphaned by
  this change) in favour of `toast.error` with `ariaProps`.
- `frontend/src/pages/WorkBoard/WorkBoard.tsx` — no-op guard now compares `resolveBoardStage(item)`;
  dead commitment-`review` branch removed with the D-31 population documented in its place;
  drag-end refuses through the shared guard and forwards `item.deadline`.
- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — commitment fixtures corrected to
  `workflow_stage: null`; three absence assertions plus one positive control added.
- `frontend/src/i18n/{en,ar}/unified-kanban.json` — four new `errors.*` keys each, in the same
  commit (D-09).

## Decisions Made

1. **The gesture layer refuses too, through the same module.** The plan's key-links pin the guard
   call to `useUnifiedKanban.ts`, and Task 2's action puts the reject toast there. But Task 2's own
   acceptance criterion says "a refusal enqueues no mutation (**asserted behaviourally in Task 3's
   board test**)", and Task 3 specifies that assertion "via the captured `onDragEnd` with mocked
   `mutate`" — at that boundary `mutate` **is** the write, so `WorkBoard` must refuse before calling
   it. This is not drift: it is literally D-33's "one condition, two enforcement points", and 94-08
   extends the same call to the droppable predicate. Both sites call one function and one toast
   helper; there is no second copy of either the condition or the copy.
2. **`toast.error` directly, not the `useToast` wrapper.** `useToast.ts` does not forward
   `ariaProps` and is not in this plan's `files_modified`. The plan authorizes either mechanism; the
   contract is the rendered `role="alert"`.
3. **`deadline` travels in `StatusUpdateParams`.** The guard's predicate needs the due date at the
   mutation layer for its defence-in-depth re-assert, and commitments carry no `workflow_stage` to
   infer it from.
4. **`cancelled` gets no cell in the map.** It is a valid commitment status but not a board column
   (`WorkBoard.tsx:67` STAGES), so it is unreachable by drag; an unmapped stage is refused rather
   than given an invented write path.

## Deviations from Plan

### Auto-fixed / clarified

**1. [Rule 3 - Blocking] The refusal also fires at the drag-end gesture layer, not only inside the hook**

- **Found during:** Task 3
- **Issue:** Task 3's required assertions are "`mutate` NOT called" at a boundary where
  `useUnifiedKanbanStatusUpdate` is mocked. If the decision lived only inside the hook, the mocked
  `mutate` would always be called and those three assertions could not be written honestly.
- **Fix:** `WorkBoard.handleDragEnd` calls the same `resolveCommitmentDropDecision` and the same
  exported `showCommitmentRejectToast`, then returns. The hook keeps both of its layers (guarded
  `mutate`, and the `mutationFn` re-assert) as defence in depth for any other caller.
- **Files modified:** `WorkBoard.tsx`, `useUnifiedKanban.ts`
- **Verification:** negative control above — the three assertions fail without the repair.
- **Committed in:** `9b5ea0cc5` (and the shared helper in `c5e74eaff`)

**2. [Rule 1 - Bug] Commitment fixtures in `WorkBoard.test.tsx` carried a `workflow_stage`**

- **Found during:** Task 3 (the plan flags this: "its items currently carry `workflow_stage`")
- **Issue:** `t3` carried `workflow_stage: 'review'` and `t8` `'in_progress'`. Per
  `work-item.types.ts:70` that field is tasks-only, and the wrong fixture would have masked the very
  bug the no-op guard fixes.
- **Fix:** both set to `null`. No existing assertion changed — `resolveBoardStage` derives a
  commitment's column from `status`, so the counts are identical.
- **Committed in:** `9b5ea0cc5`

---

**Total deviations:** 2 (1 blocking, 1 bug). **Impact:** no scope creep — no file outside
`files_modified` was touched, and nothing on the intended-broken register was repaired.

## C9b — cross-phase consumer sweep

Derived (never hardcoded) test roots: `./frontend/tests`, `./tests`, `./backend/tests`,
`./e2e/tests`, widened to every `__tests__` directory (54 roots).

**First run of the sweep was a FALSE ZERO** and is recorded as such: this shell is zsh, so
`grep -rlE -- "$id" $ROOTS` did not word-split and produced
`ugrep: warning: ./tests\n./e2e/tests\n...: No such file or directory` with an empty result that
read as "no consumers". Re-run under `bash`, it returns real hits. Instrument trap 9, caught by
running the primitive before believing it.

Candidates and triage (each instrument-tested with a token known present):

| candidate                                                   | verdict                                                                                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` | **consumer** — updated in the SAME task, re-run named as the acceptance criterion                                                  |
| `frontend/tests/e2e/kanban-a11y.spec.ts`                    | **named non-consumer** — mentions `WorkBoard` only in comments; 0 hits for `commitment`; asserts no selector I touched             |
| `frontend/tests/e2e/kanban-render.spec.ts`                  | **named non-consumer** — same; asserts `section.col` / `.col-head`, which are unchanged                                            |
| `frontend/tests/e2e/tasks-tab-a11y.spec.ts`                 | **named non-consumer** — 0 hits for `commitment`                                                                                   |
| `frontend/tests/e2e/tasks-tab-dnd.spec.ts`                  | **named non-consumer** — its `workflow_stage` hits are the TasksTab mobile "Move to" `<select>` for **tasks**, a different surface |

Selector contract honoured: `section.col`, `.col-head` and `data-droppable-id` were not renamed.

Residual, stated per C9b: a shipped spec coupled by **shape alone** would not appear in this sweep.
The board-level Playwright specs were not executed here — running the shipped e2e suite is not this
plan's oracle (`E2ECRED-01` constraints, and the live persistence probe is 94-08's by D-25).

## Threat Flags

None. The two registered threats are both mitigated and no new surface was introduced:

- **T-94-04** (information disclosure via the onError toast) — `error.message` removed from the DOM
  path; gate-asserted at 0 occurrences; raw error to `console.error`.
- **T-94-05** (tampering via the commitment status write) — the guard never writes `'overdue'` or
  `'review'`; the DB CHECK and the trigger are unchanged and remain the enforcement. No migration,
  no DDL, no `GRANT`, zero package installs.

## Known Stubs

None.

## Issues Encountered

- **`.git/index.lock` contention with the other lanes**, repeatedly. Handled by polling for the lock
  to clear before each stage/commit — never by deleting the lock. One commit also failed with
  `pathspec '-m' did not match any file(s)` because `-m` was placed after `--`; corrected to
  `git commit -m "…" -- <paths>`.
- **Pre-commit prettier rewrites the file after staging**, leaving a stale index entry for files I
  had just committed. Resolved by re-`git add`-ing my own paths so index, worktree and HEAD agree;
  no other lane's paths were ever staged by me.
- The checked-in migration `20260206200004_kanban_search_support.sql` does not match the deployed
  `get_unified_work_kanban` (it reads `c.deadline`, which is not a column on `aa_commitments`).
  Out of scope; recorded, not touched.

## GATE CONCERN

None. No gate text was read as wrong, and **zero gate edits were made** — the three
`<automated>` blocks are byte-identical to the plan as written.

## Next Phase Readiness

- `94-08` (wave 2) can import `resolveCommitmentDropDecision` and `COMMITMENT_STAGE_TO_STATUS` from
  `frontend/src/pages/WorkBoard/commitment-stage-guard.ts` exactly as its plan line 74 assumes —
  the signature is `(item: { deadline: string | null }, targetStage: WorkflowStage)`, matching its
  `resolveCommitmentDropDecision(activeItem, column.stage)` call.
- `94-08` is also the wave-2 writer of `WorkBoard.tsx`; my changes there are landed and committed,
  so it builds on a clean base.
- The live read-back persistence probe and the affordance oracle remain 94-08's (producer→consumer
  order, D-25). This plan delivered the client-side refusal half only.

## BLOCKED

None.

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
