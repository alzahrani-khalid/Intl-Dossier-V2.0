---
phase: 100-security-posture
plan: 5
status: complete
completed: 2026-09-10
---

# P100-05 — unconsumed-view restriction

The migration revoked all privileges from `anon` and `authenticated` on the twenty named views. Both
the initial staging apply and the unchanged replay exited 0. Fresh post-apply checks rendered every
grantee on every view, confirmed that `anon` and `authenticated` have no inherited SELECT privilege,
classified all twenty authenticated reads as `DENIED`, and retained an answering `service_role` read.

## Migration diff

The changed hunk is `supabase/migrations/20260908000005_p100_unconsumed_views_restrict.sql:1-23`:

```diff
@@ -0,0 +1,23 @@
+-- P100-05: restrict views with no consumer in tracked repository sources.
+-- REVOKE is idempotent, so this migration is safe to replay directly with psql.
+
+REVOKE ALL ON public.link_audit_logs_archival_eligible FROM anon, authenticated;
+REVOKE ALL ON public.citation_statistics FROM anon, authenticated;
+REVOKE ALL ON public.user_work_summary FROM anon, authenticated;
+REVOKE ALL ON public.ai_usage_summary FROM anon, authenticated;
+REVOKE ALL ON public.user_ai_usage FROM anon, authenticated;
+REVOKE ALL ON public.audit_logs_active FROM anon, authenticated;
+REVOKE ALL ON public.ai_interaction_summary FROM anon, authenticated;
+REVOKE ALL ON public.intelligence_cache_status FROM anon, authenticated;
+REVOKE ALL ON public.engagement_briefs FROM anon, authenticated;
+REVOKE ALL ON public.embedding_queue_stats FROM anon, authenticated;
+REVOKE ALL ON public.recent_field_changes FROM anon, authenticated;
+REVOKE ALL ON public.sla_compliance_by_assignee FROM anon, authenticated;
+REVOKE ALL ON public.engagement_analytics FROM anon, authenticated;
+REVOKE ALL ON public.commitment_analytics FROM anon, authenticated;
+REVOKE ALL ON public.work_item_analytics FROM anon, authenticated;
+REVOKE ALL ON public.top_contributors FROM anon, authenticated;
+REVOKE ALL ON public.user_digest_content_summary FROM anon, authenticated;
+REVOKE ALL ON public.v_dossier_extension_health FROM anon, authenticated;
+REVOKE ALL ON public.resolved_field_permissions FROM anon, authenticated;
+REVOKE ALL ON public.stakeholder_timeline_unified FROM anon, authenticated;
```

There is one explicit `REVOKE` for each name. `REVOKE` is idempotent, and names are deliberately not
guarded with `IF EXISTS`: a stale list must fail rather than silently restrict a different population.
No migration-ledger row was fabricated.

## Apply record

Command, run twice without modification:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000005_p100_unconsumed_views_restrict.sql
```

Verbatim first-apply output:

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
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
exit=0
```

