-- Migration: Ensure RLS is enabled and create additional policies
-- Feature: 014-full-assignment-detail
-- Task: T009

-- This migration ensures RLS is enabled on all tables
-- Individual table policies are created in their respective migration files

-- Ensure RLS is enabled on all tables (idempotent)
ALTER TABLE IF EXISTS assignment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_observers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_events ENABLE ROW LEVEL SECURITY;

-- Grant Realtime access to authenticated users for real-time subscriptions
-- This allows Supabase Realtime to publish changes to subscribed clients

-- Enable realtime for assignment-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_observers;
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_events;

-- Note: assignments table already has realtime enabled from previous feature

-- Create helper function to check if user can view assignment
-- This function is used by multiple RLS policies
CREATE OR REPLACE FUNCTION user_can_view_assignment(user_id UUID, assignment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assignments WHERE
      id = assignment_id AND (
        assignee_id = user_id OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = user_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on function
COMMENT ON FUNCTION user_can_view_assignment IS
  'Helper function to check if user has view permission to an assignment (assignee or observer)';
