# Phase 102 — Staging Data & Debt Tail — PLAN INDEX

Planned 2026-09-10 by the planner seat `plan102` (w0:pH0) under `.tickmarkr/overseer/BRIEF-102-PLANNER.md`,
from HEAD `3ec257adc` on `milestone/v10.0-trust`. Compiler **tickmarkr 2.5.1** (binary == `package.json`).
19 plans = 19 engine tasks (brief guidance was 10-16; the task-unit surface bound `items x patterns <= 24`
forced the COPY-09 lanes and the instrument plans apart rather than squeezing them). No plan is human-gated
(102-CONTEXT.md D-25: every row closes on staging + repo state). Every `command:` oracle below was run from
the repo root before it was written down, and its body in the plan is byte-identical to the drilled file.

**REVISION 1 (2026-09-10 ~22:12-22:25 local, 19:12-19:25Z, HEAD `00b328c2e`)** applied the plan-check findings F-01..F-19 (`102-PLAN-CHECK.md`); see `## REVISION-1 NOTES` below. Every oracle that changed was re-drilled from the repo root and its row is marked `re-drilled rev-1`. **REVISION 2 (2026-09-10 ~22:38-22:50 local, 19:38-19:50Z, HEAD `4ac54821c`)** applied `102-PLAN-CHECK-2.md` G-01, G-02, G-04..G-07 as written and turned G-03/G-08 into `## PRE-RUN CHECKLIST` below; see `## REVISION-2 NOTES`. Rows marked `re-drilled rev-2`. The dry-run block below is the post-revision-2 output (hash `fb052d0adc59`; rev-1 was `cdee0118406c`).

## Wave table

| wave | plan | rows | depends_on | files (patterns) | acceptance items |
|---|---|---|---|---|---|
| 1 | 102-01 | GATESTD-01..05 | — | 4 | 6 |
| 1 | 102-02 | COPY-09 (instrument + carve-outs) | — | 3 | 3 |
| 2 | 102-03 | DELEG-02, SEED-DELEG-01 | — | 3 | 5 |
| 2 | 102-04 | WRITER-ROUTE-01, INSERT-SYNC-01 | — | 4 | 5 |
| 2 | 102-05 | P52FIXTURE-01, ENGREAD-01 | — | 3 | 4 |
| 2 | 102-06 | DATA-02 | 102-05, 102-07 | 4 | 4 |
| 2 | 102-07 | DATA-01 (clause 2: suite teardown) | — | 3 | 4 |
| 2 | 102-08 | GUIDE-HOLLOW-01, PARALLEL-TRUTH-01, COPY-09 (dossier ns) | 102-02 | 4 | 5 |
| 2 | 102-09 | COPY-09 lane 1 (common, assignments, dossiers) + hardcoded-literal sites | 102-02 | 7 | 3 |
| 2 | 102-10 | COPY-09 lane 2 (committees, empty-states, legislation, compliance) | 102-02 | 5 | 3 |
| 2 | 102-11 | COPY-09 lane 3 (user-management, working-groups, workflow-automation, dashboard-widgets) | 102-02 | 5 | 3 |
| 2 | 102-12 | COPY-09 lane 4 (contacts, positions, advanced-search, validation) | 102-02 | 5 | 3 |
| 2 | 102-13 | EDGECOPY-01 | 102-05 | 2 | 4 |
| 2 | 102-14 | PREVIEW-HOLLOW-01 | — | 8 | 3 |
| 2 | 102-15 | CARRY-06 | — | 3 | 4 |
| 2 | 102-16 | CARRY-08, ROUTE-ORPHAN-01 | — | 3 | 4 |
| 3 | 102-17 | CARRY-07 | 102-03, 05, 08..14 | 4 | 3 |
| 3 | 102-18 | DATA-01 (clause 1: purge) | 102-03, 06, 07 | 2 | 4 |
| 4 | 102-19 | closing register (all 22) | 102-01..18 | 3 | 3 |

`wave` is informational; `depends_on` is the order the engine enforces. 102-06 -> 102-07 (rev-1, F-03): the two plans write the same staging populations (e2e-97-01 persons, `E2E MoU %`), so the residue delete waits for the teardown. W3's purge additionally requires
Phase 101 CLOSED (D-04) - stated as a precondition in 102-18's `<context>`/`<read_first>`, checked by the
worker, not encoded as a human gate.

## Criterion -> plan -> oracle map (22 register rows + 5 roadmap criteria)

