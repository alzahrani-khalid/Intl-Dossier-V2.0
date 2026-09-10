# Phase 101 — PLAN CHECK

**Verdict: FAIL-with-issues** — 1 BLOCKER, 7 WARNINGS (issues 1–8 below).
**Checked at** repo HEAD `3ec257adc` (branch `milestone/v10.0-trust`), 2026-09-10, by the plan-checker seat
spawned from `.tickmarkr/overseer/BRIEF-CHECKER-101.md`. Read-only: no plan was edited. No `Agent` tool.
No vitest or Playwright SUITE ran — the three oracles that would start one exited 3 at their routing
precheck (evidence in check 2); `--list` and `vitest list --filesOnly` are discovery only.

Inputs: `101-0{1..7}-PLAN.md`, `101-CONTEXT.md` (D-01..D-16, §3 map), `101-RESEARCH.md` (§8 oracles,
§10 drills), `ROADMAP.md:616-630` (Phase 101 criteria 1-6), `100-05-PLAN.md` (shape reference),
`~/.claude/agents/gsd-plan-checker.md` (verdict format and adversarial stance).

Note: the phase directory is **untracked** at HEAD (`git status --short .planning/phases/101-ci-gates-green/`
→ `?? .planning/phases/101-ci-gates-green/`), so every line number below refers to the working-tree file.

---

## Issues (numbered; plan + line; severity; what to change)

### 1. BLOCKER — 101-07-PLAN.md line 64: the C4 oracle can never read `smoke_check=fail`
`SC=$(gh pr checks -R $R "$PR" 2>/dev/null | grep -F 'RTL Portal + Component Smokes' | awk '{print $2}' | head -1)`
then line 70 requires `[ "$SC" = fail ]`. `gh pr checks` (non-TTY) is tab-separated, but the job name contains
spaces, and default `awk` splits on every whitespace, so `$2` is the second WORD of the name.
Measured against a real PR with that check red:

```
$ gh pr checks -R alzahrani-khalid/Intl-Dossier-V2.0 98 | grep -F 'RTL Portal + Component Smokes' | awk '{print $2}' | head -1
Portal
$ gh pr checks -R alzahrani-khalid/Intl-Dossier-V2.0 98 | grep -F 'RTL Portal + Component Smokes' | awk -F'\t' '{print $2}' | head -1
fail
$ gh pr checks -R alzahrani-khalid/Intl-Dossier-V2.0 98 --json name,state | head -c 120
[{"name":"Merge Playwright reports","state":"SUCCESS"},{"name":"Lighthouse CI","state":"SUCCESS"},...
$ gh --version
gh version 2.98.0 (2026-08-20)
```

So on the day the operator has done everything right (context added by name, nine contexts, smoke PR
`BLOCKED`, smoke check red) the oracle prints `smoke_check=Portal` and exits 1: criterion 4 is unsatisfiable
as written, and the failure would read as an operator defect. **This is the "ask whether a guard can ever
fire" class** (memory) — the guard cannot. Change line 64 to `awk -F'\t' '{print $2}'`, or better
`gh pr checks -R $R "$PR" --json name,state -q '.[] | select(.name=="RTL Portal + Component Smokes") | .state'`
and compare against `FAILURE` (the JSON state vocabulary is upper-case, as the sample shows). Update the
`text:` on line 71 and the §10 drill row `o07-c4` accordingly (the recorded exit 1 / last line stay the
same at HEAD because the context-absent check fires first, so the drill table needs no other change).

### 2. WARNING — 101-05-PLAN.md lines 57, 63 and 168: the register grep counts the FIXED table too
Oracle line 57 counts register rows as every line matching `^\| (tests/e2e/|frontend/tests/)[^|]+\| ` anywhere
in the SUMMARY; line 63 requires `ROWS == M` (markers). Action step 5 (line 168) then tells the executor to
write "a second table [that] lists the FIXED tests with the drift named" — and the natural row for that
table also begins `| tests/e2e/…`. Any fixed test therefore inflates ROWS above M and the bound oracle fails
on a correct SUMMARY. Either (a) fence the register grep to the `## Quarantine register` section, or (b)
prescribe the fixed-table row shape so it cannot match (e.g. rows begin `| FIXED | tests/e2e/…`) — and say
which in the plan, so the executor does not have to reshape the SUMMARY until the grader is happy.

