---
status: complete
phase: 101-ci-gates-green
plan: 5
completed: 2026-09-11
---

# P101-05 — shard 1 EN group A: 9 red tests, 4 fixed for drift, 5 quarantined

## Outcome

Run `31848669722` (E2E Tests, `main` push, head `e990ed844`, created 2026-08-14T22:58:38Z), job
`94920109119` (E2E shard 1/2), reported 9 red tests across this unit's 6 spec files. Each one is now
either fixed for the spec drift its log names, or carries an in-spec
`test.fixme(true, 'P101-QUAR 31848669722: <cause>; log line <n> of job 94920109119; owner Phase 10N')`
as the first statement of its body.

| file                  | red in CI | fixed                         | quarantined |
| --------------------- | --------- | ----------------------------- | ----------- |
| 01-login              | 2         | 2 (pre-landed in `a15ba7751`) | 0           |
| 03-dossier-navigation | 1         | 1 (this unit)                 | 0           |
| 04-command-palette    | 2         | 0                             | 2           |
| 05-notifications      | 1         | 1 (this unit)                 | 0           |
| 06-work-item-crud     | 1         | 0                             | 1           |
| 07-calendar-events    | 2         | 0                             | 2           |
| total                 | 9         | 4                             | 5           |

The root E2E population still lists `Total: 220 tests in 65 files`. **No test in this unit was
executed**: the root shards cannot run locally (see "Root-shards bound"). The run proof is the first
`main` run that P101-07 observes.

## Derivation of the 9 from the run log

`$S` is this worker's scratchpad. The commands are RESEARCH §10.2's, applied to this one job and filtered
to this unit's six files.

```bash
gh run view -R alzahrani-khalid/Intl-Dossier-V2.0 --job 94920109119 --log-failed > "$S/job94920109119.log" 2>&1; echo "exit=$?"; wc -l "$S/job94920109119.log"
```

```text
exit=0
    2437 .../job94920109119.log
```

**ANSI-strip step.** The `--log-failed` output stores each ANSI escape as the two literal characters
`^[` followed by `[…m`, so `\x1b` never matches. The strip that works matches the two characters:

```bash
sed -E 's/\^\[\[[0-9;]*m//g' "$S/job94920109119.log" > "$S/job-94920109119.clean"
grep -c '\^\[\[' "$S/job94920109119.log"; grep -c '\^\[\[' "$S/job-94920109119.clean"
```

```text
17
0
```

(The instrument sees 17 escape-bearing lines before the strip and 0 after, so the 0 is not an
instrument that cannot see them.)

**Rows, per file, and the CI notice:**

```bash
grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' "$S/job-94920109119.clean" \
  | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u > "$S/rows.txt"; wc -l < "$S/rows.txt"
sed -E 's/^\[[a-z0-9-]+\] › //; s/:[0-9]+:[0-9]+ › .*//' "$S/rows.txt" | sort | uniq -c
grep -oE '[0-9]+ failed' "$S/job-94920109119.clean" | tail -1
grep -n 'notice' "$S/job-94920109119.clean" | tail -5
```

```text
      28
   2 tests/e2e/01-login.spec.ts
   1 tests/e2e/03-dossier-navigation.spec.ts
   2 tests/e2e/04-command-palette.spec.ts
   1 tests/e2e/05-notifications.spec.ts
   1 tests/e2e/06-work-item-crud.spec.ts
   2 tests/e2e/07-calendar-events.spec.ts
   1 tests/e2e/08-export-import.spec.ts
   4 tests/e2e/10-operations-hub.spec.ts
   3 tests/e2e/elected-official-create.spec.ts
   3 tests/e2e/engagement-create.spec.ts
   1 tests/e2e/forum-create.spec.ts
   1 tests/e2e/fouc-bootstrap.spec.ts
   2 tests/e2e/person-identity-fields.spec.ts
   4 tests/e2e/phase-36-shell.spec.ts
27 failed
2228:E2E (shard 1/2)	UNKNOWN STEP	2026-08-14T23:15:19.3808208Z ##[notice]  27 failed
```

