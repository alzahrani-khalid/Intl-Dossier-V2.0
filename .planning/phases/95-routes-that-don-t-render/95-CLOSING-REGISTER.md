# 95-CLOSING-REGISTER — Phase 95 "Routes That Don't Render", closing derivations

Written by plan `95-09` (wave 2) on 2026-08-16, after all eight wave-1 plans executed and wrote
their SUMMARYs. **This plan implemented no fixes.** Everything below is derived by command at
close, with its population definition and what falls outside it (D-12), or it is transcribed
verbatim from a wave-1 SUMMARY with the SUMMARY named.

Anchor: the SSH-signed tag `phase-95-base` = `a3d2d269ac3f550eb262f5d32ffcbb462db0958f`
(commit `2c8013208`). Every scope derivation below is anchored to that tag, never to HEAD (C7).

**Reserved path (D-17):** `95-VERIFICATION-INDEPENDENT.md` belongs to the independent
`gsd-verifier`. This plan did not create, edit or pre-populate it. Verified at close:

```
$ ls .planning/phases/95-routes-that-don-t-render/95-VERIFICATION-INDEPENDENT.md
ls: ...95-VERIFICATION-INDEPENDENT.md: No such file or directory       # reservation holds
$ [ -e .../95-CONTEXT.md ] && echo PRESENT
PRESENT                                                                # the test is not vacuous
```

---

## 1. ROUTE POPULATION

**Population definition:** every SPA route = the keys of the generated `FileRoutesByFullPath`
interface in `frontend/src/routeTree.gen.ts`. Derived by the `95-RESEARCH.md` §Route Population
Derivation command, reused **verbatim** — never a hand list (the population-blindness class).

```bash
sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
  | command grep -oE "'[^']+':" | tr -d "':" | sort -u
```

| tree                         | count   |
| ---------------------------- | ------- |
| `phase-95-base` (the anchor) | **201** |
| HEAD (close)                 | **202** |

**Delta = +1 net, three moves — all of them DEAD-08 (plan 95-05), none of them anything else:**

```
ADDED    /legislation/
ADDED    /positions/$id/
REMOVED  /positions/$positionId
```

That is exactly the slot consolidation 95-05 describes: the competing `$positionId` slot deleted,
the `$id` editor tab promoted to a real child index route, and `legislation` given an index child
under its new layout. The research-time count of 201 is reproduced at the anchor, so the 202 is a
measured delta and not a re-baselined number.

**Zeros instrument-tested (D-20 — `grep` here is a ugrep wrapper honouring `.gitignore`, so every
sweep below uses `command grep`, explicit file arguments, or `find | xargs`):** the extraction is
proven non-vacuous by two known-present keys (`/monitoring` → 1, `/search` → 1) and by its
endpoints (`/`, `/activity`, `/admin/` … `/word-assistant`, `/workflow-automation`,
`/working-groups`).

### What this derivation CANNOT see — stated as part of the rule, with each second source run

**(1) Proxy-claimed prefixes.** The Vite dev proxy intercepts document requests _before_ the SPA;
DEAD-04 is the proof instance. Second population source, run at both ends:

```
$ command grep -nE "^\s+'/[^']*': \{" frontend/vite.config.ts
    at phase-95-base (7)                     at HEAD (6)
    '/api/copilot' '/api' '/ai'              '/api/copilot' '/api' '/ai'
    '/analytics-dashboard'                   '/analytics-dashboard'
    '/organization-benchmarks'               '/organization-benchmarks'
    '/notifications-center'                  '/notifications-center'
    '/monitoring'          <-- deleted       (gone)
```

7 → 6, the single deletion being `/monitoring`. **The residue is the exclusion record:** six
prefixes still sit in front of the SPA route tree and are invisible to the `routeTree.gen.ts`
derivation. `/analytics-dashboard`, `/organization-benchmarks` and `/notifications-center` are
bare-prefix claims of the same shape DEAD-04 was — each is a latent DEAD-04, unexamined by this
phase and named here rather than discovered later.

**(2) Production reverse-proxy claims.**

```
$ command grep -n "location" deploy/nginx/*.conf        -> 25 location lines, 4 conf files
  location /monitoring  -> 0     (across all four)
  location /api/        -> 6     (the instrument control: the same command DOES see locations)
```

Prod carries no `/monitoring` claim and no nginx file was edited (95-04). The zero is real.

**(3) Runtime-created routes — none.** Derived, not quoted:

```
$ find frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name 'routeTree.gen.ts' \
    -print0 | xargs -0 command grep -ln 'router\.addRoute\|createRoute(' | grep -v '^frontend/src/routes/'
  (none)
$ ... same machinery, 'createFileRoute'  -> 210 files      # control: the sweep sees route files
```

Routing is exclusively file-based, as research stated — now measured.

**(4) `routeFileIgnorePattern`-excluded files.** `frontend/vite.config.ts:36` sets
`routeFileIgnorePattern: '(__tests__|\.test\.)'`. Any route file under a `__tests__` directory or
named `*.test.*` never enters the generated tree and therefore never enters this population. No
such file exists today; the exclusion is stated because it is a standing blind spot, not because
it currently hides anything.

---

## 2. REQUIREMENT COVERAGE — 8/8, re-derived by command

**Population:** the nine `95-*-PLAN.md` files on disk. Outside it: nothing — the phase directory
is the complete plan set. **Register set:** the eight `REQUIREMENTS.md` rows named by
`ACCEPTANCE-P95-PLAN.md`, not the ROADMAP's stale five-ID line.

```bash
for id in DEAD-01 DEAD-02 DEAD-03 DEAD-04 DEAD-08 DEAD-09 NOTFOUND-COMPONENT-01 RETENTION-CAST-01; do
  command grep -l "requirements:.*$id" .planning/phases/95-routes-that-don-t-render/95-*-PLAN.md \
    || echo "MISSING $id"
done
```

