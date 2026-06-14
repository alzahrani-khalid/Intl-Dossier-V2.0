-- Phase 69: Extend intelligence_event for structured signals
-- Apply via Supabase MCP to project zkrcjzdemdmwhearhfgg
-- Requirements: SIGNAL-01..06
-- Source patterns:
--   * ALTER/index/RLS template: 20260516000002_phase54_intelligence_event_and_digest.sql
--   * Junction baseline: 20260516000003_phase54_intelligence_event_dossiers.sql
--   * Canonical clearance expression: 20251022000009_update_polymorphic_refs.sql (L102/119)
-- Decisions:
--   D-03 — add status column (new/acknowledged/dismissed/escalated) lean lifecycle
--   D-05 — LOOSEN RLS from admin/editor-only to any-cleared-user
--          (sensitivity_level <= clearance_level), role-agnostic capture + triage
--   D-06 — extend intelligence_event in place with title/sensitivity_level/status
--   D-07 — fixed category enum (political/economic/security/diplomatic/other)
--   D-08 — ai_confidence column (NUMERIC(3,2) 0.00-1.00; null for manual)
--   D-09 — single-language free-text title/body (no title_en/title_ar/language column)
--   D-14 — read_signals SECURITY INVOKER RPC

-- =============================================================================
-- 1. Add columns to intelligence_event (idempotent ADD COLUMN IF NOT EXISTS)
-- =============================================================================
ALTER TABLE public.intelligence_event
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sensitivity_level INTEGER NOT NULL DEFAULT 1
    CHECK (sensitivity_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'acknowledged', 'dismissed', 'escalated')),
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('political', 'economic', 'security', 'diplomatic', 'other')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2)
    CHECK (ai_confidence IS NULL OR (ai_confidence >= 0.00 AND ai_confidence <= 1.00)),
  ADD COLUMN IF NOT EXISTS escalated_task_id UUID
    REFERENCES public.tasks(id) ON DELETE SET NULL;

-- =============================================================================
-- 2. Indexes for triage queue performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_intelligence_event_status
  ON public.intelligence_event (organization_id, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_sensitivity
  ON public.intelligence_event (organization_id, sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_category
  ON public.intelligence_event (organization_id, category)
  WHERE category IS NOT NULL;

-- =============================================================================
-- 3. RLS: replace role-locked policies with clearance-keyed policies (RF-2)
-- =============================================================================

-- intelligence_event — drop the 4 role-locked policies first (idempotent)
DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;

-- SELECT: tenant-scoped + clearance-gated (indistinguishable empty on denial)
CREATE POLICY intelligence_event_select_clearance
  ON public.intelligence_event FOR SELECT TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

-- INSERT: any cleared user (D-05) — can create signals at/below their clearance
CREATE POLICY intelligence_event_insert_cleared
  ON public.intelligence_event FOR INSERT TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- UPDATE: same-clearance triage (status/category changes); clearance in both clauses
CREATE POLICY intelligence_event_update_cleared
  ON public.intelligence_event FOR UPDATE TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

-- DELETE: admin-only (unchanged intent — no need to loosen deletes)
CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

-- intelligence_event_dossiers — loosen from role-locked to clearance-keyed via EXISTS-on-parent
DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;

CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

-- =============================================================================
-- 4. read_signals SECURITY INVOKER RPC (RF-5 / D-14)
--    CRITICAL: source_type::text cast is MANDATORY — the column is the
--    signal_source_type enum; omitting the cast raises 42804 at runtime.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.read_signals(
  p_dossier_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  sensitivity_level INTEGER,
  severity TEXT,
  category TEXT,
  source_type TEXT,
  source_ref TEXT,
  ai_confidence NUMERIC,
  status TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  created_by UUID,
  escalated_task_id UUID,
  organization_id UUID
)
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT
    ie.id,
    ie.title,
    ie.content,
    ie.sensitivity_level,
    ie.severity,
    ie.category,
    ie.source_type::text,
    ie.source_ref,
    ie.ai_confidence,
    ie.status,
    ie.occurred_at,
    ie.created_at,
    ie.created_by,
    ie.escalated_task_id,
    ie.organization_id
  FROM public.intelligence_event ie
  WHERE
    (p_dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM public.intelligence_event_dossiers ied
      WHERE ied.event_id = ie.id AND ied.dossier_id = p_dossier_id
    ))
    AND (p_status IS NULL OR ie.status = p_status)
    AND (p_since IS NULL OR ie.occurred_at >= p_since)
  ORDER BY ie.occurred_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.read_signals TO authenticated;

COMMENT ON FUNCTION public.read_signals IS
  'Phase 69: Clearance-gated signal read tool. SECURITY INVOKER — RLS on
   intelligence_event enforces sensitivity_level <= caller clearance_level.
   p_dossier_id: filter to one dossier via intelligence_event_dossiers junction.
   Returns empty (indistinguishable) when no signals meet clearance threshold.';
