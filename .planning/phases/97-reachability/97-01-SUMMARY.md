---
phase: 97-reachability
plan: 01
wave: 1
status: complete
requirements: [NAV-01, NAV-02]
files_modified:
  - tests/e2e/97-elected-officials-reachable.spec.ts
  - tests/e2e/97-settings-nav.spec.ts
---

# 97-01 — Wave-1 observers for NAV-01 and NAV-02

Two click-through oracles written BEFORE their subjects (producer-before-consumer, D-10). No
product code. Both are expected RED until 97-05/97-06/97-07 land, and both are red **for their
subject**, not for a tooling reason.

---

## Task 1 — `tests/e2e/97-elected-officials-reachable.spec.ts` (NAV-01)

367 lines. Header block in the 95 shape (`@covers NAV-01`, WHAT THIS KILLS, AUTHENTICATION,
NETWORK). `signInInline` and `INTERNAL_STRING` copied verbatim from
`95-monitoring-mounts.spec.ts:29-66` / `:54-55`, the regex **unwidened**.

### The five test titles, exactly as `--list` prints them

```
sidebar row — ordinary authenticated user, desktop 1400
hub type card — ordinary authenticated user, desktop 1400
hub type card click destination — ordinary authenticated user, desktop 1400
compare selector — ordinary authenticated user, desktop 1400
create hub + create submit — ordinary authenticated user, desktop 1400
```

Every title carries both the role and the viewport (RULING-P97-03 §3). The phrase
`ordinary authenticated user` appears on **exactly** the five `test(` lines and nowhere in prose —
the gate's `D -eq T` equality is what forces that, so a later unnamed test turns it red.

### The count assertion is a real equality, not a visibility check (RULING-P97-04 §2)

`deriveElectedOfficialTotal()` fetches `/api/elected-officials?limit=1` **itself** and reads
`.total`. `GET /api/elected-officials` sits behind Express `authenticateToken` — verified directly:

```
$ curl -s -o /tmp/eo.json -w "HTTP %{http_code}\n" "http://localhost:5173/api/elected-officials?limit=1"
HTTP 401
{"error":"Unauthorized","message":"Authentication required"}
```

so the helper lifts the bearer token out of the supabase-js session blob in localStorage
(`sb-<ref>-auth-token`) and never prints it. It returns `null` — never a fabricated fallback — on a
missing blob, a non-2xx, or a body without a numeric `.total`; the caller turns that `null` into the
em-dash obligation, so a down source produces a **different** assertion rather than a weaker one.

Happy path asserts `countChip` `toHaveCount(1)` and `toHaveText(String(derivedTotal))`, at least one
`dossier-count-unavailable` inside the card, and — when `derivedTotal > 0` — zero elements in the
card whose exact text is `0`. That last one is aimed straight at
`DossierListPage.tsx:582-587`'s `?? { count: 0, activeCount: 0, inactiveCount: 0 }`.

### Producer-before-consumer note for 97-05

The spec targets `[data-testid="dossier-type-card-elected_official"]`, which does not exist in-tree.
It also reads the count chip as `.chip` **scoped inside that card** (the shipped
`DossierTypeStatsCard.tsx:161-166` class); 97-05 needs to add only the card testid, not a second
one. If 97-05 renames either, it repoints this file in the same edit (C9).

---

## Task 2 — `tests/e2e/97-settings-nav.spec.ts` (NAV-02)

308 lines. `@covers NAV-02`. The WHAT-THIS-KILLS paragraph states RULING-P97-03 §2 in its own
words: `AppShell` gates BOTH Sidebar mounts (`:186` desktop aside, `:238` mobile drawer) off the
same `isSettingsRoute` flag, so a desktop-only oracle would report NAV-02 closed while every
settings child at phone width had no navigation whatsoever.

Population hardcoded as a 6-element array with a module-load `throw` if the length is not 6.
16 tests = {6 children + index + section-click} × {desktop 1400, mobile 390} = the 12 child
observations the ruling requires plus the two extra claims at each width.

### The sixteen test titles, exactly as `--list` prints them

```
settings child /settings/webhooks — ordinary authenticated user, desktop 1400
settings child /settings/integrations — ordinary authenticated user, desktop 1400
settings child /settings/notifications — ordinary authenticated user, desktop 1400
settings child /settings/email-digest — ordinary authenticated user, desktop 1400
settings child /settings/calendar-sync — ordinary authenticated user, desktop 1400
settings child /settings/calendar/callback — ordinary authenticated user, desktop 1400
settings index active state — ordinary authenticated user, desktop 1400
section click from a child — ordinary authenticated user, desktop 1400
settings child /settings/webhooks — ordinary authenticated user, mobile 390 @mobile
settings child /settings/integrations — ordinary authenticated user, mobile 390 @mobile
settings child /settings/notifications — ordinary authenticated user, mobile 390 @mobile
settings child /settings/email-digest — ordinary authenticated user, mobile 390 @mobile
settings child /settings/calendar-sync — ordinary authenticated user, mobile 390 @mobile
settings child /settings/calendar/callback — ordinary authenticated user, mobile 390 @mobile
settings index active state — ordinary authenticated user, mobile 390 @mobile
section click from a child — ordinary authenticated user, mobile 390 @mobile
```

