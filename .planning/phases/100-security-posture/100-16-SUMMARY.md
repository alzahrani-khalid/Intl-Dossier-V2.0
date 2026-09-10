---
status: complete
task: P100-16
repair_commit: d7a519edc
migration_commit: e1792a23b
---

# P100-16 — Consumed materialized-view closure

## Outcome

The repair was deployed before either migration apply. Both client roles are now revoked from all four
consumed materialized views, `service_role` remains an explicit grantee on each, and all three deployed
functions still answer the `.env.test` user's real JWT with HTTP 200 after the revoke.

## Repair and changed-hunk evidence

The reachable repair commit is `d7a519edc` (`fix(security): isolate consumed matview reads`). Its diff
against parent `34defa80f` is the authority for these citations:

- `supabase/functions/dossier-stats/index.ts`: the unchanged anon-key caller client is at lines 37–45 and
  its unchanged `supabaseClient.auth.getUser(token)` JWT gate is at line 51, before the new service client
  at lines 71–74. Only `dossier_engagement_stats` and `dossier_commitment_stats` moved: the single path at
  lines 123–135 and bulk path at lines 409–420. `document_relations`, `health_scores`, and every other read
  still use `supabaseClient`.
- `supabase/functions/tag-hierarchy/index.ts`: the unchanged anon-key client is at lines 84–88 and its
  unchanged `supabase.auth.getUser()` gate is at line 94. Only the `analytics` case creates a service-role
  client, at lines 241–245, for `mv_tag_usage_analytics` at lines 246–249. Every other `handleGet` case and
  every write handler still receive the caller-scoped `supabase` client.
- `supabase/functions/stakeholder-influence/index.ts`: the unchanged anon-key client is at lines 215–223
  and the unchanged `getAuthUser(req, supabase)` JWT gate is at line 226. Only the default list path creates
  the local service-role client at lines 641–645 and uses it for `stakeholder_network_summary`. Every other
  GET read stays on `supabase`; the pre-existing POST calculation service client is unchanged.
- `supabase/migrations/20260910000001_p100_matview_revoke_consumed.sql`: lines 1–4 are exactly one
  `REVOKE ALL ... FROM anon, authenticated` for each named view and nothing else.

Thus the caller JWT is still verified with the existing anon-key `getUser` pattern before any data read;
only the four named materialized-view reads moved to clients built from
`SUPABASE_SERVICE_ROLE_KEY`.

## Re-derived source census — planning bound

Command:

```bash
for view in dossier_engagement_stats dossier_commitment_stats mv_tag_usage_analytics stakeholder_network_summary; do for area in backend/src supabase/functions; do n=$(git grep -lIF -e "$view" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf '%s %s files_naming=%s\n' "$view" "$area" "$n"; done; done; for area in backend/src supabase/functions; do n=$(git grep -lIF -e "from('dossiers')" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf "control from('dossiers') %s files=%s\n" "$area" "$n"; done
```

Verbatim output:

```text
dossier_engagement_stats backend/src files_naming=2
dossier_engagement_stats supabase/functions files_naming=2
dossier_commitment_stats backend/src files_naming=2
dossier_commitment_stats supabase/functions files_naming=3
mv_tag_usage_analytics backend/src files_naming=1
mv_tag_usage_analytics supabase/functions files_naming=1
stakeholder_network_summary backend/src files_naming=1
stakeholder_network_summary supabase/functions files_naming=1
control from('dossiers') backend/src files=5
control from('dossiers') supabase/functions files=53
CENSUS_EXIT=0
```

The non-zero controls prove both source areas were traversed. The backend hits are generated types. Beyond
the three repaired functions, the function hits are `calculate-health-score` and
`refresh-commitment-stats`, whose relevant clients already use `SUPABASE_SERVICE_ROLE_KEY`; no fourth
caller-scoped consumer was found.

## Deploys — completed before migration

Each used `DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase
functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg`.

### dossier-stats

```text
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: dossier-stats
No change found in Function: dossier-stats
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["dossier-stats"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_DOSSIER_STATS_EXIT=0
```

### tag-hierarchy

```text
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: tag-hierarchy
No change found in Function: tag-hierarchy
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["tag-hierarchy"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_TAG_HIERARCHY_EXIT=0
```

### stakeholder-influence

```text
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: stakeholder-influence
No change found in Function: stakeholder-influence
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["stakeholder-influence"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_STAKEHOLDER_INFLUENCE_EXIT=0
```

## Pre-revoke positive control

The plan's deployed-function command oracle was run with the `.env.test` password grant and an active
dossier resolved from staging. Verbatim output:

```text
P100-16 deployed-function reads: dossier-stats=200 tag-hierarchy=200 stakeholder-influence=200 expected 200 200 200
PASS deployed reads
```

## Migration apply and idempotent replay

Command for each apply:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260910000001_p100_matview_revoke_consumed.sql
```

First apply, verbatim:

```text
REVOKE
REVOKE
REVOKE
REVOKE
MIGRATION_APPLY_1_EXIT=0
```

Second apply, verbatim:

```text
REVOKE
REVOKE
REVOKE
REVOKE
MIGRATION_APPLY_2_EXIT=0
```

## Post-revoke command oracles

### Complete grants oracle

The plan's P100-16-GRANTS command oracle was run verbatim. Its verbatim output is:

```text
P100-16-GRANTS named=4 rendered=4 at_expected_full_state=4 expected rendered=4 at_expected_full_state=4
  GRANTS dossier_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS dossier_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS stakeholder_network_summary | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
```

Every grantee is rendered: only `postgres` and `service_role` appear, both with the expected complete ACL;
`has_table_privilege` is false for `anon` and `authenticated` and true for `service_role` on every view.

### Deployed-read positive control after revoke

The plan's deployed-function command oracle was run again with a fresh real JWT after both applies.
Verbatim output:

```text
P100-16 deployed-function reads: dossier-stats=200 tag-hierarchy=200 stakeholder-influence=200 expected 200 200 200
PASS deployed reads
```

The grants oracle is the discriminating arm and this is its availability control: together they establish
“revoked and still served,” rather than merely “revoked” or “still served.”

## Security boundary

A PostgreSQL materialized view has no RLS, so the authenticated reads at HEAD already returned the whole
materialized result. Moving only those reads to `service_role` de-scopes NOTHING: the existing caller JWT
check remains mandatory and the function returns the same full-view data it could return before. Designing
row-scoped replacements for these materialized views is a separate phase question.
