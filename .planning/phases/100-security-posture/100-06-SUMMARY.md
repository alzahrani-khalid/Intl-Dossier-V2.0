---
phase: 100-security-posture
plan: 6
status: complete
---

# P100-06 — Restricting the eight unconsumed materialized views

## Outcome

The **unconsumed half of criterion 3 is closed** on live staging `zkrcjzdemdmwhearhfgg`. Eight
materialized views render `postgres` and `service_role` as their only grantees, and
`has_table_privilege` is false for both `anon` and `authenticated`. A non-owner `authenticated` caller is
DENIED on all eight, including `dossier_list_mv`, which answered that caller with 112 rows at HEAD.
`service_role` still reads `dossier_list_mv` at exactly 112 rows.

Criterion 3 as a whole is **not** closed by this task. The four consumed materialized views are
EXCLUDED, unchanged, and owned by **P100-16** (see below). OVERSEER-RULING-P100-06-SPLIT states that a
phase close without P100-16 is PARTIAL.

All live captures below were taken 2026-09-10 15:26:48Z–15:27:20Z. They were not reused from an earlier
attempt. The earlier 13:58Z capture predates the overseer's 14:10:37Z restore of the four consumed views
and no longer describes staging.

## Changed hunk — `supabase/migrations/20260908000006_p100_materialized_views_restrict.sql`

Command: `git diff 28294d4ea HEAD -- supabase/migrations/20260908000006_p100_materialized_views_restrict.sql`.
`28294d4ea` is the merge-base with run branch `tickmarkr/run-20260910-112306-0000000000000075`, and the
file is absent there. The migration commit is `194486140`. Verbatim:

```diff
new file mode 100644
index 000000000..7829aefd8
--- /dev/null
+++ b/supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
@@ -0,0 +1,12 @@
+-- Materialized views have no RLS. Remove client-role access only from the eight
+-- materialized views with no tracked application caller; service_role retains its
+-- existing ACL. The four edge-consumed materialized views are deliberately absent:
+-- P100-16 moves their callers to a service-role read, deploys, then restricts them.
+REVOKE ALL ON public.citation_network FROM anon, authenticated;
+REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
+REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
+REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
+REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
+REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
+REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
+REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
```

The hunk has exactly one statement for each of the eight and **no statement for any of the four consumed
views**. It matches the 8-shape that OVERSEER-RULING-P100-06-LIVEBREAK names as the correct diff (attempt-1
branch commit `87f439dd8`). This attempt replaced the twelve-statement file that attempt 3 left at the
branch tip (`0f0cd8149`), which that ruling forbids merging. That superseded commit is still in this
branch's history. The net tree diff against the run base is the eight-statement file above.

## The four consumed views — EXCLUDED, owned by P100-16

These four are **EXCLUDED from this migration and owned by P100-16**
(`100-16-PLAN.md`, `supabase/migrations/20260910000001_p100_matview_revoke_consumed.sql`):

- `dossier_engagement_stats`
- `dossier_commitment_stats`
- `mv_tag_usage_analytics`
- `stakeholder_network_summary`

**Reason:** the attempt-0 caller census on branch
`tickmarkr/run-20260910-112306-0000000000000075--P100-06`, commit **`20e0f28d6`**, found that each of the
four is read by an edge function through a client built from `SUPABASE_ANON_KEY` plus the caller's
`Authorization` header. That client executes as `authenticated`, so revoking `authenticated` breaks the
read. OVERSEER-RULING-P100-06-SPLIT verified and adopted that census. The key table, as recorded at
`20e0f28d6`:

| Materialized view | Tracked caller(s) and client key | Effect of restricting it here |
| --- | --- | --- |
| `dossier_engagement_stats` | `calculate-health-score/index.ts:109-112` uses `SUPABASE_SERVICE_ROLE_KEY`; `dossier-stats/index.ts:37-44` uses `SUPABASE_ANON_KEY` plus caller `Authorization` | breaks `dossier-stats` |
| `dossier_commitment_stats` | the same two clients; `refresh-commitment-stats/index.ts:24-30` uses `SUPABASE_SERVICE_ROLE_KEY` | breaks `dossier-stats` |
| `mv_tag_usage_analytics` | `tag-hierarchy/index.ts:83-88` uses `SUPABASE_ANON_KEY` plus caller `Authorization` | breaks `tag-hierarchy` |
| `stakeholder_network_summary` | `stakeholder-influence/index.ts:215-223` uses `SUPABASE_ANON_KEY` plus caller `Authorization` (read at 641) | breaks `stakeholder-influence` |

