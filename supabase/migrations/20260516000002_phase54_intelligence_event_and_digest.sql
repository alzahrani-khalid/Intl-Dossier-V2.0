-- Phase 54 plan 02: v7.0 Intelligence Engine schema groundwork
-- Source patterns: 20260507210000_phase45_intelligence_digest_seed.sql L8-67
-- (verbatim 4-policy RLS template + idempotent table+index pattern)
-- Requirements: INTEL-01 (intelligence_event), INTEL-02 (new intelligence_digest),
--               INTEL-04 (signal_source_type enum)
-- Decisions:
--   D-04 — table named intelligence_event (NOT intelligence_signal — avoids collision
--          with existing curated intelligence_signals plural table)
--   D-08 — tenant column is organization_id (NOT tenant_id)
--   D-09 — enum keeps spec name signal_source_type even though table is intelligence_event
--   D-10 — enum has exactly 4 values: publication, feed, human_entered, ai_generated
--   D-11 — severity reuses work-item Priority vocabulary (low/medium/high/urgent)
--   D-12 — verbatim Phase-45 four-policy RLS (DELETE helper-only per Pitfall 6)
--   D-15 — applied via Supabase MCP apply_migration (NOT local CLI)

-- =============================================================================
-- 1. signal_source_type enum (INTEL-04)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_source_type') THEN
    CREATE TYPE public.signal_source_type AS ENUM (
      'publication',
      'feed',
      'human_entered',
      'ai_generated'
    );
  END IF;
END$$;

-- =============================================================================
-- 2. intelligence_event raw-ingest table (INTEL-01)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type public.signal_source_type NOT NULL,
  source_ref TEXT,
  content TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_occurred_at
  ON public.intelligence_event (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_severity
  ON public.intelligence_event (organization_id, severity)
  WHERE severity IN ('high', 'urgent');
CREATE INDEX IF NOT EXISTS idx_intelligence_event_source_type
  ON public.intelligence_event (source_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_created_by
  ON public.intelligence_event (created_by)
  WHERE created_by IS NOT NULL;

ALTER TABLE public.intelligence_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
CREATE POLICY intelligence_event_select_org
  ON public.intelligence_event FOR SELECT
  TO authenticated
  USING (tenant_isolation.rls_select_policy(organization_id));

DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_insert_editor
  ON public.intelligence_event FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_update_editor
  ON public.intelligence_event FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;
CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

GRANT SELECT ON public.intelligence_event TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event TO authenticated;

COMMENT ON TABLE public.intelligence_event IS
  'Phase 54: v7.0 Intelligence Engine raw ingest layer. Renamed from spec '
  '''intelligence_signal'' to avoid collision with existing curated '
  'intelligence_signals (plural) table. Tenant-scoped via organization_id; '
  'RLS mirrors Phase-45 intelligence_digest pattern.';

-- =============================================================================
-- 3. intelligence_digest period-bounded per-dossier digest table (INTEL-02)
--    NOTE: the Phase-45 intelligence_digest was renamed to dashboard_digest
--    in plan 54-01, freeing this canonical name for the v7.0 spec shape.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL CHECK (period_end > period_start),
  summary TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_org_dossier_period
  ON public.intelligence_digest (organization_id, dossier_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_dossier_type
  ON public.intelligence_digest (dossier_type);

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

COMMENT ON TABLE public.intelligence_digest IS
  'Phase 54: v7.0 spec-compliant period-bounded per-dossier digest. New table — '
  'the prior Phase-45 intelligence_digest was renamed to dashboard_digest in '
  'plan 54-01. Tenant-scoped via organization_id; RLS mirrors Phase-45 pattern.';
