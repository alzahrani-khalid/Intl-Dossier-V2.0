---
phase: 95-routes-that-don-t-render
plan: 09
subsystem: infra
tags: [gate-standard, c9b, bash, instrument, requirements-register, closing-derivations]

requires:
  - phase: 95-routes-that-don-t-render
    provides: the eight wave-1 SUMMARYs (95-01..95-08) — every derivation, bound and omission this plan transcribes; 95-04's "DEAD-04 decision for the record" section specifically
provides:
  - scripts/c9b-sweep.sh — a bash-pinned, fail-closed C9b consumer sweep future phases inherit
  - 95-CLOSING-REGISTER.md — route population, coverage re-derivations, the 24-gate drill in both directions, C9a/C9b triage, named omissions, the weakest point
  - 95-DEAD-04-DECISION.md — the KEEP record Phase 97 criterion 4 consumes by name
  - the eight Phase 95 REQUIREMENTS.md rows flipped Pending -> Complete, with zero out-of-phase row changes
affects:
  [
    96-real-numbers,
    97-nav,
    100-security-posture,
    101-ci-gates,
    102-delegations,
    any phase running a C9b sweep,
  ]

tech-stack:
  added: []
  patterns:
    - 'A derivation that must not lie silently ships as a script with a control self-test, not as an inline shell block in a standards document'
    - 'Branch order in a fail-closed instrument is fixed and documented, because earlier branches mask later ones and a drill aimed at a later branch must satisfy every earlier one'

key-files:
  created:
    - scripts/c9b-sweep.sh
    - .planning/phases/95-routes-that-don-t-render/95-CLOSING-REGISTER.md
    - .planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md
  modified:
    - .planning/REQUIREMENTS.md

key-decisions:
  - 'The C9b derivation SEMANTICS are preserved verbatim — including the identifier floods (`id` -> 447 candidates) and the incomplete stoplist. GATE-STANDARD.md is not edited mid-phase (GATESTD-01); the defects are recorded, not fixed.'
  - "Two gates arrived with a green and no red (95-04_g2 nginx, 95-07_g1). Rather than record them CANNOT CONSTRUCT, their reds were CONSTRUCTED at close and pasted — a scratch nginx conf with a synthetic /monitoring location, and the tag-anchored absence of 95-07's two subjects."
  - 'The weakest point named is this plan''s OWN new instrument, not one of the two bounded-and-ruled candidates — the C9b sweep is blind in three measured ways and underwrites every "no other consumer is affected" claim in the phase.'

patterns-established:
  - 'Every zero from a sweep is instrument-tested; a zero that turns out to have TWO independent causes gets both recorded (generate-entry.test.ts: outside the roots AND not carrying the identifier)'
  - 'A forward reference in a register ("re-run below") is closed by a follow-up commit, never by --amend on a shared branch'

requirements-completed:
  [DEAD-01, DEAD-02, DEAD-03, DEAD-04, DEAD-08, DEAD-09, NOTFOUND-COMPONENT-01, RETENTION-CAST-01]

duration: 78 min
completed: 2026-08-16
---

# Phase 95 Plan 09: Closing derivations, drills and records — Summary

**The phase closes on re-derived evidence rather than assertion: a fail-closed `scripts/c9b-sweep.sh`
that refuses to report a zero from machinery it cannot prove sees, a closing register carrying every
derivation with its population definition, the DEAD-04 KEEP record Phase 97 reads by name, and
exactly eight register rows flipped — with the phase's weakest point named as the sweep's own
population, blind in three measured ways.**

## Performance

- **Duration:** 78 min
- **Started:** 2026-08-16T20:30Z (approx — first plan read)
- **Completed:** 2026-08-16T21:48Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- `scripts/c9b-sweep.sh` ships the C9b derivation as an instrument that **fails closed**: shell
  pinned by shebang, roots derived into a bash array, node_modules pruned inside the find
  expression, and a control self-test that exits `INSTRUMENT-FAILED` before any per-identifier
  result if a token known to appear in hundreds of spec files returns zero files.
- **The zsh word-splitting defect the script exists to kill bit an ad-hoc loop of mine during this
  very leg** — an unquoted `$B` in a `for p in $B` comparison was passed whole, producing a
  false "every path is new" result. Re-run under `bash`, correct. Live confirmation the instrument
  belongs in code rather than prose.
