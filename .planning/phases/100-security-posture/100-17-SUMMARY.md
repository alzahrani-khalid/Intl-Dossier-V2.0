---
phase: 100-security-posture
plan: 17
status: complete
completed: 2026-09-10
requirements: [DBSEC-03]
---

# P100-17: invoker-consumed materialized views

## Result

The five materialized views render only `postgres` and `service_role` as grantees. The six named
consumers and the new RPC are `SECURITY DEFINER SET search_path = public`. `anon` cannot execute any of
the seven definer functions; `authenticated` can. The productivity RPC, deployed relationship-health
list endpoint, and rolled-back `entity_citations` write control all pass.

## Planning-bound census

Prior census (unchanged by this repair) found the five-view consumer population and the backend sweep:

```text
FUNCTION|aa_commitment_summary_by_dossier|refresh_aa_commitment_summary()|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_citation_network_graph(citation_source_type,uuid,integer,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_entity_citations(citation_source_type,uuid,text,boolean,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|refresh_citation_network_on_change()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_commitment_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_engagement_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|get_team_workload(uuid)|owner=postgres|secdef=true|config=search_path=public
FUNCTION|user_productivity_metrics|get_user_productivity_metrics(uuid)|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|refresh_user_productivity_metrics()|owner=postgres|secdef=true|config=<none>
VIEW|relationship_commitment_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
VIEW|relationship_engagement_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
TRIGGER|citation_network|trigger_refresh_citation_network|table=entity_citations|function=refresh_citation_network_on_change()
BACKEND_SWEEP
user_productivity_metrics backend/src hits=3
relationship_engagement_stats backend/src hits=6
relationship_commitment_stats backend/src hits=6
citation_network backend/src hits=3
aa_commitment_summary_by_dossier backend/src hits=2
control from('dossiers') backend/src hits=12
CENSUS_EXIT=0
```

## Changed hunks and security boundary

- `supabase/migrations/20260910000002_p100_matview_invoker_consumers_definer.sql` now recreates the
  three caller-readable functions with the same signatures and only adds explicit caller scoping:
  - `get_user_productivity_metrics(uuid)` keeps `pm.user_id = p_user_id` and additionally requires
    `pm.user_id = auth.uid()`. An earlier revision of this migration also admitted users sharing an
    active `organization_members` row with the target; review found that shared-organization branch in
    none of the cited source-table policies (`tasks_select_policy` is assignee/created_by/
    task_contributors, `ticket_select` is assigned_unit/created_by/assigned_to, the aa_commitments
    policy is assignment-based - none is organization-scoped), so the org branch was dropped. The
    definer path now returns exactly the caller's own productivity row, which is the
    `p_user_id = auth.uid()` re-scoping the criterion names first.
  - `get_entity_citations(...)` reapplies `entity_citations` policy `Users can view citations in their
    organization`: `ec.organization_id` must be in the caller's active `organization_members` rows.
    Disclosure: beyond that predicate this body also carries a silent repair - the outgoing arm selects
    `NULL::TEXT` for `external_title`. The original body (20260112800001) selected 11 columns against a
    12-column `RETURNS TABLE`, which would fail at runtime; the `NULL::TEXT` placeholder restores the
    column count without changing any value the invoker path returned.
  - `get_citation_network_graph(...)` applies the same active-organization predicate to every
    `citation_network` edge considered. Disclosure: to make that per-edge predicate expressible, the
    original three-arm `UNION` recursion was restructured into a single recursive arm with `CASE`
    expressions picking the far side of each edge; traversal, cycle-prevention (`NOT ... = ANY(path)`)
    and NULL-target handling are semantically equivalent to the original.
- The three refresh helpers (`refresh_citation_network_on_change`, `refresh_relationship_health_stats`,
  `refresh_aa_commitment_summary`) return no rows; their bodies stay refresh-only and only become
  definer+pinned.
- `get_relationship_health_summary()` remains `SETOF public.relationship_health_summary`, but no longer
  does a bare definer `SELECT *`. It reapplies `dossier_relationships` policy `Users can view
  relationships within clearance`: both source and target dossiers must have
  `sensitivity_level <= COALESCE((SELECT clearance_level FROM public.profiles WHERE user_id = auth.uid()), 1)`.
  The predicate is adapted, not verbatim: the policy text in migration 20251022000006 joins
  `profiles.id = auth.uid()`, while the live `profiles` table keys the user on `user_id`, so the RPC
  uses `profiles.user_id = auth.uid()`.
- The migration revokes execute from `PUBLIC, anon` on all seven functions, grants the new RPC to
  `authenticated, service_role`, and revokes all privileges from `anon, authenticated` on the five
  materialized views.
- `supabase/functions/relationship-health/index.ts` keeps only the two GET reads of
  `relationship_health_summary` on `.rpc('get_relationship_health_summary')` with filters preserved.
  The post-calculate fetch is back on the caller-scoped `.from('relationship_health_summary').select('*')`
  path, and JWT validation is unchanged.
  FLAGGED FOR OVERSEER RULING: that caller-scoped post-calculate read (index.ts:585-588) selects
  `relationship_health_summary`, whose invoker path touches `relationship_engagement_stats` and
  `relationship_commitment_stats` - both now revoked from `authenticated`. Once the pre-existing
  42702 (`relationship_id is ambiguous`) inside `calculate_relationship_health_scores` is fixed, this
  read will fail with `permission denied for materialized view`. The criterion pins this read
  caller-scoped and forbids moving it, and the endpoint is already red upstream today, so it is
  recorded here for a ruling rather than edited.

This change intentionally widens privilege only at the function owner boundary needed to read the five
revoked materialized views. The widened read is re-scoped in each caller-readable function as above; the
refresh/trigger functions return no rows.

