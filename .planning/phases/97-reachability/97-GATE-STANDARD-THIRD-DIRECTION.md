# The THIRD direction — a hole in the two-direction gate drill itself

**Committed on purpose**, beside `97-MODEL-SEATS.md` and `97-PARALLEL-TRUTH-CLASS.md`. The
overseer chain (`.tickmarkr/overseer/`) is gitignored; this is a finding about the **shipped
gate standard**, so it outlives Phase 97 and belongs where the next phase can find it.

Raised 2026-08-17 by the overseer, from the orchestrator's framing of the cross-model
spot-check question. **Destination: a `GATESTD` register row, owner Phase 102**, beside
`GATESTD-01` (the BSD-`sed` C9b escape), `GATESTD-02` (a config-enabled step that skipped in
silence) and `GATESTD-03` (the decision-coverage gate silently dropping sub-lettered ids).
Same neighbourhood, same failure mode: **an instrument whose limitation is invisible.**

## The hole

`GATE-STANDARD-P92.md` C1 requires a gate be observed in **two** directions:

1. **RED** on the undone tree, and
2. **GREEN** on a constructed work-done state.

Both are necessary and neither is sufficient, because **the work-done state is constructed by
the same author who wrote the gate.** The author builds the implementation they had in mind,
and the gate passes against it. Nothing in the procedure ever asks whether the gate would ALSO
pass against a _different_ implementation — a wrong one.

So a gate can be, simultaneously:

- red on the undone tree ✓ (C1.1 satisfied),
- green on the author's done-state ✓ (C1.2 satisfied), and
- **green on a WRONG done-state** ✗ — untested, unnamed, and invisible to the standard.

**The two-direction drill measures whether a gate can distinguish DONE from NOT-DONE. It never
measures whether the gate can distinguish RIGHT from WRONG.**

## Why it matters here specifically, with this phase's own example

Phase 97's canonical instance: a criterion asserting _"the Elected Officials card appears"_ is
**fully satisfied by a card rendering a fabricated `0`** — which is the exact defect the phase
exists to remove. That gate would be red before the work (no card), green after the work (card
present), and green on the wrong implementation (card present, number fabricated). It passes
C1 in both directions and still lets the defect ship.

This is not a hypothetical failure mode invented to justify a rule. It is the shape the phase
was already fighting in three separate places (the fabricated `0`, the desktop-only settings
green, the comment-presence pin that could not assert the comment's truth).

## What was done about it

A **cross-model spot-check** was aimed at exactly this third direction — the first instrument
this project has pointed at it. Scoped to the three highest-risk plans (`97-04` type guard,
`97-05` count reality, `97-07` viewport matrix), one question: _find a gate that stays GREEN if
the work is done WRONG rather than merely undone._ Advisory, not gating; findings required
file:line citations.

### Result — **CONFIRMED, first outing. Three instances.**

Ruled `RULING-P97-06-GREEN-ON-WRONG.md` (2026-08-17). The probe found the shape immediately,
**in a plan set authored under heightened attention to exactly this failure** — the least
favourable ground for the hypothesis, and therefore the strongest evidence available that two
directions are insufficient. P102's remedy moves from speculative to evidence-backed.

**The evidence of record is the orchestrator's independent reproduction, not the spot-check
report.** Run with the repo's own `tsc --strict --noEmit`, exit codes captured directly (never
through a pipe), three ways:

<!-- prettier-ignore -->
| Case | Result |
|---|---|
| SOUND guard `AssertNever<T extends never>` + merge present | **exit 2** — `TS2344: Type '"elected_official"' does not satisfy the constraint 'never'` |
| NEUTERED guard `AssertNever<T>` (constraint dropped) + merge present | **exit 0 — compiles CLEAN** ← green on WRONG |
| CONTROL: sound guard, no merge | exit 0 clean — proves the instrument is not always-red |

`97-04`'s gate greps the **substring** `AssertNever` and runs `pnpm typecheck` on the
**unmerged** tree. It never performs the merge, so it cannot tell a sound guard from a neutered
one.

**All three findings are ONE class: a gate asserting TEXT instead of exercising BEHAVIOUR.**

