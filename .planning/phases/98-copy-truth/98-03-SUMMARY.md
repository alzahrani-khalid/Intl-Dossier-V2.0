---
phase: 98
plan: 03
subsystem: dossier-type-guide
tags: [i18n, copy, elected-official, popover, glyph-coherence, both-locale]
requires:
  - '98-01 — the 98-copy07 and 98-copy08 oracles and the RED-at-HEAD record they produced'
provides:
  - 'criterion 7 CLOSED: the EO type-guide popover renders header + description + all four sections, resolved, in BOTH locales, with Crown on the country/primary family'
  - 'criterion 1 (COPY-07) CLOSED: the stats-card percentage label renders through t() in both locales'
  - "dossier.json carries no retired 'Due Date' display value"
affects:
  - '98-05 / 98-06: the remaining COPY-04 population (EO CTA, exclamations, first-person plural, the calendar deadlineReminder family) is untouched here and still theirs'
  - 'Phase 102 (GUIDE-HOLLOW-01): EO is now the ONLY type with a full four-section guide body — the tracked asymmetry, deliberately not levelled'
tech-stack:
  added: []
  patterns:
    - 'atomic unit: keys + render guard + glyph arms in ONE commit (D-12/D-27) — no intermediate state prints a raw key or wears the country glyph'
    - 'display surfaces speak the CARD-8 (DossierCardType); query surfaces speak the DB-7 (DossierType) — the sets are bridged by prop type, never merged'
key-files:
  created:
    - .planning/phases/98-copy-truth/98-03-SUMMARY.md
  modified:
    - frontend/src/i18n/en/dossier.json
    - frontend/src/i18n/ar/dossier.json
    - frontend/src/components/dossier/DossierTypeStatsCard.tsx
    - frontend/src/components/dossier/DossierTypeGuide.tsx
decisions:
  - 'The guide component is retyped DossierType -> DossierCardType rather than casting at the call site: the deleted guard was ALSO the type narrowing, and a cast would leave the two D-27 case arms unreachable-by-type (TS2678 stands), i.e. option B does not compile'
  - 'DOSSIER_TYPES and the _EoIsNotADbType anti-merge assertion are NOT touched — no dossiers.type count bucket is created, so the fabricated-zero failure mode Phase 97 guarded against cannot reappear'
  - 'COPY-04 is NOT marked complete: this plan lands one of its residents (the dueDate display value); its CTA, exclamation and first-person-plural populations are live and owned elsewhere'
metrics:
  duration: ~1h
  completed: 2026-08-18
  tasks: 2
  files: 4
---

# Phase 98 Plan 03: COPY-08 + COPY-07 Atomic Summary

The five `dossier:` EO keys in both locales, the Phase-97 render guard's deletion, and the two
switch arms that keep the newly-rendering ninth case off the country glyph — **one commit,
`e354c8c94`, four files** (D-12/D-27). Plus the COPY-07 label routing and the criterion-4
`dueDate` display value, `8bad8ec73`.

## THE ATOMIC COMMIT

**`e354c8c94`** carries all four Task-1 files and nothing else:

```
frontend/src/i18n/en/dossier.json
frontend/src/i18n/ar/dossier.json
frontend/src/components/dossier/DossierTypeStatsCard.tsx
frontend/src/components/dossier/DossierTypeGuide.tsx
```

No intermediate commit exists in which the guard is gone and the keys are absent (raw key on
screen), or the keys are present and the guard stands (dead bytes). The atomicity D-12 requires is
**a property of the history**, verifiable by `git show --stat e354c8c94`.

## BOTH POLARITIES, AT RUN TIME — same runner, same role, same machine

Runner in both directions: `pnpm exec playwright test <2 paths> --project=chromium-en --no-deps
--workers=1 --reporter=list`, dev server `http://localhost:5173`, viewport 1400×900, **role admin
(`TEST_USER_EMAIL`)**, both locale legs by `?lng=`. File existence asserted and the enumerated test
count hardcoded to **5** before every multi-path invocation (D-09: spec paths are FILTERS).

### RED — re-observed at MY OWN starting HEAD `f5b5d19e1`, before any edit

The inherited `98-RED-BASELINE.md` rows were witnessed at `4e107b5d3`. I did not take them on
authority; I re-ran the same two specs at my head first. **4 failed / 1 passed.**