| register row | plan | closing oracle(s) | RED-at-HEAD evidence |
|---|---|---|---|
| DATA-01 (roadmap 1) | 102-18 purge; 102-07 teardown | O18 (auth.users==13, keep-list 13, public.users 13, profiles 13); O18b (export CSV rows == deleted, csv mtime < first delete, population left 0 - rev-1 F-08); O07a/O07b (run spec, rows left 0) | 415 13 415 415; export_dir=absent; accidental run left 1 person + 1 MoU |
| DATA-02 (roadmap 2) | 102-06 (+102-05 for the P52 name) | O06a (all-text-column sweep with the BOUNDED regex + the lowercase `\ye2e-` clause - rev-1 F-01 / rev-2 G-01: named 0, class 0, control >=1); O06b (rename set 10/6/3/1 of 16) | named=7 class=204 control=2 (rev-2; rev-1 without the e2e- clause measured 66, the unbounded form 219); 0 0 0 0 16 |
| SEED-DELEG-01 | 102-03 | O03a (deployed my-delegations 200, total=3, then active_only=true -> total=2 with no revoked row - rev-1 F-12); O03b (1/1/1/3 rows) | 500 QUERY_FAILED (both calls); 0 0 0 0 |
| DELEG-02 | 102-03 | O03a + O03c (deploy proof: 4 slug versions > HEAD 3/5/5/4 - rev-1 F-07) + judge (four functions on permission_delegations) | 500; advanced=0/4 |
| WRITER-ROUTE-01 | 102-04 | judge (executor authors its own STATUS_TO_STAGE map mirroring tasks.service.ts:87 and writes workflow_stage for tasks - rev-1 F-11) + O04a/O04b + O04c (deploy proof: 2 slug versions > HEAD 4/6 - rev-1 F-07) | BEFORE UPDATE only; born [pending review]; advanced=0/2 |
| INSERT-SYNC-01 | 102-04 | O04a (trigger BEFORE INSERT OR UPDATE); O04b (rolled-back INSERT born consistent) | same |
| P52FIXTURE-01 | 102-05 | O05a (5==5, both ids seeded, P52 renamed) | 5 3 0 0 |
| CARRY-06 (roadmap 3) | 102-15 | O15a (3/3 + 5/5 fixtures in the 14-day window); O15b (two-clock invariance run); judge pins mask == `.week-date` only, the three b0000002 titles visible before each capture, no baseline regeneration (rev-1 F-09) | 0 0 3 5; no such test title |
| CARRY-07 (roadmap 4) | 102-17 | O17 (entry path/gzip unchanged AND assert-size-limit-matches exit 0 AND size-limit exit 0 AND limit < 500 KB - rev-1 F-06) | shape ok, limit 500 KB, exit 1, 516.25 kB |
| CARRY-08 (roadmap 5) | 102-16 | O16a (three summaries, 9/9/7 verdict rows) | all absent |
| GUIDE-HOLLOW-01 | 102-08 | O08a (8/8 types x 4 leaves, en and ar) + judge (authored Arabic, sentence case, colour-map delegation hunk, grid order - rev-1 F-10) | en=1/8 ar=1/8 |
| EDGECOPY-01 | 102-13 | O13 (produced PDF: Deadline + الموعد النهائي, control Priority; prints EMBED-CAUSE on non-200) + O13b (deploy proof: 6 slug versions > HEAD 2/5/2/2/11/5 - rev-1 F-07) + judge (embed repair commitments->aa_commitments + six copy sites - rev-1 F-02) | real id 404, EMBED-CAUSE PGRST200 (observed, not inferred); advanced=0/6 |
| COPY-09 | 102-02 instrument; 102-08 (dossier); 102-09..12 lanes | O02 (controls 4/4, 129 ns, NS line ends `carve_rows=`, every NS `carved==carve_rows` at HEAD with the non-candidate `ns:key` list on failure, carve-out data rows >=1 excluding the header - rev-2 G-02/G-06); O08c/O09/O10/O11/O12 (candidates==carved AND carved==carve_rows, ar_missing_keys=0 - rev-1 F-05) | instrument absent; scratch census dossier 253, common 225, ... |
| GATESTD-01 | 102-01 | O01a (C9b line executed on two ids) | no case line |
| GATESTD-02 | 102-01 | O01b (enabled=8, P93 waiver=present) | script absent |
| GATESTD-03 | 102-01 | O01c (total=5 covered=5 on the sub-lettered fixture) | total=3 |
| GATESTD-04 | 102-01 | judge (C1 third direction, presence-shaped only) | — (judge) |
| GATESTD-05 | 102-01 | O01d (nested=4 selfref=5) | nested=0 selfref=0 |
| ENGREAD-01 | 102-05 | O05b (render probe expected=2) + the verdict line (NOT-REPRODUCED-AT-RENDER or REPRODUCED-WITH-CAUSE) | spec absent; API 200/5 on both paths |
| PREVIEW-HOLLOW-01 | 102-14 | O14 (0/0/0 objects remain, control dossiers present) | 3 5 3 1 |
| ROUTE-ORPHAN-01 | 102-16 | O16b (14 rows with class + ruling) | record absent |
| PARALLEL-TRUTH-01 | 102-08 | `test:` vitest leaf title verbatim (element-equality of the three arrays) + O08a's plan judge scope | no such test (the -t filter selects zero -> fails closed) |

Roadmap criteria 1-5 map to DATA-01, DATA-02, CARRY-06, CARRY-07, CARRY-08 respectively (D-01).
None of the 22 rows is deferred; every row has a plan.

## Human-gated task list

None. `autonomous: true` on all 19 (D-25). Rule-3 acts (git push, PR, branch protection, production
droplet) appear in no plan. Staging deploys (102-03: 4 functions; 102-04: 2; 102-13: 6) and staging
migrations/seeds (102-04, 102-14; 102-03, 102-05, 102-06, 102-15) are worker acts using the 100-16 command
shape with telemetry disabled.

## Drilled-oracle table

Every row was run from `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0` at HEAD `3ec257adc`
on 2026-09-10 between 21:30 and 21:55 local (18:30-18:55Z). Scratch files live under this session's
scratchpad (`oracles/`); the plan bodies embed them verbatim. "DB family" = the psql preamble shared by
every psql oracle, drilled fail-closed via `O04a.e3` and `O15a.e3`; "node-repo family" = the repo-root
guard shared by the node oracles, drilled via `O02.e3`; "pw family" = the wrapper preamble, drilled via
`O05b.e3`.

