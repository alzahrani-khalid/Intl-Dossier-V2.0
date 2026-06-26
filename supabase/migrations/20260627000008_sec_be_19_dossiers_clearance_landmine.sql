-- SEC-BE-19 (LOW) — neutralize the 99999999999999_fix_dossier_rls.sql landmine.
--
-- That file (all-9s version -> sorts LAST) drops the canonical clearance gate and
-- recreates the dossiers SELECT policy "view_dossiers_authenticated" as
--   USING (sensitivity_level IN ('low','medium') OR <user_roles lookup>)
-- comparing the now-INTEGER dossiers.sensitivity_level against TEXT literals.
--
-- This migration drops + rewrites that policy into the canonical integer /
-- get_user_clearance_level form. On live staging the landmine policy is not
-- present (the canonical "Users can view dossiers within clearance" policy is in
-- force), so the DROP is a no-op and the CREATE adds an equivalent clearance gate
-- (redundant but harmless — RLS SELECT policies are OR-combined and both express
-- the same predicate).
--
-- REPLAY CAVEAT (documented as a HANDOFF in the fix-report): an additive
-- migration CANNOT be ordered AFTER an all-9s version — the '_' following the 14
-- nines outranks any digit, and matching the prefix collides on the version. So a
-- pristine `supabase db reset` still applies 99999999999999_fix_dossier_rls.sql
-- LAST and re-introduces the broken policy (and now errors on the type mismatch /
-- name collision). The only complete fix is to delete or correct that existing
-- file directly, which is outside the DBSEC lane's file ownership.

DROP POLICY IF EXISTS "view_dossiers_authenticated" ON dossiers;
CREATE POLICY "view_dossiers_authenticated"
  ON dossiers
  FOR SELECT
  TO authenticated
  USING (sensitivity_level <= public.get_user_clearance_level(auth.uid()));
