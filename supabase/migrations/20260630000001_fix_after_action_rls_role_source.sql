-- after_action_records RLS: resolve the app role from public.users, not the JWT.
--
-- hybrid_access_after_actions gated writes on a CASE over (auth.jwt() ->> 'role'),
-- but the app's Supabase JWTs carry role='authenticated' (no custom app-role claim),
-- so every branch fell through to ELSE false → the policy was unsatisfiable for
-- everyone and after_action_records could never be written (0 rows ever created).
-- Resolve the real role from public.users (the canonical authz source, same pattern
-- as the aa_commitments INSERT policy), preserving the original intent: dossier
-- owners who are admin/supervisor get full access; staff only on draft/edit_requested.

DROP POLICY IF EXISTS hybrid_access_after_actions ON public.after_action_records;
CREATE POLICY hybrid_access_after_actions ON public.after_action_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossier_owners o
      WHERE o.dossier_id = after_action_records.dossier_id
        AND o.user_id = auth.uid()
    )
    AND (
      EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','supervisor'))
      OR (
        publication_status = ANY (ARRAY['draft','edit_requested'])
        AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'staff')
      )
    )
  );