| baseline row                                                         | locale · role             | the text that attributed it, at `f5b5d19e1`                                                                                                                                                                                               |
| -------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| copy08 — EO card renders **0** help triggers                         | `en` · admin              | `the EO stats card renders no help trigger — the render guard is still in place`; locator `[data-testid="dossier-type-card-elected_official"] >> button` resolved to **0** elements, 14 polls                                             |
| copy08 — same                                                        | `ar` · admin              | identical failure, identical locator, 14 polls                                                                                                                                                                                            |
| copy08 — `typeDescription.elected_official` absent from both bundles | bundle (locale-invariant) | `en/dossier.json: typeDescription.elected_official must be a string` → received `undefined`; the spec's own both-polarity resolver self-test passed in the same test (control path `typeDescription.person` resolved, bogus path did not) |
| copy07 — English literal renders under `?lng=ar`                     | **`ar`** · admin          | the EO card's `ar` innerText carried `% of total active dossiers`; captured in the run's error context, 4 occurrences across the card grid                                                                                                |
| copy07 `en` leg                                                      | `en` · admin              | **PASSED** — and is NOT counted as evidence. The EN value is byte-identical before and after the repair; the spec labels this leg a non-discriminator and so do I.                                                                        |

### GREEN — at the post-repair HEAD `8bad8ec73`

**5 passed / 0 failed, RC 0, 14.2 s**, one consolidated run of both spec files:

| criterion   | test                                                                            | locale · role    | result                                                                                                     |
| ----------- | ------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| 1 (COPY-07) | the EO card renders the English label under en                                  | `en` · admin     | ✓ (non-discriminator, stated)                                                                              |
| 1 (COPY-07) | the EO card renders the Arabic label under `?lng=ar` **and no English residue** | **`ar`** · admin | ✓ — **the discriminator**: `النسبة من إجمالي الملفات النشطة` present AND `of total active dossiers` absent |
| 7 (COPY-08) | STATIC CENSUS: the five EO keys carry the shapes the component consumes         | both bundles     | ✓ — types + array bounds (`examples` 3–5, `commonLinks` 3–4), both locales                                 |
| 7 (COPY-08) | the EO popover renders header, description and all four sections                | **`en`** · admin | ✓                                                                                                          |
| 7 (COPY-08) | the EO popover renders header, description and all four sections                | **`ar`** · admin | ✓                                                                                                          |

**What the two popover legs actually assert** (recorded because "criterion 7 green" is worthless
without it): the header `<h4>` equals `dossier:type.elected_official`'s bundle value; the popover
contains **exactly 1** `svg.lucide-crown` and **0** `svg.lucide-globe`; the crown's class contains
`text-primary`; `h4 + p` equals the bundle's `typeDescription.elected_official` byte-for-byte; all
four section LABELS and both prose BODIES are present; every authored `examples` chip and
`commonLinks` row is rendered; and the whole popover text matches no `typeGuide.|typeDescription.`
raw-key token. **A Globe or a muted popover would have failed** (`RULING-P98A2-03`) — it rendered
neither.

## Gates

| gate                                         | result                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1 static gate (verbatim from the plan)  | **RC 0** — `KEYS-OK` (both locales, both array bounds, no-exclamation voice check), guard count **0** while `DossierTypeGuide` is still referenced in the same file (the instrument-control pair — the zero is about the guard, not a gutted file), **exactly 2** `case 'elected_official'` arms, `WR-07` present, `Crown` present |
| Task 2 static gate (verbatim from the plan)  | **RC 0** — literal gone from the TSX **and** `percentOfActive` present in it; `"percentOfActive": "% of total active dossiers"` byte-identical in `en`; AR key present; **0** `"Due Date"` values in `en/dossier.json` while `"dueDate": "Deadline"` is present                                                                    |
| `cd frontend && pnpm type-check`             | **RC 0** (unpiped, `tsc --noEmit`, no diagnostics)                                                                                                                                                                                                                                                                                 |
| `cd frontend && pnpm lint` (all five guards) | **RC 0** — eslint `--max-warnings 0`, i18n-namespaces (1718 files, 800 literals vs 128 namespaces), duplicate-rtl, bootstrap-parity, date-formatting (1534 files, 0 unexcused)                                                                                                                                                     |
| `prettier --check` on all four files         | **RC 0**                                                                                                                                                                                                                                                                                                                           |

**Instrument control for the Task-2 zero** (D-06 — a zero proves nothing until the same instrument
is shown returning non-zero): `command grep -c '"Deadline"' en/dossier.json` returns **2** on the
same file the `"Due Date"` count returned 0 for. The second occurrence is the pre-existing sibling
key `deadline` at `:995`, which independently corroborates `Deadline` as this file's established EN
glossary term.

## POPULATIONS — stated with their exclusions (D-04/D-05)

- **The EO key population is FIVE paths × 2 locales**, walked by path with type and array-length
  assertions, not grepped. OUTSIDE it: the seven sibling types' `typeGuide` bodies. **They remain
  hollow and I authored nothing into them** — after this plan EO is the only type with a full
  four-section body, which is `GUIDE-HOLLOW-01`'s tracked state (→ Phase 102), not a defect.