Eight matches, zero `MISSING` lines:

| requirement             | plan    | success criterion / filed-finding close (from that plan's `success_criterion:`)                                       | closed by                                                                          |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `DEAD-01`               | `95-01` | 1 — /search returns results for a typed query and for each suggestion chip, no forEach crash                          | `adaptSearchEnvelope` at the repository seam + real `quickswitcher-search` call    |
| `DEAD-02`               | `95-02` | 2 — /tasks/queue renders its queue against a deployed assignments-queue function                                      | `apiGet` query-string transport + redeploy v11→v12 — **see the NAMED BOUND in §6** |
| `DEAD-03`               | `95-03` | 3 — /scenario-sandbox either loads or shows an error; a 500 is never pixel-identical to still loading                 | `QueryErrorState` retrofit + bounded retry (18.0s → 6.2s window)                   |
| `DEAD-04`               | `95-04` | 4 — /monitoring resolves to the SPA route rather than raw proxy JSON, decision recorded                               | API moved to `/api/monitoring`, proxy entry deleted, both callers authenticated    |
| `DEAD-08`               | `95-05` | 5 — one route file per slot; legislation.tsx renders an Outlet; positions approvals/versions children drive tab state | `$positionId.tsx` deleted, `$id` layout + `<Outlet/>`, legislation layout + index  |
| `DEAD-09`               | `95-06` | filed-finding close — real report generation; the honest unavailable terminal state is the only fallback              | real POST → storage artifact → fetchable signed url, 6 types × 2 formats           |
| `NOTFOUND-COMPONENT-01` | `95-07` | filed-finding close — the component-`notFound({routeId})` rule is ENFORCED by lint (D-09 default branch: ADD)         | local ESLint rule at `error` over `frontend/src/**`, inside the CI-blocking chain  |
| `RETENTION-CAST-01`     | `95-08` | filed-finding close — the six false casts unwrap the real `{data:[...]}` envelope; never a coerce-to-empty            | one shared `unwrapListEnvelope<T>`, 17-case oracle, `asRows` workaround deleted    |

**Population limit of the loop itself, stated rather than assumed.** The pattern
`requirements:.*$id` matches only the **inline-list** frontmatter form `requirements: [DEAD-01]`.
`95-09`'s own frontmatter uses the block form (`requirements:` then `  - DEAD-01` …) and is
therefore **invisible to this loop** — correctly, since the loop measures which plan _owns_ a
requirement, and 95-09's listing is a closing restatement, not an ownership claim. Each of the
eight resolves to exactly one owning plan; no requirement is claimed twice and none is unclaimed.
`NOTFOUND-COMPONENT-01` closed as ENFORCE, not as retire-with-decision — the register note is
therefore a plain Complete.

**Red constructible:** delete one `requirements:` entry in a scratch copy and the loop's failure
branch prints `MISSING <id>`; the gate chain then exits 1.

---

## 3. DECISION COVERAGE — green, with the falsification drill ON DISK (D-18)

**Population:** the twenty two-digit `D-NN` decisions in `95-CONTEXT.md`, scanned against plan
frontmatter `must_haves`/`truths`/`objective` plus matching body headings only.

**GREEN, at HEAD:**

```
$ node scripts/decision-coverage.mjs .planning/phases/95-routes-that-don-t-render \
    .planning/phases/95-routes-that-don-t-render/95-CONTEXT.md
  "passed": true,  "total": 20,  "covered": 20,  "uncovered": []
COVERAGE_EXIT=0
```

**FALSIFICATION DRILL — a green nobody has seen go red is not evidence.** Run in a SCRATCH COPY of
the phase directory (`/tmp/95-09-cov-drill`), never on the plans' own tree.

_(i) the scratch copy reproduces the green first — otherwise the break proves nothing:_

```
"passed": true,  "total": 20,  "covered": 20,  "uncovered": []
```

_(ii) remove one citation truth — `D-18` in the scratch `95-09-PLAN.md` (2 tokens → 0):_

```
SCRATCH_RED_EXIT=1
  "passed": false,  "total": 20,  "covered": 19,
  "uncovered": [ { "id": "D-18",
      "text": "**D-18: Decision coverage is green mechanically with a falsification drill on disk** —" } ]
```

_(iii) restore the truth, re-run:_

```
D-18 tokens restored: 2
SCRATCH_GREEN_EXIT=0
"passed": true,  "total": 20,  "covered": 20,  "uncovered": []
```

**The plans' own tree is byte-identical across the drill** (C1's scratch-copy clause):

```
git status --porcelain -- .planning/phases/95-routes-that-don-t-render/
  BEFORE: 0 dirty path(s)      AFTER: 0 dirty path(s)
```

---

## 4. GATE DRILL — all 24 gates, both directions, per GATE-STANDARD

**Population:** every `<automated>` block in the nine plans = **24 gates**, extracted and run by
`scripts/gate-drill.mjs`. Outside it: nothing — no plan carries a gate the script cannot extract.

```
$ node scripts/gate-drill.mjs .planning/phases/95-routes-that-don-t-render --json --timeout 900
GATEDRILL_EXIT=0        gateCount: 24        parse: 24/24 PARSE-OK
BASELINE RUN (before this plan's Tasks 1-2 landed):  green 22 / red 2
  the 2 reds are 95-09_g2 and 95-09_g3 — this plan's own unwritten subjects
```

**A script green is NOT soundness evidence, and this register does not treat it as one.** The
script establishes that a gate parses and what it exits against the tree in front of it. It cannot
distinguish "red for its subject" from "red because the subject is absent" — that is the whole
Phase 92 finding, and constructing the done state is the half that stays authored per gate.

