---
phase: 102-staging-data-debt-tail
plan: 15
status: complete
outcome: ok
attempt: 8
requirements: [CARRY-06]
decisions: [D-20, D-03, D-02]
base: cfefbdd25 # the base the attempt-7 review graded (git diff cfefbdd2597e..HEAD)
commits: # reachable from HEAD on this branch at 2026-09-12T01:08Z
  - 0d6666127 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)
  - fbdd957af test(e2e): run-time frozen clock and two-clock week-ahead check (P102-15)
  - 7fccb1126 test(e2e): server-clock re-anchor and same-date two-clock week-ahead check (P102-15)
  - 5806a9f13 test(e2e): derive token expiry from the page clock in dashboard visuals (P102-15)
  - 97d952476 test(e2e): pin the week-ahead browser zone so rows keep their group at every server hour (P102-15)
  - 599d8e9ef test(e2e): re-baseline week-ahead for the pinned-zone render (P102-15) # the week-ahead.png the diff carries
  - e6e6eddb1 test(e2e): pin the week-ahead weekday so rows keep their group on every real day (P102-15) # this attempt
baseline_in_diff: "frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png, one modified PNG in cfefbdd25..HEAD, blob sha1 063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0, 638x1034, last written by 599d8e9ef; this attempt did not regenerate it"
update_snapshots_command: "node ../scripts/pw-run-reaped.mjs -- e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots" # run from frontend/ at 2026-09-12T00:22:07Z (attempt 4), .env.test sourced, clock today 12:00Z = 2026-09-12T12:00Z
pixel_diff: none # both captures match the PNG in the diff (oracle 2, 2026-09-12T01:07Z)
---

# 102-15 SUMMARY: CARRY-06 frozen clock vs server NOW()

## Verdict: ok

All three acceptance items hold at HEAD `e6e6eddb1`. The oracles below ran after the work and were extracted byte-for-byte from the plan front-matter.

| Oracle | Result after the work (2026-09-12T01:07Z) |
| --- | --- |
| 1. Window control (command) | **PASS**: `3 5 3 5`, exit 0 |
| 2. Two-clock visual (command, reaped wrapper) | **PASS**: `passed=2 failed=0 skipped=0`, exit 0 |
| 3. Judge (diff) | Every clause cites a line in the diff; see "Judge item" below. The base..HEAD diff carries exactly one regenerated `week-ahead.png`. |

## What this attempt fixed

**The review finding.** The attempt-7 review (codex gpt-5.6-sol) had one material finding. The snapshot still depended on the weekday. `groupEventsByDay` (`useUpcomingEvents.ts:24-50`) files each row after tomorrow using date-fns `isThisWeek`, `startOfWeek` and `endOfWeek` with the default Sunday week start. Those functions read `Date#getDay` (`date-fns/startOfWeek.js`: `const day = _date.getDay()`). So the rows re-anchored to +2, +3 and +5 days split between THIS WEEK and NEXT WEEK in four different ways across a week. Those group headers sit outside the `.week-date` mask, so the Saturday baseline would fail on Sunday through Thursday.

**The fix (`e6e6eddb1`, spec only).** A new `pinWeekdayToSaturday(page, time)` (spec :178-186) adds an init script. That script shifts `getDay` on the page's `Date` prototype by a fixed amount, so that the frozen day reads as a Saturday. Today is then the last day of its week, and every row after tomorrow lands under NEXT WEEK on every real weekday. That is the layout the committed baseline holds.

Both week-ahead tests call it after `page.clock.install`:
- `visual week-ahead` at :221;
- `dashboard snapshots survive a date change` at :255, once per clock.

Three things are unchanged:
- **The clock:** today 12:00Z and today 18:00Z. `Date.now()` is untouched.
- **The mask:** exactly `[widget.locator('.week-date')]`.
- **The seed and PNG:** no change to either. The only weekday text on screen is the `.week-day` label inside the masked `.week-date`.

The PNG was not regenerated. The pinned layout is the Fri/Sat layout the baseline already shows, and both captures match it byte-for-byte on this run. The diff still carries exactly one PNG.

## The mechanism as it stands

