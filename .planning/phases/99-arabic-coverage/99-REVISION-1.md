# 99-REVISION-1 — the repair round, blocker by blocker

**Seat:** `p99-planner-2`. **Written:** 2026-08-18 (UTC), repo HEAD
`9ffa2b80cc82fb3fe29e11354818d13f537e67b9`, branch `milestone/v10.0-trust`. Working tree at
revision time carried harness-synced files only (`.agents/`, `.claude/`, `CLAUDE.md`, `.planning/`,
untracked `AGENTS.md`/`tickmarkr.spec.md`) — nothing under `frontend/`, `backend/`, `scripts/`,
`tests/`, so every derivation below is a derivation of the committed tree at that sha.

Inputs: `BRIEF-99-REVISION-1.md`, `P99-BLOCKER-REGISTER.md`, `RULING-P99-05`, `RULING-P99-06`,
`RULING-P99-07`, `99-PLAN-CHECK-A.md`, `99-PLAN-CHECK-B.md`, `99-CONTEXT.md` (D-12 and D-23 as
amended). No Task subagents were used. Nothing was written outside
`.planning/phases/99-arabic-coverage/` and the heartbeat file.

**The plan set went from 10 plans to 25.** Not to look thorough — three ruled acts drive it, and
two more lanes were re-cut because they measured over budget. §4 states every lane's estimate with
its instrument.

---

## The rule this round is built on

> **If the engine must RUN it, it is a `command:` truth. Everything else is documentation.**

Every rendered proof in the first draft sat in a `<verify>` block, which the compiler does not
read. The set is now built so that this class cannot recur. **Three populations, labelled, because
mixing them is the exact defect class this phase keeps finding:**

| population                                               | count  | what it is                                                                       |
| -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `command:` oracles that INVOKE Playwright                | **10** | the load-bearing number — these are the compiled truths the engine actually runs |
| `playwright` string occurrences inside `command:` values | **20** | 2 per invoking oracle: the `--list` count check and the run                      |
| `playwright` string occurrences graph-wide               | **21** | the 20 above + 1 `@playwright.config.ts` context ref in P99-01                   |

`--project` = **20** graph-wide, all inside `command:` values (2 per invoking oracle). The
pre-revision graph measured **0** on every one of these populations.

The 10 invoking oracles, by plan: P99-01 ×2, P99-04, P99-05, P99-06, P99-08, P99-09, P99-10,
P99-25 ×2.

---

## 1. B-06 — `<verify>` is not compiled; criteria 2 and 3 had no executing oracle

**Changed:** every rendered proof moved out of `<verify>` and into a `command:` truth in the
acceptance of the plan that closes it, and again in the closing battery.

| where   | oracle            | what it runs                                                                                                                    |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `99-01` | 2 command oracles | `--list` count then a run that MUST fail — the red-first record, with collection proven so the red cannot be a collection error |
| `99-04` | 1                 | `-g "UI99-C6 ar intake queue"`, count 1                                                                                         |
| `99-05` | 1                 | `-g "UI99-C8 ar search chips"`, count 1                                                                                         |
| `99-06` | 1                 | `-g "UI99-C7 ar banner"`, count **3** — one per ruled status                                                                    |
| `99-08` | 1                 | `-g "UI99-C5 ar 404"`, count 1                                                                                                  |
| `99-09` | 1                 | the whole `99-ar02-dates.spec.ts`, count 8                                                                                      |
| `99-25` | 2                 | both specs in full, counts 8 and 10                                                                                             |

Every invocation: **ONE spec path** (D-09 — two paths with one match silently drop the rest and
exit 0), `test -f` first, and the expected count **hardcoded** from `--list` rather than derived
from the list just passed. All `--list` calls carry `--project=chromium-en --no-deps`, because
without them Playwright counts the `[setup]` project too — verified against a committed spec:
bare `--list` on `98-copy04-voice.spec.ts` prints `Total: 7 tests in 2 files`, and with the
project flags `Total: 4 tests in 1 file`. A count hardcoded from the wrong invocation would have
been a fresh instance of the same class.

**A-05's "NOT CONSTRUCTED" self-service pass is deleted** from the closing plan. Its replacement,
written into `99-25`'s acceptance: an unrunnable leg leaves the task RED and parks to the overseer
by name; the only recordable bound is one the overseer rules in writing, quoted with its ruling id.

## 2. B-01 / RULING-P99-06 — the flatten, rewritten once against the ruled destination

