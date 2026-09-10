---
phase: 100-security-posture
plan: 03
status: complete
completed: 2026-09-10
---

# P100-03 Summary

All seven caller-JWT edge-function views now carry `security_invoker=true` on staging. The designated
owner reads 5 country rows, 3 regional rows, and 32 timeline rows. The other four views answer rather
than denying.

## Migration and staging applies

The migration sets the seven view options independently. Conversion exposed a pre-existing gap in the
timeline's driving-table policy: the designated owner is an admin, but the existing
`work_item_dossiers_select` policy admitted only item owners/assignees and returned 17 of the required
32 links. The migration therefore also creates the narrowly scoped, idempotent
`p100_admin_read_work_item_dossiers` SELECT policy. Its row input is the authenticated UUID joined to
the server-stored `public.users.role = 'admin'`; the request cannot set that database value. A
rollback-only trial produced `owner|32` and `other|0` before the policy was applied.

The finalized migration was applied twice with:

```sh
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260908000003_p100_edge_views_invoker.sql
```

First apply, verbatim output and exit status:

```text
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
DO
exit=0
```

Second apply, verbatim output and exit status:

```text
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
ALTER VIEW
DO
exit=0
```

## Client-construction check

Every named-view read uses the request-scoped client shown below. No named view turned out to be read
with `service_role`.

| View | Reading edge function | Client used for this view read |
| --- | --- | --- |
| `theme_details` | `supabase/functions/themes/index.ts` | `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') }}})` |
| `relationship_health_summary` | `supabase/functions/relationship-health/index.ts` | `SUPABASE_ANON_KEY` plus the request `Authorization` header. The file separately creates a service-role client for alert insertion and calculation RPCs, but fetches this view through the caller-JWT client. |
| `v_country_engagement_metrics` | `supabase/functions/geographic-visualization/index.ts` | `SUPABASE_ANON_KEY` plus the request `Authorization` header |
| `v_country_relationship_flows` | `supabase/functions/geographic-visualization/index.ts` | `SUPABASE_ANON_KEY` plus the request `Authorization` header |
| `v_regional_engagement_summary` | `supabase/functions/geographic-visualization/index.ts` | `SUPABASE_ANON_KEY` plus the request `Authorization` header |
| `engagement_recommendations_summary` | `supabase/functions/engagement-recommendations/index.ts` | `SUPABASE_ANON_KEY` plus the request `Authorization` header. A separate service-role client performs generation RPCs; it does not read this view. |
| `dossier_activity_timeline` | `supabase/functions/dossier-activity-timeline/index.ts` | `SUPABASE_ANON_KEY` plus the validated Bearer token copied from the request `Authorization` header |

Thus these reads execute as `authenticated`; revoking that role would break their edge-function read
paths.

## Bases, RLS, and row-deciding inputs

All ordinary tables below have RLS on. `relationship_engagement_stats` and
`relationship_commitment_stats` are materialized views, so table RLS does not apply to them.
Caller-controlled URL filters can only narrow rows surviving the base-relation policies.

