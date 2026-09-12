---
phase: 102-staging-data-debt-tail
plan: 15
status: complete
outcome: ok
attempt: 7
requirements: [CARRY-06]
decisions: [D-20, D-03, D-02]
base: 0111fa891 # overseer merge of plan commit 528aebc80 (c2 grades the base..HEAD diff)
commits: # reachable from HEAD on this branch (the attempt-4 SUMMARY cited pre-replay hashes 338f4a0d6..c9e16430f, none reachable now)
  - 12f5e52d3 feat(seed): re-anchor week-ahead dashboard rows to today (P102-15)
  - 4f340c58b test(e2e): run-time frozen clock and two-clock week-ahead check (P102-15)
  - 0b05ac8b8 test(e2e): server-clock re-anchor and same-date two-clock week-ahead check (P102-15)
  - 732bee38d test(e2e): derive token expiry from the page clock in dashboard visuals (P102-15)
  - 8b4419a8c test(e2e): pin the week-ahead browser zone so rows keep their group at every server hour (P102-15)
  - 09d101238 test(e2e): re-baseline week-ahead for the pinned-zone render (P102-15) # the week-ahead.png the diff carries
baseline_in_diff: "frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png, one modified PNG in base..HEAD (Bin 21626 -> 52947 bytes), blob sha1 063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0, 638x1034, last written by 09d101238"
update_snapshots_command: "node ../scripts/pw-run-reaped.mjs -- e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots" # run from frontend/ at 2026-09-12T00:22:07Z, .env.test sourced, clock today 12:00Z = 2026-09-12T12:00Z
pixel_diff: none # both captures match the PNG in the diff (oracle 2, 2026-09-12T00:51Z)
---

# 102-15 SUMMARY: CARRY-06 frozen clock vs server NOW()

## Verdict: ok

All three acceptance items hold at HEAD `bea6ae118`. The oracles below ran after the work, extracted byte-for-byte from the plan front-matter.

| Oracle | Result after the work (2026-09-12T00:51Z) |
| --- | --- |
| 1. Window control (command) | **PASS**: `3 5 3 5`, exit 0 |
| 2. Two-clock visual (command, reaped wrapper) | **PASS**: `passed=2 failed=0 skipped=0`, exit 0 |
| 3. Judge (diff) | Every clause cites a line in the diff; see "Judge item" below. The base..HEAD diff carries exactly one regenerated `week-ahead.png`. |

## What this attempt did

Attempt 5 went green on both oracles. The judge then failed c2 on "EXACTLY ONCE", anchored on the old `regeneration_count: 2` line here. The overseer amended c2 in `528aebc80`: the criterion now grades the base..HEAD diff (exactly ONE regenerated `week-ahead.png`), and how many times attempts regenerated it along the way is not a criterion. The engine replayed the prior commits onto `0111fa891`.

This attempt changed no code, seed, or PNG. The diff already met the amended clause. Regenerating again would have added nothing and was barred unless the captures stopped matching, which they did not. This attempt:

- re-ran both oracles against the replayed tree;
- confirmed the diff holds one PNG;
- rewrote this SUMMARY so every hash it cites is reachable from HEAD.

The full plan history is recorded for audit. It has two regeneration commits: `5b046a537` (att1, hour-dependent render) and `09d101238` (att4, the pinned-zone render the diff keeps). It also has two restore commits: `c32c7ba84` and `3f79290ae`.

## The mechanism (unchanged since attempt 4)

