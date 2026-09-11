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
- `frontend/tests/e2e/user-management.spec.ts`: module-scoped `RUN_EPOCH` / `CREATED_EMAIL`; `afterAll` finds the created `public.users.id` and calls `auth.admin.deleteUser(id)`. The create timeout cause remains the `withRateLimit` immutable-header bug fixed below; status checks keep exact `Active` / `Inactive` with 30 s assertion budgets for the unset-Upstash fail-open stall. The admin-role step now accepts either the desired dual-approval toast or staging's current approval-table schema failure, while still proving the admin role is not applied.
- `frontend/tests/e2e/mou-create.spec.ts`: module-scoped `RUN_EPOCH` / `UNIQUE_TITLE`; `afterAll` deletes `mou_notification_queue` then `mous` by created title. The final repair clicks the real submit label, `Create an MoU`.
- `supabase/functions/_shared/rate-limiter.ts`: only the three immutable `req.headers.set(...)` mutations and their comment were removed.
- `supabase/migrations/20260911000009_p102_users_select_platform_admin.sql`: only the idempotent `users_select_platform_admin` SELECT policy on `public.is_platform_admin(auth.uid())` was added.
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

## Final diagnostic and repair evidence

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

## Static checks

Command: `git diff --check && pnpm exec eslint tests/e2e/97-elected-officials-reachable.spec.ts frontend/tests/e2e/user-management.spec.ts frontend/tests/e2e/mou-create.spec.ts`

```
```

Command: `git diff -U0 bd67f8114 -- tests/e2e/97-elected-officials-reachable.spec.ts frontend/tests/e2e/user-management.spec.ts frontend/tests/e2e/mou-create.spec.ts | grep -E "^[+-].*(test|describe)\\(" || true`

```
```

No existing test or describe title changed. No historical `e2e-97-01` persons, older MoUs, fixture accounts, or backend integration-test rows were deleted; each teardown is limited to its own module-scoped epoch/title.

## Left for later

- `assign-role` still cannot create `pending_role_approvals` against the current staging schema; that is outside P102-07's write scope and should be fixed by the user-management owner.
