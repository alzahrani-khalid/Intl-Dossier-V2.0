# Phase 98 — Revision 1 (consolidated: check B + check A + overseer addendum)

**Date:** 2026-08-18 · **Seat:** p98-planner
**Inputs:** `98-PLAN-CHECK.md` (3 BLOCKING + 7 ADVISORY), `98-PLAN-CHECK-A.md` (9 BLOCKING + 9 ADVISORY, superset), team-lead addendum, overseer both-polarity requirement, D-22 amendment (`1a30f45e2`/`ddb6ec1f1`).
**Wave-structure disclosure (overseer item 3): NO change.** Still 9 plans, 6 waves, same titles and ownership — the committed ROADMAP wave list at `1a30f45e2` remains accurate. Nothing committed by this seat.

## BLOCKING — all nine fixed

**B1 — recurrence gate hardcoded 16 (`98-04`).** FIXED, derived both sides. Gate: dot-form == 0
AND colon-form POST == PRE, where PRE derives from the parent git blob of the last commit
touching `RecurrencePatternEditor.tsx` — a conservation equality, no literal (`98-04` T3 gate).
Overseer both-polarity added: `test "$PRE" -ge 1` is the negative control (same token instrument
shown finding the defect in the pre-fix blob); POST==PRE with dot==0 is the positive. D-22 is
now pulled from CONTEXT at HEAD (the amended row carries the DERIVATION COMMANDS — the plan
instructs pulling them from `98-CONTEXT.md` and recording occurrence + distinct-path results;
43/37 appear only as check-time observations, never as thresholds). The
`.understand-anything/.trash-*` exclusion (the 49-hit trap) is named in the interfaces.
Single-commit-per-file expectation stated for the parent-blob read. Truth, must_haves,
objective, read_first, action, acceptance all re-worded to derived language.

**B2 — criterion 6's primary oracle dead (`98-01` interfaces + copy06 spec).** FIXED, verified
on disk by this seat before adopting: `useEntityLinks.ts` has its OWN `onSuccess` at
:123/:181/:219/:369 (per-mutation replaces the default — my original window-scan produced the
false negative; the interfaces now forbid windowed scans and require whole-file `onSuccess`
grep for any candidate). PRIMARY promoted to `useUnifiedKanbanStatusUpdate`
(`useUnifiedKanban.ts:388`): its options carry `onError` (:547) + `onSettled` and NO
`onSuccess`, so `{...defaultOptions.mutations, ...options}` leaves the global default live. The
:574 "no global onSuccess" comment was read as instructed — it describes the D-33 REFUSAL path
(commitment drops refused before any mutation exists), so the spec drives a TASK card only,
adjacent-stage-and-back for idempotence, never a commitment (also avoids the aa_commitments
no-`review` constraint). Fallback rule: derive by whole-file grep, entity-links disqualified.

