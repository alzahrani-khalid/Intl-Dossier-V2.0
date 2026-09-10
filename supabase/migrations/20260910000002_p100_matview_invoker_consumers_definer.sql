ALTER FUNCTION public.get_user_productivity_metrics(uuid)
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.get_entity_citations(citation_source_type, uuid, text, boolean, integer)
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.get_citation_network_graph(citation_source_type, uuid, integer, integer)
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.refresh_citation_network_on_change()
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.refresh_relationship_health_stats()
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.refresh_aa_commitment_summary()
  SECURITY DEFINER
  SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_relationship_health_summary()
RETURNS SETOF public.relationship_health_summary
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.relationship_health_summary
$$;

REVOKE EXECUTE ON FUNCTION public.get_relationship_health_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_relationship_health_summary() TO authenticated, service_role;

REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.citation_network FROM anon, authenticated;
REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
