---
phase: 93-failure-visibility
plan: 04
subsystem: database
tags: [postgres, rls, supabase, authz, 42501, migration]

requires:
  - phase: 93-02
    provides: the probe baseline that established data-retention -> 500 as the RED state
provides:
  - 4 RLS policies rewritten off auth.users onto public.is_platform_admin(auth.uid())
  - DR-42501 closed at its real seam — data-retention edge function flips 500 -> 200
  - a standing repository guard refusing GRANT SELECT ON auth.users, drilled both directions
  - behavioural (role-switched) proof that each rewritten predicate decides rather than raises
affects: [93-09, 93-15, phase-100-RLS-AUTHUSERS-01, phase-102-DELEG]

tech-stack:
  added: []
  patterns:
    - 'auth.users-evaluating RLS predicates are replaced with public.is_platform_admin(auth.uid()), never unblocked by granting SELECT on auth.users'
    - 'role-switched SET LOCAL ROLE + request.jwt.claims inside BEGIN/ROLLBACK is the RLS oracle; a service-role read bypasses RLS and proves nothing'
    - "when a policy's live population is empty or uniform, seed the discriminating row inside the rolled-back probe transaction rather than reporting a vacuous 0"

key-files:
  created:
    - supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql
  modified: []

key-decisions:
  - 'D-24 honoured: predicate is public.is_platform_admin(auth.uid()); the inline users.role variant would have locked out the 6 admins that live only in user_roles'
  - 'raw_user_meta_data / raw_app_meta_data reads DELETED, not preserved alongside (D-10)'
  - 'GRANT SELECT ON auth.users REFUSED (D-12); the refusal is recorded as a comment in the migration and enforced by a repo-wide guard'
  - 'Scope held to exactly 4 policies; legal_holds and the residual 10 stay filed to RLS-AUTHUSERS-01 / Phase 100'
  - 'Deviation (Rule 1): restored TO authenticated on the data_retention_policies policy — the research draft omitted the clause, which silently defaulted the role list to PUBLIC'

patterns-established:
  - 'Pattern: negative-literal repo guards exclude comment lines, so the refusal can be documented in the very file the guard scans'

requirements-completed: [DR-42501]

duration: 25min
completed: 2026-08-16
---

# Phase 93 Plan 04: auth.users RLS Policy Rewrite Summary

**The four RLS policies this phase's criteria exercise now evaluate `public.is_platform_admin(auth.uid())` instead of an `EXISTS` against `auth.users` no client role may read — `data-retention` flips from a 42501-driven 500 to 200, and the escalation Postgres's own `HINT` proposes is fenced by a drilled repository guard.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-16T00:38Z (approx, first RED observation)
- **Completed:** 2026-08-16T00:52Z
- **Tasks:** 3/3
- **Files modified:** 1 created (`supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql`)

## Commits

| Commit     | Message                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `9a5e56be` | `fix(93-04): rewrite 4 auth.users RLS predicates onto is_platform_admin` |
| `339791b3` | `fix(93-04): scope the retention policy TO authenticated, not PUBLIC`    |

Scope diff vs `phase-93-base` (`e185f175`) over `supabase/migrations backend/migrations`: **1 file changed, 82 insertions(+)**. No other file in the plan's scope was touched.

Applied migrations (Supabase MCP `apply_migration`, project `zkrcjzdemdmwhearhfgg`), confirmed present in `list_migrations`:

- `20260815214523  phase93_rewrite_auth_users_policies`
- `20260815214612  phase93_rewrite_auth_users_policies_role_scope` ← the Rule-1 correction below

---

## Gate drill table — RED before, GREEN after

Every gate below was executed **verbatim** from `93-04-PLAN.md`. Commands and their actual output are reproduced; nothing here is typed in from expectation.

