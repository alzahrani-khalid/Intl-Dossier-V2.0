-- Migration: Create notifications table
-- Feature: 010-after-action-notes
-- Task: T011

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'commitment_assigned', 'commitment_due_soon', 'after_action_published',
    'edit_approved', 'edit_rejected'
  )),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
