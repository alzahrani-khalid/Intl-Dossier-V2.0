---
phase: 102-staging-data-debt-tail
plan: 9
status: complete
completed: 2026-09-11
---

# P102-09 summary

Sentence-cased every census candidate outside the pre-authored carve-out table in `common`,
`assignments`, and `dossiers`. All 467 edited English leaves had an existing Arabic mirror; each mirror
was read and none needed a semantic change. The two Help page strings and two briefing-book progress
strings were also re-checked in Arabic while being moved into locale bundles, for **471 Arabic keys
re-checked** in total.

`HelpPage.tsx` now reads `help.title` and `help.subtitle` through `useTranslation('common')`.
`useBriefingBooks.ts` reads both English and Arabic progress messages through `t()` with an explicit
language, and the completion messages contain no exclamation mark.

## Candidate census

Before (`node scripts/titlecase-census.mjs --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md common assignments dossiers`):

```text
NS common strings=1496 candidates=225 ar_mirror=225 carved=8 ar_missing_keys=0 ar_extra_keys=12 carve_rows=8
NS assignments strings=393 candidates=128 ar_mirror=128 carved=2 ar_missing_keys=0 ar_extra_keys=4 carve_rows=2
NS dossiers strings=475 candidates=127 ar_mirror=127 carved=3 ar_missing_keys=0 ar_extra_keys=0 carve_rows=3
EN_FILES=129 EN_STRINGS=2364 TITLECASE_CANDIDATES=480 PCT=20.3
```

After (`node scripts/titlecase-census.mjs --controls --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md common assignments dossiers`):

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS common strings=1498 candidates=8 ar_mirror=8 carved=8 ar_missing_keys=0 ar_extra_keys=12 carve_rows=8
NS dossiers strings=475 candidates=3 ar_mirror=3 carved=3 ar_missing_keys=0 ar_extra_keys=0 carve_rows=3
NS assignments strings=393 candidates=2 ar_mirror=2 carved=2 ar_missing_keys=0 ar_extra_keys=4 carve_rows=2
EN_FILES=129 EN_STRINGS=2366 TITLECASE_CANDIDATES=13 PCT=0.5
```

The positive `Add Elected Official=true` control proves the census can detect a candidate. The three
`ar_missing_keys=0` results are therefore bounded by non-zero candidate and mirror populations. Every
remaining English candidate is one of the 13 carve-out rows, and every carve-out row remains a candidate.

## Value/key audit

The current JSON leaves were compared to `git show HEAD:<path>`. Output:

```text
AUDIT en/common before=1496 after=1498 changed=217 added=2 removed=0 changed_non_candidates=0
  added=help.title,help.subtitle
AUDIT en/assignments before=393 after=393 changed=126 added=0 removed=0 changed_non_candidates=0
AUDIT en/dossiers before=475 after=475 changed=124 added=0 removed=0 changed_non_candidates=0
AUDIT en/briefing-books before=217 after=219 changed=0 added=2 removed=0 changed_non_candidates=0
  added=progress.starting,progress.generated
AUDIT ar/common before=1508 after=1510 changed=0 added=2 removed=0 changed_non_candidates=0
  added=help.title,help.subtitle
AUDIT ar/assignments before=397 after=397 changed=0 added=0 removed=0 changed_non_candidates=0
AUDIT ar/dossiers before=475 after=475 changed=0 added=0 removed=0 changed_non_candidates=0
AUDIT ar/briefing-books before=217 after=219 changed=0 added=2 removed=0 changed_non_candidates=0
  added=progress.starting,progress.generated
```

The existing scalar `help` key is preserved for its existing consumers, while the mandated `help.title`
and `help.subtitle` leaves are represented as dotted keys so all three values can coexist. No existing key
was removed, renamed, or restructured. No Arabic plural-suffix key was deleted. `changed_non_candidates=0`
proves all 467 existing English value edits came from the measured candidate population.

## Command oracle

The plan's command oracle was run verbatim after the edits. Output:

```text
  NS common strings=1498 candidates=8 ar_mirror=8 carved=8 ar_missing_keys=0 ar_extra_keys=12 carve_rows=8
  NS dossiers strings=475 candidates=3 ar_mirror=3 carved=3 ar_missing_keys=0 ar_extra_keys=0 carve_rows=3
  NS assignments strings=393 candidates=2 ar_mirror=2 carved=2 ar_missing_keys=0 ar_extra_keys=4 carve_rows=2
P102-LANE namespaces=3 at_end_state=3 expected 3 3 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

## Validation

`pnpm --filter intake-frontend type-check`:

```text
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-09/frontend
> tsc --noEmit
```

`pnpm exec eslint -c eslint.config.mjs frontend/src/pages/help/HelpPage.tsx frontend/src/hooks/useBriefingBooks.ts` completed with no output and exit code 0.

The implementation commit's repository hooks also completed the full cached workspace build and static
checks successfully. Their only build diagnostics were the repository's existing CSS/chunk warnings.

The JSON parse check output was:

```text
JSON parse: 8 files OK
```

The required-key and replacement-punctuation assertion output was:

```text
I18N_KEYS required=8 present=8 completion_exclamations=0
```

The final allowlist check output was:

```text
SCOPE_CHECK out_of_scope=0
```

The seven scoped Vitest files containing copy superseded by this lane were then synchronized by changing
only their affected string literals. No test title or assertion structure changed. Targeted validation
(`pnpm --dir frontend exec vitest run` with the seven scoped paths) produced:

```text
Test Files  7 passed (7)
Tests  132 passed | 1 skipped (133)
```

## Later work

None. Other COPY-09 namespace lanes remain owned by their named plans.
