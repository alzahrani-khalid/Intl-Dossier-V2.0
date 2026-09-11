---
status: complete
phase: 102-staging-data-debt-tail
plan: 5
requirements: [P52FIXTURE-01, ENGREAD-01]
attempt: 2
commits:
  - 4b9690d07 feat(seed): add P102 engagement extension rows and P52 rename (attempt 1 a152946e3, replayed patch-identical)
  - 3b409d91a test(e2e): add /engagements render probe for ENGREAD-01 (attempt 1 c072e84c6, replayed patch-identical)
engread_01_verdict: NOT-REPRODUCED-AT-RENDER
oracle_p52: PASS (exit 0)
oracle_render: PASS (exit 0) on attempt 2, against the plan as repaired by 57b9b920d. Attempt 1 exited 1 on the same passing report because of the unanchored stats parse (§9). See §12.
---

# 102-05 SUMMARY: engagement extension rows, the P52 rename, and the /engagements render probe

## Outcome, stated first

| Item | State | Evidence |
| --- | --- | --- |
| `engagement_dossiers` holds 5 rows = 5 engagement dossiers | **DONE** | P52 oracle `5 5 2 1`, PASS (§8.1) |
| Both named ids carry `bilateral_meeting`/`diplomatic` inside 2026, end > start | **DONE** | same oracle `seeded_pair=2` |
| P52 `name_en`/`name_ar` equal the plan's copy verbatim | **DONE** | same oracle `renamed=1` |
| Seed applied twice, idempotent | **DONE** | apply 1 `INSERT 0 2 / UPDATE 1`, apply 2 `INSERT 0 0 / UPDATE 0` (§3) |
| API positive control run BEFORE the spec | **DONE** | both paths `HTTP=200`, 5 rows, `total=5`, on both attempts (§4, §12.3) |
| Render spec authored, run through `scripts/pw-run-reaped.mjs` | **DONE** | report `expected=2 unexpected=0 skipped=0 flaky=0`, both titles `passed`, on 3 runs (§5, §8.2, §12.5) |
| Render **command oracle** exits 0 | **YES, exit 0 on attempt 2** (§12.5), against the plan as repaired by `57b9b920d` | `passed=2 failed=0 skipped=0`, `PASS render`. Attempt 1 exited 1 on a passing report: `passed=2⏎0`, because the unanchored `expected=` grep also matched inside `unexpected=0` (§9) |
| ENGREAD-01 verdict | **NOT-REPRODUCED-AT-RENDER** (never "fixed") | §10 |

## 1. Populations re-derived

**Engagement dossiers on staging (read-only, before any write):**

```
$ psql "$SUPABASE_DB_URL" -Atq -c "select d.id, d.name_en, d.name_ar, d.status, (e.id is not null) as has_ext, e.engagement_type, e.engagement_category, e.start_date, e.end_date from dossiers d left join engagement_dossiers e on e.id=d.id where d.type='engagement' order by d.id" -c "select (select count(*) from dossiers where type='engagement')||' '||(select count(*) from engagement_dossiers)"
00000000-0000-0052-0000-000000000001|Phase 52 Kanban Fixture Engagement|مشاركة الإطار التجريبي للمرحلة 52|active|f||||
7c0d830b-5dc7-4419-a0ad-ce550031712d|Bilateral engagement with ONS — census methodology exchange|ارتباط ثنائي مع المكتب الوطني للإحصاء — تبادل منهجية التعداد|active|f||||
b0000002-0000-0000-0000-000000000001|Bilateral consultation — ESCWA|مشاورات ثنائية — الإسكوا|active|t|consultation|diplomatic|2026-07-03 21:00:00+00|2026-07-03 23:00:00+00
b0000002-0000-0000-0000-000000000002|Prep session — G20 Data Gaps Initiative|جلسة تحضيرية — مبادرة فجوات البيانات|active|t|working_group|statistical|2026-07-04 10:00:00+00|2026-07-04 12:00:00+00
b0000002-0000-0000-0000-000000000003|Delegation visit — Indonesia BPS|زيارة وفد — هيئة الإحصاء الإندونيسية|active|t|official_visit|diplomatic|2026-07-05 14:00:00+00|2026-07-07 16:00:00+00
5 3
```