| oracle file (scratch) | plan | truth # | exit at HEAD | last stdout line at HEAD | fail-closed drill (`cd` to an empty dir, no `.env.test`) | verdict |
|---|---|---|---|---|---|---|
| `O01a.sh` | 102-01 | 1 | 1 | `FAIL: GATE-STANDARD.md C9b still carries no fail-closed case line (the sed escape line fails open on macOS)` | exit 3: `INSTRUMENT-CANNOT-RUN: .planning/GATE-STANDARD.md absent - not at the repo root` | RED (exit 1) at HEAD |
| `O01b.sh` | 102-01 | 2 | 1 | `FAIL: scripts/config-step-artifacts.mjs does not exist - config-enabled steps are still enumerated from memory` | exit 3: `INSTRUMENT-CANNOT-RUN: .planning/config.json or .planning/phases absent - not at the repo root` | RED (exit 1) at HEAD |
| `O01c.sh` | 102-01 | 3 | 1 | `FAIL: extractor tracks 3 of 5 decisions - sub-lettered ids D-03a/D-03b are still dropped` | exit 3: `INSTRUMENT-CANNOT-RUN: scripts/decision-coverage.mjs absent - not at the repo root` | RED (exit 1) at HEAD |
| `O01d.sh` | 102-01 | 4 | 1 | `FAIL: gate-drill.mjs re-entrancy guards absent or wrongly coded (nested=0 selfref=0) - nested must exit 4, a self-referential phase dir must exit 5, neither may time out` | exit 3: `INSTRUMENT-CANNOT-RUN: scripts/gate-drill.mjs absent - not at the repo root` | RED (exit 1) at HEAD |
| `O02.sh` | 102-02 | 1 | 1 | `FAIL: scripts/titlecase-census.mjs does not exist - the COPY-09 instrument is not in the repo` | exit 3: `INSTRUMENT-CANNOT-RUN: frontend/src/i18n/en absent - not at the repo root` | RED (exit 1) at HEAD; **re-drilled rev-2** (G-02: HEAD-time `carved == carve_rows` per NS line + `CARVE-NONCANDIDATE ns:key` list in the FAIL; G-06: `carveout_rows` excludes the header) - exit 1, same line; the new clauses drilled on the reference instrument with a scratch two-non-candidate table: `NS common ... carved=0 ... carve_rows=2` / `CARVE-NONCANDIDATE common:sla.breach` / `CARVE-NONCANDIDATE common:no.such.key` -> `ns_carved_ne_carve_rows=1 noncandidate_rows=[common:sla.breach common:no.such.key ]` -> FAIL; positive control with a real candidate row (`common:notFound.title`): `carved=1 carve_rows=1`, no CARVE line; header-only table -> `carveout_rows=0` (was 1); **re-drilled rev-1** (F-05: the NS-line regex now requires the trailing `ar_extra_keys= carve_rows=`; the reference instrument in the plan body prints `carve_rows`) - exit 1, same line |
| `O03a.sh` | 102-03 | 1 | 1 | `FAIL: my-delegations answered 500 - the handler still reads the phantom relation or the deploy did not land` | exit 3: `INSTRUMENT-CANNOT-RUN: SUPABASE_URL/ANON_KEY/TEST_USER_EMAIL/TEST_USER_PASSWORD not all set - .env.test not materialised` | RED (exit 1) at HEAD; **re-drilled rev-1** (F-12: second curl `active_only=true` appended, asserts total=2 and no revoked/inactive row) - exit 1, same last line; `active_only=true` observed directly at HEAD: http=500 QUERY_FAILED |
| `O03c.sh` (new, rev-1 F-07) | 102-03 | 3 | 1 | `FAIL: not every function was deployed after HEAD - the staging version did not advance for the slugs marked (>base) with version<=base` (magnitude line: `P102-03-DEPLOY advanced=0/4 my-delegations=3(>3) delegate-permissions=5(>5) revoke-delegation=5(>5) deactivate-user=4(>4)`) | exit 3 in an empty dir: `INSTRUMENT-CANNOT-RUN: supabase/functions absent - not at the repo root`; exit 3 with a bogus `SUPABASE_ACCESS_TOKEN`: `INSTRUMENT-CANNOT-RUN: supabase functions list exited 1 (CLI not logged in or no network) :: unexpected list functions status 401` | RED (exit 1) at HEAD; CLI IS logged in on this machine (versions read live 2026-09-10 22:14 local) |
| `O03b.sh` | 102-03 | 2 | 1 | `FAIL: permission_delegations does not hold exactly the three seeded rows for the test user (one granted, one received, one revoked)` | DB family (O04a.e3 / O15a.e3: same preamble) | RED (exit 1) at HEAD |
| `O04a.sh` | 102-04 | 1 | 1 | `FAIL: trg_sync_task_status still fires on UPDATE only - a row can be born divergent` | O04a.e3 | RED (exit 1) at HEAD |
| `O04b.sh` | 102-04 | 2 | 1 | `FAIL: a task inserted with workflow_stage=review and no status is born [pending review] - INSERT-time sync is absent` | DB family | RED (exit 1) at HEAD |
| `O04c.sh` (new, rev-1 F-07) | 102-04 | 3 | 1 | `FAIL: not every function was deployed after HEAD - ...` (`P102-04-DEPLOY advanced=0/2 workflow-executor=4(>4) tasks-create=6(>6)`) | deploy family (O03c drills: empty dir exit 3; bogus token exit 3) | RED (exit 1) at HEAD |
| `O05a.sh` | 102-05 | 1 | 1 | `FAIL: dossiers type=engagement (5) and engagement_dossiers (3) disagree - an engagement dossier still has no extension row` | DB family | RED (exit 1) at HEAD |
| `O05b.sh` | 102-05 | 2 | 1 | `FAIL: frontend/tests/e2e/102-engagements-render.spec.ts does not exist - the /engagements render probe was not authored` | exit 3: `INSTRUMENT-CANNOT-RUN: not in a git tree` | RED (exit 1) at HEAD; the browser leg was NOT launched (spec absent -> exit 1 before the wrapper) |
| `O06a.sh` | 102-06 | 1 | 1 | `FAIL: 7 text cells still carry one of the four named internal-artifact strings (derived copies in rag_chunks / mou_notification_queue count)` (magnitude line: `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=204 control_cells=2`) | DB family | RED (exit 1) at HEAD; **re-drilled rev-2** (G-01: third clause `or %I ~ '\ye2e-'` + eighth `%I`; class 66 -> 204 = 66 + 138 (`dossiers.name_en` 69 + `persons.last_name_en` 69, measured); `public.users.email ~ '\ye2e-'` = 0, measured); **re-drilled rev-1** (F-01: the plan body now carries the BOUNDED regex `\yE2E\y\|\yUAT\y\|Phase [0-9]+\|staging verification` + `~* \yfixture\y`; class cells 219 (unbounded, HEAD now) -> 66 (bounded); keep-list `public.users.email` under the bounded form: 0 cells, measured) |
| `O06b.sh` | 102-06 | 2 | 1 | `FAIL: id-pinned seed rows still carry test vocabulary in en or ar (persons 0/10, working groups 0/6, SRTL-02 calendar rows 0/3, b0000003 commitment 0/1)` | DB family | RED (exit 1) at HEAD |
| `O07a.sh` | 102-07 | 1 | NOT RUN as written | `(an earlier draft of this oracle was run by mistake at 21:39 local - see 'Side effects'; the draft's census line: `P102-07-EO run_rc=0 passed=0 failed=0 rows_left_from_this_run=1`)` | pw family (O05b.e3: same preamble) | RED evidence from the accidental run: the spec leaves what it creates; the oracle as written parses the wrapper report and was only `bash -n` checked (brief rule 4) |
| `O07b.sh` | 102-07 | 2 | NOT RUN as written | `(an earlier draft of this oracle was run by mistake at 21:39 local - see 'Side effects'; the draft's census line: user-management timed out (unexpected=1), mou-create passed 2/2 and left 1 MoU)` | pw family | RED evidence from the accidental run: the spec leaves what it creates; the oracle as written parses the wrapper report and was only `bash -n` checked (brief rule 4) |
| `O08a.sh` | 102-08 | 1 | 1 | `FAIL: the type-guide body is still hollow for some types or locales (en=1/8(missing:country,organization,forum,engagement,topic,working_group,person) ar=1/8(missing:country,organization,forum,engagement,topic,working_group,person)` | exit 3: `INSTRUMENT-CANNOT-RUN: frontend/src/i18n/{en,ar}/dossier.json absent - not at the repo root` | RED (exit 1) at HEAD |
| `O08c.sh` | 102-08 | 3 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | node-repo family (O02.e3: same guard) | RED (exit 1) at HEAD; **re-drilled rev-1** (F-05: awk gains `carved==carve_rows`) - exit 1, same line; the awk clause drilled on two synthetic NS lines (`carved=3 carve_rows=3` counted, `carved=2 carve_rows=3` NOT counted: at_end_state=1 of 2) |
| `O09.sh` | 102-09 | 1 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | node-repo family | RED (exit 1) at HEAD; **re-drilled rev-1** (F-05 awk clause) - exit 1, same line |
| `O10.sh` | 102-10 | 1 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | node-repo family | RED (exit 1) at HEAD; **re-drilled rev-1** (F-05 awk clause) - exit 1, same line |
| `O11.sh` | 102-11 | 1 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | node-repo family | RED (exit 1) at HEAD; **re-drilled rev-1** (F-05 awk clause) - exit 1, same line |
| `O12.sh` | 102-12 | 1 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | node-repo family | RED (exit 1) at HEAD; **re-drilled rev-1** (F-05 awk clause) - exit 1, same line |
| `O13.sh` | 102-13 | 1 | 1 | `FAIL: pdf-generate answered 404 for after-action 905b6a3a-4c94-482f-9857-d268cc4d3ea5 - no artifact was produced to verify (embed probe above names the PostgREST cause when the fetch is the reason)`; the two lines above it: `BODY {"error":"not_found","message":"After-action record not found"}` and `EMBED-CAUSE {"code":"PGRST200","details":"Searched for a foreign key relationship between 'after_action_records' and 'commitments' in the schema 'public', but no matches were found.","hint":"Perhaps you meant 'aa...` | O13 empty-dir run (exit 3, see below) | RED (exit 1) at HEAD; **re-drilled rev-1 on the REAL id** (F-02) - the 404 is the `commitments(*)` embed at pdf-generate/index.ts:318 (PGRST200), observed in this seat's own read-only curl; with `aa_commitments(id)` the same record returns decisions=1 aa_commitments=1 risks=0 follow_up_actions=0 (http 200). No storage object was written (the function 404s before writing). `grep -rln "commitments(\*)" supabase/functions/` -> pdf-generate only (no sibling carries the embed) |
| `O13b.sh` (new, rev-1 F-07) | 102-13 | 2 | 1 | `FAIL: not every function was deployed after HEAD - ...` (`P102-13-DEPLOY advanced=0/6 bot-notification-dispatcher=2(>2) contextual-suggestions=5(>5) data-export=2(>2) data-import=2(>2) pdf-generate=11(>11) relationship-health=5(>5)`) | deploy family | RED (exit 1) at HEAD |
| `O14.sh` | 102-14 | 1 | 1 | `FAIL: preview-layout objects survive on staging (tables=3/3 functions=5/5 types=3/3) - the drop migration was not authored or not applied` | DB family | RED (exit 1) at HEAD |
| `O15a.sh` | 102-15 | 1 | 1 | `FAIL: 0 of 3 fixture engagements and 0 of 5 fixture calendar entries fall inside the next 14 days - the dashboard fixtures are anchored to a past capture date` | exit 3: `INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset - .env.test not materialised in this worktree` | RED (exit 1) at HEAD |
| `O15b.sh` | 102-15 | 2 | 1 | `FAIL: the spec carries no test titled 'dashboard snapshots survive a date change' - the two-clock invariance test was not authored` | pw family | RED (exit 1) at HEAD; the browser leg was NOT launched (spec absent -> exit 1 before the wrapper) |
| `O16a.sh` | 102-16 | 1 | 1 | `FAIL: 0 of 3 quick-task SUMMARY.md files exist with a ## Tasks table carrying every task (9/9/7, derived from the PLAN.md headings) with a verdict per row` | node-repo family (O16b.e3) | RED (exit 1) at HEAD |
| `O16b.sh` | 102-16 | 2 | 1 | `FAIL: 102-ROUTE-DISPOSITIONS.md does not exist - the 14 orphan routes have no recorded disposition` | exit 3: `INSTRUMENT-CANNOT-RUN: phase dir absent - not at the repo root` | RED (exit 1) at HEAD |
| `O17.sh` | 102-17 | 1 | 1 | `FAIL: size-limit exit 1 - the entry chunk exceeds the configured budget` (new magnitude line first: `P102-17-SHAPE entry_path=[dist/assets/app-*.js] gzip=[true] assert_matches_exit=0`) | exit 3: `INSTRUMENT-CANNOT-RUN: frontend/.size-limit.json absent - not at the repo root` (re-drilled rev-1) | RED (exit 1) at HEAD; **re-drilled rev-1** (F-06: path/gzip/assert-size-limit-matches clauses) |
| `O18.sh` | 102-18 | 1 | 1 | `FAIL: auth.users=415 public.users=415 profiles=415 - fixture accounts (or their mirror rows) remain beyond the 13 real accounts` | DB family | RED (exit 1) at HEAD |
| `O18b.sh` (new, rev-1 F-08) | 102-18 | 2 | 1 | `FAIL: no p102-prepurge-* export directory exists under /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer - the purge script never exported before deleting (or never ran)` (`P102-18-EXPORT export_dir=absent`) | exit 3 in an empty dir: `INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset - .env.test not materialised in this worktree` | RED (exit 1) at HEAD; **re-drilled rev-2** (G-05: `-le` on csv_mtime vs first_delete_epoch; the plan now orders a trailing newline on the CSV) - exit 1, same line |
| `O19.sh` | 102-19 | 1 | 1 | `FAIL: 0 of 18 sibling plans carry a status: complete SUMMARY` | exit 3: `INSTRUMENT-CANNOT-RUN: .planning/phases/102-staging-data-debt-tail absent - not at the repo root` | RED (exit 1) at HEAD |

