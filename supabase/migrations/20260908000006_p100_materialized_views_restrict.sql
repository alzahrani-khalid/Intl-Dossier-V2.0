-- Materialized views have no RLS. Remove client-role access only from the three
-- materialized views whose sole database consumers are SECURITY DEFINER functions;
-- service_role and the owner keep their existing ACL. The four edge-consumed views
-- are P100-16's and the five invoker-consumed views are P100-17's.
REVOKE ALL ON public.sla_compliance_metrics FROM anon, authenticated;
REVOKE ALL ON public.team_entity_stats FROM anon, authenticated;
REVOKE ALL ON public.dossier_list_mv FROM anon, authenticated;
