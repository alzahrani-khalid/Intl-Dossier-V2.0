-- Migration: Create audience_groups and junction tables
-- Feature: 011-positions-talking-points
-- Task: T006

-- Create audience_groups table
CREATE TABLE IF NOT EXISTS audience_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_name_en_not_empty CHECK (char_length(trim(name_en)) > 0),
  CONSTRAINT check_name_ar_not_empty CHECK (char_length(trim(name_ar)) > 0),
  CONSTRAINT unique_audience_group_name_en UNIQUE (name_en),
  CONSTRAINT unique_audience_group_name_ar UNIQUE (name_ar)
);

-- Create position_audience_groups junction table
CREATE TABLE IF NOT EXISTS position_audience_groups (
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  audience_group_id uuid NOT NULL REFERENCES audience_groups(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL REFERENCES auth.users(id),

  PRIMARY KEY (position_id, audience_group_id)
);

-- Create user_audience_memberships junction table
CREATE TABLE IF NOT EXISTS user_audience_memberships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_group_id uuid NOT NULL REFERENCES audience_groups(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, audience_group_id)
);

-- Add comments
COMMENT ON TABLE audience_groups IS 'Defines groups of users who can access published positions';
COMMENT ON COLUMN audience_groups.name_en IS 'Group name in English';
COMMENT ON COLUMN audience_groups.name_ar IS 'Group name in Arabic';
COMMENT ON COLUMN audience_groups.description IS 'Purpose of the group';

COMMENT ON TABLE position_audience_groups IS 'Many-to-many relationship between positions and audience groups';
COMMENT ON COLUMN position_audience_groups.granted_at IS 'When access was granted';
COMMENT ON COLUMN position_audience_groups.granted_by IS 'User who granted access';

COMMENT ON TABLE user_audience_memberships IS 'Many-to-many relationship between users and audience groups';
COMMENT ON COLUMN user_audience_memberships.added_at IS 'Membership timestamp';

-- Create indexes
CREATE INDEX idx_audience_groups_name_en ON audience_groups(name_en);
CREATE INDEX idx_audience_groups_name_ar ON audience_groups(name_ar);
CREATE INDEX idx_position_audience_groups_position ON position_audience_groups(position_id);
CREATE INDEX idx_position_audience_groups_group ON position_audience_groups(audience_group_id);
CREATE INDEX idx_user_audience_memberships_user ON user_audience_memberships(user_id);
CREATE INDEX idx_user_audience_memberships_group ON user_audience_memberships(audience_group_id);