### 3. WARNING — 101-05-PLAN.md line 47 (truth) and CONTEXT D-15: "skipped equal to the register rows" cannot hold for parametrised tests
D-15 and the must-have truth say the acceptance is "the reporter reading `skipped` equal to the table's row
count". One `test.fixme(true, …)` at the top of a test body inside a loop is ONE marker / ONE register row
but N skipped cells: `dossier-rtl-mobile` 18 cells at `:265:9`, `tailwind-remap-visual` 24 cells at `:35:15`,
`dossiers-rtl-a11y` two tests × six dossier types (RESEARCH §10.2). The second oracle (line 78) only asserts
`expected+skipped == N` and prints `skipped`; the judge (line 85) asks for "skipped reconciled against the
register". State the reconciliation rule explicitly (rows × cells-per-row = skipped, with the cell count
carried as a register column) so the judge and the executor agree before the run, not after.

### 4. WARNING — 101-CONTEXT.md D-01 ("counts SEVEN jobs, not six") contradicts D-07 + D-14 and every plan
All plans and both C5 oracles (101-04 line 56, 101-07 line 51) use **six** names; RESEARCH §10.5 records
the planner ruling that D-01's SEVEN "predates the D-07 deletion and is superseded". The plans are right and
the brief agrees (C5 population is 6). But the superseding sentence lives in RESEARCH, not in CONTEXT, and a
later reader of CONTEXT alone (the decision-coverage gate reads truths against CONTEXT) will see a locked
decision the plans contradict. Amend D-01 in CONTEXT with the same one-line supersession note.

### 5. WARNING — 101-01-PLAN.md lines 81-86: phase F of the drill has a fixed 1-second race, and two arms both yield 90
The squatter is planted `sleep 1` after launch, intended to land AFTER the wrapper's pre-spawn census. If the
census has not run yet (cold node start, first `pnpm exec` resolution) the wrapper's pre-spawn census sees a
port holder with no lease and REFUSES before spawning — a different arm from the one the phase is named for.
Both arms should compose to exit 90 with no report, so the assertion may still pass, but the drill would then
prove the refusal path and not the "foreign holder after the census" path. Record which arm fired (the wrapper
log names it) and accept either explicitly, or gate the plant on the lease file appearing (`wait_lease`) as
phases A-E already do. The plan already says every phase past the precheck is UNDRILLED tonight; this is the
phase most likely to surprise.

### 6. WARNING — 101-01-PLAN.md line 52: `wait_pw_gone` pattern may never match the wrapper's child
`pgrep -f "playwright test $ARGS"` assumes the child's argv is literally `playwright test <ARGS>`; run mode
spawns `pnpm exec playwright test <args> --reporter=json` and the resolved binary path may differ, so the
pattern can miss and the wait degrades to a no-op. That produces a FALSE RED (members_after read before the
session finished), never a false green — but a false red on a 12-run drill costs the executor an hour.
Consider waiting on the lease file disappearing, which the wrapper owns, instead of a cmdline grep.

### 7. WARNING — 101-06 line 27 and 101-07 lines 29/43/54: cut-off is "after 2026-09-10", so an act performed on the planning day (UTC) fails
`new Date(s.updatedAt) > "2026-09-10T23:59:59Z"` and `cut -c1-10 > "2026-09-10"` both reject anything
stamped on 2026-09-10 UTC. Riyadh evening on the 10th is still the 10th in UTC until 03:00 local on the
11th. Strict is the right direction for a "did this happen after planning" test, but the operator should be
told in the checkpoint text that a rotation or merge done today reads red until re-run tomorrow — or the
cut-off should be the planning HEAD commit time. Not a correctness hole; a foreseeable false red.

### 8. WARNING — 101-RESEARCH.md §3 line 347 cites `e2e.yml:24,64,99`; the file has the references at 28, 70, 105
```
$ grep -n 'E2E_SUPABASE_SERVICE_ROLE_KEY' .github/workflows/e2e.yml
28: ... 70: ... 105: ...
```
101-06-PLAN.md line 42 has the correct numbers. RESEARCH is stale by four lines (pin-a-sha rule). Cosmetic;
fix the RESEARCH line so the two do not disagree.

