---
phase: 102-staging-data-debt-tail
plan: 15
status: complete
outcome: ok-false
requirements: [CARRY-06]
decisions: [D-20, D-03, D-02]
commits:
  - f15083b84 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)
  - 4d0894838 test(e2e): run-time frozen clock and two-clock week-ahead check (P102-15)
files:
  - supabase/seed/072-p102-today-relative-dashboard-fixtures.sql (blob c58ac0e426833d7ecea018f84ed81e18b096d05f)
  - frontend/tests/e2e/dashboard-widgets-visual.spec.ts (blob b96fcf1d4cb45fe2488ab5ac855875ca005854dc)
baseline_regenerated: false
---

# 102-15 SUMMARY — CARRY-06: frozen clock vs server NOW()

## Verdict: ok:false

| Oracle | Result after the work |
| --- | --- |
| 1. window control (command) | **PASS** — `3 5 3 5`, exit 0 (RED at HEAD: `0 0 3 5`) |
| 2. two-clock visual (command, reaped wrapper) | **FAIL** — `passed=0 failed=2 skipped=0`, exit 1 |
| 3. judge (diff) | every clause has a location below; one measured deviation (`.first()`) |

The committed `week-ahead.png` was **not** regenerated. Its SHA-1 is `03afa0703270f14ea83c453583754414f625a959` both in HEAD and in the working tree after all four browser runs. The captures do not match it, so the plan ends ok:false as it pre-registered, and the pixel-diff artefacts are in §Artefacts.

### Why oracle 2 cannot pass as written (measured unless marked)

1. **The committed baseline cannot contain what the criterion demands.** It is 638×293: one NEXT WEEK group with two rows, `Delegation visit — Indonesia BPS` and `SRTL-02 regression seed A`, under the heading `Week Ahead`. It was captured 2026-07-05 at `f2dc476a2`, before P102-11 sentence-cased the namespace. The criterion requires all three b0000002 titles to be visible in that same element before the capture, so the capture must hold at least three engagement rows. Measured: `Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.` The capture itself is correct: 8 rows, with only `.week-date` masked.
2. **The today+1 12:00Z leg cannot render the dashboard.** A browser clock ~13.5 h ahead of real time makes every Supabase access token look expired; the token lifetime is 3600 s (measured). supabase-js then refreshes on each session read. Page 2 fired 30 `grant_type=refresh_token` grants in 4.1 s and the last returned **429**. The session was dropped and the page ended on `/login` (failure screenshot). `.dash-root` never appeared, and the test hit its 90 s timeout. There is no clock-2 capture.
3. **The two clocks bucket the same rows differently.** This is derived from the RPC rows and date-fns' Sunday-start week in the Asia/Riyadh browser zone; it could not be captured because of item 2.
   - Clock today: TODAY 1 / TOMORROW 3 / NEXT WEEK 4 (captured, matches).
   - Clock today+1: TODAY 3 / TOMORROW 2 / THIS WEEK 1 / NEXT WEEK 2.

   Group headers and row order sit outside `.week-date`, the only mask the criterion allows, so even a regenerated baseline could not match both clocks. The seed is anchored to the server's real NOW(), which does not move with the browser clock. That divergence is the D-20 problem itself.
4. **The criterion's literal title assertion is a strict-mode violation** (measured, run 1). The RPC returns `dossiers.name_en` as both `title` and `engagement_name`, so each engagement title renders twice: in `.week-title` and in the `.week-meta` span.

**Needs an overseer ruling:** CARRY-06's criterion is unsatisfiable as written (items 1–3). The baseline is unreachable, regenerating it is banned, and the +1 day leg cannot authenticate.

### Hazard created by `FROZEN_TIME = today 12:00Z` (D-20 as ruled) — INFERENCE, not measured

Every run here was at 22:29–22:38Z, where the frozen clock sits 10.5 h *behind* real time; that is the safe side. On any run before ~11:00Z UTC (14:00 Riyadh), the frozen clock sits more than the 3600 s token lifetime *ahead* of real time. Item 2's refresh storm should then break every widget test at `.dash-root`, not just the +1 day leg. The upgrade path is to freeze at `min(today 12:00Z, now)`, or at real now truncated to the hour. This has to be measured on one run before 11:00Z before it is relied on.

