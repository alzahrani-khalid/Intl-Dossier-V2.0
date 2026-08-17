---
phase: 97-reachability
plan: 06
wave: 2
status: complete
requirements: [NAV-01]
files_modified:
  - frontend/src/routes/_protected/compare.tsx
  - frontend/src/components/entity-comparison/EntityComparisonSelector.tsx
  - frontend/src/hooks/useEntityComparison.ts
  - frontend/src/i18n/en/entity-comparison.json
  - frontend/src/i18n/ar/entity-comparison.json
  - frontend/src/types/entity-comparison.types.ts
  - frontend/src/pages/entity-comparison/EntityComparisonPage.tsx
files_beyond_plan:
  - frontend/src/types/entity-comparison.types.ts
  - frontend/src/pages/entity-comparison/EntityComparisonPage.tsx
gate_1: GREEN (RED observed first, at its subject clause)
gate_2: GREEN (RED observed first; Playwright half CONSTRUCTED and RUN against the live stack)
---

# 97-06 — the eighth type on `/compare`

**Executed 2026-08-17** on `milestone/v10.0-trust`, base HEAD `13941dacf`, landed as `2db165c1a`.

Both gates green in both directions. The Playwright half that the plan labelled
`NOT CONSTRUCTED: requires the running dev stack` was **constructed and observed** — and a
separate discriminating observation was run beside it, because the gate's own settle poll cannot
tell a real result from a fabricated zero. That observation found the honest answer (real content,
5 rows against an independent total of 5) **and** a defect in 97-01's oracle. Both are below.

---

## Task 1 — the whitelist, the option list, the icon lookup and the label, moved together

### `routes/_protected/compare.tsx`

The seven-literal `VALID_DOSSIER_TYPES: DossierType[]` is gone. Membership now comes from
`DOSSIER_CARD_TYPES`, and the membership-test-then-value shape is not merely preserved but
**tightened**: the old form tested `VALID_DOSSIER_TYPES.includes(type as DossierType)` and then
returned `(type as DossierType)` — a cast on both sides of the test. It is now a type predicate
copied from the tighter in-repo recipe 97-04 landed at `routes/_protected.tsx:23-25`:

```ts
function isValidCompareType(value: unknown): value is DossierCardType {
  return typeof value === 'string' && (DOSSIER_CARD_TYPES as readonly string[]).includes(value)
}
```

so `search.type` is narrowed by the test rather than asserted past it. Nothing is cast through.
`CompareSearchParams.type` widened to `DossierCardType`.

### `EntityComparisonSelector.tsx`

**The option list was DERIVED, not kept explicit** — the plan's preferred branch, and it stayed a
small diff. `ENTITY_TYPE_ICONS` is a `Record<DossierCardType, React.ReactNode>` and
`ENTITY_TYPE_OPTIONS` is `DOSSIER_CARD_TYPES.map(...)` over it. The exhaustive `Record` is what
makes the guarantee real: a ninth member added to the constant fails the build here instead of
falling through to a generic glyph, which is exactly how `elected_official` stayed off this
surface. `getEntityTypeIcon` reads the same record, so the second consumer moved in the same edit
and the EO row cannot render the `Tag` fallback — the fallback is now unreachable and was removed
rather than left as dead reassurance. Props widened to `DossierCardType | null`.

**One consequence to state rather than bury: the option ORDER changed.** The old array read
country, organization, person, engagement, forum, working_group, topic. Deriving from
`DOSSIER_CARD_TYPES` gives country, organization, forum, engagement, topic, working_group, person,
elected_official — which is the order `CreateDossierHub` already renders (97-04 records that order
as load-bearing). So `/compare` now matches the create hub instead of disagreeing with it. There is
no unit test on this component (`find frontend/src -path "*entity-comparison*" -name "*.test.*"`
returns nothing) and the e2e assertion addresses options by accessible name, so nothing pinned the
old order.

### The label, both locales, same commit

`selector.entityTypes.elected_official` = `"Elected Officials"` (plural Title Case, matching its
own set) / `"المسؤولون المنتخبون"` (the string already used for the concept at `ar/common.json:147`,
reused rather than re-translated). Key counts: **en 8, ar 8, equal.**

---

