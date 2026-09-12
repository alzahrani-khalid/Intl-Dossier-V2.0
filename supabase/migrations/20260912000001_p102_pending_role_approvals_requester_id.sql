-- P102-07: align public.pending_role_approvals with what the deployed assign-role
-- (and approve-role-change) edge functions actually write and read.
--
-- Root cause of the user-management admin-grant 500 (APPROVAL_CREATION_FAILED ->
-- 'Failed to save user data'), captured live on staging zkrcjzdemdmwhearhfgg
-- 2026-09-11T23:26Z:
--   1. assign-role inserts `requester_id`; the table (20251011214943, applied via
--      20260610000004) names that column `requested_by`. PostgREST answers
--      PGRST204 "Could not find the 'requester_id' column of
--      'pending_role_approvals' in the schema cache".
--   2. assign-role inserts `reason: body.reason || null` and the UI never sends a
--      reason, but the column is NOT NULL: 23502 "null value in column \"reason\"
--      of relation \"pending_role_approvals\" violates not-null constraint".
-- The function sources are outside this task's write scope, so the table moves to
-- the functions: add `requester_id` as a real PostgREST-writable column, keep
-- `requested_by` (deactivate-user reads it) and sync the two in a BEFORE trigger,
-- and drop the NOT NULL on `reason`. chk_approval_not_self keeps holding because
-- the trigger fills requested_by before CHECK evaluation.

BEGIN;

ALTER TABLE public.pending_role_approvals
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id);

ALTER TABLE public.pending_role_approvals
  ALTER COLUMN reason DROP NOT NULL;

-- Backfill the canonical column into the new one for any pre-existing rows.
UPDATE public.pending_role_approvals
  SET requester_id = requested_by
  WHERE requester_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_pending_role_approvals_requester()
RETURNS TRIGGER AS $$
BEGIN
  NEW.requester_id := COALESCE(NEW.requester_id, NEW.requested_by);
  NEW.requested_by := COALESCE(NEW.requested_by, NEW.requester_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_pending_role_approvals_requester ON public.pending_role_approvals;
CREATE TRIGGER trg_sync_pending_role_approvals_requester
  BEFORE INSERT OR UPDATE ON public.pending_role_approvals
  FOR EACH ROW EXECUTE FUNCTION public.sync_pending_role_approvals_requester();

COMMIT;