## Judge item — where each clause lives (`4d0894838`)

- **Seed UPDATEs, eight ids, 060 offsets:** `supabase/seed/072-p102-today-relative-dashboard-fixtures.sql`.
  - `:18-30` updates the engagements. `:23`/`:25`/`:27` carry 060 `:209`/`:212`/`:215`'s `date_trunc`/`NOW()`/`INTERVAL` expressions verbatim.
  - `:32-41` updates the calendar entries. `:35-39` are `CURRENT_DATE`, `+ 1`, `+ 2`, `+ 3`, `+ 5`, matching 060 `:255`–`:263`.
  - Dates only; no INSERT (grep below). Only the eight ids appear in the two `VALUES` lists. `IS DISTINCT FROM` guards make a re-apply write 0 rows.
  - Free text against 102-06's class regex: 0 matches (control: 3 of 4).
- **FROZEN_TIME** from `new Date()` truncated to 12:00Z: spec `:12`, `new Date(new Date().setUTCHours(12, 0, 0, 0))`.
- **beforeAll with a service-role supabase client:** spec `:54-102`, `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` with the same eight updates in UTC.
  - It throws at `:58` if either env var is missing from `.env.test`.
  - It throws at `:98` unless each update returns exactly one row, so a silent zero-row update cannot pass.
- **FIXTURE_BLOCKED:** the week-ahead entry is removed. `FIXTURE_BLOCKED` at `:156` now holds only `vip-visits`. The comment's week-ahead text is replaced by the new mechanism's explanation at `:151-155`, and the header comment `:6-11` is rewritten the same way.
- **New test** titled exactly `dashboard snapshots survive a date change`: spec `:185`.
  - It installs the clock twice at `:187-189`: a loop over `FROZEN_TIME` and `FROZEN_TIME + 1 day`, each on a fresh page with `page.clock.install({ time })`.
  - Three title assertions run before each capture: `:196-198`.
  - `mask` is exactly `[widget.locator('.week-date')]`: `:199`.
  - The capture is `toHaveScreenshot('week-ahead.png', { mask })`: `:200`.
- **Deviation, measured necessary:** the three assertions read `widget.getByText('…').first()`. The criterion's un-narrowed `widget.getByText('…')` raised `strict mode violation … resolved to 2 elements` in run 1 (verbatim below). `.first()` is the `.week-title` element, first in DOM order.
- **Choice:** `expect.soft(widget).toHaveScreenshot(...)`, so the second clock is still attempted after a first mismatch. Playwright suffixes a repeated snapshot name, so a second capture would land at `week-ahead-1-{actual,diff}.png`. Verified in `_resolveSnapshotPaths`, playwright 1.60.0.
- **Loop test:** `visual week-ahead` also masks `.week-date` (`:176`, the D-20 date-label mask); the other widgets get `mask: []`. The clock install moved from the old `beforeEach` into each test (`:167`), after `test.fixme`.
- **Baseline not regenerated:** SHA-1 identical, as stated in §Verdict.

## Artefacts (pixel diffs)

Playwright wrote these in run 3. They are gitignored, and run 4's output-dir clean has since removed them from the worktree. A fresh oracle-2 run regenerates them at the same paths.

- New test, clock today 12:00Z: `frontend/test-results/e2e-dashboard-widgets-visu-6a73a-shots-survive-a-date-change-chromium-dashboard-widgets/week-ahead-diff.png`, with `-actual.png` and `-expected.png` alongside.
- Loop test: `frontend/test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png`.
- Clock today+1 12:00Z: no capture exists, because the leg never reached `toHaveScreenshot`. Its failure screenshot `…6a73a…/test-failed-1.png` shows the sign-in page.

Durable copies are in the session scratchpad at `run3-test-results/<same dir>/` (sha256):

