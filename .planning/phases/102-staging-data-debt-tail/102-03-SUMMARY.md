---
status: complete
task: P102-03
completed_at: 2026-09-11T19:08:36Z
---

# P102-03 execution summary

All four delegation edge functions now use `public.permission_delegations`, the idempotent seed has been applied twice to staging, and every function was deployed. The deployed `my-delegations` handler returns the three rows split as two granted and one received; its active-only response returns the two active rows.

`my-delegations` carries the required `grantor:users!grantor_id(email)` and `grantee:users!grantee_id(email)` embeds from `public.users`. Because staging's identity FKs do not currently expose that PostgREST relationship, a `PGRST200` compatibility path reselects only base delegation columns and resolves the missing emails from `public.users`; the response never reads an authentication-schema email relation.

## Commits

```text
2140373c1 fix(delegations): use permission delegation records
63ae7b087 chore(seed): add permission delegation examples
2df940865 fix(delegations): resolve public user emails separately
8a6583fca docs(phase-102): record successful delegation rollout
c340f4e62 fix(delegations): embed public user emails
```

## Local verification

`npx eslint supabase/functions/my-delegations/index.ts`

```text
exit 0
```

`git diff --check`

```text
exit 0
```

The commit hook also ran the repository build (`turbo run build`) successfully. Static relation census:

```text
phantom=0
permission_delegations=9
my-delegations=2
delegate-permissions=2
revoke-delegation=2
deactivate-user=3
exit 0
```

The diff carries changes in all four functions. `my-delegations` selects neither `source` nor an active-flag column; it derives `is_active` as `!revoked && now >= valid_from && now <= valid_until`, emits `source: "permission"`, and filters active-only rows using `revoked` and `valid_until`. Its two P93 `QUERY_FAILED` 500 branches are unchanged. The other three functions use `valid_until`, `revoked`, `revoked_at`, and `revoked_by` rather than active-flag writes.

## Seed applies (before deploys and oracles)

Command: `PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/070-p102-permission-delegations.sql`, run twice.

```text
SEED_APPLY_1_START 2026-09-11T19:05:35Z
DO
SEED_APPLY_1_EXIT 0
SEED_APPLY_1_END 2026-09-11T19:05:36Z
SEED_APPLY_2_START 2026-09-11T19:05:36Z
DO
SEED_APPLY_2_EXIT 0
SEED_APPLY_2_END 2026-09-11T19:05:37Z
COMMAND_EXIT 0
```

The second successful application proves the deterministic three-id delete-and-insert seed is idempotent.

## Deploy outputs (before oracle run)

Each command used `DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase functions deploy <slug> --project-ref zkrcjzdemdmwhearhfgg`.

```text
DEPLOY_my-delegations_START 2026-09-11T19:08:19Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: my-delegations
Deploying Function: my-delegations (script size: 735 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["my-delegations"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_my-delegations_EXIT 0
DEPLOY_my-delegations_END 2026-09-11T19:08:27Z

DEPLOY_delegate-permissions_START 2026-09-11T19:08:27Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: delegate-permissions
No change found in Function: delegate-permissions
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["delegate-permissions"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_delegate-permissions_EXIT 0
DEPLOY_delegate-permissions_END 2026-09-11T19:08:30Z

DEPLOY_revoke-delegation_START 2026-09-11T19:08:30Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: revoke-delegation
No change found in Function: revoke-delegation
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["revoke-delegation"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_revoke-delegation_EXIT 0
DEPLOY_revoke-delegation_END 2026-09-11T19:08:33Z

DEPLOY_deactivate-user_START 2026-09-11T19:08:33Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: deactivate-user
No change found in Function: deactivate-user
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["deactivate-user"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_deactivate-user_EXIT 0
DEPLOY_deactivate-user_END 2026-09-11T19:08:36Z
COMMAND_EXIT 0
```

## Post-deploy oracles

### Deployed `my-delegations`

The plan's password-grant/JWT oracle was run after all deploys (temporary response files were retained under `/private/tmp` because the managed harness rejects explicit `rm -f`):

```text
  BODY {"granted":[{"id":"b3ea1d69-38e3-4ea5-91aa-e65b04d54e8f","grantor_id":"de2734cf-f962-4e05-bf62-bc9e92efff96","grantor_email":"kazahrani@stats.gov.sa","grantee_id":"c2a93eff-ba3a-4aba-9037-da00965828d9
P102-03-HTTP http=200 granted=2 received=1 total=3 expected http=200 granted>=1 received>=1 total=3
P102-03-ACTIVE http=200 total=2 revoked_or_inactive_rows=0 expected http=200 total=2 revoked_or_inactive_rows=0
PASS my-delegations
EXIT 0
```

### Seed census

The plan command uses POSIX word splitting, so it was run under bash. An earlier zsh invocation returned the correct SQL payload (`1 1 1 3`) as one positional argument and consequently failed only its shell parsing; the bash result is the operative oracle.

```text
P102-03-SEED granted_active=1 received_active=1 revoked=1 total=3 expected 1 1 1 3
PASS seed
EXIT 0
```

### Deploy versions

```text
P102-03-DEPLOY advanced=4/4 my-delegations=6(>3) delegate-permissions=6(>5) revoke-delegation=6(>5) deactivate-user=5(>4) expected advanced=4/4 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
EXIT 0
```

## Anon table-grant observation

P100-class observation, intentionally not repaired in this task. The staging role-grant query returned:

```text
anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
EXIT 0
```

Thus `anon` still has full DML on `public.permission_delegations`; remediation remains owned by the P100 security-posture work rather than this scoped delegation repair.
