---
phase: 102-staging-data-debt-tail
plan: 7
status: blocked
blocked_on: >-
  The deployed `create-user` edge function answers 500 EDGE_FUNCTION_ERROR after ~12 s (thrower:
  `withRateLimit` -> `req.headers.set` on Deno's immutable incoming request headers,
  supabase/functions/_shared/rate-limiter.ts:186-188). The fix and its redeploy are outside
  102-07's file scope, so user-management cannot pass and oracle 2 stays RED.
commits: [6e9be2202]
requirements: [DATA-01]
---

# 102-07 SUMMARY: E2E teardown for the three staging-writing specs

**Status is `blocked`, not `complete`, on purpose.** Two of the three legs are done and measured.
The third (user-management) cannot pass: its create step fails in the deployed backend, and no
edit inside this plan's `files_modified` can fix that. Writing `status: complete` would claim a
criterion that is measured RED.

| leg | teardown written | measured outcome |
| --- | --- | --- |
| 97-elected-officials-reachable (root, chromium-en) | yes | **oracle 1 PASS**: 5 passed, rows_left=0; teardown log `persons_deleted=1 dossiers_deleted=1` |
| mou-create (frontend, chromium) | yes | 2/2 passed, mous_left=0; teardown log `queue_deleted=1 mous_deleted=1` |
| user-management (frontend, chromium) | yes | **RED**: timed out at 30 s. The backend create fails, so the teardown had no subject (`accounts_deleted=0`) |

Oracle 2 (FE) exits 1 because user-management is RED. Its census part is clean: accounts_left=0,
mous_left=0.

## What changed (sha-pinned)

- `6e9be2202`: afterAll teardowns in all three specs (each change is described below).
- The follow-up commit that carries this SUMMARY changes comments and string-literal line breaks
  only. It adds the KNOWN RED cause comment at user-management's `waitForURL` and rewraps four added
  lines that were over 100 chars; the logged strings are unchanged. The oracles below ran on
  `6e9be2202`.

Per spec (judge truth 3):

- **97-01** (`tests/e2e/97-elected-officials-reachable.spec.ts`)
  - Module-scoped record: `const RUN_EPOCH = Date.now()` and
    `EO_NAME_PREFIX = \`e2e-97-01-elected-official-${RUN_EPOCH}\``. The create test now uses
    `const nameEn = EO_NAME_PREFIX`.
  - `test.afterAll` gets a client from `getSupabaseAdmin()`, the existing
    `tests/e2e/support/helpers/supabase-admin.ts`. That helper reads SUPABASE_URL and
    SUPABASE_SERVICE_ROLE_KEY and throws when either is unset.
  - It selects `dossiers` ids `like '<prefix>%'`, deletes `persons` in those ids, then the
    `dossiers`, and logs the counts.
- **user-management** (`frontend/tests/e2e/user-management.spec.ts`)
  - Module-scoped record: `RUN_EPOCH` and `CREATED_EMAIL = \`e2e-${RUN_EPOCH}@example.test\``. The
    test uses `const epoch = RUN_EPOCH` and `const email = CREATED_EMAIL`.
  - `test.afterAll` builds a service-role `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`
    and throws if either is missing.
  - It looks up `public.users` by that email (`public.users.id` = `auth.users.id`: FK with ON
    DELETE CASCADE, created by the `on_auth_user_created` trigger), calls
    `auth.admin.deleteUser(id)` for each match, and logs the count.
- **mou-create** (`frontend/tests/e2e/mou-create.spec.ts`)
  - Module-scoped record: `RUN_EPOCH` and `UNIQUE_TITLE = \`E2E MoU ${RUN_EPOCH}\``. The test uses
    `const uniqueTitle = UNIQUE_TITLE`.
  - `test.afterAll` builds the same kind of service-role client. It selects `mous` ids by that exact
    title, deletes `mou_notification_queue` rows `in('mou_id', ids)`, then the `mous`, and logs the
    counts. Other children cascade: FK census below.
- **Module scope is per worker** (all configs are `fullyParallel`). The afterAll that runs in the
  create test's worker holds the epoch that test used. Every other worker's afterAll matches
  nothing.