```
af3d5e6f43f12fe0908b6eeb23c26f76a4091b99fc52a46226bbf0904c704769  week-ahead-actual.png   (638x1034; byte-identical in both tests)
4fe086cb64b8f26054dafd2e9b8c813c81ad003fc7b691861074bedd24c24a6f  week-ahead-diff.png     (638x1034; byte-identical in both tests)
b31b3dc2e5c616a0ba25112014ab38ca04ec157a95493c6b4507b3bb858df3ff  week-ahead-expected.png (638x293; copy of the committed baseline)
fb18fafe1e0dde3d4781568e740a2c03193e7e4412466bbf48745e1497a108d6  6a73a…/test-failed-1.png (clock today+1: sign-in page)
```

## Commands and verbatim output, in execution order

ANSI colour codes are stripped, and no secret was printed (`.env.test` was read with its values redacted). `oracle1.sh` and `oracle2.sh` are the plan's two `oracle: command` blocks, extracted byte-for-byte from the front-matter with node `yaml` and run with `bash`. The zsh I first used does not word-split `set -- $PSQL_OUT`.

**1. Oracle 1 at HEAD, before any change** (typed into zsh):

```
P102-15-WINDOW engagements_in_window=0 0 3 5 calendar_in_window= engagements_present= calendar_present= expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
INSTRUMENT-CANNOT-RUN: the b0000002/b0000006 fixture family is not 3+5 rows (+) - the seed population moved
```

Exit 3 here is a zsh instrument artefact; the raw psql value `0 0 3 5` is exactly the plan's RED at HEAD. Every later run used `bash`.

**2. Staging reads before the seed** (psql, read-only):

```
NOW|2026-09-11 22:18:20.399097+00|2026-09-11|UTC
ENG|b0000002-0000-0000-0000-000000000001|Bilateral consultation — ESCWA|2026-07-03 21:00:00+00|2026-07-03 23:00:00+00|follow_up
ENG|b0000002-0000-0000-0000-000000000002|Prep session — G20 Data Gaps Initiative|2026-07-04 10:00:00+00|2026-07-04 12:00:00+00|preparation
ENG|b0000002-0000-0000-0000-000000000003|Delegation visit — Indonesia BPS|2026-07-05 14:00:00+00|2026-07-07 16:00:00+00|follow_up
CAL|b0000006-0000-0000-0000-000000000001|Standup — Indonesia delegation|2026-04-30|09:00:00|scheduled
CAL|b0000006-0000-0000-0000-000000000002|Brief minister — Vision 2030|2026-05-01|11:00:00|scheduled
CAL|b0000006-0000-0000-0000-000000000003|Submit OECD data response|2026-05-02|17:00:00|scheduled
CAL|b0000006-0000-0000-0000-000000000004|Training — new dossier workflow|2026-05-03|14:00:00|scheduled
CAL|b0000006-0000-0000-0000-000000000005|GCC sync — quarterly readout|2026-05-05|10:00:00|scheduled
TRIG|engagement_dossiers|trigger_update_engagement_dossiers_updated_at|BEFORE|UPDATE
```

The `CALFUT`/`ENGFUT` probes returned no rows. `pg_get_functiondef(get_upcoming_events)` (SECURITY DEFINER) filters as follows:

- Engagements: `ed.start_date >= NOW()`, `<= NOW() + p_days_ahead`, `d.status = 'active'`, and `d.created_by = p_user_id` or a `dossier_owners` row.
- Calendar entries: `ce.event_date >= CURRENT_DATE`, `<= (NOW()+days)::DATE`, and organizer/creator/attendee `= p_user_id`, with start normalised `AT TIME ZONE 'UTC'`.
- Both return `d.name_en` as `title` **and** as `engagement_name`.

Scoping for the test user:

```
USER|t
ENGDOS|b0000002-0000-0000-0000-000000000001|active|t|f
ENGDOS|b0000002-0000-0000-0000-000000000002|active|t|f
ENGDOS|b0000002-0000-0000-0000-000000000003|active|t|f
CALORG|b0000006-0000-0000-0000-000000000001|t
CALORG|b0000006-0000-0000-0000-000000000002|t
CALORG|b0000006-0000-0000-0000-000000000003|t
CALORG|b0000006-0000-0000-0000-000000000004|t
CALORG|b0000006-0000-0000-0000-000000000005|t
SRTL|007b1ee4-4f9a-40bc-ab42-6138564820a8|SRTL-02 regression seed A|2026-07-10|10:00:00|t
SRTL|5180e1a2-a535-4a5c-b8e0-7eee858b8adf|SRTL-02 regression seed B|2026-07-15|13:30:00|t
SRTL|ff18f280-aa53-41fc-9b53-36e53db7235a|SRTL-02 regression seed C|2026-07-21|16:00:00|t
```