## Task 2 — the subtype-filtered fetch arm and its field configuration

### The arm

`elected_official` is not a `dossiers.type` value, so this arm cannot be a type filter. It reads
**`/api/elected-officials`**, which is `persons` restricted to `person_subtype = 'elected_official'`
server-side — verified in the backend, not assumed: `backend/src/api/elected-officials.ts:136`
(`p_person_subtype: 'elected_official'`) and `:155` (`.eq('person_subtype', 'elected_official')`).

`useComparisonCandidates(entityType, page, pageSize)` in `useEntityComparison.ts` holds both arms,
exactly one enabled at a time, and the selector consumes it in place of its old
`useDossiersByType(selectedType || 'country', …)` call.

**Why not filter a page of persons client-side** (the obvious smaller change): `dossiers-list`
accepts no `person_subtype` param — checked, its parsed params are
`type/sensitivity/owner_id/tags/search/cursor/limit` at `supabase/functions/dossiers-list/index.ts:107-115`
— so the client-side variant would fetch 50 persons and filter them. Whenever page 1 held no
elected official it would render "no entities found" while five exist. That is the fabricated-zero
class this phase exists to remove, so the honest set won over the smaller diff.

**The candidate type is narrow on purpose.** The two arms return different row shapes from
different endpoints. Rather than cast one into the other, `ComparisonCandidate` is the three fields
the selection list actually reads (`id`, `name_en`, `name_ar`) and both arms map into it. `EntityCard`'s
prop moved from `DossierWithExtension` to `ComparisonCandidate`; it read exactly those three fields
already.

### The LOADING state — the plan's closed-vocabulary check, honoured

`isLoading` is `entityType !== null && activeQuery.isPending`, deliberately **not** TanStack's
`isLoading` (`isPending && isFetching`). On the first render after a type is selected the query is
enabled but has not begun fetching, so `isFetching` is still false and `isLoading` would be false —
the empty state would flash for one frame and say "there are no elected officials" when the truth
is "we do not know yet". `isPending` is true from the moment there is no data, which closes it.

**No fifth state was found.** The vocabulary is exactly the four the plan named: real content,
shipped EMPTY, shipped ERROR, shipped LOADING.

### The comparison-result validator — the subtype predicate is the mechanism

`useEntityComparison`'s `allSameType` check was `entities.every((e) => e.type === entityType)`. For
an elected official `e.type` is `'person'`, so that check returns false and `comparisonResult`
becomes `null` — the surface would render the inherited "type mismatch" alert for every EO
comparison. It now calls `matchesCardType(entity, entityType)`, which is type equality for the
seven and, for `elected_official` only, `type === 'person' && extension.person_subtype ===
'elected_official'`. That predicate is load-bearing in both directions: without it no EO comparison
can succeed, and with a bare `type === 'person'` any ordinary person would be admitted into an
elected-officials comparison.

### The EO field set actually configured — field by field

From `domains/elected-officials/types/elected-official.types.ts`, not from a copy of the person arm.
These are real `persons` columns and they resolve through the same `extension` bag every other arm
reads: `dossiers-get` does `.from('persons').select('*')` for a person dossier
(`supabase/functions/dossiers-get/index.ts:191-195`), so nothing here is a placeholder.

| #   | key                  | renderType | default visible |
| --- | -------------------- | ---------- | --------------- |
| 1   | `office_name_en`     | text       | yes             |
| 2   | `office_name_ar`     | text       | yes             |
| 3   | `office_type`        | text       | yes             |
| 4   | `district_en`        | text       | yes             |
| 5   | `district_ar`        | text       | yes             |
| 6   | `party_en`           | text       | yes             |
| 7   | `party_ar`           | text       | yes             |
| 8   | `party_abbreviation` | text       | no              |
| 9   | `party_ideology`     | text       | yes             |
| 10  | `term_start`         | date       | yes             |
| 11  | `term_end`           | date       | yes             |
| 12  | `is_current_term`    | boolean    | yes             |