<!-- prettier-ignore -->
| # | Plan | The gate asserts | What passes it while broken |
|---|---|---|---|
| 1 | `97-04:171,213` | the substring `AssertNever` exists; typecheck green on unmerged code | a neutered `AssertNever<T>`; a hand-typed 8-member `DOSSIER_CARD_TYPES` instead of a spread-derived one |
| 2 | `97-05:200` | `-eq 0` absence over `sed`-scoped ranges, no positive precondition | a hoisted `ZERO_STATS` constant used as `?? ZERO_STATS` — defeats both checks, reproduces the fabricated zero |
| 3 | `97-07:224`, `97-01:208` | a title-substring grep for `'mobile 390'` + one un-counted Playwright run | six **skipped** mobile tests — `test.skip()` and pass are indistinguishable by exit code. The repo's own `chromium-mobile` project (`playwright.config.ts:49-57`) is invoked by NO gate |

**Uniform remedy (ruled):** perform the wrong-thing mutation and observe the red, or assert the
positive fact. Never assert that text describing the guarantee exists.

### The lesson that outlives the phase

**The class migrates to wherever nobody is looking.** The sequence, exactly as it happened:
a comment-presence pin was rejected because a comment can be present _and false_; a
compile-time guarantee was built to replace it — correctly, and it genuinely works; and then
**the grep-pin reappeared one layer up, in the gate verifying the compile-time guarantee.**
Fixing an instance does not retire the class. It relocates it to the layer that was not being
examined at the moment of the fix.

### Recorded against the standard itself

`ACCEPTANCE` condition 3 has demanded "zero vacuous guards" for three phases while
`gate-drill.mjs` is **structurally blind to this class** — P95 and P96 established
red-on-undone and green-on-done, never green-on-wrong. Those phases' vacuous-guard greens were
bounded by an instrument that could not see this shape. Stated, bounded, on the record.

## EXECUTION-LEG ADDENDUM — the class found in this phase's own gates

Added 2026-08-17 during execution (`RULING-P97-09`, `-10`, `-11`). The plan-leg entry above was
diagnostic; these are **measured instances in the accepted gate set**, found only after wave 1
began landing.

### A gate is only fully observed at the moment it FIRST GOES GREEN — and nobody is looking then

**The strongest evidence this phase produced.** Four gates carried a vacuous clause
(`pnpm --filter frontend …`, matching **no package** — the workspace is `intake-frontend` — and
therefore exiting **0 for any input**, verified by control with a spec that cannot exist).
After the ruled repair, the full drill was re-run and compared against the pre-repair run:

```
pre-edit  exits: {"0": 8, "1": 21}
post-edit exits: {"0": 8, "1": 21}     ← ZERO gates changed colour
```

**Identical.** The four vacuous clauses were **MASKED by earlier failing clauses in their own
`&&` chains**, so their vacuity could surface only at the moment the work landed — a **FALSE
GREEN SCHEDULED FOR CLOSE**, the worst possible timing.

**Therefore, at authoring time such a clause is not merely unexamined — it is UNOBSERVABLE.**
Per-gate review cannot catch this class **by construction**: nothing the reviewer can run will
reach the clause while an earlier one is red. **This turns green-debt-paid-per-plan from a
convention into a necessity** — the first green is the only moment the whole chain is exercised,
and it must be watched deliberately rather than celebrated.

**A clause proven in ISOLATION is not proven in COMPOSITION.** Both G1 and G2 were sound as
standalone drills during plan revision; both failed the moment they ran inside their real chain
(G1 against `noUnusedLocals`, G2 against the real package name).

### THE DETECTION RULE — a set-intersection test, not a careful read

**A clause-contradicts-clause defect can only exist where the ANCHORED-FILE-SET intersects the
CHECKED-FILE-SET.**

- **ANCHORED-FILE-SET** = the files whose _source form_ a clause mandates (every `grep -q "^…"`
  target in the chain).
- **CHECKED-FILE-SET** = the files some other clause in the _same chain_ submits to a tool that
  can reject a form — a compiler, a linter, a formatter, a test runner.

**Empty intersection ⇒ the shape is structurally impossible.** No mandated form can offend a
tool that never reads the mandated file.

