-- Migration: Create get_escalation_path function for User Story 4
-- Feature: 023-specs-waiting-queue (Assignment Escalation)
-- Purpose: Recursive function to traverse organizational hierarchy and return escalation path
-- Dependencies: organizational_hierarchy table (20250114120100_create_organizational_hierarchy.sql)

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_escalation_recipient(UUID);

-- Create new get_escalation_path function that returns full hierarchy path
CREATE OR REPLACE FUNCTION get_escalation_path(p_user_id UUID)
RETURNS TABLE (
  level INT,
  user_id UUID,
  reports_to_id UUID,
  position_title TEXT,
  department TEXT,
  full_name TEXT,
  email TEXT
) AS $$
DECLARE
  v_max_depth INT := 10; -- Maximum hierarchy depth to prevent infinite loops
  v_visited_users UUID[] := ARRAY[]::UUID[]; -- Track visited users for cycle detection
BEGIN
  -- Recursive CTE to walk up the organizational hierarchy
  RETURN QUERY
  WITH RECURSIVE hierarchy_path AS (
    -- Base case: Start with the given user
    SELECT
      1 AS level,
      oh.user_id,
      oh.reports_to_id,
      oh.position_title,
      oh.department,
      p.full_name,
      p.email,
      ARRAY[oh.user_id] AS visited_path
    FROM organizational_hierarchy oh
    JOIN profiles p ON p.id = oh.user_id
    WHERE oh.user_id = p_user_id

    UNION ALL

    -- Recursive case: Get each manager up the chain
    SELECT
      hp.level + 1,
      oh.user_id,
      oh.reports_to_id,
      oh.position_title,
      oh.department,
      p.full_name,
      p.email,
      hp.visited_path || oh.user_id
    FROM hierarchy_path hp
    JOIN organizational_hierarchy oh ON oh.user_id = hp.reports_to_id
    JOIN profiles p ON p.id = oh.user_id
    WHERE
      hp.level < v_max_depth -- Enforce max depth limit
      AND hp.reports_to_id IS NOT NULL -- Stop at top of hierarchy
      AND NOT (oh.user_id = ANY(hp.visited_path)) -- Detect circular references
  )
  SELECT
    hp.level,
    hp.user_id,
    hp.reports_to_id,
    hp.position_title,
    hp.department,
    hp.full_name,
    hp.email
  FROM hierarchy_path hp
  ORDER BY hp.level;

  -- If no rows returned, the user has no escalation path
  IF NOT FOUND THEN
    RAISE NOTICE 'No escalation path found for user_id: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION get_escalation_path IS 'Returns full escalation path for a user by recursively traversing organizational_hierarchy. Includes cycle detection (max 10 levels) and circular reference prevention. Used by User Story 4 (Assignment Escalation).';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_escalation_path TO authenticated;
GRANT EXECUTE ON FUNCTION get_escalation_path TO service_role;

-- Example usage:
-- SELECT * FROM get_escalation_path('user-uuid-here');
-- Returns:
-- level | user_id | reports_to_id | position_title | department | full_name | email
-- ------+---------+---------------+----------------+------------+-----------+-------
-- 1     | user1   | user2         | Analyst        | Analytics  | John Doe  | john@...
-- 2     | user2   | user3         | Team Lead      | Analytics  | Jane Smith| jane@...
-- 3     | user3   | NULL          | Director       | Analytics  | Bob Jones | bob@...
