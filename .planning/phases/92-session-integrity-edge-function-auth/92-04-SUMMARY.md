---
phase: 92-session-integrity-edge-function-auth
plan: 04
subsystem: auth
tags: [supabase, edge-functions, deno, jwt, gotrue, rls, jsr, staging-deploy]

requires:
  - phase: 92-01
    provides: scripts/probe-edge-auth.sh + 92-PROBE-BASELINE.md (the pre-migration 401s this closes against)
provides:
  - audit-logs-viewer, data-retention, field-permissions, my-delegations migrated to jsr:@supabase/supabase-js@2 + getUser(token) and DEPLOYED to staging
  - _shared/auth.ts off the 2.39.3 pin (D-06), with 6 of its 10 importers redeployed to re-bundle it
  - 92-DEPLOY-LEDGER.md — the phase's resumable deploy record, started here for 92-09 to append to
  - measured post-deploy probe flip - 401/401/401/401 -> 500/500/200/200 (all four past the getUser gate)
  - RLS-scoping proof - field-permissions returns 19/19 DB rows through the header-injected client
affects: [92-05, 92-06, 92-07, 92-08, 92-09, phase-93-trust]

tech-stack:
  added: []
  patterns:
    - 'Class-1 edit - jsr specifier + explicit token, header-injected client untouched'
    - 'Deploy ledger as the resumable record for multi-plan staging deploys'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-DEPLOY-LEDGER.md
  modified:
    - supabase/functions/audit-logs-viewer/index.ts
    - supabase/functions/data-retention/index.ts
    - supabase/functions/field-permissions/index.ts
    - supabase/functions/my-delegations/index.ts
    - supabase/functions/_shared/auth.ts

key-decisions:
  - 'D-20 handoff CORRECTED by measurement - field-permissions is genuinely known-closed for Phase 93 (200 + 19/19 rows); data-retention is NOT — its auth is fixed but it 500s on a pre-existing data-layer permission error'
  - 'The three pre-existing data-layer defects newly exposed by the auth fix were NOT fixed here — they are outside this plan files_modified and outside AUTH-02/AUTH-04 auth scope'

patterns-established:
  - 'RLS survival is proven by row COUNT against the DB, not by a 200 — 19 in the table, 19 through the function'

requirements-completed: [AUTH-02, AUTH-04]

duration: 12 min
completed: 2026-08-15
---

# Phase 92 Plan 04: Confirmed-Broken Edge-Function Auth Core Summary

**The four functions with observed 401s now accept a valid session JWT on deployed staging — migrated to `jsr:@supabase/supabase-js@2` + `getUser(token)`, header-injected client intact, proven by 19/19 rows through `field-permissions` and by a probe flip off 401 on all four.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-15T10:21:40Z
- **Completed:** 2026-08-15T10:33:40Z
- **Tasks:** 2 / 2
- **Files modified:** 5 source + 1 planning artifact created

## Task 1 — Class-1 edits on 4 functions + Class-3 bump on `_shared/auth.ts`

**Commit `52331903`** — `fix(92-04): migrate confirmed-broken core to jsr @2 + getUser(token)`
(5 files changed, 13 insertions, 9 deletions)

What landed, per file:

| File                         | Specifier before                              | Specifier after               | Auth call                                | Injected client |
| ---------------------------- | --------------------------------------------- | ----------------------------- | ---------------------------------------- | --------------- |
| `audit-logs-viewer/index.ts` | `https://esm.sh/@supabase/supabase-js@2.39.0` | `jsr:@supabase/supabase-js@2` | `getUser()` -> `getUser(token)` at :386  | intact at :376  |
| `data-retention/index.ts`    | `https://esm.sh/@supabase/supabase-js@2.39.0` | `jsr:@supabase/supabase-js@2` | `getUser()` -> `getUser(token)` at :92   | intact at :82   |
| `field-permissions/index.ts` | `https://esm.sh/@supabase/supabase-js@2.39.0` | `jsr:@supabase/supabase-js@2` | `getUser()` -> `getUser(token)` at :180  | intact at :170  |
| `my-delegations/index.ts`    | `https://esm.sh/@supabase/supabase-js@2.39.0` | `jsr:@supabase/supabase-js@2` | `getUser()` -> `getUser(token)` at :107  | intact at :97   |
| `_shared/auth.ts`            | `https://esm.sh/@supabase/supabase-js@2.39.3` | `jsr:@supabase/supabase-js@2` | already `getUser(token)` — **unchanged** | n/a             |

