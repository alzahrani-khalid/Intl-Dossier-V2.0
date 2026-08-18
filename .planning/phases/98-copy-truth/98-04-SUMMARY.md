---
phase: 98
plan: 04
subsystem: i18n-common-bundle
tags: [i18n, copy, entity-links, toast, recurrence-routing, both-locale, instrument-extension]
requires:
  - '98-01 — the 98-copy02 and 98-copy06 oracles and the RED-at-HEAD record they produced'
provides:
  - 'criterion 6 CLOSED: the default mutation success toast renders localized in BOTH locales on a real kanban TASK stage move'
  - 'the whole entityLinks namespace resolves: 80/80 static paths + both dynamic families, 97 leaves, en/ar parity exact'
  - 'RecurrencePatternEditor.tsx carries ZERO dot-form t() keys of any family — 43 calendar.recurrence sites routed with conservation proven against the true pre-fix blob, plus the file second and last dot-form family calendar.months.january (RULING-P98A2-09). The file is whole.'
  - 'scripts/i18n-mask-audit.mjs can see the raw-key class at all: a behaviour-defined matcher, full output, gate-executable polarity controls'
affects:
  - '98-05 / 98-06: the remaining COPY-04 populations (EO CTA, first-person plural, the exclamation set outside common.json) are untouched here and still theirs'
  - 'the criterion-2 CLASS remainder — 306 raw-key-shape unresolved sites / 280 distinct keys / 64 files — is DERIVED and NAMED here, owned by nobody. It needs a ruling, not a guess.'
tech-stack:
  added: []
  patterns:
    - 'a population is defined by the BEHAVIOUR (no string fallback => raw key on screen), never by the token that usually implements it — a one-arg-shape matcher is blind to 409 sites with identical behaviour'
    - 'conservation check: a pure dot->colon flip preserves total occurrences; both sides derived in the same run from the parent git blob, no quoted literal'
    - 'RULING-P98A2-09: a plan clause bounding the SEARCH SPACE ("no wider hunt") does not bound the POPULATION (D-23 class sweep). Where you may look and what counts once you are looking there are two different limits.'

key-files:
  created:
    - .planning/phases/98-copy-truth/98-04-SUMMARY.md
  modified:
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
    - frontend/src/lib/query-client.ts
    - frontend/src/components/calendar/RecurrencePatternEditor.tsx
    - frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx
    - frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx
    - scripts/i18n-mask-audit.mjs
decisions:
  - 'D-24 mechanism: the entityLinks subtree merged into common.json rather than becoming a new namespace. All 8 consumers call bare useTranslation(), whose defaultNS is common — which IS registered in i18n/index.ts. "Registered" is therefore satisfied by construction, with ZERO component edits; a new namespace would have touched 8 code files for no user-visible gain.'
  - 'i18next plural resolution was MEASURED, not assumed: at i18next 25.10.10 a base key with no _one/_other siblings resolves and interpolates {{count}}. So the five count-bearing keys need no Arabic six-form plural set. Measured before authoring, not after a bug.'
  - 'COPY-06 marked complete. COPY-02 and COPY-04 deliberately NOT marked — COPY-02 because its class remainder is real and its boundedness is an acceptance-semantics question that belongs to the overseer, COPY-04 because its other populations are live and owned elsewhere (same discipline 98-01/98-02/98-03 applied).'
metrics:
  duration: ~2h
  completed: 2026-08-18
  tasks: 3
  files: 7
---

# Phase 98 Plan 04: the common.json lane Summary

The whole `entityLinks` namespace in both locales (97 leaves), the default mutation toast
localized and **observed rendering in Arabic on a real write**, all 43 dot-form
`calendar.recurrence` sites routed colon-form with conservation proven, both region lookups
casing-normalized, and the mask-audit finder rebuilt around the behaviour it was supposed to
detect. Four commits, seven files, zero exogenous paths.

## Commits

| hash        | what                                                                           | files                         |
| ----------- | ------------------------------------------------------------------------------ | ----------------------------- |
| `6b919c856` | entityLinks core — 61 keys × 2 locales                                         | `i18n/{en,ar}/common.json`    |
| `58109e47b` | aiSuggestions (19) + linkTypes (5) + entityTypes (12) × 2 locales              | `i18n/{en,ar}/common.json`    |
| `0d69760bb` | toast + voice values + regions casing + recurrence routing + finder            | 7 files (see key-files)       |
| `c71f42515` | SUMMARY + STATE + ROADMAP + REQUIREMENTS                                       | planning docs                 |
| `c5661eeb8` | `calendar:months.january` — the file's 2nd dot-form family (`RULING-P98A2-09`) | `RecurrencePatternEditor.tsx` |