| gate                           | RED before (command + output)                                                                                                                                                                                               | GREEN after (command + output)                                                                                                                                                                                                                                                                              | notes                                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **g1** — Task 1 migration text | `M=supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql && test -f "$M" && … ` → **`exit=1`**; `ls` → `ls: supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql: No such file or directory` | same command → **`exit=0`**. Components: `is_platform_admin` lines `7` (≥4 ✓), `DROP POLICY IF EXISTS` lines `4` (=4 ✓), uncommented `auth.users` lines `0` ✓, uncommented `raw_*_meta_data` lines `0` ✓                                                                                                    | Genuine RED (file absent). Re-run after the Rule-1 edit: still `exit=0`.                                                            |
| **g2** — behavioural oracle    | `OUT=$(scripts/probe-edge-auth.sh data-retention) && echo "$OUT" \| grep -qE 'data-retention -> 200'` → **`exit=1`**; actual probe output: **`data-retention -> 500`**                                                      | same command → **`exit=0`**; actual probe output: **`data-retention -> 200`**                                                                                                                                                                                                                               | The discriminating evidence for DR-42501. RED re-measured live at execution start, not inherited from CONTEXT.                      |
| **g3** — anti-grant repo guard | Guard is **GREEN on the clean tree by construction** — it is a **regression guard**, not a defect gate, so a green "before" is expected and is not a pass claim. RED was **constructed**: see the three-step drill below.   | `test -d supabase/migrations && test -d backend/migrations && test "$(grep -rniE 'grant[[:space:]]+select[^;]*auth\.users' supabase/migrations backend/migrations \| grep -vE '^[^:]+:[0-9]+:[[:space:]]*--' \| wc -l)" -eq 0` → **`exit=0`**, with the migration's own refusal comment present in the tree | Both roots proven to exist in the same `&&` chain, no `2>/dev/null` anywhere (C5). C8 comment-exclusion drilled, twice — see below. |

### g3 three-step drill (D-23, GATE-STANDARD C1 both directions)

Constructed in a scratch copy at `/tmp/p93-04-antigrant-drill` holding a faithful copy of **both** roots (`supabase/migrations` = 483 files, `backend/migrations` = 10 files — same counts as the live tree).

| step | tree state                                                                                    | gate exit     | evidence                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A    | faithful copy, unmodified                                                                     | **0** (GREEN) | baseline — the copy reproduces the live population                                                                                      |
| B    | plus a file containing **only a commented** `-- GRANT SELECT ON auth.users TO authenticated;` | **0** (GREEN) | raw grep hits `1`, post-comment-filter count `0` — **C8 control: prose/comments cannot trip the guard**                                 |
| C    | plus a file containing the **uncommented** `GRANT SELECT ON auth.users TO authenticated;`     | **1** (RED)   | offending line printed: `supabase/migrations/99999999999999_scratch_forbidden_grant.sql:1:GRANT SELECT ON auth.users TO authenticated;` |

**Live C8 control (stronger than step B):** after the migration landed, the live tree contains **3** raw matches for the forbidden regex — all three are the refusal comment inside the new migration (lines 27, 31, 42) — and the guard still exits **0**. The guard therefore tolerates the documentation of the refusal in the very file it scans.

**Tree isolation:** `git status --porcelain` captured before and after the drill; `diff` reported no difference (both empty at that point). The scratch directory was removed afterwards.

**What the guard does NOT establish (stated, not buried):**

- A `GRANT` applied by hand directly against the database, outside the migrations directories, is **invisible** to it.
- It is a _repository_ guard. The live-catalog half is Task 2's point-in-time MCP evidence below, not a standing gate.

---

## Task 2 evidence

### (1) `pg_policies` — before and after

**BEFORE** (live catalog, pre-apply — all four raise `42501` because no client role may read `auth.users`):

