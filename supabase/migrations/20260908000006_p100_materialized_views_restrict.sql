-- Materialized views have no RLS. Remove client-role access only from the eight
-- materialized views with no tracked application caller; service_role retains its
-- existing ACL. The four edge-consumed materialized views are deliberately absent:
-- P100-16 moves their callers to a service-role read, deploys, then restricts them.
REVOKE ALL ON public.citation_network FROM anon, authenticated;
REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
