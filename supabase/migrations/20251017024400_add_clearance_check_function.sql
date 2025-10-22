-- Migration: Add clearance level validation function
-- Feature: 024-intake-entity-linking
-- Task: T016

-- ========================================
-- Function: check_clearance_level
-- ========================================

CREATE OR REPLACE FUNCTION check_clearance_level(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_clearance INT;
  entity_clearance INT;
BEGIN
  -- Get user clearance level
  SELECT clearance_level INTO user_clearance
  FROM profiles
  WHERE id = p_user_id;

  -- Handle null user (should not happen in normal flow)
  IF user_clearance IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get entity classification level (polymorphic query)
  -- Note: This assumes all entity tables have a classification_level column
  -- and table names are pluralized entity types (e.g., 'dossier' → 'dossiers')
  EXECUTE format(
    'SELECT classification_level FROM %I WHERE id = $1',
    p_entity_type || 's' -- Pluralize table name
  ) INTO entity_clearance
  USING p_entity_id;

  -- Handle null entity (entity doesn't exist or no classification)
  IF entity_clearance IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Return true if user has sufficient clearance
  RETURN user_clearance >= entity_clearance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION check_clearance_level(TEXT, UUID, UUID) IS 'Validates user clearance level against entity classification (0-3 hierarchy). Returns false if user lacks access.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_clearance_level(TEXT, UUID, UUID) TO authenticated;
