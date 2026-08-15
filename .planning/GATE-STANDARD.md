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

## The standard — every gate must satisfy all of C1–C10 (including C9a and C9b)

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

#### C9a — THE CROSS-PLAN SWEEP MUST READ `<files>` TASK BLOCKS, NOT ONLY `files_modified`

**Amended 2026-08-15 during Phase 92 EXECUTION (`RULING-P92-47`, `D-43`), from a live instance.**

A cross-plan artifact is one plan's _output_ and a later plan's gate's _input_. Its **format** is a
contract, and unlike a name it is never grepped for — so it is checked for the first time when the
consuming gate runs, which is after the producing plan has already closed green.

Phase 92's instance: `92-04` created `92-DEPLOY-LEDGER.md` with a six-column table (`Result` in the
middle, a `Why deployed` column last). `92-09_g1` counts deploy verdicts with
`grep -E "\| *OK *\|?[[:space:]]*$"` — a regex that requires the verdict cell to be **last**, which
is exactly the `name | timestamp | OK/FAIL` shape both plans' action text mandates. The gate was
sound (confirmed by control: plan-shape rows are counted and their names extracted; six-column rows
are not). The artifact deviated. `92-04` closed with both its own gates green, because neither of
its gates reads the ledger — **only a later plan's gate does.**

**Why the existing sweep could not have caught it, which is the durable part.** Deriving cross-plan
artifacts from `files_modified` frontmatter finds every other instance in this phase and misses this
one, because `92-04` declares the ledger **only in a `<files>` task block** — its `files_modified`
lists five `supabase/functions` paths and nothing else. Script-derived over all ten plans, the
frontmatter-visible set is complete and sound:

| artifact                                 | producer → consuming gate(s)                           | held?                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `tests/e2e/92-delegations-error.spec.ts` | 92-01 → `92-03_g2` (`2 passed`, exactly 2 tests)       | ✅                                                                                                          |
| `scripts/probe-edge-auth.sh`             | 92-01 → `92-04_g2`, `92-09_g2` (stdout `fn -> status`) | ✅                                                                                                          |
| `supabase/functions/_shared/auth.ts`     | 92-04 → `92-05..08_g2` scope guards                    | ✅ — the guards carry `':(exclude)supabase/functions/_shared/auth.ts'`, correctly anticipating 92-04's edit |
| `92-DEPLOY-LEDGER.md`                    | **92-04 (`<files>` only)** → `92-09_g1`                | ❌ **the instance**                                                                                         |

**The rule:** enumerate cross-plan artifacts from `files_modified` **and** every `<files>` block and
every `<artifacts>` path in every plan. For each one found, the producing plan must either be gated
on the consumer's format, or the consuming gate's parse must be **positive-controlled against a
synthetic row in the mandated shape** before either plan runs. An artifact whose only format check
lives in a downstream gate is an unverified contract, and a producing plan that closes green while
holding one has not been measured.

Corollary: reformatting such an artifact to the shape its own plan mandates is an **artifact** edit,
not a gate edit — it does not trigger the no-gate-edits rule. Preserve the original losslessly, keep
exactly one table visible to the counter, and re-run the consuming gate with the expected count
stated **before** the run.

#### C9b — THE CONSUMER SET IS NOT BOUNDED BY THE PHASE

**Added 2026-08-15 during Phase 93 PLANNING (`RULING-P93-01`, `D-57`), before the instance could
fire.** Caught by inspection rather than by a red gate, which is the only reason it is cheap.

C9a fixed _where_ to look for producers (`<files>` blocks, not only `files_modified`). It did not fix
_how far_ to look for _consumers_. Its own wording — "every plan that references it" — silently scopes
the search to the current phase's plan set, because that is the only set a planning-time sweep has in
hand. **A shipped test from an earlier phase is a consumer too, and it is invisible to that sweep.**

**The Phase 93 instance.** `93-UI-SPEC.md` extracts a shared `QueryErrorState` component. Variant A of
that markup already exists, unshared, at `frontend/src/pages/delegations/DelegationManagementPage.tsx:215-237`
— landed by Phase 92-03. `tests/e2e/92-delegations-error.spec.ts` asserts that block's **current DOM
shape**. So extracting the component turns a **Phase 92** spec red, **for a correct change**. That is
the most expensive kind of red: it arrives during execution, it looks exactly like a regression, and
the natural reaction is to revert the correct edit.