- Two gates that reached this register with a green and **no red** (95-04_g2, 95-07_g1) had their
  reds constructed here rather than being written off as CANNOT CONSTRUCT.
- The C9b sweep found **one genuine cross-plan artifact the plan's expected list did not name** —
  `scripts/probe-edge-auth.sh`, produced by 95-02 and gated by 95-06 — and its format contract
  held.
- Both zeros in the sweep's output were run down. One of them is a **population defect in the C9b
  derivation itself**: 186 co-located test files under `src`/`functions` are structurally
  unreachable.
- Eight register rows flipped with a tag-anchored diff proving **16 changed table rows, all Phase
  95, zero out-of-phase**.

## Task Commits

1. **Task 0: fail-closed C9b sweep instrument** — `0ba9f397f` (feat)
2. **Task 1: closing register** — `1a0ce9d9b` (docs)
3. **Task 2: DEAD-04 record + the eight row flips** — `31d7a05b0` (docs)
4. **Follow-up: closing gate-drill run recorded in the register** — `30b28d5b5` (docs)

Every commit used an explicit pathspec. Verified per commit, in the commit rather than on disk:

```
0ba9f397f -> scripts/c9b-sweep.sh                                    (1 file, 152 insertions)
1a0ce9d9b -> .../95-CLOSING-REGISTER.md                              (1 file)
31d7a05b0 -> .planning/REQUIREMENTS.md + .../95-DEAD-04-DECISION.md  (2 files)
30b28d5b5 -> .../95-CLOSING-REGISTER.md                              (1 file)
git show HEAD:.../95-DEAD-04-DECISION.md | grep -c 'DECISION-RECORD-END'   -> 1
git show HEAD:.planning/REQUIREMENTS.md  | grep -c '<the eight Complete rows>' -> 8
```

**No `--amend` and no `--no-verify` at any point** (the 95-08 lesson: on a shared branch `--amend`
rewrites whatever is at HEAD, not your own commit). The register's forward reference to a
not-yet-run closing drill was closed by a follow-up commit.

## RESERVED PATH (D-17) — the reservation held

**`95-VERIFICATION-INDEPENDENT.md` was neither created nor written by this plan.** It belongs to
the independent `gsd-verifier` on the execution leg. Asserted three ways at close:

```
$ ls .../95-VERIFICATION-INDEPENDENT.md
ls: ...: No such file or directory                      # absent on disk
$ [ -e .../95-CONTEXT.md ] && echo PRESENT
PRESENT                                                 # the test is not vacuous
$ git log --oneline --all -- '.../95-VERIFICATION-INDEPENDENT.md' | wc -l
0                                                       # no commit anywhere ever touched it
```

## THE THREE c9b-sweep.sh SELF-TEST DRILLS (plan `<output>` requirement)

Run at creation, **before any sweep output was consumed as evidence** (exec acceptance condition 7).

### (a) CONTROL FIRES — the instrument refuses to report zeros it cannot justify

A scratch directory containing an **empty** subdirectory named `tests`, so branches 1 and 2 pass
(the tag verifies — the run is inside this repo, not a bare scratch repo — and the roots array is
non-empty) and branch 3 is the one that fires:

```
$ C9B_ROOT_HINT=/var/folders/.../c9b-drill.vmvwlEH8Wj bash scripts/c9b-sweep.sh phase-95-base
DRILL_A_EXIT=1
INSTRUMENT-FAILED: control token returned 0 — \bdescribe\b matched none of 0 file(s) across
1 root(s) under /var/folders/.../c9b-drill.vmvwlEH8Wj; no zero from this machinery is trustworthy
```

### (b) UNSAFE BRANCH FIRES — reject, never escape (the GATESTD-01 workaround)

```
$ bash scripts/c9b-sweep.sh phase-95-base 'a.b('
UNSAFE (triage by hand): a.b(
```

The identifier is reported and skipped, never interpolated into an ERE.

### (c) LIVE IDENTIFIER FINDS ITS KNOWN CONSUMER

```
$ bash scripts/c9b-sweep.sh phase-95-base data-retention
CONTROL OK: \bdescribe\b -> 619 file(s) of 752 across 4 root(s): ./backend/tests ./e2e/tests ./frontend/tests ./tests
data-retention <- ./tests/e2e/93-admin-surfaces-error.spec.ts
```

