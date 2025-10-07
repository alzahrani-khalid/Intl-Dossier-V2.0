-- T068: Create optimized staff eligibility function with CTE
-- Used by auto-assignment service for performant candidate filtering

CREATE OR REPLACE FUNCTION find_eligible_staff_for_assignment(
  required_skills UUID[],
  target_unit_id UUID DEFAULT NULL,
  max_candidates INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  unit_id UUID,
  skills UUID[],
  individual_wip_limit INTEGER,
  current_assignment_count INTEGER,
  availability_status availability_status,
  unavailable_until TIMESTAMPTZ,
  unavailable_reason TEXT,
  availability_source VARCHAR(20),
  escalation_chain_id UUID,
  hr_employee_id VARCHAR(50),
  role VARCHAR(50),
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH eligible_staff AS (
    -- Filter staff with required skills, availability, and capacity
    SELECT
      sp.*,
      -- Preliminary score for ranking (skills + capacity)
      (
        -- Skills match score (0-40)
        (CARDINALITY(ARRAY(SELECT unnest(sp.skills) INTERSECT SELECT unnest(required_skills)))::FLOAT /
         NULLIF(CARDINALITY(required_skills), 0)) * 40 +

        -- Capacity score (0-30)
        (1.0 - (sp.current_assignment_count::FLOAT / NULLIF(sp.individual_wip_limit, 0))) * 30
      ) AS preliminary_score
    FROM staff_profiles sp
    WHERE
      -- Must have required skills (array contains all required skills)
      sp.skills @> required_skills

      -- Must be available
      AND sp.availability_status = 'available'

      -- Must have capacity
      AND sp.current_assignment_count < sp.individual_wip_limit

      -- Unit filter (if specified)
      AND (
        target_unit_id IS NULL
        OR sp.unit_id = target_unit_id
      )
  )
  SELECT
    es.id,
    es.user_id,
    es.unit_id,
    es.skills,
    es.individual_wip_limit,
    es.current_assignment_count,
    es.availability_status,
    es.unavailable_until,
    es.unavailable_reason,
    es.availability_source,
    es.escalation_chain_id,
    es.hr_employee_id,
    es.role,
    es.version,
    es.created_at,
    es.updated_at
  FROM eligible_staff es
  ORDER BY es.preliminary_score DESC
  LIMIT max_candidates;
END;
$$;

COMMENT ON FUNCTION find_eligible_staff_for_assignment IS
'Optimized function to find eligible staff for assignment using CTE.
Filters by required skills, availability, and capacity.
Returns top candidates ranked by preliminary score (skills + capacity).
Limits result set to max_candidates (default 50) for performance.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_eligible_staff_for_assignment TO authenticated;
GRANT EXECUTE ON FUNCTION find_eligible_staff_for_assignment TO service_role;