| plan.gate | C1 red (observed)                                                                                                                                                                                                                                                                            | C1 green (how the done state was constructed)                                                                                                                           | C2–C10 notes                                                                                                                                                                                                      | verdict                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 95-01_g1  | `Tests 7 failed (7)` — `adaptSearchEnvelope` did not exist; range-scoped grep 0 (95-01 SUMMARY)                                                                                                                                                                                              | Task 1 landed: `7 passed`, tsc clean, `TASK1_GATE_EXIT=0`                                                                                                               | C8: the file-level grep was **vacuously green** at HEAD (1 hit) — the gate is range-scoped for exactly that reason                                                                                                | SOUND                                                      |
| 95-01_g2  | `QueryErrorState` 0, `isError` 0 in `DossierSearchPage.tsx` at the HEAD artifact                                                                                                                                                                                                             | Task 2 landed: `TASK2_GATE_EXIT=0`, `error.message` occurrences 0                                                                                                       | —                                                                                                                                                                                                                 | SOUND                                                      |
| 95-01_g3  | `TYPED-STATE: UN -> crash`, `CHIP-STATE: Saudi Arabia -> crash`, 2 failed                                                                                                                                                                                                                    | after Tasks 1-2, live app: `2 passed (13.1s)`, `TASK3_GATE_EXIT=0`                                                                                                      | C6: `--no-deps`; the oracle's own first draft passed against broken HEAD and was repaired (95-01 deviation 2)                                                                                                     | SOUND                                                      |
| 95-02_g1  | `apiGet` clause exit 1; non-comment `functions.invoke` count 1                                                                                                                                                                                                                               | transport swapped: exit 0                                                                                                                                               | —                                                                                                                                                                                                                 | SOUND                                                      |
| 95-02_g2  | `test 11 -gt 11` → exit 1 at the re-derived baseline                                                                                                                                                                                                                                         | deploy v11→v12: `12 -gt 11` → exit 0                                                                                                                                    | C4: threshold **derived** at execution start, not frozen; manifest inclusion was green before the work and is cited nowhere                                                                                       | SOUND                                                      |
| 95-02_g3  | `git cat-file -e HEAD:tests/e2e/95-queue-renders.spec.ts` → 128 (absent)                                                                                                                                                                                                                     | spec written: exit 0, `--list` = 2                                                                                                                                      | C6: `--no-deps` + hardcoded count                                                                                                                                                                                 | SOUND                                                      |
| 95-03_g1  | `^\s*Retry\s*$` = 1 in the pre-edit blob (gate requires 0)                                                                                                                                                                                                                                   | retrofit landed: `TASK1_GATE_AT_HEAD_FINAL_EXIT=0`; the 0 instrument-tested against the pre-edit blob's 1                                                               | C2: one transient red at 20:07Z was **exogenous** (4 TS18048 in a sibling lane's uncommitted file) — recorded, gate not edited                                                                                    | SOUND                                                      |
| 95-03_g2  | `RED_FINAL_EXIT=1` — `query-error-state` testid not found under the bespoke branch                                                                                                                                                                                                           | `TASK2_GATE_EXIT=0`, `2 passed (8.7s)`                                                                                                                                  | C10 caveat recorded by 95-03 itself: **only Test 1 discriminates**; Test 2 passes in both worlds by design                                                                                                        | SOUND                                                      |
| 95-04_g1  | exit **1** at `2c8013208` — no `/api/monitoring` mount, proxy population 7                                                                                                                                                                                                                   | remount + proxy deletion: exit 0                                                                                                                                        | C8: the gate fired on a **doc comment** quoting the old literal — evidence it is load-bearing                                                                                                                     | SOUND                                                      |
| 95-04_g2  | **NOT recorded by 95-04 (green only). CONSTRUCTED AT CLOSE, here:** a synthetic `location /monitoring/` appended to a scratch copy of `nginx.prod.conf` → gate exit **1**; the `location /api/` precondition clause passed in that same scratch run (6 hits), so the red reached the subject | real tree, unchanged: exit **0**                                                                                                                                        | C5: the zero carries a same-chain positive precondition (`location /api/`), so a missing root cannot pass it vacuously                                                                                            | SOUND _(red supplied at close, not by the producing plan)_ |
| 95-04_g3  | `2 failed` on a red-drill stack (temporary config on :5299 re-adding the proxy entry): content-type `application/json`, expected `/^text\/html/`                                                                                                                                             | real stack: `2 passed (3.6s)`, exit 0                                                                                                                                   | C2: two further pre-work reds observed on the real stack (`text/plain` 404, then `application/json`) — never HTML                                                                                                 | SOUND                                                      |
| 95-05_g1  | exit 1 — `positionId` count **13** in `routeTree.gen.ts` (gate requires 0); `<Outlet` 0; `as any` 1                                                                                                                                                                                          | consolidation landed: exit 0, `positionId` 0, `<Outlet` 2                                                                                                               | C5: the `/positions/$id/approvals` 10-hit instrument test proves the grep reads the generated file                                                                                                                | SOUND                                                      |
| 95-05_g2  | exit 1 — `legislation/index.tsx` absent, `<Outlet` 0, index key 0 (0 instrument-tested against `$id`=5, `/legislation`=8 in the same file)                                                                                                                                                   | layout + index child landed: exit 0, index key 3                                                                                                                        | —                                                                                                                                                                                                                 | SOUND                                                      |
| 95-05_g3  | Test 3 red **attributable** on a detached worktree at `391c27ea1`: the LIST rendered at a detail URL, snapshot-captured. Tests 1-2 **UNABLE TO MEASURE** (C2)                                                                                                                                | `3 passed`, exit 0, repeated 3×                                                                                                                                         | **RULED**: `RULING-P95-03-BLOCKED-9505.md` — ACCEPT-AS-RECORDED. Cause: staging `ALLOWED_ORIGINS` admits only `:5173` (7 ports probed, all null; `:5173` green 3/3 = the positive control). Not re-litigated here | SOUND for test 3; **tests 1-2 red UNMEASURED, ruled**      |
| 95-06_g1  | `TASK1_GATE_EXIT=1` — `setTimeout` 1, `status:202` 1, `createSignedUrl` 0, `from('private')` 0                                                                                                                                                                                               | real POST landed: exit 0, `job_id` 0                                                                                                                                    | C5: instrument control `ReportRequest`=2 proves the grep sees the file                                                                                                                                            | SOUND                                                      |
| 95-06_g2  | `TASK2_GATE_EXIT=1` — pending/failed keys 0; node key check `MISSING key pending / failed / completed`                                                                                                                                                                                       | truthful states + both locales: exit 0                                                                                                                                  | i18n: keys landed in EN **and** AR in the same commit                                                                                                                                                             | SOUND                                                      |
| 95-06_g3  | `PROBE_EXIT_BEFORE_DEPLOY=1` against the deployed mock (v12): `202`, `status=pending`, `url length 0`                                                                                                                                                                                        | after deploy (tip v14): 6 types × 2 formats, artifacts **fetched back** (200, 249–4002 bytes), pdf refused 501                                                          | C2 instrument test: creds stripped → `UNABLE TO MEASURE`, exit 2 — the exit-2 path is real, not decorative                                                                                                        | SOUND                                                      |
| 95-07_g1  | **NOT recorded by 95-07 (green only). CONSTRUCTED AT CLOSE, anchored:** at `phase-95-base` both `test -f` subjects are absent (`git cat-file -e` → 128, 128) and `no-bare-component-notfound` in `eslint.config.mjs` = **0** (control: `rtl-friendly` = 3 in the same anchored blob)         | on disk: `TASK1_GATE_EXIT=0`                                                                                                                                            | —                                                                                                                                                                                                                 | SOUND _(red supplied at close, not by the producing plan)_ |
| 95-07_g2  | `RED_EXIT=0` with **`grep -c` = 0** on the ruleId — the attribution assertion fails; `fatalErrorCount: 0` and empty stderr prove it reached the assertion of record, not a tooling death (C2)                                                                                                | rule registered: `POS_EXIT=1`, 2 ruleId hits (bare **and** `{global:true}`); negatives exit 0 with the rule proven live at severity 2 on all three files in one process | C8/C10: the negative control is not "silence" — it is one ESLint process over fixture + sites, rule-hits 2/0/0/0                                                                                                  | SOUND                                                      |
| 95-08_g1  | `TASK1_GATE_PREWORK_EXIT=1` (`No test files found`), then the oracle vs the casts: **17 failed (17)**                                                                                                                                                                                        | `17 passed (17)`, tsc clean, exit 0 (`TASK1_GATE_FROM_ROOT_EXIT=0`)                                                                                                     | the forbidden `Array.isArray(x)?x:[]` shape fails **8 of 17** — banned behaviourally, not by a prose-trippable grep (C8)                                                                                          | SOUND                                                      |
| 95-08_g2  | `TASK2_GATE_PREWORK_EXIT=1` — `asRows` count **8** (gate requires 0)                                                                                                                                                                                                                         | exit 0; the previously-UNPROVEN e2e half ran: `4 passed (12.1s)`, 16 real policy rows                                                                                   | C6: `--no-deps` + hardcoded count 4; the deliberately-red legal-holds region **stayed red**                                                                                                                       | SOUND                                                      |
| 95-09_g1  | exit **1** in a detached worktree at `phase-95-base` — `scripts/c9b-sweep.sh` absent; the later clauses were runnable there (`git rev-parse` on the tag exit 0), so the red is the subject's                                                                                                 | exit **0** on the shipped script, with the live self-test finding `93-admin-surfaces-error.spec.ts`                                                                     | C7: anchored to the tag, not HEAD                                                                                                                                                                                 | SOUND                                                      |
| 95-09_g2  | exit **1** in the baseline drill above — `95-CLOSING-REGISTER.md` absent                                                                                                                                                                                                                     | this file; final drill re-run below                                                                                                                                     | —                                                                                                                                                                                                                 | SOUND                                                      |
| 95-09_g3  | exit **1** in the baseline drill above — decision file absent, all eight rows `Pending`                                                                                                                                                                                                      | Task 2's records + row flips; final drill re-run below                                                                                                                  | C7: the out-of-phase guard is anchored to `phase-95-base`                                                                                                                                                         | SOUND                                                      |

