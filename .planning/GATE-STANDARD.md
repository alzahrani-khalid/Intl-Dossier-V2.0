# GATE-STANDARD-P92 — the FALSIFICATION DRILL, applied per gate

**This is not a new practice. It is the one practice this phase already proved works, applied where
it was never applied.** We drilled exactly ONE instrument all night — the decision-coverage scanner —
by deliberately breaking it to confirm it could go red (`exit 1`, 27/30, `['D-10','D-11','D-22']`,
then restored to 30/30). That single drill immediately exposed a false green: the scanner was reading
task bodies it should not have. **We drilled ZERO of the 21 gates. Eight instances of the same defect
class is the predictable cost of that asymmetry**, not bad luck.

So this standard needs no fresh justification. It is the drill, per gate, and it has a proven
positive control behind it (`RULING-P92-17`, `RULING-P92-18`, `92-COVERAGE-DRILL.md`).

Authored by `orch-p92-b` (`wK:p57`), 2026-08-15, at pinned sha `9091b318`, in response to
`ADDENDUM 3`'s stop-point-repairing branch after round 5 classified both its blockers **SAME CLASS**.

## Why this document exists

Phase 92 has produced **eight** instances of one defect class — _a gate that cannot pass even when
the work is done_:

| #   | instance                        | how it failed                                                  |
| --- | ------------------------------- | -------------------------------------------------------------- |
| 1   | `wc -l \| grep -qx N`           | `wc` pads with whitespace; `-qx` never matches                 |
| 2   | vacuous search paths            | missing root → error to stderr, stdout empty → `-eq 0` passes  |
| 3   | `git diff HEAD`                 | goes empty the moment the forbidden edit is committed          |
| 4   | `cd frontend && pnpm typecheck` | script does not exist in that directory → always 254           |
| 5   | the `139` deploy threshold      | prose contamination made `D=134`, so max < threshold           |
| 6   | the AUTH-01 false red           | a crash recorded _as_ the red                                  |
| 7   | `--list \| grep -c '›' -eq 3`   | `--list` includes the dependency project's tests → 6, not 3    |
| 8   | 92-02's GREEN half              | oracle repointed in one plan, not in the plan that consumes it |

Five separate repair rounds fixed instances and the next round found more. **The cause is not
carelessness; it is method.** Each repair was authored in isolation, and its new claim was executed
by exactly one person — the author — against a tree where the work does not exist.

**The decisive insight (round 5, and it indicts every prior round including the one that executed all
21 gates): a gate that is red because its SUBJECT IS ABSENT is indistinguishable from a gate that is
red FOR THE RIGHT REASON, until you build the subject.** Running gates against the undone tree
cannot find this class. Only constructing the done state can. That is why eight accumulated.

## The standard — every gate must satisfy all of C1–C10

### C1 — BOTH DIRECTIONS, OBSERVED (not reasoned)

A gate is sound only if the author has **observed** both:

1. **RED on the undone tree**, and
2. **GREEN on a constructed work-done state.**

Constructing the done state is **mandatory, not best-effort**. It is the only clause that catches the
dominant class. Where the done state cannot be fully constructed (a deploy, a staging call), build
the largest constructible subset, and record explicitly what remained unconstructed — an honest
`NOT CONSTRUCTED: <what and why>` is acceptable; silence is not.

Work in a scratch copy or a throwaway worktree. **The plans' own tree must be byte-identical
afterwards** — verify with `git status --porcelain` before and after.

### C2 — RED FOR THE RIGHT REASON

A red must be attributable to the gate's **subject**. A gate that dies at an environment or tooling
step — missing script, missing credential, missing file a later task creates — is **not** a valid
red. Record it as `UNABLE TO MEASURE — <error>` and fix the gate so it can reach its subject.

Corollary, from instance 6: this applies to _evidence_ as well as gates. A measured RED recorded as
baseline evidence is valid only if the run reached the assertion of record and failed there.

### C3 — EVERY INVOKED NAME MUST RESOLVE IN THE GATE'S OWN DIRECTORY

Every binary, script, and flag must resolve **where the gate actually runs**. A gate that begins
`cd <dir>` resolves `pnpm run <script>` against `<dir>/package.json`, **not** the repo root. Verify
the script name in that exact file. (Instance 4.)

### C4 — THRESHOLDS ARE DERIVED, AND MAX MUST BE REACHABLE

Any `-eq N` / `-ge N` must be derived by a command, never a frozen literal. The author must
additionally show **max achievable ≥ threshold** — a derivation that is correct but unreachable is
still an unsatisfiable oracle. Scope derivations to structured fields (frontmatter list items), never
whole-file greps that prose can contaminate. (Instance 5.)

### C5 — SEARCH ROOTS MUST BE PROVEN TO EXIST

Any `<search> | wc -l | test … -eq 0` requires a root-existence precondition in the same `&&` chain.
A missing root sends its error to stderr and leaves stdout empty, so the count is `0` and the gate
passes vacuously. Never add `2>/dev/null` — it converts a real error into a silent pass. (Instance 2.)

