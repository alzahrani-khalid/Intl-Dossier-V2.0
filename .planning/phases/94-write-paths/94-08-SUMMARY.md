---
phase: 94-write-paths
plan: 08
subsystem: ui
tags: [dnd-kit, kanban, react, supabase, postgrest, rls, triggers, oracles]

requires:
  - phase: 94-write-paths (plan 03)
    provides: the shared commitment stage guard (`resolveCommitmentDropDecision`) and the D-05 no-op guard
provides:
  - a per-column droppable predicate that removes the drop signal from columns the guard would refuse
  - the mandatory home-column carve-out, proven against real dnd-kit 6.3.1
  - `scripts/probe-commitment-readback.mjs` — the D-32 write-then-read-back oracle plus a live coercion control / drift alarm
  - `94-STAGE-PARITY.md` — the D-34 client-map vs live-CASE parity record
affects: [96-overdue-rendering, 98-copy-truth]

tech-stack:
  added: []
  patterns:
    - 'Droppable predicate and mutation guard consume ONE shared decision function (D-33 no-drift-by-construction)'
    - 'Component oracles read dnd-kit''s own `droppableContainers` registry rather than a mocked hook'
    - 'Persistence proven by write-then-read-back through a USER JWT, with a past-due coercion control'

key-files:
  created:
    - scripts/probe-commitment-readback.mjs
    - .planning/phases/94-write-paths/94-STAGE-PARITY.md
  modified:
    - frontend/src/components/kanban/index.ts
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx

key-decisions:
  - 'D-04 closed AFFIRMATIVELY: the per-card droppable predicate IS expressible in dnd-kit 6.3.1 — proven, not assumed. The pre-ruled fallback to (a) alone was NOT taken.'
  - 'The carve-out keys on a `homeStage` snapshot, not on the kanban `column` field, because KanbanProvider.handleDragOver rewrites `column` on the shared item object mid-drag.'
  - 'BoardColumn.test.tsx dropped its `@/components/kanban` module mock entirely — a mocked `useDroppable` cannot prove expressibility.'

patterns-established:
  - 'Every oracle authored in this plan was falsification-drilled in both directions before being believed'

requirements-completed: [WRITE-04]

duration: 76 min
completed: 2026-08-16
---

# Phase 94 Plan 08: Commitment drop affordance, read-back probe, stage-map parity — Summary

**Columns a commitment cannot legally land in stop being droppables mid-drag — except the card's own
column, which never does — and persistence is now proven by reading the stored row back through a
real user JWT with a past-due coercion control beside it.**

## Performance

- **Duration:** 76 min
- **Started:** 2026-08-16T13:44Z
- **Completed:** 2026-08-16T15:00Z
- **Tasks:** 3
- **Files modified:** 6 (4 modified, 2 created)

## Task Commits

<!-- prettier-ignore -->
| # | Task | sha | type |
| - | ---- | --- | ---- |
| 1 | The droppable predicate with the own-column carve-out, proven by its oracle | `9f5a5a194125b54ce1204bcb76399b2714ed0ef3` | feat |
| 2 | The write-then-read-back probe with the coercion control | `7f8946ab8d14acaef4562ff66e6556618678a792` | test |
| 3 | The STAGE_TO_STATUS parity derivation (D-34/F1) | `77a7e62aa369c16d04c00cd9b108b91227d1626b` | docs |

Every commit used an explicit pathspec (`git commit -- <paths>`). Commit 3 used `HUSKY=0`; all of
its paths are under `.planning/`. Commits 1 and 2 ran the full pre-commit hook.

---

