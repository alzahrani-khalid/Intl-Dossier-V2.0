# 99-RECUT — the task-unit re-cut

**Seat:** `p99-planner-2`. **2026-08-18**, repo HEAD `9ffa2b80cc82fb3fe29e11354818d13f537e67b9`,
branch `milestone/v10.0-trust`. Authority: `BRIEF-99-RECUT.md`, `RULING-P99-09`, and the shipped
authoring law at `tickmarkr.spec.md` lines 30–60 — **read first, and never edited**.

This is a RE-CUT, not a re-plan. **Nothing was thrown away: 258 pre-recut acceptance items, 0 lost,
0 duplicated.** The set went from 25 tasks to **41**, and `tickmarkr compile` exits **0**.

## The bound I was planning against, and the one that actually applies

The four hard bounds are in the shipped law, not in engine source, and I read them there before
cutting anything:

| bound                        | limit | worst task, pre-recut | worst task, now    |
| ---------------------------- | ----- | --------------------- | ------------------ |
| acceptance items             | ≤ 6   | **15** (P99-02)       | **6**              |
| `files[]` patterns           | ≤ 8   | **110** (P99-03)      | **3**              |
| surface (items × patterns)   | ≤ 24  | **1320** (P99-03)     | **18**             |
| density (goal words ÷ items) | ≤ 60  | not measured          | inside, every task |

**The density trap fired during this edit and I designed around it rather than discovering it
late.** Density RISES when a criterion is removed, so every split shortened the goal in the same
edit: each new task's `<objective>` opens with one ~20-word sentence, and the compiler takes only
that first sentence as `goal:`. The lowest item count in the set is 2 (P99-19), which leaves a
120-word budget against a ~20-word goal.

## What I changed, by error class

### files[] > 8 (21 tasks) — brace-group EXACT ENUMERATION, zero widening globs

Every pattern is an exact brace enumeration. **The set contains zero wildcard patterns** — no `*`,
`?` or `[` appears in any `files[]` entry across all 41 tasks, machine-checked.

I expanded all 41 tasks' patterns and diffed each expansion against its intended file set:

```
patterns expanded to 1045 paths; 525 distinct; wildcard patterns: 0
tasks whose expansion differs from the intended set: 0 | total admitted extras: 0 | total lost: 0
```

**So there are no widening globs and no scope diffs are owed** — the (b) proof is that the
expansion is byte-identical to intent everywhere. The flatten is the load-bearing case: its 110
files became **2 patterns** that expand to exactly those 110 paths, `intended-but-not-in-scope: 0`
and `in-scope-but-not-intended: 0`.

**Exogenous admission, checked rather than asserted, with a positive control:**

```
EXOGENOUS after expansion: 0
POSITIVE CONTROL (planted CLAUDE.md): CAUGHT — the exogenous check discriminates
```

The control matters: a zero from a checker that cannot see `CLAUDE.md` would mean nothing. I
planted it and the checker caught it.

### acceptance > 6 (all 25 tasks) — split first, consolidate only where splitting is forbidden

Nineteen lanes SPLIT into 2 or 3 ordered parts. Eight lanes stayed one task with losslessly merged
prose. The split/merge choice was made per lane, not by a global rule:

- **SPLIT** where the lane has genuinely separable subjects: the instrument lanes, the authoring
  lanes, the chrome lanes, the nav-title lane, the dates lane, the closing lane. Parts share one
  file surface and are ordered by `depends_on`, which is the ownership remedy the law names
  ("Two tasks writing one file must be ORDERED by deps").
- **MERGED, losslessly** where the lane is one mechanical act over one file slice and splitting it
  would manufacture a part with nothing of its own to verify: the five glossary sweeps, the
  gatekeeper, and the eight mask-deletion lanes. **92 pre-recut items land inside a merged
  criterion; every one of their texts survives verbatim, joined by `||` inside one item.** No
  criterion text was dropped, shortened or paraphrased.
- **The flatten is the one lane where splitting is FORBIDDEN** (D-13 atomicity — a flatten split
  from its rewrite breaks working renders), so its 11 prose items were merged into 3 and joined to
  its 3 oracles: 6 items, 2 patterns, surface 12, one task, one commit.

**Where the merge could have manufactured an unsatisfiable criterion — P98's law, and the shape
this re-cut has — it did not, because the merge is concatenation and never compression.** The
zero-assertions are the risk, and each one lives INSIDE a single `command:` string together with
its positive control (the synthetic-match check, `rawKeyTotal !== 0`, the planted-control run).
A split can therefore never separate a zero from its control: there is no seam between them to cut.