### C6 — TEST-RUNNER INVOCATIONS MUST STATE THEIR PROJECT SEMANTICS

**Playwright, specifically and non-obviously: neither `--list` nor `--grep` exempts a dependency
project.** Any command naming a project that carries `dependencies:` must decide explicitly whether
it wants them, and pass `--no-deps` when it does not — **including `--list`**, whose test count
otherwise includes the dependency project's tests.

Do not reason from "listing executes nothing" — that is true about execution and false about
counting, and it is exactly the sentence that produced instance 7. Verify a count by constructing a
spec with a known number of tests and comparing. (Instance 7.)

### C7 — SCOPE DIFFS ANCHOR TO THE PHASE TAG, NEVER HEAD

`git diff --name-only phase-92-base -- <paths>`, preceded by
`git rev-parse -q --verify refs/tags/phase-92-base >/dev/null` in the same chain. A HEAD-relative
diff goes empty the moment a forbidden edit is committed — the exact moment the guard exists to
fire. (Instance 3.)

### C8 — NEGATIVE GREPS MUST NOT TRIP ON PROSE

`! grep -q 'X' <file>` fails if `X` appears in a **comment** — and it often will, because the plan's
own action text usually instructs the author to mention `X` ("never use `X`"). Either target a
syntactic form that cannot appear in a comment, or scope the search to exclude comment lines, or
drop the negative and pin the positive instead.

### C9 — CROSS-PLAN COHERENCE: REPOINT EVERY CONSUMER IN THE SAME EDIT

If a gate, oracle, command, or artifact name changes in one plan, **every plan that references it
must be repointed in the same edit.** Before declaring such a change done, run a repo-wide grep for
the old name across all ten plans and paste the count. A change that is correct in its own plan and
stale in its consumer is instance 8, and it is invisible to any review scoped to one plan.

### C10 — THE CRITERION AND THE GATE MUST AGREE

Every count, set, artifact, or locale the `<acceptance_criteria>` names must be **checked by the
gate**. A criterion asserting something the gate never counts is satisfied by work that does not do
it. This produced NEW-2, F4 and F5 independently; treat any "both / all / exactly N" phrasing in a
criterion as a gate obligation.

## The pass procedure

**One author, all 21 gates, all ten plans, in one pass.** Not per-plan, not split across seats.

**Why a single author, stated precisely, because the obvious reading is wrong:** every repair
tonight was **locally correct** — each fixed the instance it targeted, and each was verified by its
author. What failed was the **set**. Instance 8 is the proof: repointing the AUTH-01 oracle was
right in 92-01 and left 92-02 consuming an oracle that no longer existed. No amount of care _within_
a repair detects that; only one author holding all ten plans at once does. **Isolation is the
mechanism, not carelessness** — so splitting this pass across seats would reproduce the exact cause
it exists to remove.

**This pass is ALSO the re-rating of 92-04..92-10.** Round 5 was scoped by ruling to the plans the
repairs touched (92-01/02/03), which was correct for that round but leaves seven plans examined only
by rounds that predate the repairs. Those seven get the same C1–C10 treatment here. Do not let a
correctly-scoped review round leave them unexamined by accident.

For each gate, record a row:

| plan.gate | C1 red | C1 green (how the done state was constructed) | C2–C10 exceptions | verdict |
| --------- | ------ | --------------------------------------------- | ----------------- | ------- |

- `verdict` ∈ `SOUND` / `REPAIRED (what changed)` / `CANNOT CONSTRUCT (what and why)`.
- **A gate whose done state was not constructed is reported as `CANNOT CONSTRUCT`, never as `SOUND`.**
  The absence of a row, or a row asserting soundness without a green observation, is precisely the
  failure this pass exists to end.
- Repairs land as ordinary edits; coverage must remain 30/30 afterwards.

### The mechanical half is a SCRIPT, not a habit

`scripts/gate-drill.mjs` — extracts every `<automated>` gate from the ten plans, `bash -n` parses
each, runs each against the tree, and reports per-gate exit codes plus a summary. Landed in the repo
beside `scripts/decision-coverage.mjs` so **future phases inherit the instrument rather than the
anecdote**, and so these counts are re-derived on demand instead of re-quoted from a report.

**The construct-the-done-state half (C1 clause 2) stays authored per gate and cannot be mechanized** —
building the work-done state requires knowing what the work is. The script tells you a gate is red;
only the author can tell you it is red _for its subject_, and that distinction is the whole finding.
A green from the script is therefore **not** evidence a gate is sound.

## What this standard does NOT do

It does not make the plans correct — it makes their oracles honest. A gate can satisfy C1–C10 and
still guard the wrong thing. C10 is the only clause pointed at that, and it is weak by design: this
document is about gates that cannot pass when the work is done, not about whether the work is the
right work.

GATE-STANDARD-END
