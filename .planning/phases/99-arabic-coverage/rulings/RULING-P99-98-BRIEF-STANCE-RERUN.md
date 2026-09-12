# Ruling P99-98 — Brief/stance rerun scope, instrument, and candidate patch

## Decision

Keep P99-26's repo-wide brief-artifact and stance census. Do not narrow either row to the original
42-bundle slice. Widen the task's write scope to the two places that the failed run proved must change:

- `frontend/src/i18n/ar/onboarding.json`, whose `admin.generateBrief.description` and
  `analyst.generateBrief.title` values carry the brief-artifact sense and must use the ruled `ملخص`
  family rather than `إحاطة`; and
- `scripts/glossary-census.mjs`, whose stance row currently scans singular `منصب` but cannot see the
  irregular plural `مناصب` recorded by the task's overlay.

The acceptance commands, success criterion, goal, and all seven gates remain in force. A summary that
reports `SCOPE-BLOCKER`, a slice-only green, or a supplemental grep is not completion; the plan's real
repo-wide `$PWD` command must exit zero for both rows.

## Instrument repair is part of this task

Add `مناصب` as its own competing-term rule beside `منصب`. Do **not** merely put `منصب|مناصب` in the
singular rule's pattern: `classify()` matches an overlay by `entry.term === termRule.term`, so a combined
singular rule would still leave every `term: "مناصب"` overlay row unreachable.

Extend the embedded `--control` path without removing its existing dossier control. It must exercise a
synthetic plural office value that matches a `term: "مناصب"` sense entry and a second planted plural
value with no sense entry. The command exits zero only when the first is `allowlisted-sense` and the
second is `UNCLASSIFIED`, and it prints explicit booleans/counts for both. This is the positive control
that distinguishes a working plural row from the no-op implementation found in run 0041.

SHIP / NO-SHIP: **SHIP in this milestone.** A user of the census can otherwise receive a false green for
an entire inflected population. The shipped remedy is the instrument change above plus this task's
seven-gate proof; a supplemental grep or summary-only warning is a local workaround and is rejected.

## Candidate branch is evidence, not accepted work

Run `run-20260826-124503-0000000000000041` ended with P99-26 at a human gate. Candidate branch
`tickmarkr/run-20260826-124503-0000000000000041--P99-26` has tip `08fcdfd7b` and six linear commits on
accepted integration base `f0e0542b4`. A fresh isolated worker may cherry-pick these commits in order,
or reapply their equivalent diff:

1. `1025bd1e7` — `fix(i18n): sweep brief and stance terminology by sense`
2. `b634c77b0` — `docs(phase-99): record green brief and stance sweep`
3. `0e54251b6` — `fix(i18n): repair brief and stance sense sweep`
4. `f19eae376` — `fix(i18n): use ruled term for word assistant briefs`
5. `04688f002` — `docs(phase-99): record onboarding scope blocker`
6. `08fcdfd7b` — `fix(i18n): remove invalid briefing sense exceptions`

Never merge that branch directly and never inherit a verdict from it: acceptance and cross-vendor review
were both red. After applying it, repair the two onboarding values, add the census plural rule and
control, revalidate all overlay rows, regenerate the summary, and run all seven gates. If the series
conflicts with the new base, stop and re-derive instead of weakening scope or an oracle.

## Findings that must survive the changed task digest

- The two onboarding values are artifacts, not session-sense exceptions. Adding them to the overlay is
  laundering. Rewrite them to the `ملخص` family while preserving their surrounding meaning.
- The candidate overlay has 84 rows, including exactly nine `term: "مناصب"` office-sense rows. Those
  nine judgments must be revalidated against live values after the instrument makes them consumable.
- The base allowlist remains append-only; no existing sense row may be removed or weakened.
- Only Arabic leaf values may change. No English value, Arabic key, bundle structure, application source,
  or U+FFFD count may change. `scripts/glossary-census.mjs` is the sole authorized source-script edit.
- Run the oracles against the worker's real root. Scratch roots, copied trees, filtered slices, and
  supplemental greps are useful diagnostics but provide no acceptance evidence.
- The failed candidate's summary accurately records a blocker but is not a completion record. Replace
  its stale counts and red outputs with fresh verbatim evidence; do not merely append a green claim.

## Re-judging earlier tasks

Do not reopen the 27 banked tasks solely because this plural defect predates P99-26. P99-25 called only
`--row engagement`, so its seven-gate verdict is unaffected. P99-05/06 created the general instrument,
but the current repair is itself a changed hunk owned by P99-26, whose acceptance runs `--control` and
`--row stance`; P99-39 later runs the full repo-wide census. Reopening earlier tasks would duplicate
those proofs without adding a missing gate. If the repair changes any row other than stance or weakens
the original control, this ruling no longer applies and the worker must stop.
