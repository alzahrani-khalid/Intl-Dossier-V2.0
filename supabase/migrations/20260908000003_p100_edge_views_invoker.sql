-- P100-03: Preserve caller-JWT edge-function reads while enforcing base-table RLS.

ALTER VIEW public.theme_details SET (security_invoker = true);
ALTER VIEW public.relationship_health_summary SET (security_invoker = true);
ALTER VIEW public.v_country_engagement_metrics SET (security_invoker = true);
ALTER VIEW public.v_country_relationship_flows SET (security_invoker = true);
ALTER VIEW public.v_regional_engagement_summary SET (security_invoker = true);
ALTER VIEW public.engagement_recommendations_summary SET (security_invoker = true);
ALTER VIEW public.dossier_activity_timeline SET (security_invoker = true);

-- Repair cleanup: an earlier application added this out-of-scope policy. It
-- bypassed dossier clearance and deleted-status checks for admin callers.
DROP POLICY IF EXISTS p100_admin_read_work_item_dossiers
  ON public.work_item_dossiers;