These four were **untouched** by this attempt. The pre-apply and post-apply censuses below render the
same ACL for each: `authenticated=SELECT` from the overseer's 14:10:37Z restore, `anon` absent, and
`service_role` full. A non-owner `authenticated` read of each still ANSWERS (0, 0, 13 and 0 rows).

## Source census for the eight — planning bound

Command (at `7439c10f4`, before the migration commit):

```bash
for view in citation_network aa_commitment_summary_by_dossier sla_compliance_metrics user_productivity_metrics relationship_engagement_stats relationship_commitment_stats team_entity_stats dossier_list_mv dossiers; do
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
relationship_engagement_stats frontend_files=0 backend_edge_files=0
relationship_commitment_stats frontend_files=0 backend_edge_files=0
team_entity_stats frontend_files=0 backend_edge_files=0
dossier_list_mv frontend_files=0 backend_edge_files=0
dossiers frontend_files=18 backend_edge_files=62
```

The `dossiers frontend_files=18` control shows the instrument could see a non-zero. This census is a
**planning bound, not the gate**, and it only sees literal `.from('<view>')` reads. It is blind to the
indirect paths recorded under "Indirect callers" below.

## Migration applies

Command, run twice from the worktree root:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
```

Verbatim, first apply (15:26:49Z):

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

Verbatim, second apply (15:26:50Z):

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

The replay exited 0, so the file is idempotent. The pre-apply census already showed all eight
restricted, left there by earlier attempts. The two applies changed no ACL: the pre-apply and post-apply
rows are byte-identical. Per D-13 the file was applied with `psql -f`, and this task wrote no ledger row.

## Grant census — every grantee, with authoritative privilege answers

The query renders every grantee from `aclexplode(c.relacl)`, including `PUBLIC` when present. It prints
`has_table_privilege` for `anon`, `authenticated` and `service_role` beside each row, so a grant inherited
through role membership cannot hide behind a filtered row. It covers all twelve by name, so the four
excluded views are visible as untouched.

```bash
psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "with a as (select c.relname, coalesce((select string_agg(case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end||'='||x.privilege_type, ',' order by case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end, x.privilege_type) from aclexplode(c.relacl) x),'(null-acl)') acl, has_table_privilege('anon',c.oid,'SELECT') an, has_table_privilege('authenticated',c.oid,'SELECT') au, has_table_privilege('service_role',c.oid,'SELECT') sr from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='m' and c.relname in ('citation_network','aa_commitment_summary_by_dossier','sla_compliance_metrics','user_productivity_metrics','relationship_engagement_stats','relationship_commitment_stats','team_entity_stats','dossier_list_mv','dossier_engagement_stats','dossier_commitment_stats','mv_tag_usage_analytics','stakeholder_network_summary')) select relname||' | anon_can_select='||an||' authenticated_can_select='||au||' service_role_can_select='||sr||' | '||acl from a order by relname"
```

Verbatim, pre-apply (15:26:48Z):

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PRE_CENSUS_EXIT=0
```

Verbatim, post-apply (15:27:02Z):

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
POST_CENSUS_EXIT=0
```

Every one of the eight renders exactly the `postgres` and `service_role` privilege sets, with no
`PUBLIC`, no `anon` and no `authenticated`, and both client-role answers are `false`. The four excluded
views keep `authenticated=SELECT`, as P100-16 requires until it lands.

## Plan oracles, run unchanged from the committed eight-view plan

The two command oracles were extracted verbatim from `100-06-PLAN.md` at
`milestone/v10.0-trust` (`9c706d05e`) and run from the worktree root.

Oracle 1, grants (15:26:51Z), verbatim:

```text
P100-06-GRANTS named=8 rendered=8 at_expected_full_state=8 expected rendered=8 at_expected_full_state=8
  GRANTS aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS citation_network | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS dossier_list_mv | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_commitment_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_engagement_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS sla_compliance_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS team_entity_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_productivity_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