**Both locales landed in the SAME commit every time (D-16).** Verifiable:
`git show --stat 6b919c856` and `git show --stat 58109e47b` each list `en/common.json` and
`ar/common.json` and nothing else.

## BOTH POLARITIES, AT RUN TIME

Runner: `pnpm exec playwright test <2 paths> --project=chromium-en --no-deps --workers=1
--reporter=list`, dev server `http://localhost:5173`, viewport 1400×900, **role admin
(`TEST_USER_EMAIL`)**, both locale legs by `?lng=`. File existence asserted and the enumerated
count read from `--list` before the run (D-09).

### RED — re-observed at MY OWN heads, not taken on 98-01's authority

| defect                                                                  | my head     | locale · role         | the observation                                                                                                                    |
| ----------------------------------------------------------------------- | ----------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `98-RED-BASELINE` copy02 row: 80 of 80 `entityLinks.*` paths unresolved | `d6a61bf22` | bundle (both locales) | `command grep -c 'entityLinks'` returned **0** in `en/common.json` AND `ar/common.json` — the subtree did not exist                |
| `98-RED-BASELINE` copy06 row: English literal in BOTH locales           | `58109e47b` | **`ar`** · admin      | `98-copy06` **2 failed**; the `ar` leg — the designated negative control — read `"Operation completed successfully"` off the toast |
| `98-RED-BASELINE` copy06 row, en leg                                    | `58109e47b` | `en` · admin          | failed on the same assertion (expected `Changes saved`)                                                                            |
| D-22 dot-form family                                                    | `d6a61bf22` | source (pre-render)   | **43 occurrences / 37 distinct paths**, derived by the CONTEXT commands (below)                                                    |
| `entityLinks.title` invisible to the stock finder (B6)                  | `d6a61bf22` | instrument            | see "The B6 claim, tested" — the stock script's output does not contain the string anywhere                                        |

### GREEN — at `0d69760bb`

**8 passed / 1 failed, 40.5 s.** The single failure is the UNDRIVEN leg, named below — it is not
a repair that missed.

| criterion | test                                                               | locale · role       | result                                                                             |
| --------- | ------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------- |
| 2         | DOM detector both-polarity self-test                               | instrument          | ✓ fires on `entityLinks.title` and `regions.Europe`, silent on prose               |
| 2         | census resolver both-polarity self-test                            | instrument          | ✓ resolves `common.loading` in both bundles, does not resolve `zz.nope`            |
| 2         | intake ticket detail renders no raw key                            | `en` · admin        | ✘ **UNDRIVEN** — see below. Closes on census + this line (D-24)                    |
| 2         | country wizard renders no raw region key                           | `en` + `ar` · admin | ✓ — but see the honesty note: this leg passed at HEAD too                          |
| 2         | auth loading state renders no raw key                              | `en` + `ar` · admin | ✓                                                                                  |
| 2         | CENSUS: all 80 static `entityLinks` paths resolve in both bundles  | both bundles        | ✓ — the backstop, not the closure                                                  |
| 2         | CENSUS: all 37 `calendar.recurrence` paths resolve in both bundles | both bundles        | ✓ — confirms D-22's finding that the repair was routing, not authoring             |
| **6**     | a real task stage move raises the localized toast                  | **`en`** · admin    | ✓ toast contains `Changes saved`; the banned literal absent from toast AND page    |
| **6**     | a real task stage move raises the localized toast                  | **`ar`** · admin    | ✓ **the discriminator** — toast contains `تم حفظ التغييرات`, banned literal absent |

**Criterion 6 closes on a REAL mutation**, not a mock: a kanban TASK stage move driven by the
@dnd-kit pointer sequence, idempotent (the card is put back). `useUnifiedKanbanStatusUpdate`
declares no `onSuccess`, so TanStack's shallow merge lets the global default fire — that is the
property the oracle depends on and it held in both legs.

## UNDRIVEN SURFACES — NAMED, NEVER SILENT (D-24)

