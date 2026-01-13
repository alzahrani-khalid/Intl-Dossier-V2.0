-- =====================================================
-- Onboarding Progress Tracking
-- Migration: 20260113100001_onboarding_progress.sql
-- Feature: Role-specific onboarding checklists with progress tracking
-- =====================================================

-- Create enum for user roles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'analyst', 'manager');
  END IF;
END
$$;

-- Create the onboarding progress table
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',

  -- Progress tracking as JSONB for flexibility
  items_progress JSONB NOT NULL DEFAULT '{}'::JSONB,
  milestones_achieved JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Completion status
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Dismissal status
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one progress record per user
  CONSTRAINT unique_user_onboarding UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON user_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_role ON user_onboarding_progress(role);
CREATE INDEX IF NOT EXISTS idx_onboarding_is_completed ON user_onboarding_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_is_dismissed ON user_onboarding_progress(is_dismissed);

-- Add GIN index for JSONB columns for efficient queries
CREATE INDEX IF NOT EXISTS idx_onboarding_items_progress ON user_onboarding_progress USING GIN (items_progress);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones ON user_onboarding_progress USING GIN (milestones_achieved);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_onboarding_updated_at ON user_onboarding_progress;
CREATE TRIGGER trigger_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding progress
CREATE POLICY "Users can view own onboarding progress"
  ON user_onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding progress
CREATE POLICY "Users can insert own onboarding progress"
  ON user_onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding progress"
  ON user_onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all onboarding progress (for analytics)
CREATE POLICY "Admins can view all onboarding progress"
  ON user_onboarding_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get or create onboarding progress for a user
CREATE OR REPLACE FUNCTION get_or_create_onboarding_progress(
  p_user_id UUID,
  p_role user_role DEFAULT 'viewer'
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
BEGIN
  -- Try to get existing progress
  SELECT * INTO v_progress
  FROM user_onboarding_progress
  WHERE user_id = p_user_id;

  -- If not found, create new record
  IF v_progress IS NULL THEN
    INSERT INTO user_onboarding_progress (user_id, role)
    VALUES (p_user_id, p_role)
    RETURNING * INTO v_progress;
  END IF;

  RETURN v_progress;
END;
$$;

-- Function to update item progress
CREATE OR REPLACE FUNCTION update_onboarding_item_progress(
  p_user_id UUID,
  p_item_id TEXT,
  p_action TEXT -- 'complete', 'skip', 'uncomplete'
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
  v_item_data JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get or create progress
  SELECT * INTO v_progress
  FROM user_onboarding_progress
  WHERE user_id = p_user_id;

  IF v_progress IS NULL THEN
    -- Create new progress record
    INSERT INTO user_onboarding_progress (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_progress;
  END IF;

  -- Build item data based on action
  IF p_action = 'complete' THEN
    v_item_data := jsonb_build_object(
      'itemId', p_item_id,
      'isCompleted', true,
      'completedAt', v_now,
      'wasSkipped', false
    );
  ELSIF p_action = 'skip' THEN
    v_item_data := jsonb_build_object(
      'itemId', p_item_id,
      'isCompleted', false,
      'wasSkipped', true,
      'skippedAt', v_now
    );
  ELSIF p_action = 'uncomplete' THEN
    v_item_data := jsonb_build_object(
      'itemId', p_item_id,
      'isCompleted', false,
      'wasSkipped', false
    );
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Update items_progress
  UPDATE user_onboarding_progress
  SET items_progress = items_progress || jsonb_build_object(p_item_id, v_item_data)
  WHERE user_id = p_user_id
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$;

-- Function to add milestone achievement
CREATE OR REPLACE FUNCTION add_milestone_achievement(
  p_user_id UUID,
  p_percentage INTEGER
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
  v_milestone JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Build milestone data
  v_milestone := jsonb_build_object(
    'percentage', p_percentage,
    'achievedAt', v_now,
    'celebrationShown', false
  );

  -- Update milestones array
  UPDATE user_onboarding_progress
  SET milestones_achieved = milestones_achieved || v_milestone
  WHERE user_id = p_user_id
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$;

-- Function to mark celebration as shown
CREATE OR REPLACE FUNCTION mark_celebration_shown(
  p_user_id UUID,
  p_percentage INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_onboarding_progress
  SET milestones_achieved = (
    SELECT jsonb_agg(
      CASE
        WHEN (elem->>'percentage')::INTEGER = p_percentage
        THEN elem || '{"celebrationShown": true}'::JSONB
        ELSE elem
      END
    )
    FROM jsonb_array_elements(milestones_achieved) AS elem
  )
  WHERE user_id = p_user_id;
END;
$$;

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_user_id UUID
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
BEGIN
  UPDATE user_onboarding_progress
  SET
    is_completed = true,
    completed_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$;

-- Function to dismiss onboarding
CREATE OR REPLACE FUNCTION dismiss_onboarding(
  p_user_id UUID
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
BEGIN
  UPDATE user_onboarding_progress
  SET
    is_dismissed = true,
    dismissed_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$;

-- Function to reset onboarding progress
CREATE OR REPLACE FUNCTION reset_onboarding_progress(
  p_user_id UUID
)
RETURNS user_onboarding_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress user_onboarding_progress;
BEGIN
  UPDATE user_onboarding_progress
  SET
    items_progress = '{}'::JSONB,
    milestones_achieved = '[]'::JSONB,
    is_completed = false,
    completed_at = NULL,
    is_dismissed = false,
    dismissed_at = NULL
  WHERE user_id = p_user_id
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE user_onboarding_progress IS 'Tracks user progress through role-specific onboarding checklists';
COMMENT ON COLUMN user_onboarding_progress.items_progress IS 'JSON object mapping item IDs to their completion status';
COMMENT ON COLUMN user_onboarding_progress.milestones_achieved IS 'JSON array of milestone achievements with timestamps';
COMMENT ON FUNCTION get_or_create_onboarding_progress IS 'Gets existing or creates new onboarding progress for a user';
COMMENT ON FUNCTION update_onboarding_item_progress IS 'Updates completion status of a specific checklist item';
COMMENT ON FUNCTION add_milestone_achievement IS 'Records a milestone achievement for a user';
COMMENT ON FUNCTION complete_onboarding IS 'Marks onboarding as fully completed';
COMMENT ON FUNCTION dismiss_onboarding IS 'Marks onboarding as dismissed by user';