- **Titles:** every existing test title is byte-identical to base `8dcc83b00` (command 14).

## The user-management timeout: cause, measured

The planner expected a stale selector. That is not the cause. Every selector resolves: the form is
filled and submitted, as shown in the screenshot at
`frontend/test-results/e2e-user-management-User-M-a9442-plus-IDOR-smoke-and-AR-pass-chromium/test-failed-1.png`.

1. The browser POST to `/functions/v1/create-user` fails with `net::ERR_FAILED`. The console reads
   "No 'Access-Control-Allow-Origin' header is present on the requested resource". That is the
   actual request, not the preflight.
2. The mutation retries once (`frontend/src/lib/query-client.ts:58`, mutations `retry: 1`), so
   there are two POSTs about 13.4 s apart. The page toasts "Could not create the user. Try again."
   and never navigates, so `page.waitForURL(/\/users\/?$/)` runs out the 30 s test budget.
3. A server-side probe with no browser and no write sends a GET. That GET executes only
   `getCorsHeaders` and `withRateLimit` before the 405 method check. It returns
   `HTTP/2 500`, `sb-error-code: EDGE_FUNCTION_ERROR`, body `Internal Server Error`, after
   `t=12.157122s`, with no ACAO header. For comparison, OPTIONS returns 204 with ACAO in 0.48 s.
4. Between the OPTIONS branch and the 405 return, the only code that can throw is `withRateLimit`.
   `checkRateLimit` catches its own errors and fails open. `req.headers.set(...)` at
   `supabase/functions/_shared/rate-limiter.ts:186-188` does not, and create-user calls
   `withRateLimit` outside its try/catch (`supabase/functions/create-user/index.ts:132`).
5. A local Deno 2.9.5 check confirms that an incoming request's headers are immutable:
   `req.headers.set` throws `TypeError: Cannot change headers: headers are immutable`.
6. `supabase secrets list` shows no `UPSTASH*` secret (control: `ALLOWED_ORIGINS` is present). So
   the Redis client in `checkRateLimit` gets an empty URL and token. *Inference, not measured
   directly:* the ~11.7 s before the throw is that client stalling and retrying before it fails open.
7. `deactivate-user` and `reactivate-user` also call `withRateLimit`, and the spec calls both later.

**Why this is not fixed in the spec.** No spec change can make the deployed function create the
account. A longer timeout cannot help, because the function fails rather than being slow. Routing
the request or creating the account through the service role would stop the test proving FEAT-02,
which would mask the defect. The spec carries a KNOWN RED comment at the failing wait that names
the cause.

## Left for a later task (no phase-102 plan owns it)

A grep of phase-102 plans for `rate-limiter|withRateLimit|UPSTASH|create-user` matches only
`102-RESEARCH.md` (§1.4). The remedy needs an operator or overseer ruling, or a new plan.

1. In `supabase/functions/_shared/rate-limiter.ts`, stop mutating `req.headers` (lines 186-188).
   Also make `checkRateLimit` skip or fail fast when `UPSTASH_REDIS_REST_URL`/`TOKEN` are unset,
   because both are unset on staging.
2. Redeploy `create-user`, `deactivate-user` and `reactivate-user`.
3. Re-run oracle 2. On the first green run, the user-management teardown log must read
   `accounts_deleted=1`. That deleteUser path has **never run on a real subject**: 193 FKs into
   `auth.users` are not ON DELETE CASCADE, so rows written by assign-role, deactivate or reactivate
   could block `deleteUser`. The 30 s budget also has to be re-measured with five working edge
   calls in the test.

## Zeros and their controls

| zero | control proving the instrument could see a non-zero |
| --- | --- |
| EO `rows_left_from_this_run=0` | That run's teardown log: `persons_deleted=1 dossiers_deleted=1`. The row existed and the teardown removed it. The unscoped census returns `control_eo_unscoped=70`. The 2026-09-10 RED with the old spec left 1 row. |
| FE `mous_left_from_this_run=0` | Teardown log `queue_deleted=1 mous_deleted=1`; unscoped census `control_mou_unscoped=3`; the 2026-09-10 RED left 1. |
| FE `accounts_left_from_this_run=0` | **Not a teardown proof.** The account was never created (`accounts_deleted=0`, backend 500). The instrument can see auth rows (`control_auth_users_all=415`), but the zero reflects the refused create, not the teardown. |
| session census since the first run (19:10:16Z): all 0 | The EO and MoU teardown logs above show both runs created a row, so this zero comes from deletion, not absence. |
| `UPSTASH rows=0` | `control ALLOWED_ORIGINS rows=1` from the same CLI output |
| `orphan_queue_rows=0` | No positive control. This zero holds by construction: `mou_notification_queue_mou_id_fkey` is ON DELETE CASCADE. |

