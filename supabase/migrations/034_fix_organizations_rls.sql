-- Simplify organizations RLS to avoid tenant config dependency
BEGIN;

DROP POLICY IF EXISTS tenant_isolation_select ON public.organizations;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.organizations;
DROP POLICY IF EXISTS tenant_isolation_update ON public.organizations;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.organizations;
DROP POLICY IF EXISTS organizations_select_authenticated ON public.organizations;
DROP POLICY IF EXISTS organizations_select_service_role ON public.organizations;

CREATE POLICY organizations_select_authenticated ON public.organizations
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY organizations_select_service_role ON public.organizations
  FOR SELECT
  USING (auth.role() = 'service_role');

COMMIT;
