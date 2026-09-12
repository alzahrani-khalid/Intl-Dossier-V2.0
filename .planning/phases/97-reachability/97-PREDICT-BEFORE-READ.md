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

## Verify a filing by IDENTIFIERS-INSIDE — and choose SHORT ones

**A presence count verifies PRESENCE, never INTEGRITY.** `body=1 table=1` reported SUCCESS over
an entry whose every identifier had been emptied by shell command-substitution — the route, the
ruling, the table and the hook all gone, the counts both green. So verify a filing by naming the
identifiers that MUST appear inside it and counting each.

### The amendment: identifiers must be SHORT and DISTINCTIVE, never a phrase

Stated without a length qualifier, that rule fails. Checking one such record, an identifier
returned **0** — not because the content was missing but because the phrase **WRAPPED across two
lines**, and a line-based matcher cannot see across a wrap. The content was intact; a
whitespace-joined check found all three tokens.

**The self-defeating shape, which is why this matters:** a zero produced by a wrap is
**INDISTINGUISHABLE** from a zero produced by corruption — which is exactly the failure the rule
was invented to catch. **A badly-chosen identifier makes the integrity check report the very
defect it exists to detect.**

### The unification — this project already held the same law on a different medium

The overseer skill already requires probing a pane read-back with the **shortest distinctive
token** — a commit hash, a pid, an id — **never a sentence**, because a long phrase crosses the
terminal's RENDER WRAP boundary and grep returns zero on a message that arrived intact.

Same failure, different medium: **terminal render wrap** there, **prettier reflow** here, and
**editor soft-wrap** elsewhere.

> **GENERAL FORM: any line-based matcher fails on a token longer than its medium's wrap width.
> The media differ; the remedy is identical — choose the SHORTEST DISTINCTIVE token, or join
> lines before matching.**

Good identifiers: a filename, a symbol, a ruling id, a commit sha, a testid.
Bad identifiers: a sentence, a quoted phrase, anything whose length approaches the wrap column.

### Second amendment, earned the same way: identifiers must be CASE-STABLE too

Immediately after the wrap amendment shipped, the very next integrity check returned **0** again —
this time because the token was written lower-case in the check and the document renders it as an
upper-case heading. **Case-sensitive 0, case-insensitive 1. Content intact, again.**

So the failure is not specific to wrapping. **Any transformation between what you WRITE and what
the medium STORES defeats a literal matcher** — wrap, case, smart quotes, an em dash normalised by
a formatter, a path rewritten relative. Prose is transformed on the way in; identifiers should be
chosen from the parts that are NOT.

**Practical rule: pick tokens no formatter will touch** — `ENGREAD-01`, `dossier-api.ts`,
`d561738fa`, `TS2344` — and match case-insensitively when the token could appear in a heading.
Prose fragments are not identifiers, however distinctive they sound.

### THE STRUCTURAL FIX: make the check SELF-DIAGNOSING — `scripts/verify-tokens.mjs`

Better identifiers reduce the false-alarm RATE. They do not fix the failure mode, because **the
next transformation will be one nobody enumerated.** And the cost of false alarms is not wasted
time — it is _credibility_:

> **A check whose FALSE ALARMS outnumber its catches will be ignored by the next reader — and the
> first time "probably the grep again" is wrong is the corruption the check existed to catch.**

Three consecutive false alarms is already past the point where a human starts waving zeros away.

**So on a zero, the check re-runs the match under every KNOWN transformation and reports WHICH
variant matched** (literal → case-insensitive → whitespace-joined → joined+case →
punctuation-normalised). A false alarm resolves itself inside the same command; a **TRUE** alarm
is the case where every variant still returns zero — a far stronger signal than a bare zero.

```
node scripts/verify-tokens.mjs <file> <token> [<token> ...]
```

Drilled in both directions on the real historical cases:

<!-- prettier-ignore -->
| Case | Result |
|---|---|
| `invisible scope limit` (heading case) | `ok(case-insensitive)` — auto-resolved |
| `bucket private exists` (line wrap) | `ok(whitespace-joined)` — auto-resolved |
| `CASE-STABLE`, `TS2344` (good tokens) | `ok` literal |
| `ThisTokenDoesNotExistAnywhere` | **MISSING under every variant**, exit 1 — a real alarm |

**All three of this leg's false alarms become automatic passes with a note, and the alarm now
means exactly one thing.** Good token choice is the first line of defence; self-diagnosis is what
keeps the check TRUSTED once a token choice is imperfect — **and the check only has value while
someone still believes its zeros.**

## THE MEDIUM A LAW WAS LEARNED ON BECOMES AN INVISIBLE SCOPE LIMIT

**This is why the amendment above was needed at all, and it is the more valuable finding.**

The wrap law already existed in this project — for **pane read-backs**, in the overseer skill.
It had been learned, paid for, and written down. It was then **re-earned at full price on a
neighbouring medium** (prettier reflow, in a committed file) by two seats who had both read the
original.

Nobody ever wrote _"this applies only to panes."_ They did not have to. **The medium a law is
learned on silently becomes its scope**, because a later reader meets the rule inside a
pane-shaped context and never asks which other surfaces share the shape — files, JSON payloads,
log tails, diff output, anything with a wrap or truncation boundary.

> **THE PRACTICE, recorded as a practice and not as an observation: at the moment you record a
> law, ask what OTHER surfaces have this shape, and NAME them in the entry — or state explicitly
> that you did not check.**

Stating "not checked" is enough. The failure is not incompleteness; it is **silence that reads
as completeness**, which leaves the next reader with no signal that the law might be wider than
the example that produced it.

The cost of skipping it is measured, not hypothetical: **a known law, re-earned at full price,
by two seats who had both read it.**

PREDICT-BEFORE-READ-END
