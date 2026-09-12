# Phase 102 — PLAN CHECK, pass 2 (revision-1 verification + fresh sweep)

Checker seat, 2026-09-10 ~22:35-22:55 local, under `.tickmarkr/overseer/BRIEF-102-CHECKER-2.md` (rules of
`BRIEF-102-CHECKER.md` inherited). Repo root `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`.
HEAD `4ac54821c` (one commit past the revision's `00b328c2e`: `100-17-PLAN.md` +2 lines, no code). Compiler
tickmarkr **2.5.1** == package.json **2.5.1**. No Agent subagents. No vitest, no Playwright: the four
`pw-run-reaped` oracles (P102-05 #2, P102-07 #1/#2, P102-15 #2) are **NOT RE-RUN (pw wrapper)**. Every other
changed `command:` oracle was re-run from the repo root (14 of 14) and its exit code and last line compared
with the drilled-oracle table in `102-PLAN-INDEX.md`.

## VERDICT: FAIL

Sixteen of the nineteen pass-1 findings are RESOLVED as the index claims and verified against the plan text
and by re-run; F-04 is an operator act still pending; F-16 does not reproduce (confirmed on disk); F-14/F-18
are accepted/flagged as stated. The revision itself introduced **two new MAJOR defects** (G-01, G-02) and one
concrete drift vector on the new deploy-proof oracles (G-03), plus one rule violation in CONTEXT (G-04). All
four have one-to-three-line remedies. The plan set still compiles clean (exit 0, 19 tasks, hash
`cdee0118406c` == the index's, surfaces ≤ 24, no HUMANGATE, acyclic, zero unordered file-sharing pairs).

### New findings (fresh sweep — introduced or exposed by revision 1)

| id | plan | severity | finding |
|---|---|---|---|
| G-01 | 102-06 (F-01 regression) | **MAJOR** | The bounded, case-sensitive class regex is blind to the **largest DATA-02 residue population**: the 69 `e2e-97-01-elected-official-<epoch>` persons. Measured on staging: cells matching lowercase `\ye2e-` and NOT the bounded form = **138** (`dossiers.name_en` 69 + `persons.last_name_en` 69), `public.users.email` = 0. Under the pass-1 unbounded `~*` form these 138 were counted; now no command oracle sees them — O06b counts only the a0000000 family, O07a scopes to rows created at/after its own run, and 102-19's judge anchors on "confirmed deleted by 102-06's sweep output", which cannot show them. Third direction: a residue script whose e2e-97-01 DELETE targets the wrong column (e.g. `persons.name_en`, which does not exist as the prefix column) is green on O06a/O06b and passes a judge that only checks the statement is present. |
| G-02 | 102-02 × 102-08/09/10/11/12 (F-05 regression) | **MAJOR** | The new `carved == carve_rows` clause makes every lane's criterion **unsatisfiable whenever the carve-out table names a key that is not a candidate**, and nothing checks that. `carve_rows` counts every table row for the namespace; `carved` counts only rows that are current candidates. A row for a string the instrument never judges a candidate — the natural mistake is the very control string `SLA Breach` (ALL-CAPS token ≤4 chars is not judged, so `isCandidate` = false) or a key typo — leaves `carved < carve_rows` forever. Drilled on the plan's reference instrument with a scratch table of two non-candidate `common` rows: `NS common … candidates=225 … carved=0 … carve_rows=2` — no edit any lane can make reaches the end state. O02 asserts only `carveout_rows>=1`; its judge asks for "strings that stay Title Case" but no oracle enforces row ⊆ candidates. Five wave-2 tasks sit behind this trap (memory: an unsatisfiable criterion traps whoever must satisfy it). |
| G-03 | 102-13 (and the F-07 class in 102-03/102-04) | **MAJOR** (run precondition, not plan text) | The deploy-proof bases are identity-bound at 22:14 today and the LIVE run already moves one of them: `100-17-PLAN.md:138` deploys `relationship-health`; staging shows it deployed at **21:02:42 local today** (`updated_at` 1789063362357, version 5 = the recorded base), and HEAD `4ac54821c` names a fresh P100-17 attempt, which will deploy it again before Phase 102 runs. Then O13b's `relationship-health` clause is pre-green and a 102-13 worker that deploys five of six passes `advanced=6/6`. The oracle cannot know a future version; the base literals must be re-read immediately before `tickmarkr run` (all 12 slugs) and patched if any advanced. |
| G-04 | CONTEXT D-29 / plans | MAJOR (by brief rule G) | `102-CONTEXT.md` now defines **29** decisions (`### D-01`…`### D-29`); the union of `D-NN` cited across the 19 plans is D-01…D-28. **D-29 is cited by no plan**, and D-29's own text asserts "each cited by at least one plan's `Decisions covered - D-NN` truth" — false for itself. `scripts/decision-coverage.mjs` still reports `skipped: true`, so the gate is blind to it (F-17). |
| G-05 | 102-18 (new O18b) | MINOR | Two false-RED shapes on a correct implementation: (a) `[ "$CM" -lt "$FD" ]` compares whole seconds strictly — an export that completes and a first `deleteUser` that fires within the same wall-clock second reds a correct script; (b) `ROWS=$(($(wc -l < "$CSV") - 1))` undercounts by one if the script writes no trailing newline. |
| G-06 | 102-02 (O02) | MINOR | `K=$(grep -cE '^\| [a-z0-9-]+ \| ' …)` counts the header row (`| namespace | key | reason |` matches — verified: 1), so `carveout_rows>=1` is true for an empty table. The instrument itself skips `namespace`, so only the oracle's control is hollow. |
| G-07 | 102-08 | MINOR (pre-existing, unreported in pass 1) | Action step 3's escape hatch "move DOSSIER_TYPE_ORDER to a sibling `command-palette-order.ts`" names a write outside `files_modified` — `filesGlob` returns **false** for `frontend/src/components/keyboard-shortcuts/command-palette-order.ts` (verified through the engine's own matcher). Taking the hatch trips the scope gate. |
| G-08 | run precondition | INFO | `.tickmarkr/graph.lock` is held by pid 56857 (`tickmarkr resume run-20260910-112306-…75 --graph-changed`, started 22:17:48, ALIVE). Phase 102 cannot start until that run ends (never two runs in one repo). `101-*-SUMMARY.md` = 0 of 7, so 102-18's precondition is unmet today (UNSETTLED-8, expected). |

### Remedies

- **G-01** In O06a add a third clause to the class predicate: `or %I ~ ''\ye2e-''` (lowercase literal, hyphen-anchored — measured 0 cells in `public.users.email`, 138 in the two residue columns), adding the eighth `%I` argument to `format()`; re-drill and record the new RED (`class=204` = 66 + 138 at HEAD); update the truth `text:` and the index row. Alternatively keep the regex and add to O06b a positive count `e2e_97_01_persons=0` beside a control — either way the 69 persons need a command oracle that sees them.
- **G-02** O02 gains, after the census: every NS line must satisfy `carved == carve_rows` at HEAD (before any lane edits), else `FAIL: carve-out row(s) name a non-candidate in <ns>` — and the instrument prints the offending `ns:key` list when `--carveouts` is given (one extra loop over `carve`). This makes the trap a 102-02 red instead of a 102-09..12 stuck task. The five lane oracles need no change.
- **G-03** Add a pre-run step to `102-PLAN-INDEX.md` (beside F-04's commit step): re-run `supabase functions list -o json` and, for every one of the 12 slugs whose live `version` exceeds the literal in O03c/O04c/O13b, patch the literal to the live value, re-dry-run, commit. Record the timestamp of that read in the index.
- **G-04** Cite D-29 in the one plan that touches the decision-coverage script: 102-01's `Decisions covered` truth gains `; D-29: the heading-form waiver stands and this plan may teach decision-coverage.mjs the ### D-NN form but is not required to`. Re-dry-run (prose truth, no OBS-248 risk).
- **G-05** (a) `-le` is the honest comparison at one-second granularity (the CSV is closed and fsynced before the first delete; a tie still means "not after"), or have the script write `export_completed_epoch_ms` and compare milliseconds; (b) the judge item states the CSV ends with a newline, or count with `awk 'END{print NR-1}'` after `[ -n "$(tail -c1 "$CSV")" ] && echo >> …` — simplest: the plan tells the script to terminate the file with `\n`.
- **G-06** `K=$(grep -cE '^\| [a-z0-9-]+ \| ' "$CV" | …)` → exclude the header: `grep -E '^\| [a-z0-9-]+ \| ' "$CV" | grep -vc '^| namespace '`.
- **G-07** Put the sibling inside the brace: `…,keyboard-shortcuts/CommandPalette.tsx,keyboard-shortcuts/command-palette-order.ts}` (still ONE pattern; surface stays 4 × 5 = 20).

---

## 1. Pass-1 findings F-01..F-19 — claim vs plan text vs re-run

| F | index claim (REVISION-1 NOTES) | verified in the plan file | re-run | status |
|---|---|---|---|---|
| F-01 | 102-06 truth 1 carries the bounded form; text names the keep-list result and new RED 7/66/2 | `102-06-PLAN.md:23` predicate is `(%I ~ ''\\yE2E\\y\|\\yUAT\\y\|Phase [0-9]+\|staging verification'' or %I ~* ''\\yfixture\\y'')`; the old `Phase \d+\|E2E\|UAT` form is absent (grep 0); `text:` (line 24) states "keep-list emails … match no clause … 0 cells in public.users.email" and "named=7 class=66 control=2" | P102-06-1 exit **1**, `P102-06-SWEEP text_columns=1929 named_string_cells=7 class_regex_cells=66 control_cells=2`; `users.email` under the bounded form = **0** (psql) | **RESOLVED** as specified — with the coverage regression G-01 |
| F-02 | 102-13 action 1 opens with the embed repair; judge names the hunk first; O13 prints EMBED-CAUSE; text records the real-id cause | action step 1 (line 81) "repair the fetch embed at :313-321: `commitments(*)` -> `aa_commitments(*)`"; judge (line 50) cites "index.ts:313-321 where the embed `commitments(*)` becomes `aa_commitments(*)`"; O13 (line 21) has the `EMBED-CAUSE` curl on non-200; text (line 30) "http=404 … EMBED-CAUSE PGRST200"; the D-13 truth mentions the embed; `grep -rn "commitments(\*)" supabase/functions/` → `pdf-generate/index.ts:318` only | P102-13-1 exit **1**: `BODY {"error":"not_found",…}` / `EMBED-CAUSE {"code":"PGRST200",… 'commitments' … no matches were found …}` / `FAIL: pdf-generate answered 404 for after-action 905b6a3a-…`; record exists, `publication_status=draft` (psql) | **RESOLVED** |
| F-03 | 102-06 `depends_on: [102-05, 102-07]`; D-27 text says why | `102-06-PLAN.md:6` `depends_on: [102-05, 102-07]`; truth (line 18) "D-27: this plan waits for 102-05 … and for 102-07 (… never race a spec run …)"; compiled `P102-06 ["P102-05","P102-07"]` | n/a | **RESOLVED** |
| F-04 | orchestrator's act, not this seat's | `git ls-files .planning/phases/102-staging-data-debt-tail` = **0**; dry-run still emits **39** OBS-170 lines | n/a | **NOT RESOLVED** (operator act; must precede `tickmarkr run`, after the G-01..G-04 edits) |
| F-05 | NS line gains `carve_rows=`; O02 regex pins it; O08c/O09-12 awk gains `carved==carve_rows` | 102-02 reference instrument line 73 prints `… ar_extra_keys=${r.arExtra} carve_rows=${r.carveRows}`; O02 (line 22) shape regex ends `ar_extra_keys=[0-9]+ carve_rows=[0-9]+`; 102-08 truth 3 and 102-09/10/11/12 truth 1 awk: `v["candidates"]==v["carved"] && v["carved"]==v["carve_rows"] && …`; each `text:` explains the lowercased-carve-out trap | P102-02-1 exit **1** (script absent); P102-08-2, P102-09-1..P102-12-1 exit **1** each, `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent …`; awk clause drilled by the index on synthetic lines (not repeated here) | **RESOLVED** — with the unsatisfiable-trap regression G-02 |
| F-06 | O17 asserts path/gzip, runs assert-size-limit-matches, new SHAPE line | `102-17-PLAN.md:23`: `[ "$EPATH" = "dist/assets/app-*.js" ] && [ "$EGZ" = "true" ]`, `AS=$(node frontend/scripts/assert-size-limit-matches.mjs …)`, `P102-17-SHAPE …` | P102-17-1 exit **1**: `P102-17-SHAPE entry_path=[dist/assets/app-*.js] gzip=[true] assert_matches_exit=0` / `P102-17-BUDGET configured_limit=[500 KB] size_limit_exit=1 entry=[Size: 516.25 kB]` / `FAIL: size-limit exit 1 …` | **RESOLVED** (script resolves its paths from `import.meta.url`, so cwd-independent — verified) |
| F-07 | new deploy-proof truths O03c (4 slugs), O04c (2), O13b (6); 102-04 files braced | 102-03 truth 3 bases `my-delegations=3 delegate-permissions=5 revoke-delegation=5 deactivate-user=4`; 102-04 truth 3 `workflow-executor=4 tasks-create=6`, `files_modified` line 9 `supabase/functions/{workflow-executor,tasks-create}/index.ts` (compiled files=4, surface 20); 102-13 truth 2 `bot-notification-dispatcher=2 contextual-suggestions=5 data-export=2 data-import=2 pdf-generate=11 relationship-health=5`; actions 3/4/2 say all slugs must be deployed from the worktree | live `supabase functions list -o json` (22:40 local): all 12 versions equal the recorded bases; P102-03-3 exit **1** `advanced=0/4`, P102-04-3 exit **1** `advanced=0/2`, P102-13-2 exit **1** `advanced=0/6` | **RESOLVED** — with the drift vector G-03 |
| F-08 | O18b: CSV rows == deleted, mtime < first delete, population 0; judge/action name the unconditional path | `102-18-PLAN.md:25` O18b as claimed; judge (line 28) "on the UNCONDITIONAL run path before any delete (no flag, no swallowed catch …)", `magnitudes.txt` keys `deleted= first_delete_epoch= export_completed_epoch=`; action 1 repeats it | P102-18-2 exit **1**: `P102-18-EXPORT export_dir=absent` / `FAIL: no p102-prepurge-* export directory exists …`; purge population on staging today = **402** (psql) | **RESOLVED** (minor G-05) |
| F-09 | 102-15 judge: mask EXACTLY `.week-date`, three titles visible before each capture, regeneration clause struck | judge (line 36): "The `mask:` option is EXACTLY `[widget.locator('.week-date')]` … masking `.week-row`, `.week-title`, `.week-body`, the widget root, or any locator broader … is a failure"; the three `expect(widget.getByText(…)).toBeVisible()` lines; "The committed week-ahead baseline is NOT regenerated in this plan under any condition"; action 2 repeats the three rules | `.week-date` exists at `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx:66` (the plan cites :66-73); the three titles are on staging: `Bilateral consultation — ESCWA`, `Prep session — G20 Data Gaps Initiative`, `Delegation visit — Indonesia BPS` (psql, b0000002 family) | **RESOLVED** (O15b NOT RE-RUN — pw wrapper) |
| F-10 | 102-08 gains a judge; three components braced into one pattern; compile accepts the mixed brace | `102-08-PLAN.md:8` one pattern `frontend/src/components/{dossier/DossierTypeGuide.tsx,dossier/wizard/hooks/useDraftMigration.ts,keyboard-shortcuts/CommandPalette.tsx}`; truth 4 judge (line 33) covers authored Arabic, sentence case / banned words, the colour-map delegation hunk, GUIDE_GRID_TYPES / VALID_TYPES / DOSSIER_TYPE_ORDER with consumers unchanged, values-only namespace edits; compiled files=4 acc=5 surface=20 | The engine's own matcher (`dist/graph/files-glob.js` → picomatch) returns **true** for all three paths and **false** for a sibling — the scope gate and the compiler agree | **RESOLVED** |
| F-11 | executor AUTHORS `STATUS_TO_STAGE` mirroring tasks.service.ts:87, throws on unmapped; ":87-93" dropped | D-12 truth (line 18) "STATUS_TO_STAGE map AUTHORED IN THE EXECUTOR (mirroring backend/src/services/tasks.service.ts:87 - Deno cannot import …)"; judge (line 48) "a new module-level `STATUS_TO_STAGE` constant in workflow-executor/index.ts … throwing a named error … never `?? newStatus`"; action 2 (line 80) same; the only remaining ":87-93" is the context-ref disclaimer "research names a … map at workflow-executor:87-93 that does not exist" | `backend/src/services/tasks.service.ts:87` is `const STATUS_TO_STAGE: Record<…>` (verified) | **RESOLVED** |
| F-12 | O03a second curl `active_only=true` → total=2, zero revoked/inactive | `102-03-PLAN.md:35`: `…my-delegations?active_only=true…`, `P102-03-ACTIVE http=$C2 $R2 expected http=200 total=2 revoked_or_inactive_rows=0` | P102-03-1 exit **1** on the first call: `BODY {"error":{"code":"QUERY_FAILED",…}}` / `P102-03-HTTP http=500 …` (the second call is not reached at HEAD — by design) | **RESOLVED** |
| F-13 | ruled in CONTEXT (D-03 amendment, D-21 deviation note) | D-03 "**Amended 2026-09-10 22:20 … RULED: browser legs are `command:` oracles that launch the spec through `scripts/pw-run-reaped.mjs`**"; D-21 "**Roadmap deviation, stated (F-13b)** … The overseer must accept this in writing before the run" | n/a | **RESOLVED** as a recorded ruling; the D-21 written acceptance by the overseer is still an open act before the run |
| F-14 | accepted; O05b/O07a/O07b/O15b `bash -n` only | unchanged | NOT RE-RUN (pw wrapper) | **ACCEPTED** as stated |
| F-15 | one sentence in 102-03 step 2, 102-05 step 1, 102-15 step 1 + judge | 102-03 action 2 "Seed free text (`reason`, any title) must NOT match 102-06's class regex …"; 102-05 action 1 "Free text in the seed … must NOT match 102-06's class regex …"; 102-15 action 1 "(… any free text you do write must not match 102-06's class regex …)" and judge "no free text that matches 102-06's class regex" | n/a | **RESOLVED** |
| F-16 | does not reproduce; one `</output>` per file | `grep -c '</output>'` = **1** for all 19; `tail -c 20 \| od -c` ends `) . \n < / o u t p u t > \n` — the pass-1 duplicate was the tool-result wrapper | n/a | **NOT A DEFECT** (confirmed on disk) |
| F-17 | waived by D-29 | D-29 present (`### D-29 — Decision-coverage waiver …`); `node scripts/decision-coverage.mjs …` → `{"passed":true,"skipped":true,"reason":"no <decisions> block"}` exit 0 | manual census: 19 plans × exactly one `Decisions covered - D-` truth (102-01's second grep hit is the O01c `printf` fixture); union of cites = D-01…D-28 | **RESOLVED** as a waiver — but D-29 itself is uncited (G-04) |
| F-18 | flagged, not split | unchanged | n/a | **FLAGGED** (overseer may pre-authorise a second attempt for 102-06 / 102-08) |
| F-19 | drift recorded 214 → 219 → 66 | index rows say 66 | P102-06-1 today: **66** (no further drift) | **RESOLVED** |

## 2. Fresh sweep (bounds, surface, braces, deps, OBS, scope, third direction of the new truths)

In-process `compileGsd` parse (contract §10 snippet, path adjusted; `surface = items × patterns`):

```
19 tasks
P102-01 [] files=4 acc=6 surface=24 human=false kinds=prose,command,command,command,command,judge
P102-02 [] files=3 acc=3 surface=9  kinds=prose,command,judge
P102-03 [] files=3 acc=5 surface=15 kinds=prose,command,command,command,judge
P102-04 [] files=4 acc=5 surface=20 kinds=prose,command,command,command,judge
P102-05 [] files=3 acc=4 surface=12 kinds=prose,command,command,judge
P102-06 ["P102-05","P102-07"] files=4 acc=4 surface=16 kinds=prose,command,command,judge
P102-07 [] files=3 acc=4 surface=12 kinds=prose,command,command,judge
P102-08 ["P102-02"] files=4 acc=5 surface=20 kinds=prose,command,test,command,judge
P102-09 ["P102-02"] files=7 acc=3 surface=21
P102-10 ["P102-02"] files=5 acc=3 surface=15
P102-11 ["P102-02"] files=5 acc=3 surface=15
P102-12 ["P102-02"] files=5 acc=3 surface=15
P102-13 ["P102-05"] files=2 acc=4 surface=8  kinds=prose,command,command,judge
P102-14 [] files=8 acc=3 surface=24
P102-15 [] files=3 acc=4 surface=12
P102-16 [] files=3 acc=4 surface=12
P102-17 ["P102-03","P102-05","P102-08","P102-09","P102-10","P102-11","P102-12","P102-13","P102-14"] files=4 acc=3 surface=12
P102-18 ["P102-03","P102-06","P102-07"] files=2 acc=4 surface=8  kinds=prose,command,command,judge
P102-19 [all 18] files=3 acc=3 surface=9
```

- Bounds: max acceptance 6 (102-01), max patterns 8 (102-14), max surface 24 (102-01, 102-14) — none over. No
  HUMANGATE; `autonomous: true` on 19/19 (F dimension unchanged — no push/PR/production obligation appeared).
- Brace groups: 102-01 (3 scripts), 102-03 (4 functions), 102-04 (2 functions, NEW), 102-08 (3 components with
  slashes inside the alternatives, NEW), 102-13 (6 functions), 102-16 (3 quick dirs), the `{en,ar}` i18n pairs.
  All verified through `dist/graph/files-glob.js` (the ONE matcher the scope gate uses): true for every intended
  path, false for siblings. The compiler and the scope gate cannot disagree on these.
- Depends_on: acyclic, no missing dep (DFS over the compiled graph). The pass-1 ordering table holds; the new
  edge 06 → 07 closes the F-03 gap. Hazard census re-run: 18 → 06 → 05, 18 → 03, 18 → 07, 13 → 05, 06 → 07,
  08..12 → 02, 17 → 03/05/08..14, 19 → all — present.
- File-sharing census over all 171 pairs (braces expanded, `frontend/src/**` matched as a prefix): 6 sharing
  pairs, all `P102-{08,09,10,11,12,14} × P102-17`, all **ORDERED**; **zero UNORDERED**.
- OBS lines: 39 × OBS-170 (untracked phase dir — F-04), nothing else; dry-run exit 0.
- Scope: every backticked write-shaped path in every body resolves inside its `files_modified` through the
  engine matcher, except 102-08's conditional sibling (G-07). Every plan lists its own SUMMARY (19/19). No
  exogenous path (`CLAUDE.md`/`AGENTS.md`/`tickmarkr.spec.md`/`.agents|.claude/skills`/`_archive-`) in any
  `files_modified`.
- Third direction of the new truths:
  - **O03c/O04c/O13b (deploy proof).** Wrong impl A: deploy all slugs with only some repaired → versions
    advance, judge must see every copy hunk → judge-caught. Wrong impl B: deploy none, but a sibling run
    deploys the slug → green-on-wrong; concrete for `relationship-health` (G-03). Wrong impl C: CLI not logged
    in → exit 3 (drilled by the index with a bogus token; not repeated). Parse: `raw_decode` from the first
    `[` tolerates CLI banner lines; `unparseable` → exit 3.
  - **O03a active_only.** Wrong impl: filter on `revoked` only, ignore `valid_until` → the seed has no expired
    row, so green. The judge names `.gte('valid_until', now)`; acceptable (the revoked row is the discriminator
    the plan chose). No finding.
  - **O06a bounded regex.** Wrong impl: skip the e2e-97-01 DELETE (or target the wrong column) → green (G-01).
  - **O08c/O09–O12 `carved==carve_rows`.** Wrong impl A: lowercase a carve-out → red ✓ (drilled by the index).
    Wrong impl B (the table's fault, not the lane's): a non-candidate row → red forever (G-02).
  - **O17 shape.** Wrong impl A: re-point `path` or flip `gzip` → red ✓. Wrong impl B: `.size-limit.json`
    `ignore:`/`modifyEsbuildConfig` → the config uses `@size-limit/file` with `running:false` per entry (verified),
    so module-ignore options do not apply; a switch to the preset-app plugin would change `running`/measurement
    but keep `gzip:true` — the judge reads the whole `.size-limit.json` hunk. Acceptable.
  - **O18b export proof.** Wrong impl A: export written but empty → `csv_rows=0` ≠ `deleted` → red ✓. Wrong
    impl B: export written AFTER the deletes from an in-memory copy → mtime > first_delete → red ✓. Wrong impl
    C: `magnitudes.txt` fabricated with `deleted=` matching the CSV and an early `first_delete_epoch` → green;
    the judge reads the script and O18/O18b `population_left=0` bound it. Acceptable; G-05 is the only edge.
  - **102-15 judge (mask/titles).** Wrong impl: assert the titles visible then mask `.week-row` → judge text
    names it a failure ✓. Still judge-only (the browser leg is not drillable tonight — D-03 amended).
  - **102-08 judge.** Wrong impl: filler Arabic that is a transliteration → judge-only by nature; acceptable.

Evidence for G-01 (read-only sweep over the same 1,929 columns O06a generates from):

```
$ cells matching lowercase \ye2e- (hyphen-anchored) that the BOUNDED form does not match, per column
persons.last_name_en|69
dossiers.name_en|69
users.email|0
$ totals: lowercase e2e- = 138; case-insensitive \ye2e\y not matched by the bounded form = 141 (138 + the 3 keep-list emails)
$ staging today: e2e-97-01 dossiers = 69, E2E MoU rows = 2, purge population = 402
```

Evidence for G-02 (the plan's reference instrument, extracted verbatim from `102-02-PLAN.md`, run from the repo
root against a scratch carve-out table):

```
| namespace | key | reason |
| common | sla.breach | ribbon-uppercase |
| common | no.such.key | mono-label |
$ node titlecase-census.mjs --controls --carveouts <scratch> common
CONTROL 'Add Elected Official'=true expected true … CONTROL 'SLA Breach'=false expected false …
NS common strings=1496 candidates=225 ar_mirror=225 carved=0 ar_missing_keys=0 ar_extra_keys=12 carve_rows=2
```

`carved` (0) can never reach `carve_rows` (2) whatever the lane does to `common.json`.

Evidence for G-03:

```
$ supabase functions list -o json (22:40 local) — slug version updated_at
relationship-health 5 1789063362357   ← 2026-09-10 21:02:42 +03 (today; base recorded 22:14 = 5)
(the other 11 slugs: versions equal the recorded bases; updated_at 2026-08-xx or earlier)
$ grep -n "functions deploy relationship-health" .planning/phases/100-security-posture/100-17-PLAN.md
138: … supabase functions deploy relationship-health --project-ref …
$ cat .tickmarkr/graph.lock
{"pid":56857,"runId":"run-20260910-112306-0000000000000075","startedAt":1789067868394}   pid ALIVE (started 22:17:48)
$ git log --oneline 00b328c2e..HEAD
4ac54821c plan(phase-100): P100-17 names attempt-8 tip 3afff3c1c as the base for the fresh attempt
```

## 3. `tickmarkr compile --dry-run` (verbatim, OBS-170 lines elided after the first two)

```
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr version
2.5.1
$ node -e 'console.log(require("/opt/homebrew/lib/node_modules/tickmarkr/package.json").version)'
2.5.1
$ PATH="/opt/homebrew/bin:$PATH" tickmarkr compile /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail --type gsd --dry-run
tickmarkr: OBS-170: task P102-01 context ".planning/phases/102-staging-data-debt-tail/102-CONTEXT.md" exists in your checkout but is NOT in a worker's worktree. To make it worker context: git add -f .planning/phases/102-staging-data-debt-tail/102-CONTEXT.md && git commit. Staging alone is not enough.
tickmarkr: OBS-170: task P102-01 context ".planning/phases/102-staging-data-debt-tail/102-RESEARCH.md" exists in your checkout but is NOT in a worker's worktree. To make it worker context: git add -f .planning/phases/102-staging-data-debt-tail/102-RESEARCH.md && git commit. Staging alone is not enough.
... (37 more OBS-170 lines, P102-02..P102-19; P102-19 also names 102-PLAN-INDEX.md)
harness: /opt/homebrew/lib/node_modules/tickmarkr/dist/cli/index.js (installed package)
validated /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail (19 tasks, source gsd, hash cdee0118406c) — dry run; no graph written
dryrun_exit=0
OBS-170 count: 39
$ git rev-parse --short HEAD
4ac54821c
$ git ls-files .planning/phases/102-staging-data-debt-tail | wc -l
0
$ ls .planning/phases/101-ci-gates-green/101-*-SUMMARY.md
no matches found
```

Hash `cdee0118406c` equals the index's post-revision hash — the plan set I checked is the one the index describes.

## 4. Oracle re-run table (changed oracles only; exit / last line vs the index)

| oracle | plan | exit | last line (mine) | index | match |
|---|---|---|---|---|---|
| O06a | 06 #1 | 1 | `FAIL: 7 text cells still carry one of the four named internal-artifact strings …` (magnitude `named=7 class=66 control=2`) | 1, 7/66/2 | ✓ |
| O02 | 02 #1 | 1 | `FAIL: scripts/titlecase-census.mjs does not exist - the COPY-09 instrument is not in the repo` | 1, same | ✓ |
| O03a | 03 #1 | 1 | `FAIL: my-delegations answered 500 - the handler still reads the phantom relation or the deploy did not land` | 1, same | ✓ |
| O03c | 03 #3 | 1 | `P102-03-DEPLOY advanced=0/4 my-delegations=3(>3) delegate-permissions=5(>5) revoke-delegation=5(>5) deactivate-user=4(>4)` / `FAIL: not every function was deployed after HEAD …` | 1, 0/4 | ✓ |
| O04c | 04 #3 | 1 | `P102-04-DEPLOY advanced=0/2 workflow-executor=4(>4) tasks-create=6(>6)` / `FAIL: …` | 1, 0/2 | ✓ |
| O08c | 08 #2 (command) | 1 | `FAIL: scripts/titlecase-census.mjs or 102-COPY09-CARVEOUTS.md absent - P102-02 has not landed in this tree` | 1, same | ✓ |
| O09–O12 | 09–12 #1 | 1 | same line as O08c | 1, same | ✓ |
| O13 | 13 #1 | 1 | `BODY {"error":"not_found",…}` / `EMBED-CAUSE {"code":"PGRST200",…}` / `FAIL: pdf-generate answered 404 for after-action 905b6a3a-… (embed probe above names the PostgREST cause …)` | 1, same, cause observed | ✓ |
| O13b | 13 #2 | 1 | `P102-13-DEPLOY advanced=0/6 … pdf-generate=11(>11) relationship-health=5(>5)` / `FAIL: …` | 1, 0/6 | ✓ |
| O17 | 17 #1 | 1 | `P102-17-SHAPE entry_path=[dist/assets/app-*.js] gzip=[true] assert_matches_exit=0` / `P102-17-BUDGET configured_limit=[500 KB] size_limit_exit=1 entry=[Size: 516.25 kB]` / `FAIL: size-limit exit 1 …` | 1, shape ok, 516.25 | ✓ |
| O18b | 18 #2 | 1 | `P102-18-EXPORT export_dir=absent` / `FAIL: no p102-prepurge-* export directory exists under …/.tickmarkr/overseer …` | 1, same | ✓ |
| O05b, O07a, O07b, O15b | 05/07/15 | — | **NOT RE-RUN (pw wrapper)** | unchanged | n/a |

Unchanged oracles (O01a-d, O03b, O04a/b, O05a, O06b, O08a, O14, O15a, O16a/b, O18, O19) were re-run and matched
in pass 1 and their bodies are byte-identical in intent per the index; not re-run here. Tools present for the
fail-closed branches: `pdftotext`, `psql`, `supabase`, `python3`, `node`, `pnpm` all on `/opt/homebrew/bin`;
`.env.test` present at the root; `frontend/dist/assets/app-*.js` present (O17's exit-3 branch not taken).

## 5. Decisions

```
$ node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/scripts/decision-coverage.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/102-staging-data-debt-tail/102-CONTEXT.md
{ "passed": true, "skipped": true, "reason": "no <decisions> block" }   exit=0
$ grep -c '^### D-' 102-CONTEXT.md → 29   (D-01 … D-29)
$ union of D-NN across 102-??-PLAN.md → D-01 … D-28   (D-29 uncited — G-04)
$ per plan: exactly one "Decisions covered - D-" truth (102-01 shows 2 hits: the second is the O01c printf fixture)
```

## 6. What the overseer must do before the run (outside plan text)

1. Apply G-01, G-02, G-04 (plan/context edits), G-05..G-07 if wanted; re-dry-run; re-drill O06a and O02.
2. Wait for run `…-0000000000000075` (P100) to end — `.tickmarkr/graph.lock` is live.
3. Re-read the 12 slug versions and patch any advanced base (G-03) — after P100-17's fresh attempt lands.
4. Accept D-21's 476 → <500 deviation in writing (F-13b, still open).
5. `git add -f .planning/phases/102-staging-data-debt-tail && git commit` (F-04) — last, after every edit.
6. 102-18 stays parked until seven `101-*-SUMMARY.md` exist (0 today).

PLAN-CHECK-102-END
