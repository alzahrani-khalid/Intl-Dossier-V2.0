-- Migration: Helper Functions for Dossiers Hub
-- Date: 2025-09-30
-- Tasks: T001-T005

-- T001: increment_version() - Auto-increments version on UPDATE
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- T002: update_updated_at_column() - Updates updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- T003: can_edit_dossier() - Checks if user can edit dossier (hybrid permissions)
CREATE OR REPLACE FUNCTION can_edit_dossier(dossier_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User is assigned owner
    EXISTS (
      SELECT 1 FROM dossier_owners
      WHERE dossier_owners.dossier_id = can_edit_dossier.dossier_id
      AND dossier_owners.user_id = auth.uid()
    )
    OR
    -- User is admin or manager
    is_admin_or_manager(auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- T004: get_user_clearance_level() - Returns user's clearance level (1-3)
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  clearance INTEGER;
BEGIN
  SELECT
    CASE ur.role
      WHEN 'admin' THEN 3
      WHEN 'manager' THEN 3
      WHEN 'analyst' THEN 2
      ELSE 1
    END INTO clearance
  FROM user_roles ur
  WHERE ur.user_id = get_user_clearance_level.user_id
  ORDER BY clearance DESC
  LIMIT 1;

  RETURN COALESCE(clearance, 1); -- Default to level 1 (low)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- T005: is_admin_or_manager() - Checks if user has admin or manager role
CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = is_admin_or_manager.user_id
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_version() IS 'Automatically increments version field for optimistic locking';
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp';
COMMENT ON FUNCTION can_edit_dossier(UUID) IS 'Checks if user can edit dossier (owner OR admin/manager)';
COMMENT ON FUNCTION get_user_clearance_level(UUID) IS 'Returns user clearance level: 1=low, 2=medium, 3=high';
COMMENT ON FUNCTION is_admin_or_manager(UUID) IS 'Checks if user has admin or manager role';