**B3 — copy02 console leg dead (`98-01`, `98-VALIDATION.md:83`).** FIXED by DROPPING the leg
with the loss stated (spec header requirement, interfaces, gate clause removed, must_haves
artifact retargeted, Task 3 RED expectations, VALIDATION row corrected to "e2e DOM detector +
census backstop"). `saveMissing: false` fact recorded; `i18n/index.ts` in no plan's scope;
revival path noted for a later phase. Overseer both-polarity applied to the surviving legs: the
DOM-detector regex must be shown FIRING on a planted `entityLinks.title` in-page fixture and
PASSING on a clean fixture in the same spec; the census resolver must report a planted `zz.nope`
unresolved while a known-present path resolves.

**B4 — `signals.json` does not exist (`98-05`).** FIXED using the team-lead's corrected framing:
retargeted to `frontend/src/i18n/{en,ar}/intelligence-signals.json` (the REGISTERED namespace,
`i18n/index.ts:402,538`; both files exist). No new namespace is created — the plan now states
that creating `signals.json` would ship an unregistered no-op falling back to inline English in
both locales (D-10). Interfaces corrected: `SignalRow` has no `useTranslation` — it receives
`t: TFunction<'intelligence-signals'>` as a prop (:30); the repair routes through that existing
prop. Frontmatter, artifacts, key_links, Task 1 files/action/gate all retargeted.

**B5 — bundle oracle case-blind (`98-07`).** FIXED in round 1 (`grep -ril "fill with mock
data"`); overseer both-polarity now added: NEGATIVE control `grep -ci` on the known-present
source literal in `IntakeForm.tsx` must return ≥1 in the same run (a pattern that cannot find
the string where it provably exists never ran), POSITIVE control `Changes saved` ≥1 in the same
dist artifacts. Acceptance re-worded to name both polarities.

**B6 — mask-audit cannot see its class (`98-04`).** FIXED: `scripts/i18n-mask-audit.mjs` added
to 98-04's `files_modified` and Task 3's files; the action now EXTENDS it — one-arg matcher
resolved against the call site's effective namespace, full-list output (8-sample truncation
removed), existing checks untouched. Both-polarity control: shown FIRING pre-repair on the
known-present one-arg site `EntityLinkManager.tsx:236` `t('entityLinks.title')` (the row the
old script provably could not see), and post-repair firing on a planted scratch fixture while
reporting the repaired families resolved. Result bucketed BY CLASS (~501 sites / ~436 distinct
keys repo-wide at check HEAD — per-member verdicts at that size are noise) with a verdict per
class. Interfaces bullet corrected (the false "known-present control" claim is retracted and
explained); must_haves truth rewritten to the satisfiable form; gate greps the one-arg marker.