**The rule.** A cross-plan artifact sweep must enumerate consumers across **every shipped phase**, not
only the phase being planned. Concretely: for every file a plan modifies, find the tests already in
the tree that assert that file's rendered output, DOM, or response shape. Each one found is either
(a) updated in the SAME task as the modification, with its re-run named as an acceptance criterion, or
(b) explicitly recorded as a NAMED non-consumer with the reason. Discovering it at execution time is
neither.

**The derivation.** Identifier-based, run against the phase base tag. **This exact script was
dry-run against `phase-92-base` before being written down** — the two naive versions that preceded it
are recorded below, because each failed in a way that would have made the clause useless in practice.

```bash
set -o pipefail
test -d tests || { echo "MISSING ROOT: tests"; exit 1; }
git rev-parse -q --verify refs/tags/phase-NN-base >/dev/null || { echo "MISSING TAG"; exit 1; }
for f in $(git diff --name-only phase-NN-base -- frontend/src supabase/functions); do
  b=$(basename "$f" | sed -E 's/\.(tsx?|jsx?)$//')
  # An edge function's identity is its DIRECTORY, not the basename `index`.
  if [ "$b" = "index" ]; then id=$(basename "$(dirname "$f")"); else id="$b"; fi
  case "$id" in auth|utils|types|config|helpers|constants|_shared)
    echo "AMBIGUOUS (triage by hand): $f"; continue;; esac
  hits=$(grep -rlE -- "\b${id}\b" tests || true)
  [ -n "$hits" ] && printf '%s <- %s\n' "$f" "$(echo "$hits" | tr '\n' ' ')"
done
```

**Two failure modes this went through, kept because the next author will otherwise repeat them:**

1. **Substring matching floods the output.** `grep -rl "$id"` with `id=auth` matched ~40 test files.
   Word-boundary matching (`grep -rlE "\b${id}\b"`) plus a stoplist for genuinely generic identifiers
   is the minimum.
2. **Basename is the wrong identifier for `<name>/index.ts`.** Every edge function in this repo is
   `supabase/functions/<name>/index.ts`, so a basename rule collapses all of them to `index` and the
   stoplist then skips **134 of 139 files** — a clause that skips its own subject. Use the parent
   directory when the basename is `index`.

Against `phase-92-base` the corrected form reports **18 coupled files and 1 ambiguous**, and it finds
both live Phase 93 instances: `DelegationManagementPage.tsx` and `my-delegations/index.ts`, each
consumed by `tests/e2e/92-delegations-error.spec.ts`.

Widen `id` further where coupling is by rendered identity rather than by file: a `data-testid`, an
exported component name, a route path.

**The output is a CANDIDATE list, not a defect list.** Common nouns (`dossiers`, `events`,
`countries`) match dozens of tests that merely mention the domain. Triage each candidate to "does
this test actually assert the output I am changing?" — the derivation narrows the search; it does not
answer it.

**What this derivation CANNOT see, stated as part of the rule rather than discovered later:** a test
coupled to a component by **shape alone** — asserting `getByRole('alert')` plus visible text, naming
neither the file nor any identifier in it — matches no grep and will not appear. The residual defence
for that class is not a sweep; it is **running the shipped suite before the phase closes** and reading
the reds rather than assuming they are stale.

**Why this clause exists at all, said plainly.** This is the **third** instance of one class —
_a correct instrument pointed at a set narrower than the truth_. First: Phase 92's AUTH-02 closing
grep, correct over `index.ts` and blind to the helpers that carried the pin (`D-43`/`D-48`, which is
why "every closing derivation states its population definition" became a grading condition). Second:
C9a itself, correct over `files_modified` and blind to `<files>` blocks. Third: this one, correct over
the phase's plans and blind to prior phases' tests. **Three instances is past the point where
alertness is the remedy.** The scope of a search is now part of what the standard specifies, not part
of what the author is trusted to remember.

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
