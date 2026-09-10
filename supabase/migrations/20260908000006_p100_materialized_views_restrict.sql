-- Materialized views have no RLS. Remove client-role access from every public
-- materialized view; service_role retains its existing ACL.
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