**Nothing is recorded `CANNOT CONSTRUCT`.** Two gates arrived at this register with a green and no
red (95-04_g2, 95-07_g1) — both reds were constructed here and are pasted above. The one direction
that remains genuinely unobserved is 95-05_g3's tests 1-2 pre-fix red, which is **ruled**
(`RULING-P95-03-BLOCKED-9505.md`) and is not re-litigated in this register.

### UNPROVEN debts declared at planning time — every one now paid, with its payer

| plan    | declared UNPROVEN, needing…                                       | paid by                                                                                                                                        |
| ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `95-01` | Tasks 1-2 landed + the app running against staging                | 95-01 SUMMARY §Task 3 gate — red `-> crash`, green `2 passed (13.1s)`                                                                          |
| `95-02` | the Task 2 deploy + the running app                               | 95-02 SUMMARY §Deployment oracle — `11 -gt 11` red, `12 -gt 11` green                                                                          |
| `95-03` | Task 1 landed                                                     | 95-03 SUMMARY §Task 2 gate — `RED_FINAL_EXIT=1`, `TASK2_GATE_EXIT=0`                                                                           |
| `95-04` | the running dev stack (curl half)                                 | 95-04 SUMMARY §Condition 1c — 200 / 401 / `text/html`, stack repaired first                                                                    |
| `95-04` | Task 1 landed + dev stack (e2e half)                              | 95-04 SUMMARY §Task 3 red drill — `2 failed` on the :5299 red stack                                                                            |
| `95-05` | Tasks 1-2 + running app + ≥1 staging position in a trigger status | 95-05 SUMMARY — 2 `draft` + 2 `published` on staging, so test 2's opportunistic arm **executed**; annotated `out-of-set-deep-link -> asserted` |
| `95-06` | Task 1 deployed to staging                                        | 95-06 SUMMARY §Task 3 gate — `PROBE_EXIT_BEFORE_DEPLOY=1` → `TASK3_GATE_EXIT=0` at tip v14                                                     |
| `95-08` | the running app against staging                                   | 95-08 SUMMARY §Task 2 gate — `4 passed (12.1s)`, 16 policy rows                                                                                |
| `95-09` | `phase-95-base` to exist                                          | tag present at `a3d2d269a`; Task 0's tag-dependent halves drilled (§ this file, 95-09_g1)                                                      |
| `95-09` | the eight plans executed                                          | this register                                                                                                                                  |