Each function got exactly one added line (`const token = authHeader.replace('Bearer ', '')`, in that
file's own quote/semicolon style) plus the `getUser(token)` argument. `_shared/auth.ts` is a
one-line pin bump; `validateJWT`'s logic was not touched (D-06). No CORS import, no `config.toml`,
no error idiom, and no service-role client was modified. The pre-existing `supabaseAdmin`
service-role client at `my-delegations/index.ts:81` was left exactly as found.

### The criterion no gate checks — measured, not assumed

Per-file `Authorization: authHeader` site counts, re-derived against `phase-92-base`:

```
supabase/functions/audit-logs-viewer/index.ts base=1 now=1
supabase/functions/data-retention/index.ts base=1 now=1
supabase/functions/field-permissions/index.ts base=1 now=1
supabase/functions/my-delegations/index.ts base=1 now=1
```

No decrease. And the diffstat is minimal — 5 files, `13 insertions(+), 9 deletions(-)` — which is
the shape of a specifier+token edit and nothing else.

### GATE — Task 1 `<automated>` (run verbatim, from repo root)

```
for d in supabase/functions/audit-logs-viewer supabase/functions/data-retention supabase/functions/field-permissions supabase/functions/my-delegations; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && [ -f supabase/functions/_shared/auth.ts ] && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions/audit-logs-viewer supabase/functions/data-retention supabase/functions/field-permissions supabase/functions/my-delegations supabase/functions/_shared/auth.ts | wc -l)" -eq 0 && test "$(grep -l 'getUser(token)' supabase/functions/audit-logs-viewer/index.ts supabase/functions/data-retention/index.ts supabase/functions/field-permissions/index.ts supabase/functions/my-delegations/index.ts | wc -l)" -eq 4 && test "$(grep -rl 'Authorization: authHeader' supabase/functions/audit-logs-viewer/index.ts supabase/functions/data-retention/index.ts supabase/functions/field-permissions/index.ts supabase/functions/my-delegations/index.ts | wc -l)" -eq 4
```

Verbatim output: _(the gate is a pure test-chain; it prints nothing on success)_

```
EXIT=0
```

**Exit code: 0. Verdict: PASS.** Re-run after HEAD moved (plans 92-02 and 92-05 committed onto the
shared tree between my two commits) — still `TASK1_GATE_EXIT=0`.

## Task 2 — Deploy core + non-population helper importers; prove the flip

**Commit `915fcd41`** — `docs(92-04): staging deploy ledger + post-deploy probe flip`
(1 file changed, 84 insertions)

Ten named-function deploys against `zkrcjzdemdmwhearhfgg`, one at a time, never bare
`supabase functions deploy`. Every one printed
`Deployed Functions on project zkrcjzdemdmwhearhfgg: <name>` and `EXIT=0`:

| #   | Function                      | Deployed (UTC)       | Result |
| --- | ----------------------------- | -------------------- | ------ |
| 1   | audit-logs-viewer             | 2026-08-15T10:29:21Z | OK     |
| 2   | data-retention                | 2026-08-15T10:29:31Z | OK     |
| 3   | field-permissions             | 2026-08-15T10:29:37Z | OK     |
| 4   | my-delegations                | 2026-08-15T10:29:44Z | OK     |
| 5   | auth-biometric-setup          | 2026-08-15T10:29:53Z | OK     |
| 6   | auth-refresh-token            | 2026-08-15T10:29:59Z | OK     |
| 7   | embeddings-generate           | 2026-08-15T10:30:06Z | OK     |
| 8   | notifications-register-device | 2026-08-15T10:30:11Z | OK     |
| 9   | push-notification             | 2026-08-15T10:30:16Z | OK     |
| 10  | sync-push                     | 2026-08-15T10:30:22Z | OK     |

**10 / 10 OK, zero retries** — no deploy failed, so nothing is BLOCKED on infra. Full per-function
detail lives in `92-DEPLOY-LEDGER.md`. The four `intelligence-*` importers of `_shared/auth.ts` are
deliberately NOT deployed here — they are inside the 2.3x sweep population and belong to plan
**92-09**, which deploys them after their own sweep edits.

### GATE — Task 2 `<automated>` (run verbatim, from repo root, after the deploys)

```
OUT=$(bash scripts/probe-edge-auth.sh audit-logs-viewer data-retention field-permissions my-delegations); [ "$(echo "$OUT" | grep -c ' -> ')" -eq 4 ] && ! echo "$OUT" | grep -q ' -> 401'
```

Verbatim `$OUT`:

```
audit-logs-viewer -> 500
data-retention -> 500
field-permissions -> 200
my-delegations -> 200
```

```
EXIT=0
```

**Exit code: 0. Verdict: PASS.** Four `->` lines, zero ` -> 401`.

### The flip, against the baseline

| Function          | `92-PROBE-BASELINE.md` (pre-migration) | Post-deploy | Auth gate             |
| ----------------- | -------------------------------------- | ----------- | --------------------- |
| audit-logs-viewer | 401                                    | 500         | PASSED (was REJECTED) |
| data-retention    | 401                                    | 500         | PASSED (was REJECTED) |
| field-permissions | 401                                    | 200         | PASSED (was REJECTED) |
| my-delegations    | 401                                    | 200         | PASSED (was REJECTED) |

The audit's nine observed 401s (adminops F2) covered the first three; engagements F4's two observed
401s covered `my-delegations`. All four now probe non-401 on the **deployed** artifact.

### RLS scoping survived — proven by count, not by a 200

`field-permissions/index.ts` has exactly one `createClient` call (the header-injected one at :165),
so every row it returns came through the caller's JWT under RLS. Measured both ends:

- DB, via Supabase MCP: `select count(*) ... from public.field_permissions` -> `total: 19, active: 19, not_deleted: 19`
- Function, with the same seeded test user's JWT: `data rows returned: 19`, first row keys are the
  full 24-column shape (`can_edit, can_view, conditions, created_at, ..., scope_value, updated_at`).

19 in the table, 19 through the function. This is the direct refutation of Pitfall 1 — no
200-with-`[]`, no silent anon downgrade. It is also exactly D-20's Phase-93 criterion-2 surface
(`/admin/field-permissions` showing "the 19 rules the DB holds").

## PRE-EXISTING DEFECTS NEWLY EXPOSED — read this before trusting the two 500s

Fixing the auth gate made three data-layer defects **observable for the first time**. They were
always there; the 401 short-circuited every request before the handler ever queried. None was caused
by this plan's edit (this plan changed only the import specifier and the `getUser` argument), and
none is fixed here — all three are outside this plan's `files_modified` intent (the plan scopes
`my-delegations` explicitly as "the AUTH-04 **auth half**") and fixing them means schema/table
decisions, not auth. **They are filed here loudly rather than silently.**

