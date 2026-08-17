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
