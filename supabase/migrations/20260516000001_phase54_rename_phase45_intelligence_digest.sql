-- Phase 54 plan 1: free the canonical name for the v7.0 spec
-- Renames the Phase-45 dashboard-headline-feed table out of the way so the
-- new v7.0 spec-compliant `intelligence_digest` (period-bounded per-dossier
-- digest, created in plan 54-02) can claim the canonical name without
-- colliding on SQLSTATE 42P07.
--
-- Postgres semantics: policies, indexes, FKs, GRANTs, and triggers follow
-- the table on ALTER TABLE ... RENAME automatically. The ALTER INDEX and
-- ALTER POLICY statements below are clarity-only renames so the post-rename
-- object names match the new table name. The PK index is renamed explicitly
-- because the auto-generated `<table>_pkey` constraint name does NOT follow
-- ALTER TABLE...RENAME, and would collide with plan 54-02's new
-- intelligence_digest PK constraint.
--
-- D-03: The historical Phase-45 migration (20260507210000_*) is NOT edited.
-- D-15: Applied via Supabase MCP `apply_migration` against staging
-- (zkrcjzdemdmwhearhfgg), NOT via local CLI.

ALTER TABLE IF EXISTS public.intelligence_digest RENAME TO dashboard_digest;

-- Rename the secondary indexes for clarity
ALTER INDEX IF EXISTS public.idx_intelligence_digest_org_occurred_at
  RENAME TO idx_dashboard_digest_org_occurred_at;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_dossier
  RENAME TO idx_dashboard_digest_dossier;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_source_publication
  RENAME TO idx_dashboard_digest_source_publication;

-- Rename the PK index/constraint so plan 54-02's new intelligence_digest
-- can claim the default `intelligence_digest_pkey` name without collision.
ALTER INDEX IF EXISTS public.intelligence_digest_pkey
  RENAME TO dashboard_digest_pkey;

-- Rename the RLS policies for clarity
ALTER POLICY intelligence_digest_select_org ON public.dashboard_digest
  RENAME TO dashboard_digest_select_org;
ALTER POLICY intelligence_digest_insert_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_insert_editor;
ALTER POLICY intelligence_digest_update_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_update_editor;
ALTER POLICY intelligence_digest_delete_admin ON public.dashboard_digest
  RENAME TO dashboard_digest_delete_admin;

COMMENT ON TABLE public.dashboard_digest IS
  'Dashboard headline feed (Phase 45). Renamed from intelligence_digest in Phase 54 '
  'to free the canonical name for the v7.0 spec-compliant intelligence_digest.';