- **The `Due Date` population is `frontend/src/i18n/{en,ar}/dossier.json`** — the file this plan
  owns. It is now empty. **OUTSIDE it, named rather than silently left:** five more `"Due Date"`
  VALUES live in `en/common.json:712`, `en/working-groups.json:234`,
  `en/meeting-minutes.json:129`, and `en/commitments.json:45,66`. Those belong to COPY-04's derived
  glossary population and to the plans that own it — `98-RED-BASELINE.md` names `/commitments` as
  where that string reaches a screen. **I did not widen into them.**
- **The guard population is one file, anchored on the STRING** `type !== 'elected_official'`
  (D-13: never the line number). Count 0 after, with the chain-safe `|| true` form.

## Deviations from Plan

### 1. PLAN DEFECT — the action body and the acceptance criteria collide (resolved under `RULING-P98A2-07`)

**Both clauses, named with their file:line:**

- `98-03-PLAN.md:127-128` (`<action>`): "`getTypeColors` gains `case 'elected_official'` … **NO
  other change to either switch**; NO refactor onto dossierTypeColors; NO new color family."
- `98-03-PLAN.md:147` (`<acceptance_criteria>`): "the guide carries EXACTLY 2 `case
'elected_official'` arms (icon + colors) … **type-check green**; the 98-copy08 spec … runs
  GREEN."

**They are jointly unsatisfiable as written.** `DossierTypeGuide.tsx` types on `DossierType`, which
`frontend/src/services/dossier-api.ts:28` re-exports as the **DB-7** — `elected_official` is not in
it. Adding the two arms and nothing else produces exactly three errors:

```
DossierTypeGuide.tsx(79,10)      TS2678  '"elected_official"' is not comparable to type '…7 values…'
DossierTypeGuide.tsx(142,10)     TS2678  same
DossierTypeStatsCard.tsx(162,17) TS2322  DossierCardType is not assignable to DossierType
```

The deleted `type !== 'elected_official' &&` guard was doing **double duty**: besides withholding
the trigger it was the type narrowing that let a CARD-8 card feed a DB-7 component. Deleting it
forces a choice the plan never names.

**Resolution: the acceptance criterion governs, the action prose yields** (`RULING-P98A2-07`).
Inside `DossierTypeGuide.tsx` only — a file already in `files_modified` — five annotations move
from `DossierType` to `DossierCardType` (`getTypeIcon`/`getTypeColors` params,
`DossierTypeGuideProps.type` and `.onSelect`, `GuideContent`'s pair). **No switch body changed, no
refactor onto `dossierTypeColors`, no new colour family** — the action's three actual prohibitions
all hold.

**What was NOT touched, deliberately:** `frontend/src/lib/dossier-type-guards.ts`. `DOSSIER_TYPES`
is still the 7 and `_EoIsNotADbType` is still armed, so the failure mode its comment describes — "a
count bucket that no query over `dossiers.type` can ever fill, so the UI renders a fabricated `0`"
— **cannot reappear through this change**. The sets are bridged at one prop, not merged. This is
also semantically what `dossier-type-guards.ts:61-72` prescribes: display surfaces use CARD-8,
query surfaces use DB-7, and this component displays.

**Blast radius, measured before acting:** the only other real consumer is
`DossierTypeSelector.tsx:126`, which passes a narrower `DossierType` (assignable — no edit);
**no consumer anywhere passes `onSelect`**; `DossierTypeGuideGrid` has no render consumer (barrel
re-export only, `components/dossier/index.ts:51,54`). Zero files outside `files_modified` changed.
The rationale is written at the interface as a doc comment so the next reader does not re-derive it.

**Procedurally:** I **stopped and reported this to the orchestrator before acting**, and did not
act until `RULING-P98A2-07` came back making the class mechanical. Nothing was committed while the
question was open.

### 2. No other deviation

No auto-fix was needed: no bug, no missing critical functionality, no blocking issue beyond the one
above. Zero package installs (`T-98-SC` holds).

## The `learnMore` AR-04a interaction (D-03 — recorded, NOT swept)

The trigger I re-enabled carries `aria-label={t('typeGuide.learnMore', 'Learn more about this
type')}` (`DossierTypeStatsCard.tsx`, inside the block whose guard I deleted), and the guide's own
default trigger carries the same call with a different inline default
(`DossierTypeGuide.tsx:324`). **Neither locale bundle has a `typeGuide.learnMore` key**, so both
render their inline English default in **both** languages. That is the Phase 99 `AR-04a`
silent-default class. **I deleting the guard makes this string reach the EO card's accessible name
for the first time** — the interaction is therefore real, not theoretical, and it is named here
rather than pre-empted. `98-copy08`'s header already excludes it from criterion 7. **P99 sweeps
it; this plan does not.**

## NAV-01 was not touched

`NAV-01` is a Phase 97 register row, `Complete (BOUNDED)` on exactly the `COPY-08` handoff. Per the
CONTEXT Phase Boundary it "is NOT edited by any plan" — its dated note is the overseer's close-out
act. **I did not read-modify-write it, and no commit of mine touches
`.planning/REQUIREMENTS.md`'s Phase 97 rows.** Verifiable: my two code commits touch four
`frontend/src` files and nothing else.

## Requirements

- **`COPY-07` — COMPLETE.** The label routes through `t()` and the `ar` discriminator leg is green
  on the rendered card.
- **`COPY-08` — COMPLETE.** Criterion 7 closes on the rendered popover in both locales with the
  ruled glyph.
- **`COPY-04` — deliberately LEFT OPEN, named rather than silently skipped.** This plan lands **one
  resident** of criterion 4 (the `dossier:addToDossier.form.dueDate` display value). Its other
  populations are live and owned elsewhere: `elected-officials:list.add` still reads
  `Add Elected Official` (verified at `en/elected-officials.json:5`), and the exclamation /
  first-person-plural / `deadlineReminder` populations are untouched here. Ticking `COPY-04`
  complete now would put a false completion in the register while its own oracle
  (`98-copy04-voice`) is still RED. Same discipline 98-01 and 98-02 applied.

## Threat Flags

None. No network endpoint, auth path, file-access pattern, or schema change; no DB column renamed
(the CLAUDE.md source-specific carve-outs stand untouched). Register dispositions:

- **`T-98-05`** (EO popover wearing the country Globe) — **mitigated and OBSERVED**: the spec
  asserts crown count 1, globe count 0, `text-primary`, and passed in both locales.
- **`T-98-06`** (keys without guard / guard without keys) — **mitigated structurally**: one commit,
  `e354c8c94`; the spec's presence assertions defeat the `t(key,'')` / `Array.isArray` silent
  defaults that make a raw-key detector return clean over a hollow guide.
- **`T-98-SC`** (package installs) — holds: **zero installs**.

## Known Stubs

None. All five authored keys carry real prose in both locales; no component renders a placeholder.
The seven sibling types' hollow guide bodies are **pre-existing tracked state**
(`GUIDE-HOLLOW-01` → Phase 102), not a stub introduced here.

## Operator parks — untouched

**Arabic naturalness stands as review debt over all five `ar` values I authored** plus the AR
percentage label (D-30). I authored them to be grammatical and glossary-adjacent; **I make no claim
that they read naturally** — that is Phase 99's and the operator's. Pixel RTL, the `/calendar`
baseline and `E2ECRED-01` were not approached.

## Working tree

The only dirty paths are the exogenous, harness-owned ones (`CLAUDE.md`, `AGENTS.md`,
`tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`, `_archive-98-attempt1-260818/`).
**Neither commit touches any of them** — verified by intersecting
`git diff --name-only e354c8c94~1 8bad8ec73` against the exogenous set: **empty**. Every stage used
explicit pathspecs; `git add -A` and `git commit -a` were never run, and no `git clean` / `git
stash` / `git reset` was run at any point.

## Tooling quirks recorded (not defects of this plan, but they are in my diff)

Three `gsd-sdk state` handlers do not fit this project's STATE.md, which is prose-shaped:
`state.advance-plan` (`Cannot parse Current Plan or Total Plans`), `state.add-decision`
(`summary required`), and `state.record-session` (`No session fields found`).
`state.record-metric` rejected even a fully-positional call. `state.update-progress` and
`roadmap.update-plan-progress` both worked. I followed the wave-1 house pattern instead — a
`98-03 EXECUTED` paragraph under Current Position and a hand-written Performance Metrics row — and
**invented no STATE.md sections** to satisfy a CLI.

`requirements.mark-complete COPY-07 COPY-08` produced the four intended content changes (two
checkbox flips, two traceability-status flips) **plus ~38 pure blank-line insertions** scattered
through rows other phases own. I verified the content diff is exactly those four lines and that
**`NAV-01`'s row has zero diff lines**, then left the whitespace alone: reverting it would mean
touching ~38 locations across other phases' rows on a shared branch where a sibling wave-2 lane may
be writing the same file concurrently. Cosmetic noise beats clobbering another lane's register edit.

## Self-Check: PASSED

All 5 claimed files verified present on disk; both commit hashes verified present in `git log`.