---

## 5. C9a / C9b — cross-plan and cross-PHASE artifact coherence

### C9a — producers derived from `files_modified` **AND** every `<files>` task block

**Population:** 43 distinct declared paths across the nine plans, taken from both sources. The
92-04 defect shape is a path declared **only** in a `<files>` block, invisible to a
frontmatter-only sweep; derived per plan, that set is **empty** here:

```
95-01: 5 files_modified entries    95-04: 5    95-07: 3
95-02: 3                           95-05: 12   95-08: 3
95-03: 3                           95-06: 5    95-09: 4
  (no ONLY-IN-<files> line under any plan — every <files> path is declared in files_modified too)
```

Producer → consuming-gate table, derived by matching each declared path against every plan's
`<automated>` blocks:

| artifact                                                                  | produced by | gated by          | held?                                                            |
| ------------------------------------------------------------------------- | ----------- | ----------------- | ---------------------------------------------------------------- |
| `tests/e2e/95-search-renders.spec.ts`                                     | 95-01       | 95-01             | ✅ same plan                                                     |
| `tests/e2e/95-queue-renders.spec.ts`                                      | 95-02       | 95-02             | ✅ same plan                                                     |
| `tests/e2e/95-sandbox-error.spec.ts`                                      | 95-03       | 95-03             | ✅ same plan                                                     |
| `tests/e2e/95-monitoring-mounts.spec.ts`                                  | 95-04       | 95-04             | ✅ same plan                                                     |
| `tests/e2e/95-slots-tabs.spec.ts`                                         | 95-05       | 95-05             | ✅ same plan                                                     |
| `scripts/probe-report-generate.mjs`                                       | 95-06       | 95-06             | ✅ same plan                                                     |
| `tools/eslint-fixtures/bad-bare-component-notfound.tsx` + the rule module | 95-07       | 95-07             | ✅ same plan                                                     |
| **`scripts/probe-edge-auth.sh`**                                          | **95-02**   | **95-02 + 95-06** | ✅ **the one genuine cross-plan artifact** — see below           |
| `scripts/c9b-sweep.sh`                                                    | 95-09 T0    | 95-09 T0 + T1     | ✅ produced by Task 0, consumed by Task 1 of the same plan       |
| 95-04 SUMMARY §`DEAD-04 decision for the record`                          | 95-04       | 95-09 T2          | ✅ single-writer hand-off; 95-04 deliberately wrote neither file |

**The one cross-plan artifact, named because the plan's expected list did not have it.** 95-02
modifies `scripts/probe-edge-auth.sh` (adding an indented `404-kind:` line) and **95-06's gate
also runs it** (`bash scripts/probe-edge-auth.sh reports`, grepping the `reports -> 200` line).
This is precisely the C9a shape — one plan's output, another plan's gate's input — and the format
contract **held**: 95-02 changed only what a 404 prints and left the `<fn> -> <status>` line
byte-identical, which is the line 95-06 greps. Both plans closed green and 95-06's gate ran the
modified script (`reports -> 200`). Recorded because it was a live contract, not because it broke.

**One added artifact outside every plan's declared write set:**
`supabase/migrations/20260816500002_p95_private_storage_bucket.sql` (95-06 deviation 1 — the
`private` bucket did not exist). Declared in that SUMMARY, applied via the Supabase MCP per the
house rule, and it repairs two pre-existing writers (`pdf-generate`, `ai-extract`) as a side
effect. Named here so the phase's artifact inventory is complete.

### C9b — the consumer set is not bounded by the phase

**Run ONLY through the new fail-closed instrument** (warning-12 binding — never the GATE-STANDARD
inline block, which under zsh searches nothing and reports clean):

```
$ bash scripts/c9b-sweep.sh phase-95-base
CONTROL OK: \bdescribe\b -> 619 file(s) of 752 across 4 root(s): ./backend/tests ./e2e/tests ./frontend/tests ./tests
C9B_SWEEP_EXIT=0        # no INSTRUMENT-FAILED line — so the zeros below are trustworthy
```

Full output at `/tmp/95-09-c9b.txt`; reproduce with the one line above. Candidate counts (the raw
lists run to hundreds of filenames for the common-noun identifiers and are not pasted verbatim):

```
UNSAFE (triage by hand): useRetentionPolicies.test / dossiers.repository.search.test /
                         dossiers.repository / report-builder.json (x2) / routeTree.gen /
                         dossier-search.types        <- reported and skipped, never interpolated

frontend/src/routes/_protected/positions/$id.tsx             447 candidates   (id = `id`)
frontend/src/routes/_protected/positions/$id/index.tsx       447 candidates   (id = `id`)
backend/src/index.ts                                         152 candidates   (id = `src`)
frontend/src/routes/_protected/positions.tsx                 102 candidates
supabase/functions/reports/index.ts                           53 candidates
frontend/src/routes/_protected/positions/$positionId.tsx      23 candidates
frontend/src/pages/monitoring/Dashboard.tsx                   19 candidates
frontend/src/routes/_protected/positions/$id/approvals.tsx    15 candidates
frontend/src/routes/_protected/positions/$id/versions.tsx     13 candidates
frontend/src/routes/_protected/scenario-sandbox.tsx            2 candidates
frontend/src/pages/DossierSearchPage.tsx                       1 candidate
frontend/src/routes/_protected/admin/data-retention.tsx        1 candidate
frontend/src/routes/_protected/legislation.tsx                 1 candidate
frontend/src/routes/_protected/legislation/index.tsx           1 candidate
```