## Side effects of the drill (reported, not repaired)

At 21:39 local an EARLIER DRAFT of O07a/O07b was executed to observe its HEAD state. The draft called
`scripts/pw-run-reaped.mjs`, which exists and is tracked at HEAD (Phase 101 planning), and which is
silent on stdout, so the planner did not recognise that Playwright had been launched until the post-run
census returned rows. This violated brief rules 2 and 4. Measured consequences, read-only, 21:41 local:

- `dossiers` gained ONE row: `0f691f9a-a674-4bfd-8e29-32f9788f3d76 | e2e-97-01-elected-official-1789065577437`
  (the 97 spec passed 5/5 and, having no teardown, left it: TOTAL e2e-97-01 persons now 69, was 68).
- `mous` gained ONE row: `4ee63ae3-2503-4cbe-85a2-682ec830c76e | E2E MoU 1789065604648` (mou-create passed 2/2).
- `auth.users` gained NOTHING: user-management's create test TIMED OUT at 30 s before creating its account
  (`frontend/test-results/pw-reaped-fe29379d57cfe08269ae56e59c30f2bd.json`, stats expected=2 unexpected=1).
- Reports: `test-results/pw-reaped-b3791fb429e31ba45fdfa80407e0164a.json` (root, 5 passed) and the frontend
  one above. No lease survived (`.pw-leases/` empty in both dirs); no 5173 listener remained.

