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
  - `get_user_productivity_metrics(uuid)` keeps `pm.user_id = p_user_id` and additionally requires the
    requested user to be `auth.uid()` or in a shared active organization membership. This mirrors the
    organization/assignment intent of `tasks_select_policy`, `Users can view aa_commitments for assigned
    dossiers or owned co`, and `ticket_select`.
  - `get_entity_citations(...)` reapplies `entity_citations` policy `Users can view citations in their
    organization`: `ec.organization_id` must be in the caller's active `organization_members` rows.
  - `get_citation_network_graph(...)` applies the same active-organization predicate to every
    `citation_network` edge considered.
- The three refresh helpers (`refresh_citation_network_on_change`, `refresh_relationship_health_stats`,
  `refresh_aa_commitment_summary`) return no rows; their bodies stay refresh-only and only become
  definer+pinned.
- `get_relationship_health_summary()` remains `SETOF public.relationship_health_summary`, but no longer
  does a bare definer `SELECT *`. It reapplies `dossier_relationships` policy `Users can view
  relationships within clearance`: both source and target dossiers must have
  `sensitivity_level <= COALESCE((SELECT clearance_level FROM public.profiles WHERE user_id = auth.uid()), 1)`.
- The migration revokes execute from `PUBLIC, anon` on all seven functions, grants the new RPC to
  `authenticated, service_role`, and revokes all privileges from `anon, authenticated` on the five
  materialized views.
- `supabase/functions/relationship-health/index.ts` already had all three summary reads on
  `.rpc('get_relationship_health_summary')` with filters preserved; this repair did not move any other
  read or change JWT validation.

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

## Command oracles

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

P100-08 must re-derive its pinned-search-path digest after this task; this task adds seven pinned definer
functions to that population.
