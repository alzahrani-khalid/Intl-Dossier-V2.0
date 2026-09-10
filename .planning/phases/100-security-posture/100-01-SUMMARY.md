---
phase: 100-security-posture
plan: 1
status: complete
subsystem: database
tags: [postgresql, rls, security-invoker, supabase]
requires:
  - phase: 100-security-posture
    provides: measured unified_work_items definer bypass and caller-scoped census
provides:
  - public.unified_work_items executes with the caller's RLS boundary
  - live two-identity census and named catalog proof
affects: [DBSEC-01, 100-08-search-path-pinning, 100-13-census-recheck]
key-files:
  created:
    - supabase/migrations/20260908000001_p100_unified_work_items_invoker.sql
    - .planning/phases/100-security-posture/100-01-SUMMARY.md
requirements-completed: [DBSEC-01]
completed: 2026-09-10
---

# Phase 100 Plan 01: `unified_work_items` Invoker Summary

`public.unified_work_items` now carries `security_invoker=true` on staging. In a caller-scoped census run after the migration, the owner read 21 rows and the non-owner read 2 rows.

## Change

The idempotent migration is deliberately one statement:

```sql
ALTER VIEW public.unified_work_items SET (security_invoker = true);
```

No migration-ledger row was fabricated. The file was applied directly with `psql`, then safely replayed.

## Completeness pass: base tables and policy inputs

The view reads the three base tables `public.aa_commitments`, `public.tasks`, and `public.intake_tickets`. For an authenticated caller, their applicable read-policy inputs are:

- `aa_commitments`: `auth.uid()` is compared with `owner_user_id` and `dossier_owners.user_id`; `is_assigned_to_dossier(dossier_id)` checks dossier assignment.
- `tasks`: `auth.uid()` is compared with `assignee_id` and `created_by`; `check_user_is_contributor(id, auth.uid())` checks task contribution.
- `intake_tickets`: `auth.uid()` is compared with `created_by` and `assigned_to`; `get_user_units(auth.uid())` is compared with `assigned_unit`. The authenticated census fixes the JWT role to `authenticated`, so the `service_role` branch is not the reason these callers see rows.

Whether the caller can still control each of the four inputs:

- `auth.uid()` — **Caller control: yes, but bounded.** A caller chooses which valid signed session they possess to present; they cannot supply another user's UUID as a free query input.
- `is_assigned_to_dossier()` — **Caller control: no, for this read.** The policy supplies the row's `dossier_id`; the security-definer helper resolves assignment from database authorization state.
- `get_user_units()` — **Caller control: no, beyond the bounded identity above.** The policy supplies `auth.uid()`, and the security-definer helper resolves that identity's units from database state.
- `check_user_is_contributor()` — **Caller control: no, for this read.** The policy supplies the candidate task's `id` and `auth.uid()`, and the security-definer helper checks contributor state held by the database.

The policy census was run before applying the view change and exited 0:

```text
aa_commitments|Users can create aa_commitments based on role or assignment|INSERT|
aa_commitments|Users can update their own aa_commitments or if assigned to dos|UPDATE|((owner_user_id = auth.uid()) OR (is_assigned_to_dossier(dossier_id) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['supervisor'::text, 'admin'::text]))))
aa_commitments|Users can view aa_commitments for assigned dossiers or owned co|SELECT|(is_assigned_to_dossier(dossier_id) OR (owner_user_id = auth.uid()))
aa_commitments|hybrid_access_aa_commitments|ALL|((EXISTS ( SELECT 1
   FROM dossier_owners
  WHERE ((dossier_owners.dossier_id = aa_commitments.dossier_id) AND (dossier_owners.user_id = auth.uid())))) OR (owner_user_id = auth.uid()))
intake_tickets|ticket_delete|DELETE|(system_operation('any'::text) OR is_admin(auth.uid()))
intake_tickets|ticket_insert|INSERT|
intake_tickets|ticket_select|SELECT|(((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (created_by = auth.uid()) OR (assigned_to = auth.uid()) OR ((assigned_unit IS NULL) OR (assigned_unit = ANY (get_user_units(auth.uid())))))
intake_tickets|ticket_update|UPDATE|(system_operation('any'::text) OR (created_by = auth.uid()) OR (assigned_to = auth.uid()) OR ((assigned_unit = ANY (get_user_units(auth.uid()))) AND is_supervisor(auth.uid())))
tasks|Service role can manage all tasks|ALL|true
tasks|Task owners can update tasks|UPDATE|((assignee_id = auth.uid()) OR (created_by = auth.uid()))
tasks|Users can create tasks|INSERT|
tasks|tasks_select_policy|SELECT|((auth.uid() = assignee_id) OR (auth.uid() = created_by) OR check_user_is_contributor(id, auth.uid()))
policy_census_exit=0
```