| table                     | policy                                          | cmd    | roles             | qual                                                                                                                                                          |
| ------------------------- | ----------------------------------------------- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data_retention_policies` | Admin can manage retention policies             | ALL    | `{authenticated}` | `EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND ((u.raw_user_meta_data ->> 'role') = 'admin' OR (u.raw_app_meta_data ->> 'role') = 'admin'))` |
| `entity_tag_assignments`  | Authenticated users can remove tag assignments  | DELETE | `{authenticated}` | `assigned_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid())`                                                                   |
| `tag_categories`          | Only non-system tags can be deleted by creators | DELETE | `{authenticated}` | `is_system = false AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid()))`                                            |
| `tag_categories`          | Tag creators or admins can update               | UPDATE | `{authenticated}` | `created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid())`                                                                    |

**AFTER** (live catalog, post-apply — pasted verbatim from `execute_sql`):

| table                     | policy                                          | cmd    | roles             | qual                                                                                     | with_check                      |
| ------------------------- | ----------------------------------------------- | ------ | ----------------- | ---------------------------------------------------------------------------------------- | ------------------------------- |
| `data_retention_policies` | Admin can manage retention policies             | ALL    | `{authenticated}` | `is_platform_admin(auth.uid())`                                                          | `is_platform_admin(auth.uid())` |
| `entity_tag_assignments`  | Authenticated users can remove tag assignments  | DELETE | `{authenticated}` | `((assigned_by = auth.uid()) OR is_platform_admin(auth.uid()))`                          | `null`                          |
| `tag_categories`          | Only non-system tags can be deleted by creators | DELETE | `{authenticated}` | `((is_system = false) AND ((created_by = auth.uid()) OR is_platform_admin(auth.uid())))` | `null`                          |
| `tag_categories`          | Tag creators or admins can update               | UPDATE | `{authenticated}` | `((created_by = auth.uid()) OR is_platform_admin(auth.uid()))`                           | `null`                          |

Confirmed: every predicate contains `is_platform_admin`; **none** contains `auth.users`; **none** contains `raw_user_meta_data` / `raw_app_meta_data`. **No fail-open typo landed** — no `USING true`, no bare `true`, and the creator/`is_system` arms survived intact (T-93-08).

Helper verified live before use: `public.is_platform_admin(uid uuid)` — `prosecdef = true` (SECURITY DEFINER), `provolatile = 's'` (STABLE), `proconfig = {search_path=public, pg_catalog}`.

### (2) `get_advisors` (security) — run and recorded

**1268** findings total. Breakdown by level/name:

| level | name                                                 | count |
| ----- | ---------------------------------------------------- | ----- |
| ERROR | `security_definer_view`                              | 33    |
| ERROR | `auth_users_exposed`                                 | 2     |
| INFO  | `rls_enabled_no_policy`                              | 2     |
| WARN  | `function_search_path_mutable`                       | 548   |
| WARN  | `authenticated_security_definer_function_executable` | 334   |
| WARN  | `anon_security_definer_function_executable`          | 332   |
| WARN  | `materialized_view_in_api`                           | 12    |
| WARN  | `extension_in_public`                                | 4     |
| WARN  | `auth_leaked_password_protection`                    | 1     |

**Findings naming any of the three tables this migration touched: `0`.** The migration introduced no advisor finding. The rest is pre-existing project-wide debt and is out of this plan's scope.

Worth flagging (not fixed here): the 2 `auth_users_exposed` ERRORs name views `upcoming_milestones` and `entity_comments_with_details` as possibly exposing `auth.users` data to `anon`/`authenticated`. That is **live corroboration of D-11's "15 is a lower bound"** clause — D-11 explicitly excludes reach-through via views and SECURITY DEFINER functions from its population. Filed as an observation for `RLS-AUTHUSERS-01` (Phase 100); deliberately untouched.

### (3) Role-switched behavioural probe — CONSTRUCTED, not `CANNOT CONSTRUCT`

The plan permitted an honest `CANNOT CONSTRUCT` if the transaction shape were unreachable through the MCP. **It was reachable.** `BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '…'; <probe>; ROLLBACK;` executes through `mcp__supabase__execute_sql`. Actors: admin `de2734cf…`, non-admin `4a8d21a8…` (chosen as active, not in `public.users.role='admin'`, and holding no active `user_roles` grant).

| policy                            | actor                                  | probe                           | result                         | verdict                                             |
| --------------------------------- | -------------------------------------- | ------------------------------- | ------------------------------ | --------------------------------------------------- |
| `data_retention_policies` FOR ALL | admin                                  | `SELECT count(*)`               | **16**                         | permits (16 = full table per service-role count)    |
| `data_retention_policies` FOR ALL | non-admin                              | `SELECT count(*)`               | **0**                          | denies — **decides, does not raise**; not fail-open |
| `tag_categories` UPDATE           | admin, _not_ creator                   | `UPDATE … RETURNING`            | **1 row**                      | permits via the admin arm                           |
| `tag_categories` UPDATE           | non-admin, not creator                 | `UPDATE … RETURNING`            | **0 rows**                     | denies                                              |
| `tag_categories` DELETE           | admin                                  | `DELETE WHERE is_system = TRUE` | **0** of **13** candidate rows | the `is_system = FALSE` guard survived the rewrite  |
| `tag_categories` DELETE           | admin, not creator, non-system row     | `DELETE`                        | **1**                          | permits via the admin arm                           |
| `tag_categories` DELETE           | non-admin, not creator, non-system row | `DELETE`                        | **0**                          | denies                                              |
| `entity_tag_assignments` DELETE   | admin, not assigner                    | `DELETE`                        | **1**                          | permits via the admin arm                           |
| `entity_tag_assignments` DELETE   | non-admin, not assigner                | `DELETE`                        | **0**                          | denies                                              |

**No `42501` was raised by any of these nine probes.** That is the point: pre-migration the predicate could not be evaluated at all; now it evaluates and returns a decision.

**Vacuity check — and the correction it forced.** The live populations were: `tag_categories` = 13 rows, **all 13 `is_system = TRUE`, zero non-system**; `entity_tag_assignments` = **0 rows**. So three of the rows above would have been vacuous passes against live data (a `0` returned because the population was empty, not because the policy denied). The discriminating rows were therefore **seeded inside the same rolled-back transaction** before the role switch. Post-probe re-query confirms **no residue**: `tag_categories` 13, `entity_tag_assignments` 0, `data_retention_policies` 16, probe-id rows 0.

The `is_system` result is _not_ vacuous in the other direction: 13 candidate system rows existed and an admin deleted **0** of them.

### (4) Live `auth.users` grantee check — `CANNOT CONSTRUCT as a bash gate (no DSN; MCP-only)` per D-23

```sql
SELECT grantee, privilege_type FROM information_schema.table_privileges
WHERE table_schema='auth' AND table_name='users' AND privilege_type='SELECT' ORDER BY grantee;
```

Result — exactly one row:

| grantee    | privilege_type |
| ---------- | -------------- |
| `postgres` | `SELECT`       |

**Label, per D-23:** this is **point-in-time evidence, not a standing gate.** `information_schema` is unreachable through PostgREST and no Postgres DSN exists in `.env.test`, so it cannot be an `<automated>` bash gate. It is recorded here as evidence, never folded into a gate pass. The standing half is g3.

The fail-closed property D-12 depends on therefore still holds live: `SELECT` on `auth.users` is granted to `postgres` and to nothing else.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] `data_retention_policies` policy role list silently widened from `{authenticated}` to `{public}`**

- **Found during:** Task 2, post-apply `pg_policies` re-query.
- **Issue:** The research draft's `CREATE POLICY … FOR ALL` for `data_retention_policies` omits a `TO` clause (the other three carry `TO authenticated`). Postgres defaults an omitted role list to `PUBLIC`, so the first apply produced `roles: {public}` where the replaced policy had `{authenticated}`. `anon` holds **7** table grants on `data_retention_policies`, so `anon` became subject to a policy it previously was not. It still fails closed — `SELECT public.is_platform_admin(NULL::uuid)` returns **`false`**, verified live — but a migration asked to unblock a surface must not widen a role list on the way.
- **Fix:** Added `TO authenticated` to that policy in the repo file and re-applied the full (idempotent) migration as `phase93_rewrite_auth_users_policies_role_scope`. `pg_policies` now reports `{authenticated}` on all four.
- **Files modified:** `supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql`
- **Commit:** `339791b3`

**2. [Method deviation, not a code change] g3 RED constructed in a `/tmp` scratch copy, not a git worktree**

The plan's Task 3 says the RED direction is constructed "in a scratch worktree". My execution contract forbids creating a worktree in this session. I used a faithful **file-level copy of both roots** under `/tmp/p93-04-antigrant-drill` instead (verified same file counts: 483 + 10). The gate is a `grep` over two directory roots, so a directory copy reproduces its population exactly; nothing about the drill depended on git. Live tree confirmed byte-identical before/after, scratch removed.

---

## Observations — recorded, deliberately NOT acted on

1. **`/admin/data-retention`'s legal-holds region STILL errors after this migration.** `legal_holds` is one of the residual 11 (`RLS-AUTHUSERS-01`, Phase 100). This is **BY DESIGN**. The `data-retention` function returning 200 means its _policies_ query now succeeds; it does not mean the page is green. Plan 93-09's oracle should assert that residual error rather than trip on it. A criterion-2 close that implied the whole page went green would be this milestone's own failure mode.
2. **`my-delegations` now probes `500`** (CONTEXT's baseline recorded it as `200`). Not caused by this plan — nothing here touches delegations. It is consistent with the intended-broken register (`/delegations` errors until Phase 102, `DELEG-02` + `SEED-DELEG-01`). Recorded, not investigated, not fixed.
3. **`audit-logs-viewer` now probes `200`** (was `500`) — plan 93-05's `AUDIT-42703` remap. Noted only so the full probe line in this SUMMARY is not misread as my doing.
4. **Repo filename prefix is 8-digit, not the tree's usual 14-digit stamp.** The file is `20260815_phase93_rewrite_auth_users_policies.sql` because the plan's `files_modified` and gate `g1` pin that exact path literally. The applied migration versions are correctly 14-digit. Flagged in case a future `supabase db push` ordering pass cares; not changed, because changing it would break the plan's own gate.
5. **The 2 `auth_users_exposed` advisor ERRORs** (views `upcoming_milestones`, `entity_comments_with_details`) corroborate D-11's lower-bound clause. Phase 100 material.

Full probe set at close, for the record:

```
audit-logs-viewer -> 200
data-retention -> 200
field-permissions -> 200
my-delegations -> 500
dossiers-update -> 405
tasks-get -> 200
```

## Threat model outcomes

| Threat ID                              | Disposition | Outcome                                                                                                                                                                                                                                                  |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-93-06 (metadata-role EoP)            | mitigate    | **Done.** `raw_user_meta_data` / `raw_app_meta_data` deleted from all 4 predicates; `pg_policies` after-state confirms zero occurrences. `is_platform_admin` reads `public.users.role` / `public.user_roles`, neither of which a session can self-grant. |
| T-93-07 (`GRANT SELECT ON auth.users`) | mitigate    | **Done.** Refused; refusal written into the migration header as `--` comments; standing repo guard g3 drilled RED/GREEN + C8 control; live grantee list verified `postgres` only.                                                                        |
| T-93-08 (fail-open rewrite)            | mitigate    | **Done, behaviourally.** `pg_policies` re-queried and pasted (no `USING true`); role-switched probe shows admin-permit / non-admin-deny on all four policies; `get_advisors` run with zero findings on the touched tables.                               |
| T-93-SC (package installs)             | accept      | Zero installs.                                                                                                                                                                                                                                           |

## GATE CONCERN

None. All three gates in this plan are non-vacuous as written and were observed in both directions (g1 and g2 naturally RED before the work; g3 RED by construction, with its comment-exclusion control drilled twice — once in scratch, once live against the migration's own refusal text). No gate text was edited.

## Known Stubs

None. The plan creates one SQL migration and no application code.

## BLOCKED

None.

## Self-Check: PASSED

- `supabase/migrations/20260815_phase93_rewrite_auth_users_policies.sql` — **FOUND** (also verified at `HEAD` via `git show HEAD:<path>`)
- `.planning/phases/93-failure-visibility/93-04-SUMMARY.md` — **FOUND**
- Commit `9a5e56be` — **FOUND** (`git show --stat`: 1 file changed, 77 insertions)
- Commit `339791b3` — **FOUND** (`git show --stat`: 1 file changed, 6 insertions, 1 deletion)
- Applied migrations `20260815214523` and `20260815214612` — **FOUND** in `mcp__supabase__list_migrations`
- Gates g1 / g2 / g3 — all re-run verbatim in one final sweep, all `exit=0`
