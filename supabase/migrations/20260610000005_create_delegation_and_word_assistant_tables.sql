-- position_delegations + word_assistant_logs (approvals #6 / wa #4): tables matching the
-- edge-fn write shapes + owner-scoped RLS.
-- Neither table exists in any repo migration NOR live on staging (42P01), so:
--   * supabase/functions/positions-delegate/index.ts falls back to writing into position
--     metadata instead of its primary insert path (lines 178-189 insert; 192-194 42P01
--     fallback).
--   * supabase/functions/word-assistant/index.ts silently no-ops its usage log insert
--     (lines 255-264).
-- Fix: create both tables with exactly the columns their edge functions write, plus
-- owner-scoped RLS so callers can only read/insert their own rows.
-- Verified live (project zkrcjzdemdmwhearhfgg, 2026-06-10): positions.id EXISTS (FK kept),
-- position_delegations MISSING, word_assistant_logs MISSING.
-- Applied 2026-06-10.

BEGIN;

-- position_delegations — shape from positions-delegate/index.ts (insert at lines 178-189,
-- existence query at 159-165: .eq(position_id).eq(delegate_id).eq(status,'active')).
CREATE TABLE IF NOT EXISTS public.position_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  delegator_id UUID NOT NULL REFERENCES auth.users(id),
  delegate_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_position_delegations_lookup
  ON public.position_delegations(position_id, delegate_id, status);

COMMENT ON TABLE public.position_delegations IS 'Position delegation records (positions-delegate edge fn primary write path)';

-- word_assistant_logs — shape from word-assistant/index.ts (insert at lines 255-264).
CREATE TABLE IF NOT EXISTS public.word_assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  input_text TEXT,
  output_text TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_word_assistant_logs_user
  ON public.word_assistant_logs(user_id, created_at);

COMMENT ON TABLE public.word_assistant_logs IS 'Word-assistant usage logs (word-assistant edge fn usage-log write path)';

-- This staging DB has a public-schema DEFAULT PRIVILEGE (pg_default_acl) that auto-grants
-- ALL to anon/authenticated/service_role on every new relation. Explicitly REVOKE ALL
-- from anon on both tables (RLS still governs authenticated).
REVOKE ALL ON public.position_delegations FROM anon;
REVOKE ALL ON public.word_assistant_logs FROM anon;

-- Owner-scoped RLS.
ALTER TABLE public.position_delegations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "position_delegations_select_policy" ON public.position_delegations;
CREATE POLICY "position_delegations_select_policy"
ON public.position_delegations
FOR SELECT
TO authenticated
USING (delegator_id = auth.uid() OR delegate_id = auth.uid());

DROP POLICY IF EXISTS "position_delegations_insert_policy" ON public.position_delegations;
CREATE POLICY "position_delegations_insert_policy"
ON public.position_delegations
FOR INSERT
TO authenticated
WITH CHECK (delegator_id = auth.uid());

ALTER TABLE public.word_assistant_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "word_assistant_logs_select_policy" ON public.word_assistant_logs;
CREATE POLICY "word_assistant_logs_select_policy"
ON public.word_assistant_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "word_assistant_logs_insert_policy" ON public.word_assistant_logs;
CREATE POLICY "word_assistant_logs_insert_policy"
ON public.word_assistant_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

COMMIT;