Nothing was deleted by the planner (a second write). 102-06's DELETE statements are prefix-scoped
(`e2e-97-01-elected-official-%`, `E2E MoU %`) so both rows fall inside its population; the two ids are
named in 102-06's `<objective>` and the closing judge in 102-19 confirms their deletion. The user-management
timeout is now a stated obligation of 102-07 (its oracle fails on it by design).

## `tickmarkr compile --dry-run` output (verbatim, final plan set)

Command: `PATH="/opt/homebrew/bin:$PATH" tickmarkr compile /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail --type gsd --dry-run` -> **exit 0** (revision 2, 2026-09-10 ~22:41 local, HEAD `4ac54821c`; `tickmarkr version` = 2.5.1).
39 `OBS-170` lines (one per task per phase-dir context file: `102-CONTEXT.md` / `102-RESEARCH.md` are
untracked in the checkout - the orchestrator commits the phase dir before the run, D-28 / F-04) are elided below
after the first two; the rest of the output is verbatim:

```
tickmarkr: OBS-170: task P102-01 context ".planning/phases/102-staging-data-debt-tail/102-CONTEXT.md" exists in your checkout but is NOT in a worker's worktree. To make it worker context: git add -f .planning/phases/102-staging-data-debt-tail/102-CONTEXT.md && git commit. Staging alone is not enough.
tickmarkr: OBS-170: task P102-01 context ".planning/phases/102-staging-data-debt-tail/102-RESEARCH.md" exists in your checkout but is NOT in a worker's worktree. To make it worker context: git add -f .planning/phases/102-staging-data-debt-tail/102-RESEARCH.md && git commit. Staging alone is not enough.
... (37 more OBS-170 lines, identical shape, for P102-02..P102-19)
harness: /opt/homebrew/lib/node_modules/tickmarkr/dist/cli/index.js (installed package)
validated /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail (19 tasks, source gsd, hash fb052d0adc59) — dry run; no graph written
```

`dryrun_exit=0`; OBS-170 count 39; zero other `tickmarkr:` lines (no OBS-248, no ownership-lint). Revision 1's block (hash `cdee0118406c`) is superseded by this one.

In-process parse after revision 1 (unchanged by revision 2 - no task's item or pattern COUNT changed: 102-08's sibling `command-palette-order.ts` joined the existing brace as a fourth alternative in ONE pattern, so files=4 acc=5 surface=20 holds) (`compileGsd`, surface = items x patterns): 19 tasks, no HUMANGATE, every surface <= 24 -
P102-03 files=3 acc=5 surface=15; P102-04 files=4 acc=5 surface=20 (brace `{workflow-executor,tasks-create}`); P102-08 files=4 acc=5
surface=20 (three components braced into one pattern - the compiler accepted the mixed-extension brace); P102-13 files=2 acc=4 surface=8;
P102-18 files=2 acc=4 surface=8; P102-06 deps [P102-05, P102-07]; all other rows unchanged from the plan check's §A table.
The first rev-1 dry-run raised two OBS-248 identifier errors (`is_active` in 102-03's new active-filter text, `dossierTypeColors` in 102-08's
new judge) - both reworded to describe the behaviour without the symbol; the second dry-run is the one pasted above.

Earlier dry-runs (all fixed before this one): (1) context refs to files a task CREATES (`102-COPY09-CARVEOUTS.md`
from 102-02) - removed, deps carry it; (2) OBS-248 "criterion identifier defined outside files[]" x7
(`QueryErrorState`, `is_active`, `entity_type`, `documentElement`, `MoUs`, `IntakeForm`, `IntakeQuickForm`) -
criteria reworded, the C9b probe id changed to `some.file.test` and O01a re-drilled (still RED, exit 1);
(3) ownership-lint `unordered-context-write` x5 against 102-17's `frontend/src/**` glob and 102-06's seed
file - 102-17 now depends on 03, 05, 13 as well, and 102-15 quotes the seed offsets instead of ref'ing 060.

## UNSETTLED