**B7 — recurrence class closed on source grep alone (`98-01` copy02).** FIXED per D-24: copy02
gains leg (c), a RECURRENCE CENSUS — derive the dot-form distinct-path set via D-22's
derivation command (37 at check HEAD, derived governs), import `{en,ar}/calendar.json`, assert
every derived path resolves non-empty under `recurrence` in BOTH locales — plus the NAMED
UNDRIVEN scope line in the spec header ("RecurrencePatternEditor surface UNDRIVEN — closes on
census per D-24; routing verified by 98-04's conservation gate"). Never silent.

**B8 — 98-04 T2 gate ran copy02 before T3's regions fix.** FIXED: the copy02 run moved from
Task 2's gate to Task 3's gate (which lands the casing fix), with D-09 discipline on the
now-two-path invocation (both spec files existence-asserted first). Both acceptances re-worded.

**B9 — 98-05 T2 gate ran copy01 before T3's week header.** FIXED: the copy01 run moved from
Task 2's gate to Task 3's gate; Task 3's backwards-pointing acceptance sentence replaced with
the runs-here statement; Task 2's acceptance notes the move.

## ADVISORIES — check B (7/7, from round 1) and check A (9/9)

Check B's seven were fixed in round 1 and stand — enumerated here because this file is the
single artifact (the round-1 text was superseded in place, and the file is uncommitted so it
has no history):

- B-adv-1 (floor 82) — 98-01 census now derived-governs with the 80+2 decomposition (also A-A1)
- B-adv-2 (RED not machine-enforced) — `98-RED-BASELINE.md` closed-vocabulary gate in 98-01 T3 (also A-A5)
- B-adv-3 (`email` class invisible) — copy01 positive label leg: `Human entered` / `Urgent` assertions
- B-adv-4 (escapeValue premise) — 98-04 T-98-09 corrected to fact, disposition accept (also A-A6)
- B-adv-5 (19→30 figure) — 98-09 cites 30/30 @ `87b2d040e` (also A-A8)
- B-adv-6 (98-06 scope) — task files expanded round 1; frontmatter pairs added this round (also A-A3)
- B-adv-7 (burn-down false-red) — marker pinned to the single token `P98-BURNDOWN` in 98-02 + 98-07

Check A's nine, by its numbering:

1. **A1 (82 not a static floor)** — REFINED: 98-01 now states the 80-static + 2-dynamic = 82
   decomposition and warns `static >= 82` would be permanently red; census asserts the derived
   STATIC set.
2. **A2 (COPY-03 ar gate vacuous)** — FIXED: the gate gains an ar defect-term leg
   (المزروعة/التجريبية/بيانات الاختبار) with BOTH polarities (shown firing on the old ar value
   inline; zero on the repaired file), plus byte-exact new-AR-heading assertion. The EN-only
   sibling-sweep exclusion is now stated per D-05 with the key-parity rationale. The merged
   python was syntax-drilled this session and observed RED at HEAD on the real EN defect.
3. **A3 (undeclared derived file scope)** — FIXED: 98-06 frontmatter now declares all 13
   remaining exclamation namespaces as en+ar pairs (files_modified feeds collision checking);
   98-05 Task 2's files expanded to the ~9-file derived Part B set; 98-08 covered under its A4
   fix. Collision re-check after expansion: NONE.
4. **A4 (`navigation.json` does not exist)** — FIXED: 98-08 retargeted to
   `{en,ar}/common.json` (the navigation subtree) with "do not create navigation.json" stated;
   task files carry the derived-at-execution caveat.
5. **A5 (no machine gate on RED)** — FIXED in round 1 via `98-RED-BASELINE.md`: closed
   two-term vocabulary (RED / NOT CONSTRUCTED), exactly 8 rows, zero GREEN, all counts derived
   in the gate run; regex drilled both directions on a synthetic fixture.
6. **A6 (escapeValue premise)** — FIXED in round 1: T-98-09 re-worded to fact, disposition
   `accept`, "do not flip the option".
7. **A7 (`week.of` already exists)** — FIXED: 98-05 Task 3 is now code-only (drop the redundant
   defaultValue + format the ISO token); engagements.json removed from files_modified; the
   non-discriminating week.of-exists gate clause REMOVED; interfaces corrected.
8. **A8 (stale 19/30 figure)** — FIXED in round 1; 98-09 cites 30/30 @ `87b2d040e`;
   re-verified again this round: `passed, 30/30, uncovered []`.
9. **A9 (snake-token zero aggressive)** — FIXED: copy01's action now requires per-surface
   region narrowing with every excluded region NAMED in the spec header (a narrowing nobody can
   read is a silent scope cut).

## Overseer requirements

1. **Both-polarity controls on the vacuous-oracle class** — applied to all three: recurrence
   (PRE≥1 negative + conservation positive, one chain), fillMock bundle (source-literal
   negative + `Changes saved` positive, one run), console-leg replacement (in-spec
   fire-on-planted + pass-on-clean for the DOM detector AND the census resolver). Also
   propagated to the B6 finder extension and the A2 ar leg — every new or repaired instrument
   in this revision now carries both polarities.
2. **D-22 pulled from CONTEXT at HEAD** — read this session; the plans instruct pulling the
   derivation commands from `98-CONTEXT.md` D-22 and freeze no number.
3. **Wave-structure disclosure** — no change to wave count, plan count, plan titles, or
   ownership; the committed ROADMAP list stays accurate as-is.

## Post-revision verification (run this session, after all patches)

- `decision-coverage.mjs`: **passed, 30/30, uncovered []**
- `gsd-sdk verify.plan-structure`: **valid, zero errors, all nine plans**
- Same-wave file collisions after the 98-06 frontmatter expansion: **NONE**
- Single `.planning/REQUIREMENTS.md` writer: **1** (98-09)
- All 8 requirement IDs still covered; every plan keeps ≥1 D-NN-citing truth; no exogenous path
  in any file scope
- The merged 98-06 COPY-03 gate python executed against HEAD: syntactically valid, RED on the
  real defect (the four EN seed strings named in the assertion output)
- Kanban oracle candidate verified on disk this session (not adopted on any checker's say-so):
  `useMutation` at :388 has no `onSuccess`; :547 `onError`; :574 comment scoped to the refusal
  path

REVISION-END
