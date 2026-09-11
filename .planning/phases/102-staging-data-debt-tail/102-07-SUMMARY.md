---
phase: 102-staging-data-debt-tail
plan: 7
status: blocked
blocked_on: >-
  user-management still cannot pass 1/1, so oracle 2 stays RED (2/3). The create step is fixed
  (rate-limiter.ts hunk, create-user v8, 201). The run now stops at the list search: RLS policy
  users_select_active_authenticated reads only is_active = true rows and create-user writes
  is_active:false, so the admin cannot see the account it just created. The test's later steps
  then need deactivate-user and reactivate-user redeployed, which this plan forbids (deactivate-user
  belongs to 102-03). Both need an overseer ruling or a new plan; see "Left for a later task".
commits: [87257db40, 914684a73, 488ef4ffb, 3b4eca9da]
requirements: [DATA-01]
---

# 102-07 SUMMARY: E2E teardown for the three staging-writing specs

**Status is `blocked`, not `complete`, on purpose.** Oracle 1 passes. Oracle 2 fails at 2/3, and
the remaining failure needs changes this plan does not own (an RLS policy, and two function
redeploys the plan explicitly excludes). Writing `status: complete` would claim a criterion that is
measured RED.

| leg | teardown | measured outcome, this attempt (HEAD `3b4eca9da`) |
| --- | --- | --- |
| 97-elected-officials-reachable (root, chromium-en) | yes | **oracle 1 PASS**: 5 passed, rows_left=0; teardown `persons_deleted=1 dossiers_deleted=1` |
| mou-create (frontend, chromium) | yes | 2/2 passed, mous_left=0; teardown `queue_deleted=1 mous_deleted=1` |
| user-management (frontend, chromium) | yes | create step **fixed** (201, account created). Teardown deleted it: `accounts_deleted=1`, accounts_left=0. The test **fails** at the list search (RLS, below) |

## What changed (sha-pinned)

- `87257db40`: afterAll teardowns in all three specs. This is the prior attempt's `6e9be2202`,
  replayed onto this branch (`git patch-id --stable` equal: `bbacacc89cef…`).
- `914684a73`: the prior attempt's SUMMARY plus comment and line-wrap edits. This is its
  `ca70c277a` (patch-id equal: `03247785171d…`).
- `488ef4ffb`: `supabase/functions/_shared/rate-limiter.ts`. It deletes the three
  `req.headers.set` calls at :186-188 and the comment above them. Nothing else in that file
  changes:

  ```diff
  @@ -182,10 +182,5 @@ export async function withRateLimit(
       return createRateLimitResponse(result, corsHeaders);
     }

  -  // Add rate limit headers to successful requests
  -  req.headers.set("X-RateLimit-Limit", String(config.maxRequests));
  -  req.headers.set("X-RateLimit-Remaining", String(result.remaining));
  -  req.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
  -
     return null; // No error, proceed with request
   }
  ```

- `3b4eca9da`: comments only, in `user-management.spec.ts`. It replaces the stale KNOWN RED at the
  create wait with the named cause and fix, and adds a KNOWN RED at the list search that names the
  RLS policy.

Per spec (judge truth 3):

- **97-01** (`tests/e2e/97-elected-officials-reachable.spec.ts`)
  - Module-scoped record: `const RUN_EPOCH = Date.now()` and
    `EO_NAME_PREFIX = \`e2e-97-01-elected-official-${RUN_EPOCH}\``. The create test uses
    `const nameEn = EO_NAME_PREFIX`.
  - `test.afterAll` gets a client from `getSupabaseAdmin()`, the existing
    `tests/e2e/support/helpers/supabase-admin.ts`. That helper reads SUPABASE_URL and
    SUPABASE_SERVICE_ROLE_KEY and throws when either is unset.
  - It selects `dossiers` ids `like '<prefix>%'`, deletes `persons` in those ids, then the
    `dossiers`, and logs the counts.
- **user-management** (`frontend/tests/e2e/user-management.spec.ts`)
  - Module-scoped record: `RUN_EPOCH` and `CREATED_EMAIL = \`e2e-${RUN_EPOCH}@example.test\``.
  - `test.afterAll` builds a service-role `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`
    and throws if either is missing.
  - It looks up `public.users` by that email and calls `auth.admin.deleteUser(id)` for each match.
    This path has now run on a real subject twice (commands 7 and 15 below): `accounts_deleted=1`
    both times.
