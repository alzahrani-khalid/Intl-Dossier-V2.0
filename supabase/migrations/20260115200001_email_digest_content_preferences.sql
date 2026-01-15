-- =====================================================================================
-- Migration: Email Digest Content Preferences
-- Description: Extends email_notification_preferences with content selection for digests
--              Allows users to configure what activity and entities appear in their digests
-- Author: Claude Code
-- Date: 2026-01-15
-- Feature: email-digest-configuration
-- =====================================================================================

-- ===========================================
-- EXTEND EMAIL NOTIFICATION PREFERENCES
-- ===========================================

-- Add digest content columns to email_notification_preferences
ALTER TABLE email_notification_preferences
ADD COLUMN IF NOT EXISTS digest_include_watchlist BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_deadlines BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_unresolved_tickets BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_assignments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_commitments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_mentions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_include_calendar BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_deadline_lookahead_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS digest_max_items_per_section INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS weekly_digest_time TEXT DEFAULT '08:00';

-- Add comments
COMMENT ON COLUMN email_notification_preferences.digest_include_watchlist IS 'Include activity from watched entities in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_deadlines IS 'Include upcoming deadlines in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_unresolved_tickets IS 'Include unresolved intake tickets in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_assignments IS 'Include pending assignments in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_commitments IS 'Include pending commitments in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_mentions IS 'Include recent @mentions in digest';
COMMENT ON COLUMN email_notification_preferences.digest_include_calendar IS 'Include upcoming calendar events in digest';
COMMENT ON COLUMN email_notification_preferences.digest_deadline_lookahead_days IS 'Days to look ahead for deadlines (default 7)';
COMMENT ON COLUMN email_notification_preferences.digest_max_items_per_section IS 'Maximum items per digest section (default 10)';
COMMENT ON COLUMN email_notification_preferences.weekly_digest_time IS 'Time to send weekly digest (HH:MM format)';

-- ===========================================
-- CREATE DIGEST CONTENT SUMMARY VIEW
-- ===========================================

-- View to aggregate digest content for a user
CREATE OR REPLACE VIEW user_digest_content_summary AS
WITH user_prefs AS (
  SELECT
    enp.user_id,
    enp.daily_digest_enabled,
    enp.weekly_digest_enabled,
    enp.digest_include_watchlist,
    enp.digest_include_deadlines,
    enp.digest_include_unresolved_tickets,
    enp.digest_include_assignments,
    enp.digest_include_commitments,
    enp.digest_include_mentions,
    enp.digest_include_calendar,
    enp.digest_deadline_lookahead_days,
    enp.digest_max_items_per_section
  FROM email_notification_preferences enp
  WHERE enp.email_notifications_enabled = true
),
watchlist_counts AS (
  SELECT
    uw.user_id,
    COUNT(*) FILTER (WHERE uw.is_active = true) as active_watches,
    COUNT(*) FILTER (WHERE uw.priority IN ('high', 'urgent')) as priority_watches
  FROM user_watchlist uw
  GROUP BY uw.user_id
),
unread_notifications AS (
  SELECT
    n.user_id,
    COUNT(*) as unread_count,
    COUNT(*) FILTER (WHERE n.priority = 'urgent') as urgent_count
  FROM notifications n
  WHERE n.read = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  GROUP BY n.user_id
)
SELECT
  up.user_id,
  up.daily_digest_enabled,
  up.weekly_digest_enabled,
  COALESCE(wc.active_watches, 0) as watched_entities_count,
  COALESCE(wc.priority_watches, 0) as priority_watches_count,
  COALESCE(un.unread_count, 0) as unread_notifications_count,
  COALESCE(un.urgent_count, 0) as urgent_notifications_count,
  up.digest_include_watchlist,
  up.digest_include_deadlines,
  up.digest_include_unresolved_tickets,
  up.digest_include_assignments,
  up.digest_include_commitments,
  up.digest_include_mentions,
  up.digest_include_calendar,
  up.digest_deadline_lookahead_days
