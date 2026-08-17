---
phase: 97-reachability
plan: 05
wave: 2
status: work-complete-gate-3-blocked
requirements: [NAV-01]
files_modified:
  - frontend/src/components/dossier/DossierTypeStatsCard.tsx
  - frontend/src/pages/dossiers/DossierListPage.tsx
  - frontend/src/components/layout/navigation-config.ts
files_declared_but_not_modified:
  - frontend/src/components/dossier/DossierTypeGuide.tsx
gate_1: GREEN
gate_2: GREEN
gate_3: RED (structural half green; behavioural half 2/4 — see BLOCKED B1)
---

# 97-05 — Elected Officials on the sidebar and the dossier hub, without the fabricated zero

**Executed 2026-08-17** on `milestone/v10.0-trust`, base HEAD `13941dacf`, committed as
`59f2a149c` (three files, explicit pathspec).

The substance is delivered and behaviourally observed: the eighth type is on both surfaces, its
count is REAL and equals an independently derived total, and no card on the grid can display a
number no source produced. **Two consumer defects were found and are reported in `## BLOCKED`
rather than worked around. No gate was edited, no criterion weakened, nothing below is claimed
green that is not.**

---

## Task 1 — `DossierTypeStatsCard`: an absent count renders the em dash, for every type

| Line     | Change                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `:29`    | `Crown` added to the existing single lucide import block                                                    |
| `:36`    | `import type { DossierCardType } from '@/lib/dossier-type-guards'` replaces the `dossier-api` `DossierType` |
| `:39`    | `type: DossierCardType`                                                                                     |
| `:47-50` | the four figures become `number \| null`, on four separate lines                                            |
| `:58-66` | `CountUnavailable` — the ONE internal renderer                                                              |
| `:94-95` | `case 'elected_official': return <Crown {...iconProps} />`; the `default:` arm untouched                    |
| `:141`   | `data-testid={'dossier-type-card-' + type}` on the `Card`                                                   |

`CountUnavailable` is the shipped treatment copied verbatim in substance from
`DossierListPage.tsx`'s counts-error branch — an em dash carrying
`data-testid="dossier-count-unavailable"` and `aria-label={t('common:errors.countUnavailable')}`.
It is used at all four figure sites (chip `:200`, percentage `:233`, active `:245`, inactive
`:254`). **This is the root-cause fix**: it keys on "this figure has no source", not on
"this type is Elected Officials", so the three fabrication layers cannot reappear one at a time.

**C9 — no consumer repoint is due.** The testid string is `dossier-type-card-elected_official`,
which is exactly what 97-01's spec already targets (`97-01-SUMMARY.md:63`). I did not rename it.
The count chip is still the shipped `.chip` class inside the card, and I added no second one, as
97-01 asked. Repo-wide sweep of the name:

```
$ command grep -rn 'dossier-type-card-' .planning/phases/97-reachability/ tests/e2e/ frontend/src/
97-01-SUMMARY.md:63, :244, :246          (references, unchanged)
97-01-PLAN.md:103, :133                  (references, unchanged)
tests/e2e/97-elected-officials-reachable.spec.ts:35, :208, :251   (the consumer — matches)
frontend/src/components/dossier/DossierTypeStatsCard.tsx:141      (the producer — added here)
```

### The `DossierTypeGuide` popover: OBSERVED broken for EO, so the trigger is WITHHELD

The plan asked me to verify by RENDERING, not to reason. I did, against the live stack, with a
known-good control in the same run:

```
=== card elected_official ===
GUIDE TRIGGER COUNT: 1
POPOVER TEXT: "Elected Official\n\ntypeDescription.elected_official"     <-- RAW KEY

=== card person ===                                                       <-- CONTROL
GUIDE TRIGGER COUNT: 1
POPOVER TEXT: "Person\n\nVIP individuals including ambassadors, ministers, and key contacts"
```

`GuideContent` renders `t(\`typeDescription.${type}\`)` with **no** default value, and neither
locale bundle carries that key for this type (derived by structured lookup, not substring):

```
frontend/src/i18n/en/dossier.json   type.elected_official => "Elected Official"
                                    typeDescription.elected_official => ABSENT
                                    typeGuide.elected_official.* => ABSENT (all four)
frontend/src/i18n/ar/dossier.json   type.elected_official => "مسؤول منتخب"
                                    typeDescription.elected_official => ABSENT
                                    typeGuide.elected_official.* => ABSENT (all four)
```

