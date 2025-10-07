-- Migration: Create consistency_checks table
-- Feature: 011-positions-talking-points
-- Task: T008

-- Create consistency_checks table
CREATE TABLE IF NOT EXISTS consistency_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Check metadata
  check_trigger text NOT NULL CHECK (check_trigger IN ('manual', 'automatic_on_submit')),
  consistency_score int CHECK (consistency_score >= 0 AND consistency_score <= 100),
  ai_service_available boolean NOT NULL DEFAULT true,

  -- Conflicts and resolutions
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_resolutions jsonb,

  -- Audit
  checked_at timestamptz NOT NULL DEFAULT now(),
  checked_by uuid REFERENCES auth.users(id)
);

-- Add comments
COMMENT ON TABLE consistency_checks IS 'Records of consistency analysis runs and detected conflicts';
COMMENT ON COLUMN consistency_checks.check_trigger IS 'Trigger type: manual or automatic_on_submit';
COMMENT ON COLUMN consistency_checks.consistency_score IS '0-100 overall alignment score';
COMMENT ON COLUMN consistency_checks.ai_service_available IS 'Boolean indicating if AI was available during check';
COMMENT ON COLUMN consistency_checks.conflicts IS 'JSONB array of detected conflicts with details';
COMMENT ON COLUMN consistency_checks.suggested_resolutions IS 'JSONB with resolution strategies';
COMMENT ON COLUMN consistency_checks.checked_at IS 'Check timestamp';
COMMENT ON COLUMN consistency_checks.checked_by IS 'User who triggered (null for automatic)';

-- Create indexes
CREATE INDEX idx_consistency_checks_position_id ON consistency_checks(position_id);
CREATE INDEX idx_consistency_checks_score ON consistency_checks(consistency_score);
CREATE INDEX idx_consistency_checks_checked_at ON consistency_checks(checked_at DESC);
CREATE INDEX idx_consistency_checks_trigger ON consistency_checks(check_trigger);