## Deploy and migration applies

The relationship-health function had already been deployed successfully before the migration applies:

```text
DEPLOY_RETRY_START_UTC=2026-09-10T16:25:21Z
Deploying Function: relationship-health (script size: 738 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
DEPLOY_RETRY_END_UTC=2026-09-10T16:25:51Z
DEPLOY_RETRY_EXIT=0
```

After restoring the post-calculate read to the caller-scoped view, I redeployed the edge function:

```text
DEPLOY_CALCULATE_SCOPE_START_UTC=2026-09-10T18:02:36Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: relationship-health
Deploying Function: relationship-health (script size: 738 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_CALCULATE_SCOPE_END_UTC=2026-09-10T18:02:47Z
DEPLOY_CALCULATE_SCOPE_EXIT=0
```

Final idempotent apply after this repair:

```text
APPLY7_START_UTC=2026-09-10T17:45:20Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY7_END_UTC=2026-09-10T17:45:23Z
APPLY7_EXIT=0
APPLY8_START_UTC=2026-09-10T17:45:23Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY8_END_UTC=2026-09-10T17:45:26Z
APPLY8_EXIT=0
```

Applies after the `get_user_productivity_metrics` re-scoping fix (org branch dropped, `auth.uid()` only),
run twice to prove the repaired file is still idempotent:

```text
APPLY9_START_UTC=2026-09-10T18:47:38Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY9_EXIT=0
APPLY9_END_UTC=2026-09-10T18:47:40Z
APPLY10_START_UTC=2026-09-10T18:47:50Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY10_EXIT=0
APPLY10_END_UTC=2026-09-10T18:47:52Z
```

## Command oracles

All three command oracles plus the consumer-controls script were re-run after APPLY9/APPLY10 (outputs
below are the verbatim post-fix runs; the pre-fix runs were byte-identical on the three catalog oracles
because the fix narrows a function body, not grants or definer state).

### Grants

```text
P100-17-GRANTS named=5 rendered=5 at_expected_full_state=5 expected rendered=5 at_expected_full_state=5
  GRANTS aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS citation_network | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_productivity_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
```

### Definer + pinned search_path

```text
P100-17-DEFINER functions=7 definer_and_pinned=7 expected 7 and 7
  FN get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer, p_max_nodes integer) secdef=true search_path=public
  FN get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text, p_include_external boolean, p_limit integer) secdef=true search_path=public
  FN get_relationship_health_summary() secdef=true search_path=public
  FN get_user_productivity_metrics(p_user_id uuid) secdef=true search_path=public
  FN refresh_aa_commitment_summary() secdef=true search_path=public
  FN refresh_citation_network_on_change() secdef=true search_path=public
  FN refresh_relationship_health_stats() secdef=true search_path=public
PASS definer-pinned
```

### Anon execute denied

```text
P100-17-ANON functions=7 anon_denied=7 expected 7 and 7
  FN get_citation_network_graph anon=false authenticated=true
  FN get_entity_citations anon=false authenticated=true
  FN get_relationship_health_summary anon=false authenticated=true
  FN get_user_productivity_metrics anon=false authenticated=true
  FN refresh_aa_commitment_summary anon=false authenticated=true
  FN refresh_citation_network_on_change anon=false authenticated=true
  FN refresh_relationship_health_stats anon=false authenticated=true
PASS anon-execute
```

### Real-user controls

```text
P100-17 consumer controls: rpc_get_user_productivity_metrics=200 relationship-health=200 entity_citations_write=ok(rolled-back) expected 200 200 ok(rolled-back)
PASS consumer controls
```

## Two-identity census

The live staging populations are empty for the four underlying surfaces, so the equality proof is zero
versus zero, not row-discriminating fixture data:

```text
BASELINE|user_productivity_metrics=0
BASELINE|entity_citations=0
BASELINE|citation_network=0
BASELINE|active_bilateral_relationships=0
TWO_ID|owner|uid=de2734cf-f962-4e05-bf62-bc9e92efff96
TWO_ID|owner|productivity|definer=0|underlying_explicit=0
TWO_ID|owner|get_entity_citations|definer=0|underlying_explicit=0
TWO_ID|owner|get_citation_network_graph|definer_edges=0|underlying_explicit_edges=0
TWO_ID|owner|get_relationship_health_summary|definer=0|underlying_explicit=0
TWO_ID|non_owner|uid=a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772
TWO_ID|non_owner|productivity|definer=0|underlying_explicit=0
TWO_ID|non_owner|get_entity_citations|definer=0|underlying_explicit=0
TWO_ID|non_owner|get_citation_network_graph|definer_edges=0|underlying_explicit_edges=0
TWO_ID|non_owner|get_relationship_health_summary|definer=0|underlying_explicit=0
```

After the `get_user_productivity_metrics` narrowing (org branch dropped), the cross-identity case was
re-checked directly: the non-owner calling the definer function for the OWNER's id now returns 0 rows
(exactly what the invoker path returned - the old body filtered `pm.user_id = p_user_id` under invoker
RLS on the source tables, which admit only the caller's own rows), and a direct read of the matview as
`authenticated` is now refused, proving the revoke:

```text
NONOWNER_DEFINER_FOR_OWNER=0
NONOWNER_DEFINER_FOR_SELF=0
ERROR:  permission denied for materialized view user_productivity_metrics
```

The live staging populations are still empty, so the equality remains 0=0 and non-discriminating on
fixture data; the narrowing is verifiable by inspection (`pm.user_id = auth.uid()` admits only the
caller's own row regardless of `p_user_id`).

P100-08 must re-derive its pinned-search-path digest after this task; this task adds seven pinned definer
functions to that population.
