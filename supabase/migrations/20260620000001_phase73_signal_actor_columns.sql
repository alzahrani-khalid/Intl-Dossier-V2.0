-- Phase 73 (Plan 01, Task 1): Signal status-change actor columns (D-06)
-- Apply via Supabase MCP to project zkrcjzdemdmwhearhfgg (staging).
-- Requirements: GENUI-03 (#2 actor_id == auth.uid() must be verifiable for signal writes)
--
-- Source of truth this extends:
--   * 20260614_phase69_signals_extend.sql — added status TEXT
--     CHECK (status IN ('new','acknowledged','dismissed','escalated')),
--     and the UPDATE RLS `intelligence_event_update_cleared` (clearance both clauses).
--
-- WHY: intelligence_event records `status` but NOT who changed it. The P73 frontend
-- approve-handler (73-03) writes the matching `*_by` column + `status_changed_at` in
-- the SAME caller-JWT UPDATE that flips `status`, so a dismiss/escalate write records a
-- verifiable actor_id == auth.uid(). The existing `intelligence_event_update_cleared`
-- UPDATE RLS already authorizes that UPDATE — NO policy change is needed here.
--
-- INVARIANTS (do NOT violate):
--   * No status CHECK change. No existing RLS policy touched. No DEFINER object touched.
--   * status_changed_at is nullable with NO default — existing rows stay NULL rather than
--     claiming a false transition time; the writer sets it at status-change time.

-- =============================================================================
-- 1. Actor + timestamp columns (idempotent ADD COLUMN IF NOT EXISTS)
-- =============================================================================
ALTER TABLE public.intelligence_event
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dismissed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escalated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

-- =============================================================================
-- 2. Partial index for "recently triaged" queue reads
--    (mirrors the idx naming/shape in the P69 extend migration)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_intelligence_event_status_changed_at
  ON public.intelligence_event (organization_id, status_changed_at DESC)
  WHERE status_changed_at IS NOT NULL;

-- =============================================================================
-- 3. Documentation
-- =============================================================================
COMMENT ON COLUMN public.intelligence_event.acknowledged_by IS
  'Phase 73 (D-06): auth.uid() of the user who set status=acknowledged. NULL until acknowledged.';
COMMENT ON COLUMN public.intelligence_event.dismissed_by IS
  'Phase 73 (D-06): auth.uid() of the user who set status=dismissed. NULL until dismissed. Reversible — reset on un-dismiss.';
COMMENT ON COLUMN public.intelligence_event.escalated_by IS
  'Phase 73 (D-06): auth.uid() of the user who set status=escalated. NULL until escalated.';
COMMENT ON COLUMN public.intelligence_event.status_changed_at IS
  'Phase 73 (D-06): timestamptz of the last status transition. Nullable, no default — set by the caller-JWT UPDATE; existing rows stay NULL (no false transition time).';
