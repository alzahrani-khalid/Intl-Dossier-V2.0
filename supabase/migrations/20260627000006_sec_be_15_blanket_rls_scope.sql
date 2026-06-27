-- SEC-BE-15 (LOW) — blanket USING/WITH CHECK(true) on workflow tables.
--
-- This lane fixes the genuine write/tamper holes without over-restricting reads
-- that are staff-wide BY DESIGN (see the accepted-reads note at the bottom). The
-- project constraint is "no regressions", and several of these tables hang off
-- `positions`, whose live SELECT policy (positions_authenticated_read) is itself
-- USING(true) — scoping their reads tighter than the parent would break version /
-- consistency / audience reads that currently work.

-- position_versions: was FOR INSERT (role public) WITH CHECK(true) — any user
-- could forge a version row attributed to any author. No DB trigger/function
-- inserts versions; the app writes them (service_role bypasses RLS). Require the
-- row to be attributed to the inserting user.
DROP POLICY IF EXISTS "system_insert_versions" ON position_versions;
CREATE POLICY "system_insert_versions"
  ON position_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- working_group_member_suggestions: was INSERT/UPDATE WITH CHECK/USING(true) —
-- any user could write suggestions for any working group. Scope writes to working
-- groups the user can access, mirroring the table's existing (already-scoped)
-- SELECT policy.
DROP POLICY IF EXISTS "Users can insert suggestions" ON working_group_member_suggestions;
CREATE POLICY "Users can insert suggestions"
  ON working_group_member_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM working_groups wg
      JOIN dossiers d ON d.id = wg.id
      WHERE wg.id = working_group_member_suggestions.working_group_id
        AND d.status <> 'archived'
    )
  );

DROP POLICY IF EXISTS "Users can update suggestion status" ON working_group_member_suggestions;
CREATE POLICY "Users can update suggestion status"
  ON working_group_member_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM working_groups wg
      JOIN dossiers d ON d.id = wg.id
      WHERE wg.id = working_group_member_suggestions.working_group_id
        AND d.status <> 'archived'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM working_groups wg
      JOIN dossiers d ON d.id = wg.id
      WHERE wg.id = working_group_member_suggestions.working_group_id
        AND d.status <> 'archived'
    )
  );

-- ACCEPTED-AS-DESIGNED (intentionally NOT changed here; see fix-report SEC-BE-15):
--   * users_view_consistency_checks / users_view_embeddings /
--     users_view_position_versions / users_view_audience_groups /
--     users_view_position_audiences  — staff-wide reads consistent with the
--     deliberately open positions_authenticated_read SELECT policy.
--   * users_view_all_approvals — intentional approval-history transparency.
--   * calendar_conflicts manage/view — operational, already TO authenticated, no
--     per-row tenant/owner key to scope by.
--   * duplicate_candidates / ai_relationship_suggestions — already service-role-
--     only / absent on live (no blanket authenticated policy present).
-- Owner-scoping these would regress current read flows for no real exposure gain
-- on a LOW finding.