| surface                                                                 | why it could not be driven, at MY head                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| intake ticket detail — the `entityLinks` render surface                 | `/intake/queue` renders **`0 items`** and **`No Pending Reviews`**. **Instrument control, run on the failure artifact rather than quoted from 98-01:** the page snapshot (`error-context.md` lines 30–148) contains **24 links** and **zero** `intake/tickets` hrefs — the three `intake/tickets` strings in that file are all in the echoed error message and test source, outside the snapshot. So the locator class works; there is nothing to click. **What this does NOT distinguish:** whether zero rows exist or zero rows are visible to admin. I could not query staging from this seat (no Supabase tool in this agent context), so the claim is scoped to "the admin-role queue renders no ticket link". |
| AI-suggestion accept/reject (`components/ai/EntityLinkSuggestions.tsx`) | needs the AnythingLLM backend, outside the dev-server oracle. Closes on census: all 19 `entityLinks.aiSuggestions.*` paths resolve in both bundles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `RecurrencePatternEditor` render surface                                | no Phase 98 spec drives that component. Closes on the 37-path census (GREEN in both locales) **plus** the conservation gate below, which is the routing proof.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Honesty note on the country-wizard leg:** it passed at HEAD too (`98-RED-BASELINE` records it),
because the casing-miss class needs a capitalised region value in the wizard's data path and no
drive reached one. So that leg is a **non-discriminator for the regions repair** and I do not
count it as evidence. The regions fix is closed on source: both call sites now lowercase the
interpolated segment, which is a structural guarantee rather than an observation.

## POPULATIONS — derived, with their exclusions (D-04 / D-05)

### The entityLinks census

**Derivation** — union of `entityLinks\.([A-Za-z0-9_.$#{}]*[A-Za-z0-9_])` over the 6 components

- 2 hooks + `components/ai/EntityLinkSuggestions.tsx`:

* **83 union refs = 80 STATIC paths + 3 dynamic references over 2 families**
  (`entityLinks.linkTypes.${linkType}`, `entityLinks.entityTypes.${type}`,
  `entityLinks.entityTypes.${link.entity_type}`).
* **Delta vs D-24's floor of 82:** the derived STATIC set is **80**, not 82. 80 + the 2 dynamic
  family prefixes = the ruled 82; the two "missing" rows are prefixes, not leaves. The derived set
  governs (D-04) and it matches `98-copy02`'s own hardcoded list exactly (80, asserted `.toBe(80)`).
* **Dynamic domains DERIVED FROM THE TYPE, not the bundle:** `LinkType` (5:
  `assigned_to`, `mentioned`, `primary`, `related`, `requested`) and `EntityType` (12:
  `assignment`, `commitment`, `country`, `dossier`, `engagement`, `forum`,
  `intelligence_signal`, `mou`, `organization`, `position`, `topic`, `working_group`), both parsed
  out of `backend/src/types/intake-entity-links.types.ts` and asserted EXACT against the authored
  keys in both locales.
* **Total authored: 97 leaves × 2 locales**, en/ar path parity asserted exact (symmetric
  difference empty).

**OUTSIDE this population, named rather than silently left:**

- `AISuggestionPanel.tsx:294` calls ``t(`entityTypes.${suggestion.suggested_entity_type}`)`` —
  **no `entityLinks.` prefix**, so it addresses a top-level `entityTypes.*` that does not exist.
  It carries an inline default (the raw DB value), so it renders the enum, not a raw key — that is
  criterion 1's class and the P99 silent-default class, not criterion 2's. **Not repaired; named.**
- `EntitySearchDialog.tsx:555,576,584` ship hardcoded English `Match:` / `Level:` / `Last used:` —
  no `t()` at all. Untranslated-literal class, not raw-key. **Not repaired; named.**
- The sibling `entity-linking.json` namespace (a different component family, 98-RESEARCH §C2.1),
  `__tests__/**`, the backend, and the dead `public/locales` tree.

### The D-22 recurrence population

Derived at `d6a61bf22` with the commands **`98-CONTEXT.md` D-22 carries**, not a quoted number:

```
S=frontend/src/components/calendar/RecurrencePatternEditor.tsx
command grep -c        "calendar\.recurrence"                    "$S"   ->  43
command grep -ohE "calendar\.recurrence\.[A-Za-z0-9_.]+" "$S" | sort -u | wc -l  ->  37
```

