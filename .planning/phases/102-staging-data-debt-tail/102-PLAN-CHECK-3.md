# Phase 102 — PLAN CHECK, pass 3 / FINAL (revision-2 verification + fresh sweep)

Checker seat, 2026-09-10 ~22:40-22:50 local, under `.tickmarkr/overseer/BRIEF-102-CHECKER-3.md` (rules of
`BRIEF-102-CHECKER.md` and `BRIEF-102-CHECKER-2.md` inherited). Repo root
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`. HEAD `cf9829538` (one commit past pass 2's
`4ac54821c`: `100-17-PLAN.md` +1/-1, no code, no Phase 102 file). Compiler tickmarkr **2.5.1** == package.json
**2.5.1**. No Agent subagents. No vitest, no Playwright: the four `pw-run-reaped` oracles (O05b, O07a, O07b, O15b)
are unchanged in revision 2 and **NOT RE-RUN (pw wrapper)**. Every changed `command:` oracle (O06a, O02, O18b) was
re-run from the repo root read-only; the new O02 clauses were drilled on the plan's own reference instrument.

## VERDICT: PASS

All eight pass-2 findings are RESOLVED as `## REVISION-2 NOTES` claims, each verified against the plan text (quoted
below) and, where a command changed, by re-run with matching exit code and last line. The fresh sweep found **no
BLOCKER and no MAJOR**. The plan set compiles clean (exit 0, 19 tasks, hash `fb052d0adc59` == the index's rev-2
hash, max acceptance 6, max surface 24, no HUMANGATE, acyclic, no missing dep, no new file-sharing pair). Residual
defects are three MINORs and five INFO items (section 3), none blocking; the operator acts in the index's
`## PRE-RUN CHECKLIST` remain the gate to `tickmarkr run`.

## 1. G-01..G-08 — claim vs plan text vs re-run