This matches research §4 exactly. The extension-less pair is the same two ids the plan names.

**Triggers and required columns on the write targets.** Checked before writing, to find out whether the seed could fire anything unexpected:

```
dossiers|check_extension_exists|CREATE CONSTRAINT TRIGGER check_extension_exists AFTER INSERT ON public.dossiers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_dossier_has_extension()
dossiers|trg_dossiers_embedding_update|CREATE TRIGGER trg_dossiers_embedding_update AFTER INSERT OR UPDATE OF name_en, name_ar, description_en, description_ar ON public.dossiers FOR EACH ROW EXECUTE FUNCTION trg_queue_dossier_embedding_update()
dossiers|trg_dossiers_refresh_mv|CREATE TRIGGER trg_dossiers_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.dossiers FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
dossiers|trg_queue_dossier_embedding|CREATE TRIGGER trg_queue_dossier_embedding AFTER INSERT OR UPDATE ON public.dossiers FOR EACH ROW EXECUTE FUNCTION queue_dossier_embedding_update()
dossiers|update_dossiers_updated_at|CREATE TRIGGER update_dossiers_updated_at BEFORE UPDATE ON public.dossiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
engagement_dossiers|trigger_update_engagement_dossiers_updated_at|CREATE TRIGGER trigger_update_engagement_dossiers_updated_at BEFORE UPDATE ON public.engagement_dossiers FOR EACH ROW EXECUTE FUNCTION update_engagement_dossiers_updated_at()
id|NO|
engagement_type|NO|
engagement_category|NO|
start_date|NO|
end_date|NO|
```

The seed only UPDATEs `dossiers`, so `check_extension_exists` (INSERT-only) cannot fire. The rename does queue one name-embedding refresh. The seed's `IS DISTINCT FROM` guards make a re-apply write nothing, so it cannot re-queue.

**P52 pins: none asserts the NAME.** The plan's read_first asked for this check:

```
$ git grep -n -I -e "Kanban Fixture Engagement" -e "مشاركة الإطار التجريبي" -- ':!.planning'
old_name_hits_exit=1 (1 = none)
$ git grep -l -F "0000-0052-0000-000000000001" -- ':!.planning' | wc -l
8
```

The zero sits beside a positive control. The same instrument finds the pinned **id** in 8 files: the 5 specs, `.env.test.example`, `.github/workflows/e2e.yml`, and this plan's seed. Every pin is on the id, and the id is unchanged.

**102-06's class sweep scope.** It reads DB text columns ("the class sweep over all 1,929 text/varchar columns of public base tables"). It does not read seed files, so the seed's SQL comments sit outside its population. The seeded DATA values are the two names, the enums and the dates. None contains `E2E`, `UAT`, `Phase <n>`, `staging verification` or `fixture`.

## 2. The P52 oracle at HEAD (RED, before any write)

