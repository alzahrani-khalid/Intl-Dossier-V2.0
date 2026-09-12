# 99-PLAN-CHECK-B — independent plan-set check (seat `p99-checker-b`)

**VERDICT: BLOCKERS 8 / OBSERVATIONS 9**

Repo `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`, branch `milestone/v10.0-trust`,
HEAD `9ffa2b80cc82fb3fe29e11354818d13f537e67b9` (re-derived, not quoted). Scratch scripts live in
`/tmp/p99-checker-b/` (`graph.json`, `oracles.json`, `orc_0..19.sh`, `multi.mjs`, `cov.mjs`,
`blast.mjs`, `prove.mjs`, `flat.mjs`, `own.mjs`, `orc5.mjs`, `diffsize.mjs`, `p8size.mjs`,
`testfiles.mjs`). **No repo file was changed.** No subagents were used.

I read `99-PLAN-INDEX.md` last and treated every number in it as a claim. Where I re-ran a claim I
say so; where I could not, it is in **WHAT I COULD NOT VERIFY**.

Two instrument notes that shaped everything below:

- Under `bash -lc` with the oracles' own `PATH="/opt/homebrew/bin:$PATH"`, `grep` resolves to
  `/usr/bin/grep` (BSD grep) — **not** the `.gitignore`-honouring ugrep wrapper. So the oracles are
  gitignore-blind in the good direction. My own re-derivations ran the same way.
- **Two of my own probes returned false answers and controls caught both.** An ERE character class
  written `[\x27\"]` is not expanded by BSD grep, so a search for `t('common.error')` returned 0 —
  and so did its positive control, which is how I knew. Separately, a loose test-file probe made
  the index's "0 two-arg sites in test files" look false; re-run with the audit's exact regex it is
  **true**, and I have not reported it as a defect. Every zero below is paired with a control.

---

### [BLOCKER] B-01 — the `common.json` flatten is not collision-free: `error` and `search` are SCALARS in the nested subtree and OBJECTS at the root, so D-12's "0 overwrites" is false and the ruled merge is unexecutable as written

WHERE: `99-02-PLAN.md` — `<interfaces>` "Merge collision check re-derived clean: nested `error` and
`search` share names with top-level subtrees but child key sets are disjoint — 67 leaves move, 0
overwrites"; Task 1 step 3 "deep-merge into the existing error/search subtrees where names collide
at subtree level — child sets are disjoint". Upstream: `99-CONTEXT.md` **D-12**, same claim.

EVIDENCE:

```
$ node -e 'for (const loc of ["en","ar"]) { const j=require(".../frontend/src/i18n/"+loc+"/common.json");
    for (const k of ["error","search"]) console.log(loc,k,"nested="+typeof j.common[k],"root="+typeof j[k]) }'
en error nested=string root=object      # root: {failedToLoadData, unknownError}
en search nested=string root=object     # root: 12 leaves (title, description, placeholder,
ar error nested=string root=object      #   searchPlaceholder, noResults.*, searching, …)
ar search nested=string root=object
```

`common.common.error` is `"Error"` / `"خطأ"`. `common.common.search` is `"Search"` / `"بحث"`.
**A string has no "child key set", so the disjointness derivation was run against a premise that
does not hold** — in both locales.

Simulated with real i18next against the actual bundles, using the naive merge the plan describes
(`/tmp/p99-checker-b/prove.mjs`):

```
== en (POST-FLATTEN, naive merge)          == ar (POST-FLATTEN, naive merge)
   common:error.failedToLoadData  "error.failedToLoadData"      "error.failedToLoadData"
   common:search.placeholder      "search.placeholder"          "search.placeholder"
```

The destroyed root `search` subtree is live at ≥17 sites in ≥10 files — `EngagementsList.tsx:107`,
`EnhancedSearchInput.tsx:396`, `AdvancedSearchFilters.tsx:140`, `Header.tsx:45`,
`TagSelector.tsx:267,279`, `PositionList.tsx:165`, `SearchEmptyState.tsx:115-153` (7),
`EngagementsListPage.tsx:261`, `WorkItemFiltersBar.tsx:112`, `DossierSearchPage.tsx:215`. The
nested scalars are live too — `t('common.search')` at `ToolbarSearch.tsx:44,47`,
`DataTable.tsx:227`, `ExecutionsTabs.tsx:103`, `DocumentTree.tsx:230`, `MousPage.tsx:289`,
`EventsPage.tsx:366`, `__root.tsx:43`; `t('common.error')` at `DataLibraryPage.tsx:299`,
`MousPage.tsx:323`, `after-action.tsx:78`, `$afterActionId.tsx:66`, `versions.tsx:35`.

