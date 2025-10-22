-- Migration: Add Soft Delete to Dossiers
-- Feature: 025-unified-tasks-model
-- Purpose: Enable soft delete strategy for dossiers to prevent orphaned task references

-- Step 1: Add soft delete columns to dossiers table
ALTER TABLE dossiers
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Step 2: Create index for efficient filtering of non-deleted dossiers
CREATE INDEX idx_dossiers_deleted_at ON dossiers(deleted_at) WHERE deleted_at IS NULL;

-- Step 3: Create archive_dossier function
CREATE OR REPLACE FUNCTION archive_dossier(dossier_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Soft delete the dossier
  UPDATE dossiers
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE id = dossier_id
    AND deleted_at IS NULL; -- Prevent double-deletion

  -- Log the operation
  IF FOUND THEN
    RAISE NOTICE 'Dossier % archived by user %', dossier_id, auth.uid();
  ELSE
    RAISE EXCEPTION 'Dossier % not found or already archived', dossier_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create restore_dossier function for recovery
CREATE OR REPLACE FUNCTION restore_dossier(dossier_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Restore the dossier
  UPDATE dossiers
  SET
    deleted_at = NULL,
    deleted_by = NULL
  WHERE id = dossier_id
    AND deleted_at IS NOT NULL; -- Only restore deleted dossiers

  -- Log the operation
  IF FOUND THEN
    RAISE NOTICE 'Dossier % restored by user %', dossier_id, auth.uid();
  ELSE
    RAISE EXCEPTION 'Dossier % not found or not archived', dossier_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update existing SELECT policy to filter out deleted dossiers
DROP POLICY IF EXISTS "view_dossiers_with_clearance" ON dossiers;

CREATE POLICY "view_dossiers_with_clearance"
ON dossiers
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL -- Only show non-deleted dossiers
  AND (
    CASE get_user_clearance_level(auth.uid())
      WHEN 3 THEN sensitivity_level = ANY(ARRAY['low', 'medium', 'high'])
      WHEN 2 THEN sensitivity_level = ANY(ARRAY['low', 'medium'])
      ELSE sensitivity_level = 'low'
    END
  )
);

-- Step 6: Create special policy for viewing archived dossiers (clearance level 3+)
CREATE POLICY "view_archived_dossiers_with_clearance"
ON dossiers
FOR SELECT
TO authenticated
USING (
  deleted_at IS NOT NULL
  AND get_user_clearance_level(auth.uid()) >= 3 -- High clearance or higher
);

-- Step 7: Update existing UPDATE policy to respect soft delete
DROP POLICY IF EXISTS "update_dossiers_hybrid_permissions" ON dossiers;

CREATE POLICY "update_dossiers_hybrid_permissions"
ON dossiers
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL -- Cannot update deleted dossiers
  AND can_edit_dossier(id)
)
WITH CHECK (
  deleted_at IS NULL
  AND can_edit_dossier(id)
  AND version = (SELECT version FROM dossiers WHERE id = dossiers.id FOR UPDATE)
);

-- Step 8: Update existing DELETE policy to respect soft delete
DROP POLICY IF EXISTS "archive_dossiers_hybrid_permissions" ON dossiers;

CREATE POLICY "archive_dossiers_hybrid_permissions"
ON dossiers
FOR DELETE
TO authenticated
USING (
  deleted_at IS NULL -- Cannot physically delete already-archived dossiers
  AND can_edit_dossier(id)
);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN dossiers.deleted_at IS 'Soft delete timestamp - NULL means active, non-NULL means archived';
COMMENT ON COLUMN dossiers.deleted_by IS 'User who archived this dossier';
COMMENT ON FUNCTION archive_dossier(UUID) IS 'Soft delete a dossier - marks as deleted without removing data';
COMMENT ON FUNCTION restore_dossier(UUID) IS 'Restore a soft-deleted dossier';

-- Step 10: Grant execute permissions
GRANT EXECUTE ON FUNCTION archive_dossier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_dossier(UUID) TO authenticated;
