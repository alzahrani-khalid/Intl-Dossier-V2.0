-- Migration: Create assignment_comments table
-- Feature: 014-full-assignment-detail
-- Task: T002

CREATE TABLE IF NOT EXISTS assignment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_assignment
ON assignment_comments(assignment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user
ON assignment_comments(user_id);

-- Enable RLS
ALTER TABLE assignment_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users with view permission to assignment can read comments
CREATE POLICY comments_select ON assignment_comments
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Users with view permission can insert comments
CREATE POLICY comments_insert ON assignment_comments
FOR INSERT
WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assignment_comments_updated_at ON assignment_comments;
CREATE TRIGGER assignment_comments_updated_at
  BEFORE UPDATE ON assignment_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_comments_updated_at();

-- Comment on table
COMMENT ON TABLE assignment_comments IS
  'Freeform progress notes on assignments with @mention support';