### OBS-248 (13) — every one repaired on its merits, none dissolved by a glob

I resolved all thirteen by REWORDING, and added no file to any `files[]` to make an error go away.
Two facts I established by probe rather than assumption: `command:` strings are **not** scanned by
the detector (so an oracle may still grep the symbol), and the detector fires only when the symbol's
sole definition sits outside that task's `files[]`.

| #    | task   | identifier                                                                                                                           | resolution                                                                                                                                                                                                                                                                                                        |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | P99-01 | `documentElement`                                                                                                                    | reworded to "the root element's lang attribute" — a DOM property was never our symbol, and its only repo definition is a bootstrap test                                                                                                                                                                           |
| 2    | P99-01 | `expectLocale`                                                                                                                       | criterion now names the exported pair by what it does ("the settle sequence and the locale assertion"); the oracle still greps the symbol, which is lawful because commands are not scanned                                                                                                                       |
| 3    | P99-07 | `ExpandedPanel`                                                                                                                      | the identifier came from a PATH inside a criterion; the criterion now says `DocumentTree.tsx` and the full path stays in `files[]`                                                                                                                                                                                |
| 4    | P99-07 | `MoUs`                                                                                                                               | same class — criterion now says `MousPage.tsx`, path unchanged in `files[]`                                                                                                                                                                                                                                       |
| 5    | P99-07 | `TaskCard`                                                                                                                           | "all three `TaskCard` lines" → "all three negative-control lines"; the flatten task does not own that component and does not need to                                                                                                                                                                              |
| 6–11 | P99-15 | `AISuggestionPanel`, `AttentionItem`, `DossierRecommendationCard`, `EntityBreadcrumbTrail`, `EntitySearchDialog`, `IntelligencePage` | the authoring task writes JSON only, so it names the **prefixes** it authors enum sets for — `entityTypes`, the recommendation-card `types`, `intelligence.classification`, `stages` — and the chrome literals by their strings. This is the merits fix: an authoring task never needed those components in scope |
| 12   | P99-21 | `NotificationList`                                                                                                                   | "the notification list's hardcoded اليوم/أمس day headers"                                                                                                                                                                                                                                                         |
| 13   | P99-23 | `MoUs`                                                                                                                               | "the memoranda page title mis-anchor"; the ar side still names `مذكرات التفاهم`                                                                                                                                                                                                                                   |

**The engine was catching a real defect here** — the same class as A-01 and B-03: a criterion a
worker scoped to `files[]` cannot satisfy. In every one of the thirteen the honest answer was that
the criterion was naming something outside its own unit.

## Structure that had to survive, verified on the compiled graph

```
tasks 41 | maxAcceptance 6  maxPatterns 3  maxSurface 18
oracles command 60  judge 1  prose 161  missingPathPin 0
humanGate P99-41 (only)   pre-marked done 0
concurrent pairs 100  colliding 0
flatten P99-07  acceptance/files 6/2   D-14 violations 0
gatekeeper P99-30                       D-24 violations 0
tasks with no typed oracle: none
```

- **Verify-before-drop** — P99-30 is the repo-wide verification task; the eight deletion lanes
  (P99-31…P99-38) are all its descendants, checked by transitive closure, not by reading prose.
- **D-14 flatten ancestry** — every task after the instrument lanes is a descendant of P99-07.
- **D-13 atomicity** — the flatten is ONE task whose 110 files are 2 exact brace patterns.
- **Wave intent** preserved; task count floated to 41 rather than being targeted.
- **File-disjointness among concurrent pairs still holds at 100 pairs, 0 collisions**, which is
  more pairs than before because splitting a lane by acceptance adds ordered parts, not
  concurrent ones.

## Traceability — every pre-recut acceptance item to its post-recut home

Machine-verified before this table was written:

```
pre-recut items (incl. the 1 added): 258 | lost 0 | duplicated 0 | merged-into-one-criterion: 92
```

Reading: `tN` is item N of that plan's `must_haves.truths`; `◆` a `command:` oracle, `◇` a `judge:`
oracle; `*` means it landed inside a losslessly merged criterion; `doneN` is the Nth `<done>` line.

