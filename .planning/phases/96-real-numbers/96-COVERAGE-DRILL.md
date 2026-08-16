# Phase 96 — Decision-Coverage Falsification Drill

**Run:** 2026-08-17, at planning, by the gsd-planner leg (P95 precedent: `95-COVERAGE-DRILL.md`;
ACCEPTANCE-P96-PLAN condition 2 — red seen before green is trusted).

**Instrument:** `scripts/decision-coverage.mjs` (the hand-run stand-in pinned to the real
gate's documented scope — STRICTER than the real gate: D-NN token match only, no soft-phrase).

## Green direction (the real tree)

```
node scripts/decision-coverage.mjs .planning/phases/96-real-numbers .planning/phases/96-real-numbers/96-CONTEXT.md
→ passed: true, total: 23, covered: 23, uncovered: []          exit 0 (captured directly, not through a pipe)
```

All 23 tracked decisions (D-01..D-23; Claude's-Discretion section untracked by the gate's own
rule) are covered across the 11 plans — the per-decision map is in the scanner output at run
time and re-derivable on demand.

## Red direction (the falsification)

Method: the 11 plan files + CONTEXT were copied to the session scratchpad
(`cov-drill/`); in the COPY, `96-11-PLAN.md`'s single frontmatter citation truth
(`Decisions covered — D-11 … D-15 … D-20 … D-21`) was deleted (`truths: []`), chosen because
96-11 is the SOLE cover for D-11, D-20 and D-21 (D-15 is co-covered by 96-07) — so the drill
predicts exactly three uncovered IDs, a sharper prediction than "some red".

```
command grep -c "Decisions covered" cov-drill/96-11-PLAN.md   → 0   (the deletion is real)
node scripts/decision-coverage.mjs cov-drill cov-drill/96-CONTEXT.md
→ passed: false, covered: 20, uncovered: ['D-11', 'D-20', 'D-21']   exit 1 (captured directly)
```

The instrument went red for exactly the predicted set — not merely non-green. The plans' own
tree was never touched (the drill ran on a scratch copy; `git status` over
`.planning/phases/96-real-numbers/` shows only the intentionally-created planning artifacts).

## Verdict

Red observed with the predicted uncovered set; green observed on the real tree; the scanner's
exit codes captured directly in both directions. The 23/23 green is TRUSTED.

Note (GATESTD-03 hygiene): every citation truth uses two-digit `D-NN` ids only — no
sub-lettered ids anywhere in the set (verified by the scanner's own extraction reaching 23).

COVERAGE-DRILL-END
