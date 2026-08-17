---
phase: 97-reachability
plan: 02
wave: 1
requirements: [NAV-03]
status: complete
gates: 2/2 green
executed: 2026-08-17
---

# 97-02 — NAV-03 observers (Digests tab + eight-page create affordance)

Two Wave-0 observer specs. **No product code.** Both are the observers criterion 3 is judged by;
they land before their subject (97-08) and are expected RED.

Files created (the plan's entire `files_modified`):

- `tests/e2e/97-digests-tab.spec.ts` — 2 tests
- `tests/e2e/97-list-create-affordances.spec.ts` — 9 tests

---

## Task 1 — `tests/e2e/97-digests-tab.spec.ts`

Header `// @covers NAV-03` + WHAT THIS KILLS in the 95 shape; inline auth and `INTERNAL_STRING`
copied verbatim from `95-monitoring-mounts.spec.ts:29-66` / `:54-55` (regex **unwidened** — T-97-05).

Engagement id is **derived, not hardcoded**: the spec clicks the first row of the **top-level
`/engagements`** list. That mount navigates to `/engagements/$engagementId/overview`
(`routes/_protected/engagements/index.tsx:55-62` passes no `onEngagementOpen`), while
`/dossiers/engagements` passes one (`:94,:111`) and opens a peek drawer instead — the wrong door for
this oracle. The id is read back out of the URL. Zero rows throws by name (see BLOCKED).

Two tests, both titled `ordinary authenticated user, desktop 1400`. **The titles are honest about
the viewport:** `test.use({ viewport: { width: 1400, height: 900 } })` is set, because Desktop
Chrome's default is 1280 and a title claiming 1400 against a 1280 viewport is a small lie of the
same family this phase exists to remove.

1. `Digests tab follows Signals and mounts DigestsTab — ordinary authenticated user, desktop 1400`
   — the `[role="tablist"]` region rendered by `WorkspaceTabNav` (`:67-71`, aria-label
   `Engagement workspace tabs`) contains a tab named `Digests`; **position** is asserted as
   adjacency against the rendered order (`indexOf('Digests') === indexOf('Signals') + 1`), not mere
   presence; the tab is clicked (never `page.goto`) and the URL must become
   `/engagements/{id}/digests`; then `DigestsTab`'s own content must settle.
2. `exactly one tab is selected on the digests route — ordinary authenticated user, desktop 1400`
   — after the click, `getByRole('tab', { selected: true })` must have **count 1** and be `Digests`.
   Asserted as a population: `aria-selected` comes from a per-entry `matchRoute({ fuzzy: true })`
   (`WorkspaceTabNav.tsx:75-88`), so an appended entry whose path overlaps a sibling's lights up two
   tabs, and asserting only "Digests is selected" would pass on exactly that bug.

Leak regex asserted in both tests.

### `DigestsTab.tsx` carries NO `data-testid` — measured, with a control

The plan asked for a testid and told me to record it if none existed. None exists:

```
--- ZERO claim: DigestsTab.tsx carries no data-testid ---
0
rc=1
--- instrument control: a sibling that DOES carry one ---
1
rc=0 (non-zero count proves the grep can find them)
```

So the destination is pinned by two **unconditional** rendered strings instead — the `h2`
`intelligence-digests:header` = `Digests` (`DigestsTab.tsx:58-60`) and the subscriptions
`<summary>` `intelligence-digests:subscriptions` = `Your subscriptions` (`:79-81`). Both render on
an EMPTY digest list, so the assertion proves the component mounted rather than that it had data.
Both namespaces are registered in `i18n/index.ts` (`:404`, `:540`), so a raw-key render would fail
the assertion rather than silently pass.

---

## Task 2 — `tests/e2e/97-list-create-affordances.spec.ts`

Header `// @covers NAV-03` + Pitfall 4 in its own words. The population is a **hardcoded literal of
8** with `PAGES.length !== 8` throwing at module scope, so a hand-edit that drops a page fails at
collection instead of silently narrowing the set.

Nine `test(` declarations written out **one per page rather than generated in a loop** — the
population is eight visible names in the report, and a dropped page is a missing name rather than a
smaller number nobody reads. (A loop would also collapse the gate's declaration count to 1.)

Per page: goto `/dossiers/{segment}` → **data-present precondition** → affordance located inside the
page **HEADER** (`header.page-head` — the shared landmark of both hosts, `ListPageShell.tsx:48` and
`PageHeader.tsx:19`; verified as the only two product render sites plus `DashboardHero`) → click →
URL becomes `/dossiers/{segment}/create` → the create route's own `<h1>` must be visible → leak
regex. Scoping to the header is precisely what makes an empty-state-only button fail.

Per-page row selectors differ because the renderers differ, and each matches **data rows only**
(every one of these components returns its empty state _instead of_ the row container):

| segment             | cta (accessible name)  | row selector                            | create `<h1>`               |
| ------------------- | ---------------------- | --------------------------------------- | --------------------------- |
| `countries`         | `Add country`          | `.dossier-row`                          | `New Country Dossier`       |
| `organizations`     | `Add organization`     | `.dossier-row`                          | `Create Organization`       |
| `persons`           | `Add person`           | `button[role="listitem"]`               | `Create Person`             |
| `forums`            | `Add forum`            | `[data-testid="generic-list-page-row"]` | `New Forum Dossier`         |
| `topics`            | `Add topic`            | `[data-testid="generic-list-page-row"]` | `Create Topic`              |
| `working_groups`    | `Add working group`    | `[data-testid="generic-list-page-row"]` | `New Working Group Dossier` |
| `elected-officials` | `Add Elected Official` | `table tbody tr`                        | `Create Elected Official`   |
| `engagements`       | `Log engagement`       | `[data-testid="engagement-row"]`        | `New Engagement Dossier`    |

CTA names are the shipped `empty-states:list.{entity}.cta` values for seven pages and
`elected-officials:list.add` for the eighth, so the header button and the empty-state CTA say the
same words. All eight create `<h1>`s are `form-wizard:{entity}.page_title`.

Test 9 is this file's **own positive control**: `elected-officials` must be GREEN on the undone
tree. If the whole file goes red including that test, the failure is the harness — not the seven
pages under test. Reading a total red as "seven pages missing the affordance" without this control
is the instrument-untested zero.

`engagements` is the `/dossiers/engagements` mount; the top-level `/engagements` double-mount is
intentional and is not touched or asserted here.

---

## Gate drill — BOTH DIRECTIONS OBSERVED (C1)

The gate text is byte-identical to the accepted set at `d561738fa`. No gate was edited.

Extracted verbatim into `/tmp/97-02-drill/gate{1,2}.sh` with a `#!/bin/bash` shebang (zsh does not
word-split), `bash -n` parsed, exit codes captured **directly** (`cmd; RC=$?`, never through a pipe).

```
=== bash -n parse ===
gate1 parse rc=0
gate2 parse rc=0
=== RED direction (subject files absent) ===
GATE1 RED rc=1
GATE2 RED rc=1
```

**RED was produced by moving my two files to `/tmp` and back** — not by a scratch copy. Both gates
hardcode `R=<repo root>`, so repointing them at a scratch tree would have required editing a frozen
gate. Reproducing absence in place is the same observation and the honest one: the gates' _subject
IS these two files_, so the real tree with them removed **is** the undone tree, and the real tree
with them present **is** the constructed done state. Nothing was left unconstructed; there is no
`NOT CONSTRUCTED` residue for either gate.

**Red attributed to the subject (C2), not to tooling:**

```
--- gate1 attribution: instrument control (95 spec present) ---
control rc=0 (0 = tree live, grep root real)
SUBJECT rc=1 (1 = 97-digests-tab.spec.ts absent -> this is the red)
--- gate2 attribution: controls pass, subject absent ---
route-dir control rc=0
P=9
P>=8 control rc=0
SUBJECT rc=1 (1 = absent -> this is the red)
```

```
=== GREEN direction (subject files present) ===
GATE1 GREEN rc=0
GATE2 GREEN rc=0
--- derived counts ---
spec1 D=2 T=2
spec2 D=9 T=9
```

Re-run after the final content edit (the cause-probe branch below):

```
=== FINAL gate run (GREEN direction, post-edit) ===
GATE1 rc=0
GATE2 rc=0
```

| plan.gate   | C1 red                                                       | C1 green (how the done state was constructed)              | C2–C10 notes                                                                                                                                                                                                                                                   | verdict |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 97-02.task1 | `rc=1`, subject file absent, 95-spec control `rc=0`          | files written; `rc=0`. Done state = the deliverable itself | C4: `T`=2 vs threshold 2, `D`=2 vs `T` — MAX REACHABLE, exactly reached. C5: 95-spec existence is the live-root control, no `2>/dev/null`. C6: `--list` run with `--no-deps`. C10: every count the criterion names is checked                                  | SOUND   |
| 97-02.task2 | `rc=1`, subject file absent, `P=9`/route-dir controls `rc=0` | files written; `rc=0`                                      | C4: `T`=9 vs threshold 9 exactly reached; `P`=9 vs threshold 8, one to spare. C5: `dossiers` route dir proven to exist in-chain so the 8-segment loop cannot pass vacuously. C10: all eight segments checked one at a time, so the gate names WHICH is missing | SOUND   |

**Instrument note (`\s` in BSD grep).** Both gates use `^\s*test(\|^\s*test\.fixme(`. This machine's
`command grep` is `BSD grep 2.6.0-FreeBSD (GNU compatible)`, and I instrument-tested the pattern
against a two-line fixture (one indented, one not) before trusting any count: it returned `2`, so
`\s` and `\|` both parse here. An untested zero from this pattern would have been indistinguishable
from a real one.

**Prettier check.** Both files pass `prettier --check` and `eslint` at rc=0, and the declaration/title
counts were re-derived _after_ formatting — prettier reflowed six of the nine `test(` calls onto
hugged-parameter form, which keeps `test(` and its title on the same line, so `D` and `T` stay equal.

---

## Playwright run — observed reds, with attribution

The plan excludes the run from the gates by design. It is recorded here because the plan's `<output>`
block requires the observed red with attribution.

Invoked ONLY after asserting BOTH spec files exist (Pitfall 5 — spec paths are FILTERS):

```
BOTH-FILES-EXIST rc=0 (Pitfall 5 precondition)
Total: 11 tests in 2 files
```

11 = 2 + 9, with `--no-deps` on `--list` as well as on the run (C6), so the `setup` project's tests
are excluded from the count.

Run of record (serial, `--workers=1`, `--project=chromium-en --no-deps`): **9 failed, 2 passed
(3.0m), rc=1.**

| test                                 | outcome | attribution                                                                                 |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| digests: tab follows Signals         | ✘       | **UNABLE TO MEASURE** — `DATA-PRECONDITION UNMET for engagements`                           |
| digests: exactly one tab selected    | ✘       | **UNABLE TO MEASURE** — same                                                                |
| countries                            | ✘       | **SUBJECT RED** — page rendered, rows present, `header.page-head` has no `Add country` link |
| organizations                        | ✘       | **SUBJECT RED** — same shape, `Add organization`                                            |
| persons                              | ✘       | **SUBJECT RED** — `Add person`                                                              |
| forums                               | ✘       | **SUBJECT RED** — `Add forum`                                                               |
| topics                               | ✘       | **SUBJECT RED** — `Add topic`                                                               |
| working_groups                       | ✘       | **SUBJECT RED** — `Add working group`                                                       |
| elected-officials                    | ✓       | shipped affordance clicks through                                                           |
| engagements                          | ✘       | **UNABLE TO MEASURE** — `DATA-PRECONDITION UNMET for engagements`                           |
| elected-officials (positive control) | ✓       | **the harness is proven live**                                                              |

The six subject reds are the criterion-3 absence, at the assertion of record:

```
Error: expect(locator).toBeVisible() failed
Locator: locator('header.page-head').getByRole('link', { name: 'Add country' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

The failing page's own snapshot confirms the list mounted — `heading "Countries" [level=1]` — and
the data-precondition had already passed, so the red is the missing header affordance and nothing
else. Exactly the plan's expectation: 6 of 8 red for the right reason, 1 green as the control,
1 unmeasurable.

### The FIRST run was a false red on all nine — recorded because it nearly became the evidence

The first run used the default worker count (**9 parallel workers**) and reported the same 9/2 split.
It was **not** the same result. Every one of the nine failures had the app's
`ThemeErrorBoundary` fallback on screen:

```
- heading "Theme System Error" [level=1]
- paragraph: An error occurred loading theme settings. Default theme has been applied.
- button "Reload Page"
```

```
97-digests-tab-...-21d09... :: THEME-ERROR-BOUNDARY
97-digests-tab-...-bb5c9... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-1ea16... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-33382... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-348fe... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-8addf... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-bdeb5... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-c08f5... :: THEME-ERROR-BOUNDARY
97-list-create-affordances-c3137... :: THEME-ERROR-BOUNDARY
```

That is instance 6 of the gate-standard's table — **a crash recorded _as_ the red** — and the
per-test counts were identical to the honest run, so the summary line alone could not tell them
apart. Re-running with `--workers=1` produced real pages and the attribution table above. **Every
red in this SUMMARY was read from the page snapshot, never from the pass/fail count.**

Operational cause, for whoever runs the rest of this wave: sibling wave-1 workers were driving
Playwright against the same dev server concurrently (`97-settings-nav`, `97-elected-officials-reach`
result dirs appeared mid-run), and one worker was mid-edit on
`frontend/src/lib/dossier-type-guards.ts`. Two consequences worth knowing:

- **Run 97 specs with `--workers=1` while siblings are live.** Parallel workers against one dev
  server produced the theme crash above and one 11.2-minute test stall.
- **`test-results/` is shared and clobbered.** Playwright clears the output dir at the start of every
  run, so a sibling's run deletes your error-context snapshots. Read the snapshot before the next run
  starts, or the evidence is gone.

---

## Closed-vocabulary check on the data-precondition outcomes

Three terms, per the plan's verification block: **rows present** (measurable), **`DATA-PRECONDITION
UNMET`** (explicit failure, UNABLE TO MEASURE, never a pass), and **SKIPPED** (exits 0, would read
as a pass). Neither spec calls `test.skip()` or `test.fixme()` — the declaration counters are written
`^\s*test(\|^\s*test\.fixme(` anyway so that a fixme added later reports as an _uncovered test_
rather than making the gate unsatisfiable (C2).

---

## One deviation from the plan's action text, and why

The plan's precondition message stops at "zero rows". I extended both messages to name **which of
the two causes** produced the zero — an empty list, or the shared `common:errors.queryFailed.title`
("Unable to load data") query-error state. The two route to different owners: an empty list is
seeding work, a query-error state means the read path failed and **seeding fixes nothing**.
Collapsing them is how a broken read path gets filed as a fixture gap and neither is fixed.

This weakens no criterion: the `DATA-PRECONDITION UNMET` string the gate greps is unchanged, the
declaration and title counts are unchanged, and both gates were re-run green afterwards. The branch
was then executed against the live stack rather than reasoned about:

```
Error: DATA-PRECONDITION UNMET for engagements: /engagements settled with zero rows — the list
rendered its shared query-error state ("Unable to load data"), so the READ PATH failed — NOT an
empty fixture. No engagement workspace can be opened, so the Digests tab claim is UNABLE TO
MEASURE. This is never a pass.
```

---

## 97-08's precondition obligation — and it is NOT seeding

The plan asks for the list of pages whose data-present precondition could not be met. It is one
segment, and it blocks three of the eleven tests:

| segment       | tests blocked                                            | measured cause                                                              |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `engagements` | 3 (both digests tests + the engagements affordance test) | the list renders `Unable to load data` on BOTH mounts — a READ-PATH failure |

**Do not file this as a seeding gap.** The data exists. Live catalog query against staging
`zkrcjzdemdmwhearhfgg`, 2026-08-17:

```
dossiers_type_engagement | engagement_dossiers_rows | dossiers_type_country
                       5 |                        3 |                     5
```

Five engagement dossiers and three `engagement_dossiers` rows are present, and the same stack
renders `countries` (5 rows) fine — the countries test got all the way to its affordance assertion.
The engagements list surface renders the shared P93 query-error state instead of rows:

```
- heading "Unable to load data" [level=2]
- paragraph: The request failed. Try again, and contact an administrator if it keeps failing.
```

The read path is `EngagementsListPage` → `useEngagementsInfinite` (unbucketed branch) →
`engagementsRepo.getEngagements` → `apiGet('/engagement-dossiers?…')`. The route exists and rejects
unauthenticated calls correctly, so the failure is in the authenticated call, not a missing route:

```
http://localhost:5001/api/engagement-dossiers -> 401 {"error":"Unauthorized","message":"Authentication required"}
http://localhost:5173/api/engagement-dossiers -> 401 {"error":"Unauthorized","message":"Authentication required"}
http://localhost:5001/health               -> 200 {"status":"ok",...,"environment":"development"}
```

**What I did NOT measure:** the status code and body of the _authenticated_ `/api/engagement-dossiers`
call from inside the app. Root-causing that read path is outside this plan's `files_modified` (two
spec files, no product code), so I am naming it rather than guessing at it. Until it resolves, the
NAV-03 Digests-tab half of criterion 3 is **unmeasurable on this stack** — and per the closed
vocabulary that is UNABLE TO MEASURE, not a red against 97-08's work and never a pass.

---

## Verification checklist

- [x] Both gates green, both directions observed, exit codes captured directly
- [x] No gate text edited
- [x] `prettier --check` rc=0, `eslint` rc=0
- [x] `--list` count 11 = 2 + 9, `--no-deps` on `--list` as well as the run (C6)
- [x] Spec-file existence asserted before every multi-path Playwright invocation (Pitfall 5)
- [x] Population hardcoded as 8 and asserted as 8 inside the spec
- [x] Data-present precondition is part of the oracle; the shipped empty-state CTA cannot satisfy it
- [x] Digests oracle clicks the real tab; `aria-selected` asserted as a population of 1
- [x] Leak regex asserted in all 11 tests, reused unwidened (T-97-05)
- [x] Credentials read from `process.env` only; no value echoed anywhere (T-97-04)
- [x] Zero package installs (T-97-SC)
- [x] No product code touched; no branch created; no exogenous path touched
- [x] Tree byte-identical after the drill apart from the two deliverables

## BLOCKED

Nothing blocked the deliverable. Both spec files are complete and both gates are green in both
directions.

One item is **carried forward, not blocked**: the `engagements` read path (`Unable to load data` on
both list mounts, with data present in staging) makes the two Digests-tab tests and the engagements
affordance test UNABLE TO MEASURE. That is the expected-and-labelled state for a Wave-0 observer
whose fixture precondition is unmet — the observers are on disk and correct; three of the eleven
cannot reach their subject until that read path resolves. It is recorded above as 97-08's
precondition obligation with the measurement that rules seeding out.