Worked from this phase: `97-04` g1 anchored a form in `dossier-type-guards.ts`, which `tsc`
compiles — **intersection non-empty**, and that is exactly where the contradiction lived
(`noUnusedLocals` rejects the unexported form the anchor demanded). `97-10` g1/g2 and `97-11`
g1/g2 anchor forms in `97-NAV04-DECISIONS.md`, a **markdown** artifact `tsc` never reads —
**intersection empty**, cleared structurally rather than by inspection.

**Why this matters for P102: it converts an expensive SEMANTIC review into a cheap STRUCTURAL
filter.** You do not read every gate's meaning. You compute two sets per gate, and only the
gates whose sets intersect need semantic reading. In this phase that shrank the work from 29
gates to **5**, and of those 5 only **1** was real.

**The rule generalises to every checker, which also closes the blind spots named below:** an
anchor-versus-LINT contradiction is the same test against the linted file set; anchor-versus-
formatter against the formatted set; anchor-versus-test-runner against the files the runner
imports. **Enumerate the tool's file set, intersect, read only the overlap.**

### A NEGATIVE CONTROL THAT PASSES HAS NOT PROVEN THE SUBJECT IS FINE

**It has proven you mutated something INERT.**

Measured, 2026-08-17, while drilling the corrected settings-nav oracle. The negative direction
required the assertion to go RED against a route genuinely lacking settings nav. The drill
mutated `SETTINGS_CHILDREN` — and **passed**. The pass was the tell: a correct negative control
_must_ fail, so a green one is a finding about the DRILL, never a reassurance about the subject.

Cause: the tests **hardcode their routes at the call site**
(`assertChildRendersNavigation(page, '/settings/webhooks')`). `SETTINGS_CHILDREN` is a
**MANIFEST NOTHING READS**. The mutation changed a list with no consumers.

**Two consequences worth writing down.**

1. **This is ANOTHER instance of this phase's own parallel-truth class** — a manifest and a call
   site holding the same list, with the consumers reading the hardcoded copy. Identical shape to
   the 7-type list in three arrays and the package name copied into five gates. The manifest
   looked authoritative precisely because it was the only place the list appeared _as a list_.
2. **The remedy is the one this phase already earned: PRE-ASSERT THAT THE MUTATION LANDED.**
   `97-04`'s gate asserts the member count moved 7 → 8 before compiling, so a silently-failed
   splice cannot be mistaken for a passing drill. Applying that here — verifying the mutated
   call site actually changed in the drill copy — is the same lesson **transferred by a different
   seat to a different artifact**, which is the strongest available evidence that a recorded
   lesson took rather than merely being written down.

**Companion, from the drill's FIRST attempt:** it exited 1 from a **syntax error** in the
generated file. That was refused as evidence — **UNABLE TO MEASURE, not a red** (C2). An
instrument that fails to run has said nothing about its subject, and a non-zero exit from a
broken instrument is the easiest fabricated proof there is.

**Bounds get their derivation attached.** The corrected oracle's wait is stated as
`5000 ms = 5.2× the measured worst case (968 ms)`. A bound carrying its derivation cannot later
be read as arbitrary, and the next author can tell whether a slower page invalidates it.

### TRANSIENT ASSERTIONS — a gate must assert its OWN plan's deliverable

**A gate must never assert a CONSUMER's state that a LATER plan owns.** In a wave-ordered plan
set such a cross-plan assertion is **TRANSIENT BY CONSTRUCTION**: it is true when written and
false the moment the later plan does its job.

Measured instance (`RULING-P97-15`). `97-04` (wave 1) asserted that `DossierListPage.tsx`
references `DOSSIER_TYPES`. `97-05` (wave 2) then **correctly** migrated that file to
`DOSSIER_CARD_TYPES` — the 8-member display set the phase exists to deliver. The gate went red
because the work succeeded.

**The decisive detail: `97-04`'s own plan text PREDICTED the transition** — _"DB-7 today, card-8
after 97-05"_. The plan documented the change in prose while its gate pinned the pre-transition
state. That is what makes this a structural defect rather than a judgment call.

**Green-debt-per-plan silently assumes gates are MONOTONIC** — green once green. Wave ordering
breaks that assumption, and `GATE-STANDARD` never says so.