Triage, **carrying the mock-vs-real column (D-16)** — a consumed-verification counts only when the
consumer exercises the REAL subject; mocked consumers are NON-ORACLES and are never folded into
the defence count:

| consumer                                                           | mock-vs-real            | disposition                                                                                                                                                              | where measured |
| ------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `tests/e2e/93-admin-surfaces-error.spec.ts`                        | **REAL**                | re-run **4/4 green**, 16 real policy rows; the deliberately-red legal-holds region stayed red                                                                            | 95-08          |
| `frontend/tests/unit/monitoring.dashboard.test.tsx`                | **MOCKED → NON-ORACLE** | UNAFFECTED, byte-unchanged, green before and after; asserts only `h1`/`h2` — never cited for criterion 4                                                                 | 95-04          |
| `frontend/tests/scenario-sandbox-verification.spec.ts`             | REAL-but-**DEAD**       | 5 passed / 4 failed, all four attributed elsewhere; **no assertion discriminates the old error markup from the new**, and the file is discovered by NO Playwright config | 95-03          |
| `frontend/tests/e2e/version-comparison.spec.ts`                    | **REAL**                | branch (a) PRE-EXISTING NON-RUNNABLE — identical step-(ii) login failures before and after                                                                               | 95-05          |
| `frontend/tests/e2e/consistency-resolution.spec.ts`                | **REAL**                | branch (a) — same, identical four line numbers before and after                                                                                                          | 95-05          |
| `frontend/tests/a11y/positions-a11y-{en,ar}.spec.ts`               | —                       | NAMED NON-CONSUMERS — contested surfaces are `test.fixme` (editor/diff a11y debt)                                                                                        | 95-05          |
| `tests/contract/positions-*`, `backend/tests/contract/positions-*` | MOCKED/contract         | NON-CONSUMERS — `positionId` is a variable name against edge functions, not a route-file reference                                                                       | 95-05          |
| `frontend/src/pages/reports/__tests__/generate-entry.test.ts`      | **REAL**                | NAMED NON-CONSUMER — `generate-entry.ts` was **not changed** (contract did not move); run anyway as regression evidence, **5/5 green**                                   | 95-06          |
| `tests/e2e/93-tasks-queue-error.spec.ts`                           | **REAL**                | NAMED NON-CONSUMER by header; byte-identical (blob hash matched) and **still green post-deploy**, `1 passed`                                                             | 95-02          |
| `frontend/tests/e2e/search-accessibility.spec.ts`                  | **REAL**                | PRE-EXISTING RED, not repaired — 4 passed / 11 failed; 8 wait on an `input[role="searchbox"]` that exists in neither the HEAD blob nor the current file                  | 95-01          |

### The two zeros in that sweep, instrument-tested rather than believed (D-20)

Two of the rows above appear **nowhere** in the sweep output. Neither zero is a clean bill:

**(a) `generate-entry.test.ts` — 0 lines. Two independent reasons, one of them a population defect.**

```
$ ls frontend/src/pages/reports/__tests__/generate-entry.test.ts     # exists
$ /usr/bin/grep -cE '\breports\b' <that file>                        # 0 — does not carry the identifier
$ case <that path> in tests/*|frontend/tests/*|backend/tests/*|e2e/tests/*) ... ;;
  OUTSIDE — the roots derivation cannot reach co-located __tests__ under src/
$ find frontend/src backend/src supabase/functions -type f \
    \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) | wc -l
  186
```

**186 co-located test files are structurally invisible to the C9b roots derivation**, which
derives roots by `find -type d -name tests` and therefore sees only the four top-level test roots.
This is the **fifth** instance of the class C9b exists to kill — _a correct instrument pointed at a
set narrower than the truth_ — and, like the fourth, it is committed **inside C9b itself**: the
2026-08-16 amendment fixed "one hardcoded root" (124 of 591) and left "directories named `tests`"
as the population, which excludes every `__tests__` sibling of the code it tests. The disposition
of this particular row is still right (95-06 named it and ran it, 5/5), but it was right by the
executor's reading, **not** by the sweep.

**(b) `useAssignmentQueue` — 0 candidate line at all.**

```
$ git diff --name-only phase-95-base -- frontend/src ... | grep -c 'useAssignmentQueue'   -> 1  (it IS in the changed set)
$ /usr/bin/grep -rlE '\buseAssignmentQueue\b' ./tests ./frontend/tests ./backend/tests ./e2e/tests | wc -l   -> 0
```

The token genuinely appears in **no** file under any of the four roots — a real zero, proven by the
same machinery that just matched 619 files for `describe`. `tests/e2e/93-tasks-queue-error.spec.ts`
is coupled to that change by **route and rendered shape**, not by identifier, which GATE-STANDARD
states the derivation cannot see. A second blind spot compounds it: **95-02's most consequential
change was a DEPLOY** (`assignments-queue` v11→v12) with an empty source diff, and a
diff-anchored sweep cannot see a behaviour change that ships with no diff at all. Both were covered
by the residual defence — 95-02 ran the named non-consumer post-deploy (`1 passed`).

