---
phase: 100-security-posture
plan: 6
status: blocked
blocked_by: authenticated edge callers on all four materialized views with application consumers
---

# P100-06 — Materialized-view client grants

## Outcome

P100-06 is **blocked and was not applied**. The mandatory pre-revocation caller audit contradicted
the planning assumption in `100-CONTEXT.md` D-07: each of the four materialized views with a tracked
backend/edge consumer has at least one caller whose Supabase client is built from
`SUPABASE_ANON_KEY` together with the request's `Authorization` header. That client executes as the
authenticated caller. Revoking `authenticated` would therefore break all four live paths.

The plan explicitly says that such a view **cannot be revoked**, must be named, and must be left for
the overseer rather than broken. Consequently:

- `supabase/migrations/20260908000006_p100_materialized_views_restrict.sql` was not created;
- neither the first nor second `psql -f` apply was attempted, so there are no apply exit statuses to
  misrepresent as successful;
- staging was not mutated by this task;
- the required DIFF hunk containing twelve `REVOKE` statements does not exist;
- the twelve post-revocation denial classifications and positive grant end state cannot truthfully be
  recorded.

Closing criterion 3 requires first moving the authenticated callers listed below to a service-role
client (or otherwise replacing those read paths). Those caller files are outside P100-06's fixed file
scope.

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

This is a planning bound, not a gate. The `dossiers frontend_files=18` control proves the frontend
instrument could observe a non-zero. The per-view live grants and behavioral reads below are the
database facts.

## Mandatory key audit — blocking finding

| Materialized view | Tracked caller(s) and client key | Effect of the requested revocation |
| --- | --- | --- |
| `dossier_engagement_stats` | `supabase/functions/calculate-health-score/index.ts:109-112` uses `SUPABASE_SERVICE_ROLE_KEY`; `supabase/functions/dossier-stats/index.ts:37-44` uses `SUPABASE_ANON_KEY` plus the caller `Authorization` header | **Breaks** `dossier-stats` |
| `dossier_commitment_stats` | the same two clients above; `supabase/functions/refresh-commitment-stats/index.ts:24-30` uses `SUPABASE_SERVICE_ROLE_KEY` | **Breaks** `dossier-stats` |
| `mv_tag_usage_analytics` | `supabase/functions/tag-hierarchy/index.ts:83-88` uses `SUPABASE_ANON_KEY` plus the caller `Authorization` header | **Breaks** `tag-hierarchy` |
| `stakeholder_network_summary` | `supabase/functions/stakeholder-influence/index.ts:215-223` uses `SUPABASE_ANON_KEY` plus the caller `Authorization` header; that client performs the read at line 641. A separate service client is created only later at lines 697-700 for the POST calculation path. | **Breaks** the read path in `stakeholder-influence` |

This evidence is stronger than the earlier assumption that the existence of a service-role grant meant
every backend/edge caller used that role. It does not.

## Live grant baseline — every grantee and authoritative privilege answers

Command (run before any revocation):

```bash
psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "with a as (select c.relname, coalesce((select string_agg(case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end||'='||x.privilege_type, ',' order by case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end, x.privilege_type) from aclexplode(c.relacl) x),'(null-acl)') acl, has_table_privilege('anon',c.oid,'SELECT') an, has_table_privilege('authenticated',c.oid,'SELECT') au from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='m' and c.relname in ('citation_network','aa_commitment_summary_by_dossier','sla_compliance_metrics','user_productivity_metrics','dossier_engagement_stats','dossier_commitment_stats','relationship_engagement_stats','relationship_commitment_stats','mv_tag_usage_analytics','team_entity_stats','dossier_list_mv','stakeholder_network_summary')) select relname||' | anon_can_select='||an||' authenticated_can_select='||au||' | '||acl from a order by relname"
```

Verbatim output (the repeated full ACL is retained deliberately so no grantee, including `PUBLIC`, can
hide behind a filtered row):

```text
aa_commitment_summary_by_dossier | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=true authenticated_can_select=true | anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
```

The result is still RED at the unchanged HEAD state: all twelve carry both client roles and both
authoritative `has_table_privilege` answers are `true`.

## Behavioral reads for the four caller views and retained-access control

Command:

```bash
for view in dossier_engagement_stats dossier_commitment_stats mv_tag_usage_analytics stakeholder_network_summary dossier_list_mv; do
  out=$(printf 'begin;\nset local role service_role;\nselect count(*) from public.%s;\ncommit;\n' "$view" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); rc=$?
  last=$(printf '%s' "$out" | tail -1)
  printf '%s rc=%s rows=%s\n' "$view" "$rc" "$last"
done
```

Verbatim output:

```text
dossier_engagement_stats rc=0 rows=0
dossier_commitment_stats rc=0 rows=0
mv_tag_usage_analytics rc=0 rows=13
stakeholder_network_summary rc=0 rows=0
dossier_list_mv rc=0 rows=112
```

Thus every caller view still answers under `service_role`, and the retained-access control reads
`dossier_list_mv` at exactly **112** rows. These are pre-revocation facts only; they do not erase the
blocking fact that tracked authenticated clients also read the four caller views.

For completeness, the same current reads under `authenticated` returned:

```text
dossier_engagement_stats rc=0 rows=0
dossier_commitment_stats rc=0 rows=0
mv_tag_usage_analytics rc=0 rows=13
stakeholder_network_summary rc=0 rows=0
dossier_list_mv rc=0 rows=112
```

They confirm that the affected caller clients currently answer and that `dossier_list_mv` still exposes
112 rows to a non-owner. They are not the required twelve post-change denials because no unsafe change
was made.

## Security limitation

A PostgreSQL materialized view has no RLS. Revoking the client roles removes **CLIENT access**; it does
not row-scope the materialized data for any role that still retains access. In particular,
`service_role` continues to see the complete materialized result. Moving the four edge callers to a
service-role client would preserve that full-data behavior and requires an explicit application-level
authorization review; it must not be treated as row-level isolation.
