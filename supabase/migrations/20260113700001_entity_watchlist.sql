-- Migration: Create Entity Watchlist System
-- Feature: personal-watchlist
-- Description: Let users add specific entities to a personal watchlist and receive notifications
-- Date: 2026-01-13

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Entity types that can be watched
CREATE TYPE watchable_entity_type AS ENUM (
  'person',
  'engagement',
  'commitment',
  'dossier',
  'organization',
  'forum',
  'position',
  'mou',
  'working_group'
);

-- Notification trigger events
CREATE TYPE watch_event_type AS ENUM (
  'entity_modified',
  'relationship_added',
  'relationship_removed',
  'deadline_approaching',
  'deadline_passed',
  'status_changed',
  'assignment_changed',
  'comment_added',
  'document_attached',
  'custom'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Main watchlist table - stores user's watched entities
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type watchable_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  -- User-defined label for this watch (optional)
  custom_label TEXT,
  -- Notes about why watching this entity
  notes TEXT,
  -- Priority for notifications (affects sorting and urgency)
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  -- Whether actively watching (can temporarily disable without removing)
  is_active BOOLEAN DEFAULT true,
  -- Notification settings specific to this watch
  notify_on_modification BOOLEAN DEFAULT true,
  notify_on_relationship_change BOOLEAN DEFAULT true,
  notify_on_deadline BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_comment BOOLEAN DEFAULT false,
  notify_on_document BOOLEAN DEFAULT false,
  -- Deadline reminder settings (days before)
  deadline_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate watches
  CONSTRAINT unique_user_entity_watch UNIQUE (user_id, entity_type, entity_id)
);

-- Watchlist templates for roles - predefined watchlists
CREATE TABLE watchlist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  -- Which roles this template applies to
  applicable_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  -- Template configuration (JSONB for flexibility)
  -- Structure: { entities: [{ entity_type, entity_id, ...settings }], notify_settings: {...} }
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Whether this is a system template (cannot be deleted by users)
  is_system_template BOOLEAN DEFAULT false,
  -- Created by user (null for system templates)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's applied templates (many-to-many)
CREATE TABLE user_watchlist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES watchlist_templates(id) ON DELETE CASCADE,
  -- Whether to auto-sync with template updates
  auto_sync BOOLEAN DEFAULT true,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_id)
);

-- Watch events log - tracks what triggered notifications
CREATE TABLE watchlist_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES user_watchlist(id) ON DELETE CASCADE,
  event_type watch_event_type NOT NULL,
  -- Details about the event
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Whether notification was sent
  notification_sent BOOLEAN DEFAULT false,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- User watchlist indexes
CREATE INDEX idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_entity ON user_watchlist(entity_type, entity_id);
CREATE INDEX idx_user_watchlist_active ON user_watchlist(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_watchlist_priority ON user_watchlist(user_id, priority);

-- Template indexes
CREATE INDEX idx_watchlist_templates_roles ON watchlist_templates USING GIN(applicable_roles);
CREATE INDEX idx_user_watchlist_templates_user ON user_watchlist_templates(user_id);

-- Events indexes
CREATE INDEX idx_watchlist_events_watch ON watchlist_events(watch_id);
CREATE INDEX idx_watchlist_events_created ON watchlist_events(created_at DESC);
CREATE INDEX idx_watchlist_events_type ON watchlist_events(event_type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_watchlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_watchlist_updated_at
  BEFORE UPDATE ON user_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION update_user_watchlist_updated_at();

CREATE TRIGGER trigger_update_watchlist_templates_updated_at
  BEFORE UPDATE ON watchlist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_user_watchlist_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_events ENABLE ROW LEVEL SECURITY;

-- User watchlist policies
CREATE POLICY "Users can view own watchlist"
  ON user_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own watchlist"
  ON user_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON user_watchlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
  ON user_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Template policies
CREATE POLICY "Anyone can view templates"
  ON watchlist_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can create custom templates"
  ON watchlist_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_system_template = false);

CREATE POLICY "Users can update own templates"
  ON watchlist_templates FOR UPDATE
  USING (auth.uid() = created_by AND is_system_template = false);

CREATE POLICY "Users can delete own templates"
  ON watchlist_templates FOR DELETE
  USING (auth.uid() = created_by AND is_system_template = false);

-- User template associations
CREATE POLICY "Users can view own template associations"
  ON user_watchlist_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can apply templates"
  ON user_watchlist_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove templates"
  ON user_watchlist_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view own watch events"
  ON watchlist_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_watchlist
      WHERE id = watchlist_events.watch_id
      AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Add entity to watchlist
CREATE OR REPLACE FUNCTION add_to_watchlist(
  p_entity_type watchable_entity_type,
  p_entity_id UUID,
  p_custom_label TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_notify_modification BOOLEAN DEFAULT true,
  p_notify_relationship BOOLEAN DEFAULT true,
  p_notify_deadline BOOLEAN DEFAULT true,
  p_notify_status BOOLEAN DEFAULT true,
  p_deadline_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1]
) RETURNS UUID AS $$
DECLARE
  v_watch_id UUID;
