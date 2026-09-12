# Ruling P99-99 — Dossier-A rerun, classifier truth, and brief carry-forward

> **Topology superseded by RULING-P99-100.** The measured findings and repair laws below remain
> binding, but the compiler rejected their combined 7x6 task unit. P99-27 now owns the instrument
> repair and P99-44 owns the dependent Arabic-value/dossier-A sweep.

## Decision

Do not run `tickmarkr approve` and do not run `tickmarkr approve --uphold` against the saturated run-0042
graph. The first would waive a material review finding; the second cannot fix it because both lawful fix
sites are outside P99-27's compiled scope. Amend the source plan, compile, and start a fresh run.

P99-27 now owns `scripts/glossary-census.mjs`, `scripts/glossary-senses.json`, and
`scripts/glossary-senses.d/brief-stance.json` in addition to its original slice, dossier-a overlay, and
summary. Keep all seven gates. The original dossier oracle remains and is strengthened by running the
repo-wide brief-artifact row in the same chain.

## Repair the false computer-file classification

The base computer-file key-path pattern currently matches lowercase `file` inside `Profile`. That makes
`organizationProfile`, `institutionalProfile`, and `professionalProfile` green under the wrong
`computer-file-or-attachment` sense. Attempt 1 added correct exact `profile-page-or-summary` rows, but
the broad base match wins before those rows can be used.

Tighten the base `[Ff]ile`/`[Ff]iles` branch to token semantics: lowercase `file`/`files` requires a real
key-path delimiter, while uppercase `File`/`Files` remains available as a camel-case segment. Preserve
the attachment/upload/document families and every genuinely ruled computer-file path. Do not solve this
with a `Profile`-only blacklist or by deleting the base family.

Extend `--control` so one real file key is still `computer-file-or-attachment`, an unlisted Profile key
is `UNCLASSIFIED`, and the same shape with an exact row becomes `profile-page-or-summary`. The command
must fail if any of those three results changes. This proves both sides of the boundary and that the
candidate's exact rows are live rather than echo-only evidence.

SHIP / NO-SHIP: **SHIP in this milestone.** A census that assigns profile copy the computer-file sense
is a user-hit false green. A supplemental grep or summary note is not the fix.

## Close the P99-26 judge-retry warning in P99-27's owned slice

P99-26's final acceptance and review passed, but its first judge invocation produced a concrete warning
before the engine retried that channel: `dossier-overview.json:documentType.brief` was allowlisted as a
briefing-document type even though the English value is `Brief`. Independent inspection also found that
the brief-artifact row cannot see plural `إحاطات`, leaving four more artifact values invisible.

Add `إحاطات` as its own competing-term identity in the brief-artifact row and plant a control that proves
it is detected. Do not combine it under singular `إحاطة` if that would break term-identity allowlisting.
All five affected values are already in P99-27's 37-file Arabic slice and are artifacts, not sessions:

- `dossier-overview.json:documentType.brief` — `Brief`
- `dossier-overview.json:documents.tabs.briefs` — `Briefs`
- `dossier-overview.json:documents.empty.brief` — `No briefs found`
- `dossier.json:templates.category.thematic` — `Thematic Briefs`
- `contextual-suggestions.json:suggestions.upcomingEngagement.description` — `Review briefings and
prepare materials`

Rewrite them to the ruled `ملخص` / `ملخصات` family while preserving the rest of each Arabic value.
Remove the stale `briefing-document-type` row for `dossier-overview.json:documentType.brief`; revalidate
every other brief-stance row. The real repo-wide brief-artifact command must exit zero.

This carry-forward does not revoke P99-26's recorded seven-gate verdict. It closes a parse/retry warning
in the next task that already owns every affected Arabic path and now owns the instrument and overlay.

## Candidate patch remains unaccepted

Candidate branch `tickmarkr/run-20260826-142525-0000000000000042--P99-27` has tip `22a6808a3` and four
linear commits from accepted integration base `1f8c36480`. A fresh isolated worker may cherry-pick them
in order, or reapply their equivalent diff:

1. `92c8e6bae` — `fix(i18n): classify dossier senses in slice a`
2. `e3d1f42e6` — `docs(phase-99): record dossier slice a sweep`
3. `7ada51f4b` — `docs(phase-99): record final scope count`
4. `22a6808a3` — `fix(i18n): classify dossier profile senses`

Never direct-merge the candidate or inherit a verdict from it: acceptance passed, but review failed on
both attempts. The current milestone also contains the later, disjoint P99-28 merge; if cherry-picking
conflicts, stop and re-derive rather than dropping either side.

## Findings that must survive the changed task digest

- The three exact profile rows are required and must actually determine the reported sense.
- The base allowlist may change only for the file-token boundary above. All legitimate file,
  attachment, upload, and document controls must stay green.
- The five brief values are rewrites, not new exceptions. A slice-only dossier green cannot replace the
  repo-wide brief-artifact oracle.
- No English value, Arabic key, bundle structure, application source, or U+FFFD count may change.
- Run every oracle against the worker's real root. Scratch roots and filtered copies are check-bypass.
- Regenerate the summary's counts and outputs after all fixes; stale green or blocker prose is not
  completion evidence.

## Earlier banked tasks

Do not reopen the 30 banked tasks solely for these instrument repairs. P99-27 directly gates the changed
base row, census logic, controls, and affected values; P99-39 later runs the full repo-wide census. If the
worker changes any other glossary row, removes an earlier control, or expands the base-row change beyond
the file-token boundary, this ruling no longer applies and it must stop.