**Fields OMITTED for want of a counterpart, named rather than filled:** `committee_assignments`
(`CommitteeAssignment[]` — an array of objects; the comparison serialiser would render it as raw
JSON, and there is no per-item render type), `term_number`, `country_id`, `organization_id`,
`data_source`, `last_verified_at`, `last_refresh_at`, and the six contact columns
(`email_official`, `email_personal`, `phone_office`, `phone_mobile`, `website_official`,
`website_campaign`) — contact detail is not comparison material and putting it on a diff view is a
disclosure surface nobody asked for. The person arm's own seven fields (`title`, `photo_url`,
`birth_date`, `nationality`, `education`, `languages`, `current_position`) were **not** copied
across, per the plan.

`EXTENSION_FIELD_CONFIGS` retyped `Record<DossierType, …>` → `Record<DossierCardType, …>`, so the
registry is now exhaustive over the card set and a missing arm is a build error.

### DEVIATION — the field LABELS were authored too (24 strings, 12 per locale)

The plan's Task 1 says "No other string is authored" and the objective says "one new label key in
two locales". Twelve label keys per locale were added under `fields.elected_official.*` anyway, and
this is the reason: Task 2 mandates a field configuration, every `FieldDisplayConfig` carries a
`labelKey`, and an unresolved `labelKey` is rendered. `EntityComparisonTable.tsx:167` calls
`t(field.fieldLabel, field.fieldKey)` and degrades to the bare column name, but
`ComparisonExport.tsx:88` calls `t(field.fieldLabel)` with **no fallback** and would put the raw
dotted key `fields.elected_official.office_name_en` into an exported CSV. Shipping twelve labels is
smaller and more honest than shipping a raw-key leak in an export. Both locales, same commit, and
`pnpm lint`'s i18n namespace check is green over them (below). Flagging it because it is a stated
departure from the plan's own words, not because it is in doubt.

---

## Gates — BOTH directions, verbatim, actual output

Both gate scripts were extracted **programmatically** from `97-06-PLAN.md`'s `<automated>` blocks
(`node`, regex over the file) rather than retyped, so there is no transcription risk. Neither gate
was edited. Exit codes captured directly (`cmd; RC=$?`), never through a pipe.

### RED — observed on the undone tree, before any edit

```
GATE1_RED_RC=1
GATE2_RED_RC=1
```

Both died silently, so each chain was re-walked clause by clause to attribute the red (C2):

```
=== GATE 1 clause-by-clause (undone tree) ===
  test -f compare.tsx: 0
  test -f EntityComparisonSelector.tsx: 0
  test -f entity-comparison.json (en): 0
  test -f entity-comparison.json (ar): 0
  [SUBJECT] grep DOSSIER_CARD_TYPES compare.tsx: 1   <-- GATE 1 DIES HERE
  [SUBJECT] grep Crown selector: 1
  [SUBJECT] grep elected_official selector: 1
  [SUBJECT] node i18n both-locales assertion: 1
  anchor count VALID_DOSSIER_TYPES (threshold -eq 0): 1

=== GATE 2 clause-by-clause (undone tree) ===
  test -f hook: 0
  test -f EO types: 0
  [SUBJECT] grep elected_official hook: 1   <-- GATE 2 DIES HERE
  [SUBJECT] grep person_subtype hook: 1
  [SUBJECT] grep DossierCardType hook: 1
  test -f spec: 0
  EXP (compare-selector test decls) = 1
```

**All four (gate 1) and both (gate 2) file-existence preconditions returned 0 before the subject
clause fired**, so neither red is a mistyped path producing a vacuous result (C5). Every red lands
on this plan's own subject.

**Instrument controls — `grep` here is a ugrep wrapper honouring `.gitignore`, so every zero above
was tested against a known-positive on the same file with the same binary:**

```
  grep -c 'DossierType' compare.tsx   = 4    (known-positive)
  grep -c 'Tag' selector.tsx          = 3    (known-positive)
  grep -c 'DossierType' hook.ts       = 6    (known-positive)
  grep -c "^\s*test(" spec            = 5    (BSD grep honours \s here)
  grep -c 'entityTypes' en.json       = 1    (known-positive)
```

### GREEN — observed after the work

```
GATE1_GREEN_RC=0
GATE2_GREEN_RC=0
```

Re-run **after the commit**, because the pre-commit hook runs `eslint --fix` and `prettier --write`
over staged files and could in principle move a byte a gate anchors on:

