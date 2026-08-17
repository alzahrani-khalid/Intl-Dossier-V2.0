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

### Result

**PENDING** — filled in when the spot-check returns. Recorded either way, because **a clean
result on a first-of-its-kind probe is still information about the standard**: it bounds how
common the shape is in a plan set authored under heightened attention to it, which is the
weakest place to look for it and therefore the most favourable reading.

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
