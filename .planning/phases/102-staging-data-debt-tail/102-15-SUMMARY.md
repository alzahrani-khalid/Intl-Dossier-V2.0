---
phase: 102-staging-data-debt-tail
plan: 15
status: complete
outcome: ok-false
attempt: 3
requirements: [CARRY-06]
decisions: [D-20, D-03, D-02]
commits:
  - 7dd714df4 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)
  - 0304a0fd3 test(e2e): server-clock re-anchor and same-date two-clock week-ahead check (P102-15)
  - 1f6400ed5 test(e2e): regenerate week-ahead baseline once for re-anchored rows (P102-15) # THE one regeneration (att1)
  - 8d4c5d7e1 test(e2e): restore the committed week-ahead baseline (P102-15) # att2, reverted by a370b9860
  - f3ec018fd test(e2e): derive token expiry from the page clock in dashboard visuals (P102-15) # att3
  - a370b9860 test(e2e): restore the once-regenerated week-ahead baseline (P102-15) # att3, bytes of 1f6400ed5
baseline_regenerated: once # att1 at 2026-09-11T23:10:16Z; HEAD carries that blob, content sha1 dd30a75747cbdf6a921da373b7a6821c519b6f80 (638x1034)
update_snapshots_command: "pnpm exec playwright test e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots --reporter=list" # run from frontend/ by att1, clock today 12:00Z = 2026-09-11T12:00Z
pixel_diff:
  - frontend/test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-diff.png
  - frontend/test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png
---

# 102-15 SUMMARY: CARRY-06 frozen clock vs server NOW() (attempt 3)

## Verdict: ok:false

| Oracle | Result after the work |
| --- | --- |
| 1. window control (command) | **PASS**: `3 5 3 5`, exit 0 |
| 2. two-clock visual (command, reaped wrapper) | **FAIL**: `passed=0 failed=2 skipped=0`, exit 1. `7562 pixels (ratio 0.02 of all image pixels) are different` |
| 3. judge (diff) | The diff includes the once-regenerated `week-ahead.png`, and the `--update-snapshots` command is recorded verbatim. After that single regeneration the captures do not match, so the pixel-diff paths are recorded and the plan ends ok:false, as the criterion pre-registers. |

**This attempt fixed the attempt-2 review's three material findings:**

1. **The once-regenerated baseline is back in the diff.** `a370b9860` restores the attempt-1 capture byte-for-byte (content sha1 `dd30a757…`, from `1f6400ed5`). No new capture was taken.
2. **Auth no longer depends on the time of day.** `f3ec018fd`: `openDashboard` drops `expires_at` from `/auth/v1/token` responses (spec `:122-127`). auth-js `_sessionResponse` then computes `expires_at = Date.now()/1000 + expires_in` against the installed page clock, so the token lives 3600 s on whichever clock is frozen. This was measured in the run below: at wall time 00:04Z the 12:00Z clock sat 11 h 56 min ahead, the regime attempt 2 predicted would storm to /login. Both tests got past login and reached `toHaveScreenshot`. Each trace records 2 `refresh_token` and 2 `password` grants, all HTTP 200, with no 429.
3. **The regeneration command is recorded verbatim.** It is in the front-matter and in the "The one regeneration" section.

**Why oracle 2 is still red (measured).** The two images differ only in which group engagement b0000002-…-0001 ("Bilateral consultation — ESCWA") sits in:

| | TODAY | TOMORROW | NEXT WEEK |
| --- | --- | --- | --- |
| Baseline (att1: seed run 2026-09-11 23:10Z, clock Fri 12:00Z) | Standup | **Bilateral**, Prep session, Brief minister | 4 rows |
| This run (seed run 2026-09-12 00:04Z, clock Sat 12:00Z) | **Bilateral**, Standup | Prep session, Brief minister | the same 4 rows |

Everything from the "Prep session" row down renders the same in both images. The two actuals, one from each test and both at the 12:00Z clock, are byte-identical (`063e5afa…`).

