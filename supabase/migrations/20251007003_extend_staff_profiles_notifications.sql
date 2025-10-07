-- Extend staff_profiles table with notification preferences
-- Stored as JSONB for flexible schema and easy querying

ALTER TABLE staff_profiles
ADD COLUMN notification_preferences jsonb DEFAULT '{"stage_transitions": {"enabled": true, "stages": "all"}}'::jsonb;

-- Add CHECK constraint to enforce schema structure
ALTER TABLE staff_profiles
ADD CONSTRAINT notification_preferences_schema_check
CHECK (
  notification_preferences ? 'stage_transitions'
  AND notification_preferences->'stage_transitions' ? 'enabled'
  AND notification_preferences->'stage_transitions' ? 'stages'
);

-- Create GIN index for efficient JSONB queries
CREATE INDEX idx_staff_notification_prefs ON staff_profiles USING GIN (notification_preferences);
