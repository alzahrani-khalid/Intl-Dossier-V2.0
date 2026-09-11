---
phase: 102-staging-data-debt-tail
plan: 7
status: complete
commits: [b88792350, 848d42f48, 0d6c8b1a7, f76992ed7]
requirements: [DATA-01]
---

# 102-07 SUMMARY: staging-writing E2E teardown

The three staging-writing specs now identify their own rows at module scope and delete them in
`afterAll` with the service-role key loaded from `.env.test`. User management also has the product
and test repairs required to create a real teardown subject: the immutable-header exception is
removed, inactive users remain visible to platform admins, the status functions carry the shared
fix, the lifecycle starts with Reactivate, and each role picker is scoped to its own form/card.

## Changes

- `97-elected-officials-reachable.spec.ts` records `RUN_EPOCH` and `EO_NAME_PREFIX`. Its teardown
  finds dossiers by that prefix, deletes `persons` first, then `dossiers`, and logs both counts.
- `user-management.spec.ts` records `RUN_EPOCH` and `CREATED_EMAIL`. Its teardown finds the
  corresponding `public.users.id` and calls `auth.admin.deleteUser(id)`. The 120 s timeout comment
  names the measured cause: three edge calls each spend roughly 15 s waiting for the unset Upstash
  limiter to fail open. Created accounts start inactive, so the status sequence is Reactivate then
  Deactivate. The create picker is scoped to its form; detail role changes are scoped to the
  `Assign Role` control group, fixing the last harness failure where an unscoped
  `getByRole('combobox')` matched four controls.
- `mou-create.spec.ts` records `RUN_EPOCH` and `UNIQUE_TITLE`. Its teardown deletes matching
  `mou_notification_queue` rows first, then the `mous` row, and logs both counts.
- `_shared/rate-limiter.ts` removes only the comment and three `req.headers.set` calls that tried to
  mutate Deno's immutable incoming headers.
- `20260911000009_p102_users_select_platform_admin.sql` adds only the idempotent platform-admin
  SELECT policy on `public.users`, using `public.is_platform_admin(auth.uid())`.
- There is no source change to `create-user`, `deactivate-user`, or `reactivate-user`.

## Create timeout cause, fix, and first deploy

`withRateLimit` waited for the absent Upstash configuration and then called `req.headers.set` on
the immutable incoming request. `create-user` calls it outside its try/catch, so the exception
returned `500 EDGE_FUNCTION_ERROR` without CORS and `page.waitForURL` consumed the old 30 s test
budget. The shared hunk deletes those mutations; the test timeout covers the remaining three
approximately 15 s fail-open waits.

The required create-user deploy was taken before the earlier browser/oracle runs:

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

The subsequent browser trace measured `POST /functions/v1/create-user` returning 201 and the
service-role teardown deleting the new account (`accounts_deleted=1`).

## Attempt 4 staging apply and deploys

Commands were run in this order after loading `.env.test`.

### Migration apply

Command: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f
supabase/migrations/20260911000009_p102_users_select_platform_admin.sql`

```
apply_start=2026-09-11T20:53:23Z migration=20260911000009_p102_users_select_platform_admin.sql head=0d6c8b1a7
DROP POLICY
CREATE POLICY
apply_rc=0
apply_end=2026-09-11T20:53:24Z
```

### deactivate-user deploy

Command: `DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH"
supabase functions deploy deactivate-user --project-ref zkrcjzdemdmwhearhfgg`

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

Command: `DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH"
supabase functions deploy reactivate-user --project-ref zkrcjzdemdmwhearhfgg`

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

`No change found` is expected because the immediately preceding harness attempt had already
published the same tree. The post-deploy staging census was:

```
users_select_platform_admin | is_platform_admin(auth.uid())
create-user v8 updated_at=2026-09-11T19:37:35.155Z
deactivate-user v6 updated_at=2026-09-11T20:28:02.289Z
reactivate-user v5 updated_at=2026-09-11T20:28:07.940Z
```

## Browser oracle record and population controls

Before the final locator repair, the harness's authoritative frontend oracle proved that the
migration and deployments had moved the test past create, list, and detail. Its only failure was
the ambiguous role picker, while both run-scoped populations were deleted:

```
PW failed | create → list → detail → role/status, plus IDOR smoke and AR pass | Error: locator.click: Error: strict mode violation: getByRole('combobox') resolved to 4 elements
P102-07-FE wrapper_rc=1 passed=2 failed=1 accounts_left_from_this_run=0 mous_left_from_this_run=0 expected passed=3 failed=0 accounts_left=0 mous_left=0
```

The account zero is controlled by the create-user 201 plus `accounts_deleted=1`; the MoU zero is
controlled by the passing create test plus `queue_deleted=1 mous_deleted=1`. The earlier root oracle
also supplied the independent EO control and passed fully:

```
P102-07-EO wrapper_rc=0 passed=5 failed=0 rows_left_from_this_run=0 expected passed=5 failed=0 rows_left=0
PASS eo-teardown
[97-01 teardown] persons_deleted=1 dossiers_deleted=1
```

This repair then ran the frontend oracle command verbatim. This Codex sandbox cannot perform the
wrapper's pre-spawn process census, so it failed closed before Playwright and created no rows:

```
P102-07-FE wrapper_rc=90 passed=0 failed=0 accounts_left_from_this_run=0 0 mous_left_from_this_run=? expected passed=3 failed=0 accounts_left=0 mous_left=0
FAIL: user-management (1 test) and mou-create (2 tests) did not pass 3/3 - on 2026-09-10 the user-management create test timed out at 30 s before creating its account, so the teardown had no subject
```

A second direct diagnostic used the freshly built bundle but Chromium itself was denied by this
sandbox (`MachPortRendezvousServer: Permission denied (1100)`), also before tests. The temporary
static server was terminated. The plan's routing pin documents this seat limitation; the external
harness supplies the authoritative post-commit browser run.

## Static verification

`git diff --check` and ESLint for `frontend/tests/e2e/user-management.spec.ts` exited 0. The commit
hook completed the repository build. Every existing test/describe title is byte-identical to run
base `5a98e8b519a5`:

```
tests/e2e/97-elected-officials-reachable.spec.ts base_titles_sha=4e1df751e655a3a39188da1f543c0adfa81bae1f4d265b13ef1938cd026cb410 head_titles_sha=4e1df751e655a3a39188da1f543c0adfa81bae1f4d265b13ef1938cd026cb410 identical=yes
frontend/tests/e2e/user-management.spec.ts base_titles_sha=31f2f56aa8cf43fcd1658ac2460dd1fef7b9287a1d6b331a9936f0aedb6648fa head_titles_sha=31f2f56aa8cf43fcd1658ac2460dd1fef7b9287a1d6b331a9936f0aedb6648fa identical=yes
frontend/tests/e2e/mou-create.spec.ts base_titles_sha=3cbfcc96e2c932590cd0d6f3cacdfacd7ffebfa3c09cf31a62d29f69fe827bea head_titles_sha=3cbfcc96e2c932590cd0d6f3cacdfacd7ffebfa3c09cf31a62d29f69fe827bea identical=yes
```

No historical e2e-97-01 persons, older MoUs, fixture accounts, or backend integration-test rows
were deleted by this task; every teardown is limited to its own module-scoped epoch/title.
