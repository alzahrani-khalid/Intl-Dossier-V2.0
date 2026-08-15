# Phase 92 — decision-coverage gate: falsification drill

**Run:** 2026-08-15 · **Scanner:** `scripts/decision-coverage.mjs` (landed in-repo, re-runnable)

A checker whose failure mode is silence cannot be trusted on a clean run: a zero result cannot
distinguish _every decision is cited_ from _the scanner is blind_. Required by `RULING-P92-01` R1.
Written to disk per `RULING-P92-17` — a drill that exists only in a transcript is not evidence.

## Derivation command — re-run this instead of quoting the number

```bash
node scripts/decision-coverage.mjs \
  .planning/phases/92-session-integrity-edge-function-auth \
  .planning/phases/92-session-integrity-edge-function-auth/92-CONTEXT.md
# exit 0 = pass, exit 1 = uncovered decisions exist
```

## Scanner scope (pinned to the real gate, divergences declared)

- Scans: frontmatter `must_haves` / `truths` / `objective`; body sections under headings or
  XML tags matching those names. Fenced code blocks and HTML comments stripped first.
- **Excludes `<task>` / `<tasks>` bodies.** The real gate does not scan task bodies. An earlier
  revision of this scanner did, which let a `D-NN` in a task _name_ satisfy coverage — caught by
  this drill, not by review.
- **Stricter than the real gate:** token-match only, no 6-word soft-phrase match. It can report
  uncovered where the real gate passes; never the reverse.

## Step 1 — baseline

```
exit: 0
covered: 30 of 30
uncovered: []
```

## Step 2 — delete exactly one citation

Target **D-22**, which has exactly **one** occurrence in the whole scanned surface (`92-02`
frontmatter `truths`). Two earlier attempts targeted D-16 and D-28 and both stayed green —
**correctly**, because each had a second citation (D-16 in another plan, D-28 in 92-02's
`objective`). Those greens were drill-design errors of mine, not scanner failures; recorded
because a drill that only reports its successful attempt is not evidence either.

Line removed verbatim:

```yaml
- "Decisions covered — D-22: exactly ONE live seam is edited — authStore.handleAuthStateChange's SIGNED_OUT branch — with the five-site live/no-op/dead classification carried as evidence; D-10: no six
```

## Step 3 — re-run. MUST report D-22 uncovered.

```
exit: 1
covered: 27 of 30
uncovered: ['D-10', 'D-11', 'D-22']

RESULT: RED — D-22 detected as uncovered. The scanner fires.
```

## Step 4 — restore, re-run, confirm the green returns

```
exit: 0
covered: 30 of 30
uncovered: []

RESULT: restored — drill complete, instrument validated.
```

## What this drill does NOT establish

It shows the scanner detects a **deleted citation**. It says nothing about whether a cited
decision is genuinely _implemented_ — a citation truth is a claim, and this gate only checks the
claim exists. Semantic coverage is the plan-checker's job, and no green here substitutes for it.