The helper catalog control established that all three named helpers exist and are security-definer functions; it exited 0:

```text
check_user_is_contributor|t|task_uuid uuid, user_uuid uuid
get_user_units|t|p_user_id uuid
is_assigned_to_dossier|t|dossier_uuid uuid
helper_catalog_exit=0
```

This conversion makes **RLS REACHED, not CORRECT**. It establishes that the base-table policies decide the view result; it does not certify those policies as correct. In particular, the 2 rows the non-owner still reads are attributable to `intake_tickets.ticket_select`'s `(assigned_unit IS NULL)` clause. They are the policy's deliberate current bound, not rows this task claims to have closed.

## Instrument drills before apply

The live named-object control before apply was:

```text
present=1 invoker_on=0
preapply_flag_exit=0
```

Thus an authored-but-never-applied migration leaves `invoker_on=0` and fails the mechanism oracle. The oracle treats an absent `public.unified_work_items` as an instrument fault with exit 3 because a stale name list is not a security result; when present, the view must carry `security_invoker=true`.

Criterion 1's hardcoded discriminating pair was drilled RED at HEAD:

```text
P100-CENSUS unified_work_items owner=21 other=21 expected owner=21 other=2
FAIL: non-owner census 21, expected 2 - unified_work_items still bypasses RLS
preapply_census_exit=1
```

It was also drilled fail-closed from a temporary directory where `.env.test` was absent:

```text
INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset - .env.test not materialised in this worktree
fail_closed_exit=3
```

The literals `owner=21` and `other=2` are hardcoded and neither is derived from the call being graded. `owner=21` is the positive control proving the session can see rows at all, so `other=2` proves a narrowed RLS boundary rather than a dead connection. The neighbouring plausible-wrong case—a changed view definition whose `security_invoker` option never took, or a converted view later re-granted definer behavior—still reads `owner=21 other=21` and fails.

## Live migration application and replay

First apply, verbatim:

```text
ALTER VIEW
first_apply_exit=0
```

Idempotent replay, verbatim:

```text
ALTER VIEW
idempotent_replay_exit=0
```

## Post-apply acceptance evidence

The caller-scoped census below was run **after the first apply and its idempotent replay**. Verbatim output:

```text
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
post_apply_census_exit=0
```

The paired mechanism check names the one owned view, proves that it exists, and proves its reloption. Verbatim output:

```text
P100-01-FLAG invoker_on=1 present=1 expected invoker_on=1 present=1
PASS invoker-flag
post_apply_flag_exit=0
```

## DBSEC-01 consumer correction

DBSEC-01's claim that `unified_work_items` is queried from 10 frontend consumer files does not reproduce. `git grep -nI ".from('unified_work_items')" -- 'frontend/src/**'` returned exactly these 16 call sites in 2 files:

```text
frontend/src/hooks/useDashboardTrends.ts:43:    .from('unified_work_items')
frontend/src/hooks/useDashboardTrends.ts:49:    .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:222:            .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:226:            .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:238:          .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:251:            .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:256:            .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:315:        const { data, error } = await supabase.from('unified_work_items').select('status')
frontend/src/hooks/useWidgetDashboard.ts:359:        const { data, error } = await supabase.from('unified_work_items').select('source')
frontend/src/hooks/useWidgetDashboard.ts:399:          .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:500:          .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:543:          .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:639:    .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:732:      .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:736:      .from('unified_work_items')
frontend/src/hooks/useWidgetDashboard.ts:741:      .from('unified_work_items')
git_grep_exit=0
consumer_files=2
call_sites=16
```

## Result

`public.unified_work_items` executes as the authenticated caller on staging. The owner remains at 21 rows, while the non-owner is narrowed from 21 to the 2 rows permitted by base-table RLS.

No later-task object, migration ledger row, or out-of-scope file was changed.