**Third limitation, measured here:** the GATE-STANDARD stoplist (`auth utils types config helpers
constants _shared`) does not cover this repo's route-param shape. `positions/$id.tsx` derives the
identifier `id` → **447 candidates**; `backend/src/index.ts` derives `src` → 152. The
`index`→parent-dir rule was written for `supabase/functions/<name>/index.ts` and degenerates on
`backend/src/index.ts`. The sweep's semantics were preserved verbatim (this plan does not amend
GATE-STANDARD mid-phase — `GATESTD-01`), so this is recorded, not fixed.

---

## 6. NAMED OMISSIONS ROLL-UP, and the out-of-phase exclusion list

### Named omissions, transcribed from the eight SUMMARYs

| #   | omission                                                                                                                                                                                                                                                                         | plan  | condition that closes it                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| 1   | **Stale `search` `validTypes`** — `supabase/functions/search/index.ts:99` still lists `theme` (renamed `topic`) and omits `elected_official`; a `types=topic` filter 400s. The default path is unaffected (`filters.types` defaults to `'all'`).                                 | 95-01 | one line, in the same edit as whichever phase next **deploys** `search`                        |
| 2   | **`PositionAnalyticsCard` mount dropped** with `$positionId.tsx`. Swept: the component now has **zero mounts** tree-wide; the file and `usePositionAnalytics` are left in place.                                                                                                 | 95-05 | whoever wants position analytics mounts it deliberately — not dead-code cleanup for DEAD-08    |
| 3   | **`/scenario-sandbox` 500 root cause recorded, NOT fixed and UNOWNED.** `to_regclass('public.scenarios')` is non-NULL, so the missing-table hypothesis is dead; RLS or something else in `listScenarios` remains. Criterion 3 requires only "loads OR shows an error".           | 95-03 | no Phase 95 plan owns it; needs an owner                                                       |
| 4   | **`frontend/tests/scenario-sandbox-verification.spec.ts` is discovered by NO Playwright config** — 9 tests nobody has run since `testMatch` was set; 4 are red on pre-existing defects, so naive re-admission would red CI.                                                      | 95-03 | someone owning the frontend Playwright config repairs the four locators and re-admits the spec |
| 5   | **Honest-format restriction:** every report template's offered formats moved from `pdf`/`excel`/`word` to `csv`/`json` — exactly what the server produces; unsupported formats answer `501 FORMAT_UNAVAILABLE`. A deliberate narrowing of the offered surface, not a regression. | 95-06 | a real PDF/spreadsheet renderer, whenever one ships                                            |
| 6   | **`pdf-generate` / `ai-extract` are UNBLOCKED, not VERIFIED.** They have never been able to upload (the `private` bucket did not exist); it exists now, but nobody has fetched an artifact from either.                                                                          | 95-06 | one end-to-end exercise each                                                                   |
| 7   | **The `reports` GET branch has no oracle of its own.** Its five type-specific queries were broken identically and are repaired by the shared helper, but only `GET /reports` (comprehensive) is covered.                                                                         | 95-06 | a GET probe per type                                                                           |
| 8   | **Report-artifact storage retention is unowned** — objects accumulate in `private` (13 from the probe alone); no policy grants UPDATE, DELETE is owner-scoped.                                                                                                                   | 95-06 | a retention/cleanup path                                                                       |
| 9   | **A dangling citation left deliberately:** `tests/e2e/93-admin-surfaces-error.spec.ts:145` points at the `asRows` note that 95-08 deleted. Comment only; **no assertion reads it**. Editing it would have been an out-of-set write to 95-08's own grader.                        | 95-08 | whoever next owns that spec (a P95 consolidation touch, or P100)                               |
| 10  | **`DR-SUBPATH-01` not fixed and must not be** — the sub-path parse makes every `/data-retention/<sub>` route except `policies` 404, which renders truthfully. P100 property.                                                                                                     | 95-08 | P100                                                                                           |
| 11  | **The ESLint rule's known ceiling:** it matches `callee.name === 'notFound'`, so an aliased import or member call is invisible. No such spelling exists in `frontend/src` today (13-hit sweep = whole population).                                                               | 95-07 | `context.sourceCode.getScope()` resolution, if an alias ever appears                           |
| 12  | **Arabic naturalness** for 95-06's three new keys is an OPERATOR park — the values are the UI-SPEC's suggested renderings and carry no naturalness claim.                                                                                                                        | 95-06 | operator review                                                                                |
| 13  | **Standing environment condition:** `backend/.env` carries no Supabase credentials, so `pnpm dev` cannot start the Express backend on a fresh checkout. 95-04 worked around it per-process; no credentials belong in the repo.                                                   | 95-04 | operator-side `backend/.env` or a documented `.env.test` sourcing step                         |

### Criterion 2's NAMED BOUND — transcribed VERBATIM from 95-02 (an unbounded pass here is a REJECT)

> criterion 2 verified as renders-against-a-deployed-function; the populated-rows render was not
> exercised (observed state: error), explained by the Task 2 staff_profiles/queue-count derivation

Supporting observed state: **`QUEUE-STATE: error`** (both tests, three runs) and
`QUEUE-FILTER-EXERCISED: no — page settled to the error state, whose branch renders no filter
controls`. The derivation behind it, both zeros instrument-tested: the test user has **no
`staff_profiles` row** (`staff_profiles_total = 4`, `test_user_exists = 1`,
`staff_profiles_joinable = 4` — so the empty is not "table empty" or "wrong join column"), and
`assignment_queue` holds **0 rows**. The populated render was unreachable on this data either way,
and **no rows were inserted to force one**.

### Criterion 1's observed state — transcribed from 95-01 (the closing register's positive half)

```
TYPED-STATE: UN -> rows
CHIP-STATE: Saudi Arabia -> rows      CHIP-STATE: UN      -> rows
CHIP-STATE: G20          -> rows      CHIP-STATE: climate -> rows
```

