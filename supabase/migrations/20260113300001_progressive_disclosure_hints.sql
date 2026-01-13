-- =====================================================
-- Progressive Disclosure Hint Interactions
-- Migration: 20260113300001_progressive_disclosure_hints.sql
-- Feature: Track user interactions with progressive hints
-- =====================================================

-- Create enum for hint interaction status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hint_interaction_status') THEN
    CREATE TYPE hint_interaction_status AS ENUM ('shown', 'dismissed', 'expanded', 'action_taken');
  END IF;
END
$$;

-- Create enum for hint context types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hint_context_type') THEN
    CREATE TYPE hint_context_type AS ENUM (
      'empty_state',
      'first_interaction',
      'feature_discovery',
      'keyboard_shortcut',
      'advanced_feature',
      'form_field',
      'navigation'
    );
  END IF;
END
$$;

-- Create enum for user experience level
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_experience_level') THEN
    CREATE TYPE user_experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
  END IF;
END
$$;

-- =====================================================
-- User Hint Interactions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_hint_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Hint identification
  hint_id TEXT NOT NULL,
  hint_context hint_context_type NOT NULL DEFAULT 'empty_state',
  page_context TEXT, -- e.g., 'dossiers', 'engagements', 'my-work'

  -- Interaction tracking
  status hint_interaction_status NOT NULL DEFAULT 'shown',
  shown_count INTEGER NOT NULL DEFAULT 1,
  expanded_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  first_shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  expanded_at TIMESTAMPTZ,
  action_taken_at TIMESTAMPTZ,

  -- Re-show logic
  should_reshow_after TIMESTAMPTZ, -- NULL means don't re-show
  reshow_interval_days INTEGER DEFAULT 7,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one interaction record per user per hint
  CONSTRAINT unique_user_hint UNIQUE (user_id, hint_id)
);

-- =====================================================
-- User Progressive Disclosure Preferences Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_disclosure_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User experience level (auto-calculated or manually set)
  experience_level user_experience_level NOT NULL DEFAULT 'beginner',
  experience_level_auto_calculated BOOLEAN NOT NULL DEFAULT TRUE,

  -- Global hint settings
  hints_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  show_keyboard_shortcuts BOOLEAN NOT NULL DEFAULT TRUE,
  show_advanced_features BOOLEAN NOT NULL DEFAULT FALSE, -- Unlocks after X interactions

  -- Timing preferences
  hint_delay_ms INTEGER NOT NULL DEFAULT 300,
  auto_dismiss_seconds INTEGER, -- NULL means don't auto-dismiss

  -- Frequency settings
  max_hints_per_session INTEGER NOT NULL DEFAULT 5,
  hint_cooldown_minutes INTEGER NOT NULL DEFAULT 30,

  -- Visit tracking for progressive disclosure
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  first_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Feature unlock thresholds
  intermediate_unlock_interactions INTEGER NOT NULL DEFAULT 10,
  advanced_unlock_interactions INTEGER NOT NULL DEFAULT 50,
  expert_unlock_interactions INTEGER NOT NULL DEFAULT 100,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_disclosure_prefs UNIQUE (user_id)
);

-- =====================================================
-- Session Hint Tracking Table (for max hints per session)
-- =====================================================

CREATE TABLE IF NOT EXISTS session_hint_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,

  hints_shown INTEGER NOT NULL DEFAULT 0,
  hints_dismissed INTEGER NOT NULL DEFAULT 0,
  hints_expanded INTEGER NOT NULL DEFAULT 0,

  session_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_hint_at TIMESTAMPTZ,

  -- Cleanup old sessions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_session UNIQUE (user_id, session_id)
);

-- =====================================================
-- Indexes
-- =====================================================

-- user_hint_interactions indexes
CREATE INDEX IF NOT EXISTS idx_hint_interactions_user_id
  ON user_hint_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_hint_interactions_hint_id
  ON user_hint_interactions(hint_id);
CREATE INDEX IF NOT EXISTS idx_hint_interactions_context
  ON user_hint_interactions(hint_context);
CREATE INDEX IF NOT EXISTS idx_hint_interactions_status
  ON user_hint_interactions(status);
CREATE INDEX IF NOT EXISTS idx_hint_interactions_reshow
  ON user_hint_interactions(should_reshow_after)
  WHERE should_reshow_after IS NOT NULL;

-- user_disclosure_preferences indexes
CREATE INDEX IF NOT EXISTS idx_disclosure_prefs_user_id
  ON user_disclosure_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_prefs_experience
  ON user_disclosure_preferences(experience_level);

-- session_hint_tracking indexes
CREATE INDEX IF NOT EXISTS idx_session_hints_user_id
  ON session_hint_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_session_hints_session
  ON session_hint_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_session_hints_created
  ON session_hint_tracking(created_at);