The host clock read `Sat Sep 12 01:22:09 +03 2026` / `Fri Sep 11 22:22:09 UTC 2026`, zone `Asia/Riyadh`, with `@playwright/test` 1.60.0.

**3. Seed applied twice**, using `PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <seed>` in a bash loop:

```
$ psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/072-p102-today-relative-dashboard-fixtures.sql   # apply 1 at 2026-09-11T22:26:45Z
BEGIN
UPDATE 3
UPDATE 5
COMMIT
rc=0
$ psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/072-p102-today-relative-dashboard-fixtures.sql   # apply 2 at 2026-09-11T22:26:46Z
BEGIN
UPDATE 0
UPDATE 0
COMMIT
rc=0
```

**4. Oracle 1 after the seed:**

```
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
```

**5. RPC readback**, `get_upcoming_events(<test user>, 14)`:

```
2026-09-11 22:28:18.428059+00
consultation|Bilateral consultation — ESCWA|2026-09-12 00:00:00+00
working_group|Prep session — G20 Data Gaps Initiative|2026-09-12 10:00:00+00
official_visit|Delegation visit — Indonesia BPS|2026-09-13 14:00:00+00
internal_meeting|Standup — Indonesia delegation|2026-09-11 09:00:00+00
review|Brief minister — Vision 2030|2026-09-12 11:00:00+00
deadline|Submit OECD data response|2026-09-13 17:00:00+00
training|Training — new dossier workflow|2026-09-14 14:00:00+00
internal_meeting|GCC sync — quarterly readout|2026-09-16 10:00:00+00
```

**6. Spec written**, with the criterion's literal un-narrowed `getByText`. `pnpm exec prettier --check` and `pnpm exec eslint` on the spec:

```
Checking formatting...
All matched files use Prettier code style!
eslint rc=0
```

**7. Seed commit:** `f15083b84 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)`.

**8. Pre-registered before run 1** (verbatim):

```
PRE-REGISTERED 2026-09-11T22:29:13Z, before the first browser run (spec with the criterion's literal un-narrowed getByText):
- new test 'dashboard snapshots survive a date change': FAILS at clock 1 on strict mode violation, getByText('Bilateral consultation — ESCWA') resolved to 2 elements (.week-title + .week-meta span; RPC returns d.name_en as both title and engagement_name). No capture reached.
- 'visual week-ahead': no longer skipped; FAILS on toHaveScreenshot, size mismatch vs committed week-ahead.png (committed = 1 group NEXT WEEK, 2 rows incl. 'SRTL-02 regression seed A'; clock today renders 3 groups / 8 rows).
- stats: expected=0 unexpected=2 skipped=0 -> oracle exit 1.
Structural: clock today = TODAY[cal1] TOMORROW[001,002,cal2] NEXT WEEK[003,cal3,cal4,cal5]; clock today+1 = TODAY[001,002,cal2] TOMORROW[003,cal3] THIS WEEK[cal1] NEXT WEEK[cal4,cal5]. Group headers are unmasked, so the two clocks cannot match one baseline even if regenerated.
```

**9. Oracle 2, run 1** (22:29:13Z → 22:29:25Z). The port census `lsof -nP -iTCP:5173 -sTCP:LISTEN` gave `lsof exit=1 (1 = no listener)`.

```
  PW failed | visual week-ahead | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 293px
  PW failed | dashboard snapshots survive a date change | Error: expect(locator).toBeVisible() failed  Locator: getByTestId('dashboard-widget-week-ahead').getByText('Bilateral consultation — ESCWA') Expected: vis
P102-15-VISUAL wrapper_rc=1 passed=0 failed=2 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today's clock AND under today+1 with date labels masked, both from a seed the spec re-anchors in beforeAll)
FAIL: the week-ahead visual is not invariant to the calendar date - a skip means the FIXTURE_BLOCKED guard still fires, a failure means the two clocks disagree
exit=1
```