**Dedupe: drop a row that is a strict prefix of another.** The log truncates one line per job:

```bash
awk '{a[NR]=$0} END{for(i=1;i<=NR;i++){p=0; for(j=1;j<=NR;j++) if(i!=j && index(a[j],a[i])==1 && length(a[j])>length(a[i])) p=1; if(!p) print a[i]}}' "$S/rows.txt" > "$S/rows.dedup"; wc -l < "$S/rows.dedup"
comm -23 "$S/rows.txt" <(sort "$S/rows.dedup")
grep -E 'tests/e2e/0[1-7]-[a-z-]+\.spec\.ts' "$S/rows.dedup"
grep -cE 'tests/e2e/0[1-7]-[a-z-]+\.spec\.ts' "$S/rows.dedup"
```

```text
      27
[chromium-en] › tests/e2e/phase-36-shell.spec.ts:124:7 › Phase 36 shell › drawer panel width — m
[chromium-en] › tests/e2e/01-login.spec.ts:10:7 › TEST-01 authentication › signs in with email/password and reaches dashboard
[chromium-en] › tests/e2e/01-login.spec.ts:30:7 › TEST-01 session lifecycle › signs out and returns to login
[chromium-en] › tests/e2e/03-dossier-navigation.spec.ts:10:7 › TEST-03 dossier navigation › navigates list -> detail -> tabs -> RelationshipSidebar
[chromium-en] › tests/e2e/04-command-palette.spec.ts:10:7 › TEST-04 command palette › opens Cmd+K, searches, navigates to result
[chromium-en] › tests/e2e/04-command-palette.spec.ts:20:7 › TEST-04 command palette › Cmd+K shows recent items after navigation
[chromium-en] › tests/e2e/05-notifications.spec.ts:68:7 › TEST-05 notifications › toggles notification preference and persists across reload
[chromium-en] › tests/e2e/06-work-item-crud.spec.ts:6:7 › TEST-06 work-item CRUD + kanban drag › creates a task, drags it across columns, completes it @mobile
[chromium-en] › tests/e2e/07-calendar-events.spec.ts:28:7 › TEST-07 calendar events › shows lifecycle dates on engagement-linked event
[chromium-en] › tests/e2e/07-calendar-events.spec.ts:6:7 › TEST-07 calendar events › creates a calendar event and views it @mobile
9
```

**Count beside the CI notice.** After the prefix drop the job reads 27 rows, which equals the CI notice
`##[notice]  27 failed` (log line 2228). The one row dropped is a truncated `phase-36-shell` row (101-09's
file; its full sibling survives). This unit's six files account for **9** of the 27
(2 + 1 + 2 + 1 + 1 + 2), matching the plan's figure. The other 18 belong to 101-08 (08 1, 10 4,
elected-official 3, engagement 3, forum 1 = 12) and 101-09 (fouc 1, person-identity 2, phase-36 3 = 6).

**Failure attachments** (used only to read what the page showed at failure; the traces were not
opened):

```bash
gh run download 31848669722 -R alzahrani-khalid/Intl-Dossier-V2.0 -n playwright-failure-1 -D "$S/pf1"; echo "exit=$?"
```

`exit=0`. Each of the 9 first-attempt dirs holds `test-failed-1.png` and `trace.zip` (the 01 sign-in dir
also holds `video.webm`). The artifact is `playwright-failure-1`, id `9237100474`, not expired on
2026-09-11.

## Classification of the 9

Log lines are the first-attempt header of each failure block in job `94920109119`'s `--log-failed`
output. Classes follow D-09: spec drift is fixed; application code, a data dependency, or a page-object
rework outside this unit's file scope is quarantined.