# GATE DRILL — every gate in this plan, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| ---- | ------------------------------------ | ------------------------------------- | ----- |
| `94-08_g1` (:121) | Verbatim gate run on the undone tree → **`EXIT=1`**. Clause-by-clause, run separately to attribute the red: `grep -q 'useDndContext' src/components/kanban/index.ts` → `EXIT=1`; `grep -q 'resolveCommitmentDropDecision' src/pages/WorkBoard/BoardColumn.tsx` → `EXIT=1`; `grep -q 'data-droppable-id' …` → `EXIT=0`. The chain short-circuits at clause 1, whose subject is exactly this task's output. **C2 satisfied: red for its subject, not for tooling.** | Verbatim gate re-run at `77a7e62a` → **`94-08_g1 EXIT=0`**; `Test Files 5 passed (5)` / `Tests 31 passed (31)`; `tsc --noEmit` clean. | Clause 3 (`data-droppable-id`) **was already green before the work — it is a REGRESSION GUARD**, not a pass: it pins the Phase 39 selector contract that five shipped e2e specs key on. Clauses 1 and 2 are the earning clauses. |
| `94-08_g2` (:150) | Verbatim gate on the undone tree → **`EXIT=1`**; subject check `ls -la scripts/probe-commitment-readback.mjs` → `No such file or directory`. Red because the probe did not exist — its subject. | Verbatim gate → **`94-08_g2 EXIT=0`**, `PROBE PASSED — future-due write persisted verbatim (read-back), past-due write observed coerced to \`overdue\`, fixtures cleaned, live rows untouched`. Full run output reproduced below. | Ran live against staging `zkrcjzdemdmwhearhfgg`. Not a credentials-absent exit 2 — credentials were present and every assertion reached its subject. |
| `94-08_g3` (:173) | Verbatim gate on the undone tree → **`EXIT=1`**; `ls -la .planning/phases/94-write-paths/94-STAGE-PARITY.md` → `No such file or directory`. | Verbatim gate → **`94-08_g3 EXIT=0`**. Clause-by-clause: `grep -q 'PARITY: MATCH'` → `EXIT=0`; `grep -qi 'population'` → `EXIT=0`. Negative control: `grep -q 'PARITY: MISMATCH —'` → `EXIT=1` (correctly absent). | See **GATE CONCERN** below — this gate is sound but **self-certifying**, and I am recording that rather than editing it. |

**Zero gate text was edited.** `git diff phase-94-base -- .planning/phases/94-write-paths/94-08-PLAN.md`
is empty.

## `94-08_g2` full GREEN output (live staging run)

```
probe-commitment-readback — https://zkrcjzdemdmwhearhfgg.supabase.co
  today (UTC) = 2026-08-16 · future fixture 2026-09-15 · past fixture 2026-07-17

[0] live census BEFORE (service-role) — these rows must be untouched at the end
  aa_commitments: 10 rows {"overdue":8,"pending":2}
  PASS  no leftover namespaced fixtures from a prior run

[1] mint the probe identity (service-role) — it OWNS both fixtures, so the
    SELECT/UPDATE policies resolve through the owner_user_id path
  p94-probe-readback@probe.invalid -> fc08f15d-fd20-432d-aac4-d4ef7b49ad33

[2] PERSISTENCE — a NOT-past-due commitment must store what the client wrote
  fixture A -> e1f80f04-5c49-46d3-bfae-3197a8f0cfc7 (due_date=2026-09-15, status after INSERT=pending)
  PASS  the trigger does not fire on INSERT — fixture A is still `pending` — pending
  user PATCH status=in_progress -> HTTP 200, rows affected 1
  PASS  the user JWT updated exactly ONE row (not a silent zero-row RLS no-op) — HTTP 200, 1 row(s)
  read-back A -> {"id":"e1f80f04-...","status":"in_progress","due_date":"2026-09-15"}
  PASS  STORED VALUE equals what was written — `in_progress` persisted verbatim — stored in_progress

[3] COERCION CONTROL — the drift alarm on the condition the client guard mirrors
  fixture B -> 85e2ddcf-b233-498d-b8e8-35fa87b1f76d (due_date=2026-07-17, status after INSERT=pending)
  PASS  the trigger is UPDATE-only — a PAST-DUE row can sit at `pending` after INSERT — pending
  user PATCH status=in_progress -> HTTP 200, rows affected 1
  PASS  the user JWT updated exactly ONE row (not a silent zero-row RLS no-op) — HTTP 200, 1 row(s)
  read-back B -> {"id":"85e2ddcf-...","status":"overdue","due_date":"2026-07-17"}
  PASS  the trigger COERCED the past-due write to `overdue` — the mirrored condition is live — stored overdue

[4] cleanup — the 10 live commitments must be exactly as they were
  … history / work_item_dossiers / aa_commitments rows deleted -> HTTP 204 (×6)
  user p94-probe-readback@probe.invalid (fc08f15d-…) deleted -> HTTP 200
  census AFTER: 10 rows {"overdue":8,"pending":2}
  PASS  no namespaced fixture rows remain
  PASS  the live census is unchanged — no live commitment was touched
```

