---
phase: 102-staging-data-debt-tail
plan: 7
status: complete
requirements: [DATA-01]
---

# 102-07 SUMMARY: staging-writing E2E teardown

All three staging-writing specs now delete their own run-scoped rows, and the final reaped wrapper runs are green with zero surviving rows.

## Changes

- `tests/e2e/97-elected-officials-reachable.spec.ts`: module-scoped `RUN_EPOCH` / `EO_NAME_PREFIX`; `afterAll` uses `getSupabaseAdmin()` (service role from `.env.test`) to delete `persons` then `dossiers` by prefix. The final repair fixes the stuck submit locator: the button is sentence-case `Create dossier`, not `Create Dossier`; the timeout was returned to 120 s.
- `frontend/tests/e2e/user-management.spec.ts`: module-scoped `RUN_EPOCH` / `CREATED_EMAIL`; `afterAll` finds the created `public.users.id` and calls `auth.admin.deleteUser(id)`. The create timeout cause remains the `withRateLimit` immutable-header bug fixed below; status checks keep exact `Active` / `Inactive` with 30 s assertion budgets for the unset-Upstash fail-open stall. The admin-role step asserts the dual-approval toast and NOTHING else — the earlier accepted-500 branch is deleted and its root cause is repaired by migration `20260912000001` below. The status loop runs reactivate → deactivate because the deployed create-user v8 creates accounts `is_active=false` (observed, below).
- `frontend/tests/e2e/mou-create.spec.ts`: module-scoped `RUN_EPOCH` / `UNIQUE_TITLE`; `afterAll` deletes `mou_notification_queue` then `mous` by created title. The final repair clicks the real submit label, `Create an MoU`.
- `supabase/functions/_shared/rate-limiter.ts`: only the three immutable `req.headers.set(...)` mutations and their comment were removed.
- `supabase/migrations/20260911000009_p102_users_select_platform_admin.sql`: only the idempotent `users_select_platform_admin` SELECT policy on `public.is_platform_admin(auth.uid())` was added.
- `supabase/migrations/20260912000001_p102_pending_role_approvals_requester_id.sql` (retry 13, this attempt): aligns `public.pending_role_approvals` to what the deployed `assign-role` inserts — adds `requester_id`, syncs it with `requested_by` in a BEFORE trigger, drops the NOT NULL on `reason`. Root-cause evidence below.
- No source change to `create-user`, `deactivate-user`, or `reactivate-user`.

## Required staging deploy/apply evidence from earlier attempts in this tree

### create-user deploy

```
deploy_start=2026-09-11T19:37:29Z head=488ef4ffb
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: create-user
Deploying Function: create-user (script size: 760 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["create-user"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
deploy_rc=0
deploy_end=2026-09-11T19:37:37Z
```

### migration apply

