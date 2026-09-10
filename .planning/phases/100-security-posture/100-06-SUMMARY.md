---
phase: 100-security-posture
plan: 6
status: complete
---

# P100-06 — Restricting the three definer-consumed materialized views

## Outcome

On live staging `zkrcjzdemdmwhearhfgg`, the three materialized views with only SECURITY DEFINER
consumers are closed: `sla_compliance_metrics`, `team_entity_stats` and `dossier_list_mv`. Each renders
`postgres` and `service_role` as its only grantees. `has_table_privilege` is false for both `anon` and
`authenticated`. A non-owner `authenticated` caller is DENIED on all three, including
`dossier_list_mv`, which answered that caller with **112** rows at the plan's HEAD (100-RESEARCH.md §9.3).
`service_role` still reads `dossier_list_mv` at exactly **112** rows.

The other **nine** materialized views are **EXCLUDED and untouched**. The migration has no statement for
any of them, and their ACLs are the same before and after the applies:

- **P100-16**, four edge-consumed views: `dossier_engagement_stats`, `dossier_commitment_stats`,
  `mv_tag_usage_analytics`, `stakeholder_network_summary`.
- **P100-17**, five invoker-consumed views: `user_productivity_metrics`, `relationship_engagement_stats`,
  `relationship_commitment_stats`, `citation_network`, `aa_commitment_summary_by_dossier`.

This task closes the unconsumed half of criterion 3 only. Criterion 3 as a whole closes when P100-16 and
P100-17 land.

The plan executed was `100-06-PLAN.md` at `milestone/v10.0-trust` commit `cf839feb1` (sha256
`a94470cb00ee7cd257a12a410fa3503a7c70835e76d0e4055f66b00b588ad44d`). Every live capture below was taken
by this attempt, 2026-09-10 15:56:38Z–16:04:12Z. No earlier attempt's capture is reused.

## Changed hunk — `supabase/migrations/20260908000006_p100_materialized_views_restrict.sql`

Net diff against the run base. `28294d4ea` is the merge-base with
`tickmarkr/run-20260910-112306-0000000000000075`, and the file does not exist there. Command
`git diff 28294d4ea HEAD -- supabase/migrations/20260908000006_p100_materialized_views_restrict.sql`,
verbatim:

```diff
diff --git a/supabase/migrations/20260908000006_p100_materialized_views_restrict.sql b/supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
new file mode 100644
index 000000000..f0f8420c8
--- /dev/null
+++ b/supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
@@ -0,0 +1,7 @@
+-- Materialized views have no RLS. Remove client-role access only from the three
+-- materialized views whose sole database consumers are SECURITY DEFINER functions;
+-- service_role and the owner keep their existing ACL. The four edge-consumed views
+-- are P100-16's and the five invoker-consumed views are P100-17's.
+REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
+REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
+REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
```

The file holds exactly one `REVOKE` for each of the three and **none** for any of the nine excluded
views. None of the nine is named anywhere in the file.

This attempt's commit `bf6115f25` removes the five invoker-consumed `REVOKE`s from the previous
eight-statement file. Command `git show bf6115f25 -- <the migration>`, verbatim:

```diff
@@ -1,12 +1,7 @@
--- Materialized views have no RLS. Remove client-role access only from the eight
--- materialized views with no tracked application caller; service_role retains its
--- existing ACL. The four edge-consumed materialized views are deliberately absent:
--- P100-16 moves their callers to a service-role read, deploys, then restricts them.
-REVOKE ALL ON public.citation_network FROM anon, authenticated;
-REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
+-- Materialized views have no RLS. Remove client-role access only from the three
+-- materialized views whose sole database consumers are SECURITY DEFINER functions;
+-- service_role and the owner keep their existing ACL. The four edge-consumed views
+-- are P100-16's and the five invoker-consumed views are P100-17's.
 REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
-REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
-REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
-REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
 REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
 REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
```

The file's branch history is `git log --format='%h %s' 28294d4ea..HEAD -- <the migration>`, verbatim:

```text
bf6115f25 fix(security): restrict only the three definer-consumed materialized views
52e43c810 fix(security): restrict only the eight unconsumed materialized views
0cfadcf58 fix(security): restrict all materialized views
79ea5f759 fix(security): revoke safe materialized view grants
```

The three older shapes are superseded and stay in history only. The merged tree carries the
three-statement file above. `git diff --name-only 28294d4ea HEAD` lists only the two `files_modified`
paths.

## The nine EXCLUDED materialized views