The full error from the report (`pw-reaped-6d1d31a459f7a18d9b74e22cf7884231.json`, stats `expected 0 skipped 0 unexpected 2`):

```
Error: strict mode violation: getByTestId('dashboard-widget-week-ahead').getByText('Bilateral consultation — ESCWA') resolved to 2 elements:
    1) <div class="week-title text-start truncate">Bilateral consultation — ESCWA</div> aka getByText('Bilateral consultation — ESCWA').first()
    2) <span class="truncate">Bilateral consultation — ESCWA</span> aka locator('span').filter({ hasText: 'Bilateral consultation — ESCWA' })
```

The prediction was confirmed on every point. The run-1 clock-1 capture showed TODAY [Standup] / TOMORROW [ESCWA, G20, Brief minister] / NEXT WEEK [Indonesia BPS, OECD, Training, GCC sync], with only the date column masked and the heading `Week ahead`.

**10. Spec edit:** the three assertions were narrowed with `.first()` and given a comment. The spec is final from here: mtime `2026-09-11T22:30:31Z`, blob `b96fcf1d`, committed unchanged as `4d0894838`.

**11. Pre-registered before run 2** (verbatim):

```
PRE-REGISTERED 2026-09-11T22:31:04Z, before run 2 (titles narrowed with .first()):
- new test: all six title assertions pass (clock 1: ESCWA+G20 in TOMORROW, BPS in NEXT WEEK; clock 2: ESCWA+G20 in TODAY, BPS in TOMORROW); BOTH soft captures fail on size vs the 638x293 baseline; capture 2 lands at week-ahead-1-{actual,diff}.png and is taller than capture 1 (4 group headers vs 3).
- visual week-ahead: fails as in run 1 (638x1034 vs 638x293).
- stats expected=0 unexpected=2 skipped=0 -> oracle exit 1.
Run 3 (whole chromium-dashboard-widgets project): no prediction for the six non-week-ahead widgets; recording magnitudes only. vip-visits skipped (FIXTURE_BLOCKED).
```

**12. Oracle 2, run 2** (22:31:04Z → 22:32:44Z). This is the oracle-2 run after the work. Port census: `lsof exit=1`.

```
  PW failed | visual week-ahead | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 293px
  PW failed | dashboard snapshots survive a date change | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 293px
P102-15-VISUAL wrapper_rc=1 passed=0 failed=2 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today's clock AND under today+1 with date labels masked, both from a seed the spec re-anchors in beforeAll)
FAIL: the week-ahead visual is not invariant to the calendar date - a skip means the FIXTURE_BLOCKED guard still fires, a failure means the two clocks disagree
exit=1
```

The prediction was right on the stats, the exit code and both clock-1 mismatches. **It was wrong on clock 2:** I predicted the clock-2 title assertions would pass, but that leg never reached them; see step 15. Run 2 took 100 s against run 1's 12 s, consistent with the new test's 90 s timeout. Its report and trace were overwritten by run 3, which failed the same way.

**13. Run 3: the whole `chromium-dashboard-widgets` project** through the wrapper (`node ../scripts/pw-run-reaped.mjs -- e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets`, 22:32:44Z → 22:34:24Z):

```
wrapper exit=1
stats {'startTime': '2026-09-11T22:32:45.056Z', 'duration': 99323.709, 'expected': 0, 'skipped': 1, 'unexpected': 8, 'flaky': 0}
run3 | visual kpi-strip                             | failed   | 5609 ms | 606 pixels (ratio 0.01 of all image pixels) are different.
run3 | visual week-ahead                            | failed   | 5458 ms | Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.
run3 | visual overdue-commitments                   | failed   | 5569 ms | Expected an image 638px by 989px, received 638px by 1128px. 8117 pixels (ratio 0.02 of all image pixels) are different.
run3 | visual digest                                | failed   | 5895 ms | 3057 pixels (ratio 0.03 of all image pixels) are different.
run3 | visual sla-health                            | failed   | 6363 ms | 402 pixels (ratio 0.01 of all image pixels) are different.
run3 | visual vip-visits                            | skipped  | 129 ms |
run3 | visual my-tasks                              | failed   | 5202 ms | Expected an image 319px by 506px, received 319px by 505px. 2132 pixels (ratio 0.02 of all image pixels) are different.
run3 | visual recent-dossiers                       | failed   | 5766 ms | 704 pixels (ratio 0.01 of all image pixels) are different.
run3 | dashboard snapshots survive a date change    | failed   | 91698 ms | Expected an image 638px by 293px, received 638px by 1034px. 55807 pixels (ratio 0.09 of all image pixels) are different.
```