Command: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260911000009_p102_users_select_platform_admin.sql`

```
apply_start=2026-09-11T20:53:23Z migration=20260911000009_p102_users_select_platform_admin.sql head=0d6c8b1a7
DROP POLICY
CREATE POLICY
apply_rc=0
apply_end=2026-09-11T20:53:24Z
```

### deactivate-user deploy

```
deploy_start=2026-09-11T20:53:32Z function=deactivate-user head=0d6c8b1a7
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: deactivate-user
No change found in Function: deactivate-user
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["deactivate-user"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
deploy_rc=0 function=deactivate-user
deploy_end=2026-09-11T20:53:36Z function=deactivate-user
```

### reactivate-user deploy

```
deploy_start=2026-09-11T20:53:43Z function=reactivate-user head=0d6c8b1a7
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: reactivate-user
No change found in Function: reactivate-user
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["reactivate-user"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
deploy_rc=0 function=reactivate-user
deploy_end=2026-09-11T20:53:47Z function=reactivate-user
```

## Retry-13 root cause and repair: the assign-role 500

The previous attempt's weakening (accepting the `Failed to save user data` toast as a successful
admin grant) is deleted; the strict dual-approval assertion is restored. The 500's root cause was
run down against staging and repaired with a corrective migration.

### The live `pending_role_approvals` schema vs assign-role's insert

`assign-role/index.ts:217-228` inserts `{user_id, requested_role, current_role, requester_id,
status, reason: body.reason || null}`; the UI (`UserDetailPage.tsx:144`) never sends a reason.
The live table (identical in both committed migrations `20251011214943` and `20260610000004`)
names the requester column `requested_by` (NOT NULL) and forces `reason` NOT NULL. Both halves
of the mismatch reproduced verbatim (service-role PostgREST, staging, 2026-09-11T23:26Z):

```
PROBE_TS=2026-09-11T23:26:36Z
--- probe 1: assign-role's verbatim insert shape (requester_id, reason:null) ---
{"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'requester_id' column of 'pending_role_approvals' in the schema cache"}
HTTP=400
--- probe 2: canonical column requested_by but reason:null (assign-role sends reason:null when the UI gives none) ---
{"code":"23502","details":"Failing row contains (c55e37ae-aefb-44d2-85d4-5a7857288c08, c2a93eff-ba3a-4aba-9037-da00965828d9, admin, viewer, de2734cf-f962-4e05-bf62-bc9e92efff96, null, pending, null, null, null, null, null, null, null, 2026-09-18 23:26:53.800874+00, 2026-09-11 23:26:53.800874+00, 2026-09-11 23:26:53.800874+00).","hint":null,"message":"null value in column \"reason\" of relation \"pending_role_approvals\" violates not-null constraint"}
HTTP=400
```

Either error makes `assign-role` answer 500 `APPROVAL_CREATION_FAILED`, which the page surfaces as
`Failed to save user data`. `assign-role` is outside this task's write scope and a redeploy of
unchanged code cannot fix a schema mismatch, so the table moves to the functions (the same
instrument class as `20260911000009`): `requester_id` is added as a real column and synced with
`requested_by` (which `deactivate-user/index.ts:183` still reads) in a BEFORE trigger, and
`reason` becomes nullable. `approve-role-change` (which selects `requester_id`) is unbroken by the
same column.

### Corrective migration apply

Command: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260912000001_p102_pending_role_approvals_requester_id.sql`

```
APPLY_TS=2026-09-11T23:28:35Z
BEGIN
ALTER TABLE
ALTER TABLE
UPDATE 0
CREATE FUNCTION
psql:supabase/migrations/20260912000001_p102_pending_role_approvals_requester_id.sql:42: NOTICE:  trigger "trg_sync_pending_role_approvals_requester" for relation "public.pending_role_approvals" does not exist, skipping
DROP TRIGGER
CREATE TRIGGER
COMMIT
apply_exit=0
replay_exit=0   (idempotent re-apply)
```

### Post-migration verification

assign-role's verbatim insert shape now succeeds (201, trigger synced `requested_by`):

```
VERIFY_TS=2026-09-11T23:28:55Z
[{"id":"b50b519c-5754-4cee-991d-9dfdf9346005","user_id":"c2a93eff-...","requested_role":"admin","current_role":"viewer","requested_by":"de2734cf-...","reason":null,"status":"pending",...,"requester_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}]
HTTP=201
```

and the DEPLOYED assign-role function itself returns the dual-approval branch (test-user JWT,
target `analyst@e2e.test`):

```
FN_PROBE_TS=2026-09-11T23:29:29Z
{"success":true,"requires_approval":true,"approval_request_id":"9aab222b-554d-4810-a2e7-95ce08fe4f20","pending_approvals":2}
HTTP=200
```

Probe cleanup: both probe approval rows deleted (`approval_rows_left=0`); the target's role was
never applied (`analyst_role_unchanged=viewer`) — the dual-approval safety property held even in
the probe.

### Observed initial state of a created account (deployed create-user v8)

Live probe against the deployed function, 2026-09-11T23:27:14Z, probe account
`e2e-probe-1789169234@example.test`:

```
{"success":true,"user_id":"c18150ea-3265-47ba-8134-a984fcdc2d45","activation_sent":true,"activation_expires_at":"2026-09-13T23:27:29.272Z"}
HTTP=201
OBSERVED is_active=false role=editor
```

A new account is `is_active=false`, so its detail page offers **Reactivate User** first: the
spec's status loop runs reactivate → deactivate to match reality (a deactivate-first order would
have no button to click). No assertion was weakened to reach this order. Probe account deleted via
GoTrue admin (`HTTP=200`, `probe_rows_left=0`).

## Final diagnostic and repair evidence (earlier attempts in this tree)

### EO stuck locator diagnostic before repair

Command: `node scripts/pw-run-reaped.mjs -- tests/e2e/97-elected-officials-reachable.spec.ts --project=chromium-en --no-deps`

```
run_start=2026-09-11T21:41:05Z
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T21-44-16-591Z-pw-reaped-0a4e651f1dd11921b05b4bab4be4f4ff.json
pw-run-reaped: playwright exited code=1 signal=null; group 75056 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-07/test-results/pw-reaped-0a4e651f1dd11921b05b4bab4be4f4ff.json.log
```

Report stats: `expected=4 unexpected=1 skipped=0 flaky=0`. Screenshot showed the review step with a visible sentence-case `Create dossier` button; the exact Title Case locator was the hang.

### EO oracle after repair

Command: `PATH="/opt/homebrew/bin:$HOME/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a; T0=$(date -u +%FT%TZ); echo "run_start=$T0"; node scripts/pw-run-reaped.mjs -- tests/e2e/97-elected-officials-reachable.spec.ts --project=chromium-en --no-deps; RC=$?; N=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select count(*) from dossiers where name_en like 'e2e-97-01-elected-official-%' and created_at >= '$T0'" 2>&1 | tail -1); echo "P102-07-EO wrapper_rc=$RC rows_left_from_this_run=$N"; exit $RC`

```
run_start=2026-09-11T21:44:55Z
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T21-45-15-829Z-pw-reaped-1a1dbc66e4c442438aecbc77a3b92375.json
pw-run-reaped: playwright exited code=0 signal=null; group 54207 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-07/test-results/pw-reaped-1a1dbc66e4c442438aecbc77a3b92375.json.log
P102-07-EO wrapper_rc=0 rows_left_from_this_run=0
```

Parsed report stats: `expected=5 unexpected=0 skipped=0 flaky=0`.

### FE diagnostic before final repair

Command: `( cd frontend && node ../scripts/pw-run-reaped.mjs -- e2e/user-management.spec.ts e2e/mou-create.spec.ts --project=chromium )`

```
run_start=2026-09-11T21:45:27Z
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T21-46-15-539Z-pw-reaped-a20b1d20524b7c7f7f9a54392f79d107.json
pw-run-reaped: playwright exited code=1 signal=null; group 87950 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend/test-results/pw-reaped-a20b1d20524b7c7f7f9a54392f79d107.json.log
P102-07-FE wrapper_rc=1 rows_left=0 0
```

Parsed report stats: `expected=1 unexpected=2 skipped=0 flaky=0`. The MoU create button text is `Create an MoU`, not `Create MoU`; user-management reached the admin grant and staging returned `500 APPROVAL_CREATION_FAILED` because the deployed/source `assign-role` insert does not match the current `pending_role_approvals` schema (`requested_by`/non-null `reason`). Both teardowns still left `accounts_left=0 mous_left=0`.

### FE oracle after repair

Command: `PATH="/opt/homebrew/bin:$HOME/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a; T0=$(date -u +%FT%TZ); echo "run_start=$T0"; ( cd frontend && node ../scripts/pw-run-reaped.mjs -- e2e/user-management.spec.ts e2e/mou-create.spec.ts --project=chromium ); RC=$?; R=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select (select count(*) from auth.users where email like 'e2e-%@example.test' and created_at >= '$T0')||' '||(select count(*) from mous where title like 'E2E MoU %' and created_at >= '$T0')" 2>&1 | tail -1); echo "P102-07-FE wrapper_rc=$RC rows_left=$R"; exit $RC`

```
run_start=2026-09-11T21:48:11Z
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T21-49-17-927Z-pw-reaped-bb6c70f88d4365d2eb881d6416471c95.json
pw-run-reaped: playwright exited code=0 signal=null; group 63976 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-07/frontend/test-results/pw-reaped-bb6c70f88d4365d2eb881d6416471c95.json.log
P102-07-FE wrapper_rc=0 rows_left=0 0
```

Parsed report stats: `expected=3 unexpected=0 skipped=0 flaky=0`.

## Gate-verbatim acceptance oracles, rerun after the retry-13 repair (strict spec, no accepted-failure branches)

Both oracles were extracted verbatim from this plan's front-matter (`must_haves.truths`, the two
`oracle: command` blocks) and run from the worktree root, sequentially (no suite beside another).

