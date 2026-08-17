# Predict every count before you read it

**A committed control**, beside `97-GATE-STANDARD-THIRD-DIRECTION.md`. Raised by the overseer,
2026-08-17, unifying two Phase 97 findings. The overseer chain is gitignored; this is reusable
method, so it ships.

## The control

**Before running any command that returns a count, write down the number you expect.**

- A **matching** count is weak evidence — it is consistent with a working instrument and with a
  broken one that happens to agree.
- A **mismatching** count is a **finding**, and one you would otherwise have to be lucky to
  notice.

Cost: one sentence. It requires no instrument, no control run, and no extra command.

## The independence requirement — without it this decays into a tautology

**The prediction must come from a source INDEPENDENT of the instrument you are about to run, and
you must WRITE THAT SOURCE beside it.**

If the prediction is derived by running the same query first, prediction and reading agree **by
construction** — and the control still _feels_ like verification while establishing nothing. That
is the same shape as two identical greens from an undrilled instrument counting as one
observation.

Independent sources are things like: a dispatch record, a plan's declared count, a register row,
a spec's own enumeration, a number stated in a ruling. Recording the source lets a later reader
**see** the independence instead of assuming it.

Worked example from this leg: _"I expect 4 workers alive — **source: my dispatch record, four
`herdr pane run` calls**."_ Independent of `pgrep`, therefore load-bearing. Observed 4 → match →
**weak evidence**, reported as such. Had the prediction instead been "whatever `pgrep` said last
time", the match would have proved nothing at all.

**Report a match as WEAK EVIDENCE.** The control's entire value is in the mismatch.

## Why it catches what instrument-testing misses

Instrument-testing answers _"does my tool work?"_ Predicting answers _"is my tool answering
about the population I think it is?"_ **Those are different failures**, and the second is the
one that reads as success:

- the **vacuous parser** worked perfectly and parsed **0 files** — and its "0 duplicate writers"
  AGREED with the planner, so agreement read as confirmation;
- the **truncated grep** worked perfectly and reported on the first 10 lines of a longer file;
- the **gate-drill JSON read** worked perfectly against `x.exit`, a field that does not exist
  (the schema is `x.run.exit`), so every gate scored `undefined` and "0 green" was an artifact;
- the **self-matching watcher** worked perfectly and counted itself, so its target could never
  be reached.

**Four of this leg's six recorded slips were wrong-population errors with a functioning
instrument** — across two different seats, orchestrator and overseer alike.

## The two findings it unifies

1. **The coverage drill.** The sole-cover map was derived FIRST, so the drill predicted
   **exactly `D-01, D-11, D-13`**. Observed set = predicted set. That is falsifiable in a way
   "it goes red" is not — a red on some other set would have exposed a broken instrument.
2. **The self-matching watcher.** `pgrep` returned **5**; **4** workers had been dispatched. The
   discrepancy — not the instrument — was the tell. Listing the matches showed the fifth was the
   watcher itself, whose own command line contained its own search pattern.

In both cases the finding came from **a prediction made before the reading**.

## Companion rule (from the same watcher bug)

**A watcher that greps process lists is a MEMBER of the population it counts.** Rewriting the
_pattern_ reproduces the bug verbatim, because any new pattern also appears in the new watcher's
own command line. Only abandoning pattern-matching — exact PIDs, `kill -0` — makes self-match
structurally impossible. **Fix the class, not the instance.**

### Exact PIDs earn their keep TWICE — record both reasons

A design defended by one argument gets re-litigated the moment that argument stops applying.
Exact PIDs remove **two independent** failure modes:

1. **SELF-MATCH** — the watcher cannot count itself (the bug that prompted the change).
2. **UNRELATED-MATCH** — the watcher cannot count _strangers_.

Reason 2 was demonstrated, not theorised, minutes after the change. At wave-2 dispatch a
predicted **4** wrappers met an observed **6** on `pgrep -f "caffeinate -i"`. Listing the matches
resolved it: PIDs `2731/2734/2739/2743` were the four real workers; `350` and `3768` were
unrelated `caffeinate -i -t 300` processes belonging to other tooling entirely. **The instrument
was correct and answered about the wrong population.**

**A pattern watcher armed at that moment would have counted two strangers as workers and waited
for them to exit** — a wave stalled indefinitely by processes that have nothing to do with it.
Exact PIDs make that impossible by construction too.

Recorded across two seats: this instance was the overseer's, caught by the same control that
caught the orchestrator's. **The control is seat-independent — which is the point.**

PREDICT-BEFORE-READ-END