---

## Check 1 — Shape (PASS)

Parsed all seven front-matters with js-yaml via `node -e`. Every plan has all twelve fields the 100-05
reference carries (`phase, plan, type, wave, depends_on, files_modified, autonomous, requirements,
success_criterion, routing, truths, must_haves`), `must_haves.truths` is an array, every truth is a string
or an `{oracle, command|text}` object, and the body carries all six tags.

```
== 101-01: wave=1 depends_on=[] autonomous=true reqs=["CARRY-10"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-02: wave=2 depends_on=["101-01"] autonomous=true reqs=["CARRY-04"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-03: wave=1 depends_on=[] autonomous=true reqs=["CARRY-03"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-04: wave=2 depends_on=["101-01","101-03"] autonomous=true reqs=["CARRY-09","CARRY-10","CARRY-03"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-05: wave=3 depends_on=["101-01","101-02"] autonomous=true reqs=["CARRY-02","CARRY-09"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-06: wave=3 depends_on=[] autonomous=false reqs=["CARRY-02","CARRY-05"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
== 101-07: wave=4 depends_on=["101-01".."101-06"] autonomous=false reqs=["CARRY-02","CARRY-03","CARRY-05","CARRY-09"]
  missing_fields=[] truth_shapes=["string","oracle:command+cmd+text","oracle:command+cmd+text","oracle:command+cmd+text","oracle:command+cmd+text","oracle:judge+text"]  tags=all 6
100-05 reference: same 12 fields; truth shapes string,oracle:command,oracle:command,oracle:judge
```

Twelve `oracle: command` blocks extracted (o01-1, o02-1, o02-2, o03-1, o04-1, o05-1, o05-2, o06-1,
o07-1..4) — the same twelve rows §10.1 lists.

## Check 2 — Every oracle re-run from the repo root (PASS: all twelve match §10.1)

Each block was written byte-for-byte from the parsed front-matter to a file and run as
`bash -c "$(cat <file>)"` from `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`. Guard before
the three suite-starting oracles: `grep -c 'pw-run-reaped.mjs --lease-exec' frontend/playwright.config.ts` → `0`
(unrouted at HEAD, so the routing precheck must fire). After them: `.pw-leases` count 0, 5173 listeners 0.