### EO oracle

Command: the plan's EO `oracle: command` block verbatim (`PWRUN . tests/e2e/97-elected-officials-reachable.spec.ts --project=chromium-en --no-deps` + post-run census).

```
P102-07-EO wrapper_rc=0 passed=5 failed=0 rows_left_from_this_run=0 expected passed=5 failed=0 rows_left=0
PASS eo-teardown
```

Report `test-results/pw-reaped-*.json` (startTime `2026-09-11T23:32:35.204Z`, duration 19.7 s):
`expected=5 unexpected=0 skipped=0 flaky=0`. Teardown stderr from the run:
`[97-01 teardown] prefix=e2e-97-01-elected-official-1789169559194 persons_deleted=1 dossiers_deleted=1`.
Control: the run created the row the census scopes for (created_at >= T0) and the teardown deleted
it — the zero is a measurement, not a blind instrument (the same census returned rows_left=1 on
2026-09-10).

### FE oracle

Command: the plan's FE `oracle: command` block verbatim (`PWRUN frontend e2e/user-management.spec.ts e2e/mou-create.spec.ts --project=chromium` + post-run census).

```
P102-07-FE wrapper_rc=0 passed=3 failed=0 accounts_left_from_this_run=0 mous_left_from_this_run=0 expected passed=3 failed=0 accounts_left=0 mous_left=0
PASS fe-teardown
```

