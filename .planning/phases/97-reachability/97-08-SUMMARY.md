---
phase: 97-reachability
plan: 08
wave: 2
requirements: [NAV-03]
status: work-complete-gates-blocked
gates: 1/3 green (gate 2); gates 1 and 3 UNSATISFIABLE BY CONSTRUCTION — see BLOCKED
executed: 2026-08-17
work_sha: daa205461cca6f37121ef2402877360509dcc379
---

# 97-08 — NAV-03 subject (Digests tab + the shared create affordance)

All three tasks' product work is **complete and behaviourally observed**. Gate 2 is green in both
directions. **Gates 1 and 3 cannot go green honestly** — not because the work is missing, but because
each contains a threshold that is unreachable by construction. I did not edit them. Both are reported
in `## BLOCKED` with the arithmetic.

Every claim below is pinned to `daa205461`.

---

## Task 1 — the Digests tab

`WORKSPACE_TABS` gains exactly one entry, `{ key: 'digests', labelKey: 'tabs.digests', path: 'digests' }`,
positioned **after `signals`**. Nothing else in `WorkspaceTabNav.tsx` changed — the entry renders
through the existing `Link` recipe, and the bar's legacy `bg-muted/50` chrome is inherited and out of
scope.

`tabs.digests` landed in **BOTH** locale files in the **same commit**:

| locale | value      | source                                                                                                                                      |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| en     | `Digests`  | verbatim from the shipped `intelligence-digests:tab.label`                                                                                  |
| ar     | `الملخصات` | **verbatim from the shipped `ar/intelligence-digests.json` `tab.label`** — a shipped string, NOT invented Arabic and NOT a reuse-by-analogy |

The plan's action text allowed for the Arabic side having no shipped counterpart. It does have one, so
no judgement call was needed. Arabic naturalness remains an operator park; this plan claims only that
the key resolves and matches the string the same feature already ships elsewhere.

Structural state at `daa205461`:

```
$ git show daa205461:frontend/src/components/workspace/WorkspaceTabNav.tsx \
  | sed -n "/const WORKSPACE_TABS: WorkspaceTab\[\] = \[/,/^\]/p" | command grep -c "key: '"
9
$ node -e "...(en/ar workspace.json at daa205461)"
en.tabs.digests "Digests" ar.tabs.digests "الملخصات" counts 10 10
```

9 entries (8 before + exactly 1), and the two `tabs` blocks have equal key counts.

---

## Task 2 — one `actions` slot on `ListPageShell`, with its unit pin

`actions?: ReactNode` added to `ListPageShellProps`; `{actions != null && <div className="dash-hero-actions">{actions}</div>}`
rendered as the **second child** of the existing `<header className="page-head">`. Guard and wrapper
copied from `PageHeader.tsx:29` — same null check, same class, so the rendered position matches the
elected-officials model with **zero new CSS**. `toolbar` untouched.

Two new unit cases beside the shipped toolbar one: the actions node renders and lands inside
`header.page-head > .dash-hero-actions`; omitting the prop renders no wrapper at all.

---

## Task 3 — the seven call sites

Each of the seven passes an `actions` node copying the EO recipe verbatim: `<Button asChild
className="min-h-11 min-w-11 w-full sm:w-auto">` wrapping a TanStack `<Link>` with `<Plus className="h-4 w-4 me-2" />`.
No new button variant, no icon-only, no split button, no dropdown. `me-2` stays logical. The
empty-state CTAs were **not** deleted — both paths coexist and now read the same key.

### The seven CTA keys actually used, page by page

| page           | file                                                      | key                                   | en                  | ar                 |
| -------------- | --------------------------------------------------------- | ------------------------------------- | ------------------- | ------------------ |
| countries      | `routes/_protected/dossiers/countries/index.tsx`          | `empty-states:list.country.cta`       | `Add country`       | `إضافة دولة`       |
| organizations  | `routes/_protected/dossiers/organizations/index.tsx`      | `empty-states:list.organization.cta`  | `Add organization`  | `إضافة منظمة`      |
| forums         | `routes/_protected/dossiers/forums/index.tsx`             | `empty-states:list.forum.cta`         | `Add forum`         | `إضافة منتدى`      |
| working_groups | `routes/_protected/dossiers/working_groups/index.tsx`     | `empty-states:list.working_group.cta` | `Add working group` | `إضافة مجموعة عمل` |
| topics         | `routes/_protected/dossiers/topics/-TopicsListPage.tsx`   | `empty-states:list.topic.cta`         | `Add topic`         | `إضافة موضوع`      |
| persons        | `routes/_protected/dossiers/persons/-PersonsListPage.tsx` | `empty-states:list.person.cta`        | `Add person`        | `إضافة شخص`        |
| engagements    | `pages/engagements/EngagementsListPage.tsx`               | `empty-states:list.engagement.cta`    | `Log engagement`    | `تسجيل ارتباط`     |