So the plan's stated fallback branch applies: **the guide trigger is hidden for
`elected_official` and only for it** (`DossierTypeStatsCard.tsx:160-168`), with the reason and
the observation date in a code comment pointing here.

**`DossierTypeGuide.tsx` was therefore NOT modified**, and the plan's frontmatter sanctions this
(`# accepts the card set (or its EO state is recorded)`). Widening its `type` prop while the card
never passes it an EO value would be dead widening, and it does not stop at that file: widening
`GuideContent` forces `onSelect?: (type: DossierType) => void` to widen too, which under
`strictFunctionTypes` breaks every wizard caller that passes a `DossierType` handler. The narrow
render-site guard costs one condition and ripples nowhere.

**FOR 97-09's DECISION ROW (ACCEPTANCE condition 8 — a new entry point at a surface with a
known-broken sub-affordance must NAME that state):** the Elected Officials hub card ships with
its type-guide popover deliberately absent. The blocker is missing copy —
`dossier:typeDescription.elected_official` and the four `dossier:typeGuide.elected_official.*`
entries, in both locales. Authoring copy is Phase 98's (`COPY-*`), not this plan's. When those
five keys land in both locales, deleting the `type !== 'elected_official' &&` guard is the whole
repair.

**OBSERVED, NOT FIXED** (recorded as the plan instructs, excluded by its boundary): the hardcoded
English `"% of total active dossiers"` at `DossierTypeStatsCard.tsx:229` — a `COPY-*` finding
owned by Phase 98.

---

## Task 2 — `DossierListPage`: the card set, both fabrication layers, and the real EO total

**The list moves, and all consumers of it move together** (the drift class this phase closes):

| Site                      | Before                              | After                                      |
| ------------------------- | ----------------------------------- | ------------------------------------------ |
| import `:72`              | `DOSSIER_TYPES`                     | `DOSSIER_CARD_TYPES` + `DossierCardType`   |
| loading skeletons `:576`  | `[0,1,2,3,4,5,6].map`               | `DOSSIER_CARD_TYPES.map` (7 → 8 skeletons) |
| counts-error tiles `:594` | `DOSSIER_TYPES.map`                 | `DOSSIER_CARD_TYPES.map`                   |
| stats memo `:485`         | `for (const type of DOSSIER_TYPES)` | `for (const type of DOSSIER_CARD_TYPES)`   |
| card grid `:617`          | `DOSSIER_TYPES.map`                 | `DOSSIER_CARD_TYPES.map`                   |

The skeleton row is a **deviation the plan did not name**: it was a literal `[0..6]` array, so
leaving it would have flashed seven skeletons then eight cards. Deriving it from the same
constant makes it move with the set forever. Recorded rather than silently done.

**Fabrication layer 2** (`:485-500`, the memo): a type with no bucket now maps to `null`, not to
`{ count: 0, … }`. The map's value type is `Record<string, DossierCardStats | null>`, where
`DossierCardStats` (`:81-90`, module scope) has all four fields `number | null`.

**Fabrication layer 3** (`:617-633`, the grid): the `?? { count: 0, … }` default is **deleted**.
`const stats = typeStatsMap ? typeStatsMap[type] : null`, and each figure passes through as
`stats ? stats.<f> : null`. There is now **no `??` anywhere in that block** — deliberately, since
`RULING-P97-06` §2 names hoisting the fallback to a `ZERO_STATS` constant as the escape the old
form permitted.

**The real EO total** (`:265-271`): `useElectedOfficials({ limit: 1 })`, read through
`isSuccess`, not through `data`:

```ts
const electedOfficialTotal = electedOfficialsQuery.isSuccess
  ? electedOfficialsQuery.data.total
  : null
```

`isSuccess` is the gate on purpose — pending, failed, and **failed-while-holding-stale-data** all
collapse to `null`. A number shown while its source is unreachable is the same lie as a
fabricated zero pointing the other way. Composed per figure at `:487-497`: total real,
active/inactive/percentage `null`, with the reason in a comment at the composition site.

**EO click semantics** (`:461-465`): the EO card navigates to `/dossiers/elected-officials`; the
sibling seven keep their in-place toggle byte-unchanged. `dossiers.type` has no
`elected_official` value, so filtering would show zero rows beside a real count.

**The counts function is NOT widened.** `services/dossier-api.ts:702-711` and its throw-on-error
contract are untouched — `git diff HEAD~1 --stat` names three files, and that is not one of them.

---