BEGIN
  INSERT INTO user_watchlist (
    user_id,
    entity_type,
    entity_id,
    custom_label,
    notes,
    priority,
    notify_on_modification,
    notify_on_relationship_change,
    notify_on_deadline,
    notify_on_status_change,
    deadline_reminder_days
  ) VALUES (
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_custom_label,
    p_notes,
    p_priority,
    p_notify_modification,
    p_notify_relationship,
    p_notify_deadline,
    p_notify_status,
    p_deadline_reminder_days
  )
  ON CONFLICT (user_id, entity_type, entity_id)
  DO UPDATE SET
    custom_label = COALESCE(p_custom_label, user_watchlist.custom_label),
    notes = COALESCE(p_notes, user_watchlist.notes),
    priority = p_priority,
    notify_on_modification = p_notify_modification,
    notify_on_relationship_change = p_notify_relationship,
    notify_on_deadline = p_notify_deadline,
    notify_on_status_change = p_notify_status,
    deadline_reminder_days = p_deadline_reminder_days,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO v_watch_id;

  RETURN v_watch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove entity from watchlist
CREATE OR REPLACE FUNCTION remove_from_watchlist(
  p_entity_type watchable_entity_type,
  p_entity_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM user_watchlist
  WHERE user_id = auth.uid()
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk add to watchlist
CREATE OR REPLACE FUNCTION bulk_add_to_watchlist(
  p_entities JSONB -- Array of { entity_type, entity_id, custom_label?, notes?, priority? }
) RETURNS INTEGER AS $$
DECLARE
  v_entity JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_entity IN SELECT * FROM jsonb_array_elements(p_entities)
  LOOP
    INSERT INTO user_watchlist (
      user_id,
      entity_type,
      entity_id,
      custom_label,
      notes,
      priority
    ) VALUES (
      auth.uid(),
      (v_entity->>'entity_type')::watchable_entity_type,
      (v_entity->>'entity_id')::UUID,
      v_entity->>'custom_label',
      v_entity->>'notes',
      COALESCE(v_entity->>'priority', 'medium')
    )
    ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk remove from watchlist
CREATE OR REPLACE FUNCTION bulk_remove_from_watchlist(
  p_watch_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM user_watchlist
  WHERE id = ANY(p_watch_ids)
    AND user_id = auth.uid();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle watch active status
CREATE OR REPLACE FUNCTION toggle_watch_active(
  p_watch_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_status BOOLEAN;
BEGIN
  UPDATE user_watchlist
  SET is_active = NOT is_active
  WHERE id = p_watch_id
    AND user_id = auth.uid()
  RETURNING is_active INTO v_new_status;

  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if entity is watched by current user
CREATE OR REPLACE FUNCTION is_entity_watched(
  p_entity_type watchable_entity_type,
  p_entity_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_watchlist
    WHERE user_id = auth.uid()
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get watchlist summary for current user
CREATE OR REPLACE FUNCTION get_watchlist_summary()
RETURNS TABLE (
  entity_type watchable_entity_type,
  total_count BIGINT,
  active_count BIGINT,
  high_priority_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uw.entity_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE uw.is_active = true) as active_count,
    COUNT(*) FILTER (WHERE uw.priority IN ('high', 'urgent')) as high_priority_count
  FROM user_watchlist uw
  WHERE uw.user_id = auth.uid()
  GROUP BY uw.entity_type
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create watchlist notification
CREATE OR REPLACE FUNCTION create_watchlist_notification(
  p_watch_id UUID,
  p_event_type watch_event_type,
  p_event_data JSONB,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_watch RECORD;
  v_notification_id UUID;
  v_event_id UUID;
BEGIN
  -- Get watch details
  SELECT * INTO v_watch
  FROM user_watchlist
  WHERE id = p_watch_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if notification should be sent based on settings
  IF NOT v_watch.is_active THEN
    RETURN NULL;
  END IF;

  -- Create the notification
  SELECT create_notification(
    v_watch.user_id,
    'watchlist_' || p_event_type::TEXT,
    p_title,
    p_message,
    jsonb_build_object(
      'watch_id', p_watch_id,
      'entity_type', v_watch.entity_type,
      'entity_id', v_watch.entity_id,
      'event_type', p_event_type,
      'event_data', p_event_data
    ),
    COALESCE(p_priority, v_watch.priority),
    p_action_url,
    NULL
  ) INTO v_notification_id;

  -- Log the event
  INSERT INTO watchlist_events (
    watch_id,
    event_type,
    event_data,
    notification_sent,
    notification_id
  ) VALUES (
    p_watch_id,
    p_event_type,
    p_event_data,
    true,
    v_notification_id
  ) RETURNING id INTO v_event_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply template to user's watchlist
CREATE OR REPLACE FUNCTION apply_watchlist_template(
  p_template_id UUID,
  p_auto_sync BOOLEAN DEFAULT true
) RETURNS INTEGER AS $$
DECLARE
  v_template RECORD;
  v_entity JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM watchlist_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Record template association
  INSERT INTO user_watchlist_templates (user_id, template_id, auto_sync)
  VALUES (auth.uid(), p_template_id, p_auto_sync)
  ON CONFLICT (user_id, template_id) DO UPDATE SET auto_sync = p_auto_sync;

  -- Add entities from template
  FOR v_entity IN SELECT * FROM jsonb_array_elements(v_template.template_config->'entities')
  LOOP
    INSERT INTO user_watchlist (
      user_id,
      entity_type,
      entity_id,
      custom_label,
      notes,
      priority,
      notify_on_modification,
      notify_on_relationship_change,
      notify_on_deadline,
      notify_on_status_change
    ) VALUES (
      auth.uid(),
      (v_entity->>'entity_type')::watchable_entity_type,
      (v_entity->>'entity_id')::UUID,
      v_entity->>'custom_label',
      v_entity->>'notes',
      COALESCE(v_entity->>'priority', 'medium'),
      COALESCE((v_entity->>'notify_modification')::BOOLEAN, true),
      COALESCE((v_entity->>'notify_relationship')::BOOLEAN, true),
      COALESCE((v_entity->>'notify_deadline')::BOOLEAN, true),
      COALESCE((v_entity->>'notify_status')::BOOLEAN, true)
    )
    ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- User watchlist with entity details (will be extended via Edge Function)
CREATE OR REPLACE VIEW user_watchlist_view AS
SELECT
  uw.id,
  uw.user_id,
  uw.entity_type,
  uw.entity_id,
  uw.custom_label,
  uw.notes,
  uw.priority,
  uw.is_active,
  uw.notify_on_modification,
  uw.notify_on_relationship_change,
  uw.notify_on_deadline,
  uw.notify_on_status_change,
  uw.notify_on_comment,
  uw.notify_on_document,
  uw.deadline_reminder_days,
  uw.created_at,
  uw.updated_at,
  -- Recent events count
  (
    SELECT COUNT(*)
    FROM watchlist_events we
    WHERE we.watch_id = uw.id
    AND we.created_at > NOW() - INTERVAL '7 days'
  ) as recent_events_count
FROM user_watchlist uw;

-- =============================================================================
-- SEED DATA: Default Templates
-- =============================================================================

INSERT INTO watchlist_templates (name_en, name_ar, description_en, description_ar, applicable_roles, is_system_template, template_config)
VALUES
  (
    'Country Analyst Essentials',
    'أساسيات محلل الدول',
    'Essential entities for country analysts including key dossiers and MOUs',
    'الكيانات الأساسية لمحللي الدول بما في ذلك الملفات والاتفاقيات الرئيسية',
    ARRAY['country_analyst', 'senior_analyst'],
    true,
    '{
      "entities": [],
      "notify_settings": {
        "default_priority": "medium",
        "notify_modification": true,
        "notify_relationship": true,
        "notify_deadline": true,
        "deadline_reminder_days": [7, 3, 1]
      }
    }'::jsonb
  ),
  (
    'Policy Officer Watchlist',
    'قائمة مراقبة مسؤول السياسات',
    'Key positions and forums for policy officers to monitor',
    'المواقف والمنتديات الرئيسية لمسؤولي السياسات للمراقبة',
    ARRAY['policy_officer', 'senior_policy_officer'],
    true,
    '{
      "entities": [],
      "notify_settings": {
        "default_priority": "high",
        "notify_modification": true,
        "notify_relationship": true,
        "notify_deadline": true,
        "notify_status": true,
        "deadline_reminder_days": [14, 7, 3, 1]
      }
    }'::jsonb
  ),
  (
    'Intake Officer Priorities',
    'أولويات مسؤول الاستقبال',
    'High-priority commitments and engagements for intake officers',
    'الالتزامات والارتباطات ذات الأولوية العالية لمسؤولي الاستقبال',
    ARRAY['intake_officer', 'senior_intake_officer'],
    true,
    '{
      "entities": [],
      "notify_settings": {
        "default_priority": "high",
        "notify_modification": true,
        "notify_deadline": true,
        "notify_status": true,
        "deadline_reminder_days": [3, 1]
      }
    }'::jsonb
  ),
  (
    'Manager Overview',
    'نظرة عامة للمدير',
    'Comprehensive watchlist for managers overseeing multiple teams',
    'قائمة مراقبة شاملة للمديرين المشرفين على فرق متعددة',
    ARRAY['manager', 'director', 'admin'],
    true,
    '{
      "entities": [],
      "notify_settings": {
        "default_priority": "medium",
        "notify_modification": true,
        "notify_relationship": true,
        "notify_deadline": true,
        "notify_status": true,
        "deadline_reminder_days": [14, 7, 3, 1]
      }
    }'::jsonb
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_watchlist IS 'User personal watchlist for monitoring specific entities';
COMMENT ON TABLE watchlist_templates IS 'Predefined watchlist templates for different roles';
COMMENT ON TABLE user_watchlist_templates IS 'Association between users and applied watchlist templates';
COMMENT ON TABLE watchlist_events IS 'Log of events that triggered watchlist notifications';

COMMENT ON COLUMN user_watchlist.entity_type IS 'Type of entity being watched (person, engagement, etc.)';
COMMENT ON COLUMN user_watchlist.entity_id IS 'UUID of the watched entity';
COMMENT ON COLUMN user_watchlist.custom_label IS 'User-defined label for quick identification';
COMMENT ON COLUMN user_watchlist.deadline_reminder_days IS 'Array of days before deadline to send reminders';

COMMENT ON FUNCTION add_to_watchlist IS 'Add an entity to the current user watchlist';
COMMENT ON FUNCTION remove_from_watchlist IS 'Remove an entity from the current user watchlist';
COMMENT ON FUNCTION bulk_add_to_watchlist IS 'Add multiple entities to watchlist at once';
COMMENT ON FUNCTION create_watchlist_notification IS 'Create a notification for a watchlist event';