```
GATE1_POSTCOMMIT_RC=0
GATE2_POSTCOMMIT_RC=0
```

Gate 1's `pnpm typecheck` tail:

```
intake-frontend:type-check: > tsc --noEmit
 Tasks:    6 successful, 6 total
  Time:    31.13s
```

### Counted clauses, before → after, with max-reachable (C4)

| Clause                                              | Threshold | Before | After                       | Max reachable                                |
| --------------------------------------------------- | --------- | ------ | --------------------------- | -------------------------------------------- |
| `^const VALID_DOSSIER_TYPES: DossierType\[\] = \[$` | `-eq 0`   | 1      | **0**                       | 0 — the declaration is deleted; == threshold |
| `DOSSIER_CARD_TYPES` present in `compare.tsx`       | `grep -q` | absent | **present**                 | reached                                      |
| `Crown` present in selector                         | `grep -q` | absent | **present**                 | reached                                      |
| `elected_official` present in selector              | `grep -q` | absent | **present**                 | reached                                      |
| en `entityTypes` key count                          | `== ar`   | 7 vs 7 | **8 vs 8**                  | 8 == 8; reached                              |
| `person_subtype` present in hook                    | `grep -q` | absent | **present (4 occurrences)** | reached                                      |
| `DossierCardType` present in hook                   | `grep -q` | absent | **present**                 | reached                                      |
| `EXP` (compare-selector test decls)                 | `-eq 1`   | 1      | **1**                       | 1 == 1                                       |
| `PASSED`                                            | `== EXP`  | 0      | **1**                       | 1 == 1                                       |

The `person_subtype` clause is satisfied by **code, not prose** — the two live sites are the
predicate itself:

```
666:  const extension = (entity as unknown as { extension?: { person_subtype?: string } }).extension
669:    extension?.person_subtype === ELECTED_OFFICIAL_CARD_TYPE
```

(`:31` and `:679` are the explanatory comments; the gate would pass on those alone, which is a
weakness of the gate, not of the work — the predicate is real and is exercised behaviourally below.)

### The Playwright half — CONSTRUCTED, RUN, and COUNTED

The plan labelled this `NOT CONSTRUCTED: requires the running dev stack`. The stack was live
(`:5173` → 200; `:5001` serving, `GET /api/elected-officials` → 401 unauthenticated, proving the
auth gate is up), so it was constructed and run for real.

`--no-deps` is not optional here and was verified rather than assumed: `playwright.config.ts:36`
gives `chromium-en` `dependencies: ['setup']`, and the `setup` project throws without six `E2E_*`
keys `.env.test` does not carry (E2ECRED-01, Phase 101 — not waited on, per D-12).

```
Running 1 test using 1 worker
[1/1] [chromium-en] › tests/e2e/97-elected-officials-reachable.spec.ts:268:7 ›
  NAV-01 Elected Officials is reachable on all four exposure surfaces ›
  compare selector — ordinary authenticated user, desktop 1400
  1 passed (3.4s)
```

**The verdict is COUNTED, not inferred from the exit code.** From the gate's own
`PLAYWRIGHT_JSON_OUTPUT_NAME` file:

```
   PASSED   compare selector — ordinary authenticated user, desktop 1400
  status tally: {"passed":1}
  PASSED = 1 | EXP = 1 | skipped = 0
```

**Zero skipped.** `test.skip()` exits 0 and is indistinguishable from a pass by status alone, so
the skipped count is stated explicitly rather than left to be read out of a green.

**SCOPE OF THIS OBSERVATION — role and viewport, named:** it proves the **ordinary authenticated
user** (`TEST_USER_EMAIL`, not an admin role) at **desktop 1400** (the `chromium-en` project's
viewport). It proves **nothing** about an admin-only path and **nothing** about the mobile drawer.
`/compare`'s selector is not role-gated and this plan touches no viewport-conditional code, but
that is an argument, not a measurement, and it is recorded as such.

---

## The discriminating observation — because the gate alone could not tell a result from a zero

97-01's compare test settles on
`(await emptyState.count()) + (await entityRows.count()) > 0`. **That poll is satisfied by either
outcome**, so a green is compatible with the selector rendering "No entities found" while elected
officials exist — the fabricated zero, passing its own gate. So a throwaway observation was run
**outside the repo** (`$TMPDIR/p97-06-obs/`, `node_modules` symlinked in; the repo tree was never
written to) to discriminate.

