---
phase: 100-security-posture
plan: 2
status: complete
completed: 2026-09-10
---

# P100-02 — frontend view invoker conversion

The migration converted `public.mous_frontend`, `public.event_details`, and
`public.working_group_stats` to `security_invoker=true` on staging. Both the first apply and the
idempotence replay exited 0. The post-apply catalog oracle found all three names and all three flags;
the classified read oracle preserved the legitimate caller's two non-zero controls and an answering
path for the empty view.

## Apply record

Command (run once, then repeated without modification):

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000002_p100_frontend_views_invoker.sql
```

Verbatim combined output, including the captured status after each invocation:

```text
ALTER VIEW
ALTER VIEW
ALTER VIEW
FIRST APPLY EXIT STATUS: 0
ALTER VIEW
ALTER VIEW
ALTER VIEW
SECOND APPLY EXIT STATUS: 0
```

The file deliberately does not use `IF EXISTS`: a stale name list must make the apply fail rather than
silently produce an incomplete conversion. Re-running `ALTER VIEW ... SET (security_invoker = true)`
is itself idempotent; no migration-ledger row was fabricated.

## Before and after census

Both identities were resolved live by email from `auth.users`, then each read ran inside a transaction
with `role authenticated` and a signed-claim-shaped `request.jwt.claims`. The classifier captures the
producer status before extracting its last line: numeric output with `psql` status 0 is `ANSWERED`;
status 3 plus `permission denied for` is `DENIED`; malformed output, a timeout, a dropped connection,
an unrelated SQL error, or any other status is `INSTRUMENT-CANNOT-RUN` and exits 3. That 0/3 contract
was derived live in `100-RESEARCH.md` §9.1, and every read below is classified rather than merely
counted.

Verbatim pre-apply output:

```text
PRE owner mous_frontend ANSWERED count=2 psql_rc=0
PRE owner event_details ANSWERED count=0 psql_rc=0
PRE owner working_group_stats ANSWERED count=6 psql_rc=0
PRE non-owner mous_frontend ANSWERED count=2 psql_rc=0
PRE non-owner event_details ANSWERED count=0 psql_rc=0
PRE non-owner working_group_stats ANSWERED count=6 psql_rc=0

PRE-APPLY VIEW FLAGS
event_details|security_invoker=false
mous_frontend|security_invoker=false
working_group_stats|security_invoker=false
```

Verbatim post-apply classified census output:

```text
POST owner mous_frontend ANSWERED count=2 psql_rc=0
POST owner event_details ANSWERED count=0 psql_rc=0
POST owner working_group_stats ANSWERED count=6 psql_rc=0
POST non-owner mous_frontend ANSWERED count=2 psql_rc=0
POST non-owner event_details ANSWERED count=0 psql_rc=0
POST non-owner working_group_stats ANSWERED count=6 psql_rc=0
```

The owner controls are literal measurements fixed at HEAD: `mous_frontend=2` and
`working_group_stats=6`. Because both are non-zero, this census demonstrably sees rows and cannot turn
a dead read path into a false green. The non-owner before/after counts are, respectively,
`mous_frontend 2 -> 2`, `event_details 0 -> 0`, and `working_group_stats 6 -> 6`.

`event_details` is EMPTY on staging, so its green establishes an unbroken read path and NOT row
scoping. Its owner and non-owner counts are both zero before and after: at this empty bound, a working
boundary and an absent boundary both return zero. It is therefore required to answer, not to match a
discriminating count.

## Per-view boundary inventory

The base-table inventory below was re-derived live from `pg_class.relrowsecurity` and `pg_policies`.
Every named base table has RLS enabled and at least one SELECT policy.

### `mous_frontend`

- Base table: `mous` (`rls=true`). Its SELECT policies are `mous_org_isolation_select`
  (`organization_id = auth.jwt()->>'org_id'`), `mous_select_authenticated`
  (`auth.role()='authenticated'`), and `mous_select_service_role`.
- Row-deciding inputs: the view has no `WHERE`, so inclusion is the base `mous` row admitted by the
  permissive RLS policies. For the frontend role, `auth.role()` currently admits every authenticated
  row; the signed JWT's `org_id` is an alternative admission path, not an additional restriction.
- Caller control: the page can control search text (`reference_number`/bilingual title),
  `workflow_state`, and ordering after authorization. The session selects the caller's signed JWT and
  authenticated role, but browser input cannot forge either claim. Those frontend filters can narrow
  returned rows and cannot broaden what base-table RLS admits.
- Non-owner: `2 -> 2`; unchanged because the live authenticated SELECT policy is intentionally broad.
  Owner control: exactly 2 after conversion.

### `event_details`

- Base tables: `events`, `event_attendees`, `dossiers`, and `countries` (all `rls=true`). `events` and
  `event_attendees` have SELECT `USING (true)`; `dossiers` uses the caller identity to compare dossier
  sensitivity with profile/function-derived clearance; `countries` admits an authenticated identity
  (and independently active dossiers).
- Row-deciding inputs: an `events` row alone decides whether the outer row exists. The two lateral
  lookups use attendee `type`, prefer `role='host'`, order by `created_at`, and take one organizer and
  one country; dossier/country visibility can change those projected fields but the `LEFT JOIN`s do not
  remove the event row.
- Caller control: the page controls month bounds on `start_datetime`, optional title search, event
  `type`, and ordering. The caller's signed identity controls which clearance policy is evaluated but
  cannot be forged by ordinary query input. Page filters narrow only the already-authorized result.
- Non-owner: `0 -> 0`; unchanged only as an empty-on-staging bound. The read answered with status 0,
  which proves availability but not discriminatory row scoping.

### `working_group_stats`

- Base tables: `working_groups`, `dossiers`, `working_group_members`,
  `working_group_deliverables`, `working_group_meetings`, and `working_group_decisions` (all
  `rls=true`). `working_groups` has SELECT `USING (true)`; `dossiers` and each child-stat table enforce
  caller-clearance checks through `auth.uid()`/`get_user_clearance_level(auth.uid())`; members also
  have an alternative signed-`org_id` policy.
- Row-deciding inputs: an admitted `working_groups` row must join an admitted `dossiers` row whose
  `type='working_group'` and status is neither `archived` nor `deleted`. Child status/member-type,
  meeting date, and the child tables' clearance/org policies decide aggregate values, not whether the
  parent view row exists.
- Caller control: the hook requests all rows and computes UI totals locally; it supplies no server-side
  row filter. The signed caller identity determines dossier clearance and signed `org_id`; ordinary
  browser input cannot forge those claims.
- Non-owner: `6 -> 6`; unchanged because all six live parent dossiers are visible at this caller's
  clearance. Owner control: exactly 6 after conversion.

Verbatim compact catalog output supporting that inventory:

```text
countries|rls=true|select_policies=countries_select_active: (EXISTS ( SELECT 1
   FROM dossiers
  WHERE ((dossiers.id = countries.id) AND (dossiers.status = 'active'::text)))); countries_select_authenticated: (auth.uid() IS NOT NULL)
