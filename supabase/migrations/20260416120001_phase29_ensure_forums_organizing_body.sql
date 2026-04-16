-- Phase 29: Ensure forums.organizing_body exists (FORUM-02, D-09, A-05)
-- Research could not confirm whether the column is present in the live staging DB.
-- This migration is a safety net — it adds the column + FK + index ONLY if missing.
-- Idempotent: safe to replay.

DO $MIG$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'forums'
      AND column_name = 'organizing_body'
  ) THEN
    ALTER TABLE public.forums
      ADD COLUMN organizing_body UUID NULL
        REFERENCES public.organizations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_forums_organizing_body
      ON public.forums(organizing_body)
      WHERE organizing_body IS NOT NULL;

    COMMENT ON COLUMN public.forums.organizing_body IS
      'Organization that organizes this forum (Phase 29, conditional backfill)';
  END IF;
END
$MIG$;
