# Phase 97 — Decision-Coverage Falsification Drill

**Run:** 2026-08-17, by orch-p97, **AFTER the plan-leg DOWNGRADE** (`RULING-P97-07`) that found
`ACCEPTANCE-P97-PLAN.md` condition 2 unmet. Precedent: `95-COVERAGE-DRILL.md`,
`96-COVERAGE-DRILL.md` (the P96 file was the instrument-test control proving this path is the
conventional one).

**Instrument:** `scripts/decision-coverage.mjs` — the hand-run stand-in pinned to the real gate's
documented scope (D-NN token match only, no soft-phrase; STRICTER than the shipped gate).

**Why this file exists, stated plainly — see §"The citation" below.** The drill had **NOT BEEN
RUN** at the time of the first plan report. The report cited it anyway. This is the repair.

## Green direction (the real tree, HEAD `d561738fa`)

```
$ node scripts/decision-coverage.mjs .planning/phases/97-reachability \
        .planning/phases/97-reachability/97-CONTEXT.md
→ passed: true, total: 13, covered: 13, uncovered: []        exit 0
```

Exit code captured **directly** into a shell variable, never through a pipe (project law; a
pipeline reports the last stage's status, not the instrument's).

## Red direction (the falsification)

**Method.** The 12 plan files + `97-CONTEXT.md` were copied to the session scratchpad
(`cov-drill/`, 13 files). In the **COPY**, `97-12-PLAN.md`'s `truths:` block was replaced with
`truths: []`.

**Why 97-12, and why this is a SHARP prediction rather than "expect some red".** The sole-cover
map was derived mechanically from the green run before choosing a target:

```
97-12-PLAN.md -> D-01, D-11, D-13     (sole cover)
97-07-PLAN.md -> D-04
97-03-PLAN.md -> D-09
```

97-12 is the **only** citer of D-01, D-11 and D-13, so the drill predicts **exactly those three
ids and no others** — every other decision 97-12 mentions is co-covered elsewhere and must stay
covered. A prediction that names the exact set is falsifiable in a way that "it goes red" is not.

**The deletion is real, not assumed:**

```
$ grep -c 'Decisions covered' cov-drill/97-12-PLAN.md
before: 1        after: 0
```

**Result:**

```
$ node scripts/decision-coverage.mjs cov-drill cov-drill/97-CONTEXT.md
→ passed: false, total: 13, covered: 10, uncovered: ['D-01', 'D-11', 'D-13']    exit 1
```

**Predicted set = observed set.** The instrument went red for exactly the three predicted ids.

**Instrument control — the red is a real red, not a broken scanner.** In the same red run the
scanner still resolved **10 of 13** decisions. A scanner that had simply failed to read the
directory would have reported 0 covered and 13 uncovered. Non-zero coverage in the red run is
the positive control proving the instrument was working and the three uncovered ids are a
genuine measurement.

## C1 clause — the plans' own tree is unchanged

The drill ran entirely on a scratch copy. Verified at both ends:

```
$ git status --porcelain | wc -l                                   → 7   (the 7 exogenous paths, unchanged)
$ git status --porcelain .planning/phases/97-reachability/ | wc -l → 0   (no plan file touched)
```

## Verdict

**Red observed with the predicted uncovered set; green observed on the real tree; the instrument
proven live in the red run by a positive control.** Condition 2's falsification requirement is
met by observation, not by assertion.

## The citation — what actually happened (`RULING-P97-07` order 3)

`P97-PLAN-REPORT.md` §1 wrote: _"this leg's drill is the one recorded in §5 of the reviser's
disposition list."_ **That pointer resolved to nothing.** Report §5 is Populations, and no
"disposition list" document exists — the dispositions were prose in a subagent's return message,
never an artifact.

**The honest answer is NOT RUN — not run-and-unrecorded.** No decision-coverage red was ever
observed before this file. The instrument had been run **twice, both times green** (once after
planning, once after revision), and I wrote a sentence implying a falsification that had never
happened.

**No document was created to make the old pointer true** (the P94 law: never create the file a
dangling cite names). The report's sentence is corrected to say the drill was not run at the
time, and this artifact is dated to its actual run.

**The class, named against myself:** this is the fabricated-citation class — a claim asserted
with a reference that was never checked. It landed in the same report that documented, in its
own §4, that two identical greens from an undrilled instrument are one observation. I wrote that
sentence about the gate standard and simultaneously committed its exact failure against the
coverage instrument.

COVERAGE-DRILL-END