**43 occurrences / 37 distinct paths. Delta vs the ruling's 16: +27 occurrences.** The derived
figure governs (D-04); `43` and `37` are recorded here as observations of a specific blob, not as
new literals — the gate re-derives both sides at run time.

**Exclusion, stated (D-05):** scoped to the one source file. A repo-wide sweep also hits
`frontend/src/.understand-anything/.trash-*`, a git-ignored dashboard extract that duplicates
components and inflates the figure to 49.

### The criterion-4 residents of common.json

Both derived by **value-grep, not offsets**:

- `auth.loginSuccess` was the file's **only** `!` — `command grep -c '!"' en/common.json` = **1**
  before, **0** after. De-exclaimed in both locales, sentence case kept.
- One `"dueDate": "Due Date"` display value → `Deadline` / `الموعد النهائي`. **Key name and DB
  columns untouched** (the CLAUDE.md source-specific carve-outs stand).

## THE CONSERVATION GATE (D-22 routing proof)

Run at `0d69760bb`, both sides derived in the same execution:

```
LASTC = 0d69760bb                      (last commit touching RecurrencePatternEditor.tsx)
PRE   = 43   from git show 0d69760bb^:<file> | grep -o "calendar\.recurrence\."
POST  = 43   from the working tree     | grep -o "calendar:recurrence\."
dot-form in the repaired file = 0
distinct colon paths = 37              (equal to the 37 distinct dot paths)
```

**Both polarities on one instrument:** `PRE >= 1` is the negative control — the same token
instrument shown finding the defect in the pre-fix blob; `POST == PRE` with `dot == 0` is the
positive. A missed site would leave dot-form non-zero; a stray or dropped site would break the
equality.

Both template-literal sites are included (`:458` `daysOfWeek.${dayKey}`, `:525`
`monthly.positions.${pos}`). No key was authored — all 37 paths already exist in `en`/`ar`
`calendar.json`, which the copy02 recurrence census re-asserts.

### RE-DERIVED after the second commit (the acceptance criterion's re-base clause)

`c5661eeb8` (the `RULING-P98A2-09` repair below) is a **second** commit touching this file, so
`LASTC^` is no longer the pre-fix blob and the gate as written would read the wrong parent. The
criterion provides for exactly this, so the conservation check was re-run against the **true**
pre-fix blob, hash stated:

```
LASTC now      = c5661eeb8          (naive parent c71f42515 — the DOCS commit, already routed)
TRUE pre-fix   = 58109e47b          (the parent of the routing commit 0d69760bb)
PRE  = 43  from git show 58109e47b:<file> | grep -o "calendar\.recurrence\."
POST = 43  at HEAD                        | grep -o "calendar:recurrence\."
dot-form at HEAD = 0
```

**The gate fails CLOSED on the re-base rather than passing vacuously** — verified, not assumed:
against the naive parent `c71f42515` the derived `PRE` is **0**, which trips the criterion's own
`test "$PRE" -ge 1` negative control. A stale parent reddens this gate; it cannot silently green it.

## THE B6 CLAIM, TESTED — and the instrument rebuilt around behaviour

**The claim:** the stock `i18n-mask-audit.mjs` matches only two-arg `t('k','default')` calls, so
the raw-key class it is assigned is structurally invisible to it.

**Tested, not assumed.** The stock script was taken from the blob at `d6a61bf22` and run over the
real repository:

| instrument                                                                          | two-arg sites | unresolved               | `entityLinks.title` in output | `calendar.recurrence` in output |
| ----------------------------------------------------------------------------------- | ------------- | ------------------------ | ----------------------------- | ------------------------------- |
| STOCK (blob `d6a61bf22`), real repo                                                 | 1778          | 473                      | **absent**                    | **absent**                      |
| STOCK, over a tree containing only `EntityLinkManager.tsx` (11 one-arg `t()` calls) | **0**         | 0                        | absent                        | —                               |
| EXTENDED, same 1-file tree, PRE-repair bundles reconstructed from `d6a61bf22`       | —             | **9 sites / 7 distinct** | **PRESENT**                   | —                               |

