-- P100-03: Preserve caller-JWT edge-function reads while enforcing base-table RLS.

ALTER VIEW public.theme_details SET (security_invoker = true);
ALTER VIEW public.relationship_health_summary SET (security_invoker = true);
ALTER VIEW public.v_country_engagement_metrics SET (security_invoker = true);
ALTER VIEW public.v_country_relationship_flows SET (security_invoker = true);
ALTER VIEW public.v_regional_engagement_summary SET (security_invoker = true);
ALTER VIEW public.engagement_recommendations_summary SET (security_invoker = true);
ALTER VIEW public.dossier_activity_timeline SET (security_invoker = true);

-- security_invoker requires the caller to hold privileges on every base
-- relation. These materialized statistics inputs have no RLS of their own.
GRANT SELECT ON public.relationship_engagement_stats TO authenticated;
GRANT SELECT ON public.relationship_commitment_stats TO authenticated;

-- The timeline's pre-conversion owner census includes links across dossiers an
-- admin may read by clearance. Preserve that access without restoring the
-- original definer-view bypass: this helper reads only the role and dossier
-- attributes needed by the policy, under a fixed search_path.
DROP POLICY IF EXISTS p100_admin_read_work_item_dossiers
  ON public.work_item_dossiers;

-- Remove the superseded repair-attempt signature before creating the
-- caller-bound form below.
DROP FUNCTION IF EXISTS public.p100_admin_can_read_work_item_dossier(uuid, uuid);

CREATE OR REPLACE FUNCTION public.p100_admin_can_read_work_item_dossier(p_dossier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1
      FROM public.dossiers d
      WHERE d.id = p_dossier_id
        AND d.status <> 'deleted'
        AND public.get_user_clearance_level(auth.uid()) >= d.sensitivity_level
    );
$$;

REVOKE ALL ON FUNCTION public.p100_admin_can_read_work_item_dossier(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.p100_admin_can_read_work_item_dossier(uuid) TO authenticated;

CREATE POLICY p100_admin_read_work_item_dossiers
  ON public.work_item_dossiers
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.p100_admin_can_read_work_item_dossier(dossier_id)
  );