ORACLE1_EXIT=0
```

Oracle 2, reads (15:26:52Z), verbatim:

```text
P100-06 reads: citation_network=denied aa_commitment_summary_by_dossier=denied sla_compliance_metrics=denied user_productivity_metrics=denied relationship_engagement_stats=denied relationship_commitment_stats=denied team_entity_stats=denied dossier_list_mv=denied dossier_list_mv@service_role=112/112
PASS reads
ORACLE2_EXIT=0
```

The older twelve-literal oracle from the pre-split plan still fails on staging, deliberately: it demands
the four excluded views be restricted too. Plan `9c706d05e` replaced it.

## Behavioral reads — eight denial classifications and the retained service-role read

Each read ran `begin; set local role authenticated; set local request.jwt.claims = {"sub":"<non-owner-uid>","role":"authenticated"}; select count(*) from public.<view>; rollback;`
as the resolved non-owner (`test.user@gmail.com`), 15:27:03Z. Verbatim:

```text
citation_network | DENIED | rc=3 | ERROR:  permission denied for materialized view citation_network
aa_commitment_summary_by_dossier | DENIED | rc=3 | ERROR:  permission denied for materialized view aa_commitment_summary_by_dossier
sla_compliance_metrics | DENIED | rc=3 | ERROR:  permission denied for materialized view sla_compliance_metrics
user_productivity_metrics | DENIED | rc=3 | ERROR:  permission denied for materialized view user_productivity_metrics
relationship_engagement_stats | DENIED | rc=3 | ERROR:  permission denied for materialized view relationship_engagement_stats
relationship_commitment_stats | DENIED | rc=3 | ERROR:  permission denied for materialized view relationship_commitment_stats
team_entity_stats | DENIED | rc=3 | ERROR:  permission denied for materialized view team_entity_stats
dossier_list_mv | DENIED | rc=3 | ERROR:  permission denied for materialized view dossier_list_mv
dossier_engagement_stats | ANSWERED rows=0 | rc=0
dossier_commitment_stats | ANSWERED rows=0 | rc=0
mv_tag_usage_analytics | ANSWERED rows=13 | rc=0
stakeholder_network_summary | ANSWERED rows=0 | rc=0
```

All eight are DENIED. The last four lines are the excluded views, still readable as expected. The
retained-access arm ran `set local role service_role` (15:27:15Z). Verbatim:

```text
dossier_list_mv@service_role | rc=0 | 112
dossier_engagement_stats@service_role | rc=0 | 0
dossier_commitment_stats@service_role | rc=0 | 0
mv_tag_usage_analytics@service_role | rc=0 | 13
stakeholder_network_summary@service_role | rc=0 | 0
```

`dossier_list_mv` still returns exactly its recorded **112** rows to the role the backend uses. The
revocation removed client access without removing retained access.

## Indirect callers of the eight — OPEN for the overseer

The literal census above does not see callers that reach a view through a function or a wrapper view.
A catalog query over `pg_proc.prosrc` and the `pg_rewrite` dependencies of the eight returned, verbatim:

```text
fn get_citation_network_graph secdef=false reads=citation_network
fn get_dossier_with_extension secdef=true reads=dossier_list_mv
fn get_entity_citations secdef=false reads=citation_network
fn get_team_stats_for_entity secdef=true reads=team_entity_stats
fn get_team_workload secdef=true reads=user_productivity_metrics
fn get_user_productivity_metrics secdef=false reads=user_productivity_metrics
fn list_dossiers_optimized secdef=true reads=dossier_list_mv
fn queue_dossier_list_mv_refresh secdef=true reads=dossier_list_mv
fn refresh_aa_commitment_summary secdef=false reads=aa_commitment_summary_by_dossier
fn refresh_citation_network_on_change secdef=false reads=citation_network
fn refresh_dossier_list_mv secdef=true reads=dossier_list_mv
fn refresh_dossier_list_mv_force secdef=true reads=dossier_list_mv
fn refresh_relationship_health_stats secdef=false reads=relationship_commitment_stats,relationship_engagement_stats
fn refresh_team_entity_stats secdef=true reads=team_entity_stats
fn refresh_user_productivity_metrics secdef=true reads=user_productivity_metrics
view relationship_health_summary kind=v opts=security_invoker=true deps=relationship_commitment_stats,relationship_engagement_stats
trigger trigger_refresh_citation_network on entity_citations fn=refresh_citation_network_on_change secdef=false
```

Three paths run as the caller and are now DENIED. They are outside this task's file scope, so they are
named here and not repaired. They were already denied before this attempt's applies, because the
pre-apply census shows the eight restricted.

1. **Live break: `unified-work-list?endpoint=metrics` (`user_productivity_metrics`).**
   `supabase/functions/unified-work-list/index.ts:30-34` builds its client from `SUPABASE_ANON_KEY` plus
   the caller's `Authorization`. At `:83-86` it calls `rpc('get_user_productivity_metrics')`, which is
   SECURITY INVOKER. The frontend reaches it from the mounted `/my-work` page
   (`routes/_protected/my-work/index.tsx`). The chain is
   `MyWorkDashboard.tsx:90` → `useMyWorkDashboard` → `useUserProductivityMetrics` (`useUnifiedWork.ts:75`,
   used at `:168`) → `unified-work.service.ts:118`. The direct `supabase.rpc('get_user_productivity_metrics')`
   in `useDashboardSuccessMetrics.ts:27` hits the same denial. That hook has no importer under
   `frontend/src`. Live probe as the non-owner, rolled back, verbatim:

   ```text
   ERROR:  permission denied for materialized view user_productivity_metrics
   HINT:  Grant the required privileges to the current role with: GRANT SELECT ON public.user_productivity_metrics TO authenticated;
   CONTEXT:  SQL statement "SELECT ... FROM user_productivity_metrics pm WHERE pm.user_id = p_user_id"
   PL/pgSQL function get_user_productivity_metrics(uuid) line 3 at RETURN QUERY
   EXIT=3
   ```

   (The CONTEXT column list is elided with `...`; the rest is verbatim.) The edge function returns 500
   on this error. Routing options for the overseer: make `get_user_productivity_metrics` SECURITY DEFINER
   filtered by `auth.uid()`, or carry `user_productivity_metrics` to P100-16. P100-16's `files_modified`
   does not include `unified-work-list`.

2. **Live break: `relationship-health` GET (`relationship_engagement_stats`, `relationship_commitment_stats`).**
   `supabase/functions/relationship-health/index.ts:331-338` builds `supabase` from `SUPABASE_ANON_KEY`
   plus the caller's `Authorization`. Its `.from('relationship_health_summary')` reads at `:429` and
   `:500` come before the service-role clients created at `:573` and `:668`. `relationship_health_summary`
   is `security_invoker=true` over both views. Its frontend reach was not traced in this attempt. Live
   probe `select count(*) from public.relationship_health_summary` as the non-owner, rolled back, verbatim:

   ```text
   ERROR:  permission denied for materialized view relationship_engagement_stats
   HINT:  Grant the required privileges to the current role with: GRANT SELECT ON public.relationship_engagement_stats TO authenticated;
   EXIT=3
   ```

3. **Latent break: `citation_network` refresh trigger.** `trigger_refresh_citation_network` on
   `entity_citations` runs the SECURITY INVOKER `refresh_citation_network_on_change()`, which refreshes
   `citation_network`. `authenticated` no longer holds `MAINTAIN`. A rolled-back
   `refresh materialized view concurrently public.citation_network` as `authenticated` returned, verbatim:

   ```text
   ERROR:  permission denied for materialized view citation_network
   TRIGGER_PROBE_EXIT=3
   ```

   So any `authenticated` write that the `entity_citations` policies allow would now fail. The policies,
   verbatim:
   `Users can create citations in their organization INSERT roles=authenticated`,
   `Users can update citations they created UPDATE roles=authenticated`,
   `Users can delete citations they created DELETE roles=authenticated`.
   The break is latent today: the only tracked writer, `supabase/functions/citation-tracking/index.ts:43-44`,
   uses `SUPABASE_SERVICE_ROLE_KEY`.

OVERSEER-RULING-P100-06-LIVEBREAK prescribes this 8-shape, and these three findings do not change the
diff. They are recorded so the overseer can route them. They are not claimed as resolved.

## What this does NOT establish — no RLS on materialized views

A PostgreSQL **materialized view has no RLS**. This revocation removes **CLIENT access**
(`anon`/`authenticated` direct table access). It **does not row-scope the data** for whoever still reads
it. `service_role` still reads each full materialized result, including all 112 `dossier_list_mv` rows.
The SECURITY DEFINER functions listed above (`list_dossiers_optimized`, `get_dossier_with_extension`,
`get_team_stats_for_entity`, `get_team_workload` and the refresh helpers) still read these views as their
owner. Who may EXECUTE them is the advisor's `*_security_definer_function_executable` class, which sits
outside this plan's population (100-CONTEXT.md §3). Moving any caller to a service-role read likewise
keeps full-data behavior and is not row-level isolation.

## Left for named later tasks

- **P100-16:** the four excluded views, their three edge callers, deploy, then restrict.
- **Overseer routing:** the `unified-work-list` metrics break and the `relationship-health` GET break
  (both live), and the `citation_network` trigger break (latent), all above.
- **P100-15:** phase-level arithmetic, register and sign-off (D-37). `100-CONTEXT.md` D-07 is corrected
  by OVERSEER-RULING-P100-06-SPLIT rather than edited, since it is outside this task's scope.