| Materialized view | Owner | Consumer that makes a client-role revoke a live break (evidence) |
| --- | --- | --- |
| `dossier_engagement_stats` | **P100-16** | `dossier-stats` edge function; its client is built from `SUPABASE_ANON_KEY` plus the caller's `Authorization` (OVERSEER-RULING-P100-06-SPLIT; attempt-0 census) |
| `dossier_commitment_stats` | **P100-16** | `dossier-stats`, same client |
| `mv_tag_usage_analytics` | **P100-16** | `tag-hierarchy` (`analytics` case), anon-key client under the caller JWT |
| `stakeholder_network_summary` | **P100-16** | `stakeholder-influence` list path, anon-key client under the caller JWT |
| `user_productivity_metrics` | **P100-17** | `get_user_productivity_metrics` is `secdef=false` (census S1), called by `unified-work-list` with the caller JWT |
| `relationship_engagement_stats` | **P100-17** | view `relationship_health_summary` has `invoker=true` (S3); `refresh_relationship_health_stats` is `secdef=false` (S1) |
| `relationship_commitment_stats` | **P100-17** | same invoker view and refresh function |
| `citation_network` | **P100-17** | `get_entity_citations` and `get_citation_network_graph` are `secdef=false`; trigger `trigger_refresh_citation_network` runs the `secdef=false` `refresh_citation_network_on_change` (S1, S2) |
| `aa_commitment_summary_by_dossier` | **P100-17** | `refresh_aa_commitment_summary` is `secdef=false` (S1) |

The five P100-17 rows follow OVERSEER-RULING-P100-06-INVOKER-CONSUMERS. The census below re-derives
them. The four P100-16 rows show a limit of the catalog: their database consumers are definer-only, and
`mv_tag_usage_analytics` has **no** catalog consumer at all. Their live callers are edge functions,
which the catalog cannot see. So for the three revoked here, the catalog census is paired with the
source sweep further below.

All nine are **untouched**. The pre-apply census (15:56:38Z) and the post-apply census (16:03:48Z)
render the same ACL for each of the nine. A non-owner `authenticated` read of each still answers
(16:03:50Z).

## Catalog census for all twelve — planning bound

### The plan's prescribed command

Run before any apply (15:59:17Z):

```bash
psql "$SUPABASE_DB_URL" -Atq -c "with v(name) as (values ('citation_network'),('aa_commitment_summary_by_dossier'),('sla_compliance_metrics'),('user_productivity_metrics'),('dossier_engagement_stats'),('dossier_commitment_stats'),('relationship_engagement_stats'),('relationship_commitment_stats'),('mv_tag_usage_analytics'),('team_entity_stats'),('dossier_list_mv'),('stakeholder_network_summary')) select v.name||' fn:'||coalesce((select string_agg(p.proname||'(secdef='||p.prosecdef||')',',') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosrc like '%'||v.name||'%'),'-')||' view:'||coalesce((select string_agg(c.relname||'(inv='||(coalesce(c.reloptions::text,'') like '%security_invoker=true%')||')',',') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and pg_get_viewdef(c.oid) like '%'||v.name||'%'),'-') from v"
```

Verbatim:

```text
citation_network fn:get_entity_citations(secdef=false),get_citation_network_graph(secdef=false),refresh_citation_network_on_change(secdef=false) view:-
aa_commitment_summary_by_dossier fn:refresh_aa_commitment_summary(secdef=false) view:-
sla_compliance_metrics fn:- view:-
user_productivity_metrics fn:refresh_user_productivity_metrics(secdef=true),get_team_workload(secdef=true),get_user_productivity_metrics(secdef=false) view:-
dossier_engagement_stats fn:refresh_engagement_stats(secdef=true) view:-
dossier_commitment_stats fn:refresh_commitment_stats(secdef=true) view:-
relationship_engagement_stats fn:refresh_relationship_health_stats(secdef=false) view:relationship_health_summary(inv=true)
relationship_commitment_stats fn:refresh_relationship_health_stats(secdef=false) view:relationship_health_summary(inv=true)
mv_tag_usage_analytics fn:- view:-
team_entity_stats fn:get_team_stats_for_entity(secdef=true),refresh_team_entity_stats(secdef=true) view:-
dossier_list_mv fn:refresh_dossier_list_mv(secdef=true),queue_dossier_list_mv_refresh(secdef=true),refresh_dossier_list_mv_force(secdef=true),list_dossiers_optimized(secdef=true),get_dossier_with_extension(secdef=true) view:-
stakeholder_network_summary fn:refresh_stakeholder_network_summary(secdef=true) view:-
CATALOG_CENSUS_EXIT=0
```

### Supplementary census, including `pg_trigger`

The supplementary census widens the prescribed one. It covers every non-system schema. It reads function
bodies from `prosrc` plus `pg_get_function_sqlbody`, so SQL-standard bodies are included, and matches
case-insensitively. For each function it records the owner, whether it is a trigger function, and client
EXECUTE rights. It covers views **and** materialized views, joins `pg_trigger` to `pg_proc`, and
checks RLS policy expressions. Command:
`psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -f census-supplement.sql`. The file, verbatim:

```sql
-- P100-06 supplementary catalog census: every non-system schema, SQL-standard bodies included,
-- with definer flag, owner, trigger-ness, client EXECUTE rights; triggers; views AND matviews;
-- RLS policy expressions. Ordered: the three revoked here first, then the four (P100-16), then the five (P100-17).
\echo '== S1 functions whose body names the view'
with v(ord,name) as (values (1,'sla_compliance_metrics'),(2,'team_entity_stats'),(3,'dossier_list_mv'),(4,'dossier_engagement_stats'),(5,'dossier_commitment_stats'),(6,'mv_tag_usage_analytics'),(7,'stakeholder_network_summary'),(8,'user_productivity_metrics'),(9,'relationship_engagement_stats'),(10,'relationship_commitment_stats'),(11,'citation_network'),(12,'aa_commitment_summary_by_dossier'))
select v.name||' | fn '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||') secdef='||p.prosecdef||' owner='||pg_get_userbyid(p.proowner)||' trigger_fn='||(p.prorettype='trigger'::regtype)||' anon_exec='||has_function_privilege('anon',p.oid,'EXECUTE')||' authenticated_exec='||has_function_privilege('authenticated',p.oid,'EXECUTE')||' config='||coalesce(array_to_string(p.proconfig,';'),'-')
from v join pg_proc p on (coalesce(p.prosrc,'')||coalesce(pg_get_function_sqlbody(p.oid),'')) ilike '%'||v.name||'%'
join pg_namespace n on n.oid=p.pronamespace
where n.nspname not in ('pg_catalog','information_schema')
order by v.ord, n.nspname, p.proname;
\echo '== S2 triggers whose function body names the view'
with v(ord,name) as (values (1,'sla_compliance_metrics'),(2,'team_entity_stats'),(3,'dossier_list_mv'),(4,'dossier_engagement_stats'),(5,'dossier_commitment_stats'),(6,'mv_tag_usage_analytics'),(7,'stakeholder_network_summary'),(8,'user_productivity_metrics'),(9,'relationship_engagement_stats'),(10,'relationship_commitment_stats'),(11,'citation_network'),(12,'aa_commitment_summary_by_dossier'))
select v.name||' | trigger '||t.tgname||' on '||t.tgrelid::regclass||' fn='||n.nspname||'.'||p.proname||' secdef='||p.prosecdef||' enabled='||t.tgenabled::text
from v join pg_proc p on (coalesce(p.prosrc,'')||coalesce(pg_get_function_sqlbody(p.oid),'')) ilike '%'||v.name||'%'
join pg_namespace n on n.oid=p.pronamespace
join pg_trigger t on t.tgfoid=p.oid
where not t.tgisinternal and n.nspname not in ('pg_catalog','information_schema')
order by v.ord, t.tgname;
\echo '== S3 views and materialized views whose definition names the view'
with v(ord,name) as (values (1,'sla_compliance_metrics'),(2,'team_entity_stats'),(3,'dossier_list_mv'),(4,'dossier_engagement_stats'),(5,'dossier_commitment_stats'),(6,'mv_tag_usage_analytics'),(7,'stakeholder_network_summary'),(8,'user_productivity_metrics'),(9,'relationship_engagement_stats'),(10,'relationship_commitment_stats'),(11,'citation_network'),(12,'aa_commitment_summary_by_dossier'))
select v.name||' | '||case c.relkind when 'v' then 'view ' else 'matview ' end||n.nspname||'.'||c.relname||' invoker='||(coalesce(c.reloptions::text,'') like '%security_invoker=true%')||' owner='||pg_get_userbyid(c.relowner)||' anon_select='||has_table_privilege('anon',c.oid,'SELECT')||' authenticated_select='||has_table_privilege('authenticated',c.oid,'SELECT')
from v join pg_class c on c.relkind in ('v','m') and c.relname<>v.name
join pg_namespace n on n.oid=c.relnamespace
where n.nspname not in ('pg_catalog','information_schema') and pg_get_viewdef(c.oid) ilike '%'||v.name||'%'
order by v.ord, c.relname;
\echo '== S4 RLS policies whose USING or WITH CHECK names the view'
with v(ord,name) as (values (1,'sla_compliance_metrics'),(2,'team_entity_stats'),(3,'dossier_list_mv'),(4,'dossier_engagement_stats'),(5,'dossier_commitment_stats'),(6,'mv_tag_usage_analytics'),(7,'stakeholder_network_summary'),(8,'user_productivity_metrics'),(9,'relationship_engagement_stats'),(10,'relationship_commitment_stats'),(11,'citation_network'),(12,'aa_commitment_summary_by_dossier'))
select v.name||' | policy '||pol.polname||' on '||pol.polrelid::regclass
from v join pg_policy pol on (coalesce(pg_get_expr(pol.polqual,pol.polrelid),'')||' '||coalesce(pg_get_expr(pol.polwithcheck,pol.polrelid),'')) ilike '%'||v.name||'%'
order by v.ord, pol.polname;
\echo '== controls (each instrument can see a non-zero)'
select 'S1/S2 functions_scanned='||count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname not in ('pg_catalog','information_schema');
select 'S3 views_and_matviews_scanned='||count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('v','m') and n.nspname not in ('pg_catalog','information_schema');
select 'S4 policies_scanned='||count(*)||' policies_naming_auth_uid='||count(*) filter (where (coalesce(pg_get_expr(polqual,polrelid),'')||' '||coalesce(pg_get_expr(polwithcheck,polrelid),'')) ilike '%auth.uid%') from pg_policy;
```

The first run (16:00:03Z) exited 3 at S2 with
`ERROR:  operator is not unique: text || "char"` on `t.tgenabled`. Its S1 section matched the output
below. I cast `tgenabled::text` and reran the whole file (16:01:06Z). Verbatim:

```text
== S1 functions whose body names the view
team_entity_stats | fn public.get_team_stats_for_entity(p_entity_type character varying, p_current_user_id uuid) secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=search_path=public
team_entity_stats | fn public.refresh_team_entity_stats() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_list_mv | fn public.get_dossier_with_extension(p_dossier_id uuid) secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_list_mv | fn public.list_dossiers_optimized(p_type text, p_status text, p_status_array text[], p_sensitivity text, p_tags text[], p_search text, p_is_active boolean, p_cursor text, p_limit integer) secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_list_mv | fn public.queue_dossier_list_mv_refresh() secdef=true owner=postgres trigger_fn=true anon_exec=true authenticated_exec=true config=search_path=public, pg_temp
dossier_list_mv | fn public.refresh_dossier_list_mv() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_list_mv | fn public.refresh_dossier_list_mv_force() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_engagement_stats | fn public.refresh_engagement_stats() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
dossier_commitment_stats | fn public.refresh_commitment_stats() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
stakeholder_network_summary | fn public.refresh_stakeholder_network_summary() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=search_path=public
user_productivity_metrics | fn public.get_team_workload(requesting_user_id uuid) secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=search_path=public
user_productivity_metrics | fn public.get_user_productivity_metrics(p_user_id uuid) secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
user_productivity_metrics | fn public.refresh_user_productivity_metrics() secdef=true owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
relationship_engagement_stats | fn public.refresh_relationship_health_stats() secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
relationship_commitment_stats | fn public.refresh_relationship_health_stats() secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
citation_network | fn public.get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer, p_max_nodes integer) secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
citation_network | fn public.get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text, p_include_external boolean, p_limit integer) secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
citation_network | fn public.refresh_citation_network_on_change() secdef=false owner=postgres trigger_fn=true anon_exec=true authenticated_exec=true config=-
aa_commitment_summary_by_dossier | fn public.refresh_aa_commitment_summary() secdef=false owner=postgres trigger_fn=false anon_exec=true authenticated_exec=true config=-
== S2 triggers whose function body names the view
dossier_list_mv | trigger trg_countries_refresh_mv on countries fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_dossiers_refresh_mv on dossiers fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_engagements_refresh_mv on engagements fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_forums_refresh_mv on forums fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_organizations_refresh_mv on organizations fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_persons_refresh_mv on persons fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_topics_refresh_mv on topics fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
dossier_list_mv | trigger trg_working_groups_refresh_mv on working_groups fn=public.queue_dossier_list_mv_refresh secdef=true enabled=O
citation_network | trigger trigger_refresh_citation_network on entity_citations fn=public.refresh_citation_network_on_change secdef=false enabled=O
== S3 views and materialized views whose definition names the view
relationship_engagement_stats | view public.relationship_health_summary invoker=true owner=postgres anon_select=true authenticated_select=true
relationship_commitment_stats | view public.relationship_health_summary invoker=true owner=postgres anon_select=true authenticated_select=true
== S4 RLS policies whose USING or WITH CHECK names the view
== controls (each instrument can see a non-zero)
S1/S2 functions_scanned=1020
S3 views_and_matviews_scanned=52
S4 policies_scanned=1154 policies_naming_auth_uid=771
SUPPLEMENT_EXIT=0
```

`pg_cron` jobs. Command:
`psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select 'cron_jobs_total='||count(*)||' naming_one_of_the_three='||count(*) filter (where command ilike any (array['%sla_compliance_metrics%','%team_entity_stats%','%dossier_list_mv%'])) from cron.job" -c "select jobname||' | user='||username||' | active='||active||' | '||command from cron.job where command ilike any (array['%sla_compliance_metrics%','%team_entity_stats%','%dossier_list_mv%'])"`.
Verbatim:

```text
cron_jobs_total=7 naming_one_of_the_three=0
CRON_EXIT=0
```

The trigger definitions and the trigger function body. Commands:
`select pg_get_triggerdef(t.oid) from pg_trigger t join pg_proc p on p.oid=t.tgfoid where not t.tgisinternal and p.proname in ('queue_dossier_list_mv_refresh','refresh_citation_network_on_change') order by 1`,
then in the same `psql` call
`select 'authenticated_update_dossiers='||has_table_privilege('authenticated','public.dossiers','UPDATE')||' dossier_list_mv_unique_indexes='||(select count(*) from pg_index i where i.indrelid='public.dossier_list_mv'::regclass and i.indisunique)`,
and separately `select prosrc from pg_proc where proname='queue_dossier_list_mv_refresh'`. The unique
index is what lets `REFRESH ... CONCURRENTLY` run, and the `UPDATE` privilege lets the trigger control
below fire. Verbatim:

