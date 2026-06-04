-- calendar_entries had RLS enabled but NO SELECT policy, so the grid
-- (calendar-get, which runs under the user's JWT) returned zero rows; only the
-- SECURITY DEFINER get_upcoming_events RPC could read entries. Without this a
-- user's own created calendar entry is invisible in the calendar grid.
--
-- This SELECT policy mirrors the operational ownership model already used by the
-- INSERT/UPDATE/DELETE policies (organizer_id = auth.uid()) and adds creator +
-- attendee access, plus dossier clearance (matching the calendar_events model:
-- profiles.user_id = auth.uid(), sensitivity_level <= clearance_level) so
-- dossier-linked entries are visible to anyone cleared for that dossier.
DROP POLICY IF EXISTS "calendar_entries_select_policy" ON public.calendar_entries;
CREATE POLICY "calendar_entries_select_policy"
ON public.calendar_entries
FOR SELECT
TO public
USING (
  organizer_id = auth.uid()
  OR created_by = auth.uid()
  OR auth.uid() = ANY (COALESCE(attendee_ids, ARRAY[]::uuid[]))
  OR (
    dossier_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.dossiers d
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE d.id = calendar_entries.dossier_id
        AND d.sensitivity_level <= p.clearance_level
    )
  )
);