Cleanup independently re-verified through the Supabase MCP after the run:
`commitments=10, namespaced_left=0, wid_left=0, hist_left=0, probe_users_left=0`.

---

# Falsification drills on the oracles I authored

A green oracle I wrote is not evidence until I have seen it go red for the right reason. Both drills
below were run and then reverted; the tree is byte-identical to the committed state
(`git diff HEAD -- frontend/src/pages/WorkBoard/BoardColumn.tsx` empty).

<!-- prettier-ignore -->
| control | mutation applied | result |
| ------- | ---------------- | ------ |
| Is the affordance oracle wired to the predicate at all? | `disabled: false && isColumnDropDisabled(...)` | **4 tests failed**, incl. `expected '' to contain 'review'`. Not vacuous. |
| Is the carve-out assertion a tautology? | removed the `activeItem.homeStage === stage` early return | **3 tests failed**: `expected 'todo,in_progress,review' to be 'in_progress,review'`, `expected 'todo,in_progress,review' to be 'todo,review'`, `expected true to be false`. The carve-out is load-bearing — **without it the home column really would be disabled**, which is the hazard, measured rather than argued. |

The probe's two sides are each other's control by construction: the same PATCH (`status=in_progress`),
through the same identity, differing only in `due_date`, produces `in_progress` on one row and
`overdue` on the other. The DRIFT branch can therefore fire.

Instrument hygiene: `grep` zeros were positive-controlled in both directions before being believed
(e.g. `commitment=0` in every drag spec was paired with `test(=1..2` on the same files); the C9b
sweep was positive-controlled with a token known present (`BoardColumn` → 1 hit).

---

# What shipped

## Task 1 — the droppable predicate (`9f5a5a19`)

- `@/components/kanban` barrel re-exports `useDndContext` (direct `@dnd-kit/core` imports are
  ESLint-fenced outside `components/kanban/*`; the fence fixture test stays green).
- `BoardColumn` reads the in-flight card from `useDndContext().active` + the kanban data context and
  passes `disabled` to `useDroppable`. The predicate `isColumnDropDisabled` calls **94-03's
  `resolveCommitmentDropDecision`** — one condition, two enforcement points, no second copy.
- **No visual treatment.** No class, no attribute, no opacity, no CSS. Asserted by a test that
  snapshots `class` and `style` on `section.col` before and after the drag and requires them
  unchanged while the registry reports the column disabled.
- **D-04 is closed AFFIRMATIVELY.** The oracle drives real dnd-kit 6.3.1 — a real `KanbanProvider`
  (`DndContext` + `closestCenter`), real `KanbanCards`/`KanbanCard` (`SortableContext` +
  `useSortable`), a real `KeyboardSensor` drag — and asserts against dnd-kit's **own
  `droppableContainers` registry**, so the claim is "dnd-kit accepted and applied `disabled`", not
  "the component computed a boolean". The pre-ruled fallback to (a) alone was **not** taken.
- The `@/components/kanban` module mock was **removed** from `BoardColumn.test.tsx`. It would have
  made the expressibility claim circular.
- Suite: 20 tests in `BoardColumn.test.tsx` (8 pre-existing, preserved; 12 new).

