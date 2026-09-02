---
phase: 99-arabic-coverage
plan: 39
status: blocked
attempt: 3
verified_at_local: 2026-09-02T05:15:15+03:00
verified_at_utc: 2026-09-02T02:15:15Z
head: 7101b876bfbfb444dab5ab71b0d95007c10568ce
---

# Phase 99 consolidated re-proof register

## Verdict

The fresh static battery is green, re-run in attempt 3 with every recorded output reproduced byte
for byte (99-39-SUMMARY.md section 13). The consolidated re-proof is **not complete**: the
plan-owned rendered gate collected the hardcoded 8- and 10-test populations, then correctly exited
3 before execution because TCP 5173 is held by PID 95414 rooted at
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend`, outside this worktree.
RULING-P99-537 forbids reusing that foreign holder. Terminating a process rooted in the main
checkout is outside this task's authority. Consequently criteria 2 and 3 have no fresh executed
result from this task, and no prior or alternate-port result is used as a substitute.

Attempt 3 established the holder's provenance (99-39-SUMMARY.md sections 14 and 15): it was
spawned at 04:37:35 local by this tickmarkr run's own baseline pass, which executed this task's
rendered oracle in the main checkout before any worker existed. Because the oracle invokes
Playwright ad hoc, the config's lease writer ran unleased and detached and the dev server outlived
the baseline. The blocker is therefore the harness's own leak, not a human's server, and attempts
0 through 3 have all refused it. Release rests with the harness operator. `head` above is the
tree the evidence was taken against; this record's own commit is its child.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | Fresh oracle in this task | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object and nav label agrees with the page-title object term | P99-23–29; consolidated by P99-39 | `nav-title-agreement.mjs` control then live; `glossary-census.mjs` control then repo-wide live and `--census` | Nav planted mismatch caught and positive agreement preserved. Glossary control caught unlisted profile, plural, and دوسييه cases while preserving legal senses. | **GREEN static proof.** Nav/title: 28/28 adjudicated, 25 agreements, 3 value-locked overseer escalations, zero unruled mismatch/missing anchor/coverage defect. Glossary: 17,022 Arabic leaves in every one of 129 bundle files; all seven ruled rows drilled; `ruled=1657`, `allowlisted=292`, `UNCLASSIFIED=0`. |
| 2. Arabic dates/times, no English weekday/month names, deliberate Latin digits | P99-09 and the P99-39 consolidated gate | Plan-owned typed Playwright gate over `99-ar02-dates.spec.ts` | Spec existence and a hardcoded collection count of 8 run before execution; static date checker has the 29-importer live control beside the zero exempt-file importers. | **NOT PROVEN in this task.** Collection reached 8, but the shared typed gate stopped on the foreign port holder before any of the 8 tests executed. The static date checker is green over 1,533 non-test files with zero unexcused sites and zero debt. |
| 3. No English under `dir="rtl"`, including 404, intake, search chips, and the three fixture-driven position banners | P99-04/05/06/08; consolidated by P99-39 | Plan-owned typed Playwright gate over `99-ar03-leak.spec.ts` | Spec existence and a hardcoded collection count of 10 run before execution; the three banner tests are part of that ten-test population. | **NOT PROVEN in this task.** Collection reached 10, but the shared typed gate stopped on the foreign port holder before execution. Therefore there is no fresh 10/10 result and no fresh result for the three banner fixtures. No leg is recorded `NOT CONSTRUCTED`; this is an explicit `INSTRUMENT-CANNOT-RUN`. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39 | strict audit self-check then live JSON; maskfinder control then live; `neg-taskcard` before `resolve-check` | Strict self-check passes 18 named checks and its live `rawKeyTotal=8518` proves the walk is nonempty. Maskfinder asserts two true/two false polarities. `neg-taskcard` prints exactly three `MISS=true` rows plus a resolving contrast before the live routing check. | **GREEN static proof.** Strict audit: 1,532 production files, `twoArgTotal=0`, all EN/AR unresolved counters zero, `rawKeyTotal=8518`. Maskfinder: zero prefixes. Resolution: 214 lookups across 11 routings × 2 locales, zero routing misses. Negative control: 3/3 `MISS=true`. |

No earlier SUMMARY contributes a green to this table. Their values are used only for lineage,
bounds, and named residues.

## Static battery register

| Instrument | Population and what falls outside it | Fresh control -> live result |
| --- | --- | --- |
| Nav/title agreement | Exactly the 28 live modern-nav rows and their named rendered-title anchors in both locale bundles/source anchors. Outside: routes not present in the modern-nav population and naturalness beyond the ruled object term. | planted mismatch caught + positive agreement preserved -> 28/28 adjudicated; 25 agree; 3 escalated; zero unruled/missing/coverage defects |
| Glossary census | Every string leaf in all `frontend/src/i18n/ar/*.json`: 17,022 leaves, 129 files, seven ruled rows. Outside: source literals, English bundles, and Arabic naturalness outside the ruled/sense-overlay terms. | synthetic illegal senses caught and legal senses retained -> classification totals `1657 / 292 / 0` ruled / allowlisted / unclassified |
| Strict i18n audit | 1,532 production `.ts/.tsx` files under `frontend/src`, excluding tests and i18n data; both locales; canonical resolver and `translation -> common` alias. Outside: runtime-only rendering, nonliteral dynamic domains, and files outside `frontend/src`. | 18 self-check predicates green, fixture `rawKeyTotal=2` -> live `rawKeyTotal=8518`, `twoArgTotal=0`, every unresolved EN/AR counter zero |
| Dynamic-prefix maskfinder | Production `.ts/.tsx` dynamic template/concatenation prefixes under `frontend/src`. Outside: static keys, reachability, rendering, unmodelled prop-bound `t`, and non-frontend source. | known true/false object-prefix pairs 4/4 -> zero unresolved prefixes |
| Resolution check | Its explicitly enumerated 11 routing families, 214 bilingual lookups. Outside: routings not in the table, rendering, interpolation, plural behavior, and Arabic quality. | fixed broken TaskCard routing prints 3 × `MISS=true` plus resolving assignments contrast before live run; live own negative and positive controls also discriminate -> zero routing misses |
| Date-format checker | 1,533 non-test frontend files, with two allowlist files and six named permanent exemptions; import census guards the dead-code exemption. Outside: runtime rendering, test files, and the expressly named allowlist/exemptions. | dead exemption importers 0 while live comparison component has 29 importers -> zero unexcused sites; zero debt |
| Completion contract | Every `99-NN-SUMMARY.md` that exists. Missing future summaries are outside by presence-implies-marker design; an empty directory exits 3. | synthetic directory: markerless member gives 1/2 and exit 1 -> live phase directory was 59/59 before this task's blocked SUMMARY was created |

The exact static command oracle from `99-39-PLAN.md` was rerun after this register existed and
exited 0. Its control-first output is recorded verbatim in `99-39-SUMMARY.md`. This closes the
task's static gate independently of the still-blocked rendered gate.

## Rendered population and port ruling

The population is exactly these two files under `chromium-en`, `--no-deps`:

- `tests/e2e/99-ar02-dates.spec.ts`: hardcoded expected count 8.
- `tests/e2e/99-ar03-leak.spec.ts`: hardcoded expected count 10, including
  `UI99-C7 ar banner under_review`, `approved`, and `published`.

Outside: every other Playwright spec/project, screenshots or prose from older waves, diagnostic
alternate-port runs, and any response served by another checkout. The typed gate's result was:

```text
INSTRUMENT-CANNOT-RUN: port 5173 held by pid 95414 rooted at /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend, which is NOT this worktree; refusing to measure a foreign tree
```

No process was killed, no holder identity was disguised, no alternate port was treated as the
plan-owned gate, and no `18 passed` line was asserted. Attempt 3 re-ran the unchanged gate from
05:13:40 to 05:13:41 local on 2026-09-02 (02:13:40Z) with identical output and exit status 3; the
collection counts were separately re-derived at 8 and 10, with the three `UI99-C7 ar banner`
tests listed inside the ten.

The harness's baseline pass recorded this same oracle as "already passes before any work exists"
at 01:39:15Z, which means the baseline executed the 18 tests green in the main checkout at base
ref `e2a21dc85`. That is provenance for the leak, not this task's gate result, and it is not
entered in the criterion table.

## D-19 reversal record

Carried from the nav/title lane for the still-open human reversal window:

| Decision | Before | After |
| --- | --- | --- |
| Countries requirement arrow | nav `البلدان`; title `نظرة عامة على الدول` | nav `الدول`; title unchanged |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات` | nav/title `المشاركات` |
| PERSONS tie-break | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts` | AR nav/title `الأشخاص`; EN title `Persons` |
| POSITIONS tie-break | nav `المواقف`; title `مكتبة المواقف` | **NO EDIT** |
| DASHBOARD tie-break | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات` | nav/title `لوحة الدوسيهات` |
| Intake collision | nav `قائمة الاستقبال`; title `قائمة الانتظار` | nav/title `قائمة الاستقبال`; waiting queue remains `قائمة الانتظار` |
| MoUs title anchor | H1 `common:mous.title`; generic copy `Title` / `العنوان` | H1 `common:mous.pageTitle`; page copy/nav `MoUs` / `مذكرات التفاهم` |

Three further pairs remain escalated, value-locked, and not silently counted as agreements:
`navigation.admin`, `navigation.taskQueue`, and `navigation.newEvent`.

## Decision coverage and human gate

| Decision | How this register honors it |
| --- | --- |
| D-02 | Every one of the four ROADMAP criteria has a named plan, oracle, control, population, and observed state. |
| D-05 | Every instrument above states both its population and what falls outside it. |
| D-07 | Criteria 2 and 3 remain open because rendered execution did not occur; static/source evidence is not substituted. |
| D-09 | The own-gate collection controls hardcode 8 and 10 and run before execution; a spec path is treated as a filter, not proof of existence. |
| D-19 | The reversal table and three escalated pairs are visible while the human checkpoint remains open. |
| D-35 | The formerly undriven 404, intake-ar, search-chip, and three banner-state legs all exist in the 10-test spec, but this task does not claim their execution. |
| D-38 | Not answered by this worker. The overseer decides rendered sign-off in writing and the orchestrator executes approval. P99-41 remains the named checkpoint owner. |

## Honored-evidence table for the five citation-truth waivers

This table carries the five decisions the overseer accepted as set-level truths on machine
evidence. The honest reading remains **34 substantive + 5 waived on machine evidence, not 39
earned**.

| Waived decision | Honored machine evidence |
| --- | --- |
| D-01 | The compiled plan set maps requirements AR-01, AR-02, AR-03, AR-04a, and AR-04b onto closing plans; the four-criterion map above preserves the separate AR-04 halves. |
| D-03 | Exogenous admission was measured at zero, with a planted `CLAUDE.md` positive control caught (`99-RECUT.md`). |
| D-36 | Every compiled plan names its own SUMMARY in `files_modified`; completion is separately guarded by the presence-implies-marker check. |
| D-37 | Compiled command oracles carry their own `PATH="/opt/homebrew/bin:$PATH"`; the plan report measured `missingPathPin=0`. |
| D-39 | Concurrent plan pairs were machine-checked file-disjoint; the recut measured 100 pairs and 0 collisions. |

## Residue and bounds register

- **P99-39 blocking instrument condition:** a foreign-worktree holder owns TCP 5173. Authorized
  owner release, followed by the unchanged typed gate, is required. This is not a product residue
  and is not a bounded pass.
- **Engine residue, needs a ruling:** the P99-39 rendered oracle invokes Playwright ad hoc, so
  the config's `pw-run-reaped.mjs --lease-exec` wrapper runs unleased and detached and leaks its
  dev server after every green run, including the harness's baseline pass in the main checkout.
  The leaked server is foreign to every other tree, so the port guard blocks the next gate that
  runs these specs (P99-40 and P99-41 after P99-39's own). The in-repo fix is to route the oracle
  through `scripts/pw-run-reaped.mjs --` RUN mode, as P99-08's oracle does, or to reap after the
  baseline. This is plan text outside this task's write scope.
- **D-38:** human visual/product sign-off is not answered here. P99-41 owns presentation of the
  Arabic surfaces and the overseer's written decision.
- **Phase 102:** D-21's working ~7,086-site dot-to-colon convention tail (new scope, after flatten,
  with resolution checks); COPY-09's three literals (`HelpPage:166`, `useBriefingBooks:164-165`,
  `PositionTrackerCard:93`); EDGECOPY-01's two edge functions; GUIDE-HOLLOW-01's seven bodies.
- **Phase 103:** the 39 criterion-1 members Phase 98 triaged by reading.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows.
- **Nav-title overseer rulings:** `admin`, `taskQueue`, and `newEvent` remain explicit escalations,
  not agreements.
- **Named lane handoffs:** `positions:draftBanner` remains an un-authored fourth banner branch;
  the `common:optional`, `afterActions.*`, `contributors`, `days`, reminder-shape, and
  WorkItemLinker handoffs remain named in P99-13/P99-43. The double-prefixed authoring queue itself
  was closed by later source re-pointing; the fresh strict/mask/resolve zeros find no AR-04
  remainder from it.

## Required continuation

The harness operator releases PID 95315 (`pnpm run dev`, ppid 1) and its child PID 95414 (vite),
both rooted in the main checkout's `frontend` with zero established connections at the attempt-3
census. Then rerun the exact P99-39 rendered command oracle. Only
an unanchored-but-digit-bounded `18 passed` match **and** Playwright exit status 0 can close
criteria 2 and 3. Then rerun the exact static oracle, rerun the completion negative/live pair after
writing a `status: complete` SUMMARY, and hand the rendered surfaces to P99-41's human gate.

At the blocked record, the live completion oracle honestly reports the present breach:
`59/60 SUMMARY files carry the marker`, with `99-39-SUMMARY.md` named as pending. This is expected
until, and only until, the rendered gate actually executes green.