**First run found the poll settles too early:**

```
OUTCOME rows=1 emptyState=0 skeletonsStillUp=15
FIRST_ROW_NAMES=[""]
```

One matching element with empty text while fifteen skeletons were still up. Re-run gated on the
loading state actually clearing:

```
OPTION_LIST=["Countries","Organizations","Forums","Engagements","Topics","Working Groups","People","Elected Officials"]
INDEPENDENT_API={"total":5,"names":["e2e-97-01-elected-official-1786968804207",
  "e2e-97-01-elected-official-1786968880171","e2e-97-01-elected-official-1786968903876",
  "e2e-97-01-elected-official-1786968984082","Sen. Maria Vergara"]}
LOADING_STATE_CLEARED=yes
ARIA_PRESSED_COUNT=6
ARIA_LABELS=["Toggle theme",
  "Select e2e-97-01-elected-official-1786968804207 for comparison",
  "Select e2e-97-01-elected-official-1786968880171 for comparison",
  "Select e2e-97-01-elected-official-1786968903876 for comparison",
  "Select e2e-97-01-elected-official-1786968984082 for comparison",
  "Select Sen. Maria Vergara for comparison"]
EMPTY_STATE_COUNT=0
OUTCOME_STATE=REAL_CONTENT
```

**Five entity cards, against an independent total of five, name for name.** The independent total
is fetched by the observation itself from `/api/elected-officials` with the bearer token lifted out
of the supabase-js session blob — a different code path from the one the page renders, and the
token value was never printed. So the outcome state is **REAL_CONTENT**, measured, not the empty
state and not a blank pane. Eight options, `Elected Officials` last.

### FINDING for 97-01's owner — `button[aria-pressed]` matches the theme toggle

`ARIA_PRESSED_COUNT=6` for 5 cards. The sixth is `aria-label="Toggle theme"` — app chrome present
on every page, on every route, at all times. So `97-elected-officials-reachable.spec.ts:287`'s
`page.locator('button[aria-pressed]')` **has a permanent floor of 1**, and its settle poll
(`emptyState.count() + entityRows.count() > 0`) is satisfied before any fetch resolves. The test is
green today for the right reason — that was independently confirmed above — but the oracle would
stay green if the EO arm returned nothing at all, or hung.

Not repaired here: `tests/e2e/97-elected-officials-reachable.spec.ts` is 97-01's file and is not in
this plan's `files_modified`. Suggested repair for its owner: scope the locator to the list region,
or use the shipped `aria-label=/for comparison$/` the cards already carry, and settle on the
skeleton clearing rather than on "something appeared".

---

## Threat-model observations (T-97-16 / T-97-18), run live

```
UNKNOWN_TYPE_TRIGGER_TEXT="Choose a type..."      # /compare?type=elected_official__INJECTED
UNKNOWN_TYPE_PAGE_CRASHED=0
KNOWN_TYPE_TRIGGER_TEXT="Elected Officials"       # /compare?type=elected_official
```

The whitelist rejects an unknown `?type=` to `undefined` and the page renders its placeholder — no
crash, no cast-through, no partial selection (T-97-16). The widened set accepts exactly the card
types (T-97-18: the surface reached a named state, never a blank region).

## Arabic, observed (D-12)

```
AR_OPTION_LIST=["الدول","المنظمات","المنتديات","المشاركات","المواضيع","مجموعات العمل","الأشخاص","المسؤولون المنتخبون"]
AR_HTML_DIR=rtl
AR_EO_LABEL_PRESENT=1
AR_RAW_KEY_LEAK=0
```

Eight Arabic options under `dir="rtl"`, the EO label resolving to real Arabic, and zero occurrences
of a raw `selector.entityTypes…` key anywhere on the page — the half-registered-key failure renders
English in BOTH languages and would otherwise survive any visual look.

## `pnpm lint` — the i18n namespace check colour

**GREEN, `PNPM_LINT_RC=0`.** The plan asks for this colour by name because a namespace or key drift
here renders English in both languages:

