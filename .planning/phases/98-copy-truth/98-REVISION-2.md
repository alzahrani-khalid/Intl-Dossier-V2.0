# Phase 98 — Revision 2 (the six addendum blockers)

**Date:** 2026-08-18 · **Seat:** p98-planner · **Input:** team-lead round-2 message + `98-PLAN-CHECK-A.md` (read in full, 267 lines).
**Wave-structure disclosure: NO change** — 9 plans, 6 waves, same titles and ownership; the committed ROADMAP list at `1a30f45e2` stays accurate. Nothing committed by this seat.

## Timing note, with evidence — the six were applied before this round opened

The round-2 message's disk check (74-line `98-REVISION-1.md`; 4 `signals.json` refs in 98-05;
zero `intelligence-signals`) describes the tree BEFORE my addendum patches, which landed at
mtimes 02:52–02:57 (98-01 02:52:32, 98-05 02:53:28, 98-REVISION-1 02:57:19). The two checks
raced. Discriminating commands re-run at the top of THIS round, current tree:

- `grep -c "en/signals.json\|ar/signals.json" 98-05-PLAN.md` → **0**; `grep -c "intelligence-signals"` → **12**
- `98-01` names `useEntityLinks` exactly **once** — the disqualification statement (was 2; the second was a stale read_first, fixed this round, below)
- `98-REVISION-1.md` is **154 lines**, consolidated, and covers all nine blockers

One caveat honestly stated: the round-2 instruction "do not overwrite 98-REVISION-1.md" arrived
after I had already rewritten it into the consolidated form (its round-1-only text was
superseded in place). It is left untouched from here on; the six therefore appear in both
artifacts, and THIS file is the round-2 record of them.

## The six, each with what stands on disk (file:line at current tree)

**1. Criterion 6's PRIMARY oracle (dead entity-link mutation).** FIXED — and the residue found
this round closed. `98-01` interfaces (~:84-97): PRIMARY is `useUnifiedKanbanStatusUpdate`
(`useUnifiedKanban.ts` ~:388 — verified by me on disk, not adopted on say-so: options carry
`onError` ~:547 + `onSettled`, NO `onSuccess`, so `{...defaultOptions.mutations, ...options}`
leaves the global default live). The `:574` comment was read as instructed: it scopes to the
D-33 REFUSAL path — a refused commitment drop never creates a mutation — so the copy06 spec
(`98-01` ~:225-231) drives a TASK card only, adjacent-stage-and-back, never a commitment (also
the aa_commitments no-`review` hazard). `useEntityLinks` is named only to DISQUALIFY it (own
`onSuccess` at :123/:181/:219/:369 — a per-mutation handler REPLACES the default). Windowed
`onSuccess` scans are forbidden by the plan (my original false-negative instrument); any
replacement candidate is verified by whole-file grep. **Residue fixed this round:** `98-01:218`
(copy08 task's read_first) still pointed at `useEntityLinks.ts` with the stale "lacking
onSuccess" parenthetical — retargeted to `useUnifiedKanban.ts` with the verified facts.

**2. `signals.json` does not exist → RETARGET, not create.** FIXED with the corrected framing:
`98-05` frontmatter (:13-14), must_haves artifact, key_links, Task 1 files/action/gate all
target `frontend/src/i18n/{en,ar}/intelligence-signals.json` — the REGISTERED namespace
(`i18n/index.ts:402,538`; both files exist). The interfaces block (~:70-77) states why
`signals.json` must NOT be authored (unregistered namespace → inline-English fallback in BOTH
locales, D-10 — a no-op that looks like a fix) and the corrected mechanism: `SignalRow` has no
`useTranslation`; it receives `t: TFunction<'intelligence-signals'>` as a prop (:30), and the
repair routes through that existing prop. Zero `signals.json` references remain in the plan.

**3. Mask-audit cannot see its own control.** FIXED: `scripts/i18n-mask-audit.mjs` is now IN
SCOPE (`98-04` frontmatter :14 and Task 3 files :212) and Task 3's action EXTENDS it — a
ONE-ARG matcher resolved against the call site's effective namespace, full-list output (the
8-sample truncation removed), existing checks untouched. Both-polarity control: shown FIRING
pre-repair on the known-present one-arg site `EntityLinkManager.tsx:236` `t('entityLinks.title')`
(the exact row the stock 2-arg-only script provably cannot see — the false "known-present
control" claim is retracted and explained in the interfaces, `98-04:101-107`), and post-repair
firing on a planted scratch fixture while reporting the repaired families resolved. Result
bucketed BY CLASS (~501 sites / ~436 distinct keys at check HEAD — per-member verdicts at that
size are noise) with a verdict per class; the gate greps the one-arg marker (`98-04:257`).

**4. Recurrence class closed on a source grep alone.** FIXED per D-24: `98-01`'s copy02 spec
gains leg (c) — RECURRENCE CENSUS (`98-01:164-173`): derive the dot-form distinct-path set via
D-22's own derivation command (37 at check HEAD; the derived set governs, nothing frozen),
import `{en,ar}/calendar.json`, assert every derived path resolves non-empty under `recurrence`
in BOTH locales — plus the NAMED UNDRIVEN scope line in the spec header:
"RecurrencePatternEditor surface UNDRIVEN — closes on census per D-24; routing verified by
98-04's conservation gate". Never silent. (Driving the editor was the alternative; census +
UNDRIVEN is the D-24-sanctioned closure and avoids a form-flow the phase does not otherwise
touch.)

**5. 98-04 T2 gate ran copy02 before T3's regions fix.** FIXED: the copy02 run moved into
Task 3's gate (`98-04:257` — the task that lands the `toLowerCase` normalization), with D-09
discipline on the now-two-path Playwright invocation (both spec files existence-asserted
first). Task 2's gate ends at the census + aiSuggestions assertions; both acceptances re-worded
(`98-04` T2 acceptance names the move and why).

**6. 98-05 T2 gate ran copy01 before T3's week header.** FIXED: the copy01 run moved into
Task 3's gate (`98-05:184`); Task 2's gate ends at type-check; the backwards-pointing
acceptance sentence in Task 3 replaced with the runs-here statement, and Task 2's acceptance
names the move (B9).

## Carry-forward compliance

- **Both-polarity controls** on every touched oracle: recurrence conservation gate (`PRE ≥ 1`
  negative + `POST == PRE` with dot==0 positive, one chain, `98-04:257`); fillMock bundle grep
  (source-literal `grep -ci ≥ 1` negative + `Changes saved` ≥1 positive, one run,
  `98-07:185`); copy02's DOM detector and census resolver (in-spec fire-on-planted +
  pass-on-clean); the extended mask-audit finder (control both directions); the COPY-03 ar leg
  (old-value fire + repaired-file zero).
- **No frozen literals:** 43/37, 80/82/83, ~501/~436 appear only as check-time observations;
  every gate derives (conservation from the parent git blob; census sets re-derived from
  source; D-22's commands pulled from `98-CONTEXT.md` at HEAD).
- **Declined: nothing.** All six covered.

## Verification (re-run this round, after the residue fix)

- `decision-coverage.mjs`: **passed, 30/30, uncovered []**
- `gsd-sdk verify.plan-structure` on the re-edited 98-01: **valid, zero errors** (all nine were
  valid at the end of the addendum round)
- Same-wave collisions: **NONE** · single `.planning/REQUIREMENTS.md` writer: **1** (98-09)
- All 8 requirement IDs covered; every plan carries ≥1 D-NN-citing truth; no exogenous path in
  any file scope; nothing committed

REVISION-END
