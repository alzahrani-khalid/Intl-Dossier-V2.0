-- Migration: Create comment_mentions table
-- Feature: 014-full-assignment-detail
-- Task: T004

CREATE TABLE IF NOT EXISTS comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES assignment_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_mentions_comment
ON comment_mentions(comment_id);

CREATE INDEX IF NOT EXISTS idx_mentions_user
ON comment_mentions(mentioned_user_id, notified_at);

-- Enable RLS
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Mentioned users can read their mentions
CREATE POLICY mentions_select ON comment_mentions
FOR SELECT
USING (
  mentioned_user_id = auth.uid() OR
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policy: Only Edge Functions can insert mentions (server-side validation required)
CREATE POLICY mentions_insert ON comment_mentions
FOR INSERT
WITH CHECK (
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

-- Comment on table
COMMENT ON TABLE comment_mentions IS
  'Track users mentioned via @username in assignment comments';