**Zero new copy for this half** — all seven keys already shipped in both locales. Colon form
throughout, per the house rule; `empty-states` is registered in `i18n/index.ts` (`:319`, `:455`) and
`pnpm lint`'s namespace check passes it.

`elected-officials` keeps its own `elected-officials:list.add` (`Add Elected Official`). Its Title Case
divergence from the sentence-case `empty-states` family is **recorded, not fixed** — Phase 98 `COPY-*`.

### The execution-time `<ListPageShell` sweep, with its instrument control

```
$ command grep -rln '<ListPageShell' frontend/src --include='*.tsx'
frontend/src/components/list-page/__tests__/ListPageShell.test.tsx     <-- THE CONTROL, hit
frontend/src/pages/engagements/EngagementsListPage.tsx
frontend/src/routes/_protected/dossiers/forums/index.tsx
frontend/src/routes/_protected/dossiers/organizations/index.tsx
frontend/src/routes/_protected/dossiers/working_groups/index.tsx
frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx
frontend/src/routes/_protected/dossiers/countries/index.tsx
frontend/src/routes/_protected/dossiers/topics/-TopicsListPage.tsx

TOTAL=8   WITH(actions=)=7   threshold TOTAL-1=7
```

The test file **is** among the eight (PATTERNS §C-1's control): a sweep returning 7 would have
silently dropped a site.

---

## GATE DRILL — BOTH DIRECTIONS, OBSERVED (C1)

Gate text is byte-identical to the on-disk plan (which carries the `RULING-P97-09/-10` ruled edits at
`f0a1189a8`). **No gate was edited.** Extracted programmatically from the plan's `<automated>` blocks
into `/tmp/p97-08-drill/gate{1,2,3}.sh` with a `#!/bin/bash` shebang (zsh does not word-split), and
exit codes captured **directly** (`cmd; RC=$?`), never through a pipe.

```
=== bash -n parse ===
gate1 parse rc=0
gate2 parse rc=0
gate3 parse rc=0

=== RED direction (undone tree, before any edit) ===
GATE1 RED rc=1
GATE2 RED rc=1
GATE3 RED rc=1
```

### RED attributed to the subject (C2), with controls proving the instruments were live

```
gate1 subject:  N=8 (threshold 9)                     <-- the red
gate1 subject:  en.tabs.digests = undefined           <-- the red
gate1 control:  digests ROUTE file exists     rc=0
gate1 control:  97-digests-tab.spec.ts exists rc=0

gate2 subject:  'actions?: ReactNode' in ListPageShell.tsx  count=0, rc=1   <-- the red
gate2 control:  'dash-hero-actions' in PageHeader.tsx       count=1, rc=0   <-- analog live

gate3 subject:  WITH=0 (threshold TOTAL-1=7)          <-- the red
gate3 control:  TOTAL=8 with the test file present
```

Not one red came from a missing root, a missing script, or a missing credential.

### GREEN direction

```
GATE2 GREEN rc=0
 Test Files  1 passed (1)
      Tests  8 passed (8)          <-- 6 shipped + 2 new

GATE2 POST-COMMIT (after lint-staged reformatted the test file) rc=0
      Tests  8 passed (8)
```

`pnpm typecheck` — **rc=0**, `Tasks: 6 successful, 6 total`.
`pnpm --filter intake-frontend lint` — **rc=0**, including
`i18n namespace check OK: 1720 file(s) scanned, 801 static namespace literal(s) checked against 128
registered namespaces` and `bootstrap parity check OK`.

**GATES 1 AND 3 HAVE NO GREEN DIRECTION.** Their structural halves are all satisfied
(`N=9`, both locales, `TOTAL=8`, `WITH=7`, both spec files present, typecheck green) and their
Playwright halves were RUN — but each gate's final assertion is arithmetically unreachable. Final
observed runs, post-work:

```
GATE1 FINAL rc=1
GATE3 FINAL rc=1
```

Per C1's own rule, that makes them `CANNOT CONSTRUCT`, never `SOUND`. Detail in `## BLOCKED`.

| plan.gate   | C1 red                                          | C1 green                                        | verdict                                   |
| ----------- | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| 97-08.task1 | `rc=1`, `N=8`, key absent; both controls `rc=0` | **NOT REACHABLE** — `PASSED==EXP` needs 4 of 2  | `CANNOT CONSTRUCT` (unsatisfiable oracle) |
| 97-08.task2 | `rc=1`, prop absent; analog control `rc=0`      | `rc=0`, 8/8 vitest, re-verified after prettier  | `SOUND`                                   |
| 97-08.task3 | `rc=1`, `WITH=0`; `TOTAL=8` control             | **NOT REACHABLE** — `PASSED==EXP` needs 11 of 9 | `CANNOT CONSTRUCT` (unsatisfiable oracle) |

---

## The behavioural oracle — RUN FOR REAL, against the live stack

The plan labelled both Playwright halves `NOT CONSTRUCTED: requires the running dev stack`. The stack
is live, so they were **constructed and observed**. Two serial runs (`--workers=1`, per 97-02's
parallel-worker theme-crash lesson), `--project=chromium-en --no-deps`, **both spec files asserted to
exist first** (`BOTH-FILES-EXIST rc=0`) because Playwright paths are FILTERS.

**Every verdict below is a COUNTED per-test status read from the JSON reporter and cross-read against
each failure's own error message — never an exit code, and never the summary line.**

### Run 1 — both specs (11 tests): PASSED=6

### Run 2 — the affordances spec (9 tests): PASSED=8

Union, with the cause of every non-pass classified from its thrown message:

| page / test                   | run 1 | run 2 | ROLE + VIEWPORT proved                    | verdict                                       |
| ----------------------------- | ----- | ----- | ----------------------------------------- | --------------------------------------------- |
| countries                     | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN, rows present**                       |
| organizations                 | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN, rows present**                       |
| persons                       | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN, rows present**                       |
| forums                        | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN, rows present**                       |
| topics                        | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN, rows present**                       |
| working_groups                | FAIL  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN in run 2**; run-1 fail was a flake    |
| elected-officials (subject)   | PASS  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN** (shipped affordance)                |
| elected-officials (CONTROL)   | FAIL  | PASS  | ordinary authenticated user, desktop 1400 | **GREEN in run 2** — see below                |
| engagements                   | FAIL  | FAIL  | ordinary authenticated user, desktop 1400 | **UNABLE TO MEASURE**, both runs, read path   |
| digests: tab follows Signals  | FAIL  | n/a   | ordinary authenticated user, desktop 1400 | **UNABLE TO MEASURE** — engagements read path |
| digests: exactly one selected | FAIL  | n/a   | ordinary authenticated user, desktop 1400 | **UNABLE TO MEASURE** — engagements read path |

**ZERO SUBJECT REDS.** Not one failure was `expect(locator).toBeVisible()` on a missing affordance.
Every single non-pass threw `DATA-PRECONDITION UNMET` from the oracle's own precondition helper — the
closed-vocabulary UNABLE TO MEASURE outcome, which is never a pass and is not this work's red either.

### The control fired, and reading it correctly changed the result

In run 1 the file's **own positive control** (`elected-officials is the shipped control`) FAILED while
its byte-identical twin (`elected-officials create affordance`) PASSED **in the same run**. Two runs of
the same code path, opposite outcomes: that is instability in the stack, not a subject fact. 97-02's
law — _read the message, never the count_ — is what caught it. Had I stopped at run 1's
`PASSED=6 OTHER=5`, I would have reported `working_groups` and `elected-officials` as broken. Run 2
returned both GREEN. **The count was wrong about two of eight pages and the control is the only reason
that is visible.**

### `working_groups` and `engagements`: the spec's own diagnosis is WRONG, and it matters

Both threw `the list settled EMPTY with no error state — this one is a seeding gap`. **It is not a
seeding gap.** Live catalog query against staging `zkrcjzdemdmwhearhfgg`, 2026-08-17:

```
country 5 | engagement 5 | forum 5 | organization 5 | person 20 | topic 2 | working_group 6
```

Six working-group dossiers and five engagement dossiers exist. A list that renders zero rows over
present data with **no error state** is an empty-200 read path (the RLS-denial-reads-as-empty-200
shape), not a missing fixture. `working_groups` then passed in run 2 over that same data, which
confirms the rows are reachable and the run-1 zero was transient.

The spec's `unmetCause()` helper distinguishes only two causes (query-error state vs "seeding gap") and
attributes every silent zero to seeding. **A third cause exists — data present, read returns empty
200 — and it currently mis-files as a seeding gap.** Recorded here for 97-09; the spec is 97-02's file
and is not mine to edit.

### `engagements` — the criterion's one genuinely unmeasurable page

| segment       | tests blocked                                                  | measured cause                                                                             |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `engagements` | 3 of 11 (both digests tests + the engagements affordance test) | read path fails: `/engagements` renders the shared query-error state "Unable to load data" |

Both mounts fail, with **different symptoms in the same session**: the top-level `/engagements` mount
threw `READ-PATH-FAILED (query-error state)`, while `/dossiers/engagements` threw the silent-empty
variant in run 1 and the query-error variant in run 2. Data exists (5 engagement dossiers). This
reproduces 97-02's finding four commits later and is **unchanged by this plan's work**. The read path
is `EngagementsListPage` → `useEngagementsInfinite` → `engagementsRepo.getEngagements` →
`apiGet('/engagement-dossiers?…')`, which resolves to the **Supabase Edge Function**
`supabase/functions/engagement-dossiers` (`api-client.ts:80`, default `baseUrl: 'edge'`) — **not** the
local Express backend. 97-02's `curl localhost:5001/api/engagement-dossiers → 401` was probing the
wrong tier; noting it so 97-09 does not re-derive from that number. Root-causing the edge call is
outside this plan's `files_modified` (no backend or repository file is in it), so it is named, not
guessed at.

### The Digests tab IS proven to work — by a supplementary observation, labelled as such

97-02's digests oracle can say **nothing** about the tab entry, because it never reaches the tab bar:
it dies at the `/engagements` list. So the discriminating question — _is the tab entry itself
correct?_ — was measured separately (`/tmp/p97-08-drill/tab-probe.mjs`, rc=0):

```
AUTH: signed in as ordinary user — ok
TABS RENDERED (9): ["Overview","Context","Positions","Signals","Digests","Tasks","Calendar","Docs","Audit"]
POSITION: indexOf(Digests)=4 indexOf(Signals)=3 -> adjacency OK
URL AFTER CLICK: /engagements/b0000002-0000-0000-0000-000000000001/digests
DESTINATION: DigestsTab h2 "Digests" visible — the component mounted
DESTINATION: "Your subscriptions" visible — second unconditional pin
SELECTION INVARIANT: exactly-one-selected count=1 text=["Digests"]
AR TABS: ["نظرة عامة","السياق","المواقف","الإشارات","الملخصات","المهام","التقويم","المستندات","السجل"]
AR KEY RESOLVES: YES (الملخصات rendered, not the raw key)
PROBE rc=0
```

**ROLE:** ordinary authenticated user (`TEST_USER_EMAIL`; no credential value echoed anywhere).
**VIEWPORT:** desktop 1400×900. The tab was **CLICKED**, never `page.goto`'d.

**This is NOT the criterion-3 oracle and must not be recorded as one.** It opens the workspace by URL
with a real engagement id instead of clicking a list row, which is exactly the step D-10 says a
reachability claim may not skip. What it does establish, and all it establishes: the entry renders in
the right position, the click reaches `DigestsTab`, the component mounts, the fuzzy-`matchRoute`
selection invariant holds at 1 (the specific way appending an entry goes wrong), and the one new key
resolves in **both** locales rather than leaking a raw key. The remaining gap between this and the
oracle is one broken list read path, owned above.

---

## Condition-8 duty — create destinations

All eight `/dossiers/{segment}/create` routes exist on disk, and the six pages that reached their
affordance clicked through to a create route that **mounted and rendered its own `<h1>`** (the oracle
asserts that, so those six are verified, not assumed): countries, organizations, persons, forums,
topics, elected-officials — plus working_groups in run 2. **Seven of eight create destinations
verified rendering by click-through.**

`/dossiers/engagements/create` is the one **NOT** verified this plan: its list never produced rows, so
the affordance was never clicked. Its route file exists. **Submit-path state is NOT verified for any
of the eight** — the oracle asserts mount, not submit. Named for 97-09's record; no create flow is
claimed working beyond render.

---

## Verification checklist

- [x] `pnpm typecheck` rc=0 from the root
- [x] `pnpm --filter intake-frontend lint` rc=0 (i18n namespace + bootstrap parity + duplicate-rtl + date-formatting)
- [x] Gate 2 green in both directions, re-verified after lint-staged's prettier pass
- [x] Gates 1 and 3 RED observed on the undone tree, attributed to their subjects, controls live
- [x] **No gate text edited**
- [x] Both spec files asserted to exist before every multi-path Playwright invocation (Pitfall 5)
- [x] Per-test verdicts COUNTED from the JSON reporter; every non-pass classified from its own message
- [x] Neither spec calls `test.skip()` / `test.fixme()` — verified by 97-02 and unchanged
- [x] New label in BOTH locales in the SAME commit; colon-form keys at every new call site
- [x] EO recipe copied verbatim; no new button variant; `me-2` logical; no new CSS
- [x] Zero package installs; no branch created; no PR; no exogenous path touched
- [x] Committed with explicit pathspec; index cleaned of the lint-staged stale pre-prettier entry
- [x] `git diff HEAD -- ListPageShell.test.tsx` is empty and `git show HEAD:<file>` carries both new tests

---

## BLOCKED

### 1. Gate 1 and Gate 3 are UNSATISFIABLE BY CONSTRUCTION — a ruling is required

Both gates derive their Playwright threshold as:

```sh
EXP=$(command grep -c "^\s*test[.(]" "$SPEC")
...
test "$PASSED" -eq "$EXP"
```

`test[.(]` matches `test.` **or** `test(`, so it counts `test.describe(` and `test.use({` as test
declarations. Measured:

```
$ command grep -n "^\s*test[.(]" tests/e2e/97-digests-tab.spec.ts
122:test.describe('NAV-03 the engagement Digests tab is in the tab bar and reaches DigestsTab', () => {
125:  test.use({ viewport: { width: 1400, height: 900 } })
127:  test('Digests tab follows Signals and mounts DigestsTab — ...
166:  test('exactly one tab is selected on the digests route — ...

gate1  EXP(as the gate computes it)=4   real test declarations=2   -> demands PASSED==4, ceiling is 2
gate3  EXP(as the gate computes it)=11  real test declarations=9   -> demands PASSED==11, ceiling is 9
```

`PASSED` is counted from `result.status === "passed"`, which only real tests produce. **A suite of 2
tests can never report 4 passes; a suite of 9 can never report 11.** `test "$PASSED" -eq "$EXP"` is
false for every possible state of the product, including a perfect one. This is GATE-STANDARD **C4**,
clause two: _"the author must additionally show max achievable ≥ threshold — a derivation that is
correct but unreachable is still an unsatisfiable oracle."_

**The gates contradict their own plans' stated derivation.** Task 1's `<acceptance_criteria>` says
`EXP` = **2** declarations against a floor of 2; Task 3's says `EXP` = **9** declarations against a
floor of 9. The prose describes the declaration count; the command computes something else. The
intended instrument is the one 97-02's own gates used and instrument-tested —
`command grep -c "^\s*test(\|^\s*test\.fixme("` — which returns exactly **2** and **9** on these two
files. I did not apply it: gate text is frozen and rewriting a gate to make it pass is the single
worst failure available here.

**Cross-gate literal sweep (C9), as GATESTD-04's addendum requires.** The literal `test[.(]` appears in
four plans. `97-01` and `97-07` use the variant `^\s*test[.(].*@mobile`, whose `.*@mobile` tail
excludes `test.describe(`/`test.use({` in the real spec — verified, not assumed:

```
$ command grep -c "^\s*test[.(].*@mobile"  tests/e2e/97-settings-nav.spec.ts   -> 8
$ command grep -c "^\s*test(.*@mobile"     tests/e2e/97-settings-nav.spec.ts   -> 8
```

Equal, so those two gates are **not** affected today (they would become affected if a `describe`
title ever carried `@mobile`). **The defect is confined to 97-08's gates 1 and 3.**

### 2. Even with a corrected `EXP`, gate 1 cannot reach green today, and gate 3 reaches 8 of 9

This is a second, **independent** blocker and it does not belong to this plan's work:

- **gate 1**, with the correct `EXP=2`: max `PASSED` is **0**. Both digests tests die in
  `openFirstEngagementWorkspace` because `/engagements` renders `Unable to load data`. UNABLE TO
  MEASURE, both runs.
- **gate 3**, with the correct `EXP=9`: max `PASSED` is **8**. Eight of nine were observed green in
  run 2; the ninth is `engagements`, blocked on the same read path.

So criterion 3's create-affordance half is **behaviourally proven on 7 of the 8 pages** (and its
positive control), and its Digests half is proven at the tab-entry level by the supplementary probe
but **unmeasurable by its oracle**. The single blocker for the residue is the engagements read path —
already filed by 97-02, unchanged, and outside this plan's `files_modified`.

### What I did NOT do, stated plainly

I did not weaken a criterion, edit a gate, re-point an oracle, seed data to make a precondition pass,
or report either gate as green. Gates 1 and 3 exited **rc=1** and are recorded as `CANNOT CONSTRUCT`.