The third row is the **negative control the plan asks for**: at the pre-repair bundle state the
extended finder fires on `EntityLinkManager.tsx`'s one-arg `t('entityLinks.title')` and six
siblings. It was reconstructed from the recorded blob (all 129 EN bundle files + the component,
written into a scratch tree) rather than by rewinding the working tree — **no `git stash`, no
`git clean`, no reset was run at any point.**

**The extension went further than the plan's letter, and the reason is the failure pattern the
brief names.** A matcher keyed on the one-arg SHAPE is a population defined by the token, not the
behaviour. The behaviour that matters is _"no string fallback, therefore a miss renders the raw
key"_ — and `t('key', { count: n })` has no string fallback either. Measured before deciding:

```
t('key', {options}) sites            : 725
  ... WITH defaultValue in the opts  : 316   (silent-default class, already modelled)
  ... WITHOUT defaultValue           : 409   (SAME raw-key behaviour, invisible to a shape matcher)
```

409 sites with identical behaviour would have been missed. The finder now covers both shapes and
reports `by_shape`, so the number can never again be a correct count about the wrong set. This is
the same error that let five hand-rolled relative-time helpers escape a guard keyed on an import.

**Gate-executable polarity controls** (a control that is only described is not run):

| control                                               | result                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| RED fixture `const a = t('zz.raw.key')`               | FIRES — 1 site, `shape: one-arg`                                 |
| CLEAN fixture `const b = 1`                           | silent — 0 `zz.`-shaped rows                                     |
| shape fixture `t('zz.opts.key', { count: 1 })`        | FIRES — `shape: options-no-default`                              |
| shape fixture `t('zz.defaulted.key', {defaultValue})` | correctly EXCLUDED (it is the silent-default class, not raw-key) |

Other changes: the 8-sample truncation is gone (full lists print), a scan-dir CLI arg mirrors
`check-date-formatting.mjs`'s fixture mechanism, and paths resolve from the script location so the
script is cwd-independent (D-18). **Every pre-existing check is untouched** — the two-arg numbers
are byte-identical between stock and extended (1778 / 473 / 410).

## THE CLASS SWEEP — verdict PER CLASS (D-23)

Full extended run at `0d69760bb` over `frontend/src`:

```
two-arg sites 1778   unresolved 473 sites / 410 distinct / 75 files
raw-key sites 6503   unresolved 309 sites / 280 distinct / 64 files
                     by_shape: one-arg 251, options-no-default 58
```

| class                                                                     | verdict                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **repaired-here** — `entityLinks.*`, `calendar:recurrence.*`, `regions.*` | **RESOLVED.** Post-repair the finder reports **zero** unresolved `entityLinks.*`, **zero** `calendar.recurrence`, **zero** `regions.*`.                                                                                                                                                                                 |
| **already-resolves** — `common.loading`, `afterActions.loadError`         | **REPORT, DON'T REPAIR** — and this is CONTROLLED, not assumed: both are **absent** from the unresolved list, i.e. the finder that flags 309 misses does not flag these two. Two of `COPY-02`'s five named instances were never broken.                                                                                 |
| **`CALENDAR.RECURRENCE.TITLE`** (uppercase, as the criterion names it)    | **NOT REPRODUCIBLE** at HEAD (98-RESEARCH A3). The real instance is the dot-form family, all 43 sites routed. Named instance gone, class covered.                                                                                                                                                                       |
| **silent-default mask** (two-arg, renders English in both locales)        | **RECORDED, NOT SWEPT** — 473 sites / 410 distinct / 75 files. Phase 99 `AR-04a` owns it (D-03). Untouched here.                                                                                                                                                                                                        |
| **raw-key remainder, outside every named instance**                       | **NAMED — AND IT HAS NO OWNER.** 306 sites (after the 3 false positives below) / 43 distinct first-segments / 64 files. Largest: `afterActions` **100 sites / 95 distinct keys / 7 files**; then `common` 45 sites but only **7 distinct keys**; `stepUp` 24; `forms` 20. 12 of the 309 are under `__tests__`/`.test.`. |

**The finder's own limitation, measured rather than left latent:** `USE_NS` captures only the
FIRST namespace of `useTranslation(['a','b'])`. I re-resolved all 309 rows against **every**
namespace each file declares: exactly **3 rows** are false positives (`loading`, `queue.error`).
So the remainder is 306, and the instrument's soft edge is 1%. I did **not** change `USE_NS` —
that would alter the pre-existing two-arg numbers, which the plan says to keep untouched.

