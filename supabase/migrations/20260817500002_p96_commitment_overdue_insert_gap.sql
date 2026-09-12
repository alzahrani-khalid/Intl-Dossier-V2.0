-- Phase 96 (COUNT-04) — close the aa_commitments overdue INSERT gap.
--
-- Defect: `commitment_overdue_check` is BEFORE UPDATE only, so a commitment INSERTed already
-- past its due_date is stored as `pending` and never coerced. Two such rows sit on staging
-- (REQUIREMENTS.md:128; re-derived live 2026-08-17 — see POPULATION below).
--
-- The trigger NAME is unchanged on purpose: BEFORE triggers fire in alphabetical order, and
-- `commitment_overdue_check` < `commitment_status_audit` is load-bearing (D-08). The audit
-- therefore reads the REWRITTEN status by design — `commitment_status_history` records what the
-- DB decided, NEVER what the user asked, and is never read as user-intent evidence.
--
-- was: (live catalog, staging zkrcjzdemdmwhearhfgg, 2026-08-17)
--   CREATE TRIGGER commitment_overdue_check BEFORE UPDATE ON public.aa_commitments
--     FOR EACH ROW EXECUTE FUNCTION check_commitment_overdue()
--
-- was: prosrc of public.check_commitment_overdue() — pulled verbatim from pg_proc before
-- authoring (A1, 96-RESEARCH Assumptions Log). CONFIRMED INSERT-SAFE: the body references only
-- NEW, never OLD, so no body change and no TG_OP guard is required by the re-timing.
--   CREATE OR REPLACE FUNCTION public.check_commitment_overdue()
--    RETURNS trigger
--    LANGUAGE plpgsql
--   AS $function$
--   BEGIN
--     -- If commitment is past due date and status is pending or in_progress, mark as overdue
--     IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
--       NEW.status := 'overdue';
--       NEW.updated_at := NOW();
--     -- If commitment was overdue but due_date has been extended, revert to in_progress
--     ELSIF NEW.status = 'overdue' AND NEW.due_date >= CURRENT_DATE THEN
--       NEW.status := 'in_progress';
--       NEW.updated_at := NOW();
--     END IF;
--     RETURN NEW;
--   END;
--   $function$
--
-- The bidirectional ELSIF stays: extending a due date still reverts overdue -> in_progress.
-- `aa_commitments`' five-value lifecycle (pending/in_progress/completed/cancelled/overdue) is
-- NOT renamed (CLAUDE.md carve-out, D-22).
--
-- WINNING NOTION (RULING-P96-01 condition 3): for COMMITMENTS, on every surface, the STORED
-- `aa_commitments.status = 'overdue'` wins. After this migration the trigger is authoritative
-- at INSERT time as well as on every UPDATE. Its companion migration
-- 20260817500003_p96_rpc_count_truth.sql re-points `get_commitment_fulfillment`'s overdue bucket
-- to the stored status — WITHOUT it this fix would silently drive that chart series to 0 forever
-- (the old bucket counts only past-due pending/in_progress, a class this migration empties).
--
-- POPULATION DEFINITION for the data touch (D-15): rows with `status = 'pending' AND due_date <
-- CURRENT_DATE` at apply time — 2 rows at derivation time (2026-08-17 live catalog: overdue 8 /
-- all past-due, pending 2 / all past-due). That count is a FLOOR re-derived at apply, never
-- asserted from the register. FALLS OUTSIDE this population: rows already stored `overdue`
-- (nothing to do); `in_progress` past-due rows (none at derivation time — the same UPDATE would
-- coerce them, so the predicate is deliberately narrowed to the named defect class); rows whose
-- due_date passes LATER with no write (previously the permanent gap — now covered at INSERT and
-- on every UPDATE); `completed` / `cancelled` rows (terminal, never coerced by the function).
--
-- DECISION on the existing rows (96-RESEARCH Pitfall 3): they ARE migrated here, by a
-- touch-UPDATE that changes no user-authored column. The trigger performs the actual coercion —
-- this migration never writes a status literal.

DROP TRIGGER IF EXISTS commitment_overdue_check ON public.aa_commitments;

CREATE TRIGGER commitment_overdue_check
  BEFORE INSERT OR UPDATE ON public.aa_commitments
  FOR EACH ROW EXECUTE FUNCTION public.check_commitment_overdue();

-- Coerce the existing past-due pending rows (POPULATION above). No status literal is written:
-- the touch fires commitment_overdue_check, which rewrites NEW.status.
UPDATE public.aa_commitments
SET updated_at = updated_at
WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
