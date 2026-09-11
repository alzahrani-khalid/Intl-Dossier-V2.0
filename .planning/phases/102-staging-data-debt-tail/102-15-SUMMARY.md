---
phase: 102-staging-data-debt-tail
plan: 15
status: complete
outcome: ok-false
attempt: 2
requirements: [CARRY-06]
decisions: [D-20, D-03, D-02]
commits:
  - 50ffdaf08 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)
  - b76a38fdf test(e2e): server-clock re-anchor and same-date two-clock week-ahead check (P102-15)
  - 5da9a0c21 test(e2e): restore the committed week-ahead baseline (P102-15) # reverts d84103da4
baseline_regenerated: false # base..HEAD carries no change to week-ahead.png (content sha1 03afa0703270f14ea83c453583754414f625a959 at base and HEAD)
pixel_diff:
  - frontend/test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-diff.png
  - frontend/test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png
---

# 102-15 SUMMARY — CARRY-06: frozen clock vs server NOW() (attempt 2)

## Verdict: ok:false

| Oracle | Result after the work |
| --- | --- |
| 1. window control (command) | **PASS**: `3 5 3 5`, exit 0 |
| 2. two-clock visual (command, reaped wrapper) | **FAIL**: `passed=0 failed=2 skipped=0`, exit 1 |
| 3. judge (diff) | the baseline is not regenerated; the pixel-diff paths are recorded; the plan ends ok:false as the criterion pre-registers |

**What changed in this attempt.** The attempt-1 judge failed c2 because the diff replaced `week-ahead.png`, and it ruled that ruling `fa892d25f` is not a waiver unless the judge text itself changes. Commit `5da9a0c21` restores the run-base blob. `git diff --name-only 755cd3795..HEAD` now lists no snapshot (step 11). The two captures were compared against that committed baseline. They do not match, so this SUMMARY records the pixel-diff artefacts and the plan ends ok:false.

**Why oracle 2 cannot pass under the current judge text** (measured):

- The committed baseline is 638×293 px. Commit `f2dc476a2` captured it on 2026-07-05.
  - Its heading is `Week Ahead`, which is the casing before P102-11.
  - It has one group, NEXT WEEK, with two rows: `Delegation visit — Indonesia BPS` (SUN 05) and `SRTL-02 regression seed A` (FRI 10).
  - Its date column is unmasked.
- Today's widget renders 638×1034 px. Its heading is `Week ahead`, and it shows eight rows: TODAY 1, TOMORROW 3, NEXT WEEK 4.
- Playwright: `Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.`
- Oracle 2's text and ruling `fa892d25f` require a match against "the baseline regenerated once in this task". The judge text forbids that regeneration "under any condition". The plan's step 2 already says the old baseline "cannot match by construction".
- No state of `week-ahead.png` satisfies both. The operator has to reconcile them in `102-15-PLAN.md`, which is outside this task's file scope.

**Measured fact for that decision.** Both captures in this run are byte-identical to the blob that attempt 1 regenerated and `5da9a0c21` removed: content sha1 `dd30a75747cbdf6a921da373b7a6821c519b6f80`, from commit `d84103da4` (step 10). So the render is deterministic across both tests and across 24 minutes of wall time. If the judge text is amended to admit the one regeneration, that existing blob can be put back without regenerating again.

## Judge item — where each clause lives (HEAD after `5da9a0c21`; spec and seed unchanged in this attempt)

- **Seed:** `supabase/seed/072-p102-today-relative-dashboard-fixtures.sql`, commit `50ffdaf08`. It holds the eight date-only UPDATEs with the 060 offsets and no INSERT. The attempt-1 judge found it present.
- **Spec:** `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`.
  - `:12` sets `FROZEN_TIME = new Date(new Date().setUTCHours(12, 0, 0, 0))`.
  - `:56-112` is the beforeAll. It creates a service-role `createClient`, throws at `:59-64` when `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is absent, applies the eight updates, and throws at `:106-110` unless each update hits exactly one row.
  - `:165-170`: `FIXTURE_BLOCKED` holds only `vip-visits`, and `:160-164` explain the new mechanism.
  - `:200` is the test titled exactly `dashboard snapshots survive a date change`.
    - `:202` takes two clocks, today 12:00Z and today 18:00Z, and `:204` installs one per page.
    - `:208-216` are the three `.week-title` assertions, placed before the capture.
    - `:217` sets the mask to exactly `[widget.locator('.week-date')]`.
    - `:218` is `toHaveScreenshot('week-ahead.png', { mask })`.
  - The loop test `visual week-ahead` (`:172-188`) no longer skips and masks only `.week-date` (`:185`).
- **Baseline:** `frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png` is not in the base..HEAD diff.
- **Pixel-diff artefacts:** the two `pixel_diff` paths in the front-matter. `test-results/` is gitignored, so copies are kept at `<scratch>/artefacts/` (step 10).
- **The 18:00Z leg did not execute.** The new test's `toHaveScreenshot` is a hard `expect` (review att0 removed `expect.soft`). The 12:00Z capture failed first, so the test stopped there. The three `.week-title` assertions passed before that capture, because the failure is at `toHaveScreenshot` (report line `:200`, step 9).

## Commands and verbatim output, in execution order

ANSI codes are stripped. `<wt>` is this worktree and `<scratch>` is the session scratchpad. No secret was printed.

**1. Clock and :5173 census**

```
$ date -u; date
Fri Sep 11 23:32:57 UTC 2026
Sat Sep 12 02:32:57 +03 2026
lsof exit=1
```

The seven `node (vitest …)` processes running at that time had their cwd in `/Users/…/clones/tkr-spec-v253/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-150716-0000000000000002--T7`. That is another repository, and none of them held a port here.

**2. Restore the baseline to the run base** (`git show 755cd3795:<png> > <png>`)

```
03afa0703270f14ea83c453583754414f625a959  frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
  pixelWidth: 638
  pixelHeight: 293