| oracle | §10 exit | measured exit | measured last line (matches §10 last line?) |
| --- | --- | --- | --- |
| 101-01 o01-drill | 3 | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not yet routed through the lease writer - the drill has no subject (P101-01 task 1 not landed)` ✓ — routing precheck arm fired, nothing launched |
| 101-02 o02-a11y-run | 3 | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not routed through the lease writer (P101-01) - an unwrapped run would leak the session CARRY-10 is about (D-13)` ✓ — routing arm |
| 101-02 o02-focus-del | 1 | **1** | `FAIL: focus-indicators.spec.ts still tracked/present (D-11: deleted, secret-shaped literals gone from the tree)` ✓ (control: dossiers-a11y tracked; a11y list `Total: 182 tests in 13 files`) |
| 101-03 o03-include | 1 | **1** | `FAIL: the integration job would still collect 236 files (205 outside the CI-green 31, 0 of the 31 missing) - D-04 narrows include to exactly the files run 31848669701 passed` ✓ (control: base config 26) |
| 101-04 o04-ci-yaml | 1 | **1** | `  FAIL: D-14: ci.yml declares 18 job keys, want 17 (18 at planning minus test-e2e; build is a 2-way matrix so the API reports 18 runtime jobs)` ✓ |
| 101-05 o05-bound | 1 | **1** | `FAIL: 0 markers carry a run id 3184866*, 0 carry P101-QUAR at all - every reason names the run id (D-09)` ✓ (control fixme 13; list `220 tests in 65 files`) |
| 101-05 o05-fe-run | 3 | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not routed through the lease writer (P101-01) - D-13 forbids an unwrapped run` ✓ — routing arm |
| 101-06 o06-secrets | 1 | **1** | `FAIL: CARRY-01 rotation and the E2E_SUPABASE_SERVICE_ROLE_KEY write are not all recorded after the planning date` ✓ (0 of 7; SERVICE_ROLE_KEY ABSENT) |
| 101-07 o07-c1 | 1 | **1** | `FAIL: the latest main E2E run predates this phase (created 2026-08-14T22:58:38Z) - no phase PR has been merged` ✓ (control merge-reports success) |
| 101-07 o07-c2 | 1 | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` ✓ (control Lint success) |
| 101-07 o07-c5 | 1 | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` ✓ (6 jobs, 0 success; total 19; E2E Tests 1) |
| 101-07 o07-c4 | 1 | **1** | `FAIL: context 'RTL Portal + Component Smokes' absent from required_status_checks` ✓ (8 contexts, has_name=0, has_key=0) |

No mismatch. Issue 1 is NOT visible in this drill because the context-absent check exits before the
`smoke_check` comparison — which is exactly why a red-at-HEAD drill cannot vouch for the green path.

## Check 3 — Coverage (PASS)

| criterion / requirement | plans |
| --- | --- |
| C1 E2E green or in-spec quarantine | 101-05 (quarantine/fix, 21 root files), 101-07 (green `main` run, C1 oracle) |
| C2 integration green, D-3 resolved+recorded | 101-03 (include narrowed, D-3 RESOLVED line), 101-07 (C2 oracle) |
| C3 one a11y spec PASSING with evidence | 101-02 (dossiers-a11y 16/16 via wrapper, JSON stats) |
| C4 required context + smoke PR BLOCKED | 101-07 (POST by name after smoke row green; C4 oracle — see issue 1) |
| C5 six red suites green or quarantined | 101-04 (workflow), 101-05 (specs), 101-03 (integration), 101-07 (C5 oracle) |
| C6 zero attributed sessions, both configs | 101-01 (config + planted drill), 101-04 (CI steps through run mode) |
| CARRY-02 | 101-05, 101-06, 101-07 |
| CARRY-03 | 101-03, 101-04, 101-07 |
| CARRY-04 | 101-02 |
| CARRY-05 | 101-06, 101-07 |
| CARRY-09 | 101-04, 101-05, 101-07 |
| CARRY-10 | 101-01, 101-04 |

Human gates: the secret writes (101-06), the merge / protection POST / smoke PR (101-07) are the only
push/PR/protection/deploy acts, and both plans are `autonomous: false` with `checkpoint:human-action`
tasks. 101-01..05 contain no push, PR, protection or deploy step (grepped each `<action>`).

## Check 4 — Files and waves (PASS)

- `files_modified` disjoint across 101-01..05 (SUMMARY files excluded): no overlap (js-yaml parse, pairwise).
- `.github/workflows/*` appears only in 101-04 (`ci.yml`); `e2e.yml` in no plan (RESEARCH §10.5 records why).
- No plan depends on a same-or-later wave: 02(w2)→01(w1); 04(w2)→01,03(w1); 05(w3)→01(w1),02(w2);
  07(w4)→01..06(w1..3). 101-06 (w3) has no dependency, matching CONTEXT §3.
- Deviation from the CONTEXT §3 map: 101-05 is wave 3 (map said wave 1) — recorded and justified in
  RESEARCH §10.5 (D-13 and port-5173 contention); accepted.

## Check 5 — Oracle hygiene (PASS with issues 1, 2, 3, 5, 6 above)

- Hard-coded counts: 16 tests (o02-1), `182 tests in 13 files` (o02-2, o05-2), the 31 file names inline
  (o03-1), 17 job keys and the six names (o04-1), 29 files and `220 tests in 65 files` (o05-1), 9/98/182
  (o05-2), seven secret names (o06-1), `6 jobs, 6 success`, total 18, `E2E Tests` 0, 9 contexts (o07-3/4). ✓
- INSTRUMENT-CANNOT-RUN exit-3 arms in every oracle (tools, git tree, routing, `.env.test`, `E2E_BASE_URL`,
  5173 free, `--list` population, gh auth, control reads). ✓
- Every zero has a control: dossiers-a11y tracked (o02-2), base config 26 (o03-1), fixme 13 (o05-1),
  `E2E_BASE_URL` visible (o06-1), merge-reports / Lint / Lint (o07-1/2/3, exit 3 if the control does not
  read success). o04-1 is a positive-shape read (no zero asserted alone). ✓
- No oracle passes on an empty population: o01 requires `members_live>=1 port_live>=1` before any zero,
  o05-1 requires `markers>=1`, o03-1 requires exactly 31, o07-3 requires 6 named jobs AND total 18. ✓
- C5 population is six named jobs (`Security Scan`, `Tests (integration)`, `Accessibility Tests (RTL +
  WCAG AA)`, `RTL Portal + Component Smokes`, `RTL + Responsive Tests`, `Docker Build`) in both 101-04 line
  56 and 101-07 line 51. ✓ (CONTEXT D-01's "SEVEN" is issue 4.)
- C4 rejects the key string: 101-07 line 66 `grep -q '"test-rtl-smokes"' && FAIL`. ✓ — but the same oracle's
  `smoke_check` half is unsatisfiable (issue 1).

## Check 6 — Decision coverage (PASS)

Citations taken from each plan's top-level `truths:` "Decisions covered" string (the string the coverage gate
scans) and cross-checked against the Ref-notes line:

```
101-01: D-06 D-13 D-16     101-02: D-05 D-11 D-13     101-03: D-04 D-13
101-04: D-01 D-02 D-04 D-06 D-07 D-08 D-14            101-05: D-02 D-09 D-13 D-15
101-06: D-10 D-12          101-07: D-01 D-02 D-03 D-07 D-12 D-14 D-16
```

Every cited decision exists in CONTEXT (D-01..D-16 only). Every CONTEXT decision is cited by ≥1 plan:
D-01(04,07) D-02(04,05,07) D-03(07) D-04(03,04) D-05(02) D-06(01,04) D-07(04,07) D-08(04) D-09(05)
D-10(06) D-11(02) D-12(06,07) D-13(01,02,03,05) D-14(04,07) D-15(05) D-16(01,07). **Uncited: none.**
Deferred ideas (CONTEXT §4: option (a), app defects, Lighthouse/Eval, ghcr publishing, `.env.test` contents)
appear in no plan's write scope; option (a) is recommended-not-created in 101-03 as D-04 requires.

## Check 7 — What a worker cannot do in an isolated worktree with `.env.test` materialised

The `.tickmarkr/config.yaml` `setup` hook (`p99-worktree-test-env.sh`) materialises `.env.test` (with
`E2E_ADMIN_*` mapped from `TEST_USER_*`), copies `tests/e2e/support/storage/admin.json` if present (may be
stale), materialises `frontend/.env.development` (`VITE_SUPABASE_URL/ANON_KEY`), and scopes doppler; the
mount drill links `node_modules`. Given that, the residual worktree limits are:

1. **Ports 5173 and 5001 are machine-global, not worktree-local.** 101-01 (wave 1), 101-02 (wave 2) and
   101-05 (wave 3) each start the frontend stack; the planner serialised them across waves, and each oracle
   exits 3 if 5173 is held. But a tickmarkr run is LIVE right now (`.tickmarkr/graph.lock` holder pid 94047,
   `run-20260910-112306-0000000000000075`, `kill -0` → alive); its rendered gates or any other stack on
   this machine make every 101-01/02/05 oracle park with exit 3. Not a plan defect — a scheduling fact the
   overseer must own (one run per repository; the phase-101 run cannot start while 0075 is live).
2. **The phase directory is untracked** (`?? .planning/phases/101-ci-gates-green/`). D-16 and the
   `read_first` blocks assume workers can read CONTEXT/RESEARCH — they cannot until it is committed
   (memory: workers cannot read an untracked phase dir). Commit before compile.
3. **101-01 root drill phase A/B/C/D/E** runs `tests/e2e/signature-visuals/a11y.spec.ts --project=chromium-en
   --no-deps`: `--no-deps` skips the `setup` project, so it reads the copied `admin.json`, which may be
   expired (token ~1h). The test then errors, the report shows `unexpected=1`, and the wrapper passes rc 1
   through — the drill accepts `rc in 0/1`, so the session proof still holds. Name it in the SUMMARY so an
   `unexpected=1` is not read as a regression.
4. **101-05 root shards** (21 `tests/e2e/*` files) cannot be RUN in a worktree: `auth.setup.ts` needs all
   six `E2E_*` keys and the hook maps only `E2E_ADMIN_*`. The plan already bounds this to marker census +
   `--list`; note the bound's wording ("the six keys are absent") is slightly stale in a worktree (two are
   mapped) — cosmetic.
5. **`gh` inside the worker sandbox**: 101-03 and 101-05 fetch job logs with `gh run view --log-failed`;
   gh reads `~/.config/gh` (read-only, fine) but the P100-16 sandbox forbids `$HOME` writes — a gh version
   that wants to write its state file could fail. Exit-3 arms cover `gh auth status`; log fetches in
   `<action>` steps do not have one. Low risk; worth a `command -v gh && gh auth status` first line in
   those action steps.
6. **101-06 and 101-07 are not worktree work by design** (operator acts); their `auto` tasks only read live
   GitHub state and quote files, which a worktree can do.

Nothing in 101-01..05 needs a push, a PR, a protection edit, a deploy, or a secret value.

---

## Judgement

The plan set is well-shaped, the oracles are hard-coded and controlled, every decision is covered, and all
twelve drills reproduce exactly. It fails on one guard that can never fire — the C4 `smoke_check` parse in
101-07 — which would turn a correctly executed criterion 4 into a permanent red and misattribute it to the
operator. Fix issue 1, decide issues 2 and 3 (they change what the 101-05 executor writes), amend CONTEXT
for issue 4, and the set is ready to commit and compile.

---

## Round 1 re-check (2026-09-10, HEAD `3ec257adc`, phase dir still untracked — working-tree files)

**Final verdict: PASS** (one residual doc-only note, non-blocking).

Read `.tickmarkr/overseer/PLANWRITER-DONE-101.md` "Round 1 fixes", then re-verified each issue against the
current plan files. Read-only; no Agent tool; no suite ran (the three suite-starting oracles exited 3 at the
routing precheck: `grep -c 'pw-run-reaped.mjs --lease-exec' frontend/playwright.config.ts` → 0; leases 0 and
5173 listeners 0 afterwards).

### Issue-by-issue

| # | was | now | verified how | status |
| - | --- | --- | ------------ | ------ |
| 1 BLOCKER | `awk '{print $2}'` → `Portal` | 101-07 line 64: `gh pr checks --json name,state -q '.[] \| select(.name=="RTL Portal + Component Smokes") \| .state'`; line 70 compares to `FAILURE`; attestation template (142) and checkpoint step 4 (130) updated | Ran the exact parse on PR 98 → `FAILURE`. The guard can now fire. | FIXED |
| 2 | register grep counted the FIXED table | line 57: grep fenced by `awk '/^## Quarantine register/{f=1;next} /^## /{f=0} f'`; action step 5 (168-177) puts fixed rows under `## Fixed tests` beginning `\| FIXED \|` | Fixture with 2 register rows (18+1 cells), one `\| FIXED \|` row and one path-shaped row outside the section → `rows=2 cells=19`. Both decoys ignored. | FIXED |
| 3 | `skipped == rows` impossible for parametrised tests | register 5th column `cells`; `o05-bound` line 64 asserts every row numeric and `sum(cells) >= rows`; `o05-fe-run` line 76-80 reads the register per suite and asserts `skipped >= sum(cells) >= rows`; truth, text, action, judge all say so | Same fixture through the `regcount()` awk → `2 19`. | FIXED in plans; **residual**: CONTEXT D-15 still reads "`skipped` equal to the table's row count" (the overseer amended D-01 but not D-15). Doc-only; the plans and RESEARCH carry the honest `>=` shape. Recommend a one-line amendment to D-15. |
| 4 | CONTEXT D-01 "SEVEN" | CONTEXT D-01 now names the SIX jobs explicitly | Re-read D-01 (line 19). No plan says seven (`grep -n SEVEN` → only "the SEVENTH secret" in 101-06). | FIXED |
| 5 | phase F fixed 1 s sleep, two arms | 101-01 line 81: plant gated on `wait_lease` (the pre-spawn census is provably past); line 86 records `arm=[...]` from the wrapper log, either arm accepted, only rc=90 with no report passes | Read lines 80-88; action step 5 (165) tells the executor to paste the arm. | FIXED |
| 6 | `wait_pw_gone` pgrep could no-op | line 52: waits on the lease file disappearing OR a loose pgrep on the first spec token, 180 s bound, returns true only when no lease remains | Read line 52. | FIXED |
| 7 | cut-off rejected acts on 2026-09-10 UTC | full-ISO compare against planning START `2026-09-10T18:00:00Z` in 101-06 line 27 and 101-07 lines 29/43/54; 101-06 checkpoint step 6 (84-85) tells the operator; success_criterion/done updated | Read the lines; the `/* */` comment form parses (o06 ran). | FIXED |
| 8 | RESEARCH §3 `e2e.yml:24,64,99` | §3 line 347 now `28,70,105` with a correction note; §10 line 947 records it | `grep -n 'E2E_SUPABASE_SERVICE_ROLE_KEY' .github/workflows/e2e.yml` → 28, 70, 105. | FIXED |

### Oracles re-run (all twelve, `bash -c "$(cat <block>)"` from the repo root, blocks re-extracted from the current front-matter with js-yaml)

| oracle | exit | last line | matches writer's round-1 table |
| --- | --- | --- | --- |
| o01-drill | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not yet routed through the lease writer - the drill has no subject (P101-01 task 1 not landed)` | ✓ (routing arm; nothing launched) |
| o02-a11y-run | **3** | `INSTRUMENT-CANNOT-RUN: … not routed through the lease writer (P101-01) - an unwrapped run would leak the session CARRY-10 is about (D-13)` | ✓ |
| o02-focus-del | **1** | `FAIL: focus-indicators.spec.ts still tracked/present (D-11: …)` | ✓ |
| o03-include | **1** | `FAIL: the integration job would still collect 236 files (205 outside the CI-green 31, 0 of the 31 missing) …` | ✓ |
| o04-ci-yaml | **1** | `  FAIL: D-14: ci.yml declares 18 job keys, want 17 …` | ✓ |
| o05-bound | **1** | `FAIL: 0 markers carry a run id 3184866*, 0 carry P101-QUAR at all - every reason names the run id (D-09)` (rows 0, cells 0, non-numeric 0, list 220/65, control 13) | ✓ |
| o05-fe-run | **3** | `INSTRUMENT-CANNOT-RUN: … not routed through the lease writer (P101-01) - D-13 forbids an unwrapped run` | ✓ |
| o06-secrets | **1** | `FAIL: CARRY-01 rotation and the E2E_SUPABASE_SERVICE_ROLE_KEY write are not all recorded after the planning date` (0 of 7 after 18:00Z) | ✓ |
| o07-c1 | **1** | `FAIL: the latest main E2E run predates this phase (created 2026-08-14T22:58:38Z) - no phase PR has been merged` | ✓ |
| o07-c2 | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` | ✓ |
| o07-c5 | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` | ✓ |
| o07-c4 | **1** | `FAIL: context 'RTL Portal + Component Smokes' absent from required_status_checks` (status line now expects `smoke_check=FAILURE`) | ✓ |

**No oracle exits 0 at HEAD.** Three exit 3 at the same routing precondition, nine exit 1 with their controls
alive (dossiers-a11y tracked, base vitest 26, fixme control 13, root list 220/65, E2E_BASE_URL visible,
merge-reports / Lint success).

### Structural checks re-run
- Shape: all seven parse; twelve fields present; truth shapes string / oracle:command(+cmd+text) /
  oracle:judge(+text); all six body tags present. Same as round 0.
- files_modified disjoint across 101-01..05; `.github/workflows/*` only in 101-04; waves consistent
  (no plan depends on a same-or-later wave); no dangling depends_on.
- Decision coverage from the top-level `truths:` strings: 16 CONTEXT decisions, uncited none, dangling none.
- Human gates still only in 101-06 / 101-07 (`autonomous: false`).

### Still true from round 0 (not plan defects)
The phase directory is untracked (commit before compile, D-16). A tickmarkr run was live at round 0
(lock holder pid 94047); the 5173/5001-dependent oracles of 01/02/05 park with exit 3 while any stack holds
the port.

ROUND-1-RECHECK-END
