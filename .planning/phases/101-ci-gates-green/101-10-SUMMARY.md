---
phase: 101-ci-gates-green
plan: 10
status: complete
completed: 2026-09-11
requirements: [CARRY-02, CARRY-09]
---

# 101-10 SUMMARY — quarantine pass, unit 10 (shard 2: AR smokes, visual grid, token engine)

## Result

Run `31848669722` (E2E Tests on `main`, head `e990ed844`, 2026-08-14) reported **32** red tests
across the 5 spec files of this unit, all on shard 2/2 (job `94920109185`).

- **1 is FIXED:** `ar-smoke/login.ar`. It is a spec defect: the spec sent `?lang=ar`, a key no build
  of the app has ever read.
- **31 red cells are carried by 4 in-spec markers**, each
  `test.fixme(true, 'P101-QUAR 31848669722: ...')` naming the cause, the log line(s), the job and the
  owner phase:
  - `ar-smoke/command-palette.ar`: 1 marker, 1 cell.
  - `ar-smoke/dossier-navigation.ar`: 1 marker, 1 cell.
  - `tailwind-remap-visual`: 1 marker in the body of the parametrised test, 24 cells.
  - `token-engine-sc`: 1 marker as the first statement of the shared `beforeEach`, 5 cells. The
    reason it sits in the hook is under `## Why the token-engine marker sits in the beforeEach`.

1 + 1 + 1 + 24 + 5 = 32. No test was deleted, no assertion was removed, no project-level skip was
added, no baseline was touched, and nothing under `frontend/src` or `backend/src` changed. The root
E2E population still lists `Total: 220 tests in 65 files`. The plan's oracle passes (pasted under
`## Oracle`).

Commits: `96fd6ab06` (the 4 markers + the login.ar fix) and the commit carrying this SUMMARY.

## Derivation of the failing tests (from the run logs)

`command -v gh && gh auth status` → `/opt/homebrew/bin/gh`,
`✓ Logged in to github.com account alzahrani-khalid (keyring)`.