WHY: There is no merge that leaves `common.search` both a string and a 12-leaf object. Whichever
way the worker resolves it, working copy breaks in BOTH locales — silently, because P99-02's own
oracle spot-checks only `all`, `cancel`, `loading`, `notFound` (acceptance[6]). The two keys where
the merge is actually undecidable are the two the oracle does not probe.

REMEDY: Rule the two collisions before P99-02 ships. Smallest correct form: rename the two nested
scalars on the way in (`common.common.error` → root `errorLabel`, `common.common.search` → root
`searchLabel`), rewrite their ~14 consumer sites in the same commit, and extend P99-02's oracle
spot list to `common:errorLabel`, `common:searchLabel`, `common:error.failedToLoadData`,
`common:search.placeholder` — all four, both locales. Correct D-12's "0 overwrites" sentence: it is
a derivation and it is wrong.

---

### [BLOCKER] B-02 — the flatten's blast radius is 199 sites / 97 files, not 120 / 46: the `t('common:common.X')` class ALSO resolves through the nested subtree today, and 32 of its files are owned by NO plan in the phase

WHERE: `99-02-PLAN.md` `<interfaces>` "The atomic rewrite set at plan time: **120 sites / 45
distinct keys / 46 files** — dot-form `t('common.X')`" and `files_modified` (46 sources).
Upstream: **D-13**. The mis-classification is recorded in `99-PLAN-INDEX.md` §3: _"Colon-form
`common:_`misses: 72/52; 33 fixed by flatten alone …, **39 need rewrite+authoring** (every
double-prefixed row; **the nested subtree carries NO`actions._` keys — all author\*\*)"_.

EVIDENCE (`/tmp/p99-checker-b/blast.mjs`; resolution checked against the real nested subtree):

```
RESOLVE-THROUGH-NESTED today:
  dot-form  t('common.X') in common/translation-bound files : 120 sites / 46 files   <- the plan's set, reproduced exactly
  colon-dbl t('common:common.X')                            :  79 sites / 52 files   <- absent from the plan
  UNION files: 97      files NOT in P99-02 files_modified: 51   (32 owned by NO task at all)
```

The index's load-bearing sentence is false:

```
$ node -e 'const en=require(".../en/common.json"); console.log(Object.keys(en.common.actions))'
[ previous, next, expand, collapse, openMenu, closeDialog, toggleSection, viewMore, remove ]   # 9 keys, ar identical
$ grep -rho "common:common\.actions\.[A-Za-z_]*" frontend/src | sort | uniq -c | sort -rn
  18 …actions.remove   7 …actions.openMenu   3 …actions.toggleSection   1 …actions.previous   1 …actions.next   (+13 keys that do miss)
```

So ~30 `common:common.actions.*` sites **resolve today**; they are not "all author", they are
"rewrite in the flatten commit or they break". Proven end-to-end, both locales:

```
== en PRE-FLATTEN  common:common.error "Error"    == ar PRE-FLATTEN  "خطأ"
== en POST-FLATTEN common:common.error "common.error"   == ar POST-FLATTEN "common.error"   <- raw key, both locales
```

A sample of the 32 unowned files: `report-builder/*.tsx` (10), `contacts/*.tsx` (4),
`delegation/*.tsx` (3), `workflow-automation/{ConditionBuilder,WorkflowExecutionsList,WorkflowRuleCard}.tsx`,
`calendar/ConflictResolution/*.tsx` (2), `notifications/*.tsx` (2), `pages/WorkingGroupsPage.tsx`,
`pages/entity-comparison/EntityComparisonPage.tsx`, `position-editor/PositionEditor.tsx`,
`tags/TagAnalytics.tsx`, `sla-monitoring/SLAAtRiskList.tsx`, …

WHY: This is exactly the failure D-13/D-14 exist to prevent, one population axis over. The moment
P99-02 commits, 79 sites in 52 files stop resolving in both locales. P99-06 is nominated to
de-prefix the class but owns 17 of the 59 files it appears in (B-03), and 32 files have no owner
anywhere in the phase. Those sites stay broken for the rest of Phase 99 and surface — ownerless —
only at P99-09's unscoped gatekeeper.

REMEDY: Fold the `t('common:common.X')` rewrite into P99-02's atomic commit (identical one-line
mechanical edit, and D-13's own reason says it must be the same commit), widen P99-02's
`files_modified` to the 97-file union, and re-derive the class with a _resolution_ predicate rather
than a _miss_ predicate — `common:common.X` where X exists in the nested subtree is a working site,
not a miss.

---

### [BLOCKER] B-03 — P99-06's `common:common.` oracle is repo-wide but P99-06 owns 17 of the 59 files it must clean; the task cannot go green inside its own write scope