1. **D-03 (`test:` oracles for browser legs) is unsatisfiable under the live gate config.** `.tickmarkr/config.yaml`
   GATEFIX-3 dispatches `oracle: test` ONLY as `pnpm --filter intake-frontend exec vitest run -t <title>`; a
   Playwright spec is never selected, so the gate fails closed. ENGREAD-01 (102-05), CARRY-06 (102-15) and the
   teardown runs (102-07) are therefore `command:` oracles that launch the spec through `scripts/pw-run-reaped.mjs`
   and parse the published report's `stats`. Consequence: the browser leg of O05b/O15b was NOT exercised tonight
   (rule 4); O07a/O07b were exercised by mistake (above). PARALLEL-TRUTH-01 keeps a real `test:` oracle because
   it is a vitest test in the frontend workspace. RULED 2026-09-10 22:20 by the D-03 amendment in 102-CONTEXT.md (F-13a): command-via-wrapper is the lawful form; the browser legs stay un-exercised tonight (F-14 accepted as stated - both fail closed on absence, so the risk is a stuck task, not a false green; the overseer may run O05b/O15b once outside the P100 window).
2. **The decision-coverage gate cannot see this phase's decisions.** `scripts/decision-coverage.mjs` requires a
   `<decisions>` block with `**D-NN:**` lines; `102-CONTEXT.md` (like 100/101) uses `### D-NN —` headings, so the
   script reports `skipped: true`. Every plan still carries one `Decisions covered - D-NN:` truth (rule 5). WAIVED by D-29
   (2026-09-10, F-17): the manual census is 29 decisions each cited by a plan truth; no context restructuring.
3. **D-22's numbers do not reproduce.** The three quick PLAN.md files carry 9 / 9 / 7 task headings (25), not
   research §9's 24 nor D-22's 8/10/7. W4-E5 "PARTIAL" does not reproduce either: `IntakeForm.tsx:490` and
   `IntakeQuickForm.tsx:385` both resolve `intake:actions.submitRequest` for the idle label (research compared the
   pending-branch key `form.creating`). 102-16 records W4-E5 DONE and edits no form; D-22's "unify" is moot.
4. **Research §12's per-namespace numbers do not reproduce exactly** with the reproduced instrument (dossier 253 vs
   268, common 225 vs 231, ...). The lane oracles therefore assert `candidates == carved` and `ar_missing_keys == 0`,
   never an absolute count; the shipped instrument (102-02) is the authority from its first run.
5. **DATA-02's class regex was changed from the research form** (rev-1: the plan BODY now carries it - the plan check found the body still had the unbounded `~*` form; corrected under F-01, class cells 66 at HEAD). `~* 'UAT'` matches "evaluation"/"graduate";
   the oracle uses case-sensitive word-bounded `\yE2E\y|\yUAT\y|Phase [0-9]+|staging verification` plus
   case-insensitive `\yfixture\y`, over ALL 1,929 text/varchar columns (214 cells at HEAD). The survivors
   outside the named residue were enumerated (persons.biography_en x10, dossiers.description_en x11,
   dossier_relationships.notes_en x7, positions.content_en x3, engagements.location_en, calendar_entries.description_en,
   public.users.full_name x3 on the keep-list e2e accounts) and are now 102-06 obligations. `positions.content_en`
   ("Deterministic rendered-oracle fixture for <status>") may be pinned by a P95/P96 spec by text - 102-06 greps first
   and STOPs if so (an extra file outside its files_modified).
6. **CARRY-07's direction is reversed from the roadmap** (F-13b: the 476 -> <500 deviation is RECORDED in D-21's deviation note, 102-CONTEXT.md, not this seat's to change): the on-disk dist is 516.25 kB, OVER 500 KB, so the
   required CI check is red today; 102-17 measures on a fresh build before choosing a target (D-21) and may
   legitimately end with the limit at 500 KB and a recorded number if app-code moves cannot reach it.
7. **ENGREAD-01 does not reproduce at the API** (both paths 200 with 5 rows); 102-05's render probe decides it and
   no repair is planned for a cause nobody has seen (D-19).
8. **The P101 precondition for the purge (D-04)** is a `<read_first>` check in 102-18 (seven 101-*-SUMMARY.md with
   status: complete and the overseer's P101 acceptance note). At planning time 0 of 7 exist; the engine's
   `depends_on` cannot express a cross-phase edge, so the overseer sequences it.
9. **PARALLEL-TRUTH-01's `test:` oracle needs three module-private arrays exported** (GUIDE_GRID_TYPES,
   VALID_TYPES, DOSSIER_TYPE_ORDER); if CommandPalette.tsx cannot be imported under the frontend vitest config,
   102-08 moves the array to a sibling module and says so - the production consumers are unchanged either way.
10. **Deploy credentials inside a worktree** (Supabase CLI login) are unrecorded for P100's workers as well
    (research §19). 102-03/04/13 end ok:false with `INSTRUMENT-CANNOT-RUN: deploy` if the CLI is not logged in,
    committing the repaired files for the orchestrator to deploy from the checkout.

## REVISION-1 NOTES (F-NN -> what changed; file + truth #)