### Why the control token is `describe` and not `describe(` — measured, not reasoned

```
$ /usr/bin/grep -lE -- '\bdescribe\b'  tests/e2e/93-admin-surfaces-error.spec.ts
tests/e2e/93-admin-surfaces-error.spec.ts          EXIT=0
$ /usr/bin/grep -lE -- '\bdescribe(\b' tests/e2e/93-admin-surfaces-error.spec.ts
grep: parentheses not balanced                     EXIT=2   (no output)
```

`\bdescribe(\b` is an **invalid ERE**: it exits 2 and emits nothing, so that control would return
0 on every run and the script would exit `INSTRUMENT-FAILED` unconditionally — including in its own
live self-test. It is also exactly the shape the UNSAFE branch rejects.

## GATE OBSERVATIONS — both directions, every task

### Task 0 — RED at the undone tree, GREEN on the shipped script

**RED**, in a detached worktree at `phase-95-base` (shared tree never mutated; worktree removed
afterwards, `git worktree list` clean):

```
$ (cd /tmp/95-09-red-wt && <the Task 0 gate, verbatim>)
TASK0_GATE_RED_EXIT=1
--- attribution (C2 — the red is the subject's, not a tooling death):
ls: scripts/c9b-sweep.sh: No such file or directory        LS_EXIT=1
git rev-parse -q --verify refs/tags/phase-95-base          TAG_CLAUSE_EXIT=0
   ^ the later clauses are runnable there; only the subject is absent
```

**GREEN**, on the shipped script: `TASK0_GATE_EXIT=0`.

`.planning/GATE-STANDARD.md` is **byte-identical** — `git diff` and the tag-anchored
`git diff phase-95-base` both return 0 lines for that path.

### Task 1 — RED in the baseline drill, GREEN at HEAD after prettier

- **RED:** `95-09_g2` exit **1** in the baseline gate-drill run (register absent).
- **GREEN:** `TASK1_GATE_EXIT=0`, re-run after the commit as `TASK1_GATE_AT_HEAD_EXIT=0` — the
  grep pins survive lint-staged's prettier rewrite (the 95-03 lesson), and again after the
  follow-up edit.

### Task 2 — RED in the baseline drill, GREEN at HEAD

- **RED:** `95-09_g3` exit **1** in the baseline drill (decision file absent, all eight rows
  `Pending`).
- **GREEN:** `TASK2_GATE_EXIT=0` and `TASK2_GATE_AT_HEAD_EXIT=0`.

The C7 guard's own counter was instrument-tested rather than trusted:

```
tag-anchored +/- table-row lines total          = 16    (8 removed Pending, 8 added Complete)
of those, lines NOT containing 'Phase 95'       = 0
```

A guard that counts 0 out of 0 proves nothing; this one saw 16 rows and rejected none of them.

### The full gate drill, both directions, at close