## Commands, in execution order, with verbatim output

Environment for every psql line: `set -a; . ./.env.test; set +a`. Output is trimmed only where
marked `…`.

**1. FKs on `mous`, `persons` -> `dossiers`, and `mou_notification_queue`** (`pg_constraint`, contype f)

```
mou_parties mou_parties_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
signature_requests signature_requests_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
mou_deliverables mou_deliverables_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
persons persons_id_fkey FOREIGN KEY (id) REFERENCES dossiers(id) ON DELETE CASCADE
mou_renewals mou_renewals_original_mou_id_fkey FOREIGN KEY (original_mou_id) REFERENCES mous(id) ON DELETE CASCADE
mou_renewals mou_renewals_renewed_mou_id_fkey FOREIGN KEY (renewed_mou_id) REFERENCES mous(id) ON DELETE SET NULL
mou_expiration_alerts mou_expiration_alerts_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
mou_version_history mou_version_history_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
mou_version_history mou_version_history_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES mous(id) ON DELETE SET NULL
mou_notification_queue mou_notification_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
mou_notification_queue mou_notification_queue_mou_id_fkey FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE
mou_notification_queue mou_notification_queue_deliverable_id_fkey FOREIGN KEY (deliverable_id) REFERENCES mou_deliverables(id) ON DELETE CASCADE
mou_notification_queue mou_notification_queue_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES deliverable_milestones(id) ON DELETE CASCADE
mou_notification_queue mou_notification_queue_renewal_id_fkey FOREIGN KEY (renewal_id) REFERENCES mou_renewals(id) ON DELETE CASCADE
government_decisions government_decisions_related_mou_id_fkey FOREIGN KEY (related_mou_id) REFERENCES mous(id) ON DELETE SET NULL
```

**2. FKs into `auth.users` that do not cascade; `public.users` FKs**

```
193
users FOREIGN KEY (created_by) REFERENCES users(id)
users FOREIGN KEY (default_organization_id) REFERENCES organizations(id)
users FOREIGN KEY (deleted_by) REFERENCES users(id)
users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
users FOREIGN KEY (updated_by) REFERENCES users(id)
PW_REUSE=[]
```

(No 5173 listener; `lsof` printed nothing.)

**3. FKs into `dossiers` or `persons` that neither cascade nor set null** (none touch an EO row)

```
impact_notifications.entity_id -> dossiers a
mous.signatory_1_dossier_id -> dossiers a
mous.signatory_2_dossier_id -> dossiers a
network_clusters.leader_dossier_id -> dossiers a
```

**4. Pre-work residue census**

```
mous cols:
id,reference_number,title,title_ar,type,mou_category,parties,… (title is the column)
E2E mous + queue rows:
a054c7c4-ea2d-4b2e-add6-f6044bc910f2 E2E MoU 1783364705954 2026-07-06 19:05:12.443725+00 q=1
4ee63ae3-2503-4cbe-85a2-682ec830c76e E2E MoU 1789065604648 2026-09-10 18:40:13.864427+00 q=1
88e921bd-be0b-4679-8ae4-5ffd3e182ab8 E2E MoU 1789151065472 2026-09-11 18:24:32.221575+00 q=1
e2e-97 dossiers total/with impact_notifications/persons:
70|0|70
auth triggers:
on_auth_user_created handle_new_user
on_auth_user_created_profile handle_new_user_profile
on_user_created create_default_notification_prefs
on_user_created_notification_prefs create_default_notification_prefs
example.test users:
0
```

The three historical MoUs and the 70 historical e2e-97-01 persons were NOT created by 102-07. They
belong to 102-06's population. `88e921bd…` (18:24Z) and the 70th person were created before this
task started, by an earlier seat.

