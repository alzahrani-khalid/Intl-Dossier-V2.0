-- Migration: RLS Policies for Working Groups Entity
-- Feature: working-groups-entity-management
-- Date: 2026-01-10
-- Description: Row Level Security policies for working groups and related tables

-- ============================================================================
-- WORKING GROUP MEMBERS RLS
-- ============================================================================

ALTER TABLE working_group_members ENABLE ROW LEVEL SECURITY;

-- View: Users can view members of working groups they have access to
CREATE POLICY "view_wg_members_by_dossier_access"
ON working_group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = working_group_members.working_group_id
      AND d.type = 'working_group'
      AND d.status NOT IN ('archived', 'deleted')
      AND (
        -- User has clearance for sensitivity level
        get_user_clearance_level(auth.uid()) >=
        CASE d.sensitivity_level
          WHEN 'low' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'high' THEN 3
        END
      )
  )
);

-- Insert: Users can add members to working groups they can edit
CREATE POLICY "insert_wg_members_if_can_edit"
ON working_group_members FOR INSERT
TO authenticated
WITH CHECK (
  can_edit_dossier(working_group_id)
);

-- Update: Users can update members if they can edit the working group
CREATE POLICY "update_wg_members_if_can_edit"
ON working_group_members FOR UPDATE
TO authenticated
USING (can_edit_dossier(working_group_id))
WITH CHECK (can_edit_dossier(working_group_id));

-- Delete: Users can remove members if they can edit the working group
CREATE POLICY "delete_wg_members_if_can_edit"
ON working_group_members FOR DELETE
TO authenticated
USING (can_edit_dossier(working_group_id));

-- ============================================================================
-- WORKING GROUP DELIVERABLES RLS
-- ============================================================================

ALTER TABLE working_group_deliverables ENABLE ROW LEVEL SECURITY;

-- View: Users can view deliverables of accessible working groups
CREATE POLICY "view_wg_deliverables_by_dossier_access"
ON working_group_deliverables FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = working_group_deliverables.working_group_id
      AND d.type = 'working_group'
      AND d.status NOT IN ('archived', 'deleted')
      AND get_user_clearance_level(auth.uid()) >=
          CASE d.sensitivity_level
            WHEN 'low' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'high' THEN 3
          END
  )
);

-- Insert: Users can add deliverables to editable working groups
CREATE POLICY "insert_wg_deliverables_if_can_edit"
ON working_group_deliverables FOR INSERT
TO authenticated
WITH CHECK (can_edit_dossier(working_group_id));

-- Update: Users can update deliverables if they can edit the working group
CREATE POLICY "update_wg_deliverables_if_can_edit"
ON working_group_deliverables FOR UPDATE
TO authenticated
USING (can_edit_dossier(working_group_id))
WITH CHECK (can_edit_dossier(working_group_id));

-- Delete: Users can delete deliverables if they can edit the working group
CREATE POLICY "delete_wg_deliverables_if_can_edit"
ON working_group_deliverables FOR DELETE
TO authenticated
USING (can_edit_dossier(working_group_id));

-- ============================================================================
-- WORKING GROUP MEETINGS RLS
-- ============================================================================

ALTER TABLE working_group_meetings ENABLE ROW LEVEL SECURITY;

-- View: Users can view meetings of accessible working groups
CREATE POLICY "view_wg_meetings_by_dossier_access"
ON working_group_meetings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = working_group_meetings.working_group_id
      AND d.type = 'working_group'
      AND d.status NOT IN ('archived', 'deleted')
      AND get_user_clearance_level(auth.uid()) >=
          CASE d.sensitivity_level
            WHEN 'low' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'high' THEN 3
          END
  )
);

-- Insert: Users can add meetings to editable working groups
CREATE POLICY "insert_wg_meetings_if_can_edit"
ON working_group_meetings FOR INSERT
TO authenticated
WITH CHECK (can_edit_dossier(working_group_id));

-- Update: Users can update meetings if they can edit the working group
CREATE POLICY "update_wg_meetings_if_can_edit"
ON working_group_meetings FOR UPDATE
TO authenticated
USING (can_edit_dossier(working_group_id))
WITH CHECK (can_edit_dossier(working_group_id));

-- Delete: Users can delete meetings if they can edit the working group
CREATE POLICY "delete_wg_meetings_if_can_edit"
ON working_group_meetings FOR DELETE
TO authenticated
USING (can_edit_dossier(working_group_id));

-- ============================================================================
-- WORKING GROUP DECISIONS RLS
-- ============================================================================

ALTER TABLE working_group_decisions ENABLE ROW LEVEL SECURITY;

-- View: Users can view decisions of accessible working groups
CREATE POLICY "view_wg_decisions_by_dossier_access"
ON working_group_decisions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = working_group_decisions.working_group_id
      AND d.type = 'working_group'
      AND d.status NOT IN ('archived', 'deleted')
      AND get_user_clearance_level(auth.uid()) >=
          CASE d.sensitivity_level
            WHEN 'low' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'high' THEN 3
          END
  )
);

-- Insert: Users can add decisions to editable working groups
CREATE POLICY "insert_wg_decisions_if_can_edit"
ON working_group_decisions FOR INSERT
TO authenticated
WITH CHECK (can_edit_dossier(working_group_id));

-- Update: Users can update decisions if they can edit the working group
CREATE POLICY "update_wg_decisions_if_can_edit"
ON working_group_decisions FOR UPDATE
TO authenticated
USING (can_edit_dossier(working_group_id))
WITH CHECK (can_edit_dossier(working_group_id));

-- Delete: Users can delete decisions if they can edit the working group
CREATE POLICY "delete_wg_decisions_if_can_edit"
ON working_group_decisions FOR DELETE
TO authenticated
USING (can_edit_dossier(working_group_id));

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to tables for authenticated users (RLS will control row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON working_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON working_group_deliverables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON working_group_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON working_group_decisions TO authenticated;

-- Grant access to view
GRANT SELECT ON working_group_stats TO authenticated;

-- Grant sequence usage for auto-generated IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
