-- Fix calendar_events RLS clearance predicate.
--
-- Both the INSERT and SELECT policies filtered the clearance subquery on
-- `WHERE dossiers.id = auth.uid()` (a dossier id compared to a user id) instead
-- of `WHERE profiles.user_id = auth.uid()`. That subquery matched zero rows and
-- returned NULL, so `sensitivity_level <= NULL` was never true: NO row could be
-- inserted (every create 42501 -> 403) and NO row was visible (reads hidden).
-- calendar_events had 0 rows as a result.
--
-- This mirrors the working `dossiers` clearance policies. Logic is otherwise
-- identical (same TO public, same EXISTS-over-dossiers / sensitivity check);
-- only the subquery's WHERE clause is corrected.

DROP POLICY IF EXISTS "Users can view calendar events within clearance" ON calendar_events;
CREATE POLICY "Users can view calendar events within clearance"
  ON calendar_events
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM dossiers
      WHERE dossiers.id = calendar_events.dossier_id
        AND dossiers.sensitivity_level <= (
          SELECT COALESCE(profiles.clearance_level, 1)
          FROM profiles
          WHERE profiles.user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Users can create calendar events within clearance" ON calendar_events;
CREATE POLICY "Users can create calendar events within clearance"
  ON calendar_events
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dossiers
      WHERE dossiers.id = calendar_events.dossier_id
        AND dossiers.sensitivity_level <= (
          SELECT COALESCE(profiles.clearance_level, 1)
          FROM profiles
          WHERE profiles.user_id = auth.uid()
        )
    )
  );