- **F-01** 102-06 truth 1 (O06a): class clause replaced by the bounded form `(%I ~ '\yE2E\y|\yUAT\y|Phase [0-9]+|staging verification' or %I ~* '\yfixture\y')` (format() gains one `%I` argument); `text:` states the keep-list emails match no clause (measured 0 cells in `public.users.email`) and the new RED (named=7 class=66 control=2). Re-drilled: exit 1.
- **F-02** 102-13: action step 1 now opens with the fetch-embed repair `commitments(*)` -> `aa_commitments(*)` at pdf-generate/index.ts:313-321 (decisions/risks/follow_up_actions verified resolving; siblings grepped - none carry the embed); the judge (truth 3) names that hunk first; truth 1 (O13) prints an `EMBED-CAUSE` line on any non-200 and its `text:` records the observed real-id cause (404 <- PGRST200), replacing the inference; the D-13 truth line mentions the embed repair. Re-drilled on the real id: exit 1, cause visible.
- **F-03** 102-06 `depends_on: [102-05, 102-07]`; D-27 truth text says why. Wave table updated.
- **F-04** Orchestrator's act (commit the phase dir before `tickmarkr run`) - not this seat's; the 39 OBS-170 lines in the dry-run are that.
- **F-05** 102-02 (instrument reference in the action, truth 1 O02): NS line gains `carve_rows=<rows in the carve-out table for the ns>`; O02's shape regex pins it. 102-08 truth 3 (O08c) and 102-09/10/11/12 truth 1: awk gains `carved==carve_rows`; `text:` explains the lowercased-carve-out trap. Re-drilled: exit 1 each (instrument absent); the awk clause drilled on synthetic NS lines.
- **F-06** 102-17 truth 1 (O17): asserts entry `path === dist/assets/app-*.js`, `gzip === true`, and `node frontend/scripts/assert-size-limit-matches.mjs` exit 0 before the limit check; new `P102-17-SHAPE` magnitude line. Re-drilled: shape ok, exit 1 on the budget.
- **F-07** New deploy-proof command truths: 102-03 truth 3 (O03c: my-delegations=3, delegate-permissions=5, revoke-delegation=5, deactivate-user=4), 102-04 truth 3 (O04c: workflow-executor=4, tasks-create=6; files braced `{workflow-executor,tasks-create}` -> 4 patterns x 5 items = 20), 102-13 truth 2 (O13b: bot-notification-dispatcher=2, contextual-suggestions=5, data-export=2, data-import=2, pdf-generate=11, relationship-health=5). Each asserts every slug's `version` from `supabase functions list -o json` is strictly greater than the value recorded at HEAD (read live 2026-09-10 22:14 local - the CLI is logged in on this machine); exit 3 when not logged in (drilled with a bogus token: 401 -> exit 3) or outside the repo. Re-drilled: advanced=0/4, 0/2, 0/6 -> exit 1.
- **F-08** 102-18 truth 2 (O18b): newest `.tickmarkr/overseer/p102-prepurge-*/auth_users_fixtures.csv` data rows == `deleted=` in `magnitudes.txt`, CSV mtime < `first_delete_epoch=`, purge population left 0; the judge (truth 3) and action step 1 name the CSV, the magnitudes file and the UNCONDITIONAL export path. Re-drilled: export_dir=absent -> exit 1.
- **F-09** 102-15 judge (truth 3): mask is EXACTLY `[widget.locator('.week-date')]` (WeekAhead.tsx :66-73); before each capture the three b0000002 titles (`Bilateral consultation — ESCWA`, `Prep session — G20 Data Gaps Initiative`, `Delegation visit — Indonesia BPS`, read from staging 2026-09-10) must be visible; the baseline-regeneration clause is struck (any mismatch -> ok:false with the diff artefact path). Action step 2 repeats the three rules.
- **F-10** 102-08 truth 4: new judge (authored Arabic, sentence case / no marketing voice, the colour-map delegation hunk, GUIDE_GRID_TYPES / VALID_TYPES / DOSSIER_TYPE_ORDER hunks with production consumers unchanged, string-value-only namespace edits); the three components braced into one `files_modified` pattern -> 4 patterns x 5 items = 20. The compiler accepted the mixed-extension brace (dry-run exit 0).
- **F-11** 102-04 D-12 truth, judge (truth 4), action step 2 and the context ref note: the executor AUTHORS a module-level `STATUS_TO_STAGE` mirroring `backend/src/services/tasks.service.ts:87` (verified by git grep: the only definition) and throws a named error on an unmapped status - never `?? newStatus`; ":87-93" dropped.
- **F-12** 102-03 truth 1 (O03a): second curl `?active_only=true` asserting http=200, total=2, zero revoked/inactive rows (`P102-03-ACTIVE` line). Re-drilled: exit 1 (first call 500; `active_only=true` also 500 at HEAD, observed).
- **F-13** RULED in 102-CONTEXT.md (D-03 amendment, D-21 deviation note) - no plan change; UNSETTLED 1 and 6 updated to cite the rulings.
- **F-14** Accepted as the index states (rule 4 of the revision brief); O05b/O07a/O07b/O15b were `bash -n` checked only and are NOT RUN (pw wrapper) - unchanged from the planning drill.
- **F-15** One sentence in 102-03 action step 2, 102-05 action step 1, 102-15 action step 1 (and its judge): seed free text must not match 102-06's class regex.
- **F-16** Does NOT reproduce on disk: `tail -c 12 | od -c` on all 19 plans shows exactly one `</output>\n`; `grep -c '</output>'` = 1 per file. The duplicate the checker saw is the tool-result wrapper (`<output>...</output>`) around a `cat`, not the file. No edit made.
- **F-17** Waived by D-29 (no context restructuring); UNSETTLED 2 updated.
- **F-18** Flagged, not split (the checker's own verdict: "not wrong"); 102-06 and 102-08 each remain one retry budget. Recorded here so the overseer can pre-authorise a second attempt.
- **F-19** Drift recorded: O06a class cells 214 (planning drill) -> 219 (plan check, unbounded form) -> 66 (rev-1, bounded form); verdicts unchanged.
- Two OBS-248 identifier errors surfaced by the first rev-1 dry-run (`is_active`, `dossierTypeColors`) were reworded in 102-03 truth 1 `text:` and 102-08 truth 4 - behaviour described, symbol not named. `102-VALIDATION.md` rows for 102-03/04/06/13/17/18 and the COPY-09 lanes updated to match, and its "Known limits" no longer claims the O13 real-id RED is inferred.

## PRE-RUN CHECKLIST (G-03, F-04, G-08, D-04 - operator acts, in this order, immediately before `tickmarkr run`)

1. **Deploy-proof bases (G-03).** Re-read the 12 slug versions with
   `PATH="/opt/homebrew/bin:$PATH" supabase functions list --project-ref zkrcjzdemdmwhearhfgg -o json`
   and compare with the literals below. For every slug whose live `version` exceeds its literal, patch the literal
   in the named truth to the live value (the oracle asserts strictly-greater-than the base), re-run
   `tickmarkr compile ... --dry-run`, and record the read's timestamp here. A base that lags the live version
   makes that slug's clause pre-green (P100-17's fresh attempt redeploys `relationship-health` - the concrete vector).
   Literals at HEAD `4ac54821c`, re-read 2026-09-10 22:39:46 +03 (19:39:46Z) - all 12 equal the live versions:

   | truth | slug | literal | live 22:39 | live updated_at |
   |---|---|---|---|---|
   | 102-03 #3 (O03c) | my-delegations | 3 | 3 | 2026-08-15T17:32Z |
   | 102-03 #3 (O03c) | delegate-permissions | 5 | 5 | 2026-08-15T11:11Z |
   | 102-03 #3 (O03c) | revoke-delegation | 5 | 5 | 2026-08-15T11:01Z |
   | 102-03 #3 (O03c) | deactivate-user | 4 | 4 | 2026-08-16T15:39Z |
   | 102-04 #3 (O04c) | workflow-executor | 4 | 4 | 2026-07-13T13:51Z |
   | 102-04 #3 (O04c) | tasks-create | 6 | 6 | 2026-07-13T12:27Z |
   | 102-13 #2 (O13b) | bot-notification-dispatcher | 2 | 2 | 2026-08-15T11:10Z |
   | 102-13 #2 (O13b) | contextual-suggestions | 5 | 5 | 2026-07-13T13:47Z |
   | 102-13 #2 (O13b) | data-export | 2 | 2 | 2026-08-15T11:11Z |
   | 102-13 #2 (O13b) | data-import | 2 | 2 | 2026-08-15T10:59Z |
   | 102-13 #2 (O13b) | pdf-generate | 11 | 11 | 2026-07-13T12:26Z |
   | 102-13 #2 (O13b) | relationship-health | 5 | 5 | **2026-09-10T18:02Z (today - P100-17; expect it to advance again)** |

   Timestamp of the pre-run read: _______ (fill in; if any literal was patched, name it and the new dry-run hash).
