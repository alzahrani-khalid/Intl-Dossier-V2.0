-- Fix position_dossier_links RLS clearance subquery (R12-10, 2026-06-10)
--
-- The INSERT/SELECT policies resolved the current user's clearance with a
-- correlated subquery keyed on `dossiers.id = auth.uid()` — comparing a dossier
-- UUID to a user UUID, which never matches. The subquery therefore always
-- returned NULL and COALESCE fell back to clearance 1, collapsing the gate to
-- `dossiers.sensitivity_level <= 1` for EVERY user regardless of actual
-- clearance. Effect: attaching a position to (or viewing links on) any dossier
-- with sensitivity_level > 1 was blocked for all users — 20 of 35 staging
-- dossiers. The DELETE policy had the same class of typo
-- (`position_dossier_links.id = auth.uid()`).
--
-- Correct correlation is `profiles.user_id = auth.uid()` (profiles is keyed by
-- user_id; clearance_level lives there). This restores the intended
-- clearance-gated behavior without widening it beyond design.

DROP POLICY IF EXISTS "Users can create position links within clearance" ON position_dossier_links;
CREATE POLICY "Users can create position links within clearance"
  ON position_dossier_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM positions WHERE positions.id = position_dossier_links.position_id
    )
    AND EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = position_dossier_links.dossier_id
        AND dossiers.sensitivity_level <= COALESCE(
          (SELECT profiles.clearance_level FROM profiles WHERE profiles.user_id = auth.uid()),
          1
        )
    )
  );

DROP POLICY IF EXISTS "Users can view position links within clearance" ON position_dossier_links;
CREATE POLICY "Users can view position links within clearance"
  ON position_dossier_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM positions WHERE positions.id = position_dossier_links.position_id
    )
    AND EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = position_dossier_links.dossier_id
        AND dossiers.sensitivity_level <= COALESCE(
          (SELECT profiles.clearance_level FROM profiles WHERE profiles.user_id = auth.uid()),
          1
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete their position links" ON position_dossier_links;
CREATE POLICY "Users can delete their position links"
  ON position_dossier_links
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.clearance_level >= 3
    )
  );
