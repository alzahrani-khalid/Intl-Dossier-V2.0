---
phase: 100-security-posture
plan: 6
status: blocked
blocked_by: authenticated edge callers on four materialized views require out-of-scope caller changes
---

# P100-06 — Materialized-view client grants

## Outcome

The safe portion is applied. The changed hunk in
`supabase/migrations/20260908000006_p100_materialized_views_restrict.sql` contains these eight
idempotent revocations for the views with no tracked caller:

```sql
REVOKE ALL ON public.citation_network FROM anon, authenticated;
REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
```

Those eight now have only `postgres` and `service_role` as grantees and deny authenticated reads.
The 112-row `dossier_list_mv` exposure is closed while `service_role` still reads the same 112 rows.

Criterion 3 remains blocked on four views. Their edge callers use `SUPABASE_ANON_KEY` plus the request
`Authorization` header and therefore run as `authenticated`; the plan's per-view stop clause requires
naming rather than breaking them. Changing those callers is outside this task's two-path write scope.

## Pre-revocation source census — planning bound

Command:

```bash
for view in citation_network aa_commitment_summary_by_dossier sla_compliance_metrics user_productivity_metrics dossier_engagement_stats dossier_commitment_stats relationship_engagement_stats relationship_commitment_stats mv_tag_usage_analytics team_entity_stats dossier_list_mv stakeholder_network_summary dossiers; do
  front=$(git grep -lI -e "from('$view')" -e "from(\"$view\")" -- 'frontend/src/**' 2>/dev/null | wc -l | tr -d ' ')
  server=$(git grep -lI -e "from('$view')" -e "from(\"$view\")" -- 'backend/src/**' 'supabase/functions/**' 2>/dev/null | wc -l | tr -d ' ')
  printf '%s frontend_files=%s backend_edge_files=%s\n' "$view" "$front" "$server"
done
```

Verbatim output:

```text
citation_network frontend_files=0 backend_edge_files=0
aa_commitment_summary_by_dossier frontend_files=0 backend_edge_files=0
sla_compliance_metrics frontend_files=0 backend_edge_files=0
user_productivity_metrics frontend_files=0 backend_edge_files=0
dossier_engagement_stats frontend_files=0 backend_edge_files=2
dossier_commitment_stats frontend_files=0 backend_edge_files=3
relationship_engagement_stats frontend_files=0 backend_edge_files=0
relationship_commitment_stats frontend_files=0 backend_edge_files=0
mv_tag_usage_analytics frontend_files=0 backend_edge_files=1
team_entity_stats frontend_files=0 backend_edge_files=0
dossier_list_mv frontend_files=0 backend_edge_files=0
stakeholder_network_summary frontend_files=0 backend_edge_files=1
dossiers frontend_files=18 backend_edge_files=62
```

This is a planning bound, not the database gate; the `dossiers` control proves non-zero results were
observable.

## Mandatory key audit and retained reads

| Materialized view | Tracked caller client key | Result | Post-change `service_role` read |
| --- | --- | --- | --- |
| `dossier_engagement_stats` | `calculate-health-score/index.ts:109-112`: `SUPABASE_SERVICE_ROLE_KEY`; `dossier-stats/index.ts:37-44`: `SUPABASE_ANON_KEY` plus caller `Authorization` | Not revoked: would break `dossier-stats` | answered, 0 rows, rc 0 |
| `dossier_commitment_stats` | same two clients; `refresh-commitment-stats/index.ts:24-30`: `SUPABASE_SERVICE_ROLE_KEY` | Not revoked: would break `dossier-stats` | answered, 0 rows, rc 0 |
| `mv_tag_usage_analytics` | `tag-hierarchy/index.ts:83-88`: `SUPABASE_ANON_KEY` plus caller `Authorization` | Not revoked: would break `tag-hierarchy` | answered, 13 rows, rc 0 |
| `stakeholder_network_summary` | `stakeholder-influence/index.ts:215-223`: `SUPABASE_ANON_KEY` plus caller `Authorization`; its service client at 697-700 serves only the POST path | Not revoked: would break its read path | answered, 0 rows, rc 0 |

## Migration applies

Command, run twice:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
```

Verbatim first apply output (exit 0):

```text
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
FIRST_APPLY_EXIT=0
```

Verbatim second apply output (exit 0):

```text
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
SECOND_APPLY_EXIT=0
```

## Post-change grant census — every grantee

This authoritative query rendered every `aclexplode(c.relacl)` grantee and both
`has_table_privilege(..., 'SELECT')` answers. Verbatim output:

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
GRANTS_EXIT=0
```

The exact positive end state is proven for eight. The four `true` rows are the named blockers; no
`PUBLIC` grant is hidden in either population.

## Post-change behavioral reads — all twelve

Each read ran after `SET LOCAL ROLE authenticated`. Verbatim classifications:

```text
citation_network | DENIED | rc=3
aa_commitment_summary_by_dossier | DENIED | rc=3
sla_compliance_metrics | DENIED | rc=3
user_productivity_metrics | DENIED | rc=3
dossier_engagement_stats | ANSWERED rows=0 | rc=0
dossier_commitment_stats | ANSWERED rows=0 | rc=0
relationship_engagement_stats | DENIED | rc=3
relationship_commitment_stats | DENIED | rc=3
mv_tag_usage_analytics | ANSWERED rows=13 | rc=0
team_entity_stats | DENIED | rc=3
dossier_list_mv | DENIED | rc=3
stakeholder_network_summary | ANSWERED rows=0 | rc=0
```

Retained-access reads after `SET LOCAL ROLE service_role`:

```text
dossier_engagement_stats@service_role | ANSWERED rows=0 | rc=0
dossier_commitment_stats@service_role | ANSWERED rows=0 | rc=0
mv_tag_usage_analytics@service_role | ANSWERED rows=13 | rc=0
stakeholder_network_summary@service_role | ANSWERED rows=0 | rc=0
dossier_list_mv@service_role | ANSWERED rows=112 | rc=0
```

## Security limitation and handoff

A PostgreSQL materialized view has no RLS. Revoking client roles removes **CLIENT access**; it does not
row-scope materialized data for a role that still reads it. `service_role` continues to see each full
materialized result.

The overseer must move or redesign the four authenticated read paths before revoking their grants.
After that out-of-scope work, the migration must gain four more `REVOKE` statements and the full
twelve-view oracles must be rerun. Until then criterion 3 is not closed and this summary remains
`status: blocked`.
