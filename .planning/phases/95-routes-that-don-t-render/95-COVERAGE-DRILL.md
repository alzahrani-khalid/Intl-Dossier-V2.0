# Phase 95 — decision-coverage falsification drill (planning leg)

**Run:** 2026-08-16, at plan authoring, by the gsd-planner. Per `ACCEPTANCE-P95-PLAN.md`
condition 2: the gate is seen RED before its green is trusted. Method per the P92 precedent
(`92-COVERAGE-DRILL.md`): break the instrument's subject in a SCRATCH COPY, observe red,
restore, observe green. The real plan tree was byte-identical throughout (verified with
`git status --porcelain` — the nine plans stayed exactly as authored).

## Command

```bash
node scripts/decision-coverage.mjs .planning/phases/95-routes-that-don-t-render \
  .planning/phases/95-routes-that-don-t-render/95-CONTEXT.md
```

## GREEN — the real tree

```
exit 0, passed: true, total: 20, covered: 20, uncovered: []
Coverage: D-01→09; D-02→09; D-03→01; D-04→02; D-05→03; D-06→04; D-07→05; D-08→06; D-09→07;
D-10→08; D-11→09; D-12→09; D-13→01,03; D-14→02,05; D-15→01; D-16→06; D-17→04,09; D-18→09;
D-19→02,06; D-20→09
```

## RED — scratch copy with one citation clause defaced

Defaced: the `D-15:` clause of 95-01's frontmatter citation truth (`D-15` → `DXX`).

```
exit 1, passed: false, uncovered: ['D-15']
```

## Instrument note — the FIRST drill attempt did NOT fire, and why that matters

The first drill removed 95-07's entire citation truth (sole `coverage` entry for D-09) and the
gate STAYED GREEN — because 95-07's `<objective>` body also contains the `D-09` token, and the
scanner reads objective bodies. That green was correct scanner behaviour, not a defect: coverage
counts any scanned surface, so removing one surface does not uncover a decision cited on two.
The drill was re-aimed at **D-15**, whose ONLY scanned occurrence is the 95-01 citation truth,
and the gate went red naming exactly it.

Durable lesson (the treat-a-sweep's-first-run-as-an-instrument-test law, GATE-STANDARD C9b
amendment note): a falsification drill must deface a subject the instrument covers exactly once,
or the "red" direction is unobservable and the drill proves nothing. The execution-leg drill in
plan 95-09 Task 1 should reuse this target class (a decision with a single coverage entry in the
current map) rather than an arbitrary truth.

## Requirement coverage, re-derived in the same session

```bash
for id in DEAD-01 DEAD-02 DEAD-03 DEAD-04 DEAD-08 DEAD-09 NOTFOUND-COMPONENT-01 RETENTION-CAST-01; do
  command grep -l "requirements:.*$id" .planning/phases/95-routes-that-don-t-render/95-*-PLAN.md >/dev/null || echo "MISSING $id"
done
# → no MISSING lines; 8/8. Population: the nine 95-*-PLAN.md files on disk.
```

COVERAGE-DRILL-END