**Under zsh (this worker's shell), recorded because it is WRONG for the right-looking reason:**

```
P102-05-P52 engagement_dossiers_typed=5 3 0 0 extension_rows= seeded_pair= renamed= expected 5 5 2 1
FAIL: dossiers type=engagement (5 3 0 0) and engagement_dossiers () disagree - an engagement dossier still has no extension row
```

zsh does not word-split `set -- $PSQL_OUT`, so `$1` received all four numbers. This run is red for the wrong reason. Under zsh the oracle would also red at the green end state (`$1 = "5 5 2 1"` is not `5`). The engine runs gates via `bash -lc` (`.tickmarkr/config.yaml`, "`sh()` spawns `bash -lc`"), so the faithful reading is the bash one:

**Under bash (the engine's shell):**

```
P102-05-P52 engagement_dossiers_typed=5 extension_rows=3 seeded_pair=0 renamed=0 expected 5 5 2 1
FAIL: dossiers type=engagement (5) and engagement_dossiers (3) disagree - an engagement dossier still has no extension row
exit=1
```

RED at HEAD `5 3 0 0`, exactly as the plan predicted.

## 3. Seed: `supabase/seed/071-p102-engagement-extension-rows.sql`, applied twice

The file contains one transaction:
- an upsert of the two `engagement_dossiers` rows (`ON CONFLICT (id) DO UPDATE ... WHERE ... IS DISTINCT FROM`);
- the P52 rename (`UPDATE dossiers ... AND (name_en, name_ar) IS DISTINCT FROM (...)`).

Every other extension column takes its default. The P52 `description_en/_ar` are left for 102-06, as the plan says.

```
$ psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/071-p102-engagement-extension-rows.sql
== apply 1 ==
BEGIN
INSERT 0 2
UPDATE 1
COMMIT
exit=0
```

```
== apply 2 ==
BEGIN
INSERT 0 0
UPDATE 0
COMMIT
exit=0
```

Apply 2 writes zero rows, beside apply 1 writing 2 + 1. The re-apply is a true no-op, not a silent failure.

**Row readback after both applies:**

```
00000000-0000-0052-0000-000000000001|Bilateral consultation — statistical cooperation framework|مشاورات ثنائية — إطار التعاون الإحصائي|bilateral_meeting|diplomatic|2026-03-10 06:00:00+00|2026-03-10 09:00:00+00|planned|intake|Asia/Riyadh
7c0d830b-5dc7-4419-a0ad-ce550031712d|Bilateral engagement with ONS — census methodology exchange|ارتباط ثنائي مع المكتب الوطني للإحصاء — تبادل منهجية التعداد|bilateral_meeting|diplomatic|2026-05-19 07:00:00+00|2026-05-19 12:00:00+00|planned|intake|Asia/Riyadh
```

`09:00+03` is `06:00Z` and `12:00+03` is `09:00Z`, so the literals landed as written. The defaults applied: `planned` / `intake` / `Asia/Riyadh`.

**P52 oracle immediately after apply 2 (bash):**

```
P102-05-P52 engagement_dossiers_typed=5 extension_rows=5 seeded_pair=2 renamed=1 expected 5 5 2 1
PASS p52
exit=0
```

## 4. API positive control, run BEFORE the spec (test-user JWT, research §5.2)

The token was minted by GoTrue password grant with the `TEST_USER` pair. Only its length is printed.

```
TOKEN_LEN=922 (value withheld)
HTTP=200
ENG_BODY_ROWS=5 {"page": 1, "limit": 20, "total": 5, "totalPages": 1, "has_more": false}
   b0000002-0000-0000-0000-000000000003 | Delegation visit — Indonesia BPS
   b0000002-0000-0000-0000-000000000002 | Prep session — G20 Data Gaps Initiative
   b0000002-0000-0000-0000-000000000001 | Bilateral consultation — ESCWA
   7c0d830b-5dc7-4419-a0ad-ce550031712d | Bilateral engagement with ONS — census methodology exchange
   00000000-0000-0052-0000-000000000001 | Bilateral consultation — statistical cooperation framework
HTTP=200
RPC_BODY_ROWS=5
   b0000002-0000-0000-0000-000000000003 | official_visit | Delegation visit — Indonesia BPS
   b0000002-0000-0000-0000-000000000002 | working_group | Prep session — G20 Data Gaps Initiative
   b0000002-0000-0000-0000-000000000001 | consultation | Bilateral consultation — ESCWA
   7c0d830b-5dc7-4419-a0ad-ce550031712d | bilateral_meeting | Bilateral engagement with ONS — census methodology exchange
   00000000-0000-0052-0000-000000000001 | bilateral_meeting | Bilateral consultation — statistical cooperation framework
HTTP/2 200
content-range: 0-4/5
```

The edge function (`engagement-dossiers?page=1&limit=20`) returned 200 with `total=5`. `search_engagements_advanced` returned 200 with 5 rows, and its exact head-count is `0-4/5`. The renamed P52 title is already served by both paths.

## 5. The render spec: `frontend/tests/e2e/102-engagements-render.spec.ts`

- **Titles:** `renders 5 engagement rows on a settled en surface` and `renders 5 engagement rows on a settled ar surface`. They are literal strings, not a template.
- **Login:** `loginForListPages(page, lng)` with the `TEST_USER` pair. `test.use({ storageState: { cookies: [], origins: [] } })` empties the global session, so the sign-in is the spec's own and not global-setup's.
- **Settle** (the discipline of `tests/e2e/98-copy04-voice.spec.ts:248`): main visible, then best-effort `networkidle`, then the first of rows or error chrome, then a fixed 3 s dwell, all before any read. No 95/96 helper is imported.
  - Every wait is non-throwing on purpose. A surface that never shows `main` must fail at the row assertion with the visible text attached. A settle timeout would name a locator, not the cause.
- **Locale:** stated on the navigation (`/engagements?lng=<lng>`) and asserted: `document.documentElement.lang === lng`.
- **Error chrome:** `[data-testid="query-error-state"]`, `[data-testid="query-error-inline"]` (`QueryErrorState`), or the text of `common:errors.queryFailed.title` in the locale (`Unable to load data` / `تعذر تحميل البيانات`). That title is the one ENGREAD-01 recorded, and it also covers the router's `defaultErrorComponent`.
  - Its text is captured with `expect.soft` first, so it leads the report's error message. It is also printed via `console.error`.
- **Rows:** exactly 5 `[data-testid="engagement-row"]`. On mismatch, the failure message carries the squashed body text.
- eslint `--max-warnings 0`: `eslint_exit=0`. prettier `--check`: `All matched files use Prettier code style!`

**Pre-run census (no other suite, port free):**

```
== :5173 listeners ==
== playwright procs ==
PW_REUSE=unset E2E_BASE_URL=unset
```

This zero has no separate control. The wrapper's own pre-spawn port census is the authority, and it returned a clean verdict (`wrapper_rc=0`) on both runs below.

**Render oracle, first run (2026-09-11T18:44:58Z to 18:45:19Z, spec uncommitted, same bytes as `c072e84c6`):**

```
P102-05-RENDER wrapper_rc=0 passed=2
0 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (the en and ar renders of /engagements each show exactly 5 engagement rows on a settled surface with the locale asserted)
FAIL: the render probe did not pass in both locales - the PW lines above name the cause (an error-chrome render, a locale not asserted, or a row count other than 5)
exit=1
```

Its published report (`pw-reaped-1c67c271bdc0de47d7ebc98796b2d3f0.json`):

```
stats {"startTime": "2026-09-11T18:44:59.787Z", "duration": 19212.279000000002, "expected": 2, "skipped": 0, "unexpected": 0, "flaky": 0}
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled en surface | project chromium | passed | 8153ms
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled ar surface | project chromium | passed | 9163ms
```

The next Playwright run cleared `test-results/`, as it does at the start of every run, so this report file no longer exists. The lines above are its transcription.

## 6. Negative-polarity drill: the green could have been red

A zero from the error-chrome locator and a 5 from the row count are only evidence if the same instrument can report otherwise. The drill ran **the committed spec's bytes** under a temporary file, `frontend/tests/e2e/zz-p102-05-drill.spec.ts`, with a stimulus appended after them. `drill_prefix_identical=yes` confirms the prefix is identical. The stimulus:
- aborts `**/functions/v1/engagement-dossiers**`, which drives rows to 0;
- plants a `[data-testid="query-error-state"]` "Unable to load data" node 1.5 s after the `/engagements` load. That is post-navigation, so a pre-settle capture could not see it.

The drill file was deleted in the same command (`drill_file_present=no`). Its report was moved to the worker scratchpad (`drill-report.json`), not left in the worktree.

```
drill_prefix_identical=yes
2026-09-11T18:47:30Z
drill_wrapper_rc=1
2026-09-11T18:47:46Z
report=pw-reaped-c4aec376261223817825576071a3b96b.json
stats {"startTime": "2026-09-11T18:47:31.228Z", "duration": 14731.939999999999, "expected": 0, "skipped": 0, "unexpected": 2, "flaky": 0}
 TEST renders 5 engagement rows on a settled en surface | failed | 7973ms
   error.message[:200]: Error: ERROR-CHROME en: Unable to load data  [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m  Expected: [32m""[39m Received: [31m"Unabl
   ERR Error: ERROR-CHROME en: Unable to load data  [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m  Expected: [32m""[39m Received: [31m"Unable to load data"[39m    66 |   const errorText = squash((awa
   ERR Error: ROWS en: 0 of 5; body reads: IntelDossier GASTAT · International Partnerships KA Khalid Alzahrani Head of International Partnerships OPERATIONS Situation Engagements After-Actions My Desk Calendar Briefs Activity DOSSIERS Countries Organizations People 
 TEST renders 5 engagement rows on a settled ar surface | failed | 8580ms
   error.message[:200]: Error: ERROR-CHROME ar: Unable to load data  [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m  Expected: [32m""[39m Received: [31m"Unable to load data"[39m    66 |   const errorText = squash((awa
   ERR Error: ROWS ar: 0 of 5; body reads: دوسييه الهيئة العامة للإحصاء · الشراكات الدولية KA Khalid Alzahrani رئيس الشراكات الدولية العمليات الموقف المشاركات ملاحظات ما بعد الإجراء مكتبي التقويم الملخصات النشاط الدوسيهات الدول المنظمات الأشخاص المسؤولون المنتخبون ال
drill_file_present=no
?? frontend/tests/e2e/102-engagements-render.spec.ts
```

The spec reds in both locales. Each failure message **leads with the captured error-chrome text** and carries the row count plus the visible body. So:
- the real run's `unexpected=0` sits beside this `unexpected=2`;
- its empty error-chrome capture sits beside `"Unable to load data"`;
- its `5 of 5` sits beside `0 of 5`.

The oracle's `[:200]` slice of `error.message` reaches the cause text (`ERROR-CHROME en: Unable to load data`), which is the "names the cause" branch the criterion requires. The `lang` soft assertion did not fire in the drill, so the locale leg still read `en`/`ar` correctly under failure.

## 7. Oracle-defect evidence (render oracle)

**The parse defect, measured with the grep the oracle resolves and with the system grep:**

```
$ L="expected=2 unexpected=0 skipped=0 flaky=0"; printf "%s\n" "$L" | head -1 | grep -oE "expected=[0-9]+" | cut -d= -f2
/usr/bin/grep -> 2,0,
/usr/bin/grep -> 2,0,
anchored fix candidate:
2
```

The second line is the oracle's PATH, `/opt/homebrew/bin:$HOME/bin:$PATH`, which resolves to `/usr/bin/grep` too. `grep -o` emits every match on the line, and `unexpected=0` contains `expected=0`. So `PWPASS` becomes `2⏎0` and `[ "$PWPASS" = "2" ]` is false. This holds for any grep that implements `-o`; it is not a ugrep quirk.

**Which plans carry the same parse:**

```
$ git grep -l -F 'grep -oE "expected=[0-9]+"' -- .planning
  .planning/phases/102-staging-data-debt-tail/102-05-PLAN.md
  .planning/phases/102-staging-data-debt-tail/102-07-PLAN.md
  .planning/phases/102-staging-data-debt-tail/102-15-PLAN.md
count=3
```

## 8. Command oracles, run AFTER the work (HEAD `c072e84c6`, both run under `bash`)

This is the attempt-1 record, against the pre-repair plan. The authoritative after-work run is §12 (attempt 2, repaired oracle).

### 8.1 P52 catalog oracle

```
HEAD=c072e84c6 at 2026-09-11T18:49:03Z
P102-05-P52 engagement_dossiers_typed=5 extension_rows=5 seeded_pair=2 renamed=1 expected 5 5 2 1
PASS p52
exit=0
```

### 8.2 Render oracle

```
HEAD=c072e84c6 start=2026-09-11T18:49:08Z
P102-05-RENDER wrapper_rc=0 passed=2
0 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (the en and ar renders of /engagements each show exactly 5 engagement rows on a settled surface with the locale asserted)
FAIL: the render probe did not pass in both locales - the PW lines above name the cause (an error-chrome render, a locale not asserted, or a row count other than 5)
exit=1
end=2026-09-11T18:49:23Z
report=frontend/test-results/pw-reaped-3cbc21857abf8d79fc5197aade133b98.json
stats {"startTime": "2026-09-11T18:49:09.060Z", "duration": 14616.899, "expected": 2, "skipped": 0, "unexpected": 0, "flaky": 0}
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled en surface | project chromium | passed | 8042ms
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled ar surface | project chromium | passed | 8797ms
```

The criterion reads "its published report shows expected=2 unexpected=0 skipped=0". The report does show that, on two independent runs, with the wrapper clean (`wrapper_rc=0`) both times. The command oracle still exits 1, and no spec can change that (§9).

## 9. The render oracle could not pass at attempt 1 (REPAIRED by `57b9b920d`)

**Status: repaired.** The overseer anchored the plan's `expected=` grep to `(^| )expected=[0-9]+` (`57b9b920d`) and merged it into the run branch (`8dcc83b00`). `unexpected=` and `skipped=` stay unanchored. That is sound, because neither name occurs inside another field (§12.1 drills the parse both ways). Attempt 2 ran the repaired oracle and it exited 0 (§12.5). The rest of this section is the attempt-1 record as written.

This oracle is **unsatisfiable by construction** (§7). Its green state (`expected=2 unexpected=0`) parses as `PWPASS=2⏎0`, so it exits 1 on the very report it demands. This worker did not edit it:
- the plan is outside this task's file scope;
- the graded party must not shape its grader. The plan says the same: "change the plan, not the oracle", and the oracle is the plan's to change.

**Proposed repair,** for the operator to rule on. Anchor the three greps in the `PWRUN` helper to a field boundary:
- `grep -oE "(^| )expected=[0-9]+"`, which yields `2` on the same line (§7);
- likewise `(^| )unexpected=` and `(^| )skipped=`.

The same line is in **102-07** and **102-15**, so those two oracles cannot pass either and need the same repair before their tasks can go green.

Secondary, not a defect in the engine's shell: the P52 oracle's `set -- $PSQL_OUT` depends on bash word splitting. Under zsh it reds even at the green state (§2). The engine runs `bash -lc`, so this only bites a hand-run from a zsh prompt.

## 10. ENGREAD-01 verdict

**NOT-REPRODUCED-AT-RENDER.**

On 2026-09-11 against staging `zkrcjzdemdmwhearhfgg`, `/engagements` rendered on a settled surface as follows:
- **en:** 5 engagement rows, `html[lang]="en"`, no error chrome.
- **ar:** 5 engagement rows, `html[lang]="ar"`, no error chrome.

That held on two separate runs. It agrees with the API positive control (both read paths 200 with 5 rows).

The row is **not "fixed"**: no code was repaired and none was planned (D-19). The recorded "Unable to load data" does not appear today.

**Bounds, stated:**
1. The render was observed **after** the seed (5 = 5). The pre-seed render (5 dossiers vs 3 extension rows) was not observed in a browser, because the plan orders the seed first. Research §5.2 found the API already returning 5 rows before the seed, since the RPC has been dossier-first since `p96_extension_first_rpcs`. So the seed is not a plausible cause of the difference from the 2026-08-17 observation, but that is inference, not a render observation.
2. **Admin role only** (the `TEST_USER` pair), local dev server against staging, 1400×900, the default unfiltered stream. The type-bucket path (`?type=meeting` etc., which reads the RPC directly) was not rendered.
3. The original error's cause is **unknown**. It stays unnamed rather than guessed.

## 11. Left for named later tasks

- **Operator (done):** the `PWRUN` stats-parse repair landed in `57b9b920d`. The anchored grep is present in 102-05, 102-07 and 102-15, and the unanchored form in none of them (§12.1).
- **102-06:** the P52 dossier's `description_en`/`description_ar` (`Test fixture engagement for Phase 52 ...`) are untouched here by plan. 102-06's sweep rewrites them. The P52 NAME no longer matches its class regex.
- **102-13:** the ONS engagement `7c0d830b` now has its `engagement_dossiers` row, so the `after_action_records` 905b6a3a parent path is unblocked for the PDF probe.
- **102-15:** re-anchors the three `b0000002` engagements' dates. That is outside this plan's population; this plan did not touch them.

## 12. Attempt 2: re-dispatch after the oracle repair (2026-09-11, run 0083)

Attempt 1's only failed gate was the render command oracle, which exited 1 on a passing report (§8.2, §9). The overseer repaired the plan (`57b9b920d`) and merged it into the run branch (`8dcc83b00`). This attempt's work commits are attempt 1's, replayed onto that base with no change:

```
$ git range-diff 8dcc83b00~1..2373247c0 8dcc83b00..HEAD
1:  a152946e3 = 1:  4b9690d07 feat(seed): add P102 engagement extension rows and P52 rename
2:  c072e84c6 = 2:  3b409d91a test(e2e): add /engagements render probe for ENGREAD-01
3:  2373247c0 = 3:  0eec30b9c docs(phase-102): record 102-05 seed, render probe and ENGREAD-01 verdict
```

`=` means patch-identical. Attempt 2 did not edit the seed or the spec, so the §6 negative-polarity drill still applies to the spec's bytes. This SUMMARY is the only file attempt 2 changes. Execution order below is the order the commands ran.

### 12.1 Where the oracles were read from, and the repair checked

Both oracle commands were extracted from the plan's front-matter with `js-yaml`, not copied by hand, into the worker scratchpad. Each was then run with `bash -lc`, the engine's shell. Pin:

```
commands 2
HEAD=0eec30b9c plan_blob=6eb4f7bbb plan_last_commit=57b9b920d
syntax_ok
```

The repair is present. Checked with a fixed-string grep:

```
anchored(-F): 1
unanchored-old(-F, control): 0
control on plan@2373247c0-era blob: 1
```

The zero sits beside its control: the same fixed-string grep finds the unanchored form in the pre-repair plan blob (`8dcc83b00~1`). A first check used a regex grep, not a fixed-string one, and it returned 0 for the anchored form. That zero belonged to the check. `(^| )` is regex syntax, so that pattern never described the literal text. The fixed-string recheck above replaces it.

The same repair in the sibling plans:

```
102-05 anchored=1 unanchored=0
102-07 anchored=2 unanchored=0
102-15 anchored=1 unanchored=0
```

Parse drill: the repaired pipeline from the oracle, fed a passing line, a failing line and a skipped line, under the oracle's own PATH:

```
grep=/usr/bin/grep
[expected=2 unexpected=0 skipped=0 flaky=0] -> PWPASS=[2] PWFAIL=[0] PWSKIP=[0] verdict=PASS
[expected=0 unexpected=2 skipped=0 flaky=0] -> PWPASS=[0] PWFAIL=[2] PWSKIP=[0] verdict=FAIL
[expected=1 unexpected=0 skipped=1 flaky=0] -> PWPASS=[1] PWFAIL=[0] PWSKIP=[1] verdict=FAIL
```

The repaired parse reads `2` where attempt 1 read `2⏎0`. It also reds the report shape the §6 drill produced (`unexpected=2`), so its PASS below is not a constant.

### 12.2 Pre-run census (no other suite, port free)

```
== :5173 listeners ==
== playwright/vite procs (this worktree) ==
== any playwright test procs ==
22456 claude --model opus --strict-mcp-config --mcp-config {"mcpServers":{}} … (line cut at 200 chars by the census)
PW_REUSE=unset E2E_BASE_URL=unset
```

The one hit is a `claude` process that matched on its prompt text. It is not a Playwright or Vite process.

### 12.3 API positive control, run BEFORE the spec (test-user JWT, research §5.2)

The token was minted by GoTrue password grant with the `TEST_USER` pair. Only its length is printed. The response bodies went to the scratchpad, not the worktree.

```
start=2026-09-11T19:05:23Z HEAD=0eec30b9c
TOKEN_LEN=922 (value withheld)
HTTP=200
ENG_BODY_ROWS=5 {"page":1,"limit":20,"total":5,"totalPages":1,"has_more":false}
   b0000002-0000-0000-0000-000000000003 | Delegation visit — Indonesia BPS
   b0000002-0000-0000-0000-000000000002 | Prep session — G20 Data Gaps Initiative
   b0000002-0000-0000-0000-000000000001 | Bilateral consultation — ESCWA
   7c0d830b-5dc7-4419-a0ad-ce550031712d | Bilateral engagement with ONS — census methodology exchange
   00000000-0000-0052-0000-000000000001 | Bilateral consultation — statistical cooperation framework
HTTP=200
RPC_BODY_ROWS=5
   b0000002-0000-0000-0000-000000000003 | official_visit | Delegation visit — Indonesia BPS
   b0000002-0000-0000-0000-000000000002 | working_group | Prep session — G20 Data Gaps Initiative
   b0000002-0000-0000-0000-000000000001 | consultation | Bilateral consultation — ESCWA
   7c0d830b-5dc7-4419-a0ad-ce550031712d | bilateral_meeting | Bilateral engagement with ONS — census methodology exchange
   00000000-0000-0052-0000-000000000001 | bilateral_meeting | Bilateral consultation — statistical cooperation framework
HTTP/2 200 
content-range: 0-4/5
exit=0 end=2026-09-11T19:05:27Z
```

This is identical to attempt 1 (§4): both paths 200, `total=5`, 5 RPC rows, and exact count `0-4/5`.

### 12.4 P52 catalog oracle, after the work

```
HEAD=0eec30b9c at 2026-09-11T19:05:27Z
P102-05-P52 engagement_dossiers_typed=5 extension_rows=5 seeded_pair=2 renamed=1 expected 5 5 2 1
PASS p52
exit=0
```

The seed was not applied a third time. The two recorded applies (§3: `INSERT 0 2 / UPDATE 1`, then `INSERT 0 0 / UPDATE 0`) stand, and this oracle proves the end state still holds on staging.

### 12.5 Render oracle, after the work (the only suite running)

```
HEAD=0eec30b9c start=2026-09-11T19:05:44Z
P102-05-RENDER wrapper_rc=0 passed=2 failed=0 skipped=0 expected passed=2 failed=0 skipped=0 (the en and ar renders of /engagements each show exactly 5 engagement rows on a settled surface with the locale asserted)
PASS render
exit=0
end=2026-09-11T19:06:01Z
report=frontend/test-results/pw-reaped-2590d57f25f864cf631ed77cb8d5fa6a.json
stats {"startTime": "2026-09-11T19:05:45.048Z", "duration": 16223.912, "expected": 2, "skipped": 0, "unexpected": 0, "flaky": 0}
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled en surface | project chromium | passed | 8396ms
 TEST e2e/102-engagements-render.spec.ts | renders 5 engagement rows on a settled ar surface | project chromium | passed | 8719ms
```

`git status --short` was empty right after this run (`test-results/` is gitignored, `.gitignore:105`).

### 12.6 Post-run census

```
== post-run :5173 listeners ==
== post-run playwright/vite procs ==
21813 codex -a never -s workspace-write --dangerously-bypass-hook-trust --disable plugins -c mcp_servers={} -c mcp_servers.node_repl.enabled=false -c mcp_server
(end census)
```

No listener is left on :5173. The one hit is a `codex` process that matched on its command-line text. It is not a Vite or Playwright process, and the wrapper did not start it.

### 12.7 ENGREAD-01 on attempt 2

The verdict is unchanged: **NOT-REPRODUCED-AT-RENDER**. A third settled render agrees with the first two and with the API: 5 rows in `en` and in `ar`, the locale asserted, no error chrome. It is still not "fixed". The §10 bounds all still apply.

## Deviations

Attempt 1: none. Only the three `files_modified` paths changed. The drill file was created and deleted inside `frontend/tests/e2e/` in one command and never staged; `git status --short` after it showed only this plan's spec.

Attempt 2: none. This SUMMARY is the only file it changes. The oracle scripts, the API-control script and its response bodies stayed in the worker scratchpad.
