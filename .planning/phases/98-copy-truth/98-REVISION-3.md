# Phase 98 — Revision 3 (final round: N1 blocker + N2–N6)

**Date:** 2026-08-18 · **Seat:** p98-planner · **Inputs:** team-lead round-3 message + both addenda (N6; overseer CLIENTSEC-02 refinement) + `98-PLAN-CHECK-2.md` (read in full).
**Numbering is the team-lead's canon N1–N6** (the checker's own "N3" is N6 here).
**Wave-structure disclosure: NO change** — 9 plans, 6 waves, same titles/ownership; the committed ROADMAP list at `1a30f45e2` stays accurate. Nothing committed. **Declined: nothing.**

## N1 — BLOCKING (sourcemap unsatisfiability) — FIXED, drilled, CLIENTSEC-02 cited

`98-07` T3 gate: the DEVHIT grep now carries `--exclude='*.map'`; the must-have reads "EMITTED
production code (js/css, sourcemaps excluded)". The justification in the action and acceptance
is SUBJECT-DERIVED and cites the queued sibling row, per the overseer's refinement:

- `sourcesContent` is outside the render path — a `.map` is a debug artifact fetched only when
  devtools ask; it is never rendered as UI.
- Criterion 5's population is renderable strings in the executable bundle; a string that exists
  only in a `.map` was never user copy — the exclusion DEFINES the population, it does not
  narrow it.
- The sources-ship-at-all fact is not waved away: **queued as `CLIENTSEC-02`
  (`REQUIREMENTS.md:349`, ownership row `:799`, owner Phase 100, filed `2aad479bc`)** — cited
  in the gate text so a future reader sees a scope boundary with a named owner, not a
  convenience. No Phase 98 plan touches `vite.config.ts`.

Mechanism recorded in-plan: `vite.config.ts:141` `sourcemap: true`, ~305 `.map` files, the
current build's IntakeForm map already embeds `actions.fillMock` — so the moment the literal is
inlined, an unexcluded grep is unsatisfiable forever.

**Drilled against the real dist this session, both polarities:** with the exclusion,
`DEVHIT = 1` at HEAD (the live defect in emitted JS — the gate stays honestly RED today) and a
sample non-map control returned 192 hits (the instrument reads emitted code); `--exclude`
syntax confirmed on this grep (RC=1 on a no-match run, not 2).

## N2 — ADVISORY (positive control shares the hole) — FIXED in the same edit

Same `--exclude='*.map'` on the `CTRL` (`Changes saved`) grep, same run — a `.map`-satisfiable
control could certify a build whose JS chunk never emitted. Acceptance names it.

## N3 — ADVISORY (both-polarity controls were prose, not gate clauses) — FIXED

- `98-04` T3: the finder extension now REQUIRES a scan-directory CLI arg (mirroring
  `check-date-formatting.mjs`'s existing fixture mechanism — reuse, not invention), and the
  GATE executes both polarities itself: a scratch red dir with a planted one-arg
  `t('zz.raw.key')` must be reported by the extended finder, and a scratch clean dir must
  produce nothing zz-shaped — both planted and counted in the same chain.
- `98-01` T1 gate PINS the in-spec control tokens (`entityLinks.title` planted-DOM fixture,
  `zz.nope` census bogus path) in `98-copy02-rawkeys.spec.ts` — presence gate-asserted,
  execution on every spec run; the acceptance states the split explicitly.

## N4 — ADVISORY (98-06 Task 3's D-15 deviation unstated) — FIXED

`98-06` T3 action now carries the deviation statement in 98-07 T2's shape: ~17 exclamation
files ×2 locales + the ~24-file first-person candidate set, cause stated (one-line value edits
in a single mechanical class, ~60-110 diff lines under the 120-line cap; splitting would
manufacture plan boundaries inside one derived population). The same-shape statement was also
added to `98-05` T2 (~9-file de-snake class — the checker flagged that sibling gap).

## N5 — ADVISORY (98-05:15 derived-scope reservation) — FIXED

`98-05` frontmatter :15 rewritten as a CLOSED reservation: (a) the seven named Part B tsx
files; (b) surface-namespace JSON pairs only where no wave-3 sibling declares the file
(98-06's now-enumerated list is the check); (c) common.json/dossier.json for cross-cutting
family members only (wave-2-owned). Any derivation hit OUTSIDE the closed list is RECORDED as
a 98-09 handoff line — never edited by this plan. Task 2's files line carries the same rule,
so execution cannot silently widen the collision input.

## N6 — ADVISORY (B4 retarget did not propagate to 98-06's lane boundary) — FIXED

`98-06:82` and `:194` (plus two file-list mentions) renamed `signals.json` →
`intelligence-signals.json` — the file 98-05 actually owns this wave. The guard-that-cannot-
protect shape is named in-plan (a ban pointed at a nonexistent filename reads as coverage while
providing none). The checker's derived fact carried: `{en,ar}/intelligence-signals.json` hold
**0** exclamation strings, so no in-population member of 98-06's sweep lives there.
**Neighbour confirmed, not assumed:** `frontend/src/i18n/{en,ar}/engagements.json` both exist
on disk (verified this session), so `engagements.json` legitimately stays in the ban lists.
Post-edit instrument check: `grep -E "(^|[^-])signals\.json"` over the whole plan set returns
ZERO bare refs while the same pattern fires on a planted fixture.

## Also cleared upstream (stated so it is not re-opened)

The 98-06 frontmatter expansion is cleared by derivation: 31 EN / 30 AR exclamations across 17
files, every carrier declared except `common.json` (98-04, wave 2, upstream) and
`validation.json` (the carve-out) — the 1/1 floor is reachable.

## Verification (after all round-3 edits including the addenda)

- `decision-coverage.mjs`: **passed, 30/30, uncovered []**
- `gsd-sdk verify.plan-structure` on all edited plans (01, 04, 05, 06, 07): **valid, zero errors**
- DEVHIT/CTRL drill against the real `frontend/dist/assets`: RED-at-HEAD preserved (1
  emitted-JS hit), 192 non-map control hits, `--exclude` supported
- Bare `signals.json` refs across the plan set: **0**, instrument control shown firing
- `CLIENTSEC-02` row verified at `REQUIREMENTS.md:349`/`:799` before citing it
- Same-wave collisions NONE · single REQUIREMENTS.md writer (98-09) · all 8 requirement IDs
  covered · every plan keeps its D-NN-citing truths · no exogenous path · nothing committed

## Post-close note (2026-08-18, ~03:15) — CLIENTSEC-02 citation verified on disk

A follow-up reported `grep -rln CLIENTSEC-02` empty over the phase dir. Discriminating command
re-run: the citation is PRESENT at `98-07-PLAN.md:190` (action) and `:201` (acceptance), and
`grep -rln` returns both `98-07-PLAN.md` and this file (RC=0). `98-07`'s mtime is 03:09:14 —
the report's grep raced the write, the same shape as rounds 2 and 3. No further edit made;
this note is the record.

REVISION-END