### The mobile-tag contract, verified end to end (this is 97-07 Task 3's input)

The tag is spelled ONLY inside the eight mobile titles — not in a comment, not on a describe, not
in prose. The count 97-07 derives and the count Playwright actually selects were compared:

```
$ command grep -c "^\s*test[.(].*@mobile" tests/e2e/97-settings-nav.spec.ts
8
$ command grep -c '@mobile' tests/e2e/97-settings-nav.spec.ts
8
$ pnpm exec playwright test tests/e2e/97-settings-nav.spec.ts --project=chromium-mobile --no-deps --list
Total: 8 tests in 1 file
```

Derived 8 == selected 8. That is the C6 check the gate standard asks for ("verify a count by
constructing a spec with a known number of tests and comparing"), and `--no-deps` is present on the
`--list` too — the `setup` project does not appear in either listing.

**The six mobile child tests are written LONGHAND, one `test(...)` per child, deliberately.** My
first draft used `for (const childPath of SETTINGS_CHILDREN)`. The gate caught it: `EXPM=3`, below
the threshold of 8. A loop collapses six runtime tests into one source line, so 97-07 would derive
"expect 3 passes" while 6 tests ran — three could vanish unnoticed, which is exactly the
skipped-reads-as-passed hole (RULING-P97-06 §2) the tag exists to close. The gate is right and the
loop was wrong; a comment above the blocks records this so a later tidy-up refactor does not
silently reopen it.

---

## Gates — BOTH directions, observed

Both gates were run **verbatim** from the plan. `command grep` was instrument-tested first, because
the gates use `\s` and this machine's `command grep` is BSD, not GNU:

```
$ command grep --version
grep (BSD grep, GNU compatible) 2.6.0-FreeBSD
$ printf "test('a')\n  test('b @mobile')\n    test.fixme('c')\nxx test('d')\n" > /tmp/gsprobe.txt
$ command grep -c "^\s*test(\|^\s*test\.fixme(" /tmp/gsprobe.txt
3          # lines 1,2,3 — correctly EXCLUDES line 4 ("xx test(...)")
$ command grep -c "^\s*test[.(].*@mobile" /tmp/gsprobe.txt
1          # the INDENTED tagged line matched
```

`\s` is supported here. A zero from these gates is a measurement, not an untested instrument.

### RED — observed against the undone tree (before either file existed)

```
$ ls tests/e2e/97-elected-officials-reachable.spec.ts tests/e2e/97-settings-nav.spec.ts
ls: tests/e2e/97-elected-officials-reachable.spec.ts: No such file or directory
ls: tests/e2e/97-settings-nav.spec.ts: No such file or directory

GATE-1 EXIT: 1
GATE-2 EXIT: 1
```

**C2 attribution:** each chain died at `test -f "$R/tests/e2e/97-*.spec.ts"` — the gate's own
subject, which is precisely what this task creates. Not a tooling step. The instrument controls in
the same chains were live and non-vacuous at that moment: `test -f .../95-monitoring-mounts.spec.ts`
resolved (proving the search root), and gate 2's derivation returned `N=6` from
`routeTree.gen.ts` (proving the `sed`+`grep` instrument produced a real, non-zero threshold).

### GREEN — observed after writing the files

```
$ # gate 1, verbatim
GATE-1 EXIT: 0        (D=5, T=5, modern-nav occurrences=0)
$ # gate 2, verbatim
GATE-2 EXIT: 0        (N=6, C=6, EXPM=8, @mobile lines=8)
```

**How the done state was constructed:** by writing the two spec files, which _are_ this plan's
entire deliverable. There is no simulation gap here — the gates' subject is the file, so the
work-done state and the delivered state are the same object. GATE-STANDARD C1's "scratch copy"
clause is aimed at gates whose done-state must be faked; it was still honoured for the
falsification drill below, which ran entirely in `/tmp/97-01-drill` and left the repo byte-identical
(`git status --porcelain` for my two paths showed only the two intended `??` entries afterwards).

### MAX REACHABLE (C4)

| gate | quantity                             | max achievable | threshold     | reached |
| ---- | ------------------------------------ | -------------- | ------------- | ------- |
| 1    | `T` (`test(`/`test.fixme(` lines)    | 5              | `>= 5`        | exactly |
| 1    | `D` (role+viewport titles)           | 5              | `== T` = 5    | exactly |
| 1    | `modern-nav` occurrences             | 0              | `== 0`        | exactly |
| 2    | `C` (distinct `/settings/` children) | 6              | `>= N` = 6    | exactly |
| 2    | `EXPM` (tagged declaration lines)    | 8              | `>= 8`        | exactly |
| 2    | `@mobile` lines                      | 8              | `== EXPM` = 8 | exactly |

`test.fixme` was NOT used (see the create-submit result below), so gate 1's sanctioned fixme branch
is unexercised and both counts sit at 5 regardless.

### Falsification drill — six mutations, each red for its own reason

Run in `/tmp/97-01-drill` (copies of both specs + `95-monitoring-mounts.spec.ts` +
`routeTree.gen.ts`). Baseline in the scratch copy: gate 1 = 0, gate 2 = 0.

| #   | mutation                                                        | derived             | exit | expected |
| --- | --------------------------------------------------------------- | ------------------- | ---- | -------- |
| A   | one NAV-01 title loses `ordinary authenticated user, `          | `D=4 T=5`           | 1    | 1        |
| B   | a 6th NAV-01 test added with no role/viewport in its title      | `D=5 T=6`           | 1    | 1        |
| C   | a comment referencing the standalone demo nav tree added        | occurrences=1       | 1    | 1        |
| D   | one mobile test loses its tag                                   | `EXPM=7`            | 1    | 1        |
| E   | the tag written into a comment                                  | `EXPM=8 ALL=9`      | 1    | 1        |
| F   | one `/settings/` child dropped from the population              | `C=5 < N=6`         | 1    | 1        |
| G   | the whole mobile describe deleted (RULING-P97-03 §2 regression) | `mobile 390` absent | 1    | 1        |

Restored after each: gate 1 = 0, gate 2 = 0. The repo tree was untouched throughout.

> Drill honesty note: mutation A's **first** attempt reported exit 0. That was my `perl -0pi`
> substitution failing to match, not the gate passing a broken file — the mutation never landed. It
> was redone line-addressed with `sed`, the derived values were printed (`D=4 T=5`) to prove the
> mutation applied, and the gate then returned 1. Recorded rather than quietly overwritten, because
> a green from an instrument that did nothing is the exact class this drill exists to catch.

---

## Playwright — the expected RED, with attribution

Run command per `97-VALIDATION.md`, one spec file per invocation (Playwright paths are FILTERS),
spec-file existence asserted first by the gates above.

Exit codes were captured DIRECTLY (`cmd; RC=$?`), never through a pipe:

```
NAV01 chromium-en    EXIT=1
NAV02 chromium-en    EXIT=1
NAV02 chromium-mobile EXIT=1
```

### NAV-01 — `--project=chromium-en --no-deps`

```
  4 failed
  1 passed (20.7s)          # exit 1
```

Attribution, one line per failure, straight from the run:

```
Locator: locator('aside.appshell-aside').getByRole('link', { name: 'Elected Officials', exact: true })
Error: element(s) not found
Locator: locator('[data-testid="dossier-type-card-elected_official"]')
Error: element(s) not found
Locator: locator('[data-testid="dossier-type-card-elected_official"]')
Error: element(s) not found
Locator: getByRole('option', { name: 'Elected Officials', exact: true })
Error: element(s) not found
```

Every red is `element(s) not found` on the affordance the subject is supposed to create — the
missing sidebar row, the missing hub card (twice), the missing compare option. `navigation-config.ts`
carries no `electedOfficials` row today (verified: `command grep -n 'electedOfficials'` on that file
returns nothing), which is the must-have truth this plan claimed.

**The one PASS is `create hub + create submit`, and it is a real result, not a gap.** That test is
Assumption A1's behavioural leg, and its subject already ships: `/dossiers/create` has rendered
`data-testid="hub-card-elected_official"` since Phase 31, so the reachability half needed nothing
new. The submit half was driven end to end and **landed on a real detail page** — condition 8 is
satisfied behaviourally, not by assertion. `test.fixme` was therefore NOT used, and there is no
fixme blocker text for 97-09's decision table to consume; the NAV-01 decision row can record the EO
create flow as **verified working**, with this spec as the standing observer.

### NAV-02 — `--project=chromium-en --no-deps`

```
  14 failed
  2 passed (40.0s)          # exit 1
```

Every one of the 14 failures has the identical attribution — the subject, at both widths:

```
Locator: locator('nav.settings-nav-card')
Expected: visible
Error: element(s) not found
  - navigated to "http://localhost:5173/settings/webhooks"
```

The 2 passes are exactly:

```
settings index active state — ordinary authenticated user, desktop 1400 (5.3s)
settings index active state — ordinary authenticated user, mobile 390 @mobile (3.7s)
```

which is the correct and expected shape: `/settings` (the exact-match half at
`routes/_protected/settings.tsx:11-17`) already renders the nav column with exactly one
`aria-current="page"`, so the index tests pass today. All 12 child observations and both
section-click claims fail because no child renders the column at all. **That contrast is itself the
NAV-02 defect, measured** — index works, children do not, at both viewports.

### NAV-02 — `--project=chromium-mobile --no-deps` (the baseline 97-07 Task 3 consumes)

```
  7 failed
  1 passed (20.6s)          # exit 1
```

8 selected (= the derived tag count), 1 passing. **97-07's gate must require 8 of 8 PASSED**, and
today's baseline is 1 — so the number has somewhere to move and cannot be satisfied by a skip. This
is the row 97-07 Task 3 reads.

---

## Two stale-recipe findings, surfaced by writing this (neither fixed here — out of declared files)

Both are in `tests/e2e/elected-official-create.spec.ts`, which 97-01 does not own. Filed here so a
later owner does not rediscover them:

1. **Step 1 of the EO wizard was rewritten and that spec was not.** It fills
   `getByPlaceholder(/Enter name in English/)`; step 1 is now "Identity" and has no such field. Its
   required three are `last_name_en`, `last_name_ar`, and a `nationality_id` country picker.
   Copying the recipe verbatim produced a 30 s timeout on the first `fill` — a **tooling** red, not
   a subject red, and I repaired it here rather than recording it (GATE-STANDARD C2).
2. **The EO detail route now redirects to an `/overview` tab**, so the created record's URL is
   `/dossiers/elected-officials/<uuid>/overview`. That spec anchors the uuid at `$` and would not
   match. My spec allows the trailing segment.

Two smaller in-tree facts the specs had to work around, recorded because they cost time:

- `DossierPicker.tsx:311` sets `role="combobox"` on a `Button` rendered through
  `PopoverTrigger asChild` and **the role does not reach the DOM** — the element renders as a plain
  `button`. `pickDossier` accepts `button|combobox` via `.or()`, mirroring
  `support/pages/LoginPage.ts`'s sign-out control. This is the Phase-79 filtered-DOM-props behaviour
  on the same primitive.
- The wizard's _required_ fields render their label as plain text rather than `<label for>`, so
  those inputs carry **no accessible name**; they are addressed by their react-hook-form `name`
  attribute instead. (The optional fields next to them _do_ have accessible names.)

One side effect, stated plainly: running the create-submit test writes a real row to the dev
stack's database, named `e2e-97-01-elected-official-<timestamp>`. The shipped
`elected-official-create.spec.ts` already does the same; three such rows exist from this session's
runs.

---

## Closed-vocabulary check

Across both files the outcome states are: **PASSED** (1 in NAV-01, 2 in NAV-02), **FAILED** (4 and
14). There are **zero** `test.fixme` declarations, **zero** `test.skip()` calls, and **zero** UNABLE
TO MEASURE states — every run reached its assertion of record. Nothing is folded into PASSED.

## Population definition

This plan covers the NAV-01 and NAV-02 observers **only**. OUTSIDE IT: NAV-03's two specs (97-02),
NAV-04's spec (97-10), the Arabic/RTL pixel sitting (operator park, D-12 — no visual baselines
committed, and none were).