## Task 2 — the read-back probe (`7f8946ab`)

Live, re-runnable, exits 0/1/2 (2 = credentials absent, a labelled state). Every id printed.
Fixtures namespaced `p94-probe-readback`, cleaned in a `finally`, live census re-asserted.
`commitment_status_history` rows are cleaned but **never read as evidence** (F3).

## Task 3 — the parity record (`77a7e62a`)

`94-STAGE-PARITY.md`: both copies derived live at execution (`pg_proc.prosrc` for
`sync_task_status_from_workflow_stage`; the client map read at a pinned sha, not "HEAD" — this tree
has concurrent lanes and HEAD moves between the read and the check). All five cells **MATCH**.
Population = the five `workflow_stage` keys; the `completed_at` stamp, the `ELSE NULL` branch and
the `IS DISTINCT FROM` guard are stated as outside it.

---

# Named non-implementations — recorded as gaps, NOT as coverage

1. **`W4` — the retarget-to-Done hole is OPEN and unpinned.** The own-column carve-out closes
   cancel-by-drop-home. It does **not** close releasing a past-due card over the **disabled
   In-progress** column: `closestCenter` retargets that release to the nearest enabled droppable —
   Todo (home; a harmless no-op) or **Done, which writes `completed` behind nothing but the global
   success toast**. The user aimed for In-progress and may get a completed commitment. Tolerated
   this phase because the landing is visible on the board. **No oracle pins it.** This is the honest
   gap.
2. **Card-level droppable-disable was SKIPPED.** `KanbanCard`'s sortables inside Review remain
   droppables of their own (`useSortable({ disabled: { droppable } })` is permitted polish, not
   required). The 94-03 mutation-layer reject covers that path and remains load-bearing. Recorded as
   a decision, not an oversight.
3. **The home-drop no-mutation half is 94-03's oracle, not mine.** `WorkBoard.test.tsx` →
   `own-column commitment drop is a no-op — no mutation AND no toast (D-05)` asserts the absence of
   the call. I did not author it and I did not edit it (`WorkBoard.test.tsx` is outside this plan's
   `files_modified`); I **ran it and observed it green** —
   `✓ own-column commitment drop is a no-op — no mutation AND no toast (D-05)`, 15/15 in that file.
   The carve-out is therefore complete as a composition: _home column stays enabled_ (this plan) +
   _home drop writes nothing_ (94-03).
4. **`STAGE_TO_STATUS` is still sent for tasks.** The client still posts a `status` the DB derives
   itself. Not removed — whether the client should stop sending a DB-owned column is a product call
   about the seam, and Phase 96 owns the seam.

## Switch note (D-33 / `RULING-P94-03`)

Whether refusal remains the right interaction once `overdue` renders distinctly is **Phase 96's to
revisit**. Carried, not settled.

---

# GATE CONCERN

**`94-08_g3` is sound but SELF-CERTIFYING, and I am recording that rather than editing it.**

The gate asserts that `94-STAGE-PARITY.md` exists, contains the literal `PARITY: MATCH`, and
mentions a population. All three clauses are file-shape assertions about a document the same task
authors. **The gate cannot distinguish a real live derivation from a hand-typed `PARITY: MATCH`** —
which is precisely how its "done state" was constructed during planning. If the two copies had
diverged, the honest artifact would read `PARITY: MISMATCH — <cells>` and the gate would go red, so
the gate is not vacuous _given an honest author_; but its red-direction power depends entirely on
the author choosing to write the failing verdict.

I did the derivation live (both `execute_sql` calls and the sha-pinned `git show` are recorded in the
artifact and reproducible), and the cells genuinely match. **No gate edit was made and none is
requested from me.** Flagging it so the phase's gate ledger records that this particular green rests
on artifact honesty rather than on an independent measurement — which is the class `GATE-STANDARD`
C1 exists to surface.

---

# Deviations from Plan