```
i18n namespace check OK: 1720 file(s) scanned, 801 static namespace literal(s) checked
  against 128 registered namespaces, 3 dynamic reference(s) skipped.
duplicate-rtl check OK: 1721 file(s) scanned under frontend/src, no duplicated rtl: utility tokens.
bootstrap parity check OK: ...
date-formatting check OK: ...
 Tasks:    3 successful, 3 total
```

ESLint over the five changed `.ts`/`.tsx` files, from the repo root (the config lives at the root,
not in `frontend/`): `ESLINT_RC=0`. `prettier --write` over all seven: clean.

---

## DEVIATION — two files outside the plan's declared set

`frontend/src/types/entity-comparison.types.ts` (4 lines) and
`frontend/src/pages/entity-comparison/EntityComparisonPage.tsx` (2 lines) were edited. Stated
plainly because the brief scopes work to `files_modified`.

**Why it was unavoidable.** The plan directs: "Widen the hook's own type parameters to
`DossierCardType` so the selector, the route and the hook agree by construction". Its `<interfaces>`
block names three widening sites (props, icon helper, hook) and misses the two that carry the
remaining `DossierType` annotations in the same object graph. Measured, not predicted — the
widening was landed across the five declared files first and `tsc` was asked:

```
src/hooks/useEntityComparison.ts(760,67): error TS2345:
  ... Types of property 'entityType' are incompatible.
      Type '"elected_official"' is not assignable to type '"engagement" | ... | "topic"'.
src/pages/entity-comparison/EntityComparisonPage.tsx(125,17): error TS2345: ...
src/pages/entity-comparison/EntityComparisonPage.tsx(132,15): error TS2345: ...
src/pages/entity-comparison/EntityComparisonPage.tsx(139,17): error TS2345: ...
src/pages/entity-comparison/EntityComparisonPage.tsx(148,17): error TS2345: ...
```

`EntityComparisonResult.entityType: DossierType` is the type the hook's own return value must
satisfy, and `updateUrl`'s parameter annotation at `EntityComparisonPage.tsx:106` is a local
`useCallback` signature. Neither is reachable from the five declared files. **Both gates end in
`pnpm typecheck`, so leaving them would have made both gates permanently red** — the plan is not
executable within its declared set.

**Why it was safe.** A `files_modified` sweep across all twelve plans was run rather than assumed:

```
$ for f in .planning/phases/97-reachability/97-*-PLAN.md; do sed -n '/^files_modified:/,/^[a-z_]*:/p' "$f" | grep "  - "; done
```

Neither path appears in any of the twelve. No other worker owns them, so there is no collision. The
edits are the minimum: three annotations in the types file (`entityType`, `ComparisonUrlState.type`,
`EntitySelectionState.selectedType`) plus its import, and one parameter annotation plus its import
in the page. Zero behaviour change; the two runtime consumers of `entityType`
(`ComparisonExport.tsx:114` metadata and `:208` a filename) only stringify it.

`EntitySelectionState.selectedType` was widened although `tsc` did not force it — it is the third
member of the same interface family, and leaving one at seven while its siblings go to eight
recreates the parallel-truth class this phase exists to close.

**Ruling requested:** record `frontend/src/types/entity-comparison.types.ts` and
`frontend/src/pages/entity-comparison/EntityComparisonPage.tsx` as in-scope for 97-06, or reassign
them. They are committed in `2db165c1a` alongside the five declared files.

---

## C1 tree-integrity

`git status --porcelain` before and after differs by my seven paths **only**. Everything else that
moved belongs to the three other wave-2 workers editing the shared tree concurrently
(97-05 `DossierTypeStatsCard.tsx`/`DossierListPage.tsx`/`navigation-config.ts`, 97-07 `AppShell.tsx`/
`settings*`/`lib/settings-route.ts`, 97-08 `ListPageShell.tsx`/`WorkspaceTabNav.tsx`/`workspace.json`/
the list routes) — none of it is mine and none of it is in my commit:

```
$ git show --name-only --format="" HEAD
frontend/src/components/entity-comparison/EntityComparisonSelector.tsx
frontend/src/hooks/useEntityComparison.ts
frontend/src/i18n/ar/entity-comparison.json
frontend/src/i18n/en/entity-comparison.json
frontend/src/pages/entity-comparison/EntityComparisonPage.tsx
frontend/src/routes/_protected/compare.tsx
frontend/src/types/entity-comparison.types.ts
```