WHERE: `99-06-PLAN.md` — `must_haves.truths` command oracle clause
`! command grep -rn "common:common\." "$R/frontend/src" --include="*.ts" --include="*.tsx"`; its
`text:` "…14+ double-prefixed sites…"; `files_modified` (88 entries).

EVIDENCE:

```
$ command grep -rn "common:common\." frontend/src --include="*.ts" --include="*.tsx" | wc -l
100                                    # sites — the oracle text says "14+"
$ ... command grep -rl ... | wc -l
59                                     # files
$ graph.json cross-reference:  NOT in P99-06 files_modified: 42   of which owners=NONE: 34
```

WHY: The `scope` gate enforces `files[]` as the write boundary, so P99-06 must edit 42 files it may
not write to in order to satisfy its own acceptance oracle — a plan defect, not a worker failure
(brief §H). The stated red ("14+") is off by ~7× from the measured 100, so this figure was not
re-derived at plan time despite D-04.

REMEDY: Either widen P99-06's `files_modified` to the 59 files and re-derive the count, or move the
whole double-prefix rewrite into P99-02 per B-02 and delete this clause from P99-06. The second is
the smaller change and the one D-13 wants.

---

### [BLOCKER] B-04 — P99-09's AR-04a acceptance grep is unsatisfiable AND under-detecting: the un-word-bounded, line-oriented regex counts 23 non-`t()` artefacts in 15 out-of-scope files, and is blind to 111 real multi-line mask sites

WHERE: `99-09-PLAN.md` — `must_haves.truths` command oracle clause
`test "$(command grep -rhoE "t\(\s*'[^']+'\s*,\s*'[^']*'" "$R/frontend/src" … | wc -l …)" -eq 0`.

EVIDENCE:

```
unbounded  t\(       : 1680 matches / 176 files      <- what the oracle counts
word-bounded \bt\(   : 1657 matches / 161 files      <- one-line grep, correct token
audit model (\bt\( , cross-line; scripts/i18n-mask-audit.mjs's own regex) : 1768 sites / 161 files
1768 − 1657 = 111 sites spanning a newline, in 41 files      (/tmp/p99-checker-b/multi.mjs)
```

The 23-match excess is not `t()` at all:

```
components/tweaks/persistence.test.tsx:80        storage.set('id.locale', 'fr')
routes/_protected/dossiers/countries/index.tsx:50 dossierFacetCount('country', 'status', …)
lib/__tests__/format-date.test.ts:19             formatDayFirst('2026-04-28T12:00:00', 'ar')
hooks/useNotificationCenter.ts:224               params.set('unreadOnly', 'true')
services/dossier-api.ts:685                      .not('status', 'eq', …)
```

`REQUIREMENTS.md` AR-04a **already records this exact artefact** — _"that +26 was a regex artefact —
`t\(` without a word boundary also matches the tail of any identifier ending in `t`, e.g.
`formatDayFirst('2026-04-28T12:00:00')` in `lib/__tests__/format-date.test.ts`"_ — and the
correction was not carried into the oracle. That the planner _did_ use the right regex for scoping
is provable: the word-bounded cross-line population is **exactly** P99-09's 161 files
(`/tmp/p99-checker-b/cov.mjs` → `NOT in P99-09 files_modified: 0`).

WHY: Two independent failures in one clause.
(1) _Unsatisfiable_ — 23 matches live in 15 files P99-09 may not write to and that no correct fix
would touch, so the count can never reach 0 and the phase's terminal repair task can never pass
acceptance.
(2) _Under-detecting_ — were the artefacts removed, the clause would read 0 while **111 genuine
multi-line `t('key',\n  'Default')` masks survive** in 41 in-scope files: a green that does not mean
the mask class is closed. The same oracle's `defaultValue` clause carries the mirror inconsistency —
it excludes `.test.`/`__tests__` while clause 1 does not, and `t\([^)]*defaultValue` is line-bound
too.

REMEDY: Assert through the committed instrument, which already has the right regex and walk —
`node scripts/i18n-mask-audit.mjs` → `total_two_arg_sites == 0` (or the strict variant's
`twoArgTotal`, which 99-01 is already specified to emit). If the literal requirement grep is wanted,
use `\bt\(` with a cross-line matcher and state one test-file policy for both clauses.

---

### [BLOCKER] B-05 — P99-08 and P99-09 exceed the engine's `gates.diffCap` (60 000 logic bytes) and will park to human un-retryably; the plan set never makes that call