| View | Direct base relations and RLS state | Inputs that decide visibility; caller control |
| --- | --- | --- |
| `theme_details` | `themes` (RLS on), `dossiers` (RLS on) | Theme/dossier identity and `type='theme'`; dossier sensitivity versus the profile clearance selected by `auth.uid()`. The caller chooses a valid JWT identity and the requested `id`, but cannot put a different signed `sub` or clearance into the request. |
| `relationship_health_summary` | `dossier_relationships`, `dossiers`, `relationship_health_scores` (RLS on); `relationship_engagement_stats`, `relationship_commitment_stats` (materialized, no RLS) | Active bilateral relationship plus both dossiers' sensitivity versus the authenticated profile clearance; health scores require a non-null `auth.uid()`. The caller controls relationship id, trend/score filters, ordering, and pagination, not stored sensitivity/clearance. |
| `v_country_engagement_metrics` | `countries`, `country_coordinates`, `dossiers`, `engagement_dossiers` (RLS on) | A non-null authenticated UUID admits countries, coordinates are readable to authenticated, dossier rows are clearance-limited, and engagement-dossier rows require a non-archived dossier. The caller controls region/country query filters, which only narrow the policy result. |
| `v_country_relationship_flows` | `dossier_relationships`, `dossiers`, `countries`, `country_coordinates` (RLS on) | Active relationships whose source and target dossiers both fit the authenticated profile clearance; country rows require authentication and coordinates are openly selectable by authenticated. The caller controls relationship-type filters, not clearance or relationship status. |
| `v_regional_engagement_summary` | `countries`, `engagement_dossiers`, `dossiers`, `dossier_relationships` (RLS on) | Authenticated country rows, non-archived engagement dossiers, clearance-limited dossier and relationship endpoints. The endpoint exposes no row-expanding filter; request filters cannot replace `auth.uid()` or stored clearance. |
| `engagement_recommendations_summary` | `engagement_recommendations`, `dossier_relationships`, `dossiers`, `relationship_health_scores` (RLS on) | Recommendation and health-score reads require a non-null authenticated UUID; relationship and both dossier joins are clearance-limited; expired/superseded status is excluded by the view. The caller controls ids, status/type/urgency/priority/confidence filters, sorting, and pagination, not the JWT identity after validation or stored clearance. |
| `dossier_activity_timeline` | `work_item_dossiers`, `tasks`, `aa_commitments`, `intake_tickets` (RLS on) | Dossier clearance and work-item ownership/assignment decide ordinary visibility; the added admin arm uses `auth.uid()` plus server-stored `public.users.role`. Joined task, commitment, and intake policies use owner/creator/assignee/unit/contributor inputs. The caller controls dossier id, cursor, type/source filters, and limit, but those only narrow rows and cannot set the stored role/ownership fields. |

## Non-owner before/after census

The census used `test.user@gmail.com`, `SET LOCAL ROLE authenticated`, and a signed-identity-shaped
`request.jwt.claims` value. Every read was classified: exit 0 plus a numeric value is **answered**;
exit 3 plus a permission-denied error is **denied**; every other result is **neither** and exits 3 as
`INSTRUMENT-CANNOT-RUN` rather than being charged to the application.

| View | Before | After | Classification after |
| --- | ---: | ---: | --- |
| `theme_details` | 0 | 0 | answered (psql 0, numeric) |
| `relationship_health_summary` | 0 | 0 | answered (psql 0, numeric) |
| `v_country_engagement_metrics` | 5 | 5 | answered (psql 0, numeric) |
| `v_country_relationship_flows` | 0 | 0 | answered (psql 0, numeric) |
| `v_regional_engagement_summary` | 3 | 3 | answered (psql 0, numeric) |
| `engagement_recommendations_summary` | 0 | 0 | answered (psql 0, numeric) |
| `dossier_activity_timeline` | 32 | 0 | answered (psql 0, numeric) |

Post-apply census output, verbatim:

```text
P100-03 AFTER non-owner=a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772
theme_details|answered|rc=0|count=0
relationship_health_summary|answered|rc=0|count=0
v_country_engagement_metrics|answered|rc=0|count=5
v_country_relationship_flows|answered|rc=0|count=0
v_regional_engagement_summary|answered|rc=0|count=3
engagement_recommendations_summary|answered|rc=0|count=0
dossier_activity_timeline|answered|rc=0|count=0
```

`theme_details`, `relationship_health_summary`, `v_country_relationship_flows`, and
`engagement_recommendations_summary` are **EMPTY on staging**. Their green results establish an
unbroken authenticated read path; because a count assertion on an empty view cannot fail by returning
fewer rows, those greens establish **NOT row scoping**.

## Post-apply oracles

The exact plan commands were loaded from the plan front matter and run after the second finalized
apply. Verbatim output:

```text
P100-03 POST-APPLY ORACLE 1
P100-03-FLAG invoker_on=7 present=7 expected invoker_on=7 present=7
PASS invoker-flag
exit=0
P100-03 POST-APPLY ORACLE 2
P100-03 reads: v_country_engagement_metrics=5/5 v_regional_engagement_summary=3/3 dossier_activity_timeline=32/32 theme_details=0(empty-on-staging) relationship_health_summary=0(empty-on-staging) v_country_relationship_flows=0(empty-on-staging) engagement_recommendations_summary=0(empty-on-staging)
PASS reads
exit=0
```

The catalog oracle separately proves `present=7`; a missing named view is an instrument failure (exit
3). It also proves `invoker_on=7`; converting six reports `invoker_on=6`, names the one-object
shortfall arithmetically, and fails without depending on sibling plans.