**1. `audit-logs-viewer` -> 500 — queries a table shape that does not exist**

Verbatim response body:

```json
{
  "error": "Failed to fetch audit logs",
  "code": "DB_ERROR",
  "details": {
    "code": "42703",
    "details": null,
    "hint": null,
    "message": "column audit_log.table_name does not exist"
  }
}
```

`index.ts:51,192,209,285` select `table_name, operation, row_id, old_data, new_data, changed_fields,
user_email, user_role` from `public.audit_log`. The live table's columns are
`id, tenant_id, entity_type, entity_id, action, user_id, timestamp, old_values, new_values,
ip_address, user_agent, session_id, additional_context`. The shape it wants is closer to a different
table. Postgres `42703`.

**2. `data-retention` -> 500 — RLS-scoped role lookup denied**

Verbatim response body:

```json
{
  "error": {
    "code": "FETCH_ERROR",
    "message_en": "Failed to fetch policies",
    "message_ar": "فشل في جلب السياسات",
    "details": {
      "code": "42501",
      "details": null,
      "hint": null,
      "message": "permission denied for table users"
    }
  }
}
```

`index.ts:112` does `supabase.from('users').select('role')` through the **RLS-scoped** client to
check the caller's role. The `authenticated` role has no grant/policy allowing that read, so
Postgres returns `42501` before the `data_retention_policies` query at :233 ever runs. Note this is
the _correct_ behaviour of a properly-scoped client — the defect is the role-lookup design, not the
scoping. (Bilingual error body is well-formed, so this is an honest error, not a blank screen.)