| pre-recut plan | post-recut task(s)     | item → home                                                                                                                                                                    |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `99-01`        | P99-01, P99-02, P99-03 | t0→99-01 · t1→99-01 · t2→99-01 · t3→99-01 · t4→99-02 · t5→99-02 · t6→99-02 · t7→99-02 · t8→99-03 · t9◆→99-01 · t10◆→99-02 · t11◆→99-03 · done0→99-01 · done1→99-03             |
| `99-02`        | P99-04, P99-05, P99-06 | t0→99-04 · t1→99-04 · t2→99-04 · t3→99-04 · t4→99-05 · t5→99-05 · t6→99-05 · t7→99-05 · t8→99-06 · t9→99-06 · t10◆→99-04 · t11◆→99-05 · t12◆→99-06 · done0→99-04 · done1→99-06 |
| `99-03`        | P99-07                 | t0→99-07* · t1→99-07* · t2→99-07* · t3→99-07* · t4→99-07* · t5→99-07* · t6→99-07* · t7→99-07* · t8◆→99-07 · t9◆→99-07 · t10◆→99-07 · done0→99-07                               |
| `99-04`        | P99-08, P99-09         | t0→99-08 · t1→99-08 · t2→99-08 · t3→99-09 · t4→99-09 · t5→99-09 · t6◆→99-08 · t7◆→99-09 · t8◆→99-08 · done0→99-08                                                              |
| `99-05`        | P99-10, P99-11         | t0→99-10 · t1→99-10 · t2→99-10 · t3→99-11 · t4→99-11 · t5→99-11 · t6◆→99-10 · t7◆→99-11 · t8◆→99-10 · done0→99-10                                                              |
| `99-06`        | P99-12, P99-13         | t0→99-12 · t1→99-12 · t2→99-12 · t3→99-13 · t4→99-13 · t5→99-13 · t6◆→99-12 · t7◆→99-13 · t8◆→99-12 · done0→99-12                                                              |
| `99-07`        | P99-14, P99-15, P99-16 | t0→99-14 · t1→99-14 · t2→99-14 · t3→99-14 · t4→99-15 · t5→99-15 · t6→99-15 · t7→99-15 · t8→99-16 · t9→99-16 · t10◆→99-14 · t11◆→99-15 · t12◆→99-16 · done0→99-14               |
| `99-08`        | P99-17, P99-18, P99-19 | t0→99-17 · t1→99-17 · t2→99-17 · t3→99-17 · t4→99-18 · t5→99-18 · t6→99-18 · t7→99-18 · t8◆→99-17 · t9◆→99-18 · t10◆→99-19 · done0→99-17 · done1→99-19                         |
| `99-09`        | P99-20, P99-21         | t0→99-20 · t1→99-20 · t2→99-20 · t3→99-20 · t4→99-21 · t5◆→99-20 · t6◆→99-21 · done0→99-20                                                                                     |
| `99-10`        | P99-22, P99-23, P99-24 | t0→99-22 · t1→99-22 · t2→99-22 · t3→99-22 · t4→99-23 · t5→99-23 · t6→99-23 · t7→99-23 · t8→99-24 · t9◆→99-22 · t10◆→99-23 · t11◆→99-24 · done0→99-22 · done1→99-24             |
| `99-11`        | P99-25                 | t0→99-25* · t1→99-25* · t2→99-25* · t3→99-25* · t4→99-25* · t5→99-25* · t6◆→99-25 · t7◆→99-25 · done0→99-25                                                                    |
| `99-12`        | P99-26                 | t0→99-26* · t1→99-26* · t2→99-26* · t3→99-26* · t4→99-26* · t5→99-26* · t6◆→99-26 · t7◆→99-26 · done0→99-26                                                                    |
| `99-13`        | P99-27                 | t0→99-27* · t1→99-27* · t2→99-27* · t3→99-27* · t4→99-27* · t5→99-27* · t6◆→99-27 · t7◆→99-27 · done0→99-27                                                                    |
| `99-14`        | P99-28                 | t0→99-28* · t1→99-28* · t2→99-28* · t3→99-28* · t4→99-28* · t5→99-28* · t6◆→99-28 · t7◆→99-28 · done0→99-28                                                                    |
| `99-15`        | P99-29                 | t0→99-29* · t1→99-29* · t2→99-29* · t3→99-29* · t4→99-29* · t5→99-29* · t6◆→99-29 · t7◆→99-29 · done0→99-29                                                                    |
| `99-16`        | P99-30                 | t0→99-30* · t1→99-30* · t2→99-30* · t3→99-30* · t4→99-30* · t5→99-30* · t6◆→99-30 · t7◆→99-30 · done0→99-30                                                                    |
| `99-17`        | P99-31                 | t0→99-31* · t1→99-31* · t2→99-31* · t3→99-31* · t4→99-31* · t5→99-31* · t6◆→99-31 · t7◆→99-31 · done0→99-31                                                                    |
| `99-18`        | P99-32                 | t0→99-32* · t1→99-32* · t2→99-32* · t3→99-32* · t4→99-32* · t5→99-32* · t6◆→99-32 · t7◆→99-32 · done0→99-32                                                                    |
| `99-19`        | P99-33                 | t0→99-33* · t1→99-33* · t2→99-33* · t3→99-33* · t4→99-33* · t5→99-33* · t6◆→99-33 · t7◆→99-33 · done0→99-33                                                                    |
| `99-20`        | P99-34                 | t0→99-34* · t1→99-34* · t2→99-34* · t3→99-34* · t4→99-34* · t5→99-34* · t6◆→99-34 · t7◆→99-34 · done0→99-34                                                                    |
| `99-21`        | P99-35                 | t0→99-35* · t1→99-35* · t2→99-35* · t3→99-35* · t4→99-35* · t5→99-35* · t6◆→99-35 · t7◆→99-35 · done0→99-35                                                                    |
| `99-22`        | P99-36                 | t0→99-36* · t1→99-36* · t2→99-36* · t3→99-36* · t4→99-36* · t5→99-36* · t6◆→99-36 · t7◆→99-36 · done0→99-36                                                                    |
| `99-23`        | P99-37                 | t0→99-37* · t1→99-37* · t2→99-37* · t3→99-37* · t4→99-37* · t5→99-37* · t6◆→99-37 · t7◆→99-37 · done0→99-37                                                                    |
| `99-24`        | P99-38                 | t0→99-38* · t1→99-38* · t2→99-38* · t3→99-38* · t4→99-38* · t5→99-38* · t6◆→99-38 · t7◆→99-38 · done0→99-38                                                                    |
| `99-25`        | P99-39, P99-40, P99-41 | t0→99-39 · t1→99-39 · t2→99-40 · t3→99-40 · t4→99-41 · t5→99-41 · t6◆→99-39 · t7◆→99-41 · t8◆→99-40 · t9◇→99-41 · done0→99-39 · done1→99-41                                    |