**The remainder's sharpest member, called out because it renders on a surface this plan
repaired:** `common.clearFilters` at `EntitySearchDialog.tsx:293` — the entity-search dialog's
"clear filters" button renders the raw key `common.clearFilters`. The copy02 DOM detector
**cannot see it**: its regex is
`/(entityLinks|regions|typeGuide|typeDescription|calendar\.recurrence)\.[A-Za-z.]+/` and
`common.` is not in it. **HELD, not repaired** — see Deviations.

## `RULING-P98A2-09` — the file's SECOND dot-form family, released and repaired

Raised as a hold, **ruled Reading A, released**, and landed as `c5661eeb8`. The reasoning is
worth more than the one-character diff:

> **D-22's "no wider hunt" bounded the SEARCH SPACE. D-23's class-sweep clause defines the
> POPULATION.** `calendar.months.january` is a member of the population, found by the ordered
> sweep inside the lane that owns it — not a new hunt into new territory.

Reading B (leave it) was **refused** as "`RULING-06` Option C in miniature" — the same shape as
shipping a witnessed red because the repair grew slightly. _Where you may look_ and _what counts
once you are looking there_ are two different bounds; a clause restricting one does not restrict
the other.

**The four legs, each derived at my head, none taken on authority:**

| leg                                           | evidence                                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| the call is dot-form                          | `t('calendar.months.january')` at `RecurrencePatternEditor.tsx:557`                                                                            |
| the hook takes no namespace                   | `useTranslation()` at `:176` — the identical mechanism as the 43 recurrence sites                                                              |
| the key is ABSENT where the lookup lands      | `common.json`'s `calendar` subtree = `['fri','mon','sat','sun','thu','tue','wed']` — **7 weekday abbreviations, no `months`**, in BOTH locales |
| the key is PRESENT where the colon form lands | `calendar.json` has `months.january` in BOTH locales                                                                                           |

**Render-path proof — kept because it is what makes this a leak rather than a latent miss:**
the component renders `t(...).split(' ')[0]`. A raw key contains **no space**, so `.split(' ')[0]`
returns the **whole key** — `calendar.months.january` reached the screen inside a `<Label>`. Had
the key resolved, that expression would return just the month word, which is its actual purpose.

**Post-fix both-locale resolution (CONDITION 2 — not merely "the dot-form is gone"):**

| locale | `calendar.json` `months.january` | what the `<Label>` renders after `.split(' ')[0]` |
| ------ | -------------------------------- | ------------------------------------------------- |
| `en`   | `January`                        | `January`                                         |
| `ar`   | `يناير`                          | `يناير`                                           |

**THE CONSERVATION GATE DOES NOT ENDORSE THIS FIX, and no reader should infer that it does.**
The gate counts `calendar\.recurrence\.` tokens only. Measured on both sides: `calendar.months`
occurrences at the pre-fix blob `58109e47b` = **1**, at HEAD = **0** — neither number appears in
either side of the gate's equality, which moved not at all. **This repair's evidence is its own
both-locale resolution check above**, plus the render-path proof. Nothing else covers it.

**Why the population is CLOSED rather than sampled — derived independently, not accepted:** the
file contains exactly **two** dot-form families. Parsing every `t()` key literal (single-quoted
**and** template-literal) yields 44 keys: `calendar.recurrence` at **43 occurrences (41
single-quoted + 2 template-literal — the orchestrator's "×41" is the single-quoted subset of my
derived 43)** and `calendar.months` at **1**. After this repair the file carries **zero** dot-form
`t()` keys and 44 colon-form. This is not the head of an open-ended tail; it is the only other
member, and the file is now whole.

## Gates

