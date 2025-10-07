-- Migration: Create helper functions (moved before table creation)
-- Feature: Assignment Engine & SLA
-- Task: T011 (moved to T000 for dependency resolution)
-- Description: increment_version_column() and update_updated_at_column()

-- Helper function: Increment version column for optimistic locking
CREATE OR REPLACE FUNCTION increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION increment_version_column IS 'Trigger function for optimistic locking (auto-increments version on UPDATE)';
COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function to update updated_at timestamp on row modification';