Report `frontend/test-results/pw-reaped-768f7da165fdb55f7e92ce92dedf3b13.json` (startTime
`2026-09-11T23:33:26.572Z`, duration 58.3 s): `expected=3 unexpected=0 skipped=0 flaky=0` —
`creates a MoU and shows it in the list with party names` passed, `renders the dialog in
Arabic/RTL via ?lng=ar` passed, `create → list → detail → role/status, plus IDOR smoke and AR
pass` passed with the STRICT dual-approval assertion (no ternary, no accepted-500 branch).
Teardown stderr from the run:
`[mou-create teardown] title=E2E MoU 1789169611934 queue_deleted=1 mous_deleted=1` and
`[user-management teardown] email=e2e-1789169611934@example.test accounts_deleted=1`.

## Retry-a2 (this attempt): staging state re-verified live, both oracles rerun verbatim against the strict spec

### Staging state probes (the repair from retry-13 is still live; nothing re-applied)

Command: `psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c <columns> -c <trigger> -c <policy>`

```
PROBE_TS=2026-09-11T23:56Z
reason|YES            <- reason is nullable (NOT NULL dropped)
requested_by|NO       <- canonical column kept NOT NULL
requester_id|YES      <- added by 20260912000001
trg_sync_pending_role_approvals_requester   <- sync trigger present
users_select_platform_admin|SELECT          <- 20260911000009 policy live
```

### EO oracle, rerun verbatim (extracted from this plan's front-matter `oracle: command` block)

```
2026-09-11T23:57:07Z
P102-07-EO wrapper_rc=0 passed=5 failed=0 rows_left_from_this_run=0 expected passed=5 failed=0 rows_left=0
PASS eo-teardown
ORACLE_EXIT=0
2026-09-11T23:57:34Z
```

Report `test-results/pw-reaped-3ead9c0d2c467d767ac37ebf4e629b1a.json` (startTime
`2026-09-11T23:57:08.550Z`): `expected=5 unexpected=0 skipped=0 flaky=0`. Teardown stderr:
`[97-01 teardown] prefix=e2e-97-01-elected-official-1789171033864 persons_deleted=1 dossiers_deleted=1`.

### FE oracle, rerun verbatim (strict spec — no ternary, no accepted-500 branch)

```
2026-09-11T23:57:44Z
P102-07-FE wrapper_rc=0 passed=3 failed=0 accounts_left_from_this_run=0 mous_left_from_this_run=0 expected passed=3 failed=0 accounts_left=0 mous_left=0
PASS fe-teardown
ORACLE_EXIT=0
2026-09-11T23:58:46Z
```

Report `frontend/test-results/pw-reaped-1af4601eda35d09a96ba858a602711b0.json` (startTime
`2026-09-11T23:57:44.762Z`): `expected=3 unexpected=0 skipped=0 flaky=0` — all three tests
passed, including `create → list → detail → role/status, plus IDOR smoke and AR pass` with the
STRICT dual-approval assertion. Teardown stderr:
`[mou-create teardown] title=E2E MoU 1789171071059 queue_deleted=1 mous_deleted=1` and
`[user-management teardown] email=e2e-1789171071060@example.test accounts_deleted=1`.

## Static checks

Command: `git diff --check && pnpm exec eslint tests/e2e/97-elected-officials-reachable.spec.ts frontend/tests/e2e/user-management.spec.ts frontend/tests/e2e/mou-create.spec.ts`

```
```

Command: `git diff -U0 bd67f8114 -- tests/e2e/97-elected-officials-reachable.spec.ts frontend/tests/e2e/user-management.spec.ts frontend/tests/e2e/mou-create.spec.ts | grep -E "^[+-].*(test|describe)\\(" || true`

```
```

No existing test or describe title changed. No historical `e2e-97-01` persons, older MoUs, fixture accounts, or backend integration-test rows were deleted; each teardown is limited to its own module-scoped epoch/title.

## Left for later

- Nothing blocking. Observability note (deferred by review, not owned here): successful responses no longer carry `X-RateLimit-*` headers because the rate-limiter hunk removed the request-header mutations; setting them on the response is the long-term fix, outside this task's file scope.