-- =====================================================
-- Triggers
-- =====================================================

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_hint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_hint_interactions
DROP TRIGGER IF EXISTS trigger_hint_interactions_updated_at ON user_hint_interactions;
CREATE TRIGGER trigger_hint_interactions_updated_at
  BEFORE UPDATE ON user_hint_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_hint_updated_at();

-- Trigger for user_disclosure_preferences
DROP TRIGGER IF EXISTS trigger_disclosure_prefs_updated_at ON user_disclosure_preferences;
CREATE TRIGGER trigger_disclosure_prefs_updated_at
  BEFORE UPDATE ON user_disclosure_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_hint_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_hint_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_disclosure_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_hint_tracking ENABLE ROW LEVEL SECURITY;

-- user_hint_interactions policies
CREATE POLICY "Users can view own hint interactions"
  ON user_hint_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hint interactions"
  ON user_hint_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hint interactions"
  ON user_hint_interactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_disclosure_preferences policies
CREATE POLICY "Users can view own disclosure preferences"
  ON user_disclosure_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disclosure preferences"
  ON user_disclosure_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disclosure preferences"
  ON user_disclosure_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- session_hint_tracking policies
CREATE POLICY "Users can view own session tracking"
  ON session_hint_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session tracking"
  ON session_hint_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session tracking"
  ON session_hint_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session tracking"
  ON session_hint_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Get or create disclosure preferences for a user
CREATE OR REPLACE FUNCTION get_or_create_disclosure_preferences(
  p_user_id UUID
)
RETURNS user_disclosure_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs user_disclosure_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_prefs
  FROM user_disclosure_preferences
  WHERE user_id = p_user_id;

  -- If not found, create new record
  IF v_prefs IS NULL THEN
    INSERT INTO user_disclosure_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  RETURN v_prefs;
END;
$$;

-- Record hint interaction
CREATE OR REPLACE FUNCTION record_hint_interaction(
  p_user_id UUID,
  p_hint_id TEXT,
  p_hint_context hint_context_type,
  p_page_context TEXT DEFAULT NULL,
  p_status hint_interaction_status DEFAULT 'shown'
)
RETURNS user_hint_interactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction user_hint_interactions;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Upsert hint interaction
  INSERT INTO user_hint_interactions (
    user_id, hint_id, hint_context, page_context, status,
    first_shown_at, last_shown_at
  )
  VALUES (
    p_user_id, p_hint_id, p_hint_context, p_page_context, p_status,
    v_now, v_now
  )
  ON CONFLICT (user_id, hint_id)
  DO UPDATE SET
    status = CASE
      WHEN p_status = 'dismissed' THEN 'dismissed'::hint_interaction_status
      WHEN p_status = 'expanded' THEN 'expanded'::hint_interaction_status
      WHEN p_status = 'action_taken' THEN 'action_taken'::hint_interaction_status
      ELSE user_hint_interactions.status
    END,
    shown_count = CASE
      WHEN p_status = 'shown' THEN user_hint_interactions.shown_count + 1
      ELSE user_hint_interactions.shown_count
    END,
    expanded_count = CASE
      WHEN p_status = 'expanded' THEN user_hint_interactions.expanded_count + 1
      ELSE user_hint_interactions.expanded_count
    END,
    last_shown_at = CASE
      WHEN p_status = 'shown' THEN v_now
      ELSE user_hint_interactions.last_shown_at
    END,
    dismissed_at = CASE
      WHEN p_status = 'dismissed' THEN v_now
      ELSE user_hint_interactions.dismissed_at
    END,
    expanded_at = CASE
      WHEN p_status = 'expanded' THEN v_now
      ELSE user_hint_interactions.expanded_at
    END,
    action_taken_at = CASE
      WHEN p_status = 'action_taken' THEN v_now
      ELSE user_hint_interactions.action_taken_at
    END,
    should_reshow_after = CASE
      WHEN p_status = 'dismissed' THEN v_now + (user_hint_interactions.reshow_interval_days || ' days')::INTERVAL
      ELSE user_hint_interactions.should_reshow_after
    END
  RETURNING * INTO v_interaction;

  -- Update user's total interactions
  UPDATE user_disclosure_preferences
  SET total_interactions = total_interactions + 1
  WHERE user_id = p_user_id;

  RETURN v_interaction;
END;
$$;