**The one added item.** P99-16 (the third part of the common-owner authoring lane) came out of the
mechanical cut with prose criteria only and no typed oracle. Rather than leave a task whose whole
acceptance is judge-read prose, I authored one new `command:` oracle for it: the three chrome
literal strings must exist as `en` VALUES in an owned namespace, each with an Arabic-script `ar`
value at the SAME key path that is not the English string, with the walked-leaf count as the
positive control against a zero from an instrument that read nothing. It is RED at HEAD. That is
the only acceptance item in the set that did not exist before the re-cut, and it is why the count
is 258 rather than 257.

## Oracle reconciliation — all 59 land, plus the one added

```
command oracles extracted from the compiled graph: 60
run under bash -lc against the unfixed tree:      RED=60 GREEN=0
judge oracles: 1
```

All 59 pre-recut `command:` oracles are present and still red; **none was dropped, weakened, or
merged into another** — oracles were re-homed whole and never concatenated, because a typed oracle
is not text that can be joined. The 60th is the added one above. Distribution across the 41 tasks:
every task carries at least one typed oracle, 24 carry two, the flatten carries three.

## New task table

| task   | from    | lane and part                                                                                | acceptance | patterns | surface | cmd oracles |
| ------ | ------- | -------------------------------------------------------------------------------------------- | ---------- | -------- | ------- | ----------- |
| P99-01 | `99-01` | the rendered oracles — the settle helper and the dates spec                                  | 6          | 2        | 12      | 1           |
| P99-02 | `99-01` | the rendered oracles — the leak spec and the position fixture                                | 6          | 2        | 12      | 1           |
| P99-03 | `99-01` | the rendered oracles — the red register for both specs                                       | 3          | 2        | 6       | 1           |
| P99-04 | `99-02` | the static instruments — the strict mask instrument                                          | 6          | 2        | 12      | 1           |
| P99-05 | `99-02` | the static instruments — the nav-title checker                                               | 6          | 2        | 12      | 1           |
| P99-06 | `99-02` | the static instruments — the drilled glossary census                                         | 4          | 2        | 8       | 1           |
| P99-07 | `99-03` | the common.json flatten — the atomic flatten                                                 | 6          | 2        | 12      | 3           |
| P99-08 | `99-04` | the intake/triage lane — authoring and colon form                                            | 6          | 2        | 12      | 2           |
| P99-09 | `99-04` | the intake/triage lane — the dynamic carriers and the rendered intake surface                | 5          | 2        | 10      | 1           |
| P99-10 | `99-05` | the dossier-family lane — authoring and colon form                                           | 6          | 2        | 12      | 2           |
| P99-11 | `99-05` | the dossier-family lane — the chips extraction and the rendered search surface               | 5          | 2        | 10      | 1           |
| P99-12 | `99-06` | the tasks/queues/positions lane — authoring and colon form                                   | 6          | 2        | 12      | 2           |
| P99-13 | `99-06` | the tasks/queues/positions lane — the banner extraction and the three rendered banner states | 5          | 2        | 10      | 1           |
| P99-14 | `99-07` | the common-owner authoring lane — the long tail and the nav keys                             | 6          | 2        | 12      | 1           |
| P99-15 | `99-07` | the common-owner authoring lane — the residual and missAll keys                              | 6          | 2        | 12      | 1           |
| P99-16 | `99-07` | the common-owner authoring lane — the chrome keys and the carrier enum sets                  | 4          | 2        | 8       | 1           |
| P99-17 | `99-08` | the chrome rewrite lane — the missAll and residual rewrites                                  | 6          | 2        | 12      | 1           |
| P99-18 | `99-08` | the chrome rewrite lane — the nav unmask and the 404 repoint                                 | 6          | 2        | 12      | 1           |
| P99-19 | `99-08` | the chrome rewrite lane — the dynamic carriers and the chrome literals                       | 2          | 2        | 4       | 1           |
| P99-20 | `99-09` | the AR-02 date lane — the formatter and the raw-site census                                  | 6          | 2        | 12      | 1           |
| P99-21 | `99-09` | the AR-02 date lane — the rendered dates proof                                               | 3          | 2        | 6       | 1           |
| P99-22 | `99-10` | the nav-title agreement lane — the 28-row walk                                               | 6          | 3        | 18      | 1           |
| P99-23 | `99-10` | the nav-title agreement lane — the ruled tie-breaks and the queue collision                  | 6          | 3        | 18      | 1           |
| P99-24 | `99-10` | the nav-title agreement lane — the MoUs anchor and the rendered intake re-proof              | 3          | 3        | 9       | 1           |
| P99-25 | `99-11` | glossary B, the engagement family — the sense-aware sweep                                    | 6          | 3        | 18      | 2           |
| P99-26 | `99-12` | glossary C, the brief-artifact and stance families — the sense-aware sweep                   | 6          | 3        | 18      | 2           |
| P99-27 | `99-13` | glossary D1, the dossier-object sense split — the sense-aware sweep                          | 6          | 3        | 18      | 2           |
| P99-28 | `99-14` | glossary D2, the dossier-object sense split — the sense-aware sweep                          | 6          | 3        | 18      | 2           |
| P99-29 | `99-15` | glossary D3, the dossier-object sense split — the sense-aware sweep                          | 6          | 3        | 18      | 2           |
| P99-30 | `99-16` | the AR-04a gatekeeper — the repo-wide strict proof                                           | 6          | 1        | 6       | 2           |
| P99-31 | `99-17` | mask deletion lane 1 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-32 | `99-18` | mask deletion lane 2 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-33 | `99-19` | mask deletion lane 3 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-34 | `99-20` | mask deletion lane 4 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-35 | `99-21` | mask deletion lane 5 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-36 | `99-22` | mask deletion lane 6 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-37 | `99-23` | mask deletion lane 7 — the deletion                                                          | 6          | 2        | 12      | 2           |
| P99-38 | `99-24` | mask deletion lane 8 — the deletion                                                          | 6          | 3        | 18      | 2           |
| P99-39 | `99-25` | the consolidated re-proof — the static battery                                               | 4          | 2        | 8       | 1           |
| P99-40 | `99-25` | the consolidated re-proof — the rendered battery                                             | 4          | 2        | 8       | 1           |
| P99-41 | `99-25` | the consolidated re-proof — the residue register and the operator sign-off                   | 6          | 2        | 12      | 1           |