| #   | test (spec:line)                                   | log line | first error in the log                                                                                                                                                         | class                                             | action                           |
| --- | -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------- |
| 1   | 01-login:10 signs in with email/password           | 599      | strict mode: `getByLabel(/password/)` resolved to 2 elements (`input#password` and the "Show password" toggle)                                                                  | spec drift (page object)                          | FIXED at HEAD, `a15ba7751`       |
| 2   | 01-login:30 signs out and returns to login         | 733      | 30 s timeout waiting for `getByRole('button', /sign out/)`; the sign-out control is a Radix `DropdownMenuItem` (role `menuitem`)                                                | spec drift (page object)                          | FIXED at HEAD, `a15ba7751`       |
| 3   | 03-dossier-navigation:10                           | 663      | strict mode: `getByRole('complementary')` resolved to 2 elements (the app-shell nav `aside` and the RelationshipSidebar `aside aria-expanded`)                                  | spec drift                                        | FIXED in this unit               |
| 4   | 04-command-palette:10 opens Cmd+K                  | 798      | 30 s timeout: dialog `/command.*palette/` never visible after `Control+K` on `/`; screenshot shows the dashboard with no dialog open                                             | cause not separable from the log (app or timing)  | QUARANTINED, owner Phase 103     |
| 5   | 04-command-palette:20 recent items                 | 936      | 30 s timeout waiting for heading `United Nations` on `/dossiers` (the `Saudi Arabia` open before it passed); screenshot shows the Browse-by-Type card view                       | seed data or hub listing                          | QUARANTINED, owner Phase 102     |
| 6   | 06-work-item-crud:6                                | 1001     | 30 s timeout waiting for button `/new task/` on `/my-work`; screenshot shows My Work with only a Board View button                                                               | app contract plus page-object rework              | QUARANTINED, owner Phase 103     |
| 7   | 07-calendar-events:28 lifecycle dates              | 1066     | `calendar-event` filtered by `lifecycle-date-badge`: element(s) not found; screenshot shows the analyst's calendar empty                                                          | app contract plus seed data                       | QUARANTINED, owner Phase 103     |
| 8   | 07-calendar-events:6 creates a calendar event      | 1133     | 30 s timeout on `getByLabel(/title/)` after the Create Event click; screenshot still on `/calendar`, empty state                                                                  | page-object drift plus app flow, not separable    | QUARANTINED, owner Phase 103     |
| 9   | 05-notifications:68 toggles preference and reloads | 863      | `aria-checked` expected `"false"`, received `"true"` after reload                                                                                                              | spec drift                                        | FIXED in this unit               |

Evidence behind each class (all reads at HEAD `24f5d7cd2` unless a sha is named):

- **1, 2.** `git diff e990ed844 HEAD -- tests/e2e/support/pages/LoginPage.ts` shows the only change since
  the run, in `a15ba7751` (2026-08-15, the day after the run). It sets `passwordInput` to
  `locator('#password')` and widens `signOutButton` to a button or menuitem. The run's own `setup` project
  filled `#password` and passed: `git show e990ed844:tests/e2e/support/auth.setup.ts | grep -n "#password"`
  gives `26:    await page.locator('#password').fill(role.password)`. For 2, `92-02-SUMMARY.md:338` records
  the same flow GREEN ("the user-menu opened, the sign-out item was clicked, `**/login` was reached"), and
  `frontend/src/components/layout/nav-user.tsx:57` carries the `data-testid="user-menu"` the spec clicks first.
  This unit's diff does not touch `01-login.spec.ts`.