- **mou-create** (`frontend/tests/e2e/mou-create.spec.ts`)
  - Module-scoped record: `RUN_EPOCH` and `UNIQUE_TITLE = \`E2E MoU ${RUN_EPOCH}\``.
  - `test.afterAll` deletes `mou_notification_queue` rows `in('mou_id', ids)`, then the `mous`, and
    logs the counts.
- **Titles:** every `test(` / `test.describe(` title is byte-identical to run base `981f3a1a2`
  (command 13).

## The create-step timeout: cause, fix, deploy

**Cause** (att2 diagnosis, confirmed again here): `withRateLimit` called `req.headers.set` on
Deno's immutable incoming request headers. create-user calls it outside its try/catch
(`supabase/functions/create-user/index.ts:132`), so every non-OPTIONS request answered
`500 EDGE_FUNCTION_ERROR` after ~12 s with no CORS header. The browser saw a CORS failure, and
`page.waitForURL` used up the 30 s budget.

**Fix:** the `488ef4ffb` hunk above. There is no timeout change and no create-user edit.

**Deploy** (command 4; taken BEFORE both oracle runs): exit 0, 19:37:29Z to 19:37:37Z, from HEAD
`488ef4ffb`. create-user went from v7 (2026-08-16T15:39:11Z) to v8 (2026-09-11T19:37:35Z). The only
commit touching create-user or its `_shared` imports (cors, rate-limiter, logger, audit) since v7
is `488ef4ffb` (command 17), so v8 differs from v7 by this hunk alone.

**Effect, measured with the same no-write GET probe before and after:**