```text
CREATE TRIGGER trg_countries_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.countries FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_dossiers_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.dossiers FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_engagements_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.engagements FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_forums_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.forums FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_organizations_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.organizations FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_persons_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.persons FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_topics_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.topics FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trg_working_groups_refresh_mv AFTER INSERT OR DELETE OR UPDATE ON public.working_groups FOR EACH STATEMENT EXECUTE FUNCTION queue_dossier_list_mv_refresh()
CREATE TRIGGER trigger_refresh_citation_network AFTER INSERT OR DELETE OR UPDATE ON public.entity_citations FOR EACH STATEMENT EXECUTE FUNCTION refresh_citation_network_on_change()
authenticated_update_dossiers=true dossier_list_mv_unique_indexes=1

BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_list_mv;
  RETURN NULL;
END;
```

### What the census shows for the three

- **`sla_compliance_metrics`** has no consumer of any class: no function, no trigger, no view or
  materialized view, no policy and no cron job.
- **`team_entity_stats`** has two functions, `get_team_stats_for_entity` and
  `refresh_team_entity_stats`. Both are `secdef=true` and owned by `postgres`. It has no trigger, view,
  policy or cron job.
- **`dossier_list_mv`** has five functions, all `secdef=true` and owned by `postgres`. One of them,
  `queue_dossier_list_mv_refresh`, is a trigger function. It is attached to 8 tables as a
  `FOR EACH STATEMENT` trigger. It has no view, policy or cron job.

Every consumer of the three is therefore a SECURITY DEFINER function owned by `postgres`, the owner of
the materialized views. The three have **no** `secdef=false` function, **no** `security_invoker` view
and **no** invoker trigger function.

**How I read the plan's stop rule for triggers.** The plan's STOP rule names "any trigger function
reaching one of the three". I read it together with the acceptance criterion, "ONLY SECURITY DEFINER
consumers". The one trigger function reaching `dossier_list_mv` is SECURITY DEFINER. Its
`REFRESH MATERIALIZED VIEW CONCURRENTLY` runs as `postgres`, not as the writing client. The failure mode
behind the STOP rule is the P100-17 trigger on `citation_network`: `secdef=false`, so its refresh runs
as the client. That failure cannot occur here.

I did not leave this as an argument. After the revoke, an `authenticated` UPDATE fired
`trg_dossiers_refresh_mv` and succeeded (next section, positive controls). If the reader disagrees with
this interpretation, that measured result is what to weigh against it.

**Every zero here has a control that could have shown a non-zero:**

- S1 and S2 scanned 1020 functions. The same rows show `secdef=false` functions and an invoker trigger
  for the P100-17 views.
- S3 scanned 52 views and materialized views, and found the invoker view `relationship_health_summary`.
- S4 scanned 1154 policies, 771 of which name `auth.uid`.
- `cron.job` holds 7 jobs.

## Source sweep for the three — planning bound

The catalog cannot see edge or backend callers: `mv_tag_usage_analytics` shows `fn:- view:-` yet has a
live edge caller. So I also swept tracked source for each of the three names, anywhere in a file and not
only in `.from()`. The sweep ran at `34960ccf2`, before the migration commit:

```bash
for view in sla_compliance_metrics team_entity_stats dossier_list_mv; do for area in backend/src supabase/functions frontend/src; do n=$(git grep -lIF -e "$view" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf '%s %s files_naming=%s\n' "$view" "$area" "$n"; done; done; for area in backend/src supabase/functions frontend/src; do n=$(git grep -lIF -e "from('dossiers')" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf "control from('dossiers') %s files=%s\n" "$area" "$n"; done
```

Verbatim:

```text
sla_compliance_metrics backend/src files_naming=1
sla_compliance_metrics supabase/functions files_naming=0
sla_compliance_metrics frontend/src files_naming=1
team_entity_stats backend/src files_naming=1
team_entity_stats supabase/functions files_naming=0
team_entity_stats frontend/src files_naming=1
dossier_list_mv backend/src files_naming=1
dossier_list_mv supabase/functions files_naming=2
dossier_list_mv frontend/src files_naming=1
control from('dossiers') backend/src files=5
control from('dossiers') supabase/functions files=53
control from('dossiers') frontend/src files=18
```

Per-file breakdown. Command
`git grep -cIF -e sla_compliance_metrics -e team_entity_stats -e dossier_list_mv -- 'backend/src/**' 'supabase/functions/**' 'frontend/src/**'`
(at `bf6115f25`), verbatim:

```text
backend/src/types/database.types.ts:83
frontend/src/types/database.types.ts:83
supabase/functions/dossiers-create/index.ts:1
supabase/functions/dossiers-update/index.ts:1
```

The two `database.types.ts` files are generated type declarations. They hold the relation types and
FK `referencedRelation` entries, and no query. The two edge-function hits are, verbatim,
`supabase/functions/dossiers-create/index.ts:361:    supabaseAdmin.rpc('refresh_dossier_list_mv').then(({ error }) => {`
and
`supabase/functions/dossiers-update/index.ts:296:    supabaseAdmin.rpc('refresh_dossier_list_mv').then(({ error }) => {`.
In both files `supabaseAdmin` is built from `SUPABASE_SERVICE_ROLE_KEY` (`dossiers-create/index.ts:96-98`,
`dossiers-update/index.ts:86-88`). Both call a SECURITY DEFINER function. No tracked source reads any of
the three through a client role. The `from('dossiers')` control (5, 53 and 18 files) shows the instrument
sees non-zeros in all three areas.