**3. `my-delegations` -> 200 with `{"granted":[],"received":[],"total":0}` — failure-as-emptiness**

This is the exact anti-pattern this milestone exists to kill, and it is present here for a reason
unrelated to auth. `index.ts:129,150` query `supabaseAdmin.from("delegations")` — **`public.delegations`
does not exist.** Confirmed via MCP: `ERROR: 42P01: relation "public.delegations" does not exist`.
The real tables are `public.permission_delegations` (`grantor_id, grantee_id, resource_type,
resource_id, permissions, reason, valid_from, valid_until, revoked, revoked_at, revoked_by, ...` —
note `revoked`, **not** the `is_active` the handler filters on at :171, and **no** `source` column
the handler selects) and `public.position_delegations` (a different shape entirely:
`position_id, delegator_id, delegate_id, ...`). The handler swallows the PostgREST error to
`console.error` at :197 and :233 and falls through to empty arrays, so a hard 42P01 renders as a
clean, confident, empty 200.

**Why this was not auto-fixed:** picking the right table requires a product decision between
`permission_delegations` and `position_delegations`, then a column-by-column rewrite of the select,
the `is_active` filter, and the `grantor:auth.users!...` embeds. That is AUTH-04's **data** half.
The plan explicitly scoped this file to the auth half. Deviation Rule 4 territory, not Rule 1.

## Deviations from Plan

None — plan executed exactly as written. Both tasks ran their planned actions, both gates were run
verbatim and passed, no `<automated>` gate text was edited, and no file outside `files_modified`
(plus this SUMMARY) was touched.

## GATE CONCERN

None. Both `<automated>` gates in this plan are satisfiable as written and were satisfied. No gate
text was modified.

## Issues Encountered

- `git commit -- <path>` fails with `pathspec ... did not match any file(s) known to git` for a
  **new** file — pathspec-only commits work on tracked files. Resolved by `git add <single-explicit-path>`
  followed by the same `git commit -- <path>`; never `git add -A` / `git add .`. Verified after the
  fact: `git show --stat HEAD` shows exactly `1 file changed, 84 insertions(+)`.
- HEAD moved twice under me mid-plan (`ed099ad8`, `e012f4c6`, `3cdeb094` from plans 92-02 and 92-05
  landing on the shared tree between my two commits). No conflict — those plans' files are disjoint
  from mine. Task 1's gate was re-run after the moves and still exits 0. **No commit of mine
  contains a file that is not mine** — both `git show --stat` outputs are quoted above.

## Cross-phase handoff (D-20) — with the correction the measurement forces

The plan asked me to name `data-retention` + `field-permissions` as known-closed preconditions for
Phase 93's criterion 2. Half of that claim is true and half is not, so:

- **`field-permissions` — KNOWN-CLOSED.** Auth fixed, deployed, returns 19/19 rows through the
  RLS-scoped client. Phase 93 can build `/admin/field-permissions` on this without re-deriving it.
- **`data-retention` — AUTH-CLOSED ONLY, NOT SURFACE-CLOSED.** The 401 is gone, but the deployed
  function returns a `42501` 500 (defect 2 above). Phase 93's criterion 2 says the surface must show
  "real rows **or honest errors**" — today it will show an honest bilingual error, not rows. Phase 93
  must NOT inherit "data-retention works". It inherits "data-retention's auth is fixed; its
  `users.role` lookup is the remaining blocker."
- **`my-delegations`** is not a Phase 93 criterion-2 surface, but defect 3 is a live
  failure-as-emptiness on an AUTH-04 surface and should be picked up with AUTH-04's data half.

## Next Phase Readiness

- The D-19 must-fix core is closed against its own evidence; the sweep plans (92-05..92-08) and the
  92-09 deploy are unaffected by anything here.
- `92-DEPLOY-LEDGER.md` exists and is append-ready for 92-09. 92-09 owns the four `intelligence-*`
  importers of `_shared/auth.ts`; until it lands, those four run bundles carrying the old pin.

## Self-Check: PASSED

- `[ -f .planning/phases/92-session-integrity-edge-function-auth/92-DEPLOY-LEDGER.md ]` -> FOUND
- All 5 modified source files exist and pass the Task 1 gate at current HEAD -> `TASK1_GATE_EXIT=0`
- `git log --oneline | grep 52331903` -> FOUND; `git show --stat 52331903` -> exactly my 5 files
- `git log --oneline | grep 915fcd41` -> FOUND; `git show --stat 915fcd41` -> exactly the ledger

## WHAT THIS DOES NOT ESTABLISH

- **Two of the four core functions do not actually work.** `audit-logs-viewer` and `data-retention`
  return 500 on the deployed artifact. What is established is that they are past the `getUser` gate —
  nothing more. A reader who takes "AUTH-02 core closed" to mean "these endpoints serve data" is
  wrong for those two.
- **`my-delegations` returning 200 is not evidence it returns data.** It returns
  `{"granted":[],"received":[],"total":0}` from a table that does not exist. The 200 is real; the
  emptiness is a masked 42P01.
- **RLS survival was proven for one function, not four.** The 19/19 count is `field-permissions`
  only. `audit-logs-viewer` and `data-retention` 500 before returning rows, so their RLS scoping is
  **unverified at runtime** — verified statically (the injected client is present and the site count
  is unchanged from base) but never exercised. `my-delegations` does its data reads through a
  pre-existing **service-role** client, so its result says nothing about RLS either way.
- **The probe is a bare unauthenticated-method `GET` with no body or query params.** It exercises
  each function's default path only. Other routes/methods in these functions are unprobed.
- **The six helper importers were deployed but never probed.** Rows 5–10 of the ledger record a
  successful deploy; no request was made to any of them, so their post-bump behaviour is
  **unobserved**. `_shared/auth.ts`'s `validateJWT` was not exercised at runtime at all.
- **The four `intelligence-*` importers are still on the old bundled helper.** Not this plan's job
  (92-09 owns them), but it means `_shared/auth.ts`'s bump is only 6/10 propagated today.
- **Nothing was rendered.** No UI was opened. The Phase 93 surfaces (`/admin/data-retention`,
  `/admin/field-permissions`) were not loaded in a browser; the claims above are HTTP-level only.
- **No test suite was run.** No Playwright, no Vitest, no typecheck, no lint beyond the pre-commit
  hook that ran on commit `52331903`. Deno does not typecheck these functions at deploy time beyond
  bundling, so a type error inside an unexercised branch would not have surfaced.
- **The three defects above are diagnosed, not fixed, and their diagnoses are single-source.** Each
  rests on one response body plus one MCP schema query; I did not attempt a corrected query to
  confirm the fix would work.

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