| create-user | status | CORS header | time |
| --- | --- | --- | --- |
| v7, before (19:35:24Z) | 500 EDGE_FUNCTION_ERROR | absent | 12.63 s |
| v8, after (19:38:13Z) | 405 METHOD_NOT_ALLOWED (the fn's own method check, reached) | `http://localhost:5173` | 14.83 s |

In the browser, `POST /functions/v1/create-user` now answers **201** and the page navigates to
`/users` (command 7, trace).

**Other `withRateLimit` importers, left un-redeployed** (`grep -l withRateLimit
supabase/functions/*/index.ts`). Both still carry the defect on staging, and redeploying them is
not this task's:

| function | staging version | probe before this task's deploy | note |
| --- | --- | --- | --- |
| `deactivate-user` | v5, 2026-09-11T18:46:18Z | 500 EDGE_FUNCTION_ERROR, 12.90 s | owned by 102-03 (`files_modified`). 102-03's `fa4ba94b0` is **not** in this tree (0 `permission_delegations` refs, 3 `from('delegations')`), so a redeploy from here would roll 102-03's staging change back |
| `reactivate-user` | v4, 2026-08-16T15:40:28Z | 500 EDGE_FUNCTION_ERROR, 12.26 s | no phase-102 owner |

## Why user-management still fails (measured, in order of the test)

1. **B1, the list search, measured.** After the 201, the admin's search for the exact email
   (`or=(email.ilike.%<email>%,…)`) returns `content-range */0`. The row exists, because the
   service-role teardown found and deleted it (`accounts_deleted=1`) both times. The only SELECT
   policies on `public.users` are `users_select_active_authenticated` (`authenticated AND
   is_active = true`), `users_select_self` and `users_select_service_role`. create-user writes
   `is_active: false` (`create-user/index.ts:376`). So an admin cannot read any freshly created
   account, in the list or on `/users/:id`. The spec comment at :90 ("the DEFAULT filter is 'all',
   so the row is visible") assumes a policy that does not exist. None of the 415 existing rows is
   inactive (command 11), which is why the list never showed the gap before.
2. **B2, the deactivate button, derived from code and not reached.** `UserDetailPage.tsx:316-351`
   renders "Deactivate User" only when `is_active === true`, and "Reactivate User" otherwise. A
   created account is inactive, so the spec's Deactivate-then-Reactivate order cannot hold even
   once B1 is fixed. The order has to become Reactivate then Deactivate, or the account has to be
   created active.
3. **B3, the status flips, measured by probe.** `deactivate-user` and `reactivate-user` answer 500
   at the limiter until they are redeployed (table above).
4. **B4, the time budget, measured.** Every `withRateLimit` call still stalls about 13-16 s before
   failing open, because no `UPSTASH_*` secret exists on staging (att2 command 20). The GET probe
   took 14.8 s, and in the trace the POST started at 19:38:58.526 with the next request at
   19:39:14.474. Create, deactivate and reactivate together take about 45 s against the 30 s
   default. Once B1-B3 are fixed, the test needs either a `test.setTimeout` that names this cause,
   or `checkRateLimit` failing fast when the Upstash env is unset.

No spec edit can fix B1 or B3, and B2 and B4 cannot be verified until they are. Routing the create
through the service role, or skipping the status steps, would stop the test proving FEAT-02/03 and
mask the defects. So the spec carries comments that name them, and nothing else.

## Left for a later task (needs an overseer ruling or a new plan)

1. **B1:** a migration adding an admin SELECT policy on `public.users` that covers inactive rows
   (or a product decision that created accounts start active). This is outside `files_modified`.
2. **B3:** redeploy `deactivate-user` and `reactivate-user` from a tree that carries both
   `488ef4ffb` and 102-03's `fa4ba94b0`. Until then, any redeploy of either function from a tree
   without `488ef4ffb` keeps the 500.
3. **B2 + B4:** then reorder the spec's status steps and re-measure the budget. Re-run oracle 2:
   the first green run must show `accounts_deleted=1` again.
4. Optional, P100-class: `checkRateLimit` still builds a Redis client from empty URL/token on
   every call. Setting the `UPSTASH_*` secrets or failing fast removes the ~15 s stall on all three
   functions.

## Zeros and their controls

| zero | control proving the instrument could see a non-zero |
| --- | --- |
| EO `rows_left_from_this_run=0` (oracle 1) | Teardown log `persons_deleted=1 dossiers_deleted=1`: the row existed and was removed. Unscoped census `control_eo_unscoped=70` |
| FE `mous_left_from_this_run=0` (oracle 2) | Teardown log `queue_deleted=1 mous_deleted=1`; unscoped `control_mou_unscoped=3` |
| FE `accounts_left_from_this_run=0` (oracle 2) | **This attempt, a real teardown proof.** The account was created (201) and deleted: `accounts_deleted=1`. The instrument sees auth rows: `control_auth_users_all=415` |
| diagnostic `accounts_since_T0=0` (command 7) | Same run's teardown log: `accounts_deleted=1` |
| session census since 19:38:49Z, all 0 (command 16) | The three runs' teardown logs show 1 account (diag), 1 EO row (oracle 1), and 1 account + 1 MoU (oracle 2) created, so these zeros come from deletion, not absence |
| `inactive_or_null=0` in public.users (command 11) | Not a proof of anything about RLS; it only explains why the gap was invisible. The discriminating evidence for B1 is `*/0` for a row the service role then found |
| leases 0/0, in-worktree processes 0 (command 18) | `candidates=10`: the pid census saw ten playwright/vite/wrapper processes machine-wide and none had cwd in this worktree. The diagnostic run's wrapper verdict was `finalZero:true … verdict clean` |

## Commands this attempt ran, in execution order, with verbatim output

Environment for every psql/curl line: `set -a; . ./.env.test; set +a`, from the worktree root.
The bearer in the probes is the anon key and is never printed.

**1. `withRateLimit` importers and call sites**

```
supabase/functions/create-user/index.ts
supabase/functions/deactivate-user/index.ts
supabase/functions/reactivate-user/index.ts
supabase/functions/create-user/index.ts:132:  const rateLimitResponse = await withRateLimit(req, ADMIN_RATE_LIMIT, corsHeaders)
supabase/functions/deactivate-user/index.ts:54:  const rateLimitResponse = await withRateLimit(req, ADMIN_RATE_LIMIT, corsHeaders)
supabase/functions/reactivate-user/index.ts:28:  const rateLimitResponse = await withRateLimit(req, ADMIN_RATE_LIMIT, corsHeaders)
(try { opens at create-user:150, deactivate-user:59, reactivate-user:33, all after the call)
```

Frontend: `user-management-api.ts:261/290/319/348` invoke `create-user`, `assign-role`,
`deactivate-user`, `reactivate-user`.

**2. Staging versions before the deploy** (`supabase functions list`, parsed)

```
assign-role v6 2026-08-16T15:38:11.612000Z verify_jwt=True
create-user v7 2026-08-16T15:39:11.444000Z verify_jwt=True
deactivate-user v5 2026-09-11T18:46:18.428000Z verify_jwt=True
reactivate-user v4 2026-08-16T15:40:28.793000Z verify_jwt=True
```

**3. No-write GET probe before the deploy** (`scratchpad/probe.sh create-user deactivate-user reactivate-user`)

```
== create-user GET @ 2026-09-11T19:35:24Z
http=500 t=12.632163s
HTTP/2 500
sb-error-code: EDGE_FUNCTION_ERROR
Internal Server Error
== deactivate-user GET @ 2026-09-11T19:35:37Z
http=500 t=12.899641s
HTTP/2 500
sb-error-code: EDGE_FUNCTION_ERROR
Internal Server Error
== reactivate-user GET @ 2026-09-11T19:35:50Z
http=500 t=12.259422s
HTTP/2 500
sb-error-code: EDGE_FUNCTION_ERROR
Internal Server Error
```

**4. Commit `488ef4ffb`, then the create-user deploy** (the deploy was gated on
`git show HEAD:…/rate-limiter.ts | grep -c req.headers.set` = 0). Command, as the plan gives it:
`DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase functions deploy create-user --project-ref zkrcjzdemdmwhearhfgg`

```
commit_rc=0
HEAD=488ef4ffb fix(edge): withRateLimit stops mutating Deno's immutable incoming request headers (102-07)
req.headers.set at HEAD: 0
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

**5. 102-03 ownership check**

```
.planning/phases/102-staging-data-debt-tail/102-03-PLAN.md:8:  - supabase/functions/{my-delegations,delegate-permissions,revoke-delegation,deactivate-user}/index.ts
permission_delegations refs in worktree deactivate-user: 0
delegations refs: 3
fa4ba94b0 fix(delegations): use permission delegation records   (git log --all; not on this branch)
```

**6. Versions and probe after the deploy**

```
create-user v8 2026-09-11T19:37:35Z
deactivate-user v5 2026-09-11T18:46:18Z
reactivate-user v4 2026-08-16T15:40:28Z
== create-user GET @ 2026-09-11T19:38:13Z
http=405 t=14.834881s
HTTP/2 405
access-control-allow-origin: http://localhost:5173
{"error":"Method not allowed","code":"METHOD_NOT_ALLOWED"}
```

**7. Diagnostic run** (`scratchpad/run-fe.sh e2e/user-management.spec.ts --project=chromium`: the
reaped wrapper from `frontend/`, then report parse and census)

```
T0=2026-09-11T19:38:49Z
wrapper_rc=1 REP=frontend/test-results/pw-reaped-d26ee857b2c9241ddb25afdf75de7243.json
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T19-39-21-625Z-pw-reaped-d26ee857b2c9241ddb25afdf75de7243.json
pw-run-reaped: playwright exited code=1 signal=null; group 41885 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output …/pw-reaped-d26ee857b2c9241ddb25afdf75de7243.json.log
stats {'startTime': '2026-09-11T19:38:49.713Z', 'duration': 31717.233, 'expected': 0, 'skipped': 0, 'unexpected': 1, 'flaky': 0}
RESULT failed | create → list → detail → role/status, plus IDOR smoke and AR pass | dur 24407
  ERR Error: expect(locator).toBeVisible() failed //  // Locator: getByText('e2e-1789155535441@example.test').first() // Expected: visible // Timeout: 5000ms // Error: element(s) not found // …
  TEARDOWN-LOG [user-management teardown] email=e2e-1789155535441@example.test accounts_deleted=1
accounts_since_T0=0 mous_since_T0=0 control_auth_users_all=415
```

Screenshot (`test-failed-1.png`): Users List, search box holding the email, "Showing 1-0 of 0 users".

**8. Trace of the diagnostic run** (`trace.zip` -> `*.network`, users and functions rows)

```
19:38:57.388 206 users?select=id,email,username,…&deleted_by=is.null&order=created_at.desc&offset=0&limit=25
    content-range 0-24/415
19:38:58.526 POST /functions/v1/create-user 201
19:39:14.474 GET /rest/v1/users?select=role&id=eq.de2734cf-… 200
19:39:14.703 200 users?select=id,email,username,…&deleted_by=is.null&order=created_at.desc&or=(email.ilike.%e2e-1789155535441@example.test%,username.ilike.%…%,full_name.ilike.%…%,name_en.ilike.%…%,name_ar.ilike.%…%)&offset=0&limit=25
    content-range */0
    body_len 2 has_e2e_email False
```

**9. `public.users` SELECT policies and the admin's own row**

```
POLICY users_select_active_authenticated | SELECT | roles=public | USING ((auth.role() = 'authenticated'::text) AND (is_active = true))
POLICY users_select_self | SELECT | roles=public | USING (auth.uid() = id)
POLICY users_select_service_role | SELECT | roles=public | USING (auth.role() = 'service_role'::text)
ADMIN_ROW role=admin is_active=true default_org=b0000000-0000-0000-0000-00000000aaaa deleted_by=null
ERROR:  aggregate functions are not allowed in GROUP BY
```

(The third query in that batch was malformed; it was not needed and was not re-run.)

**10. What create-user writes; the detail page's status branch**

```
supabase/functions/create-user/index.ts:376:        is_active: false,
frontend/src/pages/users/UserDetailPage.tsx:316  {isActive ? (<AlertDialog> … "Deactivate User" …) : (<Button> "Reactivate User")}
frontend/src/i18n/en/user-management.json:117/118  "deactivate": "Deactivate User" / "reactivate": "Reactivate User"
```

**11. Active vs inactive rows in `public.users`**

```
public_users_not_deleted=415 active=415 inactive_or_null=0
```

**12. Oracle extraction** (the two `command: |-` blocks of `102-07-PLAN.md`, verbatim, to scratch)

```
O07a 3614 bytes 8 lines
O07b 3868 bytes 8 lines
O07a_syntax_ok
O07b_syntax_ok
1
1
```

**13. Commit `3b4eca9da` (comments only) and title identity vs run base `981f3a1a2`**

```
== added lines >100 chars: 0
commit_rc=0
tests/e2e/97-elected-officials-reachable.spec.ts base_titles=6 head_titles=6 identical=yes
frontend/tests/e2e/user-management.spec.ts base_titles=2 head_titles=2 identical=yes
frontend/tests/e2e/mou-create.spec.ts base_titles=3 head_titles=3 identical=yes
```

**14. Oracle 1 (EO), run from the worktree root AFTER the work** (HEAD `3b4eca9da`; no 5173
listener, PW_REUSE unset)

```
O07a_start=2026-09-11T19:43:50Z
P102-07-EO wrapper_rc=0 passed=5 failed=0 rows_left_from_this_run=0 expected passed=5 failed=0 rows_left=0
PASS eo-teardown
O07a_exit=0
```

**15. Oracle 2 (FE), run from the worktree root AFTER the work**

```
O07b_start=2026-09-11T19:44:17Z
  PW failed | create → list → detail → role/status, plus IDOR smoke and AR pass | Error: expect(locator).toBeVisible() failed  Locator: getByText('e2e-1789155867690@example.test').first() Expected: visible Timeout: 5000ms Error: element
P102-07-FE wrapper_rc=1 passed=2 failed=1 accounts_left_from_this_run=0 mous_left_from_this_run=0 expected passed=3 failed=0 accounts_left=0 mous_left=0
FAIL: user-management (1 test) and mou-create (2 tests) did not pass 3/3 - on 2026-09-10 the user-management create test timed out at 30 s before creating its account, so the teardown had no subject
O07b_exit=1 end=2026-09-11T19:44:52Z
```

The oracle's FAIL text describes the 2026-09-10 cause. This run failed at a later step, after the
account had been created (see the teardown log in 16).

**16. Both oracle reports, and the census since this session's first run**

```
== report test-results/pw-reaped-c4ac6857ec90f68796ce3c6428d77e69.json
stats startTime=2026-09-11T19:43:51.673Z expected=5 unexpected=0 skipped=0 flaky=0
RESULT passed | sidebar row — admin user (the only session these specs have), desktop 1400 | dur 9039
RESULT passed | hub type card — admin user (the only session these specs have), desktop 1400 | dur 9741
RESULT passed | hub type card click destination — admin user (the only session these specs have), desktop 1400 | dur 9465
RESULT passed | compare selector — admin user (the only session these specs have), desktop 1400 | dur 9368
RESULT passed | create hub + create submit — admin user (the only session these specs have), desktop 1400 | dur 14661
  TEARDOWN-LOG [97-01 teardown] prefix=e2e-97-01-elected-official-1789155837045 persons_deleted=1 dossiers_deleted=1
== report frontend/test-results/pw-reaped-46679d385ea7a1e50ee87cdc47611927.json
stats startTime=2026-09-11T19:44:18.325Z expected=2 unexpected=1 skipped=0 flaky=0
RESULT passed | creates a MoU and shows it in the list with party names | dur 8206
  TEARDOWN-LOG [mou-create teardown] title=E2E MoU 1789155867690 queue_deleted=1 mous_deleted=1
RESULT passed | renders the dialog in Arabic/RTL via ?lng=ar | dur 2990
RESULT failed | create → list → detail → role/status, plus IDOR smoke and AR pass | dur 22328
  ERR Error: expect(locator).toBeVisible() failed //  // Locator: getByText('e2e-1789155867690@example.test').first() // Expected: visible // Timeout: 5000ms // Error: element(s) not found // …
  TEARDOWN-LOG [user-management teardown] email=e2e-1789155867690@example.test accounts_deleted=1
since_session_first_run_2026-09-11T19:38:49Z eo_dossiers=0 accounts=0 mous=0 orphan_queue_rows=0
control_eo_unscoped=70 control_mou_unscoped=3 control_auth_users_all=415 example_test_accounts_all=0
5173_after=[0]
```

**17. Commits to create-user or its `_shared` imports since the v7 deploy**

```
488ef4ffb 2026-09-11T22:36:53+03:00 fix(edge): withRateLimit stops mutating Deno's immutable incoming request headers (102-07)
(end)
```

**18. Leases and processes after the runs**

```
.pw-leases entries=0
frontend/.pw-leases entries=0
candidates=10 in_worktree=0
```

## Attempt 2 record (prior seat, 2026-09-11 19:10Z-19:21Z, at `6e9be2202`), kept

- **FK census** (`pg_constraint`): all `mous` children cascade, or set null
  (`mou_parties`, `signature_requests`, `mou_deliverables`, `mou_renewals`,
  `mou_expiration_alerts`, `mou_version_history`, `mou_notification_queue`,
  `government_decisions`). `persons_id_fkey` is `ON DELETE CASCADE` to `dossiers`.
  `public.users.id` references `auth.users(id) ON DELETE CASCADE`. 193 FKs into `auth.users` do
  not cascade; none blocked the two real `deleteUser` calls above.
- **FKs into `dossiers`/`persons` that neither cascade nor set null:**
  `impact_notifications.entity_id`, `mous.signatory_{1,2}_dossier_id`,
  `network_clusters.leader_dossier_id`. None touches an EO row (`with impact_notifications = 0`).
- **Pre-work residue:** 3 historical `E2E MoU` rows (2026-07-06, 2026-09-10, 2026-09-11 18:24Z)
  and 70 historical e2e-97-01 persons. These belong to 102-06's population and were not created
  by 102-07. There were 0 `@example.test` users.
- **Auth triggers:** `on_auth_user_created handle_new_user`,
  `on_auth_user_created_profile handle_new_user_profile`, and two
  `create_default_notification_prefs` triggers.
- **att2 oracle 1:** `O07a_exit=0`, `PASS eo-teardown`, teardown `persons_deleted=1
  dossiers_deleted=1`.
- **att2 oracle 2:** `O07b_exit=1`. user-management timed out at the create wait (the 500 described
  above), and the teardown ran `accounts_deleted=0`.
- **Local Deno 2.9.5 check:** `req.headers.set` on an incoming `Deno.serve` request throws
  `TypeError: Cannot change headers: headers are immutable`.
- **Staging secrets** (names only): `ALLOWED_ORIGINS` present, `UPSTASH` rows=0.
- **Mutation retry:** `frontend/src/lib/query-client.ts:58: retry: 1`.
- **eslint** on the three specs: `eslint_rc=0`.

The full verbatim att2 log is at `git show 914684a73:.planning/phases/102-staging-data-debt-tail/102-07-SUMMARY.md`.

## Populations

- **In scope:** rows the three specs create during a run, identified by the run's own epoch name
  (`e2e-97-01-elected-official-<epoch>`, `e2e-<epoch>@example.test`, `E2E MoU <epoch>`).
- **Outside it, not touched:**
  - the 70 historical e2e-97-01 persons and the 3 historical `E2E MoU` rows (102-06)
  - the fixture accounts (102-18)
  - backend integration creators, which already pair create and delete (research §1.4)
  - the staging versions of `deactivate-user` and `reactivate-user` (not redeployed; see above)
- `graphify update .` was not run. It writes `graphify-out/`, which is outside this task's file
  scope.