WHERE: engine `gates/review.js:133 checkTaskDiffCaps` / `config/config.js:14
DEFAULT_DIFF_CAP = 60_000`; repo `.tickmarkr/config.yaml` `gates:` overrides `build`/`test`/`lint`
only — **no `diffCap` override**. Plans: `99-09-PLAN.md` (161 sources), `99-08-PLAN.md` (133
`ar/*.json`).

EVIDENCE:

```
$ node /tmp/p99-checker-b/diffsize.mjs
P99-09 minimum touched lines: 1982 in 161 files
minimum -U0 logic diff bytes: 273070            # cap 60000 -> 4.5x over, and this is a FLOOR
$ node /tmp/p99-checker-b/p8size.mjs
ruled-term ar lines (ارتباط 171 / موجز 124 / إحاطة 65 / منصب 53): 397 lines, 31631 bytes
  -> min -U0 logic diff 64056                   # cap 60000 -> over before a single ملف decision
  additional ملف-bearing lines: 515 (41432 bytes) -> up to +83894 more
```

Read from the installed 1.93.0: `reviewableLogicDiff` (`gates/artifact-manifest.js:190`) collapses
only _whole deleted files_; the "capture" class is tickmarkr's own hardcoded cockpit-frame manifest,
so every changed `.tsx` and i18n `.json` line counts as **logic**. On a trip, `checkDiffCap` returns
`meta: { park: "human" }` with the comment _"the diff cannot shrink by retrying"_, and it fires on
BOTH `acceptance` and `review`.

WHY: The phase's two largest tasks cannot complete. D-39's sizing rule collides with a hard engine
limit that appears nowhere in the plan set, and it surfaces late — after the work is done — as a
human park with no forward path but a config change or a re-plan.

REMEDY: Make the call in writing before the run — either raise `gates.diffCap` in
`.tickmarkr/config.yaml` with the reason recorded (defensible: these diffs are mechanical and wide,
and the acceptance judge reads the diff), or split P99-08 and P99-09 along a stated axis and accept
the extra gate batteries D-39 warns about. Silence is the only option that certainly fails.

---

### [BLOCKER] B-06 — criteria 2 and 3 have NO executing oracle: not one compiled `command:` truth runs Playwright, and the `test` gate runs `turbo run test`, which never invokes it

WHERE: compiled graph; `.tickmarkr/config.yaml` `gates.test: … npm run -s test -- --continue`; root
`package.json` `"test": "turbo run test"` vs the separate `"test:e2e"` / `"test:e2e:ci"`.

EVIDENCE:

```
$ grep -c playwright /tmp/p99-checker-b/graph.json
0
```

The only Playwright invocations in the plan set are inside `<verify>` blocks (`99-01` Task 1,
`99-07`), and per `P99-COMPILE-CONTRACT.md` §3 `acceptance = <done> lines + must_haves.truths` —
**`<verify>` is not compiled and the engine never runs it.** So `99-ar02-dates.spec.ts` and
`99-ar03-leak.spec.ts` are authored, committed, cited in prose, and never executed by any gate.
What actually executes for criterion 2 is `99-07`'s source-literal grep plus
`check-date-formatting.mjs` (already green at HEAD); for criterion 3, absence-greps for
`"Read Only"`, `"Last used:"`, `'Saudi Arabia'`, `errors.pageNotFound`.

`99-PLAN-INDEX.md` §3 states the design intent — _"gate `command:` oracles stay STATIC by design (a
gate red from a dev-stack hiccup would be a false red), with rendered proof carried by 99-01's
recorded REDs, per-plan `<verify>` runs, and 99-10's fresh consolidated battery"_ — but 99-10's
battery is `nav-title-agreement` + `i18n-audit-strict` + `partA_maskfinder` + `resolve-check` +
`check-date-formatting`. **No Playwright.** So the fallback named for the rendered proof does not
contain it either.