- **3.** `RelationshipSidebar.tsx:459-474`: the `aside` carries `aria-expanded` and holds the toggle whose
  `aria-label` is `sidebar.collapse` / `sidebar.expand` (`dossier-shell`: "Collapse sidebar" / "Expand
  sidebar"). `git grep -nE "sidebar\.collapse|sidebar\.expand['\"]"` outside JSON finds only that line
  (474), so no second control carries those names. The fix is a spec-local locator: the `complementary`
  landmark that holds that toggle.
- **9.** `NotificationPreferences.tsx` toggles call `handleToggle`, which sets local state. The
  `Save Preferences` button renders only while `hasChanges` (line 308, identical at `e990ed844`), and
  `handleSave` upserts `notification_category_preferences` (`useNotificationCenter.ts:454`). The spec
  reloaded without saving. The fix flips the current value (a fixed `false` would leave nothing to save on
  the next run, so the Save button would never render), clicks `Save Preferences`, awaits the upsert's
  POST, reloads, and asserts the flipped value. The assertion is kept, not removed.
- **4.** The dialog's accessible name matches: `ui/command.tsx` renders
  `<DialogTitle>Command Palette</DialogTitle>`, and `KeyboardShortcutProvider.tsx:72-83` registers
  `ctrl`+`k` off-Mac. The log has no DOM at failure, and the screenshot shows only that no dialog was open.
  Whether this is a shortcut defect or a timing drift cannot be separated without the trace, so the test is
  quarantined rather than guessed at.
- **6, 7.** `git grep -c` over `frontend/src` (tests excluded) counts `kanban-column` **0** and
  `lifecycle-date-badge` **0**. Controls from the same instrument: `notification-pref` 5, `user-menu` 1,
  `calendar-event` 14. The kanban lives under `/my-work/board`
  (`frontend/src/routes/_protected/my-work/board.tsx`), not at the `/my-work` the page object opens.
- **8.** `/calendar` links its `Create Event` button to `/calendar/new`, whose `CalendarEntryForm` labels
  two title fields, "Title (English)" and "Title (Arabic)" (`CalendarEntryForm.tsx:400,414`). So even once
  the form renders, `CalendarPage`'s `/title/` label regex cannot resolve to one element. Both the page
  object and the flow need rework, and `tests/e2e/support/pages/*` is outside this unit's file scope.

**Owner rule.** Phase 102 (Staging Data & Debt Tail) owns a row whose first cause is staging data. Phase
103 (Audit Re-Sweep, which re-verifies against live observation) owns a row that needs application code,
an app contract, or a page-object rework verified against the deployed app.

## Quarantine register

One row per in-spec marker. `cells` = reporter cells one marker skips in the population the shards run.
`e2e.yml:41` runs `--project=chromium-en --project=chromium-ar-smoke` only, so the `@mobile` project never
runs in CI and every row is 1.

| spec                                 | test title                                                    | cause class                                                                      | owner phase | cells |
| ------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------- | ----- |
| tests/e2e/04-command-palette.spec.ts | opens Cmd+K, searches, navigates to result                    | palette dialog not visible after Control+K; app or timing, not separable (log 798) | Phase 103   | 1     |
| tests/e2e/04-command-palette.spec.ts | Cmd+K shows recent items after navigation                     | seed data or hub listing: heading United Nations unresolved (log 936)            | Phase 102   | 1     |
| tests/e2e/06-work-item-crud.spec.ts  | creates a task, drags it across columns, completes it @mobile | app contract (kanban-column testids) plus page-object rework (log 1001)          | Phase 103   | 1     |
| tests/e2e/07-calendar-events.spec.ts | creates a calendar event and views it @mobile                 | page-object drift (two title labels) plus app flow, not separable (log 1133)     | Phase 103   | 1     |
| tests/e2e/07-calendar-events.spec.ts | shows lifecycle dates on engagement-linked event              | app contract (lifecycle-date-badge testid) plus seed data (log 1066)             | Phase 103   | 1     |

Marker lines (`grep -n "test.fixme(true, 'P101-QUAR" <the six files> | cut -c1-110`):

```text
tests/e2e/04-command-palette.spec.ts:11:    test.fixme(true, 'P101-QUAR 31848669722: red - dialog /command.*pa
tests/e2e/04-command-palette.spec.ts:22:    test.fixme(true, 'P101-QUAR 31848669722: red - heading "United Nat
tests/e2e/06-work-item-crud.spec.ts:10:    test.fixme(true, 'P101-QUAR 31848669722: red - button /new task|cre
tests/e2e/07-calendar-events.spec.ts:7:    test.fixme(true, 'P101-QUAR 31848669722: red - getByLabel(/title/)
tests/e2e/07-calendar-events.spec.ts:30:    test.fixme(true, 'P101-QUAR 31848669722: red - no calendar-event h
```

Each marker is one line on purpose. The oracle greps by line, and the commit hook's lint-staged runs
Prettier only on `frontend/**` and `backend/**` TypeScript (`package.json` `lint-staged`), so a
single-line marker under root `tests/e2e/` is not rewrapped.

## Fixed tests

| fix   | spec                                    | test                                                         | drift named                                                                                                                                                                                                                                                         |
| ----- | --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIXED | tests/e2e/01-login.spec.ts              | signs in with email/password and reaches dashboard           | The password label regex also matched the "Show password" toggle, so strict mode saw 2 elements (log 599). `LoginPage.passwordInput` became `#password` in `a15ba7751`, landed 2026-08-15 after run head `e990ed844`. Pre-landed, outside this unit's diff.   |
| FIXED | tests/e2e/01-login.spec.ts              | signs out and returns to login                               | The sign-out control is a Radix menuitem, but `LoginPage.signOutButton` accepted only role button (log 733). Widened to button or menuitem in `a15ba7751`. Pre-landed, outside this unit's diff.                                                                 |
| FIXED | tests/e2e/03-dossier-navigation.spec.ts | navigates list -> detail -> tabs -> RelationshipSidebar      | The app shell added a second complementary landmark (the nav aside), so `getByRole('complementary')` saw 2 elements (log 663). The spec now scopes to the complementary landmark that holds the Collapse/Expand sidebar toggle.                                  |
| FIXED | tests/e2e/05-notifications.spec.ts      | toggles notification preference and persists across reload  | Preferences persist on Save Preferences, not on toggle; the spec reloaded unsaved (log 863). The spec now flips the value, saves, awaits the upsert POST, reloads, and asserts the flipped value.                                                              |

"Fixed" means the drift the log names no longer exists in the tree. It does not mean the test passes. A
later assertion in the same test (03's collapse/expand steps, 05's persistence path, 01's dashboard
landmark) could still be red for a cause the 2026-08-14 log never reached. If the P101-07 run shows one,
it is a new first cause to route, not a regression of this fix.

## Verification run here (discovery and static only)

The six files still load, and `--list` is discovery, not execution:

```bash
pnpm exec playwright test tests/e2e/01-login.spec.ts tests/e2e/03-dossier-navigation.spec.ts tests/e2e/04-command-palette.spec.ts tests/e2e/05-notifications.spec.ts tests/e2e/06-work-item-crud.spec.ts tests/e2e/07-calendar-events.spec.ts --project=chromium-en --no-deps --list 2>&1 | grep -E "Error|›|^Total"
```

```text
  [chromium-en] › 01-login.spec.ts:10:7 › TEST-01 authentication › signs in with email/password and reaches dashboard
  [chromium-en] › 01-login.spec.ts:24:7 › TEST-01 session lifecycle › persists session across page reload
  [chromium-en] › 01-login.spec.ts:30:7 › TEST-01 session lifecycle › signs out and returns to login
  [chromium-en] › 03-dossier-navigation.spec.ts:10:7 › TEST-03 dossier navigation › navigates list -> detail -> tabs -> RelationshipSidebar
  [chromium-en] › 04-command-palette.spec.ts:10:7 › TEST-04 command palette › opens Cmd+K, searches, navigates to result
  [chromium-en] › 04-command-palette.spec.ts:21:7 › TEST-04 command palette › Cmd+K shows recent items after navigation
  [chromium-en] › 05-notifications.spec.ts:30:7 › TEST-05 notifications › receives in-app notification and updates bell badge
  [chromium-en] › 05-notifications.spec.ts:49:7 › TEST-05 notifications › marks all as read
  [chromium-en] › 05-notifications.spec.ts:68:7 › TEST-05 notifications › toggles notification preference and persists across reload
  [chromium-en] › 06-work-item-crud.spec.ts:6:7 › TEST-06 work-item CRUD + kanban drag › creates a task, drags it across columns, completes it @mobile
  [chromium-en] › 07-calendar-events.spec.ts:6:7 › TEST-07 calendar events › creates a calendar event and views it @mobile
  [chromium-en] › 07-calendar-events.spec.ts:29:7 › TEST-07 calendar events › shows lifecycle dates on engagement-linked event
Total: 12 tests in 6 files
```

Markers per file (the zeros sit beside the 2 and 1 read by the same grep):

```text
0	tests/e2e/01-login.spec.ts
0	tests/e2e/03-dossier-navigation.spec.ts
2	tests/e2e/04-command-palette.spec.ts
0	tests/e2e/05-notifications.spec.ts
1	tests/e2e/06-work-item-crud.spec.ts
2	tests/e2e/07-calendar-events.spec.ts
```

Type-check of the six specs (no root tsconfig covers `tests/e2e`, so the flags are explicit):

```bash
bash -c 'pnpm exec tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --types node <the six files> 2>&1 | head -20; echo "tsc exit=${PIPESTATUS[0]}"'
```

```text
tsc exit=0
```

Scope of the spec commit (`git diff --stat` before committing):

```text
 tests/e2e/03-dossier-navigation.spec.ts | 16 +++++++++++-----
 tests/e2e/04-command-palette.spec.ts    |  2 ++
 tests/e2e/05-notifications.spec.ts      | 16 +++++++++++++---
 tests/e2e/06-work-item-crud.spec.ts     |  1 +
 tests/e2e/07-calendar-events.spec.ts    |  2 ++
 5 files changed, 29 insertions(+), 8 deletions(-)
```

No Playwright suite ran, so D-13's wrapper was not needed and no dev server was started.

## Root-shards bound

The root shards cannot run locally, so nothing in this SUMMARY is a run result.

- `chromium-en` and `chromium-ar-smoke` carry `dependencies: ['setup']`, and `auth.setup.ts` throws
  unless all six `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}` are set. The analyst-page tests (03, 06, 07)
  also read `storage/analyst.json`, which only that setup writes.
- The six `E2E_*` keys are absent locally: the shell environment carries none of them, and the primary
  checkout's `.env.test` carries no `E2E_*` name. The worktree hook maps only the admin pair: the harness
  `setup:` step (`.tickmarkr/config.yaml`) runs `p99-worktree-test-env.sh "$PWD"`, which writes a
  gitignored worktree-local `.env.test` whose only `E2E_*` keys are `E2E_ADMIN_EMAIL` and
  `E2E_ADMIN_PASSWORD`. `tests/e2e/support/load-env.mjs` prefers that local file, so the analyst and
  intake pairs stay unset. (Attempt 0 attributed the mapping to `load-env.mjs` falling back to the primary
  checkout's file; that file carries no `E2E_*` name, so the hook is the only source.) Probed by key name
  only, values never printed:

  ```text
  $ env | grep -cE '^E2E_(ADMIN|ANALYST|INTAKE)_(EMAIL|PASSWORD)='
  0
  $ grep -oE '^(export )?E2E_[A-Z0-9_]+=' <primary checkout>/.env.test | sed -E 's/^export //; s/=$//' | sort
  (no output)
  $ git check-ignore -v .env.test
  .gitignore:24:.env.*	.env.test
  $ grep -oE '^(export )?[A-Z0-9_]+=' .env.test | sed -E 's/^export //; s/=$//' | sort | tr '\n' ' '
  E2E_ADMIN_EMAIL E2E_ADMIN_PASSWORD PHASE_52_FIXTURE_ENGAGEMENT_ID SUPABASE_ANON_KEY SUPABASE_DB_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_URL TEST_USER_EMAIL TEST_USER_PASSWORD
  ```

  The zeros sit beside a non-zero read of the same kind: the worktree file's key list names the admin
  pair, so the name grep can see `E2E_*` keys when they are present.

- The shards also target the deployed app at `E2E_BASE_URL`, which serves whatever the droplet runs, not
  necessarily this tree.

**The run proof for every FIXED and quarantined row here is the first `main` run P101-07 observes** (the
two `e2e.yml` shards), where the reporter's `skipped` must be at least the register's 5 cells.

## What the quarantines do not claim

Each marker records that its **test is red** and the first cause observed on 2026-08-14. None claims
the behaviour is absent from the product. The command palette, the dossier hub, work-item creation,
calendar entry creation and engagement lifecycle dates may each work for a user. The tests as written did
not demonstrate it against the deployed app in that run.

## Left for named later work

- **Phase 103:** rework `WorkItemKanbanPage` (route, create flow, column testids) and `CalendarPage` (the
  two title labels, the `/calendar/new` flow). Re-derive the command-palette cause from `trace.zip` in
  `playwright-failure-1` (not opened here). Then lift the 04:10, 06, 07:6 and 07:28 markers.
- **Phase 102:** seed the `E2E_SEED_DOSSIER_NAME_B` dossier (default `United Nations`), or point that
  variable at a seeded organization, and seed an engagement-linked calendar event. Then lift the 04:20
  marker.
- **P101-07:** observe the `main` run; route any new first cause in a FIXED row.
- Not done here: `graphify update .` (CLAUDE.md). It writes `graphify-out/`, which is outside this unit's
  file scope.

## Attempt 1 re-verification

Attempt 0's two commits never received a gate verdict. The run journal shows the task entering
`suite-wait` at 05:34:44Z, then `exit-cause deliberate SIGTERM` for the daemon at 05:45:21Z, then
`run-resume` and a fresh attempt 1 that carries the same commits. They are tree-identical to this
branch's `b9b1e36ce` and `9c352db7f`: `git diff --stat 0f97f8c b9b1e36 -- tests/e2e` and
`git diff --stat c7e670f 9c352db -- <this SUMMARY>` both print nothing. So this attempt re-checked the
claims instead of redoing the work. One correction came out of it, the root-shards bound mechanism
(see that section).

The failed-test log was downloaded again and every log line cited above was re-read:

```bash
gh run view -R alzahrani-khalid/Intl-Dossier-V2.0 --job 94920109119 --log-failed > "$S/job94920109119.log" 2>&1; echo "exit=$?"; wc -l < "$S/job94920109119.log"; sed -E 's/\^\[\[[0-9;]*m//g' "$S/job94920109119.log" > "$S/job.clean"; grep -c '\^\[\[' "$S/job94920109119.log"; grep -c '\^\[\[' "$S/job.clean"; for n in 599 663 733 798 863 936 1001 1066 1133 2228; do printf '%s: ' $n; sed -n "${n}p" "$S/job.clean" | sed -E 's/^.*Z //' | cut -c1-150; done
```

```text
exit=0
    2437
17
0
599: ##[error]  1) [chromium-en] › tests/e2e/01-login.spec.ts:10:7 › TEST-01 authentication › signs in with email/password and reaches dashboard
663: ##[error]  2) [chromium-en] › tests/e2e/03-dossier-navigation.spec.ts:10:7 › TEST-03 dossier navigation › navigates list -> detail -> tabs -> Relation
733: ##[error]  3) [chromium-en] › tests/e2e/01-login.spec.ts:30:7 › TEST-01 session lifecycle › signs out and returns to login
798: ##[error]  4) [chromium-en] › tests/e2e/04-command-palette.spec.ts:10:7 › TEST-04 command palette › opens Cmd+K, searches, navigates to result
863: ##[error]  5) [chromium-en] › tests/e2e/05-notifications.spec.ts:68:7 › TEST-05 notifications › toggles notification preference and persists across re
936: ##[error]  6) [chromium-en] › tests/e2e/04-command-palette.spec.ts:20:7 › TEST-04 command palette › Cmd+K shows recent items after navigation
1001: ##[error]  7) [chromium-en] › tests/e2e/06-work-item-crud.spec.ts:6:7 › TEST-06 work-item CRUD + kanban drag › creates a task, drags it across columns
1066: ##[error]  8) [chromium-en] › tests/e2e/07-calendar-events.spec.ts:28:7 › TEST-07 calendar events › shows lifecycle dates on engagement-linked event
1133: ##[error]  9) [chromium-en] › tests/e2e/07-calendar-events.spec.ts:6:7 › TEST-07 calendar events › creates a calendar event and views it @mobile
2228: ##[notice]  27 failed
```

These are the nine failure headers of this unit's files, numbered 1-9 in a row by the reporter. The notice
still reads 27 at line 2228.

The two testid counts behind the 06 and 07:28 markers were re-read, with a check for a testid built at
runtime (`-column-` would match a template such as `` `kanban-column-${stage}` ``). Test files are excluded,
and the controls come from the same instrument:

```bash
for p in 'kanban-column' 'lifecycle-date-badge' 'lifecycle-date' '-column-' 'calendar-event' 'notification-pref' 'user-menu'; do printf '%-22s %s\n' "$p" "$(git grep -h -- "$p" -- 'frontend/src' ':!frontend/src/**/*.test.*' ':!frontend/src/**/__tests__/**' | wc -l | tr -d ' ')"; done
```

```text
kanban-column          0
lifecycle-date-badge   0
lifecycle-date         0
-column-               0
calendar-event         14
notification-pref      5
user-menu              1
```

These counts are about selector strings in the source. They explain why the tests' locators resolve to
nothing. They are not a claim that the kanban board or engagement lifecycle dates are missing from the
product (see "What the quarantines do not claim").

## Oracle

This plan's `must_haves.truths[0].command`, extracted from the front-matter with js-yaml and run
under a login shell (the gates' `bash -lc`) from the worktree root:

```bash
node -e "const y=require('js-yaml');const fs=require('fs');const t=fs.readFileSync('.planning/phases/101-ci-gates-green/101-05-PLAN.md','utf8');const fm=t.split(/^---$/m)[1];const d=y.load(fm);fs.writeFileSync(process.argv[1],d.must_haves.truths[0].command)" "$TMPDIR/p10105-oracle.sh"
md5 -q "$TMPDIR/p10105-oracle.sh"
bash -lc "cd '$PWD' && bash '$TMPDIR/p10105-oracle.sh'; echo exit=\$?"
```

The extracted bytes hash to `e43cf01129a3eb91e489391e43cbaa7b`. Attempt 0 recorded
`bd8665f5bd08d2b62401306a298314ee`: the same bytes plus one trailing newline
(`{ cat "$F"; printf '\n'; } | md5 -q` gives `bd8665f5…`), so both attempts ran the same oracle.

Baseline recorded by attempt 0 at HEAD `24f5d7cd2`, before any edit (matches the plan's round-2 drill):

```text
P101-05-BOUND files=6 markers with a run id=0 (any P101-QUAR=0, any fixme incl. pre-existing=0; control positions-keyboard-nav fixme=13) register rows=0 cells total=0 non-numeric=0 fixed rows=0 root list=[Total: 220 tests in 65 files] want the 9 (shard 1: 01-login 2, 03 1, 04 2, 05 1, 06 1, 07 2) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
FAIL: no marker and no FIXED row for the 9 (shard 1: 01-login 2, 03 1, 04 2, 05 1, 06 1, 07 2) red tests in these files - nothing was fixed or quarantined
exit=1
```

After this unit's commits (attempt 1, re-run at HEAD `9c352db7f`; the register it reads is unchanged
by this attempt's edits):

```text
e43cf01129a3eb91e489391e43cbaa7b
P101-05-BOUND files=6 markers with a run id=5 (any P101-QUAR=5, any fixme incl. pre-existing=5; control positions-keyboard-nav fixme=13) register rows=5 cells total=5 non-numeric=0 fixed rows=4 root list=[Total: 220 tests in 65 files] want the 9 (shard 1: 01-login 2, 03 1, 04 2, 05 1, 06 1, 07 2) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
PASS
exit=0
```

Markers 5 + FIXED rows 4 = 9, which equals the derivation's count for these six files. The fixme grep
control reads 13, and the root list is unchanged at 220 in 65, so every quarantined test is still listed.