| gate                                                 | result                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1 static gate (verbatim from the plan)          | **RC 0** — `CORE-OK` (61 leaves ≥ the 50 floor, every leaf a non-empty string, both locales), `PARITY-OK`                                                                                                                                                                                         |
| Task 2 census gate (verbatim from the plan)          | **RC 0** — `CENSUS-OK 80 static paths resolved in both locales`; both `aiSuggestions` branches present                                                                                                                                                                                            |
| Task 2 extra: dynamic domains vs the TS unions       | **RC 0** — `entityTypes` and `linkTypes` EXACT against `EntityType`/`LinkType`; 97 leaves; parity exact; negative control (`entityLinks.zz`) returns `None`                                                                                                                                       |
| Task 3 static gate chain (verbatim from the plan)    | **ALL GREEN** — literal gone AND replacement present (pair assertion); `"savedGeneric": "Changes saved"` byte-exact in `en`; `ar` key present; dot-form 0; conservation PRE 43 == POST 43; both wizard files carry `toLowerCase`; one-arg marker present; red fixture fires; clean fixture silent |
| `cd frontend && pnpm type-check`                     | **RC 0** (`tsc --noEmit`, no diagnostics)                                                                                                                                                                                                                                                         |
| `cd frontend && pnpm lint` (all five guards)         | **RC 0** — eslint `--max-warnings 0`; i18n-namespaces (1718 files, 800 literals vs 128 namespaces) — this is what confirms the new `calendar:` colon references address a registered namespace; duplicate-rtl; bootstrap-parity; date-formatting (1534 files, 0 unexcused)                        |
| `prettier --check` on all 7 files                    | **RC 0**                                                                                                                                                                                                                                                                                          |
| `98-copy02` + `98-copy06`, `chromium-en --workers=1` | **8 passed / 1 failed**, 40.5 s — the 1 failure is the UNDRIVEN intake leg, named above                                                                                                                                                                                                           |

## Deviations from Plan

### 1. The finder was extended BEYOND the plan's one-arg letter — to the behaviour it names

The acceptance criterion asks for "a ONE-ARG matcher (`t('dotted.key')` with no default)". I
shipped that **and** the `t('key', {opts-without-defaultValue})` shape, because they are the same
behaviour and the shape-only reading is blind to 409 sites (measured, above). This is strictly
additive: the criterion's own assertions — the `ONE_ARG` marker, the red fixture firing on
`zz.raw.key`, the clean fixture silent — all pass, and every pre-existing check returns
byte-identical numbers. Inside `files_modified`, no criterion contradicted.

### 2. Two in-scope-file repairs disclosed BEFORE any commit that would contain them — one released, one still held

Both were raised while the tree was clean, with the file list named (`RULING-P98A2-05`: acting =
the commit). Neither was in the tree when raised.

**(a) `RecurrencePatternEditor.tsx:557` — `t('calendar.months.january')`. RELEASED and
REPAIRED** (`RULING-P98A2-09`, Reading A) as `c5661eeb8`. Full evidence, all four ruling
conditions, and the two-family closure argument are in the `RULING-P98A2-09` section above. The
ruling's own framing is the durable part: **D-22 bounded the search space, D-23 defines the
population**, so this was never a widening.

**(b) `common.clearFilters` and 6 sibling `common.*` raw keys — STILL HELD.** 7 distinct keys /
45 sites, one of them (`common.clearFilters`) on the entity-search dialog this plan repaired.
Authoring them is 7 keys × 2 locales in a file I own — but unlike (a) they are **not a member of
any population this lane owns**: they are a new class, named by no criterion and no plan, and by
the same search-space-vs-population distinction that released (a), they fall outside. **Not in
the tree.** They are the sharpest members of the un-owned raw-key remainder above.

### 3. Prettier reflowed two files beyond my edit — disclosed because it is in my diff

`CountryReviewStep.tsx` and `scripts/i18n-mask-audit.mjs` were **not prettier-clean at HEAD**.
Running `prettier --write` (which the pre-commit hook would have run on the staged files anyway)
reflowed pre-existing lines: `CountryReviewStep.tsx` shows 54 changed lines for a 3-line edit,
all of it JSX line-joining with **no semantic change** (verified by reading the full diff).
Recorded so nobody has to wonder why a 3-line repair has a 54-line diff.

### 4. No auto-fix was needed, and zero packages were installed

No bug, no missing critical functionality, no blocking issue. `T-98-SC` holds.

## An acceptance-semantics question, raised not resolved (rule 6)

**Is `COPY-02` complete when its five NAMED instances are all dispositioned but the derived CLASS
has 306 unresolved members left?**

- **Reading A (bounded, mirrors D-20):** criterion 2 closes on the named instances plus the
  surfaces the phase's oracle set visits. `COPY-02` is complete; the 306-member remainder is filed
  as a new row, the way `COPY-09` was filed for criterion 4's long tail.
- **Reading B (unbounded):** "no raw i18n key reaches the screen" is a whole-app claim; 306
  unresolved raw-key sites falsify it, so `COPY-02` stays open with an owner named.

