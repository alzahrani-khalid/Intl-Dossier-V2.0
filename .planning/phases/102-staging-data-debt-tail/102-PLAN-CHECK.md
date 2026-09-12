# Phase 102 — PLAN CHECK (engine + GSD dimensions)

Checker seat, 2026-09-10, under `.tickmarkr/overseer/BRIEF-102-CHECKER.md`. Repo root
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`. Checked at HEAD `00b328c2e` (the plans were
planned from `3ec257adc`; the three commits between are P100/P101 planning artefacts, no code — `git log
--oneline 3ec257adc..HEAD` pasted in §A). Compiler tickmarkr **2.5.1** == package.json **2.5.1**. No Agent
subagents were used. No vitest and no Playwright were launched: the four `pw-run-reaped` oracles (O05b,
O07a, O07b, O15b) are marked **NOT RE-RUN**. Every other command oracle (25 of 29) was re-run from the repo
root and its exit code and last line compared with the drilled-oracle table.

## VERDICT: FAIL

Two criteria are unsatisfiable as written (F-01, F-02) and one wave-2 pair races on the same staging rows
with no edge between them (F-04). Everything else is MAJOR-or-below and mostly one-line remedies. The plan
set compiles clean (exit 0, 19 tasks, no HUMANGATE, every surface ≤ 24, acyclic), every re-run oracle
reproduced the index's recorded RED with the same last line, and all 22 register rows plus the 5 roadmap
criteria map to a plan with a command oracle.

### Findings

| id | plan | severity | finding |
|---|---|---|---|
| F-01 | 102-06 | **BLOCKER** | The class-sweep oracle in the PLAN BODY is the unbounded case-insensitive research regex; the index (UNSETTLED-5) says it was changed to the bounded case-sensitive form. It was not. The three keep-list emails `admin@e2e.test`, `analyst@e2e.test`, `intake@e2e.test` in `public.users.email` match `E2E` case-insensitively, so `class_regex_cells` can never reach 0 while DATA-01's keep-list survives. Measured: plan form 219 cells, bounded form 66, plan-only 153 (of which 3 are the keep-list emails). |
| F-02 | 102-13 | **BLOCKER** | The PDF probe's positive path is dead for a reason the copy repair cannot fix: `pdf-generate` fetches `after_action_records` with the embed `commitments(*)`, and PostgREST answers `PGRST200 … Perhaps you meant 'aa_commitments'` — the function returns 404 `After-action record not found` for the REAL id `905b6a3a` (record exists, `publication_status=draft`, the test user is `admin` and owns the dossier; the plain select through RLS returns the row). The index's "RED inferred from the deployed body" was a wrong inference: the drill used a non-existent id and never observed the real-id cause. The oracle is unsatisfiable by the plan as written and the judge text does not name the fetch repair. |
| F-03 | 102-06 × 102-07 | **BLOCKER** | No dependency edge between the two plans that write/delete the SAME populations (`e2e-97-01-elected-official-%` persons, `E2E MoU %` rows). The engine may run them concurrently: 102-06's prefix-scoped DELETE can remove 102-07's in-flight rows so O07a/O07b report `rows_left=0` for the wrong reason, and 102-07's spec rows can make 102-06's sweep red mid-run. `wave` is informational; only `depends_on` orders the engine. |
| F-04 | run precondition | MAJOR | The phase directory is untracked (`git ls-files` = 0; 39 `OBS-170` lines). D-28 says commit before wave 1; workers cannot read an untracked phase dir. Not a plan-text defect — an operator act the run must not start without. |
| F-05 | 102-08, 102-09..12 | MAJOR | Third direction, COPY-09 lanes: a lane that LOWERCASES a carve-out (a ribbon, a column header) stays green — `carved` is counted among candidates, so lowercasing a carved string decrements both sides of `candidates == carved`. The carve-out table guards nothing at the oracle. |
| F-06 | 102-17 | MAJOR | Third direction, CARRY-07: the oracle reads only the entry's `limit` and size-limit's exit. Editing `.size-limit.json`'s entry `path` to a smaller chunk, or flipping `gzip: true` to brotli, passes both checks. `assert-size-limit-matches.mjs` is in the action, not in the oracle. |
| F-07 | 102-03, 102-04, 102-13 | MAJOR | Deploys are unverifiable by any gate. O03a covers only `my-delegations` (3 other functions), O04a/O04b test the DB trigger only (`workflow-executor`, `tasks-create` deploys untested), O13 covers only `pdf-generate` (5 others). The judge reads the diff and cannot see a deploy; the SUMMARY's deploy claim is a worker self-report the gates are built not to trust. A worker that deploys one function and claims six is green. |
| F-08 | 102-18 | MAJOR | Third direction, purge: the export-before-delete obligation (D-26, irreversible data) is judge-only. A script whose export path is never invoked on the run path (a swallowed catch, a flag) passes O18 (13/13/13/13). The one thing that makes the delete reversible has no command oracle. |
| F-09 | 102-15 | MAJOR | Third direction, CARRY-06: the two-clock test is trivially invariant if the `mask:` list covers the whole widget, and the judge text permits one baseline regeneration "if the masked region changed its geometry" — the roadmap's forbidden fix, re-admitted with a condition nobody can check from the diff. |
| F-10 | 102-08 | MAJOR | No judge truth at all (kinds: prose, command, test, command). O08a passes on any ≥20-char filler; "Arabic authored, not transliterated", "sentence case, no marketing voice" and the `getTypeColors` delegation are unverified by any acceptance item. Adding a judge makes items=5 × files=6 = surface 30 > 24 — see remedy. |
| F-11 | 102-04 | MAJOR | The truth and action say the executor writes through "the P96 `STATUS_TO_STAGE` map at workflow-executor:87-93". No such symbol exists in `supabase/functions/workflow-executor/index.ts` (`git grep` finds it only at `backend/src/services/tasks.service.ts:87`); :99-109 is `getTableName`. The executor is Deno and cannot import the backend module, so the worker must author a map the plan does not tell it to author. |
| F-12 | 102-03 | MAJOR | `is_active` derivation and the `active_only` filter are behaviours, verified only by judge. O03a calls `active_only=false` and checks `total=3`; a handler with `is_active` always true passes. A second call with `active_only=true` expecting `total=2` costs one line. |
| F-13 | CONTEXT D-03 / D-21 | MAJOR (needs a RULING, not a plan edit) | (a) D-03 (SETTLED) says browser legs are `test:` oracles; the plans use `command:` through the reaped wrapper because the test gate dispatches vitest only (`.tickmarkr/config.yaml` `tkr_test`, verified). The index asks for acknowledgement. (b) Roadmap criterion 4 says "under the 476 KB budget"; D-21 and 102-17's oracle require `< 500 KB`. The plan's prose escape ("the limit stays 500 with the number recorded") can never pass its own oracle, so that path is dead text, not a loophole — but the 476→<500 relaxation is a roadmap deviation the overseer must accept in writing. |
| F-14 | 102-05, 102-07, 102-15 | MINOR | The four Playwright oracles were never run as written (O07a/b only `bash -n`'d after the accidental draft run; O05b/O15b exit 1 before the wrapper). Their PASS path — `find -newer` on the report, the python `stats` parser, `-g "a|b"` — is unexercised. Wrapper report location verified: `root = realpathSync(process.cwd())` so reports land in `<dir>/test-results` as the oracles expect. |
| F-15 | 102-03, 102-05, 102-15 | MINOR | Seeds write free text (`reason`, names, titles). If a worker writes "P102 seed" / "Phase 102" / "fixture" into them, 102-06's sweep and 102-19's re-run go red. Say so in each seed plan. |
| F-16 | all | MINOR | Every plan ends with a duplicated `</output>` (lines 99-100 / 104-105 …). Compile tolerates it. Tidy. |
| F-17 | CONTEXT | MINOR | `scripts/decision-coverage.mjs` reports `skipped: true` ("no `<decisions>` block"). Manual census: 28 D-NN in CONTEXT, 28 cited, exactly one `Decisions covered` truth per plan. Either wrap the CONTEXT decisions in `<decisions>` with `**D-NN:**` lines or record the waiver; 102-01 (GATESTD-03) edits this very script. |
| F-18 | 102-06, 102-08 | MINOR (scope) | Two very large single tasks: 102-06 = export + DELETE set + 20 renames + ~40 column rewrites + a spec + a seed line; 102-08 = 56 authored leaves ×2 locales + 3 re-points + a test + a 253-candidate namespace pass. Each is one retry budget. Not wrong; flagged. |
| F-19 | index | MINOR | HEAD drift: O06a class cells 214 (index) → 219 (now); staging changed under the plan set. Verdicts unchanged. |

### Remedies

- **F-01** In 102-06's first oracle replace `%I ~* ''Phase \\d+|E2E|UAT|fixture|staging verification''` with the
  form the index claims: `(%I ~ ''\\yE2E\\y|\\yUAT\\y|Phase [0-9]+|staging verification'' or %I ~* ''\\yfixture\\y'')`
  — AND either exclude the columns that lawfully carry keep-list identities (`public.users.email`) or make the
  bounded form the only form (lowercase `e2e.test` does not match `\yE2E\y`, measured: 0 cells in `users.email`).
  Re-drill and record the new RED (bounded form = 66 cells at HEAD). Update the `text:` and the index row.
- **F-02** 102-13 action step 1 gains: "repair the fetch embed `commitments(*)` → `aa_commitments(*)`
  (`aa_commitments` carries the FK to `after_action_records`; `commitments` does not) and verify `decisions`,
  `risks`, `follow_up_actions` still resolve (they do — all three have FKs)". The judge item names that hunk.
  Re-drill O13 on the REAL id and record the actual RED cause (`PGRST200` → 404), not an inference. Consider
  whether `after-actions-*` siblings carry the same embed (memory: 4 siblings still carry the path-segment
  defect) — record, do not widen scope.
- **F-03** Add `depends_on: [102-05, 102-07]` to 102-06 (stop the growth, then clean). 102-18 already depends on
  both. No file collision is introduced (verified: the only shared-file pairs are all ORDERED).
- **F-04** `git add -f .planning/phases/102-staging-data-debt-tail && git commit` before `tickmarkr run`.
  After F-01..F-03 edits, not before.
- **F-05** Instrument prints `carve_rows=<n>` per namespace (rows in the carve-out table for that ns); every lane
  oracle asserts `candidates == carved` AND `carved == carve_rows` (every carve-out row is still a candidate).
  102-02 owns the instrument; the awk in 102-08 O08c and 102-09..12 gains one clause.
- **F-06** 102-17's oracle asserts the entry object's `path === "dist/assets/app-*.js"` and `gzip === true`, and
  runs `node frontend/scripts/assert-size-limit-matches.mjs` (exit 0) before the limit check.
- **F-07** One command truth per deploying plan: `DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true supabase
  functions list --project-ref zkrcjzdemdmwhearhfgg -o json` → for each named slug assert `updated_at` ≥ a
  timestamp the oracle records at its own start minus the task's wall time, or simpler: `version` strictly
  greater than the value the plan records at HEAD (record it now). Exit 3 fail-closed when the CLI is not
  logged in (already the plan's ok:false path). 102-03 (4 slugs), 102-04 (2), 102-13 (6). Surface check:
  102-03 4→5 items × 3 files = 15; 102-04 4→5 × 5 = 25 **> 24** — brace the two function paths
  `supabase/functions/{workflow-executor,tasks-create}/index.ts` (files 5→4, surface 20); 102-13 3→4 × 2 = 8.
- **F-08** 102-18 adds a command truth: the newest `.tickmarkr/overseer/p102-prepurge-*/auth_users_fixtures.csv`
  exists, its data-row count equals the `deleted=` magnitude the script printed (or, at HEAD-RED, ≥ 400), and
  the directory's mtime precedes the first delete (the script prints both). 2→3 items × 2 files = 6.
- **F-09** The judge item enumerates the exact mask locators (date-label elements only) and requires, before
  each `toHaveScreenshot`, `expect(page.getByText(<fixture engagement title>)).toBeVisible()` for the three
  b0000002 titles; strike the regeneration clause or bind it to a pixel-diff artefact the SUMMARY must attach.
- **F-10** Add a judge truth to 102-08 (authored Arabic, sentence case, `getTypeColors` delegation hunk, grid
  order change). Keep surface ≤ 24 by bracing the three components into ONE pattern:
  `frontend/src/components/{dossier/DossierTypeGuide.tsx,dossier/wizard/hooks/useDraftMigration.ts,keyboard-shortcuts/CommandPalette.tsx}`
  → files 4 × items 5 = 20. Dry-compile to confirm the brace with mixed extensions is accepted.
- **F-11** Rewrite the D-12 truth, action 2 and the judge: "author `STATUS_TO_STAGE` in the executor mirroring
  `backend/src/services/tasks.service.ts:87` (Deno cannot import it); throw a named error on an unmapped
  status". Drop ":87-93".
- **F-12** O03a: second curl `?active_only=true` → assert `total=2` and no row with `revoked=true`.
- **F-13** Overseer ruling requested on (a) D-03 → command-via-wrapper, (b) roadmap criterion 4 476 → <500.
- **F-14** Accept as the index states (rule 4), or have the orchestrator run O05b/O15b ONCE outside the P100
  window before the run; both fail closed on absence so the risk is a stuck task, not a false green.
- **F-15** One sentence in 102-03/05/15 actions: seed text must not match the 102-06 class regex.
- **F-16/F-17/F-18/F-19** as stated.

---

## A. Compile and parse

```
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr version
2.5.1
$ node -e 'console.log(require("/opt/homebrew/lib/node_modules/tickmarkr/package.json").version)'
2.5.1
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr compile /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail --type gsd --dry-run
harness: /opt/homebrew/lib/node_modules/tickmarkr/dist/cli/index.js (installed package)
validated /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail (19 tasks, source gsd, hash 569a5a7b12ea) — dry run; no graph written
exit=0
OBS-170 lines: 39  (context ".../102-CONTEXT.md" / "102-RESEARCH.md" / "102-PLAN-INDEX.md" exists in your checkout but is NOT in a worker's worktree — git add -f … && git commit)
$ git ls-files .planning/phases/102-staging-data-debt-tail | wc -l
0
$ git status --porcelain -- .planning/phases/102-staging-data-debt-tail
?? .planning/phases/102-staging-data-debt-tail/
$ ls .planning/phases/102-staging-data-debt-tail/*SUMMARY*
no matches found
$ git rev-parse --short HEAD
00b328c2e
$ git log --oneline 3ec257adc..HEAD
00b328c2e plan(phase-100): P100-17 judge: mandatory rolled-back census fixture, ...
ee669869a plan(phase-101): task-unit-contract split ...
568894e32 plan(phase-101): CI Gates Green — CONTEXT ...
$ cat .tickmarkr/graph.lock
No such file or directory   (no live run)
```

In-process parse (contract §10 snippet, path adjusted; `surface = items × patterns`):

```
19 tasks
P102-01 []                                                          files=4 acc=6 surface=24  status=pending ctx=7
P102-02 []                                                          files=3 acc=3 surface=9   status=pending ctx=5
P102-03 []                                                          files=3 acc=4 surface=12  status=pending ctx=7
P102-04 []                                                          files=5 acc=4 surface=20  status=pending ctx=7
P102-05 []                                                          files=3 acc=4 surface=12  status=pending ctx=7
P102-06 ["P102-05"]                                                 files=4 acc=4 surface=16  status=pending ctx=6
P102-07 []                                                          files=3 acc=4 surface=12  status=pending ctx=8
P102-08 ["P102-02"]                                                 files=6 acc=4 surface=24  status=pending ctx=7
P102-09 ["P102-02"]                                                 files=7 acc=3 surface=21  status=pending ctx=4
P102-10 ["P102-02"]                                                 files=5 acc=3 surface=15  status=pending ctx=4
P102-11 ["P102-02"]                                                 files=5 acc=3 surface=15  status=pending ctx=4
P102-12 ["P102-02"]                                                 files=5 acc=3 surface=15  status=pending ctx=4
P102-13 ["P102-05"]                                                 files=2 acc=3 surface=6   status=pending ctx=7
P102-14 []                                                          files=8 acc=3 surface=24  status=pending ctx=7
P102-15 []                                                          files=3 acc=4 surface=12  status=pending ctx=5
P102-16 []                                                          files=3 acc=4 surface=12  status=pending ctx=7
P102-17 ["P102-03","P102-05","P102-08","P102-09","P102-10","P102-11","P102-12","P102-13","P102-14"] files=4 acc=3 surface=12 status=pending ctx=6
P102-18 ["P102-03","P102-06","P102-07"]                             files=2 acc=3 surface=6   status=pending ctx=4
P102-19 [all 18]                                                    files=3 acc=3 surface=9   status=pending ctx=6
```

No task carries HUMANGATE. Max acceptance items = 6 (102-01), max patterns = 8 (102-14), max surface = 24
(102-01, 102-08, 102-14) — all AT the bound, none over. Acceptance kinds per task (from the compiled graph):
every task has exactly ONE prose item (the `Decisions covered` truth) plus typed oracles; 102-08 is the only
task with an `oracle: test`; 102-08 has NO judge (F-10). Context refs all survive compile (sample P102-09:
plan, CONTEXT, RESEARCH, CLAUDE.md). `routing.floor: frontier` on all 19.

## B. Coverage — 22 register rows + 5 roadmap criteria

| row | plan(s) | command oracle | status |
|---|---|---|---|
| DATA-01 (roadmap 1) | 102-18 + 102-07 | O18 (13/13/13/13); O07a/O07b (run + timestamp-scoped census) | covered; O07 legs NOT RE-RUN |
| DATA-02 (roadmap 2) | 102-06 (+102-05) | O06a sweep, O06b rename set | covered, **O06a unsatisfiable (F-01)** |
| SEED-DELEG-01 | 102-03 | O03a (deployed 200/total=3), O03b (1/1/1/3) | covered |
| DELEG-02 | 102-03 | O03a + judge | covered; deploys of 3 of 4 unverified (F-07) |
| WRITER-ROUTE-01 | 102-04 | judge + O04a/O04b | source-only obligation lawfully judged; symbol misnamed (F-11) |
| INSERT-SYNC-01 | 102-04 | O04a (triggerdef), O04b (rolled-back INSERT) | covered |
| P52FIXTURE-01 | 102-05 | O05a (5==5, pair, rename literal) | covered |
| CARRY-06 (roadmap 3) | 102-15 | O15a (3/3+5/5 window), O15b (two-clock run) | covered; O15b NOT RE-RUN; green-on-wrong (F-09) |
| CARRY-07 (roadmap 4) | 102-17 | O17 (exit 0 AND limit < 500) | covered; roadmap says 476 (F-13b); green-on-wrong (F-06) |
| CARRY-08 (roadmap 5) | 102-16 | O16a (9/9/7 verdict rows) | covered; 9/9/7 verified against headings |
| GUIDE-HOLLOW-01 | 102-08 | O08a (8/8 × 4 leaves × 2 locales) | covered; no judge (F-10) |
| EDGECOPY-01 | 102-13 | O13 (produced PDF) + judge | **unsatisfiable as planned (F-02)**; 5 deploys unverified (F-07) |
| COPY-09 | 102-02, 102-08, 102-09..12 | O02, O08c, O09..O12 | covered; green-on-wrong (F-05) |
| GATESTD-01/02/03/05 | 102-01 | O01a/b/c/d | covered |
| GATESTD-04 | 102-01 | judge on the C1 hunk | source-only, lawfully judged |
| ENGREAD-01 | 102-05 | O05b (render probe) + verdict line | covered; NOT RE-RUN |
| PREVIEW-HOLLOW-01 | 102-14 | O14 (0/0/0 + control) | covered |
| ROUTE-ORPHAN-01 | 102-16 | O16b (14 rows class+ruling) | covered |
| PARALLEL-TRUTH-01 | 102-08 | `test:` leaf title verbatim (vitest, frontend) | covered; dispatch arm verified in config (`pnpm --filter intake-frontend exec vitest run --passWithNoTests -t`) |

No row is prose/judge-only where a command was possible, except the deploy obligations (F-07). Nothing is
listed under `## UNSETTLED` as deferred; all 22 have a plan. Roadmap criterion 1 ("/users lists real staff")
closes on DB counts, not a rendered `/users` — acceptable (the page reads `public.users`), stated as a bound.

## C. Oracle reality — re-run from the repo root (exit / last line vs the drilled-oracle table)

| oracle | plan | exit | last line (mine) | index | match |
|---|---|---|---|---|---|
| O01a | 01 | 1 | `FAIL: GATE-STANDARD.md C9b still carries no fail-closed case line (the sed escape line fails open on macOS)` | 1, same | ✓ |
| O01b | 01 | 1 | `FAIL: scripts/config-step-artifacts.mjs does not exist - config-enabled steps are still enumerated from memory` | 1, same | ✓ |
| O01c | 01 | 1 | `P102-01-DCOV rc=0 total=3 covered=3 expected total=5 covered=5` / `FAIL: extractor tracks 3 of 5 decisions …` | 1, same | ✓ |
| O01d | 01 | 1 | `P102-01-GDRILL nested=0 selfref=0 expected nested=4 selfref=5` / `FAIL: … (nested=0 selfref=0) …` | 1, same | ✓ |
| O02 | 02 | 1 | `FAIL: scripts/titlecase-census.mjs does not exist - the COPY-09 instrument is not in the repo` | 1, same | ✓ |
| O03a | 03 | 1 | `BODY {"error":{"code":"QUERY_FAILED",…}}` / `P102-03-HTTP http=500 granted=absent received=absent total=None …` / `FAIL: my-delegations answered 500 …` | 1, same | ✓ |
| O03b | 03 | 1 | `P102-03-SEED granted_active=0 received_active=0 revoked=0 total=0 expected 1 1 1 3` / `FAIL: …` | 1, same | ✓ |
| O04a | 04 | 1 | `P102-04-TRG CREATE TRIGGER trg_sync_task_status BEFORE UPDATE ON public.tasks …` / `FAIL: … UPDATE only …` | 1, same | ✓ |
| O04b | 04 | 1 | `P102-04-BORN status_and_stage=[pending review] expected [review review]` / `FAIL: …` | 1, same | ✓ |
| O05a | 05 | 1 | `P102-05-P52 engagement_dossiers_typed=5 extension_rows=3 seeded_pair=0 renamed=0 expected 5 5 2 1` / `FAIL: …` | 1, same | ✓ |
| O05b | 05 | — | **NOT RE-RUN** (calls `scripts/pw-run-reaped.mjs`; brief rule 3) | 1 (spec absent) | n/a |
| O06a | 06 | 1 | `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=219 control_cells=2 …` / `FAIL: 7 text cells …` | 1, class=214 | ✓ verdict; 214→219 drift (F-19); **regex ≠ index (F-01)** |
| O06b | 06 | 1 | `P102-06-RENAME persons_renamed=0 working_groups_renamed=0 srtl_rows_renamed=0 b0000003_renamed=0 seed_family_present=16 …` / `FAIL: …` | 1, same | ✓ |
| O07a/O07b | 07 | — | **NOT RE-RUN** (pw wrapper) | NOT RUN as written | n/a |
| O08a | 08 | 1 | `P102-08-GUIDE en=1/8(missing:country,…,person) ar=1/8(…) …` / `FAIL: the type-guide body is still hollow …` | 1, same | ✓ |
| O08c | 08 | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | 1, same | ✓ |
| O09–O12 | 09–12 | 1 | same line as O08c | 1, same | ✓ |
| O13 | 13 | 1 | `BODY {"error":"not_found","message":"After-action record not found"}` / `FAIL: pdf-generate answered 404 for after-action 905b6a3a-4c94-482f-9857-d268cc4d3ea5 - no artifact was produced to verify` | 1 (on a dead id) | ✓ exit; **cause differs — real id also 404 (F-02)** |
| O14 | 14 | 1 | `P102-14-CATALOG tables_remaining=3 functions_remaining=5 types_remaining=3 control_dossiers=1 expected 0 0 0 1` / `FAIL: …` | 1, same | ✓ |
| O15a | 15 | 1 | `P102-15-WINDOW engagements_in_window=0 calendar_in_window=0 engagements_present=3 calendar_present=5 …` / `FAIL: 0 of 3 … 0 of 5 …` | 1, same | ✓ |
| O15b | 15 | — | **NOT RE-RUN** (pw wrapper) | 1 (no such title) | n/a |
| O16a | 16 | 1 | `P102-16-QUICK w2-…=rows:absent/9,status:0 w3-…=rows:absent/9,status:0 w4-…=rows:absent/7,status:0 … at_end_state=0/3` / `FAIL: 0 of 3 …` | 1, same | ✓ |
| O16b | 16 | 1 | `FAIL: 102-ROUTE-DISPOSITIONS.md does not exist - the 14 orphan routes have no recorded disposition` | 1, same | ✓ |
| O17 | 17 | 1 | `SL Size limit: 500 kB` / `SL Size: 516.25 kB gzipped` / `FAIL: size-limit exit 1 - the entry chunk exceeds the configured budget` | 1, 516.25 | ✓ |
| O18 | 18 | 1 | `P102-18-PURGE auth_users=415 keep_list_present=13 public_users=415 profiles=415 expected 13 13 13 13` / `FAIL: …` | 1, same | ✓ |
| O19 | 19 | 1 | `P102-19-CLOSE summaries_complete=0/18 missing=[ 01 … 18] register_rows=0 expected 18/18 and 22` / `FAIL: 0 of 18 …` | 1, same | ✓ |

Fail-closed drill (cd to an empty scratch dir, no `.env.test`), one per family:

```
O01-1: INSTRUMENT-CANNOT-RUN: .planning/GATE-STANDARD.md absent - not at the repo root  exit=3
O02-1: INSTRUMENT-CANNOT-RUN: frontend/src/i18n/en absent - not at the repo root  exit=3
O03-1: INSTRUMENT-CANNOT-RUN: SUPABASE_URL/ANON_KEY/TEST_USER_EMAIL/TEST_USER_PASSWORD not all set - .env.test not materialised  exit=3
O04-1: INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset - .env.test not materialised in this worktree  exit=3
O13-1: INSTRUMENT-CANNOT-RUN: SUPABASE_URL/ANON_KEY/TEST_USER_EMAIL/TEST_USER_PASSWORD not all set - .env.test not materialised  exit=3
O16-2: INSTRUMENT-CANNOT-RUN: phase dir absent - not at the repo root  exit=3
O17-1: INSTRUMENT-CANNOT-RUN: frontend/.size-limit.json absent - not at the repo root  exit=3
O19-1: INSTRUMENT-CANNOT-RUN: .planning/phases/102-staging-data-debt-tail absent - not at the repo root  exit=3
```

C(3)–C(6): every `command:` truth begins `PATH="/opt/homebrew/bin:…"` (29/29, from the compiled graph); every
one has an `exit 3` branch (29/29); each names its breaking value (13/13/13/13, 5 5 2 1, enabled=8, total=5,
nested=4 selfref=5, 3 5 3 5, 9/9/7, 14, 18/18+22, limit<500, expected=2/5/3, …). Absence-shaped criteria are
bounded by a present control (O06a control ≥1 else exit 3; O14 `dossiers` present; O16/O19 positive counts).
The one criterion that is an absence with NO control is inside F-05 (candidates==carved==0 is a lawful end
state a wrong pass also reaches).

Evidence for F-01 (read-only, staging):

```
$ (generated sweep) plan_form / bounded_form / only_plan_form over all 1,929 text+varchar columns
219 66 153
$ sample cells matched ONLY by the plan's ~* form
rag_chunks.content :: Test Working Group A — … cooperation fixtures (te     (matches "fixtures" — plural escapes \yfixture\y)
users.email :: admin@e2e.test
users.email :: analyst@e2e.test
users.email :: intake@e2e.test
persons.last_name_en :: e2e-97-01-elected-official-1786968804207
$ public.users.email: plan-regex matches | those NOT in the purge population | bounded-regex matches
3 | admin@e2e.test,analyst@e2e.test,intake@e2e.test | 0
```

The three keep-list rows are the proof: 102-18 asserts they are PRESENT, 102-06 asserts a regex that matches
their email column is 0 → the two plans cannot both be green.

Evidence for F-02 (read-only, staging + PostgREST with the test JWT):

```
$ O13 with the REAL id 905b6a3a-4c94-482f-9857-d268cc4d3ea5
BODY {"error":"not_found","message":"After-action record not found"}   http=404
$ psql: id | dossier_id | publication_status | test_user_role | test_user_owns_dossier | owners_total | aars_visible_to_test_user
905b6a3a-… | 7c0d830b-5dc7-4419-a0ad-ce550031712d | draft | admin | 1 | 1 | 1
$ GET /rest/v1/after_action_records?id=eq.905b6a3a…&select=id,publication_status   (test JWT)
[{"id":"905b6a3a-4c94-482f-9857-d268cc4d3ea5","publication_status":"draft"}]          ← RLS passes
$ GET …&select=*,decisions(*),commitments(*),risks(*),follow_up_actions(*)             ← the function's exact select (pdf-generate/index.ts:313-321)
{"code":"PGRST200","details":"Searched for a foreign key relationship between 'after_action_records' and 'commitments' … no matches were found.","hint":"Perhaps you meant 'aa_commitments' instead of 'commitments'.",…}
$ tables with an FK to after_action_records
decisions, aa_commitments, aa_risks, aa_follow_up_actions, aa_attachments, after_action_versions, risks, follow_up_actions, attachments, version_snapshots
```

`commitments` exists as a table but has no FK to `after_action_records`; `aa_commitments` does. Every real
id 404s through this function until the embed is repaired.

## D. Third direction on the five highest-risk plans

- **Purge (102-18).** Wrong impl A: raw SQL `DELETE FROM auth.users` bypassing GoTrue → O18 green; judge
  catches (`auth.admin.deleteUser` named). Wrong impl B: export never executed → O18 green, judge reads a
  diff in which the export code is present — green-on-wrong (F-08). Wrong impl C: over-delete → red
  (`keep_list_present` discriminates) ✓. Wrong impl D: skip the P101 precondition → green (accepted by
  D-04/UNSETTLED-8; sequencing is the overseer's).
- **Delegations (102-03).** Wrong impl A: repoint `my-delegations` only → O03a/O03b green; judge names all
  four hunks — judge-caught. Wrong impl B: `is_active` always true / `active_only` ignored → green-on-wrong
  (F-12). Wrong impl C: envelope stub returning the three rows without reading the table → O03a green; judge
  reads the diff and sees the stub — judge-caught, but the production caller is exercised only through the
  deployed function, which is the right thing here.
- **EDGECOPY deploy (102-13).** Wrong impl A: copy repaired in six files, only `pdf-generate` deployed →
  O13 green (once F-02 is fixed), the judge sees six hunks, nothing sees five missing deploys —
  green-on-wrong (F-07). Wrong impl B: as planned, without the embed repair → red forever (F-02).
- **CARRY-07 budget (102-17).** Wrong impl A: vendor regroup → entry shrinks, oracle green, judge is the
  only guard (and memory says vendor regroup white-screens). Wrong impl B: change `.size-limit.json` entry
  `path` or `gzip` → green-on-wrong (F-06). Wrong impl C: raise `chunkSizeWarningLimit` → no effect on
  size-limit → red ✓.
- **ENGREAD (102-05).** Wrong impl: a spec whose "row" locator counts something that is 5 by accident, or
  asserts `>=1` → O05b green; the judge pins titles, settle and `html[lang]` but not the row locator. Stays
  green on the wrong locator — MINOR: name the row locator (the list-page row selector) in the judge item.
- Also examined: **CARRY-06 (102-15)** over-masking (F-09); **COPY-09 lanes** lowercasing carve-outs (F-05);
  **GUIDE-HOLLOW (102-08)** filler leaves (F-10).

## E. Scope and ownership

- `assertWriteScope` passed at compile (exit 0) — every backticked `Create`/`Write`/`Add` path is in
  `files_modified`. Every plan lists its own `102-NN-SUMMARY.md` (19/19, from the parse).
- File-sharing census over ALL 171 task pairs (brace groups expanded, `frontend/src/**` matched as a prefix):
  the only pairs sharing a file are `P102-08/09/10/11/12/14 × P102-17`, all **ORDERED** (17 depends on each).
  Zero UNORDERED-CONCURRENT pairs. (F-03 is a DATA collision, not a file collision.)
- Exogenous paths: grep of `files_modified` and body directives for `CLAUDE.md`, `AGENTS.md`,
  `tickmarkr.spec.md`, `.agents/skills`, `.claude/skills`, `_archive-` → none. `CLAUDE.md` appears only as an
  `@` context ref (read-only) in 102-02, 09–12.
- Export CSVs under `.tickmarkr/overseer/` — `.gitignore:190` ignores `.tickmarkr/` (verified with
  `git check-ignore`), so the scope gate never sees them.
- 102-17's `frontend/src/**` write glob is broad by design; its deps cover every wave-2 writer of
  `frontend/src`. 102-06/07/15 write `frontend/tests/e2e/*` only — outside the glob.

## F. Human gates

`autonomous: true` on all 19; HUMANGATE on none (parse). Body grep for `git push|gh pr|branch protection|
droplet|138.197|production` → no obligation (the hits are the word "production" in prose about the RLS
class and "product act" in 102-16). Staging deploys (102-03/04/13), staging migrations (102-04/14) and seeds
(102-03/05/06/15) are worker acts — correct per D-25. The purge (102-18) is autonomous with a `<read_first>`
precondition — correct per D-04. Nothing that should be gated is autonomous; nothing autonomous is gated.

## G. Decisions

```
$ node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/scripts/decision-coverage.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail/102-CONTEXT.md
{ "passed": true, "skipped": true, "reason": "no <decisions> block" }   exit=0
```

Manual census (the gate is blind here — F-17): CONTEXT defines D-01…D-28 (28 `### D-NN` headings). Union of
D-NN cited across the 19 plans = D-01…D-28 (28/28). Each plan carries exactly ONE prose truth beginning
`Decisions covered - D-NN` (compiled graph: one prose item per task; the second grep hit in 102-01 is the
O01c fixture's `printf`, not a truth).

## H. Data safety

- 102-18: export FIRST (judge + action), keep-list enumerated as 13 literal emails in the ORACLE (not a
  pattern), positive end state 13/13/13/13, FK census re-run and abort. Gap: export is judge-only (F-08).
- 102-06: export by id list/prefix before the transaction (action step 1), one transaction, deletes scoped by
  prefix/id, renames not deletes for pinned ids, positive rename counts 10/6/3/1 with a 16-row control.
  Line-pinned claims verified: `calendar-rtl.spec.ts:9-10,25` couples to `SRTL-02 regression seed`;
  `060-dashboard-demo.sql:173/:185` carry the b0000003 title and its ar CASE row.
- 102-14: 12-row export before the drop (action step 1); catalog oracle bounded by `dossiers` present.
- 102-05: P52 pinned by id in 5 specs + `.env.test.example`; none asserts the NAME (verified by `git grep
  0000-0052`) — rename is safe.
- 102-04: the divergence construct is rolled back (verified: O04b ran against staging and left nothing).

## I. Depends_on DAG

Acyclic (DFS over the compiled graph: no CYCLE, no MISSING DEP). Ordering hazards from RESEARCH §17/§20 and
CONTEXT D-27, as edges:

| hazard | edge | present |
|---|---|---|
| spec-pinned ids renamed BEFORE purge | 18 → 06 → 05 | ✓ |
| residue removed and growth stopped BEFORE purge | 18 → 06, 18 → 07 | ✓ |
| keep-list grantees seeded BEFORE purge | 18 → 03 | ✓ |
| handler repoint BEFORE seed oracle | same task (102-03) | ✓ |
| ONS extension row BEFORE PDF probe | 13 → 05 | ✓ |
| P52 rename BEFORE the DATA-02 sweep | 06 → 05 | ✓ |
| instrument + carve-outs BEFORE lanes | 08/09/10/11/12 → 02 | ✓ |
| frontend writers BEFORE the bundle measurement | 17 → 08..14 | ✓ |
| everything BEFORE closure | 19 → 01..18 | ✓ |
| growth stopped BEFORE the residue delete (same rows) | 06 → 07 | **absent (F-03)** |
| Phase 101 CLOSED before the purge | cross-phase; `<read_first>` only | accepted (D-04) |

## GSD dimensions (summary)

1. Requirement coverage — roadmap requirements DATA-01, DATA-02, SEED-DELEG-01, CARRY-06, CARRY-07, CARRY-08
   all appear in `requirements:`; 22/22 register rows assigned. PASS.
2. Task completeness — every plan has files/action/done; `<verify>` is absent everywhere, which under the
   engine is correct (inert). PASS.
3. Dependency correctness — PASS except F-03 (a data edge, not a file edge).
4. Key links — instrument→lanes, seed→sweep, seed→PDF, everything→close are edges. PASS.
5. Scope sanity — F-18 warning (102-06, 102-08).
6. Verification derivation — every must_have names a breaking value and traces to a register row. PASS.
7. Context compliance — D-03 and D-21 deviations (F-13) need a ruling; D-22 numbers corrected in the open
   (index UNSETTLED-3); D-17's `dossier` lane moved to 102-08 under D-27 — consistent. 7b scope reduction:
   none silent. 7c: no responsibility map in RESEARCH — SKIPPED.
8. Nyquist — `102-VALIDATION.md` exists (`nyquist_compliant: true`); no `<automated>` blocks because the
   engine's `must_haves` are the automated verify; sampling is per-task oracles + 102-19's full re-run. PASS
   with that reading.
9. Cross-plan data contracts — F-03 (06×07 same rows), F-15 (seed vocabulary vs sweep).
10. CLAUDE.md compliance — T+N mono form, sentence case, no emoji, migrations via files applied with psql
    (D-24; the project rule names the Supabase MCP but P100 D-13 established psql for worker acts — not
    re-litigated here). PASS.

## Verified-true claims worth keeping (no finding)

- `tkr_test` `-t` arm dispatches `pnpm --filter intake-frontend exec vitest run --passWithNoTests -t "<title>"`;
  frontend vitest `include: ['**/*.test.{ts,tsx}']` collects `src/lib/dossier-type-parallel-truth.test.ts`.
- `scripts/pw-run-reaped.mjs` supports `-- <args>` and publishes to `realpathSync(process.cwd())/test-results`
  (both 21:39/21:40 reports are on disk where the oracles look).
- Playwright projects exist: root `chromium-en`; frontend `chromium`, `chromium-dashboard-widgets`.
- `FROZEN_TIME` (`:11`) and `FIXTURE_BLOCKED` (`:95-105`) are where 102-15 says.
- `GATE-STANDARD.md:227` is the sed escape line 102-01 replaces.
- Quick-task headings: W2 `### A1..A4, B1..B5` = 9; W3 = 9; W4 `## E1..E7` = 7 — the 9/9/7 in O16a is real.
- 129 en namespace files — the 129 in O02 is real.
- All 13 `@` context-ref files named across the plans exist at HEAD.
- Spec prefixes: `e2e-<epoch>@example.test` (user-management:30), `e2e-97-01-elected-official-<epoch>`
  (97 spec:316), `E2E MoU <epoch>` (mou-create:45) — the O07 census predicates match what the specs create.

PLAN-CHECK-102-END
