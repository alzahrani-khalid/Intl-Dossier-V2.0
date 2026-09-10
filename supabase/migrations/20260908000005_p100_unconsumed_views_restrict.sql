-- P100-05: restrict views with no consumer in tracked repository sources.
-- REVOKE is idempotent, so this migration is safe to replay directly with psql.

REVOKE ALL ON public.link_audit_logs_archival_eligible FROM anon, authenticated;
REVOKE ALL ON public.citation_statistics FROM anon, authenticated;
REVOKE ALL ON public.user_work_summary FROM anon, authenticated;
REVOKE ALL ON public.ai_usage_summary FROM anon, authenticated;
REVOKE ALL ON public.user_ai_usage FROM anon, authenticated;
REVOKE ALL ON public.audit_logs_active FROM anon, authenticated;
REVOKE ALL ON public.ai_interaction_summary FROM anon, authenticated;
REVOKE ALL ON public.intelligence_cache_status FROM anon, authenticated;
REVOKE ALL ON public.engagement_briefs FROM anon, authenticated;
REVOKE ALL ON public.embedding_queue_stats FROM anon, authenticated;
REVOKE ALL ON public.recent_field_changes FROM anon, authenticated;
REVOKE ALL ON public.sla_compliance_by_assignee FROM anon, authenticated;
REVOKE ALL ON public.engagement_analytics FROM anon, authenticated;
REVOKE ALL ON public.commitment_analytics FROM anon, authenticated;
REVOKE ALL ON public.work_item_analytics FROM anon, authenticated;
REVOKE ALL ON public.top_contributors FROM anon, authenticated;
REVOKE ALL ON public.user_digest_content_summary FROM anon, authenticated;
REVOKE ALL ON public.v_dossier_extension_health FROM anon, authenticated;
REVOKE ALL ON public.resolved_field_permissions FROM anon, authenticated;
REVOKE ALL ON public.stakeholder_timeline_unified FROM anon, authenticated;
