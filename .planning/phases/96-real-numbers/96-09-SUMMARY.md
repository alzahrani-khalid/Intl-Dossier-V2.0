---
phase: 96-real-numbers
plan: 09
subsystem: ui
tags: [react, kanban, i18n, playwright, vitest, overdue, count-truth]

# Dependency graph
requires:
  - phase: 96-02
    provides: the unified is_overdue signal (stored aa_commitments.status for commitments, per-source computed formulas for tasks/intake) + the re-timed INSERT trigger + kanban Done semantics
  - phase: 96-08
    provides: the exported STAGE_TO_STATUS symbol and stage-status-parity.test.ts (the C9-coherence file this plan's gate runs)
provides:
  - the card-level overdue badge, rendered whenever the unified signal is true — day count when known, plain label when not
  - data-testid="kcard-overdue" on the overdue-state due chip, present exactly when is_overdue is true
  - the unit-layer badge==chip anchor (real KCard inside the mocked column shell) + the null-day-count fallback anchor
  - tests/e2e/96-overdue-badge.spec.ts — the same-clock chip==badges DOM oracle, measurement printed
  - the phase-close C9b consumer sweep against phase-96-base, triaged mock-vs-real
affects:
  [
    96 phase close,
    COUNT-04,
    P97 (a11y contrast debt observation),
    P102 (kanban-dnd spec-contract observation),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Mock the SHELL, render the REAL component under measurement — a badge emitted by a mock proves nothing about the component that must emit it'
    - 'Print the operands of an agreement assertion, so a green cannot be mistaken for a vacuous 0 == 0 by a later reader'
    - 'An expressive variant (the day count) is never the precondition for the state it describes'

key-files:
  created:
    - tests/e2e/96-overdue-badge.spec.ts
  modified:
    - frontend/src/pages/WorkBoard/KCard.tsx
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx

key-decisions:
  - 'The badge IS the existing .kdue.is-overdue chip in its danger state, not a new element — UI-SPEC §7 chrome unchanged, no new column, no new drag target (RULING-P96-01 branch (a))'
  - 'The testid keys on is_overdue ALONE — no isDone conjunct. A second condition would be a second notion; Done stays badge-free because the unified formulas exclude completed work, and that is asserted, not assumed'
  - 'The fallback label is addressed colon-form (unified-kanban:card.overdue) and the specs assert no rendered badge text matches a raw-key shape'
  - 'kanban-dnd.spec.ts (a shape-coupled C9b consumer the sweep cannot see) is RED for a P94 cause and was NOT edited — another phase closed that subject; recorded as an observation instead'

patterns-established:
  - 'Same-clock agreement in the DOM: both operands lifted from ONE synchronous page.evaluate, so no realtime invalidation can invent a disagreement'
  - 'Shape-coupled consumer recovery: after the identifier sweep, grep the roots for the rendered CLASS the component owns — the blindness the sweep header names, closed by hand'

requirements-completed: [COUNT-04]

# Metrics
duration: 71min
completed: 2026-08-17
---

# Phase 96 Plan 09: COUNT-04 render half + the phase-close C9b sweep

**A row the unified signal calls overdue now always says so on the card — day count when the RPC knows it, plain label when it does not — and the toolbar chip and the badged cards were observed to be the same 16 in one DOM snapshot, over a board rendering 19 cards, with the Done column badge-free.**

## Performance

- **Duration:** ~71 min
- **Started:** 2026-08-17T04:00Z
- **Completed:** 2026-08-17T05:11Z
- **Tasks:** 2 (both executed, both gates green)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **The gap closed at its cause.** `buildDueText` required a numeric `days_until_due` before it
  would say "overdue" at all, so a stored-overdue commitment whose day count the RPC does not
  carry rendered a plain date — or, with a null deadline, nothing. The chip counted that row and
  the DOM did not. The day count is now the expressive variant, not the precondition.
- **The agreement is measured, not asserted into existence:** `cards=19 chip=16 badges=16
overdueArticles=16 doneBadges=0 chipText="16 overdue"`, printed by the spec on every run.
  Sixteen is not zero — the equality is over a populated board, and the `cards > 0` guard is what
  keeps an RLS-emptied board from "agreeing" at 0.
- **One signal, proven twice:** the badge count equals the chip AND equals the count of
  `article.kcard.overdue` — a divergence there would be the two-notions defect reappearing inside
  a single component.
- **The refusal ships byte-unchanged.** `resolveBoardStage`, `commitment-stage-guard.ts`,
  `handleDragEnd` and the droppable predicate are untouched; all four P94 refusal oracles in
  `WorkBoard.test.tsx` stay green in the same run that added the new assertions.
- **The phase-close C9b sweep ran IN the gate**, control-proven (625 of 758 files across 4 roots),
  with every candidate triaged below — plus five shape-coupled consumers the sweep is structurally
  blind to, recovered by hand and run.

## Task Commits

1. **Task 1: One signal, one badge — KCard fallback + testid; extend the unit anchors** — `dbafd52b4` (fix)
2. **Task 2: Same-clock DOM oracle + the phase-close C9b sweep** — `0638f34f3` (test)

**Plan metadata:** this SUMMARY (docs).

## Files Created/Modified

- `frontend/src/pages/WorkBoard/KCard.tsx` — `buildDueText` answers the overdue branch first and
  falls back to `t('unified-kanban:card.overdue')` when the day count is unknown; the due chip
  carries `data-testid="kcard-overdue"` exactly when `is_overdue` is true. Chrome untouched:
  same `.kdue.is-overdue` element, same danger treatment, same `LtrIsolate` wrapper, same meta-row
  placement, no new element and no new row height.
- `frontend/src/pages/WorkBoard/WorkBoard.tsx` — comment only. `overdueCount` already filtered
  `it.is_overdue`; the record of WHY that is the same field the card reads (and the
  visibleItems-vs-filtered population seam) now sits at the seam instead of in a plan file.
- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — the `BoardColumn` mock renders the
  REAL `KCard` beside its existing click target, and two assertions were added at the `:546`
  anchor. Nothing existing was changed.
- `tests/e2e/96-overdue-badge.spec.ts` — 2 tests, `@covers COUNT-04`, population definition in the
  header.

## The KCard fallback behaviour as shipped (plan `<output>` duty 1)

<!-- prettier-ignore -->
| `is_overdue` | `days_until_due` | Rendered due text | `data-testid="kcard-overdue"` |
| --- | --- | --- | --- |
| true | number (e.g. -274) | `card.overdueBy` → "Overdue 274d" (abs value, Latin digits, LTR-isolated in Arabic) | present |
| true | null / undefined | `unified-kanban:card.overdue` → "Overdue" | present |
| false | any | today / `d MMM` / empty when no deadline — unchanged | absent |

The `false` row is byte-unchanged from before this plan. Only the second row is new: it rendered
a plain date (or nothing) before, which is precisely why chip and DOM could disagree.

**Which notion wins where (RULING-P96-01 condition 3), as this surface spends it:** the card badge
and the toolbar chip both read `is_overdue` off `get_unified_work_kanban` — which is the STORED
`aa_commitments.status = 'overdue'` for commitments and the per-source computed comparison for
tasks (96-02's winning-notion table). This plan introduces no third notion and re-derives nothing
client-side.

## Gate records — every half observed RED then GREEN in this run

### Task 1 gate

`command grep -q 'kcard-overdue' … && cd frontend && pnpm exec vitest run WorkBoard.test.tsx KCard.test.tsx BoardColumn.test.tsx stage-status-parity.test.ts --reporter=default`

- **RED (undone tree, before any edit):** exit **1**. First conjunct failed — `kcard-overdue` was
  absent from `KCard.tsx`, the subject's own reason. Instrument-tested against a known-present
  token in the same file: `command grep -c 'kdue' KCard.tsx` → **2**, exit 0. The zero was real,
  not a broken grep.
- **GREEN (at HEAD `0638f34f3`):** exit **0** — **4 test files / 59 tests passed** in one run.
  That run contains the extended badge==chip assertion, the new fallback assertion, all four P94
  refusal oracles, KCard's own overdue assertions, BoardColumn's drop-affordance suite, and
  96-08's `stage-status-parity.test.ts` (the C9-coherence import).
- Exit codes captured directly, never through a pipe.

### Task 2 gate

`test -f … && test "$(playwright --list | grep -c '›')" -eq 2 && playwright test … --no-deps && bash scripts/c9b-sweep.sh phase-96-base`

- **RED (undone tree):** exit **1** at the first clause — the spec file did not exist.
- **RED, appended arm in isolation (re-drilled this run without touching any real tag):**
  `bash scripts/c9b-sweep.sh phase-96-base-NOPE` printed `MISSING TAG:
refs/tags/phase-96-base-NOPE` and exited **1**. The fail-closed MISSING-TAG arm is working
  machinery, observed today, not inherited on trust.
- **GREEN (at HEAD `0638f34f3`):** exit **0** — spec exists, lists exactly 2 tests under
  `--no-deps`, both passed (4.0s), and the sweep's control branch reported
  `CONTROL OK: \bdescribe\b -> 625 file(s) of 758 across 4 root(s)` before any per-identifier
  result. The sweep's exit code is the chain's last and was captured directly.
- Gate text is byte-identical to plan-accept HEAD `b4072302a` as amended by `RULING-P96-05`
  (`6bc619c7c`). Not edited.

## The C9b sweep triage (plan `<output>` duty 3) — every row, mock-vs-real

Instrument: `bash scripts/c9b-sweep.sh phase-96-base`, run IN the Task 2 gate. Anchor tag
`phase-96-base` = `153d7e196`. The changed-file set spans the WHOLE phase (all lanes, including
other lanes' uncommitted work-tree files), not just this plan's.

**Control:** `\bdescribe\b` → 625 of 758 files across `./backend/tests ./e2e/tests
./frontend/tests ./tests`. No zero below is believed on its own; the control proves the machinery
sees.

<!-- prettier-ignore -->
| # | Candidate identifier | Consumers | Mock-vs-real | Triage |
| --- | --- | --- | --- | --- |
| 1 | `frontend/src/pages/WorkBoard/WorkBoard.tsx` | 6: `frontend/tests/e2e/{kanban-render,kanban-a11y,tasks-tab-dnd,tasks-tab-a11y}.spec.ts`, `tests/e2e/{96-count-agreement,96-overdue-badge}.spec.ts` | **REAL** (Playwright, live app) | **THIS PLAN'S SUBJECT.** `kanban-render` (the only one asserting the due chip: `span.kdue.is-overdue` presence, weight 600, `--danger`) **RUN → PASS**. `96-overdue-badge` is this plan's own gate → PASS. `tasks-tab-dnd` **RUN → PASS**. `kanban-a11y` + `tasks-tab-a11y` **RUN → RED, pre-existing, not caused** (see Observations 1). `tasks-tab-dnd` **RUN → all 5 tests SKIPPED** by its own `test.skip` guards ("No cards seeded in the todo column for the fixture engagement" + the viewport cells) — a skip is NOT a pass and is recorded as such; it exercised nothing here. `96-count-agreement` is 96-07's landed gate, unaffected (this diff changes no count). |
| 2 | `frontend/src/pages/WorkBoard/KCard.tsx` | **none in the sweep roots** | n/a | **ZERO, instrument-tested:** `\bKCard\b` → 0 files, while the control `\bkcard\b` → 5 files through the same machinery. The zero is a ROOTS boundary, not an absence: KCard's real consumers are the colocated `frontend/src/pages/WorkBoard/__tests__/*` (MOCKED unit oracles), which sit outside the four derived `tests` roots. All four were run in the Task 1 gate. Shape-coupled consumers recovered by hand — row 3. |
| 3 | *(hand-recovered, not a sweep row)* `\bkcard\b` rendered-class coupling | 5: `frontend/tests/e2e/{kanban-render,kanban-rtl,kanban-dnd}.spec.ts`, `tests/e2e/{96-count-agreement,96-overdue-badge}.spec.ts` | **REAL** | The blindness the sweep header names verbatim ("a test coupled by rendered SHAPE alone… matches no grep"), closed by hand. `kanban-rtl` **RUN → PASS**, `kanban-render` **RUN → PASS**. `kanban-dnd` **RUN → RED, P94 cause, not caused by this plan** (see Observations 2). |
| 4 | `UNSAFE: WorkBoard.test` | 0 | n/a | Non-consumer. The identifier is derived FROM a changed test file; nothing consumes a test file. Rejected-not-escaped by the GATESTD-01 workaround (the `.` is not word-safe), triaged by hand: `grep -F` over all four roots → 0 hits, control (`describe`) → 625. |
| 5 | `UNSAFE: stage-status-parity.test` | 0 | n/a | Non-consumer, same reasoning (96-08's file). Hand-grep → 0 hits under the same control. |
| 6 | `supabase/functions/tasks-update/index.ts` | 2: `backend/tests/contract/tasks-api.test.ts`, `backend/tests/performance/kanban-render.k6.js` | **MOCKED** (contract test) / **non-oracle** (k6 load script, not run in CI) | 96-08's subject, not this plan's. Named for completeness; 96-08 proved that writer behaviourally against the DEPLOYED function, which is the stronger evidence. |
| 7 | `UNSAFE: tasks.service` | 0 | n/a | Non-consumer (hand-grep, control-proven). 96-08's subject. |
| 8 | `frontend/src/components/analytics/index.ts` | 17 across `backend/tests/{contract,contracts,integration}`, `frontend/tests/{unit,a11y,e2e}`, `tests/e2e` | **MIXED** — backend contract tests are MOCKED non-oracles; `frontend/tests/e2e/analytics-dashboard.spec.ts`, `tests/e2e/{96-analytics-real,93-analytics-error}.spec.ts` are REAL | DEAD-05 lane's subject (96-01/96-06); its consumer flip-back landed at `2db19b147`. Common-noun matches dominate this row — `analytics` appears in prose in most of them, including this plan's own spec (population definition). Not this plan's diff. |
| 9 | `UNSAFE: analytics.repository` | 1: `tests/e2e/93-analytics-error.spec.ts` | **REAL** | Prose-only coupling: the path is named in a header comment (`:6`), no assertion binds it. DEAD-05 lane's subject. |
| 10 | `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` | 1: `tests/e2e/93-analytics-error.spec.ts` | **REAL** | DEAD-05 lane's subject; that lane owns the flip. |
| 11 | `frontend/src/components/calendar/UnifiedCalendar.tsx` | 2: `frontend/tests/e2e/calendar-rtl.spec.ts`, `tests/regression/REGRESSION_TEST_SUMMARY.md` | **REAL** / **non-test** (a markdown record, no assertions) | DEAD-07 lane's subject; `calendar-rtl` was flipped by that lane at `f450e647c` (RULING-P96-04). |
| 12 | `frontend/src/routes/_protected/calendar.tsx` | 27 | **MIXED** — `tests/contract/*` + `tests/integration/*` MOCKED; the `e2e`/`a11y` specs REAL; 3 rows are markdown/page-objects, not tests | DEAD-07 lane's subject. Very high common-noun rate (`calendar`), so most rows are mentions, not couplings. |
| 13 | `frontend/src/routes/_protected/calendar/index.tsx` | 27 (same set — same derived identifier) | same as row 12 | Duplicate identifier, same triage. |
| 14 | `UNSAFE: calendar.css` | 0 | n/a | Non-consumer (hand-grep, control-proven). DEAD-07 lane. |
| 15 | `frontend/src/pages/word-assistant/WordAssistantPage.tsx` | 1: `tests/e2e/96-calendar-family.spec.ts` | **REAL** | DEAD-07 lane's subject and its own gate (`70ad8cf5e`). |
| 16 | `frontend/src/hooks/useWidgetDashboard.ts` | 1: `tests/e2e/93-custom-dashboard-error.spec.ts` | **REAL** | DEAD-06 lane's subject. |
| 17 | `UNSAFE: dashboard-widget.types` | 0 | n/a | Non-consumer (hand-grep, control-proven). DEAD-06 lane. |
| 18 | `UNSAFE: common.json` (×2 rows — en + ar) | 2: `tests/e2e/96-calendar-family.spec.ts` (`:64`), `frontend/tests/e2e/after-action-detail-error.spec.ts` (`:7`) | **REAL** both | Both name the copy file in prose; `96-calendar-family` is genuinely coupled to the probe-pill LABELS it lists, and it is the DEAD-07 lane's own landed gate — sound by construction. |
| 19 | `UNSAFE: routeTree.gen` | 5: `tests/e2e/95-sandbox-error.spec.ts`, `frontend/tests/unit/routes.test.tsx`, `frontend/tests/a11y/{keyboard-navigation,color-contrast,screen-reader-en}.spec.ts` | **REAL** (`routes.test.tsx` imports the generated tree) | Generated file; no route was added or removed by this plan, so no consumer of it is disturbed by this diff. |

Hand-triage machinery for the UNSAFE rows was itself control-tested: the same
`find … | xargs grep -lF` pipeline returns **625** files for `describe`, so each 0 above is a
measured zero.

## Decisions Made

- **The testid keys on `is_overdue` alone.** Adding an `&& !isDone` conjunct would have made the
  DOM a second opinion about overdueness — exactly the defect COUNT-04 exists to kill. Done stays
  badge-free because the unified formulas exclude completed work upstream, and the spec asserts
  that outcome rather than the component enforcing it.
- **The mocked column shell renders the real card.** `WorkBoard.test.tsx` mocks `BoardColumn`, so
  counting `kcard-overdue` nodes emitted by that mock would have been a mock asserting against a
  mock. The mock now renders the real `KCard` for each item (async `vi.mock` factory, dynamic
  import — no hoisting hazard) beside the pre-existing click `<button>`, which the routing tests
  still query. The chip side stays WorkBoard's real derivation.
- **`kanban-dnd.spec.ts` was NOT edited.** It is a P39/P57 spec whose meaning P94 changed; editing
  another phase's closed subject without a ruling is the post-close mutation this phase's
  condition 3 governs. Filed as an observation instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Trivial] The copy key's real path is `unified-kanban:card.overdue`, not `unified-kanban:overdue`**

- **Found during:** Task 1 (KCard fallback)
- **Issue:** The plan's `<interfaces>` names the keys `unified-kanban:overdue` /
  `unified-kanban:overdueBy`. On disk both live nested under `card` —
  `frontend/src/i18n/{en,ar}/unified-kanban.json:69-70` — with exactly the values the plan quotes
  ("Overdue" / "Overdue {{days}}d"), and the shipped sibling call already addresses
  `card.overdueBy`. Same keys, same file, same values; only the path in the plan text is short.
- **Fix:** Used `t('unified-kanban:card.overdue')` — the plan's mandated colon form, with the real
  nested path. No new key; nothing added to either locale file.
- **Files modified:** `frontend/src/pages/WorkBoard/KCard.tsx`
- **Verification:** Both specs assert no rendered badge text matches `/^(unified-kanban:|card\.)/`
  — a dot-form mis-address would render its own key and red the spec. Green.
- **Committed in:** `dbafd52b4`

**2. [Rule 1 — Trivial] The unit oracle needed the real KCard inside the mocked column**

- **Found during:** Task 1 (extending the `:546` anchor)
- **Issue:** The plan says to assert the rendered count of `data-testid="kcard-overdue"` in
  `WorkBoard.test.tsx`, but that file mocks `../BoardColumn`, which is what renders `KCard` — so
  no badge reached the DOM at all, and a badge added to the mock would have been vacuous.
- **Fix:** The `BoardColumn` mock became an async `vi.mock` factory that dynamically imports the
  real `KCard` and renders it per item. Every pre-existing assertion in the file was left byte-
  unchanged and stayed green.
- **Files modified:** `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`
- **Verification:** 17 tests in that file pass, including the four P94 refusal oracles; 59 across
  the four files.
- **Committed in:** `dbafd52b4`

**3. [Rule 2 — Missing Critical] The spec prints its operands**

- **Found during:** Task 2 (first green run)
- **Issue:** `expect(badges).toBe(chip)` is indistinguishable from a vacuous `0 == 0` to anyone
  reading the run later. A green over an RLS-emptied board would look identical.
- **Fix:** Added a `cards > 0` guard and a one-line `process.stdout.write` of the measured
  snapshot. The gate text was not touched.
- **Files modified:** `tests/e2e/96-overdue-badge.spec.ts`
- **Verification:** Every run prints `cards=19 chip=16 badges=16 overdueArticles=16 doneBadges=0`.
- **Committed in:** `0638f34f3`

---

**Total deviations:** 3 auto-fixed (2 trivial, 1 missing-critical). **Impact on plan:** none on
semantics — the badge, the testid, the anchor extension, the 2-test spec and the in-gate sweep are
all exactly as specified. No scope creep; no gate text edited; no mutation path touched.

## Observations filed (found while triaging, NOT caused by this plan, NOT fixed here)

**1. `kanban-a11y.spec.ts` + `tasks-tab-a11y.spec.ts` — 6 red, 233 `color-contrast` violations.**
Cause attributed before any claim: the ONLY rule id in the failures is `color-contrast`, and every
failing node is a `.chip`, `.chip-danger`, `.chip-info` or `.chip-warn` element (e.g. `#3f5f8b`
on `#0f1b2b`, 2.65:1). `kdue` appears **0 times** in the failure log while the control token
`kcard` appears **24** — so no due chip, and nothing this plan renders, is among the targets. This
is Linear-palette contrast debt on the card's kind/priority chips, pre-dating this phase. Not
fixed here: it is a design-system token change, outside COUNT-04, and a11y is not this phase's
domain. Suggested owner: a design-system/a11y entry (P97-adjacent), filed for the register.

**2. `kanban-dnd.spec.ts:57` — red, P94 cause.** The spec drags the first Todo card to In progress
and asserts the column's first card text changes. The first Todo card is a commitment reading
"Overdue 274d", and `resolveCommitmentDropDecision` refuses a past-due commitment → `in_progress`
(`past_due_coercion`) — keyed on `deadline`, independent of the stored status, so 96-02 does not
reach it either. Dating: the guard was introduced by `2147675e3` (Phase 94-03); the spec was last
touched by `7817bc02d` (Phase 57). The spec encodes pre-refusal behaviour and nobody flipped it
when P94 closed. NOT edited here — flipping another phase's closed subject without a ruling is the
post-close mutation condition 3 governs. Filed for the register with the refusal (RULING-P96-01
branch (a)) named as the intended behaviour it must be re-written against.

## Issues Encountered

- `lint-staged` re-formatted `WorkBoard.test.tsx` during the pre-commit hook and left the index
  holding the pre-prettier blob while HEAD and the work tree agreed. Detected by `git status`
  reading `MM` right after a commit; resolved by re-adding the path. The committed content was
  verified at HEAD (`git show HEAD:…` shows the testid at `:151`), not assumed.

## Verification against the plan's must-haves

<!-- prettier-ignore -->
| Must-have | Evidence |
| --- | --- |
| Every card whose unified overdue signal is true renders exactly one overdue badge with a stable testid | `badges == overdueArticles == 16` in the DOM snapshot; unit: 2 badges for the 2 overdue fixture rows, 3 after adding a null-day-count row |
| At any instant, chip == badged cards (same-clock, one snapshot) | ONE `page.evaluate`; `chip=16 badges=16`. Unit form: one render, one dataset |
| A card in the Done column is never badged | `doneBadges=0` asserted against `[data-droppable-id="done"]`; unit: the Done column's badge count is 0 |
| The P94 refusal interaction is byte-unchanged | No drag/mutation file touched (`git show --stat`: KCard, WorkBoard comment, the test); all four refusal oracles green in the Task 1 gate |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- COUNT-04's render half is closed and the phase-close C9b sweep has run; the phase's consumer set
  is triaged with every row carrying mock-vs-real.
- Two observations above want an owner (a11y contrast debt; the stale `kanban-dnd` spec contract).
  Neither blocks this plan or the phase close.
- The badge is keyed on one field, so any future surface that wants an overdue render reads
  `is_overdue` and inherits the agreement for free.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