| G | index claim (REVISION-2 NOTES) | verified in the plan file (quoted) | re-run / drill | status |
|---|---|---|---|---|
| G-01 | O06a gains `or %I ~ ''\ye2e-''` + eighth `%I`; text records 138 / users.email 0; class 66 -> 204 | `102-06-PLAN.md:23` predicate: `(%I ~ ''\\yE2E\\y\|\\yUAT\\y\|Phase [0-9]+\|staging verification'' or %I ~* ''\\yfixture\\y'' or %I ~ ''\\ye2e-'')` with eight `c.column_name` args before `c.table_name`; FAIL text ends `… / lowercase e2e- prefix)`; `text:` (line 24): "plus the case-sensitive hyphen-anchored \\ye2e- (rev-2 G-01: the 69 e2e-97-01-elected-official-<epoch> persons live in dossiers.name_en and persons.last_name_en … 138 cells) - the keep-list emails admin/analyst/intake@e2e.test match no clause … 0 cells in public.users.email … RED at HEAD (re-drilled rev-2 …): named=7 class=204 control=2" | O06a exit **1**: `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=204 control_cells=2 …` / `FAIL: 7 text cells still carry one of the four named internal-artifact strings …` — 204 = 66 + 138 exactly as pass 2 predicted | **RESOLVED** |
| G-02 | instrument emits `nonCandidate` + `CARVE-NONCANDIDATE ns:key` lines under `--carveouts`; O02 counts `carved != carve_rows` NS lines and FAILs listing them; fix the table, never the lane | `102-02-PLAN.md:71` (instrument): `const candKeys = new Set(c.map(([k]) => \`${ns}:${k}\`))` … `const nonCandidate = [...carve.keys()].filter((k) => k.startsWith(\`${ns}:\`) && !candKeys.has(k))`; line 74: `if (carveFile) for (const r of perNs) for (const k of r.nonCandidate) console.log(\`CARVE-NONCANDIDATE ${k}\`)`; O02 (line 22): `NC=$(… awk '/^NS / { … if (cv!=cr) n++ } …')`, `BAD=$(… grep -E '^CARVE-NONCANDIDATE ' …)`, `[ "$NC" = "0" ] && [ -z "$BAD" ] \|\| { echo "FAIL: carve-out row(s) name a non-candidate in $NC namespace(s): $BAD- every lane behind this would be stuck at carved<carve_rows forever"; exit 1; }`; `text:` line 23 states the rule and the drill; lane oracles O08c/O09–O12 unchanged (mtime 22:20 / 22:38 for 08 only for G-07) | O02 exit **1**, `FAIL: scripts/titlecase-census.mjs does not exist …` (same as index). Clause drill on the reference instrument extracted verbatim from the plan: scratch table `common \| sla.breach` + `common \| no.such.key` -> `NS common … carved=0 … carve_rows=2` + `CARVE-NONCANDIDATE common:sla.breach` + `CARVE-NONCANDIDATE common:no.such.key`; O02's tail clauses on that output -> `NC=1 BAD=[common:sla.breach common:no.such.key ]` -> FAIL line fires. Positive control `common \| notFound.title` (a real candidate) -> `carved=1 … carve_rows=1`, no CARVE line, clause silent. Without `--carveouts`: 0 CARVE lines | **RESOLVED** |
| G-03 | run precondition -> `## PRE-RUN CHECKLIST` item 1 (12 slugs, literals, live read 22:39:46 +03, timestamp blank to fill) | index lines 242-262: table of 12 slugs with literal / live / updated_at; "Timestamp of the pre-run read: _______ (fill in …)"; `relationship-health` flagged "expect it to advance again" | `supabase functions list -o json` at **19:43:58Z** (22:43:58 +03): all 12 live versions equal the literals (`relationship-health 5`, `updated_at 2026-09-10T18:02:42Z`). No advance since pass 2 | **RESOLVED** as a checklist item (the pre-run read is still owed — INFO R-04) |
| G-04 | 102-01 `Decisions covered` gains D-29 | `102-01-PLAN.md:18` ends `…; D-29: the heading-form waiver stands and this plan may teach decision-coverage.mjs the ### D-NN form but is not required to.` | union of `D-NN` across the 19 plans = **D-01 … D-29** (29 = `grep -c '^### D-' 102-CONTEXT.md`); each plan has exactly one `Decisions covered - D-` truth (102-01's second hit is the O01c printf fixture, as in pass 2); `decision-coverage.mjs` -> `{"passed":true,"skipped":true,"reason":"no <decisions> block"}` exit 0 (waiver D-29) | **RESOLVED** |
| G-05 | O18b `-lt` -> `-le`; expected-line `csv_mtime<=first_delete_epoch`; trailing newline ordered in text, judge and action | `102-18-PLAN.md:25`: `[ "$CM" -le "$FD" ] \|\| { echo "FAIL: the CSV was written at $CM, after the first delete at $FD"; exit 1; }`, expected `csv_rows==deleted>=1 csv_mtime<=first_delete_epoch population_left=0`; `text:` line 26: "(`-le`, rev-2 G-05: whole-second granularity … a tie is still not-after) … the script MUST terminate the CSV with a trailing newline (G-05b)"; judge line 28: "(header + one data row per account to be deleted, the file terminated by a trailing newline so `wc -l` minus one is the data-row count)"; action step 1 (line 56) carries the same | O18b exit **1**: `P102-18-EXPORT export_dir=absent` / `FAIL: no p102-prepurge-* export directory exists under …/.tickmarkr/overseer …` (same as index) | **RESOLVED** |
| G-06 | O02 `K=` excludes the header | `102-02-PLAN.md:22`: `K=$(grep -E '^\| [a-z0-9-]+ \| ' … \| grep -vc '^\| namespace ')`; FAIL text "the carve-out table holds no data rows (header excluded)" | header-only scratch table -> **0** (was 1); two-row table -> **2** | **RESOLVED** |
| G-07 | 102-08 pattern 1 gains `keyboard-shortcuts/command-palette-order.ts`; still one pattern, surface 20 | `102-08-PLAN.md:8`: `frontend/src/components/{dossier/DossierTypeGuide.tsx,dossier/wizard/hooks/useDraftMigration.ts,keyboard-shortcuts/CommandPalette.tsx,keyboard-shortcuts/command-palette-order.ts}` | compiled `P102-08 files=4 acc=5 surface=20`; engine matcher `dist/graph/files-glob.js` `filesGlob(pats)`: `command-palette-order.ts` **true**, `CommandPalette.tsx` **true**, sibling `other.ts` **false**; no other plan names `command-palette-order` (grep: 102-08 only) — no new sharing pair | **RESOLVED** |
| G-08 | run precondition -> checklist item 3 (lock held by pid 56857 at 22:39) | index line 265 as claimed | **Changed since pass 2:** `.tickmarkr/graph.lock` is **absent**; pid 56857 **DEAD** (`kill -0`); run 75's journal last event `{"ts":"2026-09-10T19:42:16.769Z","event":"exit-cause","data":{"cause":"deliberate","signal":"SIGTERM"}}` — the P100 run was TERMed, not concluded. The lock is free today, but a P100 resume would re-take it (never two runs in one repo) | **RESOLVED** as a checklist item; sequencing with P100 is the overseer's call (INFO R-03) |

## 2. Fresh sweep — nothing new introduced

In-process `compileGsd` parse (contract §10 snippet, path adjusted to 102; `surface = items × patterns`):

```
19 tasks
P102-01 [] files=4 acc=6 surface=24  prose,command,command,command,command,judge
P102-02 [] files=3 acc=3 surface=9   prose,command,judge
P102-03 [] files=3 acc=5 surface=15  prose,command,command,command,judge
P102-04 [] files=4 acc=5 surface=20  prose,command,command,command,judge
P102-05 [] files=3 acc=4 surface=12  prose,command,command,judge
P102-06 ["P102-05","P102-07"] files=4 acc=4 surface=16  prose,command,command,judge
P102-07 [] files=3 acc=4 surface=12  prose,command,command,judge
P102-08 ["P102-02"] files=4 acc=5 surface=20  prose,command,test,command,judge
P102-09 ["P102-02"] files=7 acc=3 surface=21
P102-10 ["P102-02"] files=5 acc=3 surface=15
P102-11 ["P102-02"] files=5 acc=3 surface=15
P102-12 ["P102-02"] files=5 acc=3 surface=15
P102-13 ["P102-05"] files=2 acc=4 surface=8
P102-14 [] files=8 acc=3 surface=24
P102-15 [] files=3 acc=4 surface=12
P102-16 [] files=3 acc=4 surface=12
P102-17 ["P102-03","P102-05","P102-08","P102-09","P102-10","P102-11","P102-12","P102-13","P102-14"] files=4 acc=3 surface=12
P102-18 ["P102-03","P102-06","P102-07"] files=2 acc=4 surface=8
P102-19 [all 18] files=3 acc=3 surface=9
maxAcc 6  maxSurface 24  missing deps []  cycle false
```

- **Bounds:** identical to pass 2 — max acceptance 6, max patterns 8 (102-14), max surface 24 (102-01, 102-14). No
  task changed its files/acceptance counts in revision 2 (G-07 folded into an existing brace group).
- **Human gates:** none; `autonomous: true` 19/19; no push/PR/production obligation was added.
- **Deps:** acyclic, none missing; the pass-2 hazard edges (18→06→05, 18→03, 18→07, 13→05, 06→07, 08..12→02,
  17→03/05/08..14, 19→all) unchanged.
- **Files_modified vs body directives (changed plans):** 102-02 body writes `scripts/titlecase-census.mjs` and
  `102-COPY09-CARVEOUTS.md` — both listed. 102-06 body writes `scripts/p102-staging-residue.sql`,
  `calendar-rtl.spec.ts`, `060-dashboard-demo.sql`, its SUMMARY — all listed. 102-18 body writes
  `scripts/p102-purge-fixture-accounts.mjs` and its SUMMARY — both listed; the export directory is under
  `.tickmarkr/overseer/` outside every worktree by design (D-26). 102-08's escape-hatch sibling now inside the
  brace (G-07). 102-01: prose-only change. No exogenous path appeared anywhere.
- **File sharing:** the only new path (`command-palette-order.ts`) is named by 102-08 alone; the six ordered
  `P102-{08..12,14} × P102-17` pairs from pass 2 are unchanged; zero unordered pairs.
- **Third direction on the changed truths:**
  - **O06a `\ye2e-` clause.** Wrong impl A: the residue SQL deletes the e2e-97-01 `dossiers` rows but not the
    `persons` rows -> `persons.last_name_en` keeps 69 cells -> class=69 -> red ✓. Wrong impl B: RENAME the
    prefix away instead of DELETE -> O06a green, but the judge names "DELETE statements each scoped by prefix
    (name_en LIKE 'e2e-97-01-elected-official-%' …)" and 102-19 re-checks -> judge-caught. Wrong impl C: a
    mixed-case residue (`E2e-`) would escape the case-sensitive clause — no such cells exist today (the 138 are
    all lowercase); accepted.
  - **O02 non-candidate clause.** Wrong impl A: the carve-out table names a non-candidate -> red ✓ (drilled).
    Wrong impl B: the shipped instrument counts `carve_rows` only over candidates (so `carved == carve_rows`
    trivially) and never prints CARVE lines -> O02 green, the lanes are satisfiable, and non-candidate rows are
    silently ignored rather than reported. The oracle cannot see this because both sides of the clause come from
    the instrument; the judge reads action step 1's rule ("`carve_rows` is the number of carve-out table rows for
    that namespace (whether or not each is still a candidate)"). Judge-bound — MINOR R-01 below with a one-line
    command remedy.
  - **O18b `-le`.** Wrong impl: export written from an in-memory copy in the same wall-clock second as the first
    delete -> green; the judge's "UNCONDITIONAL run path before any delete" and `export_completed_epoch` bind it.
    Accepted (this is the G-05 trade the index states).
  - **G-07 brace.** Wrong impl: write the sibling and also a second new file -> scope gate red ✓ (matcher false
    for siblings, verified).

## 3. Residual defects (every one, with severity — for the overseer's decision)

| id | plan | severity | defect | remedy |
|---|---|---|---|---|
| R-01 | 102-02 (O02) | MINOR | The non-candidate clause is self-referential: the instrument computes both `carve_rows` and the CARVE lines, so an instrument that counts `carve_rows` over candidates only (or never emits CARVE lines) is green on O02 while silently ignoring non-candidate rows. Judge-bound today. | Add to O02 a fixture drill in the O01c style: write a temp table with one known non-candidate row (`common \| zz.not.a.key \| mono-label`) and assert the instrument prints `CARVE-NONCANDIDATE common:zz.not.a.key` and `carve_rows=1` for `common` — exit 1 with `FAIL: the instrument does not report non-candidate carve-out rows` otherwise. |
| R-02 | 102-02 (O02) | MINOR (cosmetic) | A dead first `C=$(… grep -cE "^CONTROL '.*'=(true\|false) expected \1$")` assignment (ERE back-reference) precedes the awk form that overwrites it; harmless, but a grep that rejects `\1` under `-E` prints stderr noise into the gate log. | Delete the dead assignment. |
| R-03 | run precondition | INFO | Run 75 (P100) ended by deliberate SIGTERM at 19:42:16Z; lock absent, holder pid dead. A TERMed daemon can leave tasks `running` in its graph (recompile/resume needed); a P100 resume would re-take the lock. Checklist item 3's wording ("wait for that run's run-end event") is now moot for the lock but the sequencing of P100's remaining attempt vs Phase 102 is undecided. | Overseer decides order; either way confirm `.tickmarkr/graph.lock` absent immediately before `tickmarkr run`. |
| R-04 | checklist item 1 (G-03) | INFO | Pre-run timestamp still blank (by design). Live read at 19:43:58Z: all 12 literals equal live; `relationship-health` still 5. | Fill in at run time; patch any advanced literal, re-dry-run, commit. |
| R-05 | F-04 | INFO | Phase dir untracked: `git ls-files … \| wc -l` = 0; 39 OBS-170 lines. | Checklist item 2, last, after all edits. |
| R-06 | F-13b / D-21 | INFO | Overseer's written acceptance of the 476 -> <500 deviation still open. | Checklist item 5. |
| R-07 | 102-18 / D-04 | INFO | `101-*-SUMMARY.md` = 0 of 7; 102-18 parked (UNSETTLED-8, expected). | Checklist item 4. |
| R-08 | 102-06 / 102-08 (F-18) | MINOR (flagged, pass 1) | Attempt density on the two widest plans unchanged. | Overseer may pre-authorise a second attempt. |

No BLOCKER. No MAJOR. The four `pw-run-reaped` oracles remain `bash -n`-only per F-14 (accepted).

## 4. `tickmarkr compile --dry-run` (verbatim, OBS-170 lines elided)

```
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr version
2.5.1
$ node -e 'console.log(require("/opt/homebrew/lib/node_modules/tickmarkr/package.json").version)'
2.5.1
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr compile /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail --type gsd --dry-run
tickmarkr: OBS-170: task P102-01 context ".planning/phases/102-staging-data-debt-tail/102-CONTEXT.md" exists in your checkout but is NOT in a worker's worktree. To make it worker context: git add -f .planning/phases/102-staging-data-debt-tail/102-CONTEXT.md && git commit. Staging alone is not enough.
... (38 more OBS-170 lines, P102-01..P102-19; P102-19 also names 102-PLAN-INDEX.md)
harness: /opt/homebrew/lib/node_modules/tickmarkr/dist/cli/index.js (installed package)
validated /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail (19 tasks, source gsd, hash fb052d0adc59) — dry run; no graph written
dryrun_exit=0
OBS-170 count: 39
other tickmarkr: lines: 0
$ git rev-parse --short HEAD
cf9829538
$ git log --oneline 4ac54821c..HEAD
cf9829538 plan(phase-100): P100-17 named exception: get_citation_network_graph recursion repair (...)
$ git ls-files .planning/phases/102-staging-data-debt-tail | wc -l
0
$ ls .planning/phases/101-ci-gates-green/101-*-SUMMARY.md | wc -l
0
$ cat .tickmarkr/graph.lock
cat: .tickmarkr/graph.lock: No such file or directory
$ kill -0 56857
56857 DEAD
$ tail -1 .tickmarkr/runs/run-20260910-112306-0000000000000075/journal.jsonl
{"ts":"2026-09-10T19:42:16.769Z","event":"exit-cause","data":{"cause":"deliberate","signal":"SIGTERM"}}
```

Hash `fb052d0adc59` equals the index's rev-2 hash — the plan set checked is the one the index describes.

## 5. Oracle re-run table (changed oracles only; exit / last line vs the index)

| oracle | plan | exit | last line (mine) | index | match |
|---|---|---|---|---|---|
| O06a | 06 #1 | 1 | `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=204 control_cells=2 …` / `FAIL: 7 text cells still carry one of the four named internal-artifact strings …` | 1, 7/204/2 | ✓ |
| O02 | 02 #1 | 1 | `FAIL: scripts/titlecase-census.mjs does not exist - the COPY-09 instrument is not in the repo` | 1, same | ✓ |
| O02 clauses (scratch) | 02 #1 | — | bad table: `NC=1 BAD=[common:sla.breach common:no.such.key ]` -> FAIL; good table: `carved=1 carve_rows=1`, no CARVE line; no `--carveouts`: 0 CARVE lines; header-only `K`=0, two-row `K`=2 | same drills | ✓ |
| O18b | 18 #2 | 1 | `P102-18-EXPORT export_dir=absent` / `FAIL: no p102-prepurge-* export directory exists under …/.tickmarkr/overseer …` | 1, same | ✓ |
| O05b, O07a, O07b, O15b | 05/07/15 | — | **NOT RE-RUN (pw wrapper)** — unchanged in rev 2 | unchanged | n/a |
| all other oracles | — | — | unchanged since pass 2 (file mtimes 22:20-22:22 except 01/02/06/08/18 at 22:38); pass-2 re-runs stand | — | — |

## 6. Decisions

```
$ node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/scripts/decision-coverage.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail/102-CONTEXT.md
{ "passed": true, "skipped": true, "reason": "no <decisions> block" }   exit=0
$ grep -c '^### D-' 102-CONTEXT.md -> 29
$ union of D-NN across 102-??-PLAN.md -> D-01 … D-29 (complete)
$ per plan 'Decisions covered - D-' count: 19 × 1 (102-01 = 2, second is the O01c fixture)
```

## 7. What the overseer must do before the run (unchanged from the index's PRE-RUN CHECKLIST, plus R-01/R-02 if wanted)

1. Optionally apply R-01 (O02 fixture drill) and R-02 (dead line); re-dry-run.
2. Checklist 1: re-read the 12 slug versions, patch any advanced literal, record the timestamp.
3. Checklist 3: confirm `.tickmarkr/graph.lock` absent and decide P100-run-75's fate first (R-03).
4. Checklist 5: accept D-21's deviation in writing.
5. Checklist 2: `git add -f … && git commit` the phase dir — last.
6. Checklist 4: 102-18 stays parked until seven `101-*-SUMMARY.md` exist.

PLAN-CHECK-102-END
