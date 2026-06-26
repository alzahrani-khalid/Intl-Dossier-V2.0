-- SEC-BE-19 (corrected) — dossiers SELECT clearance gate.
--
-- ORIGINAL BUG: this file's all-9s version (99999999999999) sorts LAST on a fresh
-- `supabase db reset`, so on replay it became the FINAL dossiers SELECT policy and
-- (1) dropped the canonical clearance gate, (2) compared the INTEGER
-- `dossiers.sensitivity_level` against TEXT literals 'low'/'medium' (Postgres 42804
-- at evaluation / at best a flat low+medium grant), and (3) read `user_roles`.
-- On live the canonical "within clearance" policy is in force (this body never
-- fully took effect), so this correction primarily affects fresh replays — bringing
-- them in line with the canonical integer / get_user_clearance_level form
-- (see 20260614000001_p68_clearance_canonical.sql and 20260627000008).

DROP POLICY IF EXISTS "view_dossiers_by_clearance" ON dossiers;
DROP POLICY IF EXISTS "view_dossiers_authenticated" ON dossiers;

CREATE POLICY "view_dossiers_authenticated"
ON dossiers FOR SELECT
TO authenticated
USING (
  sensitivity_level <= public.get_user_clearance_level(auth.uid())
);