**5. Diagnostic run** (teardown already in place): `( cd frontend && node ../scripts/pw-run-reaped.mjs -- e2e/user-management.spec.ts --project=chromium )`

```
PW_REUSE=[]
T0=2026-09-11T19:10:16Z
wrapper_rc=1
REP=…/frontend/test-results/pw-reaped-df1fd081a1a914140d659f0a2e71b0d8.json
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T19-10-56-204Z-pw-reaped-df1fd081a1a914140d659f0a2e71b0d8.json
pw-run-reaped: playwright exited code=1 signal=null; group 44650 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output …/pw-reaped-df1fd081a1a914140d659f0a2e71b0d8.json.log
```

Report parse:

```
stats {'startTime': '2026-09-11T19:10:17.201Z', 'duration': 38681.164000000004, 'expected': 0, 'skipped': 0, 'unexpected': 1, 'flaky': 0}
RESULT timedOut create → list → detail → role/status, plus IDOR smoke and AR pass dur 30492
ERRMSG Error: page.waitForURL: Test timeout of 30000ms exceeded.
waiting for navigation until "load"
>  86 |     await page.waitForURL(/\/users\/?$/)
STDERR {'text': '[user-management teardown] email=e2e-1789153824384@example.test accounts_deleted=0\n'}
```

Census after it:

```
accounts_since_T0=0 accounts_total_example_test=0 control_any_auth_users=415
```

**6. Trace of the diagnostic run** (`trace.zip` -> `*.network`, `*.trace`; showing functions and users rows)

```
2026-09-11T19:10:27.080Z GET https://zkrcjzdemdmwhearhfgg.supabase.co/rest/v1/users?select=role&id=eq.de2734cf-… 200 130
2026-09-11T19:10:27.320Z POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user -1 -1 net::ERR_FAILED
2026-09-11T19:10:40.760Z POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user -1 -1 net::ERR_FAILED
CONSOLE error Access to fetch at 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
CONSOLE error Failed to load resource: net::ERR_FAILED
CONSOLE error Access to fetch at 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
CONSOLE error Failed to load resource: net::ERR_FAILED
CONSOLE error Mutation error: FunctionsFetchError: Failed to send a request to the Edge Function
```

The screenshot shows the form fully filled (Email, Username, Full Name, Role=Editor, Clearance=2)
and the toast "Could not create the user. Try again."

**7. Server-side probe of create-user** (OPTIONS, then a GET that stops at the 405 method check; the
bearer value is not printed)

```
== OPTIONS
HTTP/2 204
access-control-allow-origin: http://localhost:5173
http=204 t=0.477946s
== GET (rate limiter runs first, then 405; no write)
HTTP/2 500
access-control-expose-headers: sb-error-code
sb-error-code: EDGE_FUNCTION_ERROR
Internal Server Error
http=500 t=12.157122s
```

**8. Functions that call `withRateLimit`; the mutation retry setting**

```
supabase/functions/create-user/index.ts
supabase/functions/deactivate-user/index.ts
supabase/functions/reactivate-user/index.ts
-----
frontend/src/lib/query-client.ts:58:    retry: 1,
```

**9. `pnpm exec eslint --no-warn-ignored <the three specs>`**: `eslint_rc=0`

**10. Local Deno check** (`deno 2.9.5`; `Deno.serve` handler calls `req.headers.set` on the incoming request)

```
incoming-request headers.set -> THROWS: TypeError: Cannot change headers: headers are immutable
```

**11. Oracle extraction** (the two `command: |-` blocks of `102-07-PLAN.md`, verbatim, to scratch files)

```
O07a 3613 bytes 8 lines
O07b 3867 bytes 8 lines
O07a_syntax_ok
O07b_syntax_ok
1
1
```

**12. Commit**: `6e9be2202 test(e2e): afterAll teardown deletes what 97-01, user-management and mou-create create (102-07)`

**13. Oracle 1 (EO), run from the repo root AFTER the work (at `6e9be2202`)**

```
O07a_exit=0
P102-07-EO wrapper_rc=0 passed=5 failed=0 rows_left_from_this_run=0 expected passed=5 failed=0 rows_left=0
PASS eo-teardown
```