## Migration applies

Command, run twice from the worktree root:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000006_p100_materialized_views_restrict.sql
```

Verbatim:

```text
first apply 16:03:09Z
REVOKE
REVOKE
REVOKE
FIRST_APPLY_EXIT=0
second apply 16:03:10Z
REVOKE
REVOKE
REVOKE
SECOND_APPLY_EXIT=0
```

Both applies exited 0, so the file is idempotent. Per D-13 this task wrote no ledger row. As the plan
notes, earlier attempts had already revoked the three on staging, and the pre-apply census confirms it.
The applies therefore changed no ACL. The file is what the diff must carry.

## Grant census — every grantee with the authoritative privilege answers

The query renders every grantee from `aclexplode(c.relacl)`, including `PUBLIC` when present. It prints
`has_table_privilege` for `anon`, `authenticated` and `service_role` beside each row, so a grant
inherited through role membership cannot hide behind a filtered row.

Pre-apply (15:56:38Z). This run covered every `public` materialized view, which is exactly these
twelve:

```bash
psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "with a as (select c.relname, coalesce((select string_agg(case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end||'='||x.privilege_type, ',' order by case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end, x.privilege_type) from aclexplode(c.relacl) x),'(null-acl)') acl, has_table_privilege('anon',c.oid,'SELECT') an, has_table_privilege('authenticated',c.oid,'SELECT') au, has_table_privilege('service_role',c.oid,'SELECT') sr from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='m') select relname||' | anon_can_select='||an||' authenticated_can_select='||au||' service_role_can_select='||sr||' | '||acl from a order by relname"
```

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
EXIT=0
```

Post-apply (16:03:48Z). This is the same query restricted to the twelve by name (`... and c.relname in
(<the twelve>)`):

```text
aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
citation_network | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
dossier_list_mv | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
mv_tag_usage_analytics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_commitment_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
relationship_engagement_stats | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=MAINTAIN,authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
sla_compliance_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
stakeholder_network_summary | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
team_entity_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
user_productivity_metrics | anon_can_select=false authenticated_can_select=true service_role_can_select=true | authenticated=SELECT,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
POST_CENSUS_EXIT=0
```

**The three:** `sla_compliance_metrics`, `team_entity_stats` and `dossier_list_mv` each render exactly
the eight `postgres` privileges and the eight `service_role` privileges. None has `PUBLIC`, `anon` or
`authenticated` as a grantee. Both client-role answers are `false`, and `service_role_can_select=true`.

**The nine:** each renders the ACL restored by the overseer, with `authenticated=SELECT`, plus `MAINTAIN`
on four of the P100-17 views. That ACL is the same before and after the applies, which confirms this
task did not touch them.

## Plan oracles, byte-for-byte from `100-06-PLAN.md` at `cf839feb1`

I extracted the two `oracle: command` strings from the plan (YAML `''` unescaped to `'`, nothing else
changed) and ran them from the worktree root with `bash`. Verbatim:

```text
== plan oracle 1, grants 16:04:11Z
P100-06-GRANTS named=3 rendered=3 at_expected_full_state=3 expected rendered=3 at_expected_full_state=3
  GRANTS dossier_list_mv | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS sla_compliance_metrics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS team_entity_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
ORACLE1_EXIT=0
== plan oracle 2, reads 16:04:12Z
P100-06 reads: sla_compliance_metrics=denied team_entity_stats=denied dossier_list_mv=denied dossier_list_mv@service_role=112/112
PASS reads
ORACLE2_EXIT=0
```

The plan says oracle 1 was RED at the plan's HEAD (`121c86622`), where all three carried both client
roles. Today it is GREEN because the three are revoked. Oracle 2's retained-access arm reads exactly
**112**. That is the same count 100-RESEARCH.md §9.3 records a non-owner reading at HEAD.

## Behavioural reads — the three denials, and the nine untouched

Each read ran `begin; set local role authenticated; set local request.jwt.claims = '{"sub":"<non-owner uid>","role":"authenticated"}'; select count(*) from public.<view>; rollback;`
as the resolved non-owner, `test.user@gmail.com`. The run started at 16:03:50Z, after
`identities: non-owner=test.user@gmail.com owner=kazahrani@stats.gov.sa resolved=yes control_dossier_resolved=yes`.
Verbatim:

```text
sla_compliance_metrics | DENIED | rc=3 | ERROR:  permission denied for materialized view sla_compliance_metrics
team_entity_stats | DENIED | rc=3 | ERROR:  permission denied for materialized view team_entity_stats
dossier_list_mv | DENIED | rc=3 | ERROR:  permission denied for materialized view dossier_list_mv
dossier_engagement_stats | ANSWERED rows=0 | rc=0
dossier_commitment_stats | ANSWERED rows=0 | rc=0
mv_tag_usage_analytics | ANSWERED rows=13 | rc=0
stakeholder_network_summary | ANSWERED rows=0 | rc=0
user_productivity_metrics | ANSWERED rows=0 | rc=0
relationship_engagement_stats | ANSWERED rows=0 | rc=0
relationship_commitment_stats | ANSWERED rows=0 | rc=0
citation_network | ANSWERED rows=0 | rc=0
aa_commitment_summary_by_dossier | ANSWERED rows=0 | rc=0
```