diff-vs-base rc=0
 M frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
```

**3. Oracle extraction.** node `yaml` read the plan front-matter, and the two `oracle: command` blocks were written byte-for-byte to `<scratch>/oracle1.sh` and `<scratch>/oracle2.sh`:

```
2 oracles written
    1611 <scratch>/oracle1.sh
    3669 <scratch>/oracle2.sh
```

**4. Oracle 2, run 1: void (instrument could not start)**

```
baseline sha1 03afa0703270f14ea83c453583754414f625a959
pre lsof exit=0
oracle2 start 2026-09-11T23:33:38Z
exit=1 end 2026-09-11T23:33:39Z
P102-15-VISUAL wrapper_rc=1 passed=0 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (...)
FAIL: the week-ahead visual is not invariant to the calendar date - ...
post lsof exit=0
frontend/test-results/pw-reaped-a042b6c5c83ec7246f1747879a01b675.json
```

The report says:

```
stats {'startTime': '2026-09-11T23:33:39.408Z', 'duration': 10.177000000000021, 'expected': 0, 'skipped': 0, 'unexpected': 0, 'flaky': 0}
errors ['Error: http://localhost:5173 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.']
```

The port holder:

```
node    91157 khalidalzahrani   18u  IPv6 0x1e26fcd93aa90bff      0t0  TCP *:5173 (LISTEN)
91157 91128 Sat Sep 12 02:33:27 2026     node <...>/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend/node_modules/.bin/../../../node_modules/.pnpm/vite@7.3.3_<...>/vite.js
n<...>/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend
```

That process was sibling lane P102-07's Vite server, and it was not touched. Its start at 23:33:27Z fell between the census in step 1 and this run. No test ran, so no beforeAll ran and no staging row changed.

**5. Port watcher.** It is a standalone background loop that exits 0 only on port-free and exits 2 on a 23:57Z deadline:

```
BRANCH=port-free at 2026-09-11T23:34:25Z
[exited with code 0]
```

**6. Commit of the restore.** The pre-commit hook printed `→ lint-staged could not find any staged files matching configured tasks.`, then ran `turbo run build`.

```
commit rc=0
5da9a0c21 test(e2e): restore the committed week-ahead baseline (P102-15)
```

**7. Oracle 2, run 2: the verdict run, after the work**

```
pre lsof exit=1
oracle2 start 2026-09-11T23:34:44Z
exit=1 end 2026-09-11T23:34:56Z
  PW failed | visual week-ahead | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 293px
  PW failed | dashboard snapshots survive a date change | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 293px
P102-15-VISUAL wrapper_rc=1 passed=0 failed=2 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today 12:00Z AND today 18:00Z with date labels masked, both from a seed the spec re-anchors in beforeAll)
FAIL: the week-ahead visual is not invariant to the calendar date - a skip means the FIXTURE_BLOCKED guard still fires, a failure means the two clocks disagree
post lsof exit=1
frontend/test-results/pw-reaped-50da226add63e84ae5c2f86d07ba0c45.json
```

**8. Clock regime of run 2** (derived). FROZEN_TIME was 2026-09-11 12:00Z and the second clock 18:00Z. Both sat behind the wall clock (23:34Z), so the stored token was not read as expired. That regime holds only until 00:00Z (see limit 1).

**9. Report errors** (`pw-reaped-50da226add63e84ae5c2f86d07ba0c45.json`):

```
stats {'startTime': '2026-09-11T23:34:45.082Z', 'duration': 10883.507, 'expected': 0, 'skipped': 0, 'unexpected': 2, 'flaky': 0}
--- failed | visual week-ahead | line 173 | 3151 ms
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: getByTestId('dashboard-widget-week-ahead')
  Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.

  Snapshot: week-ahead.png
--- failed | dashboard snapshots survive a date change | line 200 | 3396 ms
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: getByTestId('dashboard-widget-week-ahead')
  Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.

  Snapshot: week-ahead.png