**The seven exogenous paths are byte-identical to their session-start state** (same five `M`, same
two `??`) and appear in no commit of mine. Every scratch artifact lives under
`$TMPDIR/p97-06-*` and `$TMPDIR/p97-06-obs/`; `git status --porcelain | grep -E "p97-06|obs"`
returns nothing. Commits used an explicit pathspec; `git commit -a` was never used. Git identity
untouched.

### A C2 note worth recording: the shared tree's `pnpm typecheck` was transiently red for a FOREIGN reason

Before any edit of mine, the baseline was `BASELINE_TC_RC=2`:

```
src/pages/engagements/EngagementsListPage.tsx(16,10): error TS6133: 'Link' is declared but its value is never read.
src/pages/engagements/EngagementsListPage.tsx(17,1): error TS6133: 'Plus' is declared but its value is never read.
src/pages/engagements/EngagementsListPage.tsx(18,1): error TS6133: 'Button' is declared but its value is never read.
```

That file is 97-08's, mid-edit; minutes later 97-05's in-flight `DossierTypeStatsCard.tsx` briefly
contributed its own error. Both cleared on their own. This did **not** contaminate either
direction of my gates — the RED direction dies at a `grep` clause well before `pnpm typecheck`, and
the GREEN direction was run when the tree was clean (`tsc --noEmit` → `RC=0`, then `pnpm typecheck`
6/6 twice). Recorded because a red at that clause would have been UNABLE TO MEASURE, not a red for
my subject, and a later reader comparing timestamps should not have to guess.

## POPULATION DEFINITION

Covered: the `/compare` surface of criterion 1 — its search-param validator, its selector option
list, its icon lookup, its candidate fetch arm, its comparison-result type predicate and its
extension-field registry. **OUTSIDE IT:** the sidebar and dossier hub (97-05), `/dossiers/create`
(already 8/8, only observed by 97-01), the comparison feature's layout and copy, and the mobile
viewport and admin roles (not measured — see the scope note on the Playwright observation).

## GATE DRILL row (D-11 — 97-12 consolidates this into `97-GATE-DRILL.md`; it alone writes that file)

| plan.gate   | C1 red                                                                                                                                     | C1 green (how the done state was constructed)                                                                                                                                                                   | C2–C10 exceptions                                                                                                                                                                                                                                                                                                                                                                                                                                                         | verdict                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 97-06.task1 | exit 1 on the undone tree at `grep -q DOSSIER_CARD_TYPES compare.tsx` — its own subject; all four `test -f` preconditions returned 0 first | exit 0 after the edit, re-confirmed post-commit; the anchor moved 1 → 0 and the i18n equality 7/7 → 8/8                                                                                                         | none. C4 max == threshold on both counted clauses; C5 all four roots proven, no `2>/dev/null`; C8 the anchor is a whole-line declaration a comment cannot satisfy                                                                                                                                                                                                                                                                                                         | SOUND                                         |
| 97-06.task2 | exit 1 on the undone tree at `grep -q elected_official hook` — its own subject; both `test -f` preconditions returned 0 first              | exit 0 after the edit, re-confirmed post-commit; the Playwright half was CONSTRUCTED against the live stack (the plan's `NOT CONSTRUCTED` label is discharged) and counted 1 passed / 0 skipped against `EXP=1` | C6 `--no-deps` passed and verified against `playwright.config.ts:36`'s `dependencies: ['setup']`; C10 the criterion's "counted pass" is checked by the gate via `PLAYWRIGHT_JSON_OUTPUT_NAME`. **Weakness noted, not repaired (foreign file):** the spec's `button[aria-pressed]` locator has a permanent floor of 1 from the theme toggle, so the gate would stay green on a dead fetch arm — the discriminating observation above is what actually proves the arm works | SOUND (gate) / oracle weakness filed to 97-01 |

## BLOCKED

_(empty — nothing blocked this plan. The two out-of-scope files are recorded under §DEVIATION as a
ruling request, not as a blocker: the work is complete, both gates are green, and the deviation is
disclosed rather than worked around.)_