**The command** (RESEARCH §10.2, filtered to this unit's 5 files; `$SP` = the worker scratchpad):

```bash
R=alzahrani-khalid/Intl-Dossier-V2.0; j=94920109185
gh run view -R $R --job $j --log-failed > "$SP/job-$j.raw"
sed -E 's/\^\[\[[0-9;]*m//g' "$SP/job-$j.raw" > "$SP/job-$j.clean"
grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' "$SP/job-$j.clean" \
  | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
  | grep -E 'tests/e2e/(ar-smoke/(command-palette|dossier-navigation|login)\.ar|tailwind-remap-visual|token-engine-sc)\.spec\.ts'
grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' "$SP/job-$j.clean" \
  | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
  | sed -E 's/^\[[a-z0-9-]+\] › //; s/:[0-9]+:[0-9]+ › .*//' | sort | uniq -c
grep -oE '[0-9]+ failed' "$SP/job-$j.clean" | tail -1
```

Fetch: `fetch 94920109185 exit=0 lines=    1413`.

**The ANSI-strip step.** The `--log-failed` output stores each ESC as the two characters `^[` followed
by `[…m`, so the strip is `sed -E 's/\^\[\[[0-9;]*m//g'`. A `\x1b` pattern would strip nothing,
because the log contains 0 real ESC bytes. Measured on the raw and the stripped log:

```
raw two-char ^[ lines=17 clean=0 realESC=0
```

**Output, verbatim.** This unit's rows come first, then the per-file count for the whole job, then the
CI notice:

```
== job 94920109185
[chromium-ar-smoke] › tests/e2e/ar-smoke/command-palette.ar.spec.ts:9:7 › TEST-04 command palette (ar-smoke) › Cmd+K opens with dir=rtl and navigates to a dossier
[chromium-ar-smoke] › tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts:13:7 › TEST-03 dossier navigation (ar-smoke) › navigates list -> detail -> tabs in Arabic, dir=rtl preserved
[chromium-ar-smoke] › tests/e2e/ar-smoke/login.ar.spec.ts:14:7 › TEST-01 login (ar-smoke) › logs in with Arabic UI and asserts dir=rtl
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-dark-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-dark-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-dark-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-dark-en-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-light-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-light-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-light-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › login-light-en-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-dark-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-dark-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-dark-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-dark-en-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-light-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-light-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-light-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › modern-nav-light-en-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-dark-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-dark-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-dark-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-dark-en-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-light-ar-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-light-ar-mobile
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-light-en-desktop
[chromium-en] › tests/e2e/tailwind-remap-visual.spec.ts:35:15 › Plan 33-06 — @theme remap visual baselines › root-light-en-mobile
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:127:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-2: mode toggle flips OKLCH math (accent-ink L, accent-soft C)
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:179:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-3: hue recomputes accent family + sla-risk; sla-bad stays red-locked
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:226:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-4: density updates row-h/pad-inline/pad-block/gap; logical props survive RTL
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-5: HeroUI and Tailwind probes resolve to the same live --accent
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:86:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-1: setDirection updates every token var without reload
-- per file
   1 tests/e2e/ar-smoke/command-palette.ar.spec.ts
   1 tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
   1 tests/e2e/ar-smoke/login.ar.spec.ts
  24 tests/e2e/tailwind-remap-visual.spec.ts
   6 tests/e2e/token-engine-sc.spec.ts
   3 tests/e2e/typography.spec.ts
   1 tests/e2e/working-group-create.spec.ts
36 failed
```

**Dedupe, and the count beside the CI notice.** The log truncates one row of the job, and that row is
a strict prefix of a full one: `token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-`.
The job's per-file sum is 37; dropping the prefix row gives **36**, which equals the notice
`##[notice]  36 failed` (log line 1245). The 4 rows of the 36 that fall outside this unit are
`typography` 3 and `working-group-create` 1, which belong to unit 101-09. The 24 grid rows are the
24 distinct cells of one parametrised test at `:35:15`; the full rows are already unique, so none
drops.

| job                   | CI notice | command-palette.ar | dossier-navigation.ar | login.ar | tailwind-remap-visual | token-engine-sc  | unit total |
| --------------------- | --------- | ------------------ | --------------------- | -------- | --------------------- | ---------------- | ---------- |
| 94920109185 (shard 2) | 36 failed | 1                  | 1                     | 1        | 24                    | 5 (6 − 1 prefix) | 32         |

**Unit total: 32**, the number the plan names (ar-smoke 3, tailwind grid 24, token-engine 5).

## Each red test — the log line, the error, the reading, the action

Log lines are line numbers in the stripped `--log-failed` output of job `94920109185` (the sed keeps
every line, so the numbering matches the raw log). The header lines came from
`grep -nE '[0-9]+\) \[chromium-[a-z-]+\] › tests/e2e/(ar-smoke/|tailwind-remap-visual|token-engine-sc)' job-94920109185.clean`
and `grep -n tailwind-remap-visual job-94920109185.clean`.

| #   | test                         | log line                  | error (verbatim, from the log)                                                                                                                                                                                                                  | reading at HEAD (read, not run)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | action                                  |
| --- | ---------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 1   | command-palette.ar           | 958                       | `Expected: "rtl"` / `Received: "ltr"` at `support/helpers/language.ts:25`; `locator resolved to <html lang="en" dir="ltr" class="dir-bureau" data-direction="bureau" …>`                                                                         | The shared helper `switchLanguage` (out of this unit's scope) sets `?lang=`. The detector reads `?lng=`: `frontend/src/i18n/index.ts:561-566` puts `querystring` first with no `lookupQuerystring`, so i18next's default key `lng` applies. It was added in `05271fb43` (2026-05-18). No file in `frontend/src` reads `lang`. The helper's fallback clicks a button named /arabic/ or /العربية/ and did not flip the page either. The next step, `palette.open()`, is red on the same run in the EN mirror `04-command-palette`: `waiting for getByRole('dialog', { name: /command.*palette…/i })`, log line 798 of job 94920109119. | quarantine — spec drift (helper)        |
| 2   | dossier-navigation.ar        | 1037                      | the same `Expected: "rtl"` / `Received: "ltr"` at `support/helpers/language.ts:25`, same `<html … data-direction="bureau">`                                                                                                                    | Same helper and same key. Every Arabic step after the switch is unobserved on any recorded run, including the `card('Saudi Arabia')` heading lookup inside an Arabic UI and the tabs. The EN mirror `03-dossier-navigation` passed its list, search, card, open and tabs steps on the same run and failed later, at the RelationshipSidebar (log line 663 of job 94920109119). That shows the English path only.                                                                                                                                                                              | quarantine — spec drift (helper)        |
| 3   | login.ar                     | 1116                      | `Expected: "rtl"` / `Received: "ltr"` at `login.ar.spec.ts:16`, right after `page.goto('/login?lang=ar')`                                                                                                                                       | The spec's own query key is wrong (`lang`). `?lng=` is read at HEAD, and on the served build too: its entry chunk carries the exact detector order (see `## Commands run`). `DirectionProvider` (`frontend/src/components/ui/direction.tsx:28-35`) writes `<html dir/lang>` from `i18n.language`.                                                                                                                                                                                                                                                                                 | **FIXED** — spec defect                 |
| 4   | tailwind-remap-visual, 24 cells | 1246-1269 (names only) | **none.** The 24 cells appear only in the failed list printed after the notice. The log holds 0 `snapshot` / `screenshot` / `linux.png` / `darwin.png` mentions, and the flake reporter's RETRIED list names every other red test of the job at retry 1 and 2 but none of these 24 | The 24 committed baselines are `*-chromium-en-darwin.png` only (`b3707e5b6`, 2026-04-20). `e2e.yml:11` runs `ubuntu-latest`. The root `playwright.config.ts` sets no `snapshotPathTemplate`, so the platform suffix applies. The grid also seeds `id.dir=chancery`, a direction Phase 77 retired. This is a reading of why the cells are red; the log does not state the error.                                                                                                                                                                                                                                  | quarantine — visual baseline            |
| 5   | token-engine-sc SC-1..SC-5   | 587, 627, 667, 707, 872   | `TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.` at `waitForHatch` (`:61`), called from `:83`, the `beforeEach`                                                                                                                  | `window.__design` is set only when `import.meta.env.DEV \|\| import.meta.env.MODE === 'test'` (`DesignProvider.tsx:314-318`, and the same at the pre-77 build `0ba9c9044~1`). The E2E target is a deployed build (`frontend/Dockerfile.prod:48` `RUN pnpm build`), and the 14 scripts the droplet serves carry 0 `__design`. At HEAD the hatch is `{ setDirection, setMode, setDensity }` with no `setHue`, and `Direction` is linear-only: SC-2, SC-3 and SC-5 call `setHue`, and SC-1 calls `setDirection('situation')`. | quarantine — environment + contract    |

## Why the token-engine marker sits in the beforeEach

All five failures raise in the shared `beforeEach` (`token-engine-sc.spec.ts:83`, `waitForHatch`). In
Playwright 1.60.0 the worker runs the `beforeEach` hooks before the test function:
`node_modules/playwright/lib/worker/workerProcessEntry.js:3035`
`await this._runEachHooksForSuites(suites, "beforeEach", testInfo);` precedes `:3043`
`await testInfo._runWithTimeout({ type: "test" }, …)`. A marker as the first statement of each test
body would therefore never be reached, and the five tests would stay red. The marker is the first
statement of the hook, ahead of `addInitScript` and `page.goto('/')`, so each of the five tests is
marked fixme before any navigation. That is one marker, 5 cells and one register row. The tailwind
grid and the two ar-smoke specs have no failing hook, so their markers sit as the first statement of
the test body.

## Quarantine register

One row per in-spec marker. `cells` = the reporter cells one marker skips. The owner column follows
101-09's rule: **Phase 102** (Staging Data & Debt Tail) when the fix is app code, test-infra code, a
contract or a visual-baseline decision; **Phase 103** when the truth depends on observing a deploy of
HEAD. All four rows here are Phase 102.

| spec                                             | test title                                                                                                                                                           | cause class                                                                   | owner phase | cells |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------- | ----- |
| tests/e2e/ar-smoke/command-palette.ar.spec.ts    | `Cmd+K opens with dir=rtl and navigates to a dossier`                                                                                                                | spec drift in the shared switchLanguage helper (outside this unit)            | Phase 102   | 1     |
| tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts | `navigates list -> detail -> tabs in Arabic, dir=rtl preserved`                                                                                                      | spec drift in the shared switchLanguage helper (outside this unit)            | Phase 102   | 1     |
| tests/e2e/tailwind-remap-visual.spec.ts          | the `:35:15` grid test, all 24 cells `root-light-en-mobile` … `modern-nav-dark-ar-desktop`                                                                           | visual baseline (darwin-only baselines, linux runner, retired direction)      | Phase 102   | 24    |
| tests/e2e/token-engine-sc.spec.ts                | all 5: `SC-1: setDirection updates every token var without reload` … `SC-5: HeroUI and Tailwind probes resolve to the same live --accent` (marker in the beforeEach) | environment (DEV-only hatch, production target) + contract (Phase 77)         | Phase 102   | 5     |

Rows 4, cells 31. There are four markers, all carrying `31848669722` (the per-file grep is under
`## Commands run`). D-15's run-time reconciliation `skipped >= sum(cells) >= rows` reads 31 >= 31 >= 4
for these files in CI. The 5 files carry 0 pre-existing fixmes: the oracle's "any fixme" reading is 4,
equal to the markers. The only pre-existing skip is `login.ar`'s describe-level credential skip,
which does not fire in CI.

## Fixed tests

| fixed | spec                                | test                                          | drift named                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | ----------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIXED | tests/e2e/ar-smoke/login.ar.spec.ts | `logs in with Arabic UI and asserts dir=rtl` | **Spec defect: the wrong query key.** The spec sent `/login?lang=ar`, and no build reads `lang`, so `<html dir>` stayed `ltr` (`Received: "ltr"`, log line 1116 of job 94920109185). It now sends `/login?lng=ar`, the i18next querystring key: `frontend/src/i18n/index.ts:561-566`, added in `05271fb43` (2026-05-18). **The fix does not depend on which build is served:** the served entry chunk `index-DXnzH3Jv.js` carries the same detector order `order:["querystring","localStorage","cookie","htmlTag","navigator"]` ×1, and `documentElement.dir=` ×3. **The steps after the switch are supported by the same run and by HEAD:** the served login input is `<input id="password" …>` (log line 601 of job 94920109119), and `LoginPage` at HEAD scopes the password by `#password` (`a15ba7751`, 2026-08-15, after the run). The Arabic labels match the page-object patterns (`auth.email` = البريد الإلكتروني, `auth.signIn` = تسجيل الدخول in `frontend/src/i18n/ar/common.json`). An admin-storageState context rendered the `/login` form on that run (01-login EN reached the password fill, log lines 599-601 of job 94920109119). `auth.setup.ts` signs in the same way, waits for `/dashboard\|operations\|home/`, and passed in CI. **Not executed** (bound below). |

## Bound — the root shards cannot run locally; the run proof is P101-07's `main` run

- `tests/e2e/support/auth.setup.ts` needs all six `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}` keys,
  and `chromium-en` / `chromium-ar-smoke` depend on `setup`.
  - **The six `E2E_*` keys are absent locally.** In this worker's shell
    `env | grep -cE '^(E2E|TEST_USER)_'` → `0` (control: `env | grep -c '^PATH='` → `1`).
  - **The worktree hook maps only the admin pair.** The worktree's `.env.test` holds 2 `E2E_` keys,
    `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` (`grep -cE '^E2E_' .env.test` → `2`), and no
    analyst or intake pair. `setup` would throw for the analyst role, and `dossier-navigation.ar`
    uses `analystPage`.
  - Five sibling units of wave 3 share port 5173, and D-13 forbids running a suite beside another.
  - **So no spec in this unit was executed.** The local evidence is the log derivation, source
    reading, `--list`, read-only GETs of the droplet's public assets, and the plan's oracle.
- **The run proof** for the fix and for the 4 quarantines is the `main` E2E run P101-07 observes after
  the phase PR merges. If that run shows `login.ar` red, the fix is re-opened, not quietly
  reclassified.
- **The E2E target's identity is an inference.** The value of `E2E_BASE_URL` cannot be read. The run's
  `<html … data-direction="bureau">` is a pre-Phase-77 build, and so is what `138.197.195.242`
  serves today (101-09's finding). The served-bundle readings below are about that droplet.
- **Nothing here claims a quarantined behaviour is absent from the app.** Each register row records
  only that its test was red on run `31848669722`, and why this unit cannot turn it green (an
  out-of-scope helper, a baseline decision, a DEV-only hatch, a retired contract). The Arabic command
  palette, the Arabic dossier navigation, the remapped visuals and the token engine's mode, density
  and accent behaviour are not claimed broken; their tests are red.

## Left for named later tasks

- **Phase 102 (test infra):** switch `switchLanguage` in `tests/e2e/support/helpers/language.ts` to
  `?lng=` (or seed `id.locale`). Its only callers are the two quarantined ar-smoke specs
  (`grep -rln 'switchLanguage(' tests frontend/tests`). Then lift both markers and observe the Arabic
  steps. The `card('Saudi Arabia')` heading lookup in an Arabic UI is the step most likely to need a
  bilingual name. The palette dialog wait is red in EN as well (unit 101-05's `04-command-palette`).
- **Phase 102 (visual debt, CARRY-06):** decide the grid's future. Either generate Linux baselines
  against a deploy of HEAD, or retire the Chancery-era grid, which seeds `id.dir=chancery` and is
  coerced to `linear` at HEAD. Phase 101 regenerates nothing.
- **Phase 102 (contract):** `token-engine-sc` needs one of two changes. Either run it against a
  dev/test-mode server where the hatch exists, or rewrite SC-1/2/3/5 to the Linear-only contract (no
  `setHue`, no `situation`). SC-4 (density) is the only SC whose hatch calls all still exist at HEAD.
- **P101-07:** observe `login.ar` green in the `main` run.

## Commands run, with verbatim output

```
$ gh run view 31848669722 -R alzahrani-khalid/Intl-Dossier-V2.0 --json headSha,createdAt,event -q '"\(.headSha) \(.createdAt) \(.event)"'
e990ed8445766059d681733430d64de9e8bf6477 2026-08-14T22:58:38Z push

$ grep -nE '[0-9]+\) \[chromium-[a-z-]+\] › tests/e2e/(ar-smoke/|tailwind-remap-visual|token-engine-sc)' job-94920109185.clean | cut -c1-120   # first line of each header (retries repeat it)
587:  ##[error]  1) [chromium-en] › tests/e2e/token-engine-sc.spec.ts:86:7 › … SC-1
627:  ##[error]  2) [chromium-en] › tests/e2e/token-engine-sc.spec.ts:127:7 › … SC-2
667:  ##[error]  3) [chromium-en] › tests/e2e/token-engine-sc.spec.ts:179:7 › … SC-3
707:  ##[error]  4) [chromium-en] › tests/e2e/token-engine-sc.spec.ts:226:7 › … SC-4
872:  ##[error]  7) [chromium-en] › tests/e2e/token-engine-sc.spec.ts:281:7 › … SC-5
958:  ##[error]  9) [chromium-ar-smoke] › tests/e2e/ar-smoke/command-palette.ar.spec.ts:9:7 › …
1037: ##[error]  10) [chromium-ar-smoke] › tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts:13:7 › …
1116: ##[error]  11) [chromium-ar-smoke] › tests/e2e/ar-smoke/login.ar.spec.ts:14:7 › …

$ echo "tailwind occurrences: $(grep -c tailwind-remap-visual job-94920109185.clean)"; grep -ciE 'snapshot|screenshot|linux\.png|darwin\.png' job-94920109185.clean
tailwind occurrences: 24          # lines 1246-1269, all in the failed list after "##[notice]  36 failed" (line 1245)
0

$ git ls-files tests/e2e | grep -ciE '\.png$'; ls tests/e2e/tailwind-remap-visual.spec.ts-snapshots | head -2; git log -1 --format='%h %ad %s' --date=short -- tests/e2e/tailwind-remap-visual.spec.ts-snapshots
24
login-dark-ar-desktop-chromium-en-darwin.png
login-dark-ar-mobile-chromium-en-darwin.png
b3707e5b6 2026-04-20 test(33-06): tailwind remap visual baselines (user-approved)

$ grep -nE 'runs-on|playwright test' .github/workflows/e2e.yml | head -2; grep -cE 'snapshotPathTemplate' playwright.config.ts
11:    runs-on: ubuntu-latest
41:        run: pnpm exec playwright test --shard=${{ matrix.shard }}/${{ matrix.total }} --project=chromium-en --project=chromium-ar-smoke
0

$ git log -S"'querystring'" --format='%h %ad %s' --date=short -- frontend/src/i18n/index.ts | head -1
05271fb43 2026-05-18 fix(57-03): add querystring detector + ?lng URL params in visual specs
$ grep -rlE "searchParams\.get\(['\"]lang['\"]\)|lookupQuerystring" frontend/src | grep -vc __tests__
0
$ grep -rlnE "switchLanguage\(" tests frontend/tests
tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
tests/e2e/ar-smoke/command-palette.ar.spec.ts

$ git log --diff-filter=A --format='%h %ad %s' --date=short -- frontend/src/components/ui/direction.tsx
b324e360e 2026-07-02 feat(76-01): add DirectionProvider single direction owner (RTLB-01)
$ git log -S'__design' --format='%h %ad %s' --date=short -- frontend/src | head -1
b01b5cd0d 2026-04-20 feat(33-09): add env-gated window.__design test hatch to DesignProvider
$ grep -nE '^RUN .*(build|vite)' frontend/Dockerfile.prod
48:RUN pnpm build

$ # read-only GETs of the droplet's public assets: every script index.html lists, grepped
$ for s in <the 14 /assets/*.js from http://138.197.195.242/>; do … __design / detector order / id.locale …; done
/assets/app-XAOKTZZh.js bytes=371440 __design=0 lngOrder=0 id.locale=2
/assets/charts-vendor-C28a7WSC.js bytes=525318 __design=0 lngOrder=0 id.locale=1
/assets/forms-vendor-Bx_a1bky.js bytes=166966 __design=0 lngOrder=0 id.locale=0
/assets/heroui-vendor-CNAzNmc1.js bytes=10807 __design=0 lngOrder=0 id.locale=0
/assets/i18n-vendor-DU5Aq62T.js bytes=62326 __design=0 lngOrder=0 id.locale=0
/assets/index-DXnzH3Jv.js bytes=1111025 __design=0 lngOrder=1 id.locale=2
/assets/motion-vendor-tp-N_3ly.js bytes=79859 __design=0 lngOrder=0 id.locale=0
/assets/radix-vendor-B6VUtr3I.js bytes=138136 __design=0 lngOrder=0 id.locale=0
/assets/react-vendor-DWiaEvGa.js bytes=195192 __design=0 lngOrder=0 id.locale=0
/assets/sentry-vendor-CJO_byAp.js bytes=12081 __design=0 lngOrder=0 id.locale=0
/assets/signature-visuals-static-DQB1anSl.js bytes=23463 __design=0 lngOrder=0 id.locale=1
/assets/supabase-vendor-CyqT_71w.js bytes=203621 __design=0 lngOrder=0 id.locale=0
/assets/tanstack-vendor-gm5QP8fO.js bytes=200960 __design=0 lngOrder=0 id.locale=0
/assets/vendor-BVuomP6q.js bytes=2380392 __design=0 lngOrder=0 id.locale=0
$ for pat in 'documentElement.dir=' 'languageChanged' 'تسجيل الدخول' 'البريد الإلكتروني'; do … index-DXnzH3Jv.js / app-XAOKTZZh.js …; done
documentElement.dir= index=3 app=3
languageChanged index=1 app=0
تسجيل الدخول index=6 app=0
البريد الإلكتروني index=65 app=0

$ grep -nE 'before hooks|_runEachHooksForSuites|testFunctionParams' node_modules/playwright/lib/worker/workerProcessEntry.js | tail -5
3030:      let testFunctionParams = null;
3035:        await this._runEachHooksForSuites(suites, "beforeEach", testInfo);
3036:        const params = await this._fixtureRunner.resolveParametersForFunction(test.fn, testInfo, "test", { type: "test" });
3040:      if (testFunctionParams === null) {
3043:      await testInfo._runWithTimeout({ type: "test" }, async () => {
$ pnpm exec playwright --version
Version 1.60.0
```

```
$ pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke --no-deps --list 2>&1 | grep -oE "Total: [0-9]+ tests in [0-9]+ files"   # before edits
Total: 220 tests in 65 files
$ grep -c "test.fixme(" frontend/tests/a11y/positions-keyboard-nav.spec.ts   # the grep control
13

$ for f in <the 5 specs>; do echo "$f runid=… anyQUAR=… anyFixme=… lang=… lng=…"; done   # after edits
tests/e2e/ar-smoke/command-palette.ar.spec.ts runid=1 anyQUAR=1 anyFixme=1 lang=1 lng=0
tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts runid=1 anyQUAR=1 anyFixme=1 lang=1 lng=0
tests/e2e/ar-smoke/login.ar.spec.ts runid=0 anyQUAR=0 anyFixme=0 lang=0 lng=1
tests/e2e/tailwind-remap-visual.spec.ts runid=1 anyQUAR=1 anyFixme=1 lang=0 lng=0
tests/e2e/token-engine-sc.spec.ts runid=1 anyQUAR=1 anyFixme=1 lang=0 lng=0
Total: 220 tests in 65 files
control=13
32            # --list rows for this unit's 5 files: all 32 still listed

$ pnpm exec eslint --no-warn-ignored <the 5 specs>   # after edits
eslint exit=0
$ for f in <the 5 specs>; do git show HEAD:$f | prettier --stdin-filepath $f | cmp -s - <HEAD blob> …; done   # before edits
HEAD prettier WARN  tests/e2e/ar-smoke/command-palette.ar.spec.ts
HEAD prettier WARN  tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
HEAD prettier clean tests/e2e/ar-smoke/login.ar.spec.ts
HEAD prettier clean tests/e2e/tailwind-remap-visual.spec.ts
HEAD prettier WARN  tests/e2e/token-engine-sc.spec.ts
$ pnpm exec prettier --check <the 5 specs>   # after edits: the same 3 files
[warn] tests/e2e/ar-smoke/command-palette.ar.spec.ts
[warn] tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
[warn] tests/e2e/token-engine-sc.spec.ts
[warn] Code style issues found in 3 files. Run Prettier with --write to fix.
```

These 3 prettier warnings predate this plan and are left alone (surgical diff). The lint-staged globs
cover `frontend/**/*.{ts,tsx}`, `backend/**/*.ts` and `*.{json,md,yml,yaml,css}`, so the commit hook
does not reformat root `tests/e2e` specs. Every marker sits under a `// prettier-ignore`, so a later
format pass cannot split `test.fixme(true, '…` across lines and blind the phase grep.

```
$ git show --stat --format='%h %s' 96fd6ab06
96fd6ab06 test(e2e): P101-10 quarantine 4 red specs in-spec (31 cells), fix ar-smoke login lng key
 tests/e2e/ar-smoke/command-palette.ar.spec.ts    | 2 ++
 tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts | 2 ++
 tests/e2e/ar-smoke/login.ar.spec.ts              | 4 +++-
 tests/e2e/tailwind-remap-visual.spec.ts          | 2 ++
 tests/e2e/token-engine-sc.spec.ts                | 7 ++++++-
 5 files changed, 15 insertions(+), 2 deletions(-)
```

The oracle was extracted byte-for-byte from this plan's front-matter with js-yaml
(`must_haves.truths[oracle=command].command`, 3227 bytes, 18 lines, sha256 prefix
`b067bfd4e9367849`) and run with `bash -c "$(cat o10.sh)"` from the worktree root.

**Control run, before this SUMMARY existed.** The instrument has to be able to fail in the
post-marker state:

```
SUMMARY absent
P101-10-BOUND files=5 markers with a run id=4 (any P101-QUAR=4, any fixme incl. pre-existing=4; control positions-keyboard-nav fixme=13) register rows=0 cells total=0 non-numeric=0 fixed rows=0 root list=[Total: 220 tests in 65 files] want the 32 (shard 2: ar-smoke 3, tailwind grid 24, token-engine 5) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
FAIL: the ## Quarantine register section has 0 rows for 4 in-spec markers (D-15: one row per marker; FIXED rows live under ## Fixed tests and begin | FIXED |)
oracle exit=1
```

## Zeros and their controls

| zero                                                                 | the control that proves the instrument could see non-zero                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^[` lines after the strip: 0                                        | the same count on the raw log: 17                                                                                                                           |
| real ESC bytes in the log: 0                                         | the two-character form counts 17 — the escape is present, only not as a byte                                                                                |
| snapshot / screenshot mentions in the log: 0                         | the same file yields 24 `tailwind-remap-visual` lines and the full error blocks of the other 12 numbered failures, so the grep reads a populated log         |
| `__design` in the 14 served scripts: 0                               | the same loop reads the detector order ×1 and `id.locale` ×2 in `index-DXnzH3Jv.js`, so it fetched and grepped real bundles                                 |
| files in `frontend/src` reading a `lang` query key: 0                | the same tree yields the `querystring` detector in `frontend/src/i18n/index.ts` (`git log -S` → `05271fb43`)                                                |
| `E2E_*` / `TEST_USER_*` keys in the worker shell: 0                  | `env \| grep -c '^PATH='` → 1                                                                                                                                |
| eslint problems on the 5 specs: 0 (exit 0)                           | a stdin probe `const x: any = 1` as `tests/e2e/zz-probe.spec.ts` drew 2 problem lines (no file written; `git status` shows no probe), so `tests/e2e` is linted |
| `snapshotPathTemplate` in the root config: 0                         | the same grep form reads `retries`, `reporter` and `storageState` lines from that file                                                                      |
| register rows and FIXED rows at the control run: 0, 0                | the same run read 4 markers and exited 1                                                                                                                    |
| pre-existing fixmes in the 5 files: 0                                | the oracle's "any fixme" reads 4 = markers; the import-alias comment in `token-engine-sc.spec.ts` was worded without the call syntax so it does not inflate it |

## Oracle

Final run, with this SUMMARY in place (worktree root, same extracted script):

```
P101-10-BOUND files=5 markers with a run id=4 (any P101-QUAR=4, any fixme incl. pre-existing=4; control positions-keyboard-nav fixme=13) register rows=4 cells total=31 non-numeric=0 fixed rows=1 root list=[Total: 220 tests in 65 files] want the 32 (shard 2: ar-smoke 3, tailwind grid 24, token-engine 5) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
PASS
oracle exit=0
```