- **Seed** (`supabase/seed/072-p102-today-relative-dashboard-fixtures.sql`, `0d6666127`, unchanged): eight date-only UPDATEs with the 060 offsets.
  - Engagements (060 :205-216): `date_trunc('hour', NOW())` +2h/+4h; `date_trunc('day', NOW())` +1 day 10h/12h; +2 days 14h to +4 days 16h.
  - Calendar entries (060 :251-262): `CURRENT_DATE` +0/+1/+2/+3/+5.
  - There is no INSERT and no text column is written. The `IS DISTINCT FROM` guards make a re-apply within the same hour write nothing.
- **Spec** (`frontend/tests/e2e/dashboard-widgets-visual.spec.ts`):
  - **FROZEN_TIME** = `new Date(new Date().setUTCHours(12, 0, 0, 0))` (:12).
  - **beforeAll** (:65-121): builds a service-role client from `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (`.env.test` via dotenv) and throws if either is missing. It takes NOW() from the Supabase `Date` header, applies the same eight updates, and throws unless each update hits exactly one row.
  - **Token route** (`openDashboard`, :124): drops `expires_at`, so auth-js derives token expiry from the page clock.
  - **Browser zone:** both week-ahead tests run at `WEEK_AHEAD_TIMEZONE = 'Etc/GMT+2'` (:24), which keeps engagement 001 under TODAY at every server hour.
  - **Weekday pin:** `pinWeekdayToSaturday` (:178), called at :221 and :255, keeps every row in its group on every weekday.

## Proof the weekday dimension is closed

**1. Offline replay (the logic).** The replay copies `groupEventsByDay`, with `new Date()` replaced by `new Date(Date.now())` and `Date.now` faked. It uses date-fns 4.3.0 and `TZ=Etc/GMT+2`. It covers 7 weekdays × 24 server hours × both clocks, and computes the event dates exactly as the beforeAll does. The pinned pass uses the same `getDay` shift as the init script. The unpinned pass is the control, and it shows the four layouts the review named:

```
$ TZ=Etc/GMT+2 node weekday-replay.mjs "$PWD/frontend/node_modules/date-fns/index.js"
unpinned per-weekday layouts: Sun 1  Mon 1  Tue 1  Wed 1  Thu 1  Fri 1  Sat 1  | distinct across week: 4
   today=e1+c1 tomorrow=e2+c2 this_week=e3+c3+c4+c5 next_week=
   today=e1+c1 tomorrow=e2+c2 this_week=e3+c3+c4 next_week=c5
   today=e1+c1 tomorrow=e2+c2 this_week=e3+c3 next_week=c4+c5
   today=e1+c1 tomorrow=e2+c2 this_week= next_week=e3+c3+c4+c5
pinned   per-weekday layouts: Sun 1  Mon 1  Tue 1  Wed 1  Thu 1  Fri 1  Sat 1  | distinct across week: 1
   today=e1+c1 tomorrow=e2+c2 this_week= next_week=e3+c3+c4+c5
```

The single pinned layout is the baseline's: TODAY ×2, TOMORROW ×2, NEXT WEEK ×4.

**2. Browser drill (the lever reaches the page).** Today, 2026-09-12, is a Saturday, so the pin shifts by 0 and a passing oracle alone cannot show the lever works. The drill therefore retargeted the pin to Tuesday. It edited `const shift = 6 - …` to `9 - …` in the working tree only, ran `visual week-ahead`, then restored the spec from HEAD:

```
 frontend/tests/e2e/dashboard-widgets-visual.spec.ts | 2 +-