- **The cause: the hour-relative 060 offset.** Its start is `date_trunc('hour', NOW()) + 2 h`, and the judge requires that offset.
- The browser runs in the runner's zone, +03, because `devices['Desktop Chrome']` sets no `timezoneId`.
- `groupEventsByDay` buckets with `isToday`/`isTomorrow` against the frozen local date. The row therefore falls under TODAY only when the re-anchor runs at a server hour of 18Z or earlier (H + 2 h + 3 h < 24 h).
  - Attempt 1 re-anchored at H = 23, so the row landed at Sat 04:00 +03 and fell under TOMORROW.
  - This run re-anchored at H = 0, so the row landed at Sat 05:00 +03 and fell under TODAY.
- The group headers sit outside the `.week-date` mask, and the judge fixes the mask to exactly that locator. The shifted TOMORROW header therefore reaches the pixel diff.

**Why this attempt did not regenerate again.**

- The judge allows the regeneration "EXACTLY ONCE in this plan", and plan step 2 says "Never regenerate again after that". Attempt 1 used that one regeneration.
- A capture taken now would encode "seed at 00–18Z". It would match only when the suite runs from 00:00Z to 18:59Z on a Friday or Saturday (see the next point), and it would fail again from 19:00Z. That makes it regeneration as the fix, which CARRY-06 forbids.
- Weekday dimension (derived, not measured): `isThisWeek` uses date-fns' default Sunday week start. A grep for `setDefaultOptions` or `weekStartsOn` in non-test `src` finds 0 files, against a control of 1 file for `isThisWeek`. On Sun–Thu some of the +2/+3/+5 rows move from NEXT WEEK to THIS WEEK. So the once-regenerated baseline can match only on Fri or Sat when the seed runs at 19:00–23:59Z, i.e. about 10 of the 168 hours in a week.

## Judge item: where each clause lives (HEAD `a370b9860`)

- **Seed:** `supabase/seed/072-p102-today-relative-dashboard-fixtures.sql` (`7dd714df4`, unchanged since attempt 1). It holds eight date-only UPDATEs with the 060 offsets, no INSERT, and no text column.
- **Spec:** `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`.
  - `:12` sets `FROZEN_TIME = new Date(new Date().setUTCHours(12, 0, 0, 0))`.
  - `:56-112` is the beforeAll: a service-role `createClient`, a throw at `:59-64` without `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, the eight updates, and a throw at `:106-110` unless each update hits exactly one row.
  - `:116-127` is new in this attempt: the token-expiry alignment and its comment.
  - `:172-176` explains the new mechanism. `:177-182`: `FIXTURE_BLOCKED` holds only `vip-visits`.
  - `:185` is `visual week-ahead`, which no longer skips. At `:197` it masks only `.week-date`.
  - `:212` is the test titled exactly `dashboard snapshots survive a date change`.
    - `:214` takes the clocks today 12:00Z and today 18:00Z, and `:216` installs one per page.
    - `:220-228` are the three `.week-title` assertions.
    - `:229` sets `mask = [widget.locator('.week-date')]`.
    - `:230` is `toHaveScreenshot('week-ahead.png', { mask })`.
- **Baseline:** `frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png` appears in the base..HEAD diff (`Bin 21626 -> 52843 bytes`).
- **Regeneration command:** it is in the front-matter. The attempt-1 SUMMARY (`488654d60`) recorded it with its output.
- **Pixel-diff artefacts:** the two `pixel_diff` paths in the front-matter. `test-results/` is gitignored, so copies are in `<scratch>/artefacts-att3/`, with the report.
- **The 18:00Z leg did not execute in this run.** The 12:00Z capture failed first on a hard `expect`. The three `.week-title` assertions passed before it, because the failure is at `toHaveScreenshot` (step 8). Attempt 1 ran both legs green against this blob at 23:10Z, when the seed hour was 23.

## The one regeneration (attempt 1, recorded again here verbatim)

This is from `git show 488654d60:.planning/phases/102-staging-data-debt-tail/102-15-SUMMARY.md` (step 7 of that file):

```
**7. The one regeneration.** Run from `frontend/`: `pnpm exec playwright test e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots --reporter=list`, with the clock at today 12:00Z = 2026-09-11T12:00Z.