**Detector (mechanical, the same set-intersection move as the anchored/checked rule):** does the
gate's SUBJECT FILE appear in **another plan's `files_modified`**? If yes, the assertion is
cross-plan and transient; re-point it at the gate's own deliverable. A gate's own plan's prose
predicting a later change is the human-readable version of the same signal.

**The repair must be STRONGER, not merely non-red.** Replacing a stale assertion with a weaker
one that happens to pass is the failure this creates the opportunity for. Here the replacement
pinned the spread-derived form AND required exactly **one** declaration tree-wide — the second
clause guards the RE-DUPLICATION half of the parallel-truth class, not only the
re-literalisation half.

### WHOLE-SET RE-DRILL AFTER ANY POST-CLOSE MUTATION — it has TWO purposes

Re-drilling only the _moved subject_ is not enough. Run the **whole** set, and record both
things it establishes, because they are different claims:

1. **REGRESSION DETECTION** — did this edit break a gate somewhere else? (The reason the rule
   was ordered. It is how the stale `97-04` gate was found at all; without it that gate would
   have surfaced red at CLOSE and been read as a defect in the _work_ rather than in the _gate_
   — and the likely response under close-time pressure is to "fix" correct code back to a state
   the phase deliberately moved past.)
2. **SURGICAL-SCOPE PROOF** — did this edit affect _only_ what it intended? A colour diff across
   the full set showing **exactly one gate changed** is positive evidence of containment.

**A byte-diff shows what you CHANGED. A whole-set colour diff shows what you AFFECTED.** Those
are different claims, and only the second can be false while the first looks clean.

### Required review pass: CROSS-GATE SWEEPS FOR REPEATED LITERALS

Five gates carried the same wrong package name because a literal was **COPIED rather than
derived** — this phase's own parallel-truth class expressed in shell syntax. **A wrong value
duplicated N times is INVISIBLE to per-gate review by construction**: each gate looks internally
consistent, and only a sweep across all gates reveals that one literal is repeated and wrong.
Sweep every repeated literal (package names, script names, project names, paths, testids) across
the whole gate set, and **report the count CHECKED, not merely the count found.**

### Required: a repair must VERIFY THE CORRECTED FORM RUNS

Knowing what is broken tells you **nothing** about whether the replacement works. Correcting
`--filter frontend` → `--filter intake-frontend` alone would have produced
`pnpm --filter intake-frontend typecheck`, which fails `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT` —
the script is `type-check`. **The repair would have shipped a NEW broken command while looking
like a fix**, converting the class into a different failure. Only checking the package's scripts
**before** editing catches this; checking after means shipping and hoping.

### Propagation without code: derivation copies the defect

`97-VALIDATION.md` was **derived from** `97-RESEARCH.md`, so the wrong literal had already
propagated once through _document_ derivation. **The parallel-truth class does not need code to
spread — only a copy.** When correcting a literal, sweep the documents derived from the one you
are fixing.

### Quotation vs prescription (`RULING-P97-11`)

A residual wrong literal is classified by **what the sentence does**, not by the string:

- a **QUOTATION** of the defect is **EVIDENCE** — editing it falsifies the record (the worker's
  SUMMARY keeps its six occurrences, untouched);
- a **PRESCRIPTION** is an instruction that will be followed — it is corrected, with a line
  naming what changed and why, so the fix is legible rather than a silent rewrite.

A single file may contain both; classify per occurrence.

## The candidate remedy (for P102, not adopted here)

A third C1 direction: **GREEN-on-WRONG is a FAILURE.** For gates whose criterion contains a
"the thing appears / exists / is present" claim, the author constructs not only the done-state
but a **plausible WRONG state** — the implementation a hurried executor would actually produce
— and observes the gate go **red** against it. Where a wrong-state cannot be constructed, the
gate records `WRONG-STATE NOT CONSTRUCTED: <what and why>`, in the same spirit as C1's existing
`NOT CONSTRUCTED` clause.

Cost is real and the remedy is not free — it roughly doubles per-gate drill effort — so scoping
it (e.g. only to presence-shaped criteria, which is where the shape concentrates) is part of
what P102 has to decide. **This document files the hole; it does not amend the standard.**
Amending a shipped instrument mid-phase without a ruling is what `GATESTD-01`'s standing note
forbids.

THIRD-DIRECTION-END