**There is no ruling on this and I did not pick one.** My default is the conservative, reversible
choice: **`COPY-02` is NOT marked complete.** D-20 bounded criterion **4**; nothing bounds
criterion 2's remainder, and inventing that bound is not a worker's call. `COPY-09`/P102 owns the
sentence-case long tail, **not** raw keys — so no existing row covers this, and per D-29 the row
mechanism is for work that LEAVES the phase, which this does.

## Requirements

- **`COPY-06` — COMPLETE.** The literal is gone, `i18n.t()` fires inside the callback, and the
  toast was **observed rendering in both locales on a real mutation** — the `ar` leg is the
  discriminator and it is green. Its register row is entirely about this one string.
- **`COPY-02` — deliberately LEFT OPEN.** All five named instances dispositioned (2 repaired, 2
  never broken and controlled as such, 1 not reproducible with the real instance repaired), and
  the whole `entityLinks` namespace resolves. Not ticked: see the question above.
- **`COPY-04` — deliberately LEFT OPEN.** This plan lands **two** residents (the `loginSuccess`
  exclamation, the `dueDate` display value in `common.json`). Its CTA, first-person-plural and
  remaining exclamation populations are live and owned by later plans — `98-copy04-voice` is
  still RED. Same discipline 98-01, 98-02 and 98-03 applied.

`NAV-01` and every other Phase 97 register row: **untouched.** My only `REQUIREMENTS.md` change is
two lines, both `COPY-06`'s.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change. Register dispositions:

- **`T-98-07`** (census green over a misspelled key) — **mitigated and EXERCISED**: the census
  re-derives the referenced set from the 9 source files at gate time and never trusts a recorded
  list; misses would print by path+locale. It also agrees exactly with `98-copy02`'s independently
  written 80-path list, which is a second instrument on the same question.
- **`T-98-08`** (new copy leaking internals) — **holds**: 97 authored leaves, no dev vocabulary,
  no seed/test instruction, no path, no stack trace.
- **`T-98-09`** (i18next escaping disabled) — **accept, unchanged**: no interpolation option was
  touched. Every authored key is a static label; the five interpolations (`{{entity}}`, `{{name}}`,
  `{{count}}`, `{{success}}`/`{{failed}}`, `{{currentPrimary}}`) all existed as call-site options
  before this plan — I added no new user-data interpolation.
- **`T-98-SC`** (package installs) — **holds: zero installs.**

## Known Stubs

None. All 97 `entityLinks` leaves and the toast key carry real copy in both locales; no component
renders a placeholder. The two HELD lines in Deviations §2 are **pre-existing defects named with
their reason**, not stubs this plan introduced.

## Operator parks — untouched

**Arabic naturalness stands as review debt over all 98 `ar` values I authored** (97 entityLinks
leaves + `toast.savedGeneric`) plus the two rewritten `ar` values. I authored them to be
grammatical and glossary-adjacent; **I make no claim that they read naturally** — that is Phase
99's and the operator's. Pixel RTL, the `/calendar` baseline and `E2ECRED-01` were not approached.

## Working tree

The only dirty paths are the exogenous, harness-owned ones (`CLAUDE.md`, `AGENTS.md`,
`tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`, `_archive-98-attempt1-260818/`).
**No commit of mine touches any of them** — verified by intersecting
`git diff --name-only 6b919c856~1 0d69760bb` against the exogenous set: **empty**. Every stage
used explicit pathspecs; `git add -A` and `git commit -a` were never run, and no `git clean`,
`git stash` or `git reset` was run at any point.

## Tooling quirks recorded

- The `gsd-sdk state` handlers do not fit this project's prose-shaped `STATE.md` (98-03 recorded
  the same). I followed the wave house pattern: a `98-04 EXECUTED` paragraph under Current
  Position and a hand-written Performance Metrics row. **No STATE.md section was invented.**
- `requirements.mark-complete` inserted ~38 unrelated blank lines when 98-03 ran it. I edited the
  two `COPY-06` lines by hand instead — a 2-line diff on a shared branch beats a 40-line one.

## Self-Check: PASSED

All 8 claimed files verified present on disk; all 3 code commit hashes (`6b919c856`,
`58109e47b`, `0d69760bb`) verified present in `git log`.
