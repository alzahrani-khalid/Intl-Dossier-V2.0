-- P100-03: Preserve caller-JWT edge-function reads while enforcing base-table RLS.

ALTER VIEW public.theme_details SET (security_invoker = true);
ALTER VIEW public.relationship_health_summary SET (security_invoker = true);
ALTER VIEW public.v_country_engagement_metrics SET (security_invoker = true);
ALTER VIEW public.v_country_relationship_flows SET (security_invoker = true);
ALTER VIEW public.v_regional_engagement_summary SET (security_invoker = true);
ALTER VIEW public.engagement_recommendations_summary SET (security_invoker = true);
ALTER VIEW public.dossier_activity_timeline SET (security_invoker = true);

-- The timeline's driving table previously had no admin read arm. Under invoker
-- semantics that hid 15 commitment links from the designated admin owner.
DO $$
BEGIN
  DROP POLICY IF EXISTS p100_admin_read_work_item_dossiers
    ON public.work_item_dossiers;

  CREATE POLICY p100_admin_read_work_item_dossiers
    ON public.work_item_dossiers
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.users AS u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
      )
    );
END
$$;
