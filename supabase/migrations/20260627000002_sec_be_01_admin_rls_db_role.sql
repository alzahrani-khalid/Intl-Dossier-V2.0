-- SEC-BE-01 (CRITICAL) — Replace user_metadata.role admin gating with the
-- DB-sourced public.is_platform_admin(auth.uid()) helper across every RLS policy
-- that still trusts the self-settable JWT user_metadata role.
--
-- Live-state notes (verified against staging pg_policies):
--   * positions: the original `admins_view_all` / `admins_update_all` metadata
--     policies are already absent on live (superseded by positions_authenticated_read
--     for SELECT + drafters_insert_positions). We DROP IF EXISTS (no-op on live,
--     cleanup on a fresh replay where 20250101011 recreates them) and RECREATE the
--     secure form so admin read/update intent is restored without the escalation.
--   * approvals: `admins_full_access_approvals` (FOR ALL) is live and vulnerable;
--     `admins_reassign_approvals` is redundant with FOR ALL and is dropped (not
--     recreated).
--   * consistency_checks / position_embeddings / audience_groups /
--     user_audience_memberships: live FOR ALL admin policies, vulnerable.
--   * entity_preview_layouts / preview_layout_fields: live admin policies were
--     split into per-command `*_admin_insert/update/delete` reading
--     auth.users.raw_user_meta_data (= user_metadata, self-settable). The org-
--     isolation policies on these tables are the legitimate non-admin branch and
--     are intentionally left untouched.
--
-- Non-admin branches (drafter/approver/owner/org-isolation) are preserved exactly
-- by not touching those separate policies.

-- ---------------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_view_all" ON positions;
CREATE POLICY "admins_view_all"
  ON positions
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admins_update_all" ON positions;
CREATE POLICY "admins_update_all"
  ON positions
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_full_access_approvals" ON approvals;
CREATE POLICY "admins_full_access_approvals"
  ON approvals
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Redundant with the FOR ALL policy above; drop the metadata-gated variant.
DROP POLICY IF EXISTS "admins_reassign_approvals" ON approvals;

-- ---------------------------------------------------------------------------
-- consistency_checks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_full_access_consistency" ON consistency_checks;
CREATE POLICY "admins_full_access_consistency"
  ON consistency_checks
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- position_embeddings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_manage_embeddings" ON position_embeddings;
CREATE POLICY "admins_manage_embeddings"
  ON position_embeddings
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- audience_groups
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_manage_audience_groups" ON audience_groups;
CREATE POLICY "admins_manage_audience_groups"
  ON audience_groups
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- user_audience_memberships
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_manage_memberships" ON user_audience_memberships;
CREATE POLICY "admins_manage_memberships"
  ON user_audience_memberships
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- entity_preview_layouts (drop both the original FOR ALL name and the live
-- per-command names; recreate per-command admin policies on the secure helper)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "preview_layouts_admin_all" ON entity_preview_layouts;
DROP POLICY IF EXISTS "preview_layouts_admin_insert" ON entity_preview_layouts;
DROP POLICY IF EXISTS "preview_layouts_admin_update" ON entity_preview_layouts;
DROP POLICY IF EXISTS "preview_layouts_admin_delete" ON entity_preview_layouts;

CREATE POLICY "preview_layouts_admin_insert"
  ON entity_preview_layouts
  FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "preview_layouts_admin_update"
  ON entity_preview_layouts
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "preview_layouts_admin_delete"
  ON entity_preview_layouts
  FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- preview_layout_fields
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "preview_layout_fields_admin_all" ON preview_layout_fields;
DROP POLICY IF EXISTS "preview_layout_fields_admin_insert" ON preview_layout_fields;
DROP POLICY IF EXISTS "preview_layout_fields_admin_update" ON preview_layout_fields;
DROP POLICY IF EXISTS "preview_layout_fields_admin_delete" ON preview_layout_fields;

CREATE POLICY "preview_layout_fields_admin_insert"
  ON preview_layout_fields
  FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "preview_layout_fields_admin_update"
  ON preview_layout_fields
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "preview_layout_fields_admin_delete"
  ON preview_layout_fields
  FOR DELETE
  USING (public.is_platform_admin(auth.uid()));