| run                                     | gates | parse          | green  | red                            |
| --------------------------------------- | ----- | -------------- | ------ | ------------------------------ |
| BASELINE (before this plan's Tasks 1-2) | 24    | 24/24 PARSE-OK | 22     | **2** — `95-09_g2`, `95-09_g3` |
| CLOSING (after Tasks 1-2 landed)        | 24    | 24/24 PARSE-OK | **24** | 0                              |

`GATEDRILL_EXIT=0` and `GATEDRILL_CLOSE_EXIT=0`. No gate other than this plan's own two changed
colour between the runs, so the closing green is not a tree that drifted underneath the other 22.

### UNPROVEN debts declared at planning time — every one paid, with its payer

| plan    | needed…                                           | paid by (wave-1 SUMMARY section)                                                                          |
| ------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `95-01` | Tasks 1-2 + app running against staging           | 95-01 §Task 3 gate — red `-> crash`, green `2 passed (13.1s)`                                             |
| `95-02` | the Task 2 deploy + running app                   | 95-02 §Deployment oracle — `11 -gt 11` red → `12 -gt 11` green                                            |
| `95-03` | Task 1 landed                                     | 95-03 §Task 2 gate — `RED_FINAL_EXIT=1` → `TASK2_GATE_EXIT=0`                                             |
| `95-04` | running dev stack (curl half)                     | 95-04 §Condition 1c — 200 / 401 / `text/html`, stack repaired first                                       |
| `95-04` | Task 1 + dev stack (e2e half)                     | 95-04 §Task 3 red drill — `2 failed` on the :5299 red stack, `2 passed` after                             |
| `95-05` | ≥1 staging position in a trigger-rendering status | 95-05 — 2 `draft` + 2 `published` on staging; the opportunistic arm **executed** and annotated its branch |
| `95-06` | Task 1 deployed to staging                        | 95-06 §Task 3 gate — `PROBE_EXIT_BEFORE_DEPLOY=1` → `TASK3_GATE_EXIT=0` at tip v14                        |
| `95-08` | running app against staging                       | 95-08 §Task 2 gate — `4 passed (12.1s)`, 16 real policy rows                                              |
| `95-09` | `phase-95-base` to exist                          | tag present at `a3d2d269a`; Task 0's tag-dependent halves drilled above                                   |
| `95-09` | the eight plans executed                          | this SUMMARY and `95-CLOSING-REGISTER.md`                                                                 |

**Zero debts remain unpaid.** One direction remains unmeasured — 95-05's oracle tests 1-2 pre-fix
red — and it is **ruled** `ACCEPT-AS-RECORDED` by `RULING-P95-03-BLOCKED-9505.md`. Transcribed
where the register cites 95-05; not re-litigated, and nothing filed beside `ORACLECAP-01` (that
filing is the orchestrator's, ruled to land after this close, so the no-other-rows gate stays
true).

## Files Created/Modified

- `scripts/c9b-sweep.sh` — NEW, 152 lines. Bash-pinned, `pipefail`, array roots with
  `C9B_ROOT_HINT` override, pruned find, `INSTRUMENT-FAILED` control branch, character-class
  unsafe-id rejection, fixed branch order (tag → roots → control → output).
- `.planning/phases/95-routes-that-don-t-render/95-CLOSING-REGISTER.md` — NEW. Eight sections,
  terminal marker `CLOSING-REGISTER-END`.
- `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md` — NEW. Terminal marker
  `DECISION-RECORD-END`; cites `RULING-P95-01`; transcribed from 95-04's SUMMARY section.
- `.planning/REQUIREMENTS.md` — two edits only: the dated DEAD-04 sub-bullet in the
  DEAD-09-supersession house style, and exactly eight rows `Pending` → `Complete`.

## Decisions Made

- **Semantics preserved, defects recorded.** The sweep reproduces GATE-STANDARD's derivation
  faithfully, including its identifier floods (`positions/$id.tsx` → the identifier `id` → **447**
  candidates; `backend/src/index.ts` → `src` → 152). Widening the stoplist would have been a
  mid-phase amendment to a standard this phase is graded against (`GATESTD-01` — worked around,
  never fixed unruled). Recorded in the register instead.
- **The unsafe-id check sits where GATE-STANDARD's BSD-broken sed escape sat**, so the flow is
  otherwise identical: strip `$` → reject-if-unsafe → stoplist → word-boundary grep.
- **Two missing reds constructed rather than excused.** GATE-STANDARD permits `CANNOT CONSTRUCT`;
  both of these were constructible in minutes, so the honest record is the red, not the excuse.
- **The weakest point is this plan's own instrument.** Naming one of the two bounded-and-ruled
  candidates (95-02's unexercised happy path, 95-05's unmeasured red) would have been the
  comfortable answer; both are named as runners-up instead.

## Deviations from Plan

**None — plan executed exactly as written.** Three mechanical notes, none of which changed a
mechanism:

1. Both new files needed `git add` before their pathspec commit (`git commit -- <path>` silently
   creates no commit for an untracked file — the 95-06 lesson). Same single-path pathspecs, no
   `git add -A`.
2. `sed -i '' 's|...|...|'` could not perform the row flips — the `|` delimiter collides with the
   markdown table pipes and the substitution silently did nothing. Caught by verifying the rows
   after, not by trusting the exit code; done with targeted edits instead. The precondition check
   (each id matching exactly one `Pending` row) had already passed, so nothing was flipped twice.
3. A stale index entry (`MM`) appeared after the Task 1 commit — lint-staged's prettier pass.
   Worktree and HEAD were the same blob (`c2bcef140`); cleared with `git reset -q HEAD -- <that
one path>`, index only, no other lane's path involved (the 95-03 precedent).

## Issues Encountered

**1. The zsh no-word-split defect reproduced live, in this leg, in my own ad-hoc loop.** While
deriving the C9a `<files>`-minus-`files_modified` set I wrote `for p in $B` in the session shell.
zsh does not word-split an unquoted scalar, so `$p` became the entire multi-line blob and every
path reported as "declared only in a `<files>` block" — a confident, completely wrong answer. The
re-run under `bash` gave the correct result (zero such paths). This is the same defect class
`scripts/c9b-sweep.sh` exists to prevent, and it happened to the author of the script while writing
the register that documents it. Recorded because it is the strongest possible evidence for
shipping the rule as code.

**2. A second silent-empty instrument in the same comparison.** `grep -E "^\s+- "` returned nothing
under `/usr/bin/grep`, which does not support `\s` in EREs — so the `files_modified` population was
empty and, again, every path looked new. Fixed with `[[:space:]]`. Two false-clean results in one
derivation, both caught only because the output was implausible.

**3. The C9b sweep's own population is incomplete — recorded, not fixed.** See the weakest point in
the register: 186 co-located test files unreachable, deploy-only changes invisible to a
diff-anchored sweep, and a stoplist that misses this repo's route-param shape.

## User Setup Required

None — no external service configuration, no deploy, no migration, zero package installs.

## Next Phase Readiness

- **Phase 97** has its DEAD-04 record by name at
  `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md`, and inherits exactly one
  residual reference: the nav entry at `navigationData.ts:262`.
- **Every phase from here inherits `scripts/c9b-sweep.sh`** beside `gate-drill.mjs` and
  `decision-coverage.mjs` — future C9b sweeps cannot silently search nothing, regardless of the
  invoking shell.
- **Carried forward, unowned, from the register's named-omissions roll-up:** the stale `search`
  `validTypes` (one line, in whichever phase next deploys `search`); the `/scenario-sandbox` 500's
  root cause; `frontend/tests/scenario-sandbox-verification.spec.ts` discovered by no Playwright
  config; `pdf-generate`/`ai-extract` unblocked-but-unverified; the `reports` GET branch with no
  oracle; report-artifact storage retention; the `93-admin-surfaces-error.spec.ts:145` dangling
  comment cite; `PositionAnalyticsCard` at zero mounts; the operator-side `backend/.env` gap.
- **Latent DEAD-04s named for whoever wants them:** `/analytics-dashboard`,
  `/organization-benchmarks` and `/notifications-center` are bare-prefix Vite proxy claims of
  exactly the shape DEAD-04 was, unexamined by this phase.
- **The independent `gsd-verifier` leg is unblocked** — `95-VERIFICATION-INDEPENDENT.md` is free.

## Self-Check: PASSED

- Every `<automated>` block run **byte-identical** to the accepted plan. **Zero gate edits.**
- All three tasks' gates observed in both directions; exits captured with `$?` immediately, never
  through a pipe.
- Commits use explicit pathspecs; the seven exogenous paths (`.agents/skills/tickmarkr-*`,
  `.claude/skills/tickmarkr-*`, `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`) are **still
  uncommitted-unstaged**, byte-identical to leg start, and were never staged.
- Intended-broken surfaces re-verified untouched, tag-anchored: `/delegations` (P102), the
  legal-holds region (P100), `/analytics` (P96) — with the one `legal`-matching diff line read and
  dispositioned rather than waved through as a clean zero.
- No fix was implemented by this plan.

## BLOCKED

None. Every task's gate ran verbatim and its exit was observed; both directions were constructed
and recorded for all three. The one direction in the phase that remains unmeasured — 95-05's
oracle tests 1-2 pre-fix red — is not this plan's blocker: it is **RULED ACCEPT-AS-RECORDED** by
`RULING-P95-03-BLOCKED-9505.md`, transcribed where the register cites 95-05, and deliberately not
re-litigated here.

---

_Phase: 95-routes-that-don-t-render_
_Plan: 09_
_Completed: 2026-08-16_

SUMMARY-END
