# Ruling P99-100 — split the dossier-A rerun at the instrument/value boundary

## Compile finding and decision

The compile from source base `87a0eae4f` failed atomically before dispatch. The amended P99-27 had
seven acceptance items and six `files_modified` patterns: it exceeded both the absolute six-item cap
and the task-unit surface bound at `7 x 6 = 42` where the maximum is 24. The prior graph remained
byte-identical, no lock was created, and no worker ran.

Do not drop a criterion or hide paths in a broader pattern to make the arithmetic pass. Split the work
at the real production boundary:

- P99-27 repairs and positively controls the glossary classifier. It owns four patterns and four
  acceptance items (`4 x 4 = 16`). Its live brief row must expose exactly the five ruled artifact
  values as an explicit red handoff; it does not edit Arabic bundles or dossier-a.json.
- P99-44 depends on P99-27 and consumes that classifier. It owns the 37-file Arabic brace group,
  dossier-a.json, and its own SUMMARY with six acceptance items (`6 x 3 = 18`). It makes the exact five
  brief values and the dossier slice green without editing the instrument.
- P99-30 depends on P99-44, P99-28, and P99-29. The new edge makes the instrument repair precede the
  value sweep and makes the complete D1/D2/D3 glossary family precede the repo-wide gatekeeper.

All seven runtime gates remain declared for both nodes. The executable dossier, brief-artifact, and
parity oracles are not weakened: the first node adds a positive/negative classifier proof and exact-red
handoff; the second runs the original dossier/parity oracles with the repo-wide brief row before the
slice row.

## P99-27 — production instrument unit

Implement RULING-P99-99's file-token boundary in `scripts/glossary-senses.json` and its discriminating
cases in the production `scripts/glossary-census.mjs --control` path:

1. a genuine file/attachment path resolves `computer-file-or-attachment`;
2. an unlisted Profile-shaped path resolves `UNCLASSIFIED` rather than matching lowercase `file`;
3. the same Profile shape with an exact row resolves `profile-page-or-summary`.

Give singular `إحاطة` and plural `إحاطات` distinct, non-overlapping Arabic word-boundary patterns,
positively control an allowlisted plural and a planted unclassified plural, and remove only the stale
`dossier-overview:documentType.brief` briefing-document-type row from `brief-stance.json`. After those
instrument changes, the real repo-wide brief-artifact JSON must exit 1 with exactly these five
unclassified identities and no others:

- `contextual-suggestions.json:suggestions.upcomingEngagement.description:إحاطات`
- `dossier-overview.json:documentType.brief:إحاطة`
- `dossier-overview.json:documents.empty.brief:إحاطات`
- `dossier-overview.json:documents.tabs.briefs:إحاطات`
- `dossier.json:templates.category.thematic:إحاطات`

That exact red set is a checked dependency handoff, not permission to report the glossary row green.

## P99-44 — dependent values and exact judgments

P99-44 re-derives the 37-file dossier-A slice, changes Arabic values only, records every surviving
different sense in dossier-a.json, and rewrites the five handoff values to `ملخص` / `ملخصات`. It runs
the repaired production control, the repo-wide brief-artifact row, the pinned dossier row, and the
repo-wide parity walk in that order. A slice-only green may not cover a red brief row.

The candidate branch `tickmarkr/run-20260826-142525-0000000000000042--P99-27` remains unaccepted and
must never be merged. A fresh P99-44 worker may cherry-pick only `92c8e6bae` as an unverified starting
patch. It may extract the dossier-a.json row additions from `22a6808a3`, but must not cherry-pick that
commit because it also modifies the obsolete 99-27-SUMMARY.md. Do not cherry-pick `e3d1f42e6` or
`7ada51f4b`; both are stale candidate evidence. Every count, control, and verdict is regenerated.

## Banked work and ship decision

The 30 banked tasks remain banked. P99-27 depends on accepted P99-26; P99-44 depends on P99-27; P99-30
is still pending and receives the new dependency. P99-28 and P99-29 remain done and disjoint.

SHIP: the classifier boundary/plural repairs are user-hit correctness fixes in the repository's
production census and belong in `scripts/**` now. The compile rejection itself is the intended task-unit
contract, not a product defect and not grounds for a local bypass.