### 1. [Rule 1 — Bug avoided] The carve-out keys on `homeStage`, not on `resolveBoardStage(activeItem)` called from `BoardColumn`

- **Found during:** Task 1, reading `KanbanProvider.tsx` per `read_first`.
- **Plan text:** the `<interfaces>` block specifies the carve-out as
  `resolveBoardStage(activeItem)`, and lists `WorkBoard.tsx` in `files_modified`.
- **Issue:** two problems with the literal plumbing. (a) `resolveBoardStage` lives in
  `WorkBoard.tsx`, which imports `BoardColumn` — importing it back creates a module cycle and drags
  the router/query graph into the column's unit tests. (b) The obvious cycle-free alternative — the
  kanban item's `column` field, which WorkBoard sets from that same function — is **unsafe**:
  `KanbanProvider.handleDragOver` (`KanbanProvider.tsx:223`) executes
  `newData[activeIndex]!.column = overColumn!` on the **shared item object** mid-drag, so `column`
  drifts to whatever the pointer last hovered. A carve-out keyed on it would move the "home" column
  during the gesture and re-disable the true one — the exact `closestCenter` retarget failure the
  carve-out exists to prevent.
- **Fix:** `WorkBoard` snapshots `homeStage = resolveBoardStage(it)` onto each kanban item — **the
  same single call**, under a name nothing mutates — and `BoardColumn` reads `activeItem.homeStage`.
  Same semantics as the plan intends, no second copy of the rule, no cycle, immune to the mutation.
- **Files modified:** `WorkBoard.tsx` (kanbanItems memo + comment), `BoardColumn.tsx`.
- **Verification:** the carve-out falsification drill above; 94-03's four WorkBoard drag oracles
  still green.
- **Committed in:** `9f5a5a19`.

### 2. [Rule 1 — Bug] `BoardColumn.test.tsx` stopped mocking `@/components/kanban`

- **Found during:** Task 1.
- **Issue:** the file mocked the entire kanban barrel including `useDroppable`. D-04 demands proof
  that the predicate is expressible in the installed dnd-kit; a mocked `useDroppable` can only prove
  the component computes a boolean. A mocked consumer proves nothing.
- **Fix:** removed the module mock; the suite now drives real dnd-kit. One pre-existing assertion
  (`kanban-cards-<id>` test-id, an artifact of the mock) was retargeted to the real primitive's DOM
  (`#in_progress.col-body`). `react-i18next` and `../KCard` remain mocked — neither is the subject,
  and the draggable listeners live on the real `KanbanCard`, not on `KCard`.
- **Committed in:** `9f5a5a19`.

**Total deviations:** 2 (both Rule 1). **Impact:** no scope creep; both increase the strength of the
evidence rather than the size of the change.

---

# Out-of-scope discovery — NOT fixed, routed to the orchestrator

**`KanbanProvider.handleDragOver` mutates a shared item object in place.**
`frontend/src/components/kanban/KanbanProvider.tsx:219-224` does `let newData = [...data]` (a shallow
copy) and then `newData[activeIndex]!.column = overColumn!`, which writes through to the object held
by `WorkBoard`'s `useMemo`. `onDataChange` is undefined on this board, so nothing re-renders from
it — but the mutated `column` is observable on the next render from any other cause. It also calls
`arrayMove(newData, activeIndex, overIndex)` with `overIndex === -1` when the pointer is over a
column rather than a card.

This violates the no-hidden-mutation rule in `~/.claude/rules/core.md`. `components/kanban/KanbanProvider.tsx`
is **outside this plan's `files_modified`** and outside `WRITE-04`'s scope, so I did **not** touch it.
This plan is immune by construction (the `homeStage` snapshot above). Flagging it for a ruling on
where it belongs.

---

# Threat Flags