The new test's `error-context.md` lists three errors: the clock-1 soft mismatch above, `Test timeout of 90000ms exceeded.`, and `Error: page.waitForSelector: Test ended. … waiting for locator('.dash-root') to be visible`.

**14. Artefact dimensions** (`sips`) and the scratchpad copy. The sha256 values are in §Artefacts.

```
638 1034   …6a73a-shots-survive-a-date-change…/week-ahead-actual.png
638 293    …6a73a-shots-survive-a-date-change…/week-ahead-expected.png
638 1034   …visual-week-ahead…/week-ahead-actual.png
638 293    …visual-week-ahead…/week-ahead-expected.png
```

**15. Trace of the new test in run 3**: `/auth/v1` and page requests, parsed from the scratchpad copy of `trace.zip`.

```
2026-09-11T22:32:52.512  page1  GET   /login                                        -> 200
2026-09-11T22:32:54.720  page1  POST  /auth/v1/token?grant_type=password            -> 200
2026-09-11T22:32:55.246  page1  GET   /dashboard                                    -> 200
2026-09-11T22:32:58.093  page2  GET   /login                                        -> 200
2026-09-11T22:32:58.509  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:58.739  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:58.866  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:58.995  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.139  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.273  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.401  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.417  page2  POST  /auth/v1/token?grant_type=password            -> 200
2026-09-11T22:32:59.533  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.664  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:32:59.793  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:00.007  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:00.198  page2  POST  /auth/v1/token?grant_type=refresh_token       -> -1
2026-09-11T22:33:00.206  page2  GET   /dashboard                                    -> 200
2026-09-11T22:33:00.530  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:00.703  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:00.844  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.004  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.148  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.285  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.412  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.546  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.679  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:01.888  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:02.023  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:02.157  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:02.359  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:02.493  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 200
2026-09-11T22:33:02.649  page2  POST  /auth/v1/token?grant_type=refresh_token       -> 429
```

Page 1 (clock today 12:00Z) signed in once and rendered. Page 2 (clock today+1 12:00Z) signed in and then looped on refresh grants until it hit 429.

**16. Run 4: attribution control on HEAD's spec** (`FROZEN_TIME = 2026-07-03T12:00:00Z`, week-ahead FIXTURE_BLOCKED). The same data and project were used, via a transient copy at `frontend/tests/e2e/zz-head-dashboard-widgets-visual.spec.ts` removed by a `trap` in the same command (`temp spec removed: yes`), 22:37:58Z → 22:38:15Z:

```
11:const FROZEN_TIME = new Date('2026-07-03T12:00:00Z')
wrapper exit=1
stats {'startTime': '2026-09-11T22:37:59.362Z', 'duration': 15553.098, 'expected': 0, 'skipped': 2, 'unexpected': 6, 'flaky': 0}
run4 | visual kpi-strip                             | failed   | 6123 ms | 606 pixels (ratio 0.01 of all image pixels) are different.
run4 | visual week-ahead                            | skipped  | 4985 ms |
run4 | visual overdue-commitments                   | failed   | 6757 ms | 5862 pixels (ratio 0.01 of all image pixels) are different.
run4 | visual digest                                | failed   | 6541 ms | 3057 pixels (ratio 0.03 of all image pixels) are different.
run4 | visual sla-health                            | failed   | 6897 ms | 371 pixels (ratio 0.01 of all image pixels) are different.
run4 | visual vip-visits                            | skipped  | 6429 ms |
run4 | visual my-tasks                              | failed   | 8464 ms | Expected an image 319px by 506px, received 319px by 505px. 2020 pixels (ratio 0.02 of all image pixels) are different.
run4 | visual recent-dossiers                       | failed   | 6760 ms | 576 pixels (ratio 0.01 of all image pixels) are different.
```