- **Seed** (`supabase/seed/072-p102-today-relative-dashboard-fixtures.sql`, `12f5e52d3`): eight date-only UPDATEs with the 060 offsets. Engagements (060 :205-216) are `date_trunc('hour', NOW())` +2h/+4h; `date_trunc('day', NOW())` +1 day 10h/12h; +2 days 14h to +4 days 16h. Calendar entries (060 :251-262) are `CURRENT_DATE` +0/+1/+2/+3/+5. The file has no INSERT and writes no text column. The `IS DISTINCT FROM` guards make a re-apply within the same hour write nothing.
- **Spec** (`frontend/tests/e2e/dashboard-widgets-visual.spec.ts`):
  - `FROZEN_TIME = new Date(new Date().setUTCHours(12, 0, 0, 0))` (:12).
  - A `test.beforeAll` (:65-121) builds a service-role `createClient` from `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (dotenv loads `.env.test` in `playwright.config.ts:28`) and throws if either is missing. It takes NOW() from the Supabase `Date` header. It applies the same eight updates and throws unless each one hits exactly one row.
  - The token route in `openDashboard` (:131-136) drops `expires_at`, so auth-js derives token expiry from the installed page clock.
  - The two week-ahead tests run at `WEEK_AHEAD_TIMEZONE = 'Etc/GMT+2'` (:24). Engagement 001 then stays under TODAY at every server hour.
  - The `FIXTURE_BLOCKED` comment (:181-186) explains the new mechanism. The map (:187-192) holds only `vip-visits`.
  - `visual week-ahead` (:197) no longer skips and masks only `[widget.locator('.week-date')]` (:211).
  - `dashboard snapshots survive a date change` (:229-250) installs the clock at today 12:00Z, then today 18:00Z, one page each. Before each capture it asserts that the three `.week-title` rows are visible: `Bilateral consultation — ESCWA`, `Prep session — G20 Data Gaps Initiative` and `Delegation visit — Indonesia BPS`. It then runs `toHaveScreenshot('week-ahead.png', { mask })` with `mask = [widget.locator('.week-date')]`.

The offline replay from attempt 4 is carried forward. It copied `groupEventsByDay`, used date-fns 4.3.0, and covered server hours 0–23 × both clocks × 7 days. It counts distinct layouts per weekday; the +03 row is the control:

```
Etc/GMT+2   Sun 1  Mon 1  Tue 1  Wed 1  Thu 1  Fri 1  Sat 1
Asia/Riyadh Sun 2  Mon 2  Tue 2  Wed 2  Thu 2  Fri 2  Sat 2
```

## The regeneration (the one PNG in the diff)

The command was run verbatim from `frontend/` with `.env.test` sourced, under clock today 12:00Z = 2026-09-12T12:00Z. It wrote the blob that `09d101238` carries:

```
node ../scripts/pw-run-reaped.mjs -- e2e/dashboard-widgets-visual.spec.ts --project=chromium-dashboard-widgets -g 'visual week-ahead' --update-snapshots

before: dd30a75747cbdf6a921da373b7a6821c519b6f80
pre lsof exit=1 (port free) PW_REUSE=unset
regen start 2026-09-12T00:22:07Z
regen rc=0 end 2026-09-12T00:22:32Z
pw-run-reaped: playwright exited code=0 signal=null; ... session already-empty; verdict clean; report published
after: 063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0
  pixelWidth: 638
  pixelHeight: 1034
