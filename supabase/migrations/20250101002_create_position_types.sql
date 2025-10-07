-- Migration: Create position_types table
-- Feature: 011-positions-talking-points
-- Task: T002

-- Create position_types table
CREATE TABLE IF NOT EXISTS position_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  approval_stages int NOT NULL CHECK (approval_stages >= 1 AND approval_stages <= 10),
  default_chain_config jsonb NOT NULL DEFAULT '{"stages": []}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_name_en_not_empty CHECK (char_length(trim(name_en)) > 0),
  CONSTRAINT check_name_ar_not_empty CHECK (char_length(trim(name_ar)) > 0)
);

-- Add comment
COMMENT ON TABLE position_types IS 'Defines position types and their approval chain configurations';

-- Add column comments
COMMENT ON COLUMN position_types.name_en IS 'Position type name in English';
COMMENT ON COLUMN position_types.name_ar IS 'Position type name in Arabic';
COMMENT ON COLUMN position_types.approval_stages IS 'Number of approval stages (1-10)';
COMMENT ON COLUMN position_types.default_chain_config IS 'JSONB with default approver roles/groups for each stage';

-- Create index for efficient lookups
CREATE INDEX idx_position_types_approval_stages ON position_types(approval_stages);