<!-- prettier-ignore -->
| Flag | File | Description |
| ---- | ---- | ----------- |
| threat_flag: data-write | `scripts/probe-commitment-readback.mjs` | Writes real fixture rows to `aa_commitments` on staging (T-94-14, disposition *mitigate*). Namespaced, ids printed, cleaned in `finally`, live census re-asserted before and after, and independently re-verified via MCP. Uses the service-role key for setup/cleanup only; the UPDATE and read-back run through a minted user JWT. Never prints a key, password or JWT. |

No new network endpoint, auth path or schema change. **No migration was applied by this plan** — the
`42P17` migration remains this phase's only schema change, and it is not mine.

---

# Cross-phase consumer sweep (C9b)

Run with the derived-roots script (four roots: `./frontend/tests`, `./tests`, `./backend/tests`,
`./e2e/tests`), positive-controlled first. Triage of the candidate list:

- `frontend/src/components/kanban/index.ts` → the identifier resolves to the common noun `kanban`
  and floods (33 candidates). **Change is a pure additive re-export**; it cannot break a consumer.
- `frontend/src/pages/WorkBoard/BoardColumn.tsx` → 1 candidate, `frontend/tests/e2e/kanban-render.spec.ts`.
  **Not affected:** the markup is byte-unchanged (asserted by the new no-visual-treatment test and
  by the retained `section.col[data-droppable-id]` selector-contract test).
- `frontend/src/pages/WorkBoard/WorkBoard.tsx` → 4 candidates (`tasks-tab-a11y`, `kanban-a11y`,
  `kanban-render`, `tasks-tab-dnd`). **Not affected:** no DOM change; the added `homeStage` field is
  not rendered.
- **The behavioural risk is drag specs that drag a COMMITMENT card.** Enumerated and measured:
  `kanban-dnd`, `tasks-tab-dnd`, `kanban-drag-drop-latency`, `workflow-stage-auto-sync-with-status`,
  `_phase52-mid-drag-capture`, `tests/e2e/06-work-item-crud` — **`commitment` mentions = 0 in every
  one** (paired with a `test(` positive control on the same files, so the zeros are real). Tasks are
  never disabled by this predicate, so no shipped drag spec is affected.
- `_phase52-mid-drag-capture.spec.ts` is pre-existing red **by DATA** (`P52FIXTURE-01`) — not chased,
  per the plan.

The residual class this sweep cannot see (a spec coupled by rendered shape alone) is unchanged in
size, because this plan changes no rendered shape.

---

# Intended-broken register

Nothing on the register was touched. No `/delegations`, `/admin/data-retention`, `/tasks/queue`,
`/analytics`, `DEAD-09`, `COPY-06`, `COUNT-03` or `COUNT-04` work was attempted, and the 22-mask
floor was not reduced. `COPY-06` is the toast that fires on the W4 path above; it stays Phase 98's.

# Arabic / RTL

**No Arabic string was authored, reworded or reviewed by this plan, and no artifact here claims
Arabic naturalness or pixel RTL.** Both remain operator parks. The two reject-message keys are
94-03's and were not touched.

# Requirements

`WRITE-04` is this plan's frontmatter requirement, but it spans plans 94-03/94-08 and others.
`REQUIREMENTS.md` is outside this plan's `files_modified` and I did **not** mark anything complete —
that is the orchestrator's call once the phase's WRITE-04 plans have all closed.

# Issues Encountered

- Two instrument faults of my own, caught and corrected before they became evidence: a `vitest` run
  issued from the repo root picked up the root config and reported every file as a collection
  failure (re-run from `frontend/` → 11 files / 81 tests passed); and the C9b sweep initially failed
  on zsh word-splitting plus BSD `sed` bracket handling (re-run under `bash`).
- `${PIPESTATUS[0]}` is empty in this zsh shell. All gate exit codes in this SUMMARY were captured
  directly with `$?` on an unpiped command, never through a pipe.

# Next Phase Readiness

WRITE-04's affordance half and its live oracles are closed. Open and carried: `W4` (unpinned, above),
the `KanbanProvider` in-place mutation (needs a ruling on ownership), and the Phase 96 switch note.

## BLOCKED

None.

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