WHY: **D-07** — "Every criterion closes on a RENDERED surface or a drilled instrument — never on a
source-text grep alone." As compiled, criteria 2 and 3 close on source-text greps alone. Every
UI99-C row only a render can see is unverified by the run: C2's zero Arabic-Indic codepoints
(D-31's regression guard), C5's Arabic 404 body, C6's capture floor 34, C7's banner, C8's chips,
C9's Latin-run scan, C10's Tajawal, C11's settle law. D-33's whole settle apparatus is built and
never exercised. Avoiding a flaky red is a real concern; answering it by removing the only rendered
evidence from the graph is not the trade the decisions permit.

REMEDY: Add one `command:` oracle per rendered criterion in `99-10-PLAN.md`, with inline
interpreter resolution and one spec path per invocation (D-09):
`test -f "$R/tests/e2e/99-ar02-dates.spec.ts" && cd "$R" && pnpm exec playwright test
tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps`, likewise for `99-ar03-leak`. If a
dev-stack hiccup is the fear, gate on `E2E_BASE_URL` and record a NOT-CONSTRUCTED leg — that is a
bound, which D-05 accepts. Silence is not.

---

### [BLOCKER] B-07 — `scripts/resolve-check.mjs` cannot see the flatten, so D-13's "harness before AND after" is unfalsifiable for the change it guards

WHERE: **D-13** ("Its `command:` oracle runs the COMMITTED resolution harness
`scripts/resolve-check.mjs` **before AND after** in the same gate"); `99-02-PLAN.md` acceptance[5]
and its oracle clause `node "$R/scripts/resolve-check.mjs" "$R" | command grep -q "routings with a
miss: 0"`.

EVIDENCE — the harness's entire population, read at `scripts/resolve-check.mjs:102-115`:

```
11 ROUTINGS: intelligence-signals(sourceType.*) | assignments(priority.*) | dossier-overview(sourceStatus.*)
             translation(waitingQueue.entityStatus.*) | translation(engagements:types.*)
             graph(relationship.*) x2 | intelligence-alerts(dossier:type.*) | engagements(filter.*|statuses.*|week.of)
```

The only two `translation`-bound routings resolve `waitingQueue.entityStatus.*` — and:

```
$ node -e 'const en=require(".../en/common.json");
   console.log("waitingQueue at root?",en.waitingQueue!==undefined,"inside nested?",en.common.waitingQueue!==undefined)'
waitingQueue at root? true  inside nested? false
```

— while the other carries an explicit `engagements:` prefix. **Zero of the 214 lookups resolve
through the nested `common.common.*` subtree.** The harness prints `routings with a miss: 0` today
and would print it after a completely botched flatten. `scripts/neg-taskcard.mjs` is the same: its
three probes (`priority.*`, `status.*`, `work_item.*` through ns `translation`) are absent from both
the root and the nested subtree, so `MISS=true ×3` holds before and after regardless.

WHY: D-13 names this harness as the thing that makes the flatten falsifiable. It is not. Both the
"before" and the "after" run are keep-true with respect to the flatten, and the only oracle clause
in P99-02 that touches the flatten is a four-key spot check that omits the two colliding keys
(B-01). The phase's single most destructive commit ships with no discriminating instrument.

REMEDY: Add the flatten to `resolve-check.mjs`'s ROUTINGS — one row resolving the 56 nested child
names through ns `translation`, plus rows for the root `error.*` and `search.*` subtrees — so a miss
on either side of the merge is a red. Cheaper interim: extend P99-02's oracle spot list from 4 keys
to all 67 moved leaf paths plus the 14 root leaves of `error`/`search`, both locales.

---

### [BLOCKER] B-08 — P99-02 contradicts itself: acceptance[4] says leave the non-resolving `common.*` sites byte-untouched, its command oracle demands the same 46 files reach ZERO matches, and 16 such sites exist

WHERE: `99-02-PLAN.md` — acceptance[4] _"The dot-form `common._`sites that do NOT resolve today
(the wrong-ns-bound 38 and the miss-outright 36 at plan time) are NOT owed by this plan and are
left **byte-untouched** — they are wave-3 lane population"*; versus the command oracle`test "$(command grep -rhoE "t\(\s\*['\"]common\." <46 files> | wc -l)" -eq 0`, whose `text:` reads
"RED at HEAD with ~120 matches".

EVIDENCE (`/tmp/p99-checker-b/orc5.mjs`; the oracle's own file list, which I verified is
byte-identical to P99-02's 46 source `files_modified`):

```
$ (oracle-5 inner count, run verbatim)
135                                   # the oracle's actual count at HEAD, not "~120"
$ node /tmp/p99-checker-b/orc5.mjs
total t('common.X matches: 136   resolving-through-nested: 120   NOT owed by 99-02 per acceptance[4]: 16
the not-owed keys the oracle nonetheless demands reach zero:
   common.noResults x2  common.goBack x2  common.collapse  common.expand  common.add  common.more
   common.cardView  common.tableView  common.toggleColumns  common.firstPage  common.previousPage
   common.nextPage  common.lastPage  common.dashboard
```

(136 vs 135 is the `-o` vs `-ho` line-vs-match edge on one line carrying two matches; both are

> 120 and both are > 0 after the owed 120 are rewritten.)

WHY: After P99-02 rewrites the 120 owed sites, **16 matches remain** in the very files the oracle
scans, so the oracle stays red. To make it green the task must touch what acceptance[4] forbids it
to touch — and a bare colon rewrite would not even help, because these 14 keys miss in the nested
subtree too; they need keys authored, which D-26 assigns to P99-06. The plan cannot satisfy both of
its own acceptance items.

REMEDY: Scope the oracle to the owed class — pin the 120 sites' exact key set and assert that no
`t('common.<one of those 45 keys>` survives — or move the 16 into P99-02's scope with the keys
authored in the same commit and say so in acceptance[4]. Either way, re-derive the `text:` figure:
the oracle's instrument counts 135/136 at HEAD, not 120.

---

### [OBSERVATION] O-01 — the plan set DOES compile, all 20 command oracles ARE red, and the D-14 sequencing IS a property of the DAG

Re-run, not quoted:

```
$ node --input-type=module -e 'import {compileGsd} …'
10 tasks
P99-01 []                           files=6   acc=11        P99-06 ["01","02"]        files=88  acc=10
P99-02 ["P99-01"]                   files=49  acc=9         P99-07 ["01","02","06"]   files=25  acc=7
P99-03 ["P99-01","P99-02"]          files=10  acc=9         P99-08 ["03".."07"]       files=133 acc=10
P99-04 ["P99-01","P99-02"]          files=26  acc=8         P99-09 ["03".."08"]       files=162 acc=9
P99-05 ["P99-01","P99-02"]          files=21  acc=9         P99-10 ["P99-09"]         files=2   acc=8 HUMANGATE
```

All ten `status: pending` — no pre-existing summary (`ls *SUMMARY*` → no matches), so contract §8 /
checklist 11 is clean. Every compiled `deps` matches its frontmatter `depends_on`. Every plan whose
body converts anything (03–09) is a **transitive** descendant of P99-02 — D-14 holds in the DAG,
verified by transitive closure, not by reading prose. Exogenous paths (D-03 / checklist 12) appear
in no `files_modified`. Concurrent-pair file-disjointness (D-39) holds: over every pair where
neither task is an ancestor of the other, `files[] ∩ files[] = ∅`.

All 20 `command:` oracles exit non-zero against the unfixed tree (`for i in $(seq 0 19); do bash -lc
"$(cat orc_$i.sh)"; done` → `EXIT=1` twenty times). Typed-oracle shapes are contract-legal
(**20 `command` + 1 `judge`**, no stray keys — the compile fails closed otherwise), and every one
carries its own `PATH="/opt/homebrew/bin:$PATH"` (D-37); that PATH resolves `node v24.19.0` and
`python3 3.14.5`, both above the engines floor. The index's claims of 20/20 red, machine-checked
disjointness, and no-vacuous-green all reproduce.

### [OBSERVATION] O-02 — nine of the twenty reds are "the file does not exist yet"; only eleven are mechanism-red

Classified from the captured stderr/stdout of each run: **9 fail on a missing file or module**
(oracles 0, 1, 2, 6, 8, 10, 15, 18, 19 — `test -f` on `settle.ts` / `nav-title-agreement.mjs` /
`99-VERIFICATION.md`, or `Cannot find module i18n-audit-strict.mjs`). **11 are mechanism-red**
(3 `nested common subtree still present`; 4 the ar nested subtree; 5 the 135-match count;
7/9/11/13 maskfinder listing the named carriers and `t(item.labelKey, item.label)` present;
12 the inversion guard; 14 the 26 date-fns literals; 16 `intake queue title not قائمة الاستقبال`;
17 the 1680-match count). The index's split (11 defect-observed / 9 instrument-not-yet-authored)
matches mine exactly — worth recording in 99-01's SUMMARY as the distinction it is, because for the
nine the discriminating clause is never reached today.

### [OBSERVATION] O-03 — several oracle clauses are already TRUE at HEAD (keep-true guards) and cannot contribute red

Verified individually: `دوسييه` today = **2 occurrences in 1 file** (`ar/common.json:1438
appName`, `:1441 mark`), so P99-08's `hits>2||files>1` clause is satisfied at HEAD;
`قائمة الانتظار` already present (`ar/common.json:165,1008`); `notFound` already present in
`routes/__root.tsx`; `common:` already present in `pages/webhooks/WebhooksPage.tsx` (8);
`dossier-search` already bound in `DossierSearchPage.tsx` (2); `node
scripts/check-date-formatting.mjs` already exits 0 (`0 unexcused sites`). These are deliberate
over-sweep / presence controls and are correct as such — the index says so for the دوسييه
threshold. The SUMMARY should not later report them as red-turned-green.

### [OBSERVATION] O-04 — the AR-01 glossary sweep (133 files, the phase's widest diff) has exactly ONE mechanical assertion, and it is not about the ruled terms being applied

P99-08's glossary oracle asserts three things: `دوسييه` does not grow (keep-true), `قائمة الاستقبال`
appears in `ar/intake.json` (the sole discriminator), `قائمة الانتظار` survives (keep-true).
Nothing mechanically checks that `دوسيه` became the single dossier term, that `ارتباط`→`مشاركة`
landed (171 lines carry `ارتباط`), that `موجز`/`إحاطة`→`ملخص` respected the artifact/session split
(124 + 65 lines), or that `منصب`→`موقف` respected office-vs-stance (53 lines). **D-17's named
destructive class is unguarded**: `ملف` appears on 558 lines across 87 `ar/*.json` files, and the
only sense-preservation evidence is prose plus an acceptance judge reading a diff that (B-05) will
not fit under the cap. Suggested minimum: a census oracle recording pre/post counts per ruled term
that fails if `الملف الشخصي` (11 today) or the other sanctioned `ملف` senses decrease.

### [OBSERVATION] O-05 — P99-05's `@` context ref to the position route is silently DROPPED at compile; checklist item 9 is violated

```
P99-05: plan @refs=6 compiled=5  DROPPED=["frontend/src/routes/_protected/positions/$id/index.tsx"]
```

(All nine other plans: refs in == refs compiled.) Contract §7 filters any ref containing `$VAR`. The
dropped file is exactly where P99-05's UI99-C7 banner extraction happens. It remains in
`files_modified` and is named in the plan body, so the work is reachable — but the compile-time loss
is real, and `99-PLAN-INDEX.md`'s "§10 checklist walked in full" is false at item 9.

### [OBSERVATION] O-06 — P99-01's `<verify>` block passes when the spec it verifies is GREEN

`99-01-PLAN.md` Task 1: `… playwright test 99-ar02 …; test $? -ne 0 && … playwright test 99-ar03 …;
test $? -ne 0`. If ar02 exits 0 the `&&` short-circuits, `$?` becomes 1, and the trailing
`test 1 -ne 0` succeeds — the verify reports success on the one outcome it exists to reject. Not
gate-bearing (B-06: `<verify>` is not compiled), but it is the human-facing instruction to the
worker and it is inverted.

### [OBSERVATION] O-07 — P99-09's unscoped gatekeeper inherits raw-key populations no lane names, including test-file `t()` mocks

P99-09 acceptance[3] requires the **unscoped** strict audit to read zero. Every unresolved key's
target namespace does map to a lane-owned JSON — I checked all 770 loose-model sites
(`/tmp/p99-checker-b/own.mjs`: _"unresolved sites whose EVERY candidate namespace is unowned by any
authoring lane: 0"_), because `common` catches the unbound tail and P99-06 owns it. But among them
are 12 raw-key sites in six `__tests__` files (`DossierDrawer.test.tsx cta.close`,
`DrawerMetaStrip.test.tsx meta.lead_prefix/meta.location_fallback/meta.engagements_suffix`,
`OpenCommitmentsSection.test.tsx empty.open_commitments`, …) plus 2 in
`components/active-filters/useActiveFilters.ts` and 3 in `components/signals/SignalRow.tsx`.
Driving those to zero means authoring test-mock keys into the shipped `common.json`. (The index's
"0 in test files" claim is about the **two-arg** population and it re-derives TRUE — this is the
raw-key class, which the index does not bound.) Either exclude `*.test.*`/`__tests__` in
`i18n-audit-strict.mjs` and say so in 99-01's plan, or name those keys as an owned residue in
P99-06 — otherwise they land as an ownerless STOP at the last repair task.

### [OBSERVATION] O-08 — population figures that did not reproduce at HEAD

- `99-06`'s oracle text "14+ double-prefixed sites" → measured **100** (B-03).
- `99-02`'s oracle text "~120 matches" → its own grep measures **135/136** (B-08).
- `99-09`'s acceptance[4] "1768 sites / 161 files": 1768 is `i18n-mask-audit.mjs`'s
  `total_two_arg_sites` (cross-line, `\bt\(`) while 161 files is the _single-line word-bounded_
  grep's file count, and the oracle then counts a third population (1680). Three correct numbers
  about three different sets inside one clause — the blend D-28 forbids, reappearing one level down.
- `99-PLAN-INDEX.md` §3 "the nested subtree carries NO `actions.*` keys — all author" is **false**:
  `common.common.actions` holds 9 keys in both locales and ~30 `common:common.actions.*` sites
  resolve today (B-02).

### [OBSERVATION] O-09 — smaller items, one line each

- **UI99-C3** (relative time, `/activity?lng=ar` matching `منذ \d+`) is cited only inside a range
  and no spec drives `/activity`; 99-01's ar02 routes are `/calendar`, `/dossiers`, `/events`. It is
  a keep-true row, but it is checked nowhere.
- **D-01, D-03, D-37, D-39 appear in no plan body.** The coverage gate matches `D-NN` tokens
  mechanically, so those four are ungraded. All four are in fact honored (O-01) — the index says so
  and calls them "structural properties of the set". A citation gap, not a compliance gap.
- **P99-08 edits `scripts/nav-title-agreement.mjs`, the instrument its own oracle runs.** Appending
  the 15 not-yet-derived rows is legitimate and D-08 anticipates it; nothing structurally prevents
  the same task from deleting the 7 mismatch rows instead of repairing them. `--control` only proves
  the checker can still fail on a planted row.
- **`.tickmarkr/config.yaml` `gates:` pins `PATH=…/.nvm/versions/node/v24.5.0/bin` and that
  directory does not exist** (`ls` → No such file or directory), as D-37/the contract predicted. The
  login default happens to resolve `node v24.19.0`, above the engines floor, so the gates are not
  broken today — but the pin GATEFIX-2 relies on is inert and nothing would announce a regression
  below the floor. Outside the plan set; recorded because it decides whether `build`/`test`/`lint`
  mean anything during this run.
- **Human gating (D-38/§I) is correct as far as it goes**: only P99-10 is `autonomous: false`, and
  P99-08's product tie-breaks route to that gate through the D-19 reversal window. Worth naming that
  "reversal" after P99-08 lands means re-sweeping 133 ar bundles, not editing a decision — the
  window is materially cheaper if the tie-break list is surfaced when it is made.

---

## WHAT I COULD NOT VERIFY

1. **Whether the two Playwright specs would be red for the right reason** — they do not exist. I
   verified only that nothing in the compiled graph runs them (B-06). The claimed mechanism
   (`format-date.ts` hardcodes `en-GB`) I did not exercise against a running app.
2. **The strict instrument's actual behaviour** — `scripts/i18n-audit-strict.mjs` does not exist. I
   reproduced the loose baseline (`473` two-arg / `297` raw-key unresolved; `total_two_arg_sites:
1768`) and confirmed the plan's `481`/`335` strict claims are of the right order for the model
   change described, but I could not confirm the D-22 delta (9 + 42), the `--self-check` fixture, or
   whether `--scope` semantics match what four lanes' oracles assume.
3. **`nav-title-agreement.mjs`'s 7 mismatches + 4 missing keys** — the checker does not exist. I
   confirmed `قائمة الاستقبال` already exists at `ar/common.json:164,169`
   (`navigation.intakeQueue`, `navigation.intake`) and is absent from `ar/intake.json`, consistent
   with the claimed intake-queue mismatch, but I did not walk all 28 nav entries.
4. **Whether the `scope` gate glob-matches paths containing `$`** (`positions/$id/index.tsx`,
   `after-actions/$afterActionId.tsx` — 6 such paths across P99-02/05/09). I verified the files exist
   and that the oracles' `\$` escaping is correct under `bash -lc`; I did not read `gates/scope.js`.
5. **P99-06's and P99-02's diff sizes against the 60 000 cap.** I proved the trip for P99-09
   (273 070 floor) and P99-08 (64 056 floor from ruled terms alone). P99-06 (88 files, long-tail
   authoring of a few hundred keys × 2 locales) I judge _at risk_ but did not bound; P99-02
   (~500 changed lines) I estimate under, also unbounded.
6. **The `judge`/`review` seat (`kimi:kimi-code/k3`) liveness.** Every prose truth in this set —
   which is where criteria 1, 2 and 3 actually close (B-06, O-04) — is graded by that seat. I did
   not probe it.
7. **Site-by-site placement of the 111 multi-line masks.** The file-level check says all are in
   P99-09's 161 (`cov.mjs` → 0 out of scope); I did not verify each site.
8. **The `ملف`/`دوسيه` sense split itself.** I counted (558 `ملف` lines / 87 files; 201 `دوسي`
   lines) but made no Arabic judgment about which are the object sense — that is the operator's per
   `RULING-P99-03` #2, and it is exactly why O-04 asks for a census instrument rather than a verdict.
9. **Whether `99-RESEARCH.md` §5.5/§6.4's rows are individually satisfiable.** I read the UI99-C
   definitions and traced their citations; I did not re-derive their bases (the "capture floor 34 on
   /my-work/intake", `index.css:294-295` Tajawal, the `98-copy04-voice.spec.ts:248-265` anchors).
10. **The 33-fixed-by-flatten-alone claim** (`99-PLAN-INDEX.md` §3, single-prefix `common:X` misses
    whose path lives in the nested subtree). It is plausible and my `prove.mjs` confirms the
    mechanism for two spot keys (`common:cancel` → `"Cancel"`/`"إلغاء"` post-flatten), but I did not
    enumerate all 33.

PLAN-CHECK-END