post lsof exit=1
```

**What the image shows.**

- The header `Week ahead`.
- TODAY: Bilateral consultation — ESCWA, then Standup — Indonesia delegation.
- TOMORROW: Prep session — G20 Data Gaps Initiative, then Brief minister — Vision 2030.
- NEXT WEEK: Delegation visit — Indonesia BPS, Submit OECD data response, Training — new dossier workflow, then an eighth row clipped at the 1000 px viewport.
- Only `.week-date` is masked.

## Commands this attempt ran, verbatim, in order

**1. State.**

```
$ date -u
Sat Sep 12 00:49:43 UTC 2026
$ git status
nothing to commit, working tree clean
$ git merge-base --is-ancestor <hash> HEAD   # for each hash the attempt-4 SUMMARY cited
338f4a0d6 NOT-reachable
549a6cb6c NOT-reachable
c3544bf9b NOT-reachable
6d9009620 NOT-reachable
16d97157f NOT-reachable
c9e16430f NOT-reachable
```

**2. Port, wrapper, and regex census.** The port was free (`lsof -nP -iTCP:5173 -sTCP:LISTEN` gave exit=1), and `scripts/pw-run-reaped.mjs` is present. The seed text was checked against the 102-06 class regex: `\yE2E\y|\yUAT\y|Phase [0-9]+|staging verification`, plus case-insensitive `\yfixture\y` and `\ye2e-`. It has no match. The word "fixtures" appears only in the mandated file name.

**3. The PNG in the diff.**

```
$ git show HEAD:frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png | shasum
063e5afaa40f9c5e87c700cd4412fc1ee5fcd3f0
$ ... | file -
/dev/stdin: PNG image data, 638 x 1034, 8-bit/color RGB, non-interlaced
$ git diff --name-status 0111fa891..HEAD
A	.planning/phases/102-staging-data-debt-tail/102-15-SUMMARY.md
M	frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
M	frontend/tests/e2e/dashboard-widgets-visual.spec.ts
A	supabase/seed/072-p102-today-relative-dashboard-fixtures.sql
$ git log --format='%h %s' 0111fa891..HEAD -- <png>
09d101238 test(e2e): re-baseline week-ahead for the pinned-zone render (P102-15)
3f79290ae test(e2e): restore the once-regenerated week-ahead baseline (P102-15)
c32c7ba84 test(e2e): restore the committed week-ahead baseline (P102-15)
5b046a537 test(e2e): regenerate week-ahead baseline once for re-anchored rows (P102-15)
```

**4. Oracle extraction and runs** (from the worktree root; oracle 2 first, because its beforeAll re-anchors the rows oracle 1 reads):

```
extracted 2 oracles: 1611 / 3669 bytes
HEAD bea6ae118
pre lsof exit=1
oracle2 start 2026-09-12T00:51:41Z
P102-15-VISUAL wrapper_rc=0 passed=2 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (week-ahead matches its committed baseline under today 12:00Z AND today 18:00Z with date labels masked, both from a seed the spec re-anchors in beforeAll)
PASS visual-invariant
exit=0 end 2026-09-12T00:51:58Z
post lsof exit=1
oracle1 at 2026-09-12T00:51:58Z
P102-15-WINDOW engagements_in_window=3 calendar_in_window=5 engagements_present=3 calendar_present=5 expected 3 5 3 5 (window = [CURRENT_DATE, CURRENT_DATE+14])
PASS window
exit=0
```

**5. The oracle-2 report** (`frontend/test-results/pw-reaped-e5e5de03e4f78f760ee98af584d4ec66.json`):

```
stats {'startTime': '2026-09-12T00:51:41.907Z', 'duration': 16148.303000000002, 'expected': 2, 'skipped': 0, 'unexpected': 0, 'flaky': 0}
errors []
--- passed | visual week-ahead | line 197 | 3991 ms
--- passed | dashboard snapshots survive a date change | line 229 | 6094 ms
```

After the run, `git status --porcelain` was empty, and the PNG on disk is byte-identical to the HEAD blob (`cmp` exit 0). The passing run wrote no snapshot.

**The zeros and their controls.**

- `unexpected=0` and `skipped=0` sit beside `expected=2` in the same report.
- `skipped=0` proves the FIXTURE_BLOCKED guard no longer fires for week-ahead. `vip-visits` still carries the guard, and `-g` does not select it.
- `lsof exit=1` means the port was free both before and after the run. The wrapper would have exited 3 on a stray listener.
- Oracle 1's `3 5` sits beside its population control `3 5`.

## Judge item: where each clause lives

- **Seed UPDATEs for the eight ids at the 060 offsets, with no INSERT and no class-regex text:** `072-p102-today-relative-dashboard-fixtures.sql` :18-42.
- **FROZEN_TIME from `new Date()` truncated to 12:00Z:** spec :12.
- **Service-role beforeAll that fails loudly without the key:** spec :65-73 (throw) and :74-120 (the eight updates, one row each).
- **FIXTURE_BLOCKED:** week-ahead is removed, and the comment explains the new mechanism (spec :181-192).
- **`dashboard snapshots survive a date change`:** spec :229. It installs the clock twice at today 12:00Z and 18:00Z (:231-233), asserts the three `.week-title` rows (:237-245), and captures with `mask = [widget.locator('.week-date')]` (:246-247).
- **Exactly one regenerated `week-ahead.png` in base..HEAD:** see step 3 above.
- **The `--update-snapshots` command verbatim:** in the front-matter and in "The regeneration".
- **Pixel diff:** none. Both captures match.

## Limits, left for the operator and later tasks

1. **The weekday dimension is not closed. This is derived from the replay, not measured.** `isThisWeek` uses date-fns' default Sunday week start, so the pinned zone gives four layouts across the week:
   - Sun and Mon: `this_week` ×4.
   - Tue and Wed: `this_week` ×3 and `next_week` ×1.
   - Thu: 2 and 2.
   - Fri and Sat: `next_week` ×4, which is what the baseline holds.

   This run was on a Saturday. On Sun–Thu, the unmasked group headers differ from the baseline. The judge item assigns day-shift invariance to the re-anchor mechanism and forbids a mask broader than `.week-date`. Closing this needs a plan amendment (mask the group headers, or pin the browser weekday). The review deferred it.
2. **Frozen clock ahead of the wall clock.** Before 12:00Z (or 18:00Z for the second clock), the page clock runs ahead of real time. The `expires_at` drop covers supabase-js's expiry check. GoTrue still validates the JWT against real time.
3. **A near-midnight edge.** FROZEN_TIME is computed at module load, and the re-anchor runs in beforeAll. A run that starts in the last seconds before 00:00Z can see two different dates.
4. **Fonts.** In a tickmarkr worktree, Vite refuses the `@fontsource` woff2 files. The baseline and every capture here share that fallback font. A main-checkout run that serves Inter can pixel-diff.
5. **VISUAL-DEBT-01.** The other six widget baselines were not run, and `vip-visits` stays FIXTURE_BLOCKED. Their zone is unchanged.
6. **`graphify update .` was not run.** It writes `graphify-out/`, which is outside the file scope.

## Staging side effects

The only writes were dates. Oracle 2's beforeAll re-dated the eight rows to today-relative values, and oracle 1 reads `3 5 3 5` afterwards.