`99-03-PLAN.md` (the flatten's new number). Re-derived from the bundles, both locales:

```
en: nested keys=56  same-name-at-root=2   error: nested=string root=object  <<TYPE CLASH
                                          search: nested=string root=object <<TYPE CLASH
    error.label present? false | search.label present? false
    nested leaves=67  root error leaves=2  root search leaves=12 (10 immediate children)
ar: identical, including both clashes and both absent targets
```

Both numbers for `search` are stated because two instruments say two things about two sets: **10
immediate children, 12 leaves.** The ruling says 10; checker B's evidence block says 12; neither
is wrong.

Landed in the plan:

- nested `common.error` → **`error.label`**, nested `common.search` → **`search.label`**, both
  locales, inside the existing root objects.
- **All 13 dot-form consumers repointed in the same commit**, enumerated by file in the plan —
  5 `t('common.error')` (DataLibraryPage, MousPage, after-action, `$afterActionId`, versions) and
  8 `t('common.search')` (ToolbarSearch ×2, DataTable, ExecutionsTabs, DocumentTree, MousPage,
  EventsPage, `__root`). A bare substring count returns 7 and 8 rather than 5 and 8 — the extra
  two `common.error` occurrences are not `t()` calls. Two populations, both stated (D-05).
- **UI99-C5 stays RED across the relocation.** The flatten repoints only the `common.search` call
  inside `__root.tsx`; the 404's own four keys repoint in `99-08`, and that is where the
  `UI99-C5 ar 404` oracle lives. Written into both plans.

**Instrument law (RULING-P99-06 §3) — the collision oracle is TYPE-AWARE and positively
controlled.** Its first act is to run a synthetic scalar-vs-object pair and abort if the check
reports zero clashes on it: _"POSITIVE CONTROL FAILED — the collision check cannot see a
scalar-vs-object clash."_ It then asserts, per locale: no top-level `common`; `error` and `search`
still OBJECTS; `error.label` and `search.label` present as strings; children not lost. The
post-flatten resolution probe covers **six** keys — `all`, `notFound.title`, `error.label`,
`search.label`, `error.failedToLoadData`, `search.placeholder` — the last four being exactly the
keys the first draft's four-key spot check omitted, which is where the undecidable merge lived.

`resolve-check.mjs` and `neg-taskcard.mjs` are still run (D-13 names them) and are now **labelled
keep-true in the plan text**, with the reason: zero of the harness's 214 lookups resolve through
the nested subtree, so it prints the same number after a botched merge. That is B-07, below.

## 3. B-02 — blast radius, and the 35 files owned by nobody

Re-derived at this sha:

| class                                                      | sites                                  | files             | distinct keys            |
| ---------------------------------------------------------- | -------------------------------------- | ----------------- | ------------------------ |
| `t('common.X')` resolving through nested, binding-filtered | **127** (first draft & checker B: 120) | **48** (both: 46) | **45** (all three agree) |
| same class simulated POST-flatten                          | **130**                                | **50**            | —                        |
| `common:common.X` — total                                  | **100**                                | **59**            | **37**                   |
| `common:common.X` — resolving through nested today         | **79**                                 | **52**            | —                        |

The binding-model delta is two files (`PositionDossierLinker.tsx`, `IntelligencePage.tsx`) and
seven sites; distinct-key counts agree exactly. **Both models are stated in the plan** and the
in-task re-derivation governs.

`99-03`'s `files_modified` is now the union: **110 entries** (2 JSON + 107 sources + summary).
Of the union, **35 files were owned by no plan in the first draft** (checker B said 32 — my
binding model is looser; both stated). They are owned now. The double-prefix class moved here
whole, because D-13's own reason — a partial land breaks working sites — applies to its 79
resolving members identically.

Two files were added after simulating the ruled merge rather than reading HEAD:
`waiting-queue/AgingIndicator.tsx` and `waiting-queue/AssignmentDetailsModal.tsx` become owed the
moment the flatten lands. Post-simulation check: **owed files not in `99-03` scope = 0; double-
prefix files not in scope = 0.**

## 4. B-03 — `99-06`'s repo-wide oracle over a 17-file scope

The clause is **deleted** from that lane. The whole `common:common.` rewrite lives in the flatten
plan, which owns all 59 files. The successor lane (`99-08`, chrome rewrites) keeps only a standing
guard that no double-prefixed site was **re-created** — a guard over its own edits, not a demand
on files it may not write.

Re-derived: the first draft's oracle text said "14+ double-prefixed sites"; the measured number is
**100 sites / 59 files / 37 distinct keys** (O-08 reconciled).

## 5. B-07 — `resolve-check.mjs` cannot see the flatten

Confirmed by reading the harness's population: its only two `translation`-bound routings resolve
`waitingQueue.entityStatus.*`, which lives at the **root**, so nothing routes through the nested
subtree. It is green before and after a botched merge.

**Changed:** D-13's ritual still runs, but the plan states in three places that it is a keep-true
guard and names the type-aware collision oracle plus the six-key resolution probe as the
discriminating instruments. The falsifiability D-13 wanted now comes from an instrument that can
actually see the change.

## 6. B-08 — `99-02` contradicted itself (acceptance[4] vs its own oracle)

Dissolved by replacing a **file-list predicate with a resolution predicate**. The rewrite oracle
now counts dot-form `t('common.X')` sites where (a) the file binds `common`/`translation`/a bare
hook AND (b) `X` resolves at the _then-current_ root, and demands zero. Consequences, verified:

- The 13 not-owed keys (`noResults`, `goBack`, `collapse`, `expand`, `add`, `more`, `cardView`,
  `tableView`, `toggleColumns`, `firstPage`, `previousPage`, `nextPage`, `lastPage`) are absent
  from the root before AND after the flatten, so the predicate structurally cannot demand them.
- `common.dashboard` **does** exist at the root, so it is owed — 1 site, `routes/__root.tsx:37`,
  and that file is in scope. It moved from "not owed" to "owed" on evidence, not by preference.
- The wrong-ns-bound class is excluded by the binding half. My first attempt at this oracle omitted
  the binding filter and would have demanded rewrites in files the plan is forbidden to touch —
  caught by simulating the post-flatten state before shipping, and recorded here because it is the
  same defect one level down.

Also re-derived (O-08): the first draft's oracle text said "~120 matches"; its own grep measures
135/136 at HEAD.

## 7. A-01 = B-04 — the mask oracle, unsatisfiable and blind at once

Re-derived, all three reproduce exactly:

```
unanchored line-bound grep   : 1680
word-bounded line-bound grep : 1657
committed cross-line audit   : 1768   (total_two_arg_sites)
```

**Changed, per RULING-P99-05 §5 A-01:** the closing predicate in all eight deletion lanes and in
the closing battery is the strict parser's **`twoArgTotal === 0`**. The literal acceptance grep is
demoted to a diagnostic and no longer appears as a closing clause anywhere. `99-02` orders the
strict instrument's `--self-check` fixture to carry **both** a one-line and a **wrapped** positive
control — the 111-site class the line-bound grep cannot see — and to fail if either leg misses.

## 8. A-02 — verify-before-drop is now a DAG property

`99-16` is a **verification-only engine task**: repo-wide strict zero in both locales, maskfinder
zero with its control, resolve-check green, neg-taskcard 3× `MISS=true`. It writes exactly one
file, its own SUMMARY, and one of its oracles asserts
`git diff --name-only HEAD -- frontend backend supabase tests scripts` is **empty** — "verification
only" as a checked property rather than a promise. All eight deletion lanes `depends_on` it;
ancestry machine-verified.

Its SUMMARY also carries the deletion manifest, because the lanes must not each derive it privately.

## 9. A-04 — criterion 1 gets a drilled instrument

`scripts/glossary-census.mjs` + `scripts/glossary-senses.json` + `scripts/glossary-senses.d/`
(authored in `99-02`). It enumerates **every** ruled row, walks every `ar/*.json` leaf, and
classifies **every** occurrence of every competing term as ruled-term / allowlisted-sense /
**UNCLASSIFIED**, exiting nonzero while any unclassified survives. It never rewrites: classification
and rewriting are separate acts, which is what stops a substring sweep passing as judgment. Its
`--control` plants a banned occurrence and must catch it. It runs in every glossary lane's
acceptance and in the closing battery.

Re-derived over `frontend/src/i18n/ar/*.json` — occurrences / lines / files, three numbers because
they are three sets (D-05):

```
ارتباط  171/171/32     موجز 128/124/28     إحاطة 65/65/16      منصب 53/53/18
مشارك   239/235/58     ملف  578/558/87     دوسيه 199/199/8     دوسييه 2/2/1
الملف الشخصي 11/11/6   تطوير المنصب 1/1/1  قائمة الانتظار 13/13/3  قائمة الاستقبال 2/2/1
```

Command: `cd frontend/src/i18n/ar && /usr/bin/grep -rho "<term>" *.json | wc -l` (occurrences),
`-rh … | wc -l` (lines), `-rl … | wc -l` (files).

`قائمة الاستقبال` **already occurs twice at HEAD** in `ar/common.json` (the nav labels). A clause
keyed on its presence is a keep-true guard, not a discriminator — `99-10`'s oracle instead demands
it in `ar/intake.json`, and says so.

The sense exceptions ship as committed rows, and every sweep lane writes its judgments to its own
overlay file. The overlay is a **directory** rather than one shared file precisely so the three
concurrent `ملف` lanes stay file-disjoint under D-39.

## 10. A-06 — the two rendered gaps

- **UI99-C3** added: `99-ar02-dates.spec.ts` tests 7 and 8 drive `/activity?lng=ar` and
  `/activity?lng=en`, asserting the Arabic relative family (`منذ` + a Latin-digit run per D-31) and
  the English presence control. The route exists (`routes/_protected/activity.tsx`) and
  `formatRelativeTime` (`lib/format-date.ts:107`) is the only relative-time producer.
- **UI99-C7** is now **three separately counted tests** over a committed fixture,
  `tests/e2e/fixtures/99-positions-seed.mjs`, which seeds one position per ruled status. Per
  A-05-as-amended, fixtures are the PRIMARY remedy; a skip requires a written ruling. The fixture
  **queries `pg_constraint` for the positions status CHECK before any INSERT** and aborts printing
  the constraint text if the three literals are not members; a seed failure THROWS rather than
  skipping. `99-06`'s oracle hardcodes the count at 3, so a fixture failure that quietly ran one
  branch cannot pass for three.

The three banner sentences are at `routes/_protected/positions/$id/index.tsx:59-63`, a status
ternary over `under_review` / `approved` / `published`, each carrying the literal `Read Only`.

## 11. D-29 — the real gap, repaired with substance

`UI99-Cn` citations added to `99-01`, `99-04`, `99-05`, `99-06`, `99-08`, `99-09`, `99-10` — each
paired with the rendered `command:` oracle that closes the cited row, not standing alone.

## 12. Tie-breaks — ruled, applied, default dead

`99-10` encodes the criterion semantics the overseer clarified: a pair agrees when nav and title
carry the same **object term**, sense-consistent — not byte-equality. Read at this sha:

| pair      | nav (ar / en)                         | title (ar / en)                        | ruled outcome                   |
| --------- | ------------------------------------- | -------------------------------------- | ------------------------------- |
| persons   | `الأشخاص` / People                    | `جهات الاتصال الرئيسية` / Key Contacts | `الأشخاص` family, nav AND title |
| positions | `المواقف` / Positions                 | positions library / Positions Library  | **CONFORMANT — no edit**        |
| dashboard | masked `navigation.dashboardOverview` | `لوحة الملفات` / Dossier Dashboard     | `لوحة الدوسيهات`, both          |

**`en/persons.json` exists and is inside `99-10`'s `files_modified`**, so the EN title repairs in
the same act rather than landing on the register as a residue — the ruling's stated condition is
met. "Key Contacts" is EN's own retired-vocabulary instance.

The title-wins default appears nowhere in the set. Its replacement is written into `99-10`'s
acceptance: **any further unruled pair ESCALATES by name and leaves the task RED.** `99-10` stays
`autonomous: true`; the only human gate is `99-25`.

Its oracle also asserts the checker encodes **28 rows** via `--json`, because nothing else
structurally stops a green earned by deleting mismatching rows instead of repairing them (O-09).

## 13. D-23 — no change owed

The deletion-only reading was confirmed. The deletion lanes cite D-23 **as clarified**, and say in
their own text why colon form is not forced there.

## 14. B-05 / RULING-P99-07 — the splits, applied

The ruling's five constraints are applied. Per-lane estimates, **instrument named**:

**Instrument for the mask lanes:** the committed audit's own cross-line matcher
`/\bt\(\s*'([^']+)'\s*,\s*'([^']*)'/g` plus the balanced-brace `defaultValue` walk, run over whole
file text — **never the line-bound grep**, whose blindness produced the original floor. Logic bytes
= sum of touched-line bytes × 2 (a modified line is a removed line plus an added line in a `-U0`
logic diff). All numbers are FLOORS.

**A population correction found while budgeting.** The deletion class is **two** populations, and
the first draft's single 161-file scope covered one of them while its own oracle demanded both
reach zero:

```
two-arg literal  t('key','Default')      : 1768 sites / 161 files   (reproduces the audit exactly)
defaultValue-in-options t('key',{...})   :  314 sites / 103 files   (88 of them carry NO literal-class site)
UNION                                    : 2082 sites / 249 files
total estimated logic diff               : 334,310 bytes
```

Both classes are now named in `99-16`'s manifest and in every deletion lane's text, and the 249
files are all owned.

| lane                                                                              | files | mask sites | est. logic bytes | budget  |
| --------------------------------------------------------------------------------- | ----- | ---------- | ---------------- | ------- |
| 99-17 `components/ai` … `dossier/wizard/hooks`                                    | 44    | 269        | **44,066**       | ≤45,000 |
| 99-18 `dossier/wizard/review` … `intelligence/EconomicDashboard`                  | 30    | 256        | **40,498**       | ≤45,000 |
| 99-19 `intelligence/IntelligenceTabContent` … `relationships/AnalyticResultView`  | 36    | 294        | **44,512**       | ≤45,000 |
| 99-20 `relationships/EnhancedGraphVisualization` … `waiting-queue/AgingIndicator` | 35    | 309        | **44,240**       | ≤45,000 |
| 99-21 `waiting-queue/AssignmentDetailsModal` … `pages/MoUs/MousPage`              | 28    | 235        | **41,028**       | ≤45,000 |
| 99-22 `pages/Organizations` … `pages/my-work/components/WorkItemCard`             | 37    | 251        | **43,868**       | ≤45,000 |
| 99-23 `pages/my-work/…/WorkItemFiltersBar` … `routes/_protected/admin/approvals`  | 14    | 197        | **31,362**       | ≤45,000 |
| 99-24 `routes/_protected/admin/data-retention` … `utils/ai-errors`                | 25    | 271        | **44,736**       | ≤45,000 |

Eight lanes, path-contiguous so a reviewer sees one area per diff, file-disjoint by construction,
all behind `99-16`. The count came from the measurement: 334,310 ÷ 45,000 = 7.4.

**Glossary, along the ruling's term-family axis.** Instrument: line-level walk over the actual ar
bundle text, changed lines × 2.

| lane  | family / slice                                                    | files | lines | est. logic bytes |
| ----- | ----------------------------------------------------------------- | ----- | ----- | ---------------- |
| 99-10 | (a) ruled instances, tie-breaks, queue collision, nav↔title, MoUs | 11    | ~40   | **~7,000**       |
| 99-11 | (b) `ارتباط` → `مشاركة`                                           | 32    | 171   | **31,780**       |
| 99-12 | (c) `موجز` → `ملخص`, wrong-sense `منصب` → `موقف`                  | 42    | 177   | **24,644**       |
| 99-13 | (d1) `ملف` sense split, `advanced-search` … `email-digest`        | 37    | 261   | **39,874**       |
| 99-14 | (d2) `ملف`, `empty-states` … `preview-layouts`                    | 32    | 231   | **43,560**       |
| 99-15 | (d3) `ملف`, `progressive-disclosure` … `workspace`                | 18    | 66    | **10,832**       |

The ruling's lane (d) — the `ملف` sense-classification, "its OWN lane" — measured **94,266 bytes**,
over budget, so constraint 4 applied and it was **re-cut at plan time into three file-disjoint
slices** that run concurrently. It keeps its own review gates; it gets three of them.

Lanes (a)→(b)→(c) are chained because they contend on the same ar bundles; D-39 requires one owner
and sequencing where a file is contended. (d1/d2/d3) are disjoint and concurrent.

**Two further lanes measured over budget and were re-cut, on the same constraint:**

- **The old `99-06`** (common long tail, 88 files) measured **~50,700** — 412 distinct keys × 2
  locales of added JSON (~37,080, added lines counting once) plus 84 measured source-rewrite lines
  at ×2 (10,622) plus the nav/404/chrome/carrier edits. Split on the **mechanism** axis:
  `99-07` **authoring only, zero source files** (~37,100) and `99-08` **source rewrites only, zero
  JSON** (~14,000). Each half's oracle asserts the other half's file class is untouched.
- **The old `99-01`** authored five instruments plus two specs in one task; the C7 fixture and the
  glossary census push authored size past budget. Split on the **rendered vs static** axis:
  `99-01` (settle helper, two specs, fixture) and `99-02` (strict audit, nav checker, glossary
  census, sense allowlist). Both estimates are of authored size, which is weaker evidence than a
  measured population, and it is stated as such.

**The one lane that is tight and cannot legally be split: `99-03`, the flatten, at ~41,400 bytes**
(247 rewritten source lines × 2 plus the two nested JSON blocks). D-13 makes atomicity the
requirement — a flatten split from its rewrite breaks working renders — so this is the estimate the
overseer should see rather than a lane cut. It sits ~31% under the hard cap.

## 15. O-05 — the dropped `@` ref

Re-run per plan against the compiled graph: **REFS DROPPED: 0** across all 25. The `$id` casualty
is fixed the way the contract requires — the path is named in `99-06`'s prose Ref-notes with the
reason (`an @ ref containing $ is silently DROPPED at compile, and the first draft lost exactly
this ref`) and carried in `files_modified`, where the scope gate can see it.

## 16. O-08 — populations reconciled, both numbers where instruments disagree

| claim on record                                                        | measured at this sha                                                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `99-06` "14+ double-prefixed sites"                                    | **100** sites / 59 files / 37 distinct keys                                                                                                                  |
| `99-02` oracle text "~120 matches"                                     | its own grep measures **135/136**                                                                                                                            |
| `99-09` acceptance[4] blending 1768 / 161 / 1680                       | three sets, now separated: 1768 cross-line, 1657 word-bounded line-bound, 1680 unanchored; 161 files for the literal class, +88 for the `defaultValue` class |
| index §3 "the nested subtree carries NO `actions.*` keys — all author" | **FALSE** — `common.common.actions` holds 9 keys in both locales; ~30 `common:common.actions.*` sites resolve today. Corrected in `99-03` and `99-07`.       |
| root `search` "OBJECT(10)" vs checker B's 12                           | **10 immediate children, 12 leaves** — both correct, both stated                                                                                             |
| flatten blast radius 120/46                                            | **127/48** by my binding model, **130/50** post-flatten; 45 distinct keys under all models                                                                   |

## 17. O-02 / O-03 — what "59/59 RED" actually means

All **59** compiled `command:` oracles were extracted from the compiled graph and run under
`bash -lc` against the unfixed tree: **RED=59 GREEN=0**. The honest decomposition, because that
figure carries an implication it does not support alone:

- **9 are defect-observed** — the oracle sees the live defect and names it: `99-03` ×2 (nested
  subtree present; owed dot-form + double-prefixed sites), `99-04`/`99-05`/`99-06` (the maskfinder
  listing each lane's dynamic carriers), `99-07` (inversion guard firing pre-flatten), `99-08`
  (the nav mask literal), `99-09` (the English-name date literals), `99-10` (intake title not
  `قائمة الاستقبال`).
- **50 are instrument-absent** — they fail because a `99-01`/`99-02` artifact does not exist yet.
  They cannot pass with the work undone, and their discriminating clauses activate the moment the
  instruments land; `99-01`'s and `99-02`'s own gates prove those instruments discriminating
  (wrapped-and-one-line fixture self-check, planted nav mismatch, planted banned glossary
  occurrence) before any repair lane leans on them.

This ratio is worse than the first draft's 11/9, and that is a consequence rather than an accident:
this round replaced two closing instruments with drilled ones and moved every rendered proof from
inert `<verify>` prose into compiled truths, so more oracles now route through artifacts absent at
HEAD.

Keep-true clauses (resolve-check green, neg-taskcard 3× MISS, the date guard, `قائمة الاستقبال`
presence, `دوسييه` ≤ 2) are never an oracle's only content and are labelled keep-true where they
appear.

---

## §A. Per-blocker map — all FOURTEEN source findings, to the plan(s) that repair them

The register deduplicated 14 findings into 12 (A-01 = B-04 is one repair; A-03 was DISSOLVED).
This table maps the **full 14 as each checker raised them**, so nothing is invisible because it
merged into a neighbour.

| #        | finding                                                                                  | verdict                             | repaired in                                                                       | the repair, in one line                                                                                                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A-01** | AR-04a closing grep simultaneously unsatisfiable and blind to wrapped masks              | REPAIRED (same repair as B-04)      | `99-02` (instrument), `99-16` (proof), `99-17`–`99-24` (drop), `99-25` (battery)  | closing predicate is the strict parser's `twoArgTotal === 0`; grep demoted to a diagnostic and gone from every closing clause; the `--self-check` fixture carries a one-line AND a wrapped positive control                                                         |
| **A-02** | D-24's verify-before-drop is not a DAG property                                          | REPAIRED                            | `99-16` + `99-17`–`99-24`                                                         | verification became its own engine task that edits nothing (its oracle asserts an empty `git diff`); all eight deletion lanes `depends_on` it; ancestry machine-verified                                                                                            |
| **A-03** | `99-08` makes unruled Arabic product decisions with no human gate                        | **DISSOLVED** by `RULING-P99-05` §3 | `99-10` (the decisions), `99-25` (the gate)                                       | the three tie-breaks were RULED; title-wins is dead; any further unruled pair ESCALATES by name and leaves the task RED. `autonomous: true` stands on `99-10`; the only human gate is `99-25`                                                                       |
| **A-04** | criterion 1 has no oracle for most of the ruled glossary                                 | REPAIRED                            | `99-02` (instrument), `99-10`–`99-15` (each lane's acceptance), `99-25` (battery) | `scripts/glossary-census.mjs` + a committed sense allowlist classifies EVERY occurrence of EVERY ruled row; never rewrites; `--control` plants a banned occurrence it must catch                                                                                    |
| **A-05** | the closing task can pass with rendered proof absent                                     | REPAIRED                            | `99-25` (+ every lane that closes a rendered row)                                 | "NOT CONSTRUCTED" deleted as a passing alternative; typed `command:` oracles per spec with `test -f` and hardcoded `--list` counts; an unrunnable leg leaves the task RED and parks by name                                                                         |
| **A-06** | `UI99-C3` omitted, `UI99-C7` under-driven                                                | REPAIRED                            | `99-01` (specs + fixture), `99-06` (C7 ×3 rendered), `99-09` (C3 rendered)        | `/activity?lng=ar` relative-time leg added with its en control; C7 is three separately counted tests over a committed three-status fixture that verifies `pg_constraint` before inserting and throws rather than skipping                                           |
| **B-01** | the flatten is not collision-free — `error`/`search` are scalars nested, objects at root | REPAIRED                            | `99-03`                                                                           | ruled relocation to `error.label` / `search.label` in both locales; 13 dot-form consumers repointed in the same commit; collision oracle is TYPE-AWARE with a scalar-vs-object positive control that must fire before the merge logic is trusted                    |
| **B-02** | blast radius is 199/97 not 120/46; 32 files owned by no plan                             | REPAIRED                            | `99-03`                                                                           | `files_modified` widened to the measured union — **110 entries**; the `common:common.X` class folded in whole; **35** previously ownerless files now owned; post-merge simulation shows 0 owed files outside scope                                                  |
| **B-03** | `99-06`'s repo-wide `common:common.` oracle covers 59 files while it owns 17             | REPAIRED                            | `99-03` (owns the class), `99-08` (guard only)                                    | the clause is deleted from the successor lane; the whole double-prefix rewrite lives in the flatten plan, which owns all 59 files; the successor keeps only a "not re-created" guard over its own edits                                                             |
| **B-04** | = A-01                                                                                   | REPAIRED (one repair)               | as A-01                                                                           | see A-01                                                                                                                                                                                                                                                            |
| **B-05** | `99-08`/`99-09` exceed `gates.diffCap` and park un-retryably                             | REPAIRED per `RULING-P99-07`        | `99-10`–`99-15` (glossary), `99-16`–`99-24` (mask)                                | SPLIT both, global cap raise REFUSED; every lane budgeted ≤ ~45,000 logic bytes with the multi-line matcher; §14 states each lane's estimate; two further lanes measured over budget and were re-cut at plan time                                                   |
| **B-06** | criteria 2 and 3 have NO executing oracle — `<verify>` is not compiled                   | REPAIRED                            | `99-01`, `99-04`, `99-05`, `99-06`, `99-08`, `99-09`, `99-10`, `99-25`            | 10 `command:` oracles now invoke Playwright, one spec path each, `test -f` first, counts hardcoded from `--list` run with `--project=chromium-en --no-deps`                                                                                                         |
| **B-07** | `resolve-check.mjs` cannot see the flatten, so D-13's before/after is unfalsifiable      | REPAIRED                            | `99-03`                                                                           | the harness still runs (D-13 names it) but is LABELLED keep-true with its reason stated; the discriminating instruments are the type-aware collision oracle and a six-key post-flatten resolution probe covering the four keys the first draft's spot check omitted |
| **B-08** | `99-02` self-contradicts: acceptance[4] vs its own oracle                                | REPAIRED                            | `99-03`                                                                           | the file-list predicate became a BINDING + RESOLUTION predicate, so the not-owed keys are structurally excluded and cannot be demanded; `common.dashboard` moved into the owed set on evidence                                                                      |

Also repaired from checker B's observations: **O-05** (the dropped `@` ref — now 0 across all 25),
**O-08** (populations reconciled, §16), **O-02/O-03** (the honest red decomposition, §17),
**O-04** (the glossary sweep's single mechanical assertion — now the drilled census),
**O-07** (the test-file policy is stated once for both classes, in `99-02` and `99-07`),
**O-09** (the nav checker's `--json` row count stops a green earned by deleting mismatching rows).

## §B. Per-plan completeness — because a truncated plan still compiles

The turn that wrote these plans died on a connection loss. Compiling clean is not evidence of
completeness: the compiler reads frontmatter and `<done>`/`must_haves`, and would happily accept a
plan whose `<tasks>` section was cut off mid-sentence. Each plan was therefore checked structurally
after the fact — frontmatter keys present, `<objective>`, `<context>`, `<interfaces>`, balanced
`<task>` blocks with matching `<name>`/`<action>`/`<done>`, `<verification>`, `<success_criteria>`,
`<output>`, own SUMMARY both in `files_modified` and named in `<output>`, `files_modified` count
equal to the compiled `files[]` count, every `command:` oracle carrying a `text:`, and the file
ending at `</output>`.

**Result: 25 plans checked, 0 with problems.**

| plan   | tasks | files | acceptance | structure |
| ------ | ----- | ----- | ---------- | --------- |
| P99-01 | 2     | 5     | 14         | intact    |
| P99-02 | 2     | 6     | 15         | intact    |
| P99-03 | 1     | 110   | 12         | intact    |
| P99-04 | 1     | 10    | 10         | intact    |
| P99-05 | 1     | 26    | 10         | intact    |
| P99-06 | 1     | 21    | 10         | intact    |
| P99-07 | 1     | 39    | 13         | intact    |
| P99-08 | 2     | 50    | 13         | intact    |
| P99-09 | 1     | 25    | 8          | intact    |
| P99-10 | 2     | 12    | 14         | intact    |
| P99-11 | 1     | 34    | 9          | intact    |
| P99-12 | 1     | 44    | 9          | intact    |
| P99-13 | 1     | 39    | 9          | intact    |
| P99-14 | 1     | 34    | 9          | intact    |
| P99-15 | 1     | 20    | 9          | intact    |
| P99-16 | 1     | 1     | 9          | intact    |
| P99-17 | 1     | 45    | 9          | intact    |
| P99-18 | 1     | 31    | 9          | intact    |
| P99-19 | 1     | 37    | 9          | intact    |
| P99-20 | 1     | 36    | 9          | intact    |
| P99-21 | 1     | 29    | 9          | intact    |
| P99-22 | 1     | 38    | 9          | intact    |
| P99-23 | 1     | 15    | 9          | intact    |
| P99-24 | 1     | 26    | 9          | intact    |
| P99-25 | 2     | 2     | 12         | intact    |

**Two things the check caught, both reported rather than buried:**

1. **My first checker reported a `files_modified N != compiled N-1` mismatch on all 25 plans.**
   That was the INSTRUMENT, not the plans: my `^  - \S+` regex over the whole frontmatter also
   matched the single top-level `truths:` list entry, which sits at the same indent. Off-by-exactly-one
   on every plan is the signature of an instrument fault, not of 25 independent defects. Re-run
   scoped to the `files_modified:` block only: **0 mismatches.** Recorded because "instrument-test
   every zero" cuts both ways — a uniform non-zero deserves the same suspicion.
2. **`99-16` carried the literal string `<task>` twice in prose** (in a `truths:` entry and in the
   `<objective>`), describing the first draft's defect. Harmless for gating — `humanGate` keys on
   `<task type="checkpoint:…">`, which this was not, and the plan compiled without one — but it
   inflated the compiler's `complexity = 2 × (count of <task…> blocks) + truths` and made a
   structural checker read two task blocks where one exists. Rewritten to "two inner task blocks".
   Re-verified after the edit: 25 tasks, humanGate P99-25 only, 0 pre-marked done, 59/59 oracles
   still RED.

Nothing else on disk diverges from intent.

---

## §10 compile probe — verbatim

```
$ node --input-type=module -e '
import { compileGsd } from "/opt/homebrew/lib/node_modules/tickmarkr/dist/compile/gsd.js";
const g = compileGsd("/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/99-arabic-coverage",
                     "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0");
console.log(g.tasks.length, "tasks");
for (const t of g.tasks) console.log(t.id, t.deps, t.files.length, t.acceptance.length, t.humanGate ? "HUMANGATE" : "");
'

25 tasks
P99-01 [] 5 14
P99-02 [] 6 15
P99-03 [ 'P99-01', 'P99-02' ] 110 12
P99-04 [ 'P99-02', 'P99-03' ] 10 10
P99-05 [ 'P99-02', 'P99-03' ] 26 10
P99-06 [ 'P99-02', 'P99-03' ] 21 10
P99-07 [ 'P99-02', 'P99-03' ] 39 13
P99-08 [ 'P99-07' ] 50 13
P99-09 [ 'P99-02', 'P99-03', 'P99-07', 'P99-08' ] 25 8
P99-10 [ 'P99-04', 'P99-05', 'P99-06', 'P99-07', 'P99-08', 'P99-09' ] 12 14
P99-11 [ 'P99-10' ] 34 9
P99-12 [ 'P99-11' ] 44 9
P99-13 [ 'P99-12' ] 39 9
P99-14 [ 'P99-12' ] 34 9
P99-15 [ 'P99-12' ] 20 9
P99-16 [ 'P99-13', 'P99-14', 'P99-15' ] 1 9
P99-17 [ 'P99-16' ] 45 9
P99-18 [ 'P99-16' ] 31 9
P99-19 [ 'P99-16' ] 37 9
P99-20 [ 'P99-16' ] 36 9
P99-21 [ 'P99-16' ] 29 9
P99-22 [ 'P99-16' ] 38 9
P99-23 [ 'P99-16' ] 15 9
P99-24 [ 'P99-16' ] 26 9
P99-25 [
  'P99-17', 'P99-18',
  'P99-19', 'P99-20',
  'P99-21', 'P99-22',
  'P99-23', 'P99-24'
] 2 12 HUMANGATE
```

Machine-checked alongside it:

```
command oracles that INVOKE playwright: 10   {P99-01:2, P99-04:1, P99-05:1, P99-06:1,
                                              P99-08:1, P99-09:1, P99-10:1, P99-25:2}
graph-wide STRING occurrences: playwright=21 (20 inside command: values + 1 context ref)
                               --project=20 (all inside command: values)
                               resolve-check=8  partA_maskfinder=19  glossary-census=25
REFS DROPPED: 0
EXOGENOUS HITS: 0
ORACLES command=59  judge=1  prose=197  missingPathPin=0
CONCURRENT PAIRS=44  COLLIDING=0
D-14/D-24 ancestry: checked (no violations)
pre-marked done: 0
oracle sweep vs unfixed tree: RED=59 GREEN=0
```

B-06's repair, measured the same way the overseer measured the defect — and stated with its
population named: **10 `command:` oracles invoke Playwright**; 21 is the graph-wide string count,
20 of which sit inside those oracles' `command:` values and 1 of which is a context ref. The
pre-revision graph read 0 on all three.

## Decision coverage

```
$ node scripts/decision-coverage.mjs .planning/phases/99-arabic-coverage \
      .planning/phases/99-arabic-coverage/99-CONTEXT.md
passed: true   covered: 39/39
```

**Read it with its mechanism, not as a score.** No citation was added to move the matcher, and none
was removed to lower it.

- **34 are substantive** — the decision is named in a plan whose body acts on it.
- **D-29 was the one real gap** and it is repaired with the substance behind it (§11).
- **D-01, D-03, D-36, D-37 reach the matcher through a single truth in `99-25`** — the truth that
  orders the honored-evidence table for the five waived decisions to travel VERBATIM into the
  register. That truth is load-bearing (it is the waiver's own stated condition), but it is also
  the entire reason those four tokens now match. **The honest reading is 34 substantive + 5 waived
  on machine evidence, not 39 earned.** I am reporting the mechanism rather than the number,
  because deleting a real obligation to make a gate read lower is the same act as adding a token to
  make it read higher.
- **D-39** is cited substantively in fifteen plans: the lane cuts this round performs ARE the D-39
  act.

## Disk state re-verified after the connection loss

The turn that produced these plans died mid-response. Everything was re-checked afterwards against
intent: 25 plan files present, each ending `</output>`; `99-PLAN-INDEX.md` present and ending
`PLAN-INDEX-END`; compile clean at 25 tasks; 59/59 oracles RED; coverage 39/39; 0 refs dropped;
0 exogenous hits; 0 concurrent collisions; 0 pre-marked-done. **Nothing on disk diverges from what
this report describes.**

## What I am NOT claiming

- The estimates in §14 are **floors**, and the two authoring-side estimates (`99-01`, `99-02`) are
  of authored size — a weaker instrument than the measured populations everywhere else. A lane that
  measures over budget at execution is re-cut then, per constraint 4.
- The 50 instrument-absent reds are red for a reason that will change when the instruments land.
  Their discriminating power rests entirely on `99-01`'s and `99-02`'s controls.
- I did not run the Playwright specs (they do not exist) and did not query staging. The C7 fixture's
  CHECK-constraint query is authored as a plan step, not executed here.
- Arabic naturalness beyond the ruled rows remains the operator's, per `RULING-P99-03` #2.

REVISION-END