## Task 3 — the Elected Officials row in the live sidebar

`navigation-config.ts`: `Crown` added to the single lucide import block (`:19`), and one
four-key `NavigationItem` inserted between `dossier-persons` and `dossier-forums`
(`:144-149`) — `id: 'dossier-elected-officials'`, `label: 'navigation.electedOfficials'`,
`path: '/dossiers/elected-officials'`, `icon: Crown`. No badge, no `secondary`, no per-item
styling, no group reordering. **The administration group was not touched** (97-10 owns it).

**The both-locale key was RE-DERIVED, not assumed** (the plan required this), with a
known-positive control because `command grep` here is a ugrep wrapper honouring `.gitignore`:

```
$ command grep -n '"electedOfficials"' frontend/src/i18n/en/common.json
147:    "electedOfficials": "Elected Officials"
$ command grep -n '"electedOfficials"' frontend/src/i18n/ar/common.json
147:    "electedOfficials": "المسؤولون المنتخبون"
$ command grep -c '"persons"' frontend/src/i18n/{en,ar}/common.json     # instrument control
en: 1   ar: 1
```

**Present in BOTH locales at line 147, identically. No new key was authored** — nothing to add
in this commit. (The rendered English label is "Elected Officials"; note the shipped English for
`navigation.persons` is "People", not "Persons" — that cost one control run below.)

**Active-state trap cleared:** `/dossiers/persons` and `/dossiers/elected-officials` do not
prefix-collide, so `Sidebar.tsx:128`'s `pathname.startsWith(item.path + '/')` produces no double
active state.

---

## The behavioural observations — role and viewport NAMED on every one

Run against the live dev stack (`http://localhost:5173`, HTTP 200) with the `.env.test`
`TEST_USER_*` account. No credential value was printed by any harness.

### ROLE PROBE — the account this proves is ADMIN, and that is narrower than "ordinary"

```
C3 ROLE PROBE — admin-only "AI Settings" row visible to this account: YES (account IS admin)
```

