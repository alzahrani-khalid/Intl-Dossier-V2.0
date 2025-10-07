-- Migration: Create position_versions table with partitioning
-- Feature: 011-positions-talking-points
-- Task: T004

-- Create position_versions table (partitioned by created_at for 7-year retention)
CREATE TABLE IF NOT EXISTS position_versions (
  id uuid DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  version_number int NOT NULL,

  -- Content snapshot
  content_en text,
  content_ar text,
  rationale_en text,
  rationale_ar text,

  -- Full snapshot of position state
  full_snapshot jsonb NOT NULL,

  -- Audit fields
  author_id uuid NOT NULL REFERENCES auth.users(id),
  superseded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 7-year retention
  retention_until timestamptz NOT NULL,

  -- Constraints
  CONSTRAINT check_version_number_positive CHECK (version_number > 0),

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next few years
CREATE TABLE IF NOT EXISTS position_versions_2025 PARTITION OF position_versions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS position_versions_2026 PARTITION OF position_versions
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS position_versions_2027 PARTITION OF position_versions
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE IF NOT EXISTS position_versions_2028 PARTITION OF position_versions
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- Add comments
COMMENT ON TABLE position_versions IS 'Immutable history of position changes for auditing and comparison (7-year retention)';
COMMENT ON COLUMN position_versions.version_number IS 'Sequential version number (1, 2, 3...)';
COMMENT ON COLUMN position_versions.full_snapshot IS 'Complete position state including metadata';
COMMENT ON COLUMN position_versions.superseded IS 'Boolean indicating if newer version exists';
COMMENT ON COLUMN position_versions.retention_until IS 'Auto-calculated as created_at + 7 years';

-- Create trigger to calculate retention_until
CREATE OR REPLACE FUNCTION set_retention_until()
RETURNS TRIGGER AS $$
BEGIN
  NEW.retention_until := NEW.created_at + interval '7 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_position_version_retention
  BEFORE INSERT ON position_versions
  FOR EACH ROW
  EXECUTE FUNCTION set_retention_until();

-- Create indexes for position_versions
CREATE INDEX IF NOT EXISTS idx_position_versions_position_id ON position_versions(position_id);
CREATE INDEX IF NOT EXISTS idx_position_versions_retention ON position_versions(retention_until);
CREATE INDEX IF NOT EXISTS idx_position_versions_version_number ON position_versions(position_id, version_number DESC);
