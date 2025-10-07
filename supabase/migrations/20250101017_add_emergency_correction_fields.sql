-- Migration: Add emergency correction fields to positions table
-- Feature: 011-positions-talking-points
-- Task: T096
-- Description: Add emergency_correction boolean (default false), corrected_at timestamp,
--              corrected_by uuid, correction_reason text, corrected_version_id uuid to positions table

-- Add emergency correction tracking fields
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS emergency_correction BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS corrected_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS correction_reason TEXT,
  ADD COLUMN IF NOT EXISTS corrected_version_id UUID;

-- Add index for querying corrected positions
CREATE INDEX IF NOT EXISTS idx_positions_emergency_correction
  ON positions(emergency_correction)
  WHERE emergency_correction = TRUE;

-- Add index for querying by corrector
CREATE INDEX IF NOT EXISTS idx_positions_corrected_by
  ON positions(corrected_by)
  WHERE corrected_by IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN positions.emergency_correction IS 'Flag indicating if this position was emergency corrected post-publication';
COMMENT ON COLUMN positions.corrected_at IS 'Timestamp when emergency correction was applied';
COMMENT ON COLUMN positions.corrected_by IS 'Admin user who performed the emergency correction';
COMMENT ON COLUMN positions.correction_reason IS 'Mandatory justification for emergency correction';
COMMENT ON COLUMN positions.corrected_version_id IS 'Reference to the corrected version created';