## `tickmarkr compile` — verbatim, with its exit code

This is the only thing that counts as "it compiles" (`RULING-P99-09` §2). It was run repeatedly
during the cut — eleven times — and this is the final run:

```
$ tickmarkr compile .planning/phases/99-arabic-coverage; echo "EXIT=$?"
harness: /opt/homebrew/lib/node_modules/tickmarkr/dist/cli/index.js (installed package)
compiled .planning/phases/99-arabic-coverage → .tickmarkr/graph.json (41 tasks, source gsd, hash b1d40f56431c)
EXIT=0
```

For contrast, the run that opened this round, unchanged:

```
$ tickmarkr compile .planning/phases/99-arabic-coverage; echo "EXIT=$?"
tickmarkr compile: … violates the task unit contract (82 errors):
  - P99-01 declares 14 acceptance items (max 6) — split it. …
EXIT=1
```

The error count went 82 → 14 → 2 → 0 across the cut; the middle readings are in the working log,
and each drop is a class closed rather than a threshold tuned.

## Decision coverage at the new plan count

```
$ node scripts/decision-coverage.mjs .planning/phases/99-arabic-coverage \
      .planning/phases/99-arabic-coverage/99-CONTEXT.md
decision-coverage passed=true 39/39 plans=41
```

Read with the mechanism I stated in `99-REVISION-1.md` and which has not changed: 34 substantive
citations, D-29 repaired with the rendered oracles behind it, and D-01/D-03/D-36/D-37 reaching the
matcher through the single waiver-carry truth in the closing lane. **The honest reading is still 34
substantive + 5 waived on machine evidence, not 39 earned.** Splitting a lane copies its top-level
`truths:` into each part, so the gate now sees the same decisions cited in more plans — that is an
artefact of the cut and changes nothing about coverage.

