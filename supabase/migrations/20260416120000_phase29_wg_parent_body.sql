-- Phase 29: Working Group parent body link (WG-02, D-09, A-04)
-- Adds an optional FK from working_groups to the dossier that owns/hosts it.
-- The target is dossiers(id) rather than organizations(id) because the wizard's
-- DossierPicker returns a dossier row; all 8 dossier types share the dossiers PK.

ALTER TABLE public.working_groups
  ADD COLUMN IF NOT EXISTS parent_body_id UUID NULL
    REFERENCES public.dossiers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.working_groups.parent_body_id IS
  'Organization dossier that owns/hosts this working group (Phase 29)';

CREATE INDEX IF NOT EXISTS idx_working_groups_parent_body_id
  ON public.working_groups(parent_body_id)
  WHERE parent_body_id IS NOT NULL;
