-- Phase 45 schema-seed closure: intelligence_digest foundation
-- Seed source: supabase/seed/060-dashboard-demo.sql
--
-- This migration creates the tenant-scoped dashboard digest table used by
-- the Phase 45 dashboard data closure plans. The idempotent demo rows are
-- appended below in the follow-up task so the schema remains independently
-- reviewable.

CREATE TABLE IF NOT EXISTS public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  headline_en TEXT NOT NULL,
  headline_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  source_publication TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_org_occurred_at
  ON public.intelligence_digest (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_dossier
  ON public.intelligence_digest (dossier_id)
  WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_source_publication
  ON public.intelligence_digest (source_publication);

ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_digest_select_org ON public.intelligence_digest;
CREATE POLICY intelligence_digest_select_org
  ON public.intelligence_digest FOR SELECT
  TO authenticated
  USING (tenant_isolation.rls_select_policy(organization_id));

DROP POLICY IF EXISTS intelligence_digest_insert_editor ON public.intelligence_digest;
CREATE POLICY intelligence_digest_insert_editor
  ON public.intelligence_digest FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_digest_update_editor ON public.intelligence_digest;
CREATE POLICY intelligence_digest_update_editor
  ON public.intelligence_digest FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_digest_delete_admin ON public.intelligence_digest;
CREATE POLICY intelligence_digest_delete_admin
  ON public.intelligence_digest FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

GRANT SELECT ON public.intelligence_digest TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_digest TO authenticated;
