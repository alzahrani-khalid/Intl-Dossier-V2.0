-- Migration: Create assignment_rules table
-- Feature: Assignment Engine & SLA
-- Task: T005
-- Description: Table for assignment rules with required_skills, priority_weight, capacity_check_enabled

CREATE TABLE IF NOT EXISTS assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  required_skills UUID[] NOT NULL CHECK (array_length(required_skills, 1) >= 1),
  priority_weight INTEGER NOT NULL DEFAULT 5 CHECK (priority_weight >= 1 AND priority_weight <= 10),
  capacity_check_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assignment_rules_unit ON assignment_rules(unit_id);
CREATE INDEX idx_assignment_rules_active ON assignment_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_assignment_rules_skills ON assignment_rules USING GIN(required_skills);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_assignment_rules_timestamp
BEFORE UPDATE ON assignment_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assignment_rules IS 'Configurable rules for work item assignment routing';
COMMENT ON COLUMN assignment_rules.required_skills IS 'Skills required to match this rule (FK to skills.id, min 1)';
COMMENT ON COLUMN assignment_rules.priority_weight IS 'Weight for scoring (1-10, higher = prioritize this rule)';
COMMENT ON COLUMN assignment_rules.capacity_check_enabled IS 'Whether to enforce WIP limits for this rule';