2. **Commit the phase dir (F-04).** `git add -f /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail && git commit` - after step 1's patch (if any) and after every other edit; workers cannot read an untracked phase dir (the 39 OBS-170 lines).
3. **`.tickmarkr/graph.lock` free (G-08).** At 22:39 it is held by pid 56857 (`tickmarkr resume run-20260910-112306-0000000000000075 --graph-changed`, ALIVE by `kill -0`). Never two runs in one repo: wait for that run's run-end event, then confirm the holder pid is dead before `tickmarkr run`.
4. **P101 precondition for 102-18 (D-04).** `ls /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/101-ci-gates-green/101-*-SUMMARY.md` must list seven files (0 at 22:39). Until then 102-18 stays parked (UNSETTLED-8); its `read_first` re-checks this before executing.
5. (Still open from pass 1/2, outside plan text.) The overseer's written acceptance of D-21's 476 -> <500 deviation (F-13b).

## REVISION-2 NOTES (G-NN -> what changed; file + truth #; new drill exit / last line)

- **G-01** 102-06 truth 1 (O06a): class predicate gains the third clause `or %I ~ ''\\ye2e-''` (lowercase, hyphen-anchored, case-sensitive) and `format()` gains the eighth `%I`; the FAIL text names the new clause; `text:` records the population it adds (138 = `dossiers.name_en` 69 + `persons.last_name_en` 69) and that `public.users.email ~ '\ye2e-'` = 0 (measured, the keep-list emails carry `e2e.test`). Re-drilled: exit 1, `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=204 control_cells=2` / `FAIL: 7 text cells still carry one of the four named internal-artifact strings ...` - class 66 -> **204** as the remedy predicted.
- **G-02** 102-02 reference instrument (action step 1) + truth 1 (O02): the per-namespace record carries `nonCandidate` (carve keys for the ns that are not current candidates) and, when `--carveouts` is given, one `CARVE-NONCANDIDATE <ns>:<key>` line is printed per such row after the NS lines; O02 counts NS lines with `carved != carve_rows` (`ns_carved_ne_carve_rows=`), collects the CARVE lines (`noncandidate_rows=[...]`), and FAILs with `carve-out row(s) name a non-candidate in <n> namespace(s): <list>` - a 102-02 red instead of a 102-08..12 stuck task. Action steps 1 and 2 say fix the table, never the lane. Lane oracles unchanged. Re-drilled: O02 exit 1, same last line (script absent); new clauses drilled on the reference instrument with a scratch two-non-candidate table (`carved=0 carve_rows=2`, both keys listed, FAIL) and a positive control with a real candidate row (`carved=1 carve_rows=1`, no CARVE line, clause silent); a run without `--carveouts` prints no CARVE line.
- **G-03** Run precondition -> `## PRE-RUN CHECKLIST` item 1 (12 slugs, literals, live read 22:39:46 +03 - all equal today; `relationship-health` flagged as the one expected to advance).
- **G-04** 102-01 `Decisions covered` truth gains `; D-29: the heading-form waiver stands and this plan may teach decision-coverage.mjs the ### D-NN form but is not required to`. Union of cites is now D-01..D-29. Dry-run exit 0 (prose truth, no OBS-248).
- **G-05** 102-18 truth 2 (O18b): `[ "$CM" -lt "$FD" ]` -> `[ "$CM" -le "$FD" ]` (FAIL text says "after the first delete"); the expected-line reads `csv_mtime<=first_delete_epoch`; `text:` states the tie rule and that the script MUST terminate the CSV with a newline; the judge (truth 3) and action step 1 order the trailing `\n` on every row including the last. Re-drilled: exit 1, `P102-18-EXPORT export_dir=absent` / same FAIL line.
- **G-06** 102-02 truth 1 (O02): `K=$(grep -cE '^\| [a-z0-9-]+ \| ' ...)` -> `grep -E ... | grep -vc '^| namespace '`; FAIL text says "no data rows (header excluded)". Drilled: header-only table -> 0 (was 1); the scratch table -> 2.
- **G-07** 102-08 `files_modified` pattern 1: `...,keyboard-shortcuts/CommandPalette.tsx,keyboard-shortcuts/command-palette-order.ts}` - still ONE pattern, 4 patterns x 5 items = 20; dry-run exit 0.
- **G-08** Run precondition -> `## PRE-RUN CHECKLIST` item 3 (lock holder pid 56857 ALIVE at 22:39).
- Not re-run (pw wrapper, rule 3): O05b, O07a, O07b, O15b - unchanged in revision 2.
- `102-VALIDATION.md` rows for 102-02, 102-06 and 102-18 updated to the rev-2 magnitudes and clauses.
- Dry-run after all edits: exit 0, 19 tasks, hash `fb052d0adc59`, 39 OBS-170 (F-04, checklist item 2), no other `tickmarkr:` line.

PLAN-INDEX-END