**17. Oracle 1, final run after all browser runs.** Every run's `beforeAll` had re-anchored the rows again.

```
oracle1 final 2026-09-11T22:39:38Z
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
b0000002-0000-0000-0000-000000000001|2026-09-12 00:00:00+00|2026-09-12 02:00:00+00
b0000002-0000-0000-0000-000000000002|2026-09-12 10:00:00+00|2026-09-12 12:00:00+00
b0000002-0000-0000-0000-000000000003|2026-09-13 14:00:00+00|2026-09-15 16:00:00+00
b0000006-0000-0000-0000-000000000001|2026-09-11
b0000006-0000-0000-0000-000000000002|2026-09-12
b0000006-0000-0000-0000-000000000003|2026-09-13
b0000006-0000-0000-0000-000000000004|2026-09-14
b0000006-0000-0000-0000-000000000005|2026-09-16
```

**18. Supporting measurements.** The access token in `frontend/tests/e2e/.auth/storageState.json` was decoded without printing it. Seed checks:

```
access token lifetime (exp - iat) = 3600 s
-- seed lines (grep UPDATE|INSERT|date_trunc|CURRENT_DATE) --
18:UPDATE public.engagement_dossiers AS ed
23:   date_trunc('hour', NOW()) + INTERVAL '2 hours',  date_trunc('hour', NOW()) + INTERVAL '4 hours'),
25:   date_trunc('day', NOW()) + INTERVAL '1 day 10 hours', date_trunc('day', NOW()) + INTERVAL '1 day 12 hours'),
27:   date_trunc('day', NOW()) + INTERVAL '2 days 14 hours', date_trunc('day', NOW()) + INTERVAL '4 days 16 hours')
32:UPDATE public.calendar_entries AS ce
35:  ('b0000006-0000-0000-0000-000000000001'::uuid, CURRENT_DATE),
36:  ('b0000006-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 1),
37:  ('b0000006-0000-0000-0000-000000000003'::uuid, CURRENT_DATE + 2),
38:  ('b0000006-0000-0000-0000-000000000004'::uuid, CURRENT_DATE + 3),
39:  ('b0000006-0000-0000-0000-000000000005'::uuid, CURRENT_DATE + 5)
-- class-regex check on seed (102-06 bounded form) --
matches printed above (none = 0)
-- perl class-regex positive control (must print 3 lines) --
1: a fixture row
2: Phase 12 note
3: E2E seed
```

The grep's comment-line hits at `:7`, `:8` and `:12` are omitted above; none is an INSERT.

**19. Pins.** Spec blob `b96fcf1d4cb45fe2488ab5ac855875ca005854dc`. Seed blob `c58ac0e426833d7ecea018f84ed81e18b096d05f`, identical to `HEAD:` after commit. Baseline SHA-1 `03afa0703270f14ea83c453583754414f625a959` in both the working tree and `HEAD:`.

**20. Post-run census** (no background process outlives the worker):

```
post-run census 2026-09-11T22:46:41Z
lsof :5173 exit=1 (1 = no listener)
worktree-anchored leftover processes: exit=1 (1 = none)
```

**Tooling misfires** (none changed state):

- `python3 -c 'import yaml'` failed with `ModuleNotFoundError`; switched to node `yaml`.
- An unquoted `echo ======` in zsh raised `(eval):8: ===== not found` and cut that batch after the seed applies had already run.
- A `cd frontend` persisted and the first seed commit failed with `fatal: pathspec … did not match`. It was re-run with `git -C` and absolute paths.
- `psql -c` does not interpolate `:'email'` (`ERROR:  syntax error at or near ":"`); switched to a heredoc.
- A first trace grep hit ugrep's `exceeds complexity limits`; switched to python.

## Populations re-derived

- **Fixture family:** 3 `b0000002-%` engagement_dossiers and 5 `b0000006-%` calendar_entries. This is oracle 1's own `present` control, `3 5` on every run.
- **RPC rows for the test user after the seed:** 8, exactly the family (step 5). No other row for this user falls in the 14-day window; the three SRTL-02 rows sit at 2026-07-10, 07-15 and 07-21.
- **Tests in the project:** 9, the 8 loop widgets plus the new test (run 3).

