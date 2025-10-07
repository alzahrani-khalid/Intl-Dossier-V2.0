-- Migration: Create comment_reactions table
-- Feature: 014-full-assignment-detail
-- Task: T003

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES assignment_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '✅', '❓', '❤️', '🎯', '💡')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_emoji_per_comment UNIQUE(comment_id, user_id, emoji)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_reactions_comment
ON comment_reactions(comment_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users with view permission to assignment can read reactions
CREATE POLICY reactions_select ON comment_reactions
FOR SELECT
USING (
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policy: Users with view permission can add their own reactions
CREATE POLICY reactions_insert ON comment_reactions
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policy: Users can delete their own reactions
CREATE POLICY reactions_delete ON comment_reactions
FOR DELETE
USING (user_id = auth.uid());

-- Comment on table
COMMENT ON TABLE comment_reactions IS
  'Emoji reactions to assignment comments';
