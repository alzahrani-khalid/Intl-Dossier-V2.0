-- Migration: Create staff_profiles table
-- Feature: Assignment Engine & SLA
-- Task: T004
-- Description: Table for staff profiles with skills, WIP limits, availability, escalation_chain_id, version

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE RESTRICT,
  skills UUID[] NOT NULL DEFAULT '{}',
  individual_wip_limit INTEGER NOT NULL CHECK (individual_wip_limit >= 1 AND individual_wip_limit <= 20),
  current_assignment_count INTEGER NOT NULL DEFAULT 0 CHECK (current_assignment_count >= 0),
  availability_status availability_status NOT NULL DEFAULT 'available',
  unavailable_until TIMESTAMPTZ,
  unavailable_reason TEXT,
  availability_source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (availability_source IN ('manual', 'hr_system', 'supervisor_override')),
  escalation_chain_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  hr_employee_id VARCHAR(50) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'supervisor', 'admin')),
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: cannot escalate to self
  CONSTRAINT chk_escalation_not_self CHECK (escalation_chain_id IS NULL OR escalation_chain_id != id),

  -- Business rule: if available, unavailable_until should be NULL
  CONSTRAINT chk_available_no_until CHECK (
    availability_status != 'available' OR unavailable_until IS NULL
  )
);

-- Indexes
CREATE INDEX idx_staff_unit ON staff_profiles(unit_id);
CREATE INDEX idx_staff_availability ON staff_profiles(availability_status) WHERE availability_status = 'available';
CREATE INDEX idx_staff_skills ON staff_profiles USING GIN(skills);
CREATE INDEX idx_staff_hr_id ON staff_profiles(hr_employee_id) WHERE hr_employee_id IS NOT NULL;

-- Trigger: Auto-increment version on update (optimistic locking)
CREATE TRIGGER increment_staff_version
BEFORE UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION increment_version_column();

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_staff_timestamp
BEFORE UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE staff_profiles IS 'Staff assignment profiles with skills, capacity, and availability';
COMMENT ON COLUMN staff_profiles.user_id IS 'Reference to auth user (unique)';
COMMENT ON COLUMN staff_profiles.unit_id IS 'Organizational unit membership';
COMMENT ON COLUMN staff_profiles.skills IS 'Array of skill IDs (FK to skills.id)';
COMMENT ON COLUMN staff_profiles.individual_wip_limit IS 'Max concurrent assignments for this staff member (1-20)';
COMMENT ON COLUMN staff_profiles.current_assignment_count IS 'Current number of active assignments (cached)';
COMMENT ON COLUMN staff_profiles.availability_status IS 'Current availability status';
COMMENT ON COLUMN staff_profiles.escalation_chain_id IS 'Explicit escalation recipient (NULL = use default)';
COMMENT ON COLUMN staff_profiles.hr_employee_id IS 'External HR system employee ID (for future integration)';
COMMENT ON COLUMN staff_profiles.version IS 'Optimistic locking version (incremented on update)';