**14. Test-title identity vs base `8dcc83b00`** (every `test(`/`test.describe(` title literal)

```
tests/e2e/97-elected-officials-reachable.spec.ts base_titles=6 head_titles=6 identical=yes
frontend/tests/e2e/user-management.spec.ts base_titles=2 head_titles=2 identical=yes
frontend/tests/e2e/mou-create.spec.ts base_titles=3 head_titles=3 identical=yes
```

**15. Oracle 2 (FE), run from the repo root AFTER the work (at `6e9be2202`)**

```
O07b_exit=1
  PW timedOut | create → list → detail → role/status, plus IDOR smoke and AR pass | [31mTest timeout of 30000ms exceeded.[39m
P102-07-FE wrapper_rc=1 passed=2 failed=1 accounts_left_from_this_run=0 mous_left_from_this_run=0 expected passed=3 failed=0 accounts_left=0 mous_left=0
FAIL: user-management (1 test) and mou-create (2 tests) did not pass 3/3 - on 2026-09-10 the user-management create test timed out at 30 s before creating its account, so the teardown had no subject
```

**16. Oracle 1's report: teardown log and unscoped control census**

```
EO report: test-results/pw-reaped-57225914e2fe1dc0bcf16d0bb0643a6f.json
stats {'startTime': '2026-09-11T19:14:44.210Z', 'expected': 5, 'unexpected': 0, 'skipped': 0, 'flaky': 0}
TEARDOWN-LOG | create hub + create submit — admin user  | [97-01 teardown] prefix=e2e-97-01-elected-official-1789154088224 persons_deleted=1 dossiers_deleted=1
control_eo_unscoped=70 control_mou_unscoped=3 control_auth_users_all=415
```

**17. Oracle 2's report: teardown logs, and the same create-user failure in its trace**

```
FE report: frontend/test-results/pw-reaped-9abddd738c4901ef768e6e9a8076d884.json
stats {'startTime': '2026-09-11T19:15:22.626Z', 'expected': 2, 'unexpected': 1, 'skipped': 0, 'flaky': 0}
RESULT passed | creates a MoU and shows it in the list with party names | dur 7665
  TEARDOWN-LOG | [mou-create teardown] title=E2E MoU 1789154127824 queue_deleted=1 mous_deleted=1
RESULT passed | renders the dialog in Arabic/RTL via ?lng=ar | dur 2473
RESULT timedOut | create → list → detail → role/status, plus IDOR smoke and AR | dur 30212
  TEARDOWN-LOG | [user-management teardown] email=e2e-1789154127824@example.test accounts_deleted=0
NET 2026-09-11T19:15:30.584Z POST create-user -1 net::ERR_FAILED
NET 2026-09-11T19:15:44.010Z POST create-user -1 net::ERR_FAILED
CONSOLE Access to fetch at 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user' from origin 'http://localhost:5173' has been blocked by CORS policy: No '
```

**18. Census of everything this task's runs could have created** (since the first run started)

```
since_first_run_19:10:16Z eo_dossiers=0 eo_persons=0 accounts=0 mous=0 orphan_queue_rows=0
```

**19. Leases and listener after the runs**: `.pw-leases/` empty in both dirs; no 5173 listener.

**20. Staging secrets** (`supabase secrets list --project-ref zkrcjzdemdmwhearhfgg`, names only)

```
cli_rc=0 total_lines=3
control ALLOWED_ORIGINS rows=1
UPSTASH rows=0
```

**21. After the comment and rewrap edits**: `eslint_rc=0`. The char-count scan of added lines over
100 chars found four (two comments, two `console.warn` templates), and all four were rewrapped.

## Populations

- **In scope:** rows the three specs create during a run, identified by the run's own epoch name
  (`e2e-97-01-elected-official-<epoch>`, `e2e-<epoch>@example.test`, `E2E MoU <epoch>`).
- **Outside it, not touched:**
  - the 70 historical e2e-97-01 persons and the 3 historical `E2E MoU` rows (102-06)
  - the fixture accounts (102-18)
  - backend integration creators, which already pair create and delete (research §1.4)
