-- Phase 54 plan 03: intelligence_event_dossiers polymorphic junction (INTEL-03)
-- Source patterns:
--   * Table shape: 20260116500001_create_work_item_dossiers.sql L11-57
--   * RLS pattern: invented per D-13 + 54-RESEARCH § Pattern 2 (EXISTS-via-parent)
-- Decisions:
--   D-05 — junction named intelligence_event_dossiers (NOT _signal_)
--   D-06 — dossier_type CHECK enforces exactly 7 canonical values
--          (country|organization|forum|engagement|topic|working_group|person);
--          the now-removed government-contact type was merged into person in
--          Phase 50; this CHECK rejects it.
--   D-13 — tenancy is parent-derived: EXISTS-on-parent RLS gates by
--          intelligence_event.organization_id. The junction intentionally
--          has NO organization_id column of its own (single source of truth).
--   D-15 — applied via Supabase MCP apply_migration (NOT local CLI)

CREATE TABLE IF NOT EXISTS public.intelligence_event_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.intelligence_event(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_unique
  ON public.intelligence_event_dossiers (event_id, dossier_type, dossier_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_dossier
  ON public.intelligence_event_dossiers (dossier_type, dossier_id);

ALTER TABLE public.intelligence_event_dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_delete ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_delete
  ON public.intelligence_event_dossiers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_delete_policy(ie.organization_id)
    )
  );

GRANT SELECT ON public.intelligence_event_dossiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event_dossiers TO authenticated;

COMMENT ON TABLE public.intelligence_event_dossiers IS
  'Phase 54: polymorphic many-to-many junction linking intelligence_event rows '
  'to any of the 7 canonical dossier types. Tenancy derived from parent '
  'intelligence_event.organization_id via EXISTS in RLS (D-13) — junction '
  'intentionally has NO organization_id column of its own. ON DELETE CASCADE '
  'on both FKs.';