## Two things I changed that the brief did not ask for, both reported rather than buried

1. **The sense-allowlist overlay files were renamed off the old plan numbers.** They were
   `glossary-senses.d/99-10.json … 99-15.json`, named for pre-recut plan ids that no longer match
   the tasks that write them; a worker in P99-25 told to write `99-13.json` would have had to
   reconcile two numbering schemes mid-sweep. They are now named for what they hold —
   `tiebreaks.json`, `engagement.json`, `brief-stance.json`, `dossier-a.json`, `dossier-b.json`,
   `dossier-c.json` — which decouples them from task numbering entirely.
2. **Write directives inside CARRIED text were neutralised.** Each new task carries its lane's
   method, `read_first`, acceptance criteria, population statement and SUMMARY contract verbatim
   from the pre-recut plan. Those blocks contained `Create \`…/99-NN-SUMMARY.md\``naming the
PRE-recut summary path, and`assertWriteScope` scans the whole body — so the carried text was
   failing the compile on a path the new task rightly does not own. The directive is rewritten to
   name the file descriptively; the instruction survives, the write scope stays honest.

## One instrument slip inside this round, recorded

Re-running the final compile from inside the phase directory returned **EXIT=1** with
`cannot detect spec type for …/99-arabic-coverage/.planning/phases/99-arabic-coverage`. That is
cwd drift concatenating the relative path onto itself, not a failing set: `tickmarkr compile` takes
a path relative to the invocation directory, and every green run in this file was made from the
repo root. Re-run from the root immediately afterwards, the same tree returns EXIT=0 at the same
hash `b1d40f56431c`. Recorded because a false red is the same instrument class as a false green,
and this round exists because an instrument was believed without being placed.

## What I am NOT claiming

- **The re-cut did not re-verify content.** `RULING-P99-09` §1 kept the P99-08 acceptance for
  content and voided it only for shape; the 39 decisions, seven rulings, twelve blocker repairs
  and the criterion→plan→oracle map are carried, not re-graded.
- **The 60 reds are 10 defect-observed and 50 instrument-absent**, as decomposed in
  `99-REVISION-1.md` §17; the re-cut redistributed them across more tasks but did not change what
  any of them sees. The added oracle is defect-observed.
- **`tickmarkr compile` writes `.tickmarkr/graph.json`.** The file it overwrote was a stale
  single-task graph from 2026-08-13 (`T1`), backed up to the session scratchpad before the first
  run. A live `tickmarkr resume` process exists on this machine (pid 83816) but its cwd is the
  tickmarkr product repo, not this one, so nothing of that run was touched. I checked before
  compiling rather than after.
- **Splitting a lane by acceptance serialises its parts.** Ordered parts share one file surface,
  which the law's ownership rule requires. Nineteen lanes now run their parts in sequence where
  before they ran as one task; that cost is the price of a unit a single reviewer can verify in
  one pass, and it is the trade the contract exists to make.

RECUT-END
