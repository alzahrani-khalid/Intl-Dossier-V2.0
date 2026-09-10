---
phase: 100-security-posture
plan: 6
status: complete
---

# P100-06 — Materialized-view client grants

## Outcome and changed hunk

Criterion 3 is closed on live staging `zkrcjzdemdmwhearhfgg`. The changed hunk in
`supabase/migrations/20260908000006_p100_materialized_views_restrict.sql` contains one idempotent
`REVOKE` for each named materialized view:

```sql
REVOKE ALL ON public.citation_network FROM anon, authenticated;
REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
REVOKE ALL ON public.dossier_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.dossier_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.mv_tag_usage_analytics FROM anon, authenticated;
REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
REVOKE ALL ON public.stakeholder_network_summary FROM anon, authenticated;
```

## Source census — planning bound

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

This is a planning bound, not a database gate. The `dossiers` control proves non-zero results were
observable. Literal `.from('<view>')` searches also miss indirect dependencies.

## Caller keys, named breakages, and retained reads

The four materialized views with direct backend or edge callers were inspected at their client
construction and read sites. Each authenticated path named below breaks under the revocation; the
break is named rather than hidden by changing application callers outside this task's write scope.

| Materialized view | Caller client key | Authenticated impact | Post-revoke `service_role` read |
| --- | --- | --- | --- |
| `dossier_engagement_stats` | `dossier-stats/index.ts:39-42`: `SUPABASE_ANON_KEY` plus caller `Authorization`; reads at 119/405 | `dossier-stats` breaks | ANSWERED, 0 rows, rc 0 |
| `dossier_commitment_stats` | `dossier-stats/index.ts:39-42`: `SUPABASE_ANON_KEY` plus caller `Authorization`; reads at 127/412 | `dossier-stats` breaks | ANSWERED, 0 rows, rc 0 |
| `mv_tag_usage_analytics` | `tag-hierarchy/index.ts:85-87`: `SUPABASE_ANON_KEY` plus caller `Authorization`; reads at 242 | `tag-hierarchy` breaks | ANSWERED, 13 rows, rc 0 |
| `stakeholder_network_summary` | `stakeholder-influence/index.ts:217-220`: `SUPABASE_ANON_KEY` plus caller `Authorization`; reads at 641. Its separate service client at 699 is not used by that GET read. | `stakeholder-influence` breaks | ANSWERED, 0 rows, rc 0 |

An additional indirect caller is invisible to that literal census: `relationship-health/index.ts:333-336`
builds its GET client from `SUPABASE_ANON_KEY` plus caller `Authorization` and reads the
`security_invoker=true` `relationship_health_summary` wrapper at lines 429/500/587. The wrapper joins
`relationship_engagement_stats` and `relationship_commitment_stats`, so its authenticated read now
breaks. The live classification was:

```text
ERROR:  permission denied for materialized view relationship_engagement_stats
HINT:  Grant the required privileges to the current role with: GRANT SELECT ON public.relationship_engagement_stats TO authenticated;
WRAPPER_AUTHENTICATED_EXIT=3
```

## Migration applies

Command, run twice:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
```

Verbatim first apply output:

```text
REVOKE
REVOKE
REVOKE
REVOKE
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

Verbatim second apply output:

```text
REVOKE
REVOKE
REVOKE
REVOKE
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

The authoritative query rendered every grantee from `aclexplode(c.relacl)` (including PUBLIC if
present) and both `has_table_privilege(..., 'SELECT')` answers. Verbatim output:

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
GRANTS_EXIT=0
```

All twelve render exactly `postgres` and `service_role`; neither a PUBLIC grant nor inherited client
access is hidden, and both authoritative client-role answers are false on every row.

## Post-change behavioral reads — all twelve

Each client read used the resolved non-owner identity after `SET LOCAL ROLE authenticated`. Verbatim
classifications:

```text
citation_network | DENIED | rc=3
aa_commitment_summary_by_dossier | DENIED | rc=3
sla_compliance_metrics | DENIED | rc=3
user_productivity_metrics | DENIED | rc=3
dossier_engagement_stats | DENIED | rc=3
dossier_commitment_stats | DENIED | rc=3
relationship_engagement_stats | DENIED | rc=3
relationship_commitment_stats | DENIED | rc=3
mv_tag_usage_analytics | DENIED | rc=3
team_entity_stats | DENIED | rc=3
dossier_list_mv | DENIED | rc=3
stakeholder_network_summary | DENIED | rc=3
```

The retained-access arm used `SET LOCAL ROLE service_role`. Verbatim output:

```text
dossier_engagement_stats@service_role | ANSWERED rows=0 | rc=0
dossier_commitment_stats@service_role | ANSWERED rows=0 | rc=0
mv_tag_usage_analytics@service_role | ANSWERED rows=13 | rc=0
stakeholder_network_summary@service_role | ANSWERED rows=0 | rc=0
dossier_list_mv@service_role | ANSWERED rows=112 | rc=0
```

Thus the retained database role still answers all four directly called views, and
`dossier_list_mv` still returns exactly its recorded 112 rows after client access is removed.

## Security limitation

A PostgreSQL materialized view has no RLS. This revocation removes **CLIENT access**; it does not
row-scope the materialized data for any role that can still read it. `service_role` continues to read
each full materialized result. The named authenticated edge paths require a separate caller redesign;
this task records their breakage and does not misdescribe ACL revocation as row-level filtering.
