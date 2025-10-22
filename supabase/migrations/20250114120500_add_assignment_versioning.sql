-- Migration: Add optimistic locking for assignments
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Prevent concurrent update conflicts using version-based optimistic locking

-- Add _version column for optimistic locking
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS _version INTEGER NOT NULL DEFAULT 1;

-- Create function to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_assignment_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment version if row data actually changed (not just updated_at)
    IF OLD IS DISTINCT FROM NEW THEN
        NEW._version = OLD._version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment version before update
DROP TRIGGER IF EXISTS update_assignment_version ON assignments;
CREATE TRIGGER update_assignment_version
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION increment_assignment_version();

-- Add index on version for optimistic locking checks
CREATE INDEX IF NOT EXISTS idx_assignments_version
ON assignments(id, _version);

-- Add comments
COMMENT ON COLUMN assignments._version IS 'Optimistic locking version - auto-incremented on each update. Used to detect concurrent modifications.';
COMMENT ON FUNCTION increment_assignment_version() IS 'Trigger function that increments _version column on every assignment update';