```

Both call logs end `taking element screenshot … fonts loaded … waiting for element to be stable`, so the widget was on the page.

**10. Artefacts** (each is sha1, path under `frontend/test-results/`, and size). Every file was copied to `<scratch>/artefacts/`, with the report.

```
dd30a75747cbdf6a921da373b7a6821c519b6f80 e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-actual.png 638x1034
0b2d8c5191118c35322386c8687a1568f9fc2743 e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-diff.png 638x1034
03afa0703270f14ea83c453583754414f625a959 e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-expected.png 638x293
dd30a75747cbdf6a921da373b7a6821c519b6f80 e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-actual.png 638x1034
0b2d8c5191118c35322386c8687a1568f9fc2743 e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png 638x1034
03afa0703270f14ea83c453583754414f625a959 e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-expected.png 638x293
```

The actual capture has heading `Week ahead` and three groups, with the date column masked magenta:

- TODAY: Standup — Indonesia delegation.
- TOMORROW: Bilateral consultation — ESCWA · Prep session — G20 Data Gaps Initiative · Brief minister — Vision 2030.
- NEXT WEEK: Delegation visit — Indonesia BPS · Submit OECD data response · Training — new dossier workflow, plus an eighth row clipped at the 1000 px viewport.

The diff marks the whole 1034 px frame. The committed rows and headers overlay the new ones.

**11. Baseline and diff scope**

```
HEAD content sha1 03afa0703270f14ea83c453583754414f625a959  base content sha1 03afa0703270f14ea83c453583754414f625a959
 .../102-staging-data-debt-tail/102-15-SUMMARY.md   | 264 +++++++++++++++++++++
 .../tests/e2e/dashboard-widgets-visual.spec.ts     | 152 +++++++++---
 .../072-p102-today-relative-dashboard-fixtures.sql |  44 ++++
 3 files changed, 433 insertions(+), 27 deletions(-)
png-in-diff: 0
```

These figures predate this SUMMARY's own rewrite. A tooling note: `git rev-parse HEAD:<png>` printed `403bce09d5383e27c91277dc35566433478fd30d`, which is git's blob id and not the file's content SHA-1. The content hash above comes from `git show … | shasum`.

**12. Oracle 1, after every browser run**

```
oracle1 at 2026-09-11T23:35:26Z
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
```

## Populations re-derived

- **Fixture family:** 3 `b0000002-%` engagements and 5 `b0000006-%` calendar entries. This is oracle 1's `present` control, `3 5`.
- **Tests selected by oracle 2's `-g`:** 2. Both ran and both failed (report `unexpected: 2`).
- **Captures taken in run 2:** 2, one per test, and both are the same bytes (`dd30a757…`). The new test's 18:00Z capture was not reached.
- **Snapshot files in the base..HEAD diff:** 0.

## Zeros beside the control that proves the instrument could see a non-zero

- **`png-in-diff: 0`** ← at the start of this attempt, the same `git diff --stat 755cd3795..HEAD` listed `week-ahead.png | Bin 21626 -> 52843 bytes`.
- **`skipped=0`** ← the same report counted `unexpected=2`, so the wrapper reads its stats. This spec at the plan's HEAD skipped week-ahead on FIXTURE_BLOCKED.
- **`pre lsof exit=1` before run 2** ← the same census returned `exit=0` at 23:33:38Z, when P102-07's Vite held the port (step 4).
- **Run 1's `expected=0 unexpected=0`** is void. It is an instrument that could not start (`http://localhost:5173 is already used`), not a product zero.

## Limits of this pass — left for the operator and later tasks

1. **Operator: reconcile `102-15-PLAN.md`** (outside file scope). Two options:
   - Amend the judge text so the one regeneration from ruling `fa892d25f` is admitted. The existing blob `dd30a757…` in `d84103da4` then matches byte-for-byte (step 10), with no new regeneration.
   - Drop the "match" requirement from oracle 2.

   Until then, no state of `week-ahead.png` satisfies oracle 2 and the judge together.
2. **Date roll** (derived; deferred finding from att1). FROZEN_TIME is today 12:00Z. From 00:00Z to about 11:00Z UTC, both clocks sit far ahead of real time. The 3600 s access token then reads as expired, and att0 measured supabase-js storming refresh grants to 429. After 2026-09-12T00:00Z, oracle 2 fails on login before any pixel comparison. This run stopped all browser work before the date rolled.
3. **Weekday and hour dependence** (derived; deferred finding from att1). `groupEventsByDay` buckets by `isToday` / `isTomorrow` / `isThisWeek`, and engagement 001 is hour + 2 h. The group headers therefore move with the real weekday and hour, and they sit outside the `.week-date` mask.
4. **Fonts** (not re-measured this attempt; deferred finding from att1). In a tickmarkr worktree, Vite refuses the `@fontsource` files (att1 measured this), so captures here use fallback fonts.
5. **VISUAL-DEBT-01:** the other six widget baselines were not run. vip-visits stays FIXTURE_BLOCKED.
6. **`graphify update .` was not run.** It writes `graphify-out/`, which is outside the file scope.

## Staging side effects

- **Dates only.** Run 2's beforeAll re-dated the eight rows to the same today-relative values. Oracle 1 reads `3 5 3 5` afterwards. Run 1 ran no test.
- **Auth:** there was no refresh storm, because both clocks sat behind real time.