## Zeros beside the control that proves the instrument could see a non-zero

- **`in_window 0 0` at HEAD** ← the same query's `present 3 5`.
- **Re-apply `UPDATE 0` / `UPDATE 0`** ← the first apply of the same file, one second earlier: `UPDATE 3` / `UPDATE 5`.
- **`skipped=0` in runs 1–2** (week-ahead no longer skips) ← run 4, same project and data on HEAD's spec: `skipped=2` (week-ahead + vip-visits). Run 3 shows `skipped=1` (vip-visits).
- **Seed class-regex matches = 0** ← the same perl expression printed 3 of 4 control lines.
- **INSERT lines in the seed = 0** ← the same grep printed both UPDATE lines.
- **`passed=0` in every run:** no positive control here. No dashboard-widget test passed in any run, on HEAD's spec (run 4) or this one. Each failure is attributed by its own error text (size, pixel count, strict mode, timeout), so the zero is not instrument blindness. Still, no run showed this wrapper counting a pass on this project.
- **Foreign :5173 listeners before runs 1–2 = 0** (`lsof exit=1`): no positive control was sampled.

## Outside the population: the other widgets (recorded, not changed)

Both runs used the same data. Run 4 is HEAD's spec with the clock at 2026-07-03; run 3 is this spec with the clock at today 12:00Z.

| widget | run 4 (HEAD spec) | run 3 (this spec) |
| --- | --- | --- |
| kpi-strip | failed, 606 px | failed, 606 px |
| overdue-commitments | failed, 5862 px | failed, 638×989 → 638×1128, 8117 px |
| digest | failed, 3057 px | failed, 3057 px |
| sla-health | failed, 371 px | failed, 402 px |
| vip-visits | skipped (FIXTURE_BLOCKED) | skipped (FIXTURE_BLOCKED) |
| my-tasks | failed, 319×506 → 319×505, 2020 px | failed, 319×506 → 319×505, 2132 px |
| recent-dossiers | failed, 576 px | failed, 704 px |
| week-ahead | skipped (FIXTURE_BLOCKED) | failed, 638×293 → 638×1034 |

- No widget went from green to red: all six were already red under HEAD's spec.
- The clock move changed magnitudes only. overdue-commitments' layout is clock-sensitive, since its overdue day counts come from the browser clock.
- kpi-strip and digest are byte-for-byte the same diff under both clocks.
- Caveat: run 4 ran on today's data (the seed had already moved the eight rows), so it is "red on HEAD's spec", not "red on HEAD's data".

## Staging side effects

- **Eight rows re-dated (dates only):** by the seed twice, then by the spec's `beforeAll` in runs 1–3 (per worker, identical values within the UTC hour). `updated_at` is bumped on the three engagement rows by each non-no-op update (trigger).
- **Auth:** each run's clock-2 leg sent the test user's refresh token through ~30 grants and one 429. That was observed in run 3's trace; runs 2 and 3 failed identically. It is a transient GoTrue rate limit.
- **Transient file:** `frontend/tests/e2e/zz-head-dashboard-widgets-visual.spec.ts` existed for run 4 only. It was removed in the same command and never staged.

## Left for a named later task

1. **Overseer ruling on CARRY-06 (re-plan of P102-15).** The criterion is unsatisfiable as written. The 2026-07-05 baseline is unreachable; the two clocks bucket differently outside `.week-date`; and a browser clock ahead of real time cannot authenticate. Options:
   - accept a re-captured baseline under an explicit ruling (the roadmap bans regeneration *as a fix*);
   - drop the +1 day leg;
   - or run it only when server time moves too, which means option A (`p_now`, rejected by D-20).
2. **FROZEN_TIME morning hazard (inference above):** measure one run before 11:00Z UTC. The upgrade path is `min(today 12:00Z, now)`.
3. **VISUAL-DEBT-01:** the six red widget baselines in the table, plus vip-visits (FIXTURE_BLOCKED, no VIP participant rows).
4. **WeekRow renders an engagement's name twice** (`title` == `engagement_name` from the RPC). Any spec asserting those titles must narrow its locator. This is a product quirk, not repaired here.
5. **`graphify update .` was not run.** It writes `graphify-out/`, which is outside this plan's file scope.