dossiers|rls=true|select_policies=Users can view dossiers within clearance: (sensitivity_level <= ( SELECT COALESCE(profiles.clearance_level, 1) AS "coalesce"
   FROM profiles
  WHERE (profiles.user_id = auth.uid()))); view_dossiers_authenticated: (sensitivity_level <= get_user_clearance_level(auth.uid()))
event_attendees|rls=true|select_policies=event_attendees_select: true
events|rls=true|select_policies=events_authenticated_read: true
mous|rls=true|select_policies=mous_org_isolation_select: (organization_id = ((auth.jwt() ->> 'org_id'::text))::uuid); mous_select_authenticated: (auth.role() = 'authenticated'::text); mous_select_service_role: (auth.role() = 'service_role'::text)
working_group_decisions|rls=true|select_policies=view_wg_decisions_by_dossier_access: (EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = working_group_decisions.working_group_id) AND (d.type = 'working_group'::text) AND (d.status <> ALL (ARRAY['archived'::text, 'deleted'::text])) AND (get_user_clearance_level(auth.uid()) >= d.sensitivity_level))))
working_group_deliverables|rls=true|select_policies=view_wg_deliverables_by_dossier_access: (EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = working_group_deliverables.working_group_id) AND (d.type = 'working_group'::text) AND (d.status <> ALL (ARRAY['archived'::text, 'deleted'::text])) AND (get_user_clearance_level(auth.uid()) >= d.sensitivity_level))))
working_group_meetings|rls=true|select_policies=view_wg_meetings_by_dossier_access: (EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = working_group_meetings.working_group_id) AND (d.type = 'working_group'::text) AND (d.status <> ALL (ARRAY['archived'::text, 'deleted'::text])) AND (get_user_clearance_level(auth.uid()) >= d.sensitivity_level))))
working_group_members|rls=true|select_policies=view_wg_members_by_dossier_access: (EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = working_group_members.working_group_id) AND (d.type = 'working_group'::text) AND (d.status <> ALL (ARRAY['archived'::text, 'deleted'::text])) AND (get_user_clearance_level(auth.uid()) >= d.sensitivity_level)))); working_group_members_org_isolation_select: (organization_id = ((auth.jwt() ->> 'org_id'::text))::uuid)
working_groups|rls=true|select_policies=working_groups_authenticated_read: true
```

## Post-apply oracles

The named-view oracle's verbatim output (exit 0):

```text
P100-02-FLAG invoker_on=3 present=3 expected invoker_on=3 present=3
PASS invoker-flag
```

The oracle first counts the three exact names. Presence other than 3 exits 3 as a stale-name
instrument fault. It then independently counts those exact names carrying
`security_invoker=true`; a partial conversion such as `invoker_on=2` exits 1 and names the one-view
shortfall.

The legitimate-caller oracle's verbatim output (exit 0):

```text
P100-02 reads: mous_frontend=2/2 working_group_stats=6/6 event_details=0(empty-on-staging)
PASS reads
```

This result was obtained after the second apply. It establishes all three catalog flags, both non-zero
owner controls, and an answering authenticated path for the explicitly empty staging view. No later
task is needed to complete P100-02; P100-13 owns the phase-wide re-census after later `search_path`
changes.