-- Check if hint should be shown
CREATE OR REPLACE FUNCTION should_show_hint(
  p_user_id UUID,
  p_hint_id TEXT,
  p_hint_context hint_context_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction user_hint_interactions;
  v_prefs user_disclosure_preferences;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM user_disclosure_preferences
  WHERE user_id = p_user_id;

  -- If no preferences, hints are enabled by default
  IF v_prefs IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check global hints setting
  IF NOT v_prefs.hints_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check keyboard shortcuts setting
  IF p_hint_context = 'keyboard_shortcut' AND NOT v_prefs.show_keyboard_shortcuts THEN
    RETURN FALSE;
  END IF;

  -- Check advanced features setting
  IF p_hint_context = 'advanced_feature' AND NOT v_prefs.show_advanced_features THEN
    RETURN FALSE;
  END IF;

  -- Get hint interaction
  SELECT * INTO v_interaction
  FROM user_hint_interactions
  WHERE user_id = p_user_id AND hint_id = p_hint_id;

  -- If never shown, show it
  IF v_interaction IS NULL THEN
    RETURN TRUE;
  END IF;

  -- If dismissed but re-show time has passed, show it
  IF v_interaction.status = 'dismissed' AND
     v_interaction.should_reshow_after IS NOT NULL AND
     v_interaction.should_reshow_after <= v_now THEN
    RETURN TRUE;
  END IF;

  -- If action was taken, don't show again
  IF v_interaction.status = 'action_taken' THEN
    RETURN FALSE;
  END IF;

  -- If dismissed and no re-show scheduled, don't show
  IF v_interaction.status = 'dismissed' THEN
    RETURN FALSE;
  END IF;

  -- Default: show for empty_state and first_interaction contexts
  IF p_hint_context IN ('empty_state', 'first_interaction') THEN
    RETURN TRUE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Update experience level based on interactions
CREATE OR REPLACE FUNCTION update_experience_level(
  p_user_id UUID
)
RETURNS user_experience_level
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs user_disclosure_preferences;
  v_new_level user_experience_level;
BEGIN
  -- Get preferences
  SELECT * INTO v_prefs
  FROM user_disclosure_preferences
  WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    RETURN 'beginner'::user_experience_level;
  END IF;

  -- Calculate new level
  IF v_prefs.total_interactions >= v_prefs.expert_unlock_interactions THEN
    v_new_level := 'expert'::user_experience_level;
  ELSIF v_prefs.total_interactions >= v_prefs.advanced_unlock_interactions THEN
    v_new_level := 'advanced'::user_experience_level;
  ELSIF v_prefs.total_interactions >= v_prefs.intermediate_unlock_interactions THEN
    v_new_level := 'intermediate'::user_experience_level;
  ELSE
    v_new_level := 'beginner'::user_experience_level;
  END IF;

  -- Update if auto-calculated
  IF v_prefs.experience_level_auto_calculated THEN
    UPDATE user_disclosure_preferences
    SET
      experience_level = v_new_level,
      show_advanced_features = (v_new_level IN ('advanced', 'expert'))
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_level;
END;
$$;

-- Record visit and update counters
CREATE OR REPLACE FUNCTION record_user_visit(
  p_user_id UUID
)
RETURNS user_disclosure_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs user_disclosure_preferences;
BEGIN
  -- Get or create preferences
  SELECT * INTO v_prefs
  FROM user_disclosure_preferences
  WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    INSERT INTO user_disclosure_preferences (user_id, total_visits)
    VALUES (p_user_id, 1)
    RETURNING * INTO v_prefs;
  ELSE
    UPDATE user_disclosure_preferences
    SET
      total_visits = total_visits + 1,
      last_visit_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_prefs;
  END IF;

  -- Update experience level
  PERFORM update_experience_level(p_user_id);

  RETURN v_prefs;
END;
$$;

-- Get hints for a page context
CREATE OR REPLACE FUNCTION get_hints_for_context(
  p_user_id UUID,
  p_page_context TEXT,
  p_hint_context hint_context_type DEFAULT 'empty_state'
)
RETURNS TABLE (
  hint_id TEXT,
  status hint_interaction_status,
  shown_count INTEGER,
  should_show BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.hint_id,
    h.status,
    h.shown_count,
    should_show_hint(p_user_id, h.hint_id, h.hint_context) AS should_show
  FROM user_hint_interactions h
  WHERE h.user_id = p_user_id
    AND h.page_context = p_page_context
    AND h.hint_context = p_hint_context;
END;
$$;

-- Cleanup old sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM session_hint_tracking
  WHERE created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE user_hint_interactions IS 'Tracks individual hint interactions per user for progressive disclosure';
COMMENT ON TABLE user_disclosure_preferences IS 'User preferences for progressive disclosure behavior';
COMMENT ON TABLE session_hint_tracking IS 'Tracks hints shown per session to limit cognitive overload';
COMMENT ON FUNCTION record_hint_interaction IS 'Records and updates hint interaction status';
COMMENT ON FUNCTION should_show_hint IS 'Determines if a hint should be displayed based on user history and preferences';
COMMENT ON FUNCTION update_experience_level IS 'Automatically updates user experience level based on interaction count';
COMMENT ON FUNCTION record_user_visit IS 'Records user visit and updates visit counters';
