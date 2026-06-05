-- work_item_dossiers: auto-sync commitment home links (+ index hygiene)
--
-- Follow-up to 20260605073000 (overdue-commitment-triage).
--
-- NOTE on uniqueness: a partial unique index already exists ——
--   idx_work_item_dossiers_unique_active
--   (work_item_type, work_item_id, dossier_id) WHERE deleted_at IS NULL
-- so the edge function's 23505 (DUPLICATE_LINK) handler is already backed and no
-- new uniqueness needs to be added. (An earlier draft of this migration created a
-- duplicate `work_item_dossiers_unique_active`; the DROP below removes it so a
-- fresh `db push`/reset converges to a single unique index.)
--
-- Real change: the UI create path writes the junction, but non-UI inserts of
-- aa_commitments (e.g. backend after-action extraction) do not, so commitments
-- created that way show "No dossiers linked". A trigger keeps the home-dossier
-- link in sync for ALL write paths.

BEGIN;

-- Index hygiene: remove the redundant duplicate (idx_work_item_dossiers_unique_active
-- already enforces this). Safe no-op if it was never created.
DROP INDEX IF EXISTS public.work_item_dossiers_unique_active;

-- Sync trigger: maintain the 'direct' home-dossier junction link for any
-- aa_commitments row that has a dossier_id. SECURITY DEFINER so it runs as the
-- table owner (bypasses RLS for the internal bookkeeping insert). Idempotent via
-- ON CONFLICT against the existing partial unique index idx_work_item_dossiers_unique_active.
CREATE OR REPLACE FUNCTION public.sync_commitment_dossier_link()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_creator uuid;
BEGIN
  -- Nothing to link, or the commitment is soft-deleted.
  IF NEW.dossier_id IS NULL OR NEW.is_deleted THEN
    RETURN NEW;
  END IF;

  -- work_item_dossiers.created_by is NOT NULL; resolve an attributable user.
  v_creator := COALESCE(NEW.owner_user_id, NEW.created_by);
  IF v_creator IS NULL THEN
    RETURN NEW; -- no attributable creator (e.g. external-owner with no creator) — skip
  END IF;

  INSERT INTO public.work_item_dossiers (
    work_item_type,
    work_item_id,
    dossier_id,
    inheritance_source,
    inheritance_path,
    display_order,
    is_primary,
    created_by,
    updated_by
  )
  VALUES (
    'commitment',
    NEW.id,
    NEW.dossier_id,
    'direct',
    '[]'::jsonb,
    0,
    NOT EXISTS (
      SELECT 1
      FROM public.work_item_dossiers w
      WHERE w.work_item_type = 'commitment'
        AND w.work_item_id = NEW.id
        AND w.is_primary
        AND w.deleted_at IS NULL
    ),
    v_creator,
    v_creator
  )
  ON CONFLICT (work_item_type, work_item_id, dossier_id) WHERE deleted_at IS NULL
  DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_commitment_dossier_link ON public.aa_commitments;
CREATE TRIGGER sync_commitment_dossier_link
  AFTER INSERT OR UPDATE OF dossier_id ON public.aa_commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_commitment_dossier_link();

COMMIT;