**Three denial classifications:** `sla_compliance_metrics` DENIED, `team_entity_stats` DENIED and
`dossier_list_mv` DENIED. All three are `rc=3` with the exact `permission denied for materialized view`
text. The same instrument returned `ANSWERED` for each of the nine untouched views, and 13 rows for
`mv_tag_usage_analytics`. So a DENIED result means the grant, not a broken probe.

**Retained access.** Each read ran `set local role service_role`, rolled back, at 16:04:04Z. Verbatim:

```text
dossier_list_mv@service_role | rc=0 | 112
sla_compliance_metrics@service_role | rc=0 | 0
team_entity_stats@service_role | rc=0 | 4
```

`dossier_list_mv` still returns its recorded **112** rows to the role the backend uses.
`sla_compliance_metrics` holds 0 rows. That zero is the table's content, not a denial: the same
instrument read 112 and 4 rows from the other two, and the denial above does not depend on row count.

## Positive controls — the definer consumers still work after the revoke

Each control ran as `authenticated` with JWT claims and was rolled back, at 16:04:07Z. The first three
use the non-owner. The trigger control uses the owner doing an UPDATE on
`public.dossiers set status = status` for one active dossier. That UPDATE fires the `FOR EACH STATEMENT`
trigger `trg_dossiers_refresh_mv`. Verbatim:

```text
list_dossiers_optimized (reads dossier_list_mv) as non-owner | OK | rc=0 | json_type=object data_len=5
get_dossier_with_extension (reads dossier_list_mv) as non-owner | OK | rc=0 | json_type=object
get_team_stats_for_entity (reads team_entity_stats) as non-owner | OK | rc=0 | json_type=object total_count=n/a
trg_dossiers_refresh_mv -> queue_dossier_list_mv_refresh (REFRESH dossier_list_mv) fired by an owner UPDATE | OK | rc=0 | rows_updated=1
```

Each consumer found in the census still runs while `authenticated` is denied the view directly:

- The two `dossier_list_mv` readers work.
- The `team_entity_stats` reader works. Its `total_count=n/a` only means the JSON has no top-level
  `total_count` key. The point of the control is that no permission error was raised.
- The `dossier_list_mv` refresh trigger works: `REFRESH MATERIALIZED VIEW CONCURRENTLY` ran as the
  definer.

A `permission denied for materialized view` anywhere here would have been classified
`DENIED-AT-MATVIEW`. The revoke broke no path that the catalog or the source sweep can see.

All the commands in the last four sections come from one script. It is reproduced here in full so the
captures can be re-run:

```bash
#!/bin/bash
# P100-06 post-apply evidence. Grant census of the twelve (every grantee plus three
# has_table_privilege answers), twelve reads as the non-owner, retained service_role
# reads of the three, definer-consumer positive controls, then the plan's two command
# oracles byte-for-byte as extracted from 100-06-PLAN.md at cf839feb1.
cd <worktree root> || exit 3
S=<scratchpad holding oracle1.sh and oracle2.sh>
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
Q() { psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "$1"; }
TWELVE="sla_compliance_metrics team_entity_stats dossier_list_mv dossier_engagement_stats dossier_commitment_stats mv_tag_usage_analytics stakeholder_network_summary user_productivity_metrics relationship_engagement_stats relationship_commitment_stats citation_network aa_commitment_summary_by_dossier"

echo "== post-apply grant census, twelve by name $(date -u +%H:%M:%SZ)"
Q "<the grant census query above, with: and c.relname in ('sla_compliance_metrics','team_entity_stats','dossier_list_mv','dossier_engagement_stats','dossier_commitment_stats','mv_tag_usage_analytics','stakeholder_network_summary','user_productivity_metrics','relationship_engagement_stats','relationship_commitment_stats','citation_network','aa_commitment_summary_by_dossier')>"
echo "POST_CENSUS_EXIT=$?"

OTH=$(Q "select id from auth.users where email='test.user@gmail.com'")
OWN=$(Q "select id from auth.users where email='kazahrani@stats.gov.sa'")
DID=$(Q "select id from public.dossiers where status='active' order by created_at limit 1")
echo "identities: non-owner=test.user@gmail.com owner=kazahrani@stats.gov.sa resolved=$([ -n "$OTH" ] && [ -n "$OWN" ] && echo yes || echo NO) control_dossier_resolved=$([ -n "$DID" ] && echo yes || echo NO)"

echo "== twelve reads as the non-owner authenticated caller, each rolled back $(date -u +%H:%M:%SZ)"
for v in $TWELVE; do
  out=$(printf "begin;\nset local role authenticated;\nset local request.jwt.claims = '{\"sub\":\"%s\",\"role\":\"authenticated\"}';\nselect count(*) from public.%s;\nrollback;\n" "$OTH" "$v" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); rc=$?
  case "$rc:$out" in
    0:*) echo "$v | ANSWERED rows=$(printf '%s' "$out" | tail -1) | rc=0";;
    3:*"permission denied for materialized view"*) echo "$v | DENIED | rc=3 | $(printf '%s' "$out" | head -1)";;
    *) echo "$v | BROKEN | rc=$rc | $out";;
  esac
done

echo "== retained service_role reads of the three, each rolled back $(date -u +%H:%M:%SZ)"
for v in dossier_list_mv sla_compliance_metrics team_entity_stats; do
  out=$(printf "begin;\nset local role service_role;\nselect count(*) from public.%s;\nrollback;\n" "$v" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); rc=$?
  echo "$v@service_role | rc=$rc | $(printf '%s' "$out" | tail -1)"
done

echo "== definer-consumer positive controls as authenticated, each rolled back $(date -u +%H:%M:%SZ)"
ctl() {
  out=$(printf "begin;\nset local role authenticated;\nset local request.jwt.claims = '{\"sub\":\"%s\",\"role\":\"authenticated\"}';\n%s\nrollback;\n" "$2" "$3" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); rc=$?
  case "$rc:$out" in
    0:*) echo "$1 | OK | rc=0 | $(printf '%s' "$out" | tail -1)";;
    *"permission denied for materialized view"*) echo "$1 | DENIED-AT-MATVIEW | rc=$rc | $out";;
    *) echo "$1 | OTHER | rc=$rc | $out";;
  esac
}
ctl "list_dossiers_optimized (reads dossier_list_mv) as non-owner" "$OTH" "select 'json_type='||json_typeof(r)||' data_len='||coalesce(json_array_length(case when json_typeof(r->'data')='array' then r->'data' end)::text,'n/a') from (select public.list_dossiers_optimized(p_limit => 5) r) s;"
ctl "get_dossier_with_extension (reads dossier_list_mv) as non-owner" "$OTH" "select 'json_type='||coalesce(json_typeof(public.get_dossier_with_extension('$DID'::uuid)),'sql-null');"
ctl "get_team_stats_for_entity (reads team_entity_stats) as non-owner" "$OTH" "select 'json_type='||coalesce(json_typeof(r),'sql-null')||' total_count='||coalesce(r->>'total_count','n/a') from (select public.get_team_stats_for_entity('dossier', '$OTH'::uuid) r) s;"
ctl "trg_dossiers_refresh_mv -> queue_dossier_list_mv_refresh (REFRESH dossier_list_mv) fired by an owner UPDATE" "$OWN" "with u as (update public.dossiers d set status = d.status where d.id = '$DID' returning 1) select 'rows_updated='||count(*) from u;"

echo "== plan oracle 1, grants $(date -u +%H:%M:%SZ)"
bash "$S/oracle1.sh"; echo "ORACLE1_EXIT=$?"
echo "== plan oracle 2, reads $(date -u +%H:%M:%SZ)"
bash "$S/oracle2.sh"; echo "ORACLE2_EXIT=$?"
```

The script exited 0 (`POST_SH_EXIT=0`). The only edits in this copy: the two machine paths are replaced
by placeholders, and the long census query is abbreviated to a pointer to the query shown above. The
`SELECT` statements, identity lookups, classifications and oracle invocations are unchanged.

## What this does NOT establish — no RLS on materialized views

A PostgreSQL **materialized view has no RLS**. This revocation removes **CLIENT access**, meaning direct
`anon` and `authenticated` table access to the three. It **does not row-scope the data** for whoever
still reads it:

- `service_role` still reads each full result, including all 112 `dossier_list_mv` rows.
- The SECURITY DEFINER consumers listed in S1 still read the three as `postgres`. S1 shows each of them
  is EXECUTE-able by both `anon` and `authenticated`: `list_dossiers_optimized`,
  `get_dossier_with_extension`, `get_team_stats_for_entity`, and the `refresh_*` helpers.
- The positive control above shows `list_dossiers_optimized` returning `dossier_list_mv`-backed rows
  to the non-owner after the revoke.

So client roles can still reach this data **through those RPCs**. Who may EXECUTE them is the advisor's
`*_security_definer_function_executable` class, which is outside this plan's population
(100-CONTEXT.md §3). This task makes no claim about it.

## Left for named later tasks

- **P100-16** handles the four edge-consumed views: `dossier_engagement_stats`,
  `dossier_commitment_stats`, `mv_tag_usage_analytics` and `stakeholder_network_summary`. It repairs the
  three edge callers, deploys them, then revokes.
- **P100-17** handles the five invoker-consumed views: `user_productivity_metrics`,
  `relationship_engagement_stats`, `relationship_commitment_stats`, `citation_network` and
  `aa_commitment_summary_by_dossier`. It converts their consumers to SECURITY DEFINER with a pinned
  `search_path`, then revokes.
- **P100-15** owns the phase arithmetic, the register and the sign-off (D-37). The false premise in
  `100-CONTEXT.md` D-07, that all twelve are a pure revocation, is corrected by
  OVERSEER-RULING-P100-06-SPLIT and OVERSEER-RULING-P100-06-INVOKER-CONSUMERS rather than edited here,
  because that file is outside this task's scope.