Stated plainly because 97-01's five test titles all read "ordinary authenticated user" while the
credentials in `.env.test` resolve to an **admin** account. Structurally the claim still holds —
`navigation-config.ts:173` gates only the `administration` group on `isAdmin`, and the `dossiers`
group is emitted unconditionally, so the EO row is not admin-scoped. But **no observation in this
phase has yet run as a non-admin**, so what is OBSERVED is "reachable for an admin account", and
the "ordinary" half of those titles is an unverified widening. Filed for 97-09/97-12; not mine to
repair (the titles are 97-01's file).

### The count equality — REAL, not a visibility check

```
INDEPENDENT .total  = 5 (HTTP 200, rows returned: 1)     <- fetched by the harness itself from
                                                            /api/elected-officials?limit=1 with a
                                                            bearer token, a path the render shares
                                                            nothing with
RENDERED chip text  = "5"
EQUAL               = true
em-dashes in card   = 3        (percentage, active, inactive — the three with no source)
exact-"0" nodes     = 0        (the ?? { count: 0, … } assertion, direct)
```

**Role: admin account, `.env.test`. Viewport: desktop 1400.**

> The total is a moving number by design — every `create hub + create submit` run writes one row.
> It read 5 at the moment of this observation and the rendered chip read 5 at that same moment;
> the spec re-derives it per run, so the equality is what is asserted, never the literal 5.

### Sidebar row — desktop 1400 (the live `aside.appshell-aside`)

```
PASS  row is visible in the LIVE desktop aside          (exactly 1 match)
      settled URL: http://localhost:5173/dossiers/elected-officials?page=1
PASS  destination h1 "Elected Officials" visible
PASS  destination "Add Elected Official" link visible
PASS  no internal-string leak
```

### Sidebar row — mobile 390 (the drawer mount), NOT required by any gate, run anyway

`AppShell` mounts `Sidebar` twice (desktop aside `:204`, mobile drawer `:260`), and
`RULING-P97-03` §2 records that a desktop-only oracle reports a surface closed while phone width
has none. 97-01's NAV-01 spec is desktop-only, so this leg had no observer:

```
PASS  row reachable in the mobile drawer  (matches found: 1)   [trigger: "Open navigation menu"]
      settled URL: http://localhost:5173/dossiers/elected-officials?page=1
PASS  mobile click lands on the EO list
PASS  mobile destination h1 visible
```

**Role: admin account. Viewport: mobile 390, drawer mount.** The row propagates because both
mounts render the same `createNavigationGroups` output — but that is a data-structure claim, and
this is the click-through D-10 asks for.

### The FREE consequence — command palette, OBSERVED rather than asserted

`RULING-P97-03` §4 predicts the row propagates to the palette at no cost, because
`CommandPalette.tsx:104` imports `createNavigationGroups` and `:522` calls it. Verified live:

```
palette open: true
command-palette hits for "Elected Officials": 1
palette click settled at: http://localhost:5173/dossiers/elected-officials?page=1
```

**This does NOT resolve the separate hardcoded-`isAdmin` defect, which is 97-10's.**
`CommandPalette.tsx:522` reads `createNavigationGroups({ tasks: 0, approvals: 0, engagements: 0 }, true)`
— the second argument is the literal `true`, so the palette lists every administration row to
every user regardless of role. My row rides the same call and changes nothing about that; it is
untouched and still open.

---

## Gates — BOTH directions, verbatim, actual output

Gate scripts were extracted byte-for-byte from `97-05-PLAN.md` lines 160 / 202 / 231 into
`/tmp/p97-05-gates/gate{1,2,3}.sh` and run with `bash`. All three `bash -n` parse clean. Exit
codes captured DIRECTLY (`cmd; RC=$?`), never through a pipe.

### Instrument control first (a zero from an untested instrument is not a measurement)

```
$ command grep --version
grep (BSD grep, GNU compatible) 2.6.0-FreeBSD                 <- `\s` IS supported here
$ command grep -c "^\s*test(" probe.txt        -> 2   (correctly excludes test.fixme and "xx test(")
$ command grep -c 'dossier-count-unavailable' DossierListPage.tsx     -> 1   (known POSITIVE)
$ command grep -c 'dossier-count-unavailable' DossierTypeStatsCard.tsx -> 0   (known NEGATIVE, pre-work)
```

### Gate 1 — RED on the undone tree, at its own subject

```
c1 test -f card:                    0
c2 test -f listpage (CONTROL):      0     <- roots proven live in the same chain (C5)
c3 grep dossier-count-unavailable:  1     <-- SUBJECT; RED LANDS HERE
c4 grep countUnavailable:           1
c5 grep Crown:                      1
c6 grep dossier-type-card-:         1
c7 grep -c 'number | null' = 0            (threshold -ge 4)
GATE1_RC=1
```

### Gate 1 — GREEN after the work

```
GATE1_RC=0
  clause detail: grep -c 'number | null' = 4   (threshold -ge 4 — MAX REACHABLE = 4, exactly)
 Tasks:    6 successful, 6 total          <- pnpm typecheck
```

### Gate 2 — RED on the undone tree

```
c1 test -f listpage:            0
c2 grep DOSSIER_CARD_TYPES:     0     <-- PASSED ON THE UNDONE TREE. See the C8 note below.
c3 grep useElectedOfficials:    1     <-- SUBJECT; RED LANDS HERE
c4 grep elected-officials:      1     <-- SUBJECT
memo range lines      = 23   (-gt 8)   memo 'count: 0' = 1 (-eq 0)   memo '| null' = 0 (-ge 1)
grid range lines      = 1    (-gt 8)   <- start anchor does not match today, so the range is empty
grid range with TODAY's anchor (DOSSIER_TYPES) = 20 lines, '??' count = 1
GATE2_RC=1
```

**C8 observation — the plan's acceptance criteria contain one false statement about the undone
tree, which did NOT make the gate vacuous but should be corrected.** The criteria say
"`DOSSIER_CARD_TYPES` is absent from this file today AND the `count: 0` inside the memo range is
present, so both halves fail on the real defect". The first half was **false at execution**:
97-04 landed a three-line explanatory comment at `DossierListPage.tsx:69` reading "Widening it to
DOSSIER_CARD_TYPES belongs with the count fix (plan 97-05)", so the whole-file
`command grep -q 'DOSSIER_CARD_TYPES'` clause **passed on prose** before any work existed. The
gate still went red for its subject one clause later (`useElectedOfficials`), and the two
range-scoped `DOSSIER_CARD_TYPES` checks were correctly 0, so no repair is needed — but this is
the C8 prose-contamination shape landing on a live clause, and a reviewer reading the criteria
would have expected that clause to be the red.

Two smaller numeric drifts in the same criteria, both harmless (thresholds are `-gt 8`): the
range-length preconditions were predicted at "24 and 25 lines today"; they measured **23** and
**20**.

### Gate 2 — GREEN after the work

```
memo range lines      = 36   (-gt 8)
memo has DOSSIER_CARD_TYPES: 0
memo '| null'   count = 1    (-ge 1)
memo 'count: 0' count = 0    (-eq 0)
grid range lines      = 17   (-gt 8)
grid has totalCount={: 0
grid '??'       count = 0    (-eq 0)
GATE2_RC=0
 Tasks:    6 successful, 6 total
```

The grid range the `sed` actually selected, pasted so the scope is auditable rather than asserted:

```
            {DOSSIER_CARD_TYPES.map((type) => {
              // No defaulted object here. A type the map has no stats for passes every figure
              // through as `null`, and the card renders the shipped em dash for each of them.
              const stats = typeStatsMap ? typeStatsMap[type] : null
              return (
                <DossierTypeStatsCard
                  key={type}
                  type={type}
                  totalCount={stats ? stats.count : null}
                  activeCount={stats ? stats.activeCount : null}
                  inactiveCount={stats ? stats.inactiveCount : null}
                  percentage={stats ? stats.percentage : null}
                  isSelected={filters.type === type}
                  onClick={() => handleTypeCardClick(type)}
                />
              )
            })}
```

### Gate 3 — RED on the undone tree

```
c1 test -f nav-config:                 0
c2 grep dossier-elected-officials:     1   <-- SUBJECT; RED LANDS HERE
c3 grep path literal:                  1   <-- SUBJECT
c4 grep Crown:                         1   <-- SUBJECT
c5 grep en locale key (CONTROL):       0   <-- the instrument control: live, non-vacuous
c6 grep ar locale key (CONTROL):       0
c7 grep -c "id: 'dossier-" = 6             (threshold -eq 7)
c8 test -f spec (CONTROL):             0
c9 EXP = 4                                 (threshold -ge 3)
GATE3_RC=1
```

### Gate 3 — structural half GREEN, behavioural half RED. Final `GATE3_RC=1`.

```
GATE3_STRUCTURAL_RC=0
  id: 'dossier- count = 7   (was 6; MAX REACHABLE = 6 + exactly 1 row = 7, equal to threshold)

behavioural half, per-test, counted from the JSON — never inferred from the exit code:
  FAILED   sidebar row — ordinary authenticated user, desktop 1400
  PASSED   hub type card — ordinary authenticated user, desktop 1400
  FAILED   hub type card click destination — ordinary authenticated user, desktop 1400
  PASSED   create hub + create submit — ordinary authenticated user, desktop 1400
  PASSED = 2, EXP = 4   ->   test "$PASSED" -eq "$EXP" fails
```

Both failures carry the **identical** attribution, and it is not this plan's subject:

```
Error: expect(page).toHaveURL(expected) failed
Received string:  "http://localhost:5173/dossiers/elected-officials?page=1"
  > 186 |     await expect(page).toHaveURL(/\/dossiers\/elected-officials$/, …)
```

See `## BLOCKED` B1. **Zero `test.skip()` and zero `test.fixme` were involved** — all four tests
ran to an assertion of record, which is why the run count is counted rather than inferred.

### Gate 3's behavioural half — the CONSTRUCTED GREEN (C1 clause 2)

Built in `/tmp/p97-05-scratch`: `git archive HEAD | tar -x`, my three committed files overlaid,
`node_modules` symlinked, `.env.test` and the gitignored `tests/e2e/support/storage/*.json`
copied in (both are C2 tooling preconditions — the first run died on
`ENOENT … storage/admin.json`, which is a tooling death, not a subject red, and was fixed rather
than recorded as evidence). The **only** delta from the shipped spec:

```
186c186,  260c260
<     await expect(page).toHaveURL(/\/dossiers\/elected-officials$/, { timeout: SETTLE_TIMEOUT })
---
>     await expect(page).toHaveURL(/\/dossiers\/elected-officials(\?|$)/, { timeout: SETTLE_TIMEOUT })
```

Result, with the gate's own counting logic:

```
PASSED = 4   EXP = 4
  PASSED  sidebar row — ordinary authenticated user, desktop 1400
  PASSED  hub type card — ordinary authenticated user, desktop 1400
  PASSED  hub type card click destination — ordinary authenticated user, desktop 1400
  PASSED  create hub + create submit — ordinary authenticated user, desktop 1400
SCRATCH_BEHAVIOURAL_HALF_RC=0
```

Labelled a **DEMONSTRATION**, not a gate run. The gate on disk and the spec in the repo are both
unedited.

### `pnpm typecheck` — attributed by captured compiler output, not by exit code (W-11)

The shared tree carried other wave-2 workers' in-flight breakage while I worked. Captured, with
per-file attribution, so the attribution is a measurement:

```
# mid-work, shared tree — errors present, NONE in my files:
src/components/settings/SettingsNavigation.tsx(137,30): TS2552 …      <- 97-07's, in flight
src/routes/_protected/compare.tsx(42,13): TS2304 …                    <- 97-06's, in flight
src/pages/entity-comparison/EntityComparisonPage.tsx(106,12): TS2304  <- 97-06's, in flight
$ command grep -E 'DossierTypeStatsCard|DossierListPage|navigation-config' tsc-shared.txt
  (no matches — my three files clean throughout)
```

To get a green attributable to MY subject rather than to another worker's timing, the same
scratch was typechecked:

```
$ cd /tmp/p97-05-scratch/frontend && node <repo tsc> --noEmit -p tsconfig.json
SCRATCH_TSC_RC=0        compiler output: 0 lines
```

Control, proving that harness compiles my files and CAN go red (a green from an instrument that
compiled nothing is the class this drill exists to catch):

```
# appended `const _p9705Control: number = "not a number"` to the scratch's DossierListPage.tsx
src/pages/dossiers/DossierListPage.tsx(1093,7): error TS2322: Type 'string' is not assignable to type 'number'.
# restored:
RESTORED_RC=0
```

By the time the gates were run for the record the shared tree was clean too, so both greens are
real: `node_modules/.bin/tsc --noEmit` → `SHARED_TSC_RC=0`, 0 output lines, and `pnpm typecheck`
→ `Tasks: 6 successful, 6 total` inside gates 1 and 2.

### Lint + format

```
$ prettier --write <my 3 files>   ->  all three "(unchanged)",  PRETTIER_RC=0
$ eslint -c eslint.config.mjs <my 3 files> --max-warnings 0   ->  ESLINT_RC=0
```

(`eslint -c eslint.config.mjs` must run from the REPO ROOT — there is no
`frontend/eslint.config.mjs`, and running it from `frontend/` dies `ENOENT` at rc 2. C3.)

### C1 tree integrity

`git status --porcelain` after the commit: 12 entries — the **7 exogenous paths in exactly their
session-start state** (5 `M`, 2 `??`, in no commit of mine), my 3 now committed and clean, and
2 `.planning/` SUMMARYs belonging to 97-06 and 97-08. Every drill artifact lives under
`/tmp/p97-05-gates` and `/tmp/p97-05-scratch`; nothing was written into the repo.
`git show --stat HEAD` names exactly three files. `git diff HEAD` on those three is empty, so the
content the gates measured is the content committed (lint-staged's `--fix`/`--write` changed
nothing).

---

## MAX REACHABLE (C4)

| gate | quantity                               | today | max achievable                      | threshold    | reached         |
| ---- | -------------------------------------- | ----- | ----------------------------------- | ------------ | --------------- |
| 1    | `grep -c 'number \| null'` in the card | 0     | 4 (four prop lines)                 | `>= 4`       | exactly         |
| 2    | memo-range length                      | 23    | 36                                  | `> 8`        | yes             |
| 2    | memo `DOSSIER_CARD_TYPES` / `\| null`  | 0 / 0 | 1 / 1                               | `-q`/`>=1`   | yes             |
| 2    | memo `count: 0`                        | 1     | 0                                   | `== 0`       | exactly         |
| 2    | grid-range length                      | 20\*  | 17                                  | `> 8`        | yes             |
| 2    | grid `??`                              | 1\*   | 0                                   | `== 0`       | exactly         |
| 3    | `id: 'dossier-` rows                   | 6     | 6 + 1 = 7                           | `== 7`       | exactly         |
| 3    | `EXP` (spec `test(` lines − 1)         | 4     | 4                                   | `>= 3`       | yes             |
| 3    | `PASSED`                               | 0     | **2** as frozen; 4 with B1 repaired | `== EXP` = 4 | **NO — see B1** |

\* measured with the pre-work `DOSSIER_TYPES` anchor; the gate's own `DOSSIER_CARD_TYPES` anchor
selects an empty range on the undone tree, which is why the length precondition is what catches
a drifted anchor.

**Gate 3's `PASSED == EXP` is the one clause whose max is NOT reachable against the frozen
artifacts.** That is the finding, and it is B1.

---

## POPULATION DEFINITION

Covered: the **sidebar** and the **dossier-hub type cards** of criterion 1 — plus, unasked, the
mobile-drawer mount of the sidebar and the command palette, both observed.

OUTSIDE IT, confirmed untouched: `/compare` (97-06), `/dossiers/create` (already 8/8 since
`70e773a3b`; only observed via the spec's create test, never edited), the counts function's DB-7
bucket set (97-04 owns it; deliberately NOT widened — `dossier-api.ts` is not in my commit), the
administration nav group (97-10), the hardcoded English on the stats card (Phase 98 `COPY-*`),
and the `typeDescription`/`typeGuide` EO copy (Phase 98 `COPY-*`).

Side effect, stated plainly: `create hub + create submit` writes a real row to the dev stack's
database each run, named `e2e-97-01-elected-official-<timestamp>`. It ran **3 times** in this
session (two gate-3 runs + one scratch run), so three more such rows exist beyond 97-01's.

---

## GATE DRILL rows (D-11 — 97-12 consolidates these into `97-GATE-DRILL.md`; it alone writes it)

| plan.gate   | C1 red                                                                                                                              | C1 green (how the done state was constructed)                                                                                                                      | C2–C10 exceptions                                                                                                                                                      | verdict                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 97-05.task1 | exit 1 at clause 3, `dossier-count-unavailable` absent from the card — its own subject; two `test -f` roots live in the same chain  | exit 0 on the delivered tree; typecheck half additionally attributed by a HEAD+my-files scratch (`SCRATCH_TSC_RC=0`) with a mutation control proving it can go red | none. C4 max = threshold on the `number \| null` count                                                                                                                 | SOUND                                           |
| 97-05.task2 | exit 1 at the `useElectedOfficials` clause — its own subject; memo range measured 23 lines with `count: 0` = 1 in the same chain    | exit 0 on the delivered tree; both sed ranges pasted above; scratch tsc as for task 1                                                                              | **C8: the whole-file `DOSSIER_CARD_TYPES` clause passes on 97-04's COMMENT**, so the criteria's claim that it is "absent today" is false. Not vacuous — c3 is the red. | SOUND (criteria prose needs a correction)       |
| 97-05.task3 | exit 1 at `dossier-elected-officials` — its own subject; both i18n control clauses in the same chain returned 0, proving live greps | structural half exit 0 on the delivered tree; behavioural half constructed in `/tmp/p97-05-scratch` → `PASSED = 4 = EXP`, single-delta diff pasted above           | **C1/C10: cannot pass as frozen — the consumed spec's `$` URL anchor is unsatisfiable by ANY implementation. See B1.**                                                 | **CANNOT CONSTRUCT (as frozen) — repair in B1** |

---

## BLOCKED

### B1 — Gate 3 cannot pass as frozen: 97-01's spec anchors a URL the router never produces

**The claim.** `tests/e2e/97-elected-officials-reachable.spec.ts:186` and `:260` both assert

```ts
await expect(page).toHaveURL(/\/dossiers\/elected-officials$/, { timeout: SETTLE_TIMEOUT })
```

The `$` makes the match fail on any query string. `/dossiers/elected-officials`'s own
`validateSearch` (`frontend/src/routes/_protected/dossiers/elected-officials/index.tsx:81-84`)
unconditionally returns `page: Math.max(1, Number(search.page) || 1)`, so TanStack Router
normalizes **every** arrival at that route to `?page=1`. The anchor is unsatisfiable.

**Not reasoned — measured, with two controls that involve none of my code:**

```
C1  bare page.goto('/dossiers/elected-officials'), no nav row, no click
      settled at: http://localhost:5173/dossiers/elected-officials?page=1
      FAIL  the `$` anchor matches a bare goto

C2  the SHIPPED /dossiers/persons sidebar row — in the tree for phases, nothing to do with 97-05
      settled at: http://localhost:5173/dossiers/persons?page=1
      FAIL  the `$` anchor would reject the shipped People row too
```

Every sibling dossier list route carries the identical `page: … || 1` line
(`persons:29`, `countries:91`, `forums:112`). **No implementation of this plan — and no
implementation of the six rows that shipped before it — can satisfy that anchor.** It was never
exercised in either direction by 97-01, because both tests were red on `element(s) not found`
long before reaching the URL assertion (`97-01-SUMMARY.md:242-250`), so the assertion itself was
never observed. This is GATE-STANDARD C1 clause 2 in its classic shape.

**Everything the two tests actually claim is delivered.** Replayed with the anchor relaxed and
nothing else changed:

```
PASS  row is visible in the LIVE desktop aside (exactly 1 match)
PASS  URL matches /\/dossiers\/elected-officials(\?|$)/
PASS  destination h1 "Elected Officials" visible
PASS  destination "Add Elected Official" link visible
PASS  no internal-string leak
PASS  EO hub card visible
PASS  hub-card click lands on the EO list, h1 visible
```

and the full spec in the scratch returns `PASSED = 4 = EXP`, exit 0.

**Ruling requested.** Change the two anchors in
`tests/e2e/97-elected-officials-reachable.spec.ts` (`:186`, `:260`) from
`/\/dossiers\/elected-officials$/` to `/\/dossiers\/elected-officials(\?|$)/`. That is the whole
repair; it keeps the path assertion exact and stops asserting the absence of a query string the
route always writes.

**I did not make it.** The file is 97-01's and is not in this plan's `files_modified`, and
relaxing an assertion to turn my own gate green is the exact move the standing law forbids
without a ruling. Recorded here instead, with the constructed green as the evidence.

### B2 — my counts-error widening breaks a shipped Phase-93 oracle, which pins that population at 7

`tests/e2e/93-dossier-list-counts-error.spec.ts:48` declares

```ts
// The type-overview grid renders one figure per entry of `DOSSIER_TYPES` in
// `frontend/src/pages/dossiers/DossierListPage.tsx` — seven types.
const DOSSIER_TYPE_COUNT = 7
```

and asserts `await expect(unknownCounts).toHaveCount(DOSSIER_TYPE_COUNT)` at `:83`. My plan
directs the counts-error branch to move to `DOSSIER_CARD_TYPES` with the other two consumers
("a widening that names one is the drift class this phase is closing"), so it now renders **8**
em-dash tiles. Measured, not predicted:

```
$ pnpm exec playwright test tests/e2e/93-dossier-list-counts-error.spec.ts --project=chromium-en --no-deps
93_SPEC_RC=1
  FAILED  blocked counts query renders em dash + inline error while the list still renders
    Expected: 7
    Received: 8
    > 83 |     await expect(unknownCounts).toHaveCount(DOSSIER_TYPE_COUNT)
```

This spec was green before my commit and is red after it. I am not hiding that.

**This is D-08's frozen-count class, arriving from the widening direction** ("a gate pinning a
count derives it at run time or states the expected delta; a frozen count is the moving-number
class"). Two repairs are available and the choice is a real judgement call, so I am not making it
unilaterally:

- **(a) Repoint the literal.** `DOSSIER_TYPE_COUNT = 7` → `8`, and its comment's `DOSSIER_TYPES`
  / "seven types" → `DOSSIER_CARD_TYPES` / "eight types". Better still, derive it from
  `DOSSIER_CARD_TYPES.length` so it never freezes again. Keeps the plan's instruction intact.
- **(b) Revert the counts-error branch to `DOSSIER_TYPES`** and record the asymmetry with its
  reason. There is a genuine argument for this that the plan does not address: that branch's
  population is _the types whose counts came from the failed counts query_, which is the DB-7 by
  construction. `elected_official` was never in that query, and its own source is independent and
  healthy — so rendering an em dash for it there asserts "this count is unavailable" about a
  number we actually have, which is a false unavailability claim rather than a fabricated zero,
  but still a claim the phase would not want. The cost of (b) is that the eighth card vanishes
  from the hub whenever the counts query fails.

I implemented **(a)'s side of the code** because the plan says so explicitly and silently
narrowing declared scope is not mine to do — but I did **not** edit
`93-dossier-list-counts-error.spec.ts`, which is outside my `files_modified`, so the repair is
unapplied and the spec is red pending a ruling.

### B3 — informational, no action needed from me: 97-01's role titles overclaim

All five NAV-01 test titles read `ordinary authenticated user`, but the `.env.test` credentials
resolve to an **admin** account (probe output above: the admin-only "AI Settings" sidebar row is
visible to it). The EO row is structurally not admin-scoped — `navigation-config.ts:173` gates
only the `administration` group — so the substantive claim survives; but the titles assert a role
no run in this phase has exercised. Filed for 97-09/97-12. Not repaired here: the titles are
97-01's file, and 97-01's own gate pins `D == T` on that exact phrase, so changing it is a
two-artifact edit under a ruling, not a drive-by.