## GATE DRILL row (D-11 — 97-12 consolidates this into `97-GATE-DRILL.md`; it alone writes that file)

| plan.gate   | C1 red                                                                                                                                                                                | C1 green (how the done state was constructed)                                                                                                                       | C2–C10 exceptions                                                                                                                                                                                                                      | verdict |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 97-01.task1 | exit 1 on the undone tree, dying at `test -f .../97-elected-officials-reachable.spec.ts` (its own subject); controls live in the same chain (`95-monitoring-mounts.spec.ts` resolved) | exit 0 after writing the file — the file IS the deliverable, so done-state == delivered-state; discriminating power proven by mutations A/B/C in `/tmp/97-01-drill` | none. C4 max reachable = threshold on all three quantities; C5 roots proven, no `2>/dev/null`; C6 `--no-deps` on every invocation incl. `--list`; C8 satisfied — the file never spells the demo-tree name it is forbidden to reference | SOUND   |
| 97-01.task2 | exit 1 on the undone tree, dying at `test -f .../97-settings-nav.spec.ts`; `N=6` derived live from `routeTree.gen.ts` in the same chain                                               | exit 0 after writing the file; mutations D/E/F/G each red for their own reason                                                                                      | none. C4 `C=6` vs derived `N=6`, `EXPM=8` vs 8; C6 verified empirically — derived tag count 8 == `chromium-mobile --no-deps --list` count 8                                                                                            | SOUND   |

## BLOCKED

_(empty — nothing blocked this plan)_