FROM user_prefs up
LEFT JOIN watchlist_counts wc ON wc.user_id = up.user_id
LEFT JOIN unread_notifications un ON un.user_id = up.user_id;

-- ===========================================
-- HELPER FUNCTION: Get Digest Content
-- ===========================================

-- Function to get personalized digest content for a user
CREATE OR REPLACE FUNCTION get_user_digest_content(
  p_user_id UUID,
  p_digest_type TEXT DEFAULT 'daily'
)
RETURNS JSONB AS $$
DECLARE
  v_prefs RECORD;
  v_result JSONB := '{}'::jsonb;
  v_cutoff_date TIMESTAMPTZ;
  v_deadline_cutoff TIMESTAMPTZ;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM email_notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Set cutoff based on digest type
  IF p_digest_type = 'daily' THEN
    v_cutoff_date := NOW() - INTERVAL '1 day';
  ELSE
    v_cutoff_date := NOW() - INTERVAL '7 days';
  END IF;

  v_deadline_cutoff := NOW() + (v_prefs.digest_deadline_lookahead_days || ' days')::INTERVAL;

  -- Get watchlist activity
  IF v_prefs.digest_include_watchlist THEN
    SELECT jsonb_build_object(
      'items', COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb),
      'total_count', COUNT(*)
    ) INTO v_result
    FROM (
      SELECT
        uw.entity_type,
        uw.entity_id,
        uw.custom_label,
        uw.priority,
        (
          SELECT COUNT(*)
          FROM watchlist_events we
          WHERE we.watch_id = uw.id
            AND we.created_at > v_cutoff_date
        ) as recent_activity_count
      FROM user_watchlist uw
      WHERE uw.user_id = p_user_id
        AND uw.is_active = true
      ORDER BY uw.priority DESC, uw.created_at DESC
      LIMIT v_prefs.digest_max_items_per_section
    ) w;

    v_result := jsonb_set(v_result, '{watchlist}', COALESCE(v_result, '{}'::jsonb));
  END IF;

  -- Get unread notifications grouped by category
  SELECT jsonb_build_object(
    'items', COALESCE(jsonb_agg(row_to_json(n)), '[]'::jsonb),
    'total_count', COUNT(*)
  ) INTO v_result
  FROM (
    SELECT
      category,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
      MAX(title) as latest_title
    FROM notifications
    WHERE user_id = p_user_id
      AND read = false
      AND created_at > v_cutoff_date
    GROUP BY category
    ORDER BY COUNT(*) DESC
  ) n;

  v_result := jsonb_set(v_result, '{notifications}', COALESCE(v_result, '{}'::jsonb));

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- SEED DEFAULT PREFERENCES FOR EXISTING USERS
-- ===========================================

-- Update existing preferences with new defaults (only if columns were just added)
UPDATE email_notification_preferences
SET
  digest_include_watchlist = COALESCE(digest_include_watchlist, true),
  digest_include_deadlines = COALESCE(digest_include_deadlines, true),
  digest_include_unresolved_tickets = COALESCE(digest_include_unresolved_tickets, true),
  digest_include_assignments = COALESCE(digest_include_assignments, true),
  digest_include_commitments = COALESCE(digest_include_commitments, true),
  digest_include_mentions = COALESCE(digest_include_mentions, true),
  digest_include_calendar = COALESCE(digest_include_calendar, true),
  digest_deadline_lookahead_days = COALESCE(digest_deadline_lookahead_days, 7),
  digest_max_items_per_section = COALESCE(digest_max_items_per_section, 10),
  weekly_digest_time = COALESCE(weekly_digest_time, '08:00')
WHERE digest_include_watchlist IS NULL;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON VIEW user_digest_content_summary IS 'Summary view of digest-related content counts for each user';
COMMENT ON FUNCTION get_user_digest_content IS 'Get personalized digest content for a user based on their preferences';