Verbatim second-apply output:

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
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
exit=0
```

## PLANNING BOUND — consumer census

This census is explicitly a **PLANNING BOUND, not evidence of correctness**. Its population is
**TRACKED REPOSITORY SOURCES ONLY**: `frontend/src/**`, `backend/src/**`, and
`supabase/functions/**`. A BI tool, a Retool app, or a saved dashboard query reading one of these
twenty views would not have appeared in it. A break in such an untracked consumer is loud
(`permission denied`) and reversible (re-`GRANT`). Correctness is graded by the live ACL and runtime
read checks below.

Command: for each hardcoded view, `git grep -lI` searched both `from('<view>')` and
`from("<view>")` over the tracked-source population, treating grep status 1 as zero matches and any
other non-zero status as an instrument failure. The positive control ran the same frontend probe for
`from('dossiers')` and required exactly 18 files.

Verbatim output:

```text
link_audit_logs_archival_eligible | frontend_files=0 server_files=0 total_tracked_source_files=0
citation_statistics | frontend_files=0 server_files=0 total_tracked_source_files=0
user_work_summary | frontend_files=0 server_files=0 total_tracked_source_files=0
ai_usage_summary | frontend_files=0 server_files=0 total_tracked_source_files=0
user_ai_usage | frontend_files=0 server_files=0 total_tracked_source_files=0
audit_logs_active | frontend_files=0 server_files=0 total_tracked_source_files=0
ai_interaction_summary | frontend_files=0 server_files=0 total_tracked_source_files=0
intelligence_cache_status | frontend_files=0 server_files=0 total_tracked_source_files=0
engagement_briefs | frontend_files=0 server_files=0 total_tracked_source_files=0
embedding_queue_stats | frontend_files=0 server_files=0 total_tracked_source_files=0
recent_field_changes | frontend_files=0 server_files=0 total_tracked_source_files=0
sla_compliance_by_assignee | frontend_files=0 server_files=0 total_tracked_source_files=0
engagement_analytics | frontend_files=0 server_files=0 total_tracked_source_files=0
commitment_analytics | frontend_files=0 server_files=0 total_tracked_source_files=0
work_item_analytics | frontend_files=0 server_files=0 total_tracked_source_files=0
top_contributors | frontend_files=0 server_files=0 total_tracked_source_files=0
user_digest_content_summary | frontend_files=0 server_files=0 total_tracked_source_files=0
v_dossier_extension_health | frontend_files=0 server_files=0 total_tracked_source_files=0
resolved_field_permissions | frontend_files=0 server_files=0 total_tracked_source_files=0
stakeholder_timeline_unified | frontend_files=0 server_files=0 total_tracked_source_files=0
CONTROL from('dossiers') | frontend_files=18 expected=18
```

The twenty zero rows are carried beside their non-zero positive control so an empty or broken sweep
cannot masquerade as the bound.

## Fresh post-apply full-grantee grant rows

The plan's grant oracle queried the exact twenty names, rendered `aclexplode(relacl)` without a grantee
filter (including `PUBLIC` if present), and paired it with `has_table_privilege` for both client roles.
It requires exactly twenty catalog rows; no rows scores 0 of 20, and a stale name list exits 3. Each row
is whole-string matched against the complete positive end state, so `PUBLIC` would render as its own
entry and fail. The paired privilege answers also catch access inherited through role membership that
has no ACL row. Exit status was 0.

Verbatim output:

```text
P100-05-GRANTS named=20 rendered=20 at_expected_full_state=20 expected rendered=20 at_expected_full_state=20
  GRANTS ai_interaction_summary | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS ai_usage_summary | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS audit_logs_active | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS citation_statistics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS commitment_analytics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS embedding_queue_stats | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS engagement_analytics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS engagement_briefs | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS intelligence_cache_status | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS link_audit_logs_archival_eligible | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS recent_field_changes | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS resolved_field_permissions | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS sla_compliance_by_assignee | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS stakeholder_timeline_unified | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS top_contributors | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_ai_usage | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_digest_content_summary | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_work_summary | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS v_dossier_extension_health | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS work_item_analytics | anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
```

This is the positive end state per view with **EVERY grantee rendered**. It would fail on a `PUBLIC`
grant, an inherited client privilege, a missing view, an extra client ACL entry, or a partial revoke.

## Behavioral denial and retained access

The plan's behavioral oracle resolved `test.user@gmail.com` live, then read every named view in a
transaction under `role authenticated` and caller JWT claims. A read is `denied` only when `psql`
exits 3 with a permission-denied error; status 0 with numeric output is `answered`; malformed output,
unrelated errors, and other statuses exit 3 as instrument failures. It then performed the same read of
`citation_statistics` under `service_role`, requiring an answered numeric result. Exit status was 0.

Verbatim output:

```text
P100-05 reads: link_audit_logs_archival_eligible=denied citation_statistics=denied user_work_summary=denied ai_usage_summary=denied user_ai_usage=denied audit_logs_active=denied ai_interaction_summary=denied intelligence_cache_status=denied engagement_briefs=denied embedding_queue_stats=denied recent_field_changes=denied sla_compliance_by_assignee=denied engagement_analytics=denied commitment_analytics=denied work_item_analytics=denied top_contributors=denied user_digest_content_summary=denied v_dossier_extension_health=denied resolved_field_permissions=denied stakeholder_timeline_unified=denied citation_statistics@service_role=0/any
PASS reads
```

Thus all twenty were checked behaviorally, not by one representative. A nineteen-view revoke fails by
naming the twentieth. The retained-access arm catches an over-reaching revoke at runtime: the
`service_role` read answered with 0 rows, which establishes access even though this staging view is
empty. Any read that is neither answered nor denied is an instrument failure, not a passing verdict.

P100-12 and P100-14 own the fresh wave-3 re-proofs after sibling migrations land; no work remains for
P100-05.