`rows` is reachable only when at least one result card exists. **All four chips returned results** —
not merely "did not crash".

### OUT-OF-PHASE EXCLUSION LIST (D-02) — restated, named rather than assumed

Three surfaces are **intended-broken** for this phase and an opportunistic repair in any of them
rejects the leg. Re-verified at close, tag-anchored:

```
$ git diff --name-only phase-95-base | grep -i 'delegation'          -> (none)
$ git diff --name-only phase-95-base | grep -i 'legal.hold|legal_hold' -> (none)
$ git diff --name-only phase-95-base | grep -iE 'analytics'          -> (none)
  control: 52 changed files total, of which 6 match 'positions' — the sweep is not vacuous
```

| surface                                           | owner | verified untouched                             |
| ------------------------------------------------- | ----- | ---------------------------------------------- |
| `/delegations`                                    | P102  | zero changed files                             |
| the legal-holds region of `/admin/data-retention` | P100  | see the note below — **not** a clean grep zero |
| `/analytics`                                      | P96   | zero changed files                             |

**The legal-holds zero required reading, and is recorded that way rather than as a clean zero.**
One added/removed line in the whole tag-anchored diff mentions `legal`:

```
-  const legalHolds = asRows<LegalHold>(legalHoldsData)
+  const legalHolds: LegalHold[] = legalHoldsData ?? []
```

That is the RETENTION-CAST-01 subject — the consumption-point workaround 93-09 installed, deleted
by 95-08 — **not** the legal-holds region's own defect (the P100 server sub-path parse and the
`legal_holds` RLS residual). The region's brokenness was verified **behaviourally**, not by grep:
95-08's re-run of `93-admin-surfaces-error.spec.ts` test 2 passed, and that test's header states a
**green** legal-holds region is a REJECT — it passed by observing `query-error-inline` visible on
the Legal Holds tab with zero "no legal holds" copy.

Also excluded, and not touched: `DEAD-05` / `DEAD-06` / `DEAD-07` (P96), `DR-SUBPATH-01` and
`EDGEPATH-01` (P100), `E2ECRED-01` / `E2ESTALE-01` / `ORACLECAP-01` (P101), the `/monitoring`
nav entry at `navigationData.ts:262` (P97's NAV-\* scope), and every sibling Vite proxy entry.

---

## 7. THE WEAKEST POINT

**Named: the C9b consumer sweep's population — the phase's own cross-phase regression defence is
blind in three measured ways, and every "no other consumer is affected" claim in this phase rests
on it.**

Not a uniform pass. This is the weakest point rather than the two obvious candidates because
those two are _bounded and ruled_, and this one was _unknown until this leg measured it_:

1. **186 co-located test files under `frontend/src` / `backend/src` / `supabase/functions` are
   structurally unreachable.** The roots derivation finds directories literally named `tests`, so
   every `__tests__` sibling of the code it tests is outside the population. It is the fifth
   instance of the exact class C9b was written to kill, and it lives inside C9b's own amendment
   that fixed the fourth.
2. **A deploy has no diff, so a diff-anchored sweep cannot see it.** 95-02's most consequential
   change — `assignments-queue` v11→v12 — touched no source file. Any consumer of the _deployed_
   behaviour is invisible to this instrument by construction.
3. **The stoplist does not cover this repo's route-param shape.** `positions/$id.tsx` yields the
   identifier `id` and 447 candidates; `backend/src/index.ts` yields `src` and 152. At that
   signal-to-noise the output is not triable by hand, and an executor who skims it will miss a
   real consumer inside the flood.

Nothing in this phase is known to have been missed because of it — both zeros were run down here
and both dispositions survived. But the defence held by the executors' reading, not by the
instrument, and that is the failure mode this whole standard exists to remove.

**Runners-up, ranked, so the weakness is a ranking and not a single alibi:**

- **Second: criterion 2's success path was never observed.** `/tasks/queue` is closed on a truthful
  _error_ render plus a version increment. Nobody has seen the queue render a queue. The bound is
  named and transcribed above, but it is the thinnest criterion in the phase.
- **Third: 95-05's tests 1-2 pre-fix red was never measured** (single-origin CORS wall, ruled
  ACCEPT-AS-RECORDED). Bounded by ruling, with test 3's attributable red and every static red
  standing in for it.
- **Fourth: `/scenario-sandbox` still 500s.** Criterion 3 asks only that the failure be honest,
  and it now is — but the route does not work, its cause is undiagnosed, and no plan owns it.

The planning-time candidate — 95-05's slots oracle needing a staging position in a
trigger-rendering status — **did not** turn out weakest: staging carried 2 `draft` and 2
`published` positions, so the opportunistic arm executed and annotated which branch it took.

---

## 8. CLOSING STATE

- Route population **202** (from 201), delta fully attributed to DEAD-08, four blind spots stated
  with each second source run.
- Requirement coverage **8/8** by command, one owning plan each, zero silent drops.
- Decision coverage **20/20**, drilled red (19/20, `D-18` uncovered) then restored green, on disk,
  with the plans' tree byte-identical.
- Gate drill **24/24 PARSE-OK**; both directions recorded for every gate; two reds that no
  producing plan had constructed were constructed here; one direction remains unmeasured **by
  ruling** (`RULING-P95-03-BLOCKED-9505.md`).
- C9a: zero `<files>`-only artifacts; one genuine cross-plan artifact (`probe-edge-auth.sh`) whose
  format contract held; one added migration outside every declared write set, declared by 95-06.
- C9b: run only through `scripts/c9b-sweep.sh`, control-verified (619 of 752 files), every row
  triaged with its mock-vs-real column, both zeros instrument-tested and both explained.
- Out-of-phase surfaces re-verified untouched; the legal-holds "zero" was not clean and is
  recorded with the line that matched and why it is not the excluded subject.
- Weakest point named.

CLOSING-REGISTER-END