before: 03afa0703270f14ea83c453583754414f625a959  tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
regen start 2026-09-11T23:10:16Z
regen rc=0 end 2026-09-11T23:10:26Z
```

## Commands and verbatim output, in execution order (attempt 3)

ANSI codes are stripped, and `<scratch>` is the session scratchpad. No secret was printed.

**1. Clock and state**

```
$ date -u; git log --oneline -15; git status --short
Fri Sep 11 23:55:28 UTC 2026
54d495039 docs(planning): record P102-15 CARRY-06 summary (ok:false, attempt 2)
8d4c5d7e1 test(e2e): restore the committed week-ahead baseline (P102-15)
488654d60 docs(planning): record P102-15 CARRY-06 summary (ok, attempt 1)
1f6400ed5 test(e2e): regenerate week-ahead baseline once for re-anchored rows (P102-15)
0304a0fd3 test(e2e): server-clock re-anchor and same-date two-clock week-ahead check (P102-15)
...
```

**2. Code read for the mechanism.** These were `grep` and `sed` over the worktree and the installed auth-js 2.100.1.

```
useUpcomingEvents.ts:38-45   if (isToday(date)) ... else if (isTomorrow(date)) ... else if (isThisWeek(date)) ... else if (isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd }))
20260508110346_phase46_fix_upcoming_events_rpc.sql:83   AND ed.start_date >= NOW()
20260508110346_phase46_fix_upcoming_events_rpc.sql:127  AND ce.event_date >= CURRENT_DATE
auth-js lib/fetch.js:111-118  export function _sessionResponse(data) { ... if (!data.expires_at) { session.expires_at = expiresAt(data.expires_in); }
auth-js lib/helpers.js:4-6    export function expiresAt(expiresIn) { const timeNow = Math.round(Date.now() / 1000); return timeNow + expiresIn; }
auth-js GoTrueClient.js:2330-2331  const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1000 - Date.now() < EXPIRY_MARGIN_MS
auth-js GoTrueClient.js:3721-3724  POST .../token?grant_type=refresh_token ... xform: _sessionResponse
```

`frontend/src` has no client-side JWT `exp` check: `grep expires_at|jwtDecode|jwt-decode|getClaims` hits type files only.

**3. :5173 census**

```
Sat Sep 12 00:02:42 UTC 2026
node    14560 khalidalzahrani   18u  IPv6 0x50bdfd652b6bff69      0t0  TCP *:5173 (LISTEN)
lsof exit=0
14560 14384 Sat Sep 12 03:01:59 2026     node <...>/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend/node_modules/.bin/../../../node_modules/.pnpm/vite@7.3.3_<...>
n<...>/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend
```

That is sibling lane P102-07's Vite server, and it was not touched.

**4. Port watcher.** A standalone background loop: exit 0 only when the port is free, exit 2 at a 25-minute deadline.

```
BRANCH=port-free 2026-09-12T00:03:33Z
[exited with code 0]
```

**5. Spec edit and baseline restore** (`git show 1f6400ed5:<png> > <png>`)

```
dd30a75747cbdf6a921da373b7a6821c519b6f80  frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
  pixelWidth: 638
  pixelHeight: 1034
 M frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
 M frontend/tests/e2e/dashboard-widgets-visual.spec.ts
```

**6. Oracle extraction.** node `yaml` read the plan front-matter and wrote both `oracle: command` blocks byte-for-byte:

```
2 oracles written
    1611 <scratch>/oracle1.sh
    3669 <scratch>/oracle2.sh
```

**7. Oracle 2, the verdict run after the work.** The spec change was not committed yet; it was committed unchanged as `f3ec018fd` in step 12.

```
baseline sha1 dd30a75747cbdf6a921da373b7a6821c519b6f80
pre lsof exit=1
oracle2 start 2026-09-12T00:04:06Z
exit=1 end 2026-09-12T00:04:18Z
  PW failed | visual week-ahead | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   7562 pixels (ratio 0.02 of all i
  PW failed | dashboard snapshots survive a date change | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   7562 pixels (ratio 0.02 of all i
P102-15-VISUAL wrapper_rc=1 passed=0 failed=2 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today 12:00Z AND today 18:00Z with date labels masked, both from a seed the spec re-anchors in beforeAll)
FAIL: the week-ahead visual is not invariant to the calendar date - a skip means the FIXTURE_BLOCKED guard still fires, a failure means the two clocks disagree
post lsof exit=1
frontend/test-results/pw-reaped-5c333137785983f2996cba1f71a14507.json
```

The clock regime was a wall time of 00:04Z against FROZEN_TIME 2026-09-12T12:00Z, so the page clock ran 11 h 56 min ahead.

**8. Report** (`pw-reaped-5c333137785983f2996cba1f71a14507.json`)

```
stats {'startTime': '2026-09-12T00:04:06.568Z', 'duration': 12114.373, 'expected': 0, 'skipped': 0, 'unexpected': 2, 'flaky': 0}
errors []
--- failed | visual week-ahead | line 185 | 4346 ms
Error: expect(locator).toHaveScreenshot(expected) failed
Locator: getByTestId('dashboard-widget-week-ahead')
  7562 pixels (ratio 0.02 of all image pixels) are different.
  Snapshot: week-ahead.png
--- failed | dashboard snapshots survive a date change | line 212 | 4273 ms
Error: expect(locator).toHaveScreenshot(expected) failed
Locator: getByTestId('dashboard-widget-week-ahead')
  7562 pixels (ratio 0.02 of all image pixels) are different.
  Snapshot: week-ahead.png
```

Both call logs end `taking element screenshot … fonts loaded … attempting scroll into view action`.

**9. Artefacts** (sha1, path under `frontend/`, width and height)

```
063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0 test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-actual.png 638 1034
a5822ee81cc6b45c56fe6f2d17b383257e41dd05 test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-diff.png 638 1034
dd30a75747cbdf6a921da373b7a6821c519b6f80 test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-expected.png 638 1034
063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0 test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-actual.png 638 1034
a5822ee81cc6b45c56fe6f2d17b383257e41dd05 test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png 638 1034
dd30a75747cbdf6a921da373b7a6821c519b6f80 test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-expected.png 638 1034
```

Viewing the images:

- **Actual:** `Week ahead`, then TODAY: Bilateral consultation — ESCWA, Standup — Indonesia delegation. TOMORROW: Prep session — G20 Data Gaps Initiative, Brief minister — Vision 2030. NEXT WEEK: Delegation visit — Indonesia BPS, Submit OECD data response, Training — new dossier workflow, plus an eighth row clipped at the 1000 px viewport.
- **Expected:** the same, except TODAY holds only Standup and TOMORROW opens with Bilateral consultation.
- Only `.week-date` is masked (magenta).

**10. Lint and format of the edited spec**

```
eslint exit=0
All matched files use Prettier code style!
prettier exit=0
```

**11. Token grants in the retained traces** (`unzip -p trace.zip '*.network'`, counting the `/auth/v1/token` requests)

```
== …shots-survive-a-date-change…/trace.zip
{('refresh_token', 200): 2, ('password', 200): 2}
== …visual-week-ahead…/trace.zip
{('refresh_token', 200): 2, ('password', 200): 2}
```

**12. Oracle 1, after every browser run**

```
oracle1 at 2026-09-12T00:05:49Z
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
```

**13. Week-start override census, with a control**

```
pattern=[setDefaultOptions\|weekStartsOn] non-test files=0
pattern=[isThisWeek] non-test files=1
```

**14. Commits.** The pre-commit hook ran lint-staged and the build (knip notes only). Diff scope:

```
f3ec018fd test(e2e): derive token expiry from the page clock in dashboard visuals (P102-15)   (hook 14 s)
a370b9860 test(e2e): restore the once-regenerated week-ahead baseline (P102-15)
--- base..HEAD (0d0e608b7..HEAD)
 .../102-staging-data-debt-tail/102-15-SUMMARY.md   | 247 +++++++++++++++++++++
 .../__snapshots__/dashboard-widgets/week-ahead.png | Bin 21626 -> 52843 bytes
 .../tests/e2e/dashboard-widgets-visual.spec.ts     | 164 +++++++++++---
 .../072-p102-today-relative-dashboard-fixtures.sql |  44 ++++
 4 files changed, 428 insertions(+), 27 deletions(-)
HEAD png content sha1 dd30a75747cbdf6a921da373b7a6821c519b6f80
```

The SUMMARY line in that stat is attempt 2's file; this file replaces it.

## Populations re-derived

- **Fixture family:** 3 `b0000002-%` engagements and 5 `b0000006-%` calendar entries, from oracle 1's `present` control, `3 5`.
- **Tests selected by oracle 2's `-g`:** 2. Both ran and both failed (report `unexpected: 2`).
- **Captures in this run:** 2, both at the 12:00Z clock and both the same bytes (`063e5afa…`). The new test's 18:00Z capture was not reached.
- **Snapshot files in the base..HEAD diff:** 1 (`week-ahead.png`).

## Zeros beside the control that proves the instrument could see a non-zero

- **`skipped=0`** ← the same report counts `unexpected=2`. This spec at the plan's HEAD skipped week-ahead on FIXTURE_BLOCKED.
- **No 429 and no /login** ← the same traces count 4 token grants each, all 200, and both tests reached `toHaveScreenshot`.
- **`pre lsof exit=1`** ← the same census returned exit 0 at 00:02:42Z, while P102-07's Vite held the port.
- **`setDefaultOptions|weekStartsOn`: 0 files** ← the same grep finds `isThisWeek` in 1 file.
- **`errors []`** in the report ← the same report carries `unexpected: 2` with messages.

## Limits of this pass, left for the operator and later tasks

1. **Operator ruling needed: CARRY-06 daily stability** (the attempt-1 deferred finding, now measured). The mechanism removes the NOW() divergence: rows sit in the window, the widget is non-empty, and the week-ahead visual no longer skips. It cannot keep a fixed baseline green across hours and weekdays, for two reasons:
   - The judge-mandated `date_trunc('hour', NOW()) + 2 h` offset moves engagement 001 between TODAY and TOMORROW at server hour 19Z (browser +03).
   - `isThisWeek` moves rows between THIS WEEK and NEXT WEEK by weekday.

   The group headers sit outside the only permitted mask. Any one of these would close it, and each needs an amended judge text in `102-15-PLAN.md`, which is outside this file scope:
   - Anchor engagement 001 on `date_trunc('day', NOW()) + 1 day` instead of the hour, and pin the weekday.
   - Allow the group headers to be masked.
   - Pin the browser clock to a fixed weekday, and use a server-side time source the seed can share.
2. **No negative control for the auth fix.** Running without the route would have spent about 30 refresh grants and tripped GoTrue's 429 before the gate's own run. The evidence is instead the regime (clock 11 h 56 min ahead) plus the traces (4 grants per test, all 200).
3. **Fonts** (not re-measured). The attempt-1 note stands: in a tickmarkr worktree, Vite refuses the `@fontsource` woff2 files. The blob and this run's captures share that fallback, and rows below the moved one render the same.
4. **VISUAL-DEBT-01:** the other six widget baselines were not run. vip-visits stays FIXTURE_BLOCKED.
5. **`graphify update .` was not run.** It writes `graphify-out/`, which is outside the file scope.

## Staging side effects

- **Dates only.** The beforeAll re-dated the eight rows to today-relative values in both tests of step 7. Oracle 1 reads `3 5 3 5` afterwards.
- **Auth:** 8 token grants in total, all HTTP 200.