drill start 2026-09-12T01:06:34Z
drill rc=1 end 2026-09-12T01:06:47Z
restored; porcelain=[]
report test-results/pw-reaped-626ea0cd88042514c2a0cfa8e61ae365.json
stats {'startTime': '2026-09-12T01:06:35.238Z', 'duration': 12219.466, 'expected': 0, 'skipped': 0, 'unexpected': 1, 'flaky': 0}
test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-expected.png
test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-actual.png
test-results/e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/week-ahead-diff.png
post lsof exit=1
failed | visual week-ahead | Error: expect(locator).toHaveScreenshot(expected) failed  Locator: getByTestId('dashboard-widget-week-ahead')   Expected an image 638px by 1034px, received 638px by 1069px. 5179 pixels (ratio 0.01 of all image pixels) are different.
```

The drill's `week-ahead-actual.png` showed the Tuesday layout the replay predicts:
- TODAY: ESCWA, Standup.
- TOMORROW: G20 prep, Brief minister.
- THIS WEEK: Indonesia BPS, Submit OECD data response, Training — new dossier workflow.
- NEXT WEEK: one clipped row.

So the init-script shift reaches the widget's date-fns calls, and the Saturday pin is what keeps the committed layout.

## Commands this attempt ran, verbatim, in order

```
$ date -u
Sat Sep 12 01:00:59 UTC 2026
$ grep -rn 'isThisWeek\|weekStartsOn\|setDefaultOptions\|groupEventsByDay' src | grep -v '\.test\.'
src/domains/operations-hub/hooks/useUpcomingEvents.ts:12:import { isToday, isTomorrow, isThisWeek, addWeeks, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns'
src/domains/operations-hub/hooks/useUpcomingEvents.ts:24:export function groupEventsByDay(events: TimelineEvent[]): GroupedEvents {
src/domains/operations-hub/hooks/useUpcomingEvents.ts:42:    } else if (isThisWeek(date)) {
src/domains/operations-hub/hooks/useUpcomingEvents.ts:87:    return groupEventsByDay(query.data)
src/hooks/useWeekAhead.ts:16:  groupEventsByDay,
src/hooks/useWeekAhead.ts:33:    return groupEventsByDay(query.data)
$ node -e "console.log(require('./frontend/node_modules/date-fns/package.json').version)"
4.3.0
$ grep -rn 'no-extend-native' eslint.config.mjs      # no match: the prototype shift is not a lint violation
$ TZ=Etc/GMT+2 node weekday-replay.mjs …             # output above
$ lsof -nP -iTCP:5173 -sTCP:LISTEN; echo "lsof exit=$?"
lsof exit=1
$ pnpm exec prettier --check frontend/tests/e2e/dashboard-widgets-visual.spec.ts
All matched files use Prettier code style!
prettier exit=0
$ pnpm exec eslint --max-warnings 0 frontend/tests/e2e/dashboard-widgets-visual.spec.ts
eslint exit=0
$ git commit … -- frontend/tests/e2e/dashboard-widgets-visual.spec.ts   # hook: lint-staged eslint+prettier, turbo build
commit exit=0
e6e6eddb1 test(e2e): pin the week-ahead weekday so rows keep their group on every real day (P102-15)
```

After that came the drill (output above), then the oracles, run from the worktree root with oracle 2 first because its beforeAll re-anchors the rows oracle 1 reads:

```
extracted 2 oracles: 1611 / 3669 bytes
HEAD e6e6eddb1 porcelain=[]
pre lsof exit=1
oracle2 start 2026-09-12T01:07:13Z
P102-15-VISUAL wrapper_rc=0 passed=2 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today 12:00Z AND today 18:00Z with date labels masked, both from a seed the spec re-anchors in beforeAll)
PASS visual-invariant
exit=0 end 2026-09-12T01:07:27Z
post lsof exit=1
oracle1 at 2026-09-12T01:07:27Z
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
frontend/test-results/pw-reaped-1bcfd29c36d4cc2217dbf580ec53e97f.json
png cmp exit=0
```

The oracle-2 report (`frontend/test-results/pw-reaped-1bcfd29c36d4cc2217dbf580ec53e97f.json`):

```
stats {'startTime': '2026-09-12T01:07:13.809Z', 'duration': 13225.485999999999, 'expected': 2, 'skipped': 0, 'unexpected': 0, 'flaky': 0}
errors []
--- passed | visual week-ahead | line 217 | 3715 ms
--- passed | dashboard snapshots survive a date change | line 250 | 6423 ms
```

The PNG in the diff:

```
$ git diff --name-status cfefbdd25..HEAD
A	.planning/phases/102-staging-data-debt-tail/102-15-SUMMARY.md
M	frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
M	frontend/tests/e2e/dashboard-widgets-visual.spec.ts
A	supabase/seed/072-p102-today-relative-dashboard-fixtures.sql
$ git log --format='%h %s' cfefbdd25..HEAD -- frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
599d8e9ef test(e2e): re-baseline week-ahead for the pinned-zone render (P102-15)
03682919f test(e2e): restore the once-regenerated week-ahead baseline (P102-15)
4f83dedf5 test(e2e): restore the committed week-ahead baseline (P102-15)
a056603ee test(e2e): regenerate week-ahead baseline once for re-anchored rows (P102-15)
$ git show HEAD:frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png | shasum
063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0  -
```

The regeneration that produced this blob ran at 2026-09-12T00:22:07Z (attempt 4). The command, run from `frontend/` with `.env.test` sourced, is in the front-matter: `node ../scripts/pw-run-reaped.mjs -- e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots`. It changed the blob from `dd30a757…` to `063e5afa…`, 638×1034. The plan history for audit has two regeneration commits (`a056603ee` att1, `599d8e9ef` att4) and two restore commits (`4f83dedf5`, `03682919f`).

**The zeros and their controls.**
- `unexpected=0 skipped=0` sit beside `expected=2` in the same report. The Tuesday drill of the same test produced `unexpected=1` with this instrument.
- `skipped=0` proves the FIXTURE_BLOCKED guard no longer fires for week-ahead. `vip-visits` keeps it, and `-g` does not select it.
- The replay's pinned `distinct across week: 1` sits beside its unpinned control, which gave 4.
- `lsof exit=1` means port 5173 was free before and after each run.
- Oracle 1's `3 5` sits beside its population control `3 5`.
- `git status --porcelain` was empty after the drill restore and after the oracles, and `cmp` confirms the PNG on disk equals the HEAD blob.

## Judge item: where each clause lives

- **Seed UPDATEs for the eight ids at the 060 offsets, with no INSERT and no class-regex text:** `072-p102-today-relative-dashboard-fixtures.sql` :18-42.
- **FROZEN_TIME from `new Date()` truncated to 12:00Z:** spec :12.
- **Service-role beforeAll that fails loudly without the key:** spec :65-73 (throw) and :74-120 (the eight updates, one row each, throw at :116).
- **FIXTURE_BLOCKED:** week-ahead is removed, and the comment explains the new mechanism (spec :200-212).
- **`dashboard snapshots survive a date change`:** spec :250. It installs the clock twice, at today 12:00Z and 18:00Z (:252-254), pins the weekday (:255), and asserts the three `.week-title` rows (:260, :263, :266). It then captures with `mask = [widget.locator('.week-date')]` (:268).
- **`visual week-ahead` mask:** exactly `[widget.locator('.week-date')]` (:232).
- **Exactly one regenerated `week-ahead.png` in base..HEAD:** see "The PNG in the diff".
- **The `--update-snapshots` command verbatim:** in the front-matter and above.
- **Pixel diff:** none. Both captures match.

## Limits, left for the operator and later tasks

1. **The weekday pin fixes the week boundary, not the app.** On a real Sunday through Thursday the product shows THIS WEEK for some rows. The visual now always renders the "today is the last day of its week" layout, so THIS WEEK rendering has no visual coverage. `groupEventsByDay`'s week logic is unit-test territory. The `.week-day` label under the mask reads the shifted weekday.
2. **`visual week-ahead` keeps `maxDiffPixelRatio: 0.02`.** The Tuesday drill differed by ratio 0.01 and failed only on the height change (1069 vs 1034). A header swap that kept the height would pass that test. The date-change test runs without a tolerance.
3. **Frozen clock ahead of the wall clock.** Before 12:00Z (or 18:00Z for the second clock), the page clock runs ahead of real time. The `expires_at` drop covers supabase-js; GoTrue still validates the JWT against real time.
4. **A near-midnight edge.** FROZEN_TIME is computed at module load and the re-anchor runs in beforeAll. A run that starts in the last seconds before 00:00Z can see two different dates.
5. **Fonts.** In a tickmarkr worktree, Vite refuses the `@fontsource` woff2 files. The baseline and every capture here share that fallback font, so a main-checkout run that serves Inter can pixel-diff.
6. **VISUAL-DEBT-01.** The other six widget baselines were not run, and `vip-visits` stays FIXTURE_BLOCKED. Their zone and weekday are unchanged.
7. **`graphify update .` was not run.** It writes `graphify-out/`, which is outside the file scope.

## Staging side effects

The only writes were dates. The drill's and oracle 2's beforeAll re-dated the eight rows to today-relative values, and oracle 1 reads `3 5 3 5` afterwards.
